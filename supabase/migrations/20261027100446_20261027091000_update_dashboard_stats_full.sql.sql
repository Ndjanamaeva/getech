/*
# Mise à jour du tableau de bord — métriques complètes

## Contexte
La fonction get_dashboard_stats ne couvre pas les nouveaux statuts (DEVIS ENVOYÉ)
ni les métriques financières post-vente (paiements, livraisons).

## Changements
Remplace get_dashboard_stats pour ajouter :
- quote_sent_quotes : demandes avec devis envoyé.
- accepted_quotes / refused_quotes : demandes acceptées / refusées.
- paid_amount : somme des payment_amount des ventes validées.
- pending_payments : ventes validées avec payment_status EN ATTENTE.
- pending_deliveries : ventes validées avec delivery_status EN ATTENTE.

Aucune modification de schéma, de policy ni de grant. EXECUTE révoqué de
PUBLIC/anon puis accordé à authenticated.
*/

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT jsonb_build_object(
    'total_quotes', (SELECT count(*) FROM public.quote_requests),
    'new_quotes', (SELECT count(*) FROM public.quote_requests WHERE status = 'NOUVELLE'),
    'negotiation_quotes', (SELECT count(*) FROM public.quote_requests WHERE status = 'EN NÉGOCIATION'),
    'quote_sent_quotes', (SELECT count(*) FROM public.quote_requests WHERE status = 'DEVIS ENVOYÉ'),
    'accepted_quotes', (SELECT count(*) FROM public.quote_requests WHERE status = 'ACCEPTÉE'),
    'refused_quotes', (SELECT count(*) FROM public.quote_requests WHERE status = 'REFUSÉE'),
    'active_products', (SELECT count(*) FROM public.products WHERE is_active = true AND is_archived = false),
    'unavailable_products', (SELECT count(*) FROM public.products WHERE is_active = true AND is_archived = false AND stock_quantity <= 0),
    'low_stock_products', (SELECT count(*) FROM public.products WHERE is_active = true AND is_archived = false AND stock_quantity > 0 AND stock_quantity <= low_stock_threshold),
    'validated_sales', (SELECT count(*) FROM public.sales WHERE status = 'VALIDÉE'),
    'revenue', (SELECT coalesce(sum(total_amount), 0) FROM public.sales WHERE status = 'VALIDÉE'),
    'paid_amount', (SELECT coalesce(sum(payment_amount), 0) FROM public.sales WHERE status = 'VALIDÉE'),
    'pending_payments', (SELECT count(*) FROM public.sales WHERE status = 'VALIDÉE' AND payment_status = 'EN ATTENTE'),
    'pending_deliveries', (SELECT count(*) FROM public.sales WHERE status = 'VALIDÉE' AND delivery_status = 'EN ATTENTE')
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;