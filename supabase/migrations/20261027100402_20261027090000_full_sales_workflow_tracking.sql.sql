/*
# Finalisation du suivi commercial complet

## Contexte
Le cycle commercial actuel s'arrête à NOUVELLE → CONTACTÉE → EN NÉGOCIATION →
ACCEPTÉE/REFUSÉE/ANNULÉE. Il manque l'étape « devis envoyé » et le suivi post-
vente (paiement, livraison, statut de commande). Cette migration complète le
schéma sans modifier les colonnes existantes ni perdre de données.

## Changements

### 1. quote_requests — étape « devis envoyé » + suivi commercial
- Étend le CHECK status pour ajouter 'DEVIS ENVOYÉ' entre EN NÉGOCIATION et
  ACCEPTÉE/REFUSÉE.
- Ajoute `assigned_to` (uuid, nullable) : responsable commercial assigné.
- Ajoute `quote_sent_at` (timestamptz, nullable) : date d'envoi du devis.
- Ajoute `contacted_at` (timestamptz, nullable) : date de première prise de contact.
- Ajoute `negotiation_started_at` (timestamptz, nullable) : date d'entrée en négociation.
- Ajoute `accepted_at` / `refused_at` (timestamptz, nullable) : dates de décision.

### 2. sales — suivi paiement, livraison, commande
- Ajoute `payment_status` (text, default 'EN ATTENTE') : EN ATTENTE / PAYÉ /
  PARTIEL / NON REQUIS.
- Ajoute `payment_method` (text, nullable) : espèces / virement / chèque / mobile.
- Ajoute `payment_amount` (numeric, default 0) : montant déjà payé.
- Ajoute `payment_date` (timestamptz, nullable).
- Ajoute `delivery_status` (text, default 'EN ATTENTE') : EN ATTENTE / EXPÉDIÉE /
  LIVRÉE / RETOUR.
- Ajoute `delivery_date` (timestamptz, nullable).
- Ajoute `tracking_reference` (text, nullable).
- Ajoute `delivery_address` (text, nullable).
- Ajoute `order_status` (text, default 'EN COURS') : EN COURS / FINALISÉE /
  ANNULÉE (distinct de `status` qui reste VALIDÉE/ANNULÉE pour la cohérence
  historique du stock).
- Ajoute `notes` (text, nullable) : notes internes de la vente.
- Ajoute des CHECK constraints sur payment_status, delivery_status, order_status.

### 3. Index
- Index sur quote_requests.status, quote_requests.assigned_to.
- Index sur sales.payment_status, sales.delivery_status, sales.order_status.

### 4. RLS / grants
- Aucune nouvelle table. Les colonnes sont couvertes par les grants et policies
  existants (authenticated admin via is_admin()). Les grants sur sales/quote_requests
  existent déjà (SELECT, INSERT, UPDATE, DELETE pour authenticated).
- Aucune nouvelle policy requise : les politiques is_admin() existantes s'appliquent
  aux nouvelles colonnes automatiquement.

### 5. Fonction update_sale_payment (admin)
- RPC SECURITY DEFINER pour mettre à jour payment_status, payment_method,
  payment_amount, payment_date, notes. Vérifie is_admin(). Empêche la mise à jour
  d'une vente ANNULÉE.

### 6. Fonction update_sale_delivery (admin)
- RPC SECURITY DEFINER pour delivery_status, delivery_date, tracking_reference,
  delivery_address, notes. Vérifie is_admin(). Empêche la mise à jour d'une vente
  ANNULÉE.

### 7. Fonction update_sale_order_status (admin)
- RPC SECURITY DEFINER pour order_status, notes. Vérifie is_admin(). Empêche la
  mise à jour d'une vente ANNULÉE.

### 8. Mise à jour update_quote_status
- Remplace la fonction pour horodater automatiquement les étapes
  (contacted_at, negotiation_started_at, quote_sent_at, accepted_at, refused_at)
  lors des transitions de statut. Préserve le comportement existant (historique,
  audit, negotiated_amount, commercial_notes).
*/

-- ---------------------------------------------------------------------------
-- 1. quote_requests : nouvelle étape + colonnes de suivi
-- ---------------------------------------------------------------------------
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS negotiation_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS quote_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS refused_at timestamptz;

ALTER TABLE public.quote_requests DROP CONSTRAINT IF EXISTS quote_requests_status_check;
ALTER TABLE public.quote_requests ADD CONSTRAINT quote_requests_status_check
  CHECK (status = ANY (ARRAY['NOUVELLE'::text, 'CONTACTÉE'::text, 'EN NÉGOCIATION'::text, 'DEVIS ENVOYÉ'::text, 'ACCEPTÉE'::text, 'REFUSÉE'::text, 'ANNULÉE'::text]));

-- ---------------------------------------------------------------------------
-- 2. sales : suivi paiement, livraison, commande
-- ---------------------------------------------------------------------------
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'EN ATTENTE',
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_date timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'EN ATTENTE',
  ADD COLUMN IF NOT EXISTS delivery_date timestamptz,
  ADD COLUMN IF NOT EXISTS tracking_reference text,
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS order_status text NOT NULL DEFAULT 'EN COURS',
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_payment_status_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_payment_status_check
  CHECK (payment_status = ANY (ARRAY['EN ATTENTE'::text, 'PAYÉ'::text, 'PARTIEL'::text, 'NON REQUIS'::text]));

ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_delivery_status_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_delivery_status_check
  CHECK (delivery_status = ANY (ARRAY['EN ATTENTE'::text, 'EXPÉDIÉE'::text, 'LIVRÉE'::text, 'RETOUR'::text]));

ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_order_status_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_order_status_check
  CHECK (order_status = ANY (ARRAY['EN COURS'::text, 'FINALISÉE'::text, 'ANNULÉE'::text]));

-- ---------------------------------------------------------------------------
-- 3. Index
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON public.quote_requests (status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_assigned_to ON public.quote_requests (assigned_to);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON public.sales (payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_delivery_status ON public.sales (delivery_status);
CREATE INDEX IF NOT EXISTS idx_sales_order_status ON public.sales (order_status);

-- ---------------------------------------------------------------------------
-- 5. update_sale_payment (admin)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_sale_payment(
  p_sale_id uuid,
  p_payment_status text,
  p_payment_method text DEFAULT null,
  p_payment_amount numeric DEFAULT null,
  p_payment_date timestamptz DEFAULT null,
  p_notes text DEFAULT null
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale public.sales;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT * INTO v_sale FROM public.sales WHERE id = p_sale_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SALE_NOT_FOUND';
  END IF;
  IF v_sale.status = 'ANNULÉE' THEN
    RAISE EXCEPTION 'SALE_CANCELLED';
  END IF;

  IF p_payment_status NOT IN ('EN ATTENTE', 'PAYÉ', 'PARTIEL', 'NON REQUIS') THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_STATUS';
  END IF;

  UPDATE public.sales
  SET payment_status = p_payment_status,
      payment_method = p_payment_method,
      payment_amount = COALESCE(p_payment_amount, payment_amount),
      payment_date = p_payment_date,
      notes = COALESCE(p_notes, notes),
      updated_at = now()
  WHERE id = p_sale_id
  RETURNING * INTO v_sale;

  INSERT INTO public.audit_logs (action, entity_type, entity_id, details, performed_by)
  VALUES ('update_sale_payment', 'sale', p_sale_id,
    jsonb_build_object('payment_status', p_payment_status, 'payment_method', p_payment_method,
      'payment_amount', p_payment_amount, 'payment_date', p_payment_date),
    auth.uid());

  RETURN v_sale;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_sale_payment(uuid, text, text, numeric, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_sale_payment(uuid, text, text, numeric, timestamptz, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. update_sale_delivery (admin)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_sale_delivery(
  p_sale_id uuid,
  p_delivery_status text,
  p_delivery_date timestamptz DEFAULT null,
  p_tracking_reference text DEFAULT null,
  p_delivery_address text DEFAULT null,
  p_notes text DEFAULT null
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale public.sales;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT * INTO v_sale FROM public.sales WHERE id = p_sale_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SALE_NOT_FOUND';
  END IF;
  IF v_sale.status = 'ANNULÉE' THEN
    RAISE EXCEPTION 'SALE_CANCELLED';
  END IF;

  IF p_delivery_status NOT IN ('EN ATTENTE', 'EXPÉDIÉE', 'LIVRÉE', 'RETOUR') THEN
    RAISE EXCEPTION 'INVALID_DELIVERY_STATUS';
  END IF;

  UPDATE public.sales
  SET delivery_status = p_delivery_status,
      delivery_date = p_delivery_date,
      tracking_reference = p_tracking_reference,
      delivery_address = COALESCE(p_delivery_address, delivery_address),
      notes = COALESCE(p_notes, notes),
      updated_at = now()
  WHERE id = p_sale_id
  RETURNING * INTO v_sale;

  INSERT INTO public.audit_logs (action, entity_type, entity_id, details, performed_by)
  VALUES ('update_sale_delivery', 'sale', p_sale_id,
    jsonb_build_object('delivery_status', p_delivery_status, 'tracking_reference', p_tracking_reference,
      'delivery_date', p_delivery_date),
    auth.uid());

  RETURN v_sale;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_sale_delivery(uuid, text, timestamptz, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_sale_delivery(uuid, text, timestamptz, text, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. update_sale_order_status (admin)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_sale_order_status(
  p_sale_id uuid,
  p_order_status text,
  p_notes text DEFAULT null
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale public.sales;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT * INTO v_sale FROM public.sales WHERE id = p_sale_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SALE_NOT_FOUND';
  END IF;
  IF v_sale.status = 'ANNULÉE' THEN
    RAISE EXCEPTION 'SALE_CANCELLED';
  END IF;

  IF p_order_status NOT IN ('EN COURS', 'FINALISÉE', 'ANNULÉE') THEN
    RAISE EXCEPTION 'INVALID_ORDER_STATUS';
  END IF;

  UPDATE public.sales
  SET order_status = p_order_status,
      notes = COALESCE(p_notes, notes),
      updated_at = now()
  WHERE id = p_sale_id
  RETURNING * INTO v_sale;

  INSERT INTO public.audit_logs (action, entity_type, entity_id, details, performed_by)
  VALUES ('update_sale_order_status', 'sale', p_sale_id,
    jsonb_build_object('order_status', p_order_status), auth.uid());

  RETURN v_sale;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_sale_order_status(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_sale_order_status(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. update_quote_status — horodatage automatique des étapes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_quote_status(
  p_quote_id uuid,
  p_new_status text,
  p_note text DEFAULT null,
  p_negotiated_amount numeric DEFAULT null,
  p_commercial_notes text DEFAULT null,
  p_assigned_to uuid DEFAULT null
)
RETURNS public.quote_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.quote_requests;
  v_old_status text;
  v_now timestamptz := now();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT * INTO v_row FROM public.quote_requests WHERE id = p_quote_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_NOT_FOUND';
  END IF;
  v_old_status := v_row.status;

  IF p_new_status NOT IN ('NOUVELLE', 'CONTACTÉE', 'EN NÉGOCIATION', 'DEVIS ENVOYÉ', 'ACCEPTÉE', 'REFUSÉE', 'ANNULÉE') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;

  UPDATE public.quote_requests
  SET status = p_new_status,
      negotiated_amount = p_negotiated_amount,
      commercial_notes = p_commercial_notes,
      assigned_to = COALESCE(p_assigned_to, assigned_to),
      contacted_at = CASE WHEN p_new_status = 'CONTACTÉE' AND contacted_at IS NULL THEN v_now ELSE contacted_at END,
      negotiation_started_at = CASE WHEN p_new_status = 'EN NÉGOCIATION' AND negotiation_started_at IS NULL THEN v_now ELSE negotiation_started_at END,
      quote_sent_at = CASE WHEN p_new_status = 'DEVIS ENVOYÉ' AND quote_sent_at IS NULL THEN v_now ELSE quote_sent_at END,
      accepted_at = CASE WHEN p_new_status = 'ACCEPTÉE' AND accepted_at IS NULL THEN v_now ELSE accepted_at END,
      refused_at = CASE WHEN p_new_status = 'REFUSÉE' AND refused_at IS NULL THEN v_now ELSE refused_at END,
      updated_at = v_now
  WHERE id = p_quote_id
  RETURNING * INTO v_row;

  INSERT INTO public.quote_request_history (quote_request_id, previous_status, new_status, note, changed_by)
  VALUES (p_quote_id, v_old_status, p_new_status, p_note, auth.uid());

  INSERT INTO public.audit_logs (action, entity_type, entity_id, details, performed_by)
  VALUES ('update_quote_status', 'quote_request', p_quote_id,
    jsonb_build_object('previous', v_old_status, 'new', p_new_status, 'note', p_note),
    auth.uid());

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_quote_status(uuid, text, text, numeric, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_quote_status(uuid, text, text, numeric, text, uuid) TO authenticated;