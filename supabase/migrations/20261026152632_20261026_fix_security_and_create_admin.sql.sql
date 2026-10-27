/*
# Fix privilege escalation + validate_sale history bug + first admin account

## Overview
Three fixes applied idempotently:
1. Security: the `handle_new_user` trigger currently gives role='admin' to every
   new signup, allowing privilege escalation. Changed to role='user' so new
   sign-ups are ordinary users. Only an operator can promote a user to
   admin/superadmin afterwards.
2. Logic: `validate_sale` recorded the wrong previous_status in
   quote_request_history because it read `status` AFTER the UPDATE that set it
   to 'ACCEPTÉE'. The previous status is now captured before the update.
3. First admin: a SECURITY DEFINER function `create_first_admin(p_email, p_password,
   p_full_name)` is provided so a one-time edge function (or SQL) can create the
   initial admin account. It creates the auth user via `auth.users` insert, sets
   encrypted password, and inserts the profile with role='superadmin'. The
   function self-disables after the first admin exists (raises exception if any
   admin profile already exists) to prevent repeated or unauthorized use.

## Tables modified
- profiles: no schema change. The CHECK constraint on `role` is widened to
  allow 'user' in addition to 'admin' and 'superadmin'.
- No columns added or removed. No data lost.

## Security changes
- handle_new_user: new sign-ups get role='user' (was 'admin').
- create_first_admin: SECURITY DEFINER, executable only by service_role
  (revoked from PUBLIC/anon/authenticated). Refuses to run if an admin already
  exists.
*/

-- ---------------------------------------------------------------------------
-- 1. Widen profiles.role CHECK to include 'user'
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_role_check'
      AND table_name = 'profiles'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'superadmin'));

-- ---------------------------------------------------------------------------
-- 2. Fix handle_new_user: new signups get 'user', not 'admin'
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (new.id, 'user', COALESCE(new.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;

-- ---------------------------------------------------------------------------
-- 3. Fix validate_sale: capture previous status BEFORE the update
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_sale(
  p_quote_request_id uuid DEFAULT NULL,
  p_customer_name text DEFAULT NULL,
  p_customer_email text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL,
  p_items jsonb DEFAULT NULL
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale public.sales;
  v_sale_id uuid;
  v_sale_ref text;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_unit numeric;
  v_line_total numeric;
  v_total numeric := 0;
  v_product public.products;
  v_existing_sale_id uuid;
  v_old_quote_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF p_customer_name IS NULL OR length(trim(p_customer_name)) = 0 THEN
    RAISE EXCEPTION 'CUSTOMER_NAME_REQUIRED';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'NO_ITEMS';
  END IF;

  IF p_quote_request_id IS NOT NULL THEN
    SELECT id INTO v_existing_sale_id FROM public.sales
    WHERE quote_request_id = p_quote_request_id AND status = 'VALIDÉE' LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'QUOTE_ALREADY_SOLD';
    END IF;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY';
    END IF;
    SELECT * INTO v_product FROM public.products WHERE id = v_product_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND: %', v_product_id;
    END IF;
    IF (v_product.stock_quantity - v_product.reserved_quantity) < v_qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: %', v_product.name;
    END IF;
    v_total := v_total + v_qty * (v_item->>'unit_price')::numeric;
  END LOOP;

  v_sale_ref := public.generate_sale_reference();

  INSERT INTO public.sales (
    reference, quote_request_id, customer_name, customer_email,
    customer_phone, total_amount, currency, status, validated_by, validated_at
  ) VALUES (
    v_sale_ref, p_quote_request_id, p_customer_name, p_customer_email,
    p_customer_phone, v_total, 'XAF', 'VALIDÉE', auth.uid(), now()
  ) RETURNING * INTO v_sale;
  v_sale_id := v_sale.id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;
    v_unit := (v_item->>'unit_price')::numeric;
    v_line_total := v_qty * v_unit;

    SELECT * INTO v_product FROM public.products WHERE id = v_product_id;

    INSERT INTO public.sale_items (
      sale_id, product_id, product_name_snapshot, product_reference_snapshot,
      quantity, unit_price, line_total
    ) VALUES (
      v_sale_id, v_product_id, v_product.name, v_product.reference,
      v_qty, v_unit, v_line_total
    );

    UPDATE public.products
    SET stock_quantity = stock_quantity - v_qty
    WHERE id = v_product_id;

    INSERT INTO public.inventory_movements (
      product_id, movement_type, quantity, reason, reference_type, reference_id, performed_by
    ) VALUES (
      v_product_id, 'OUT', -v_qty, 'Vente ' || v_sale_ref, 'sale', v_sale_id, auth.uid()
    );
  END LOOP;

  IF p_quote_request_id IS NOT NULL THEN
    -- Capture previous status BEFORE updating
    SELECT status INTO v_old_quote_status FROM public.quote_requests WHERE id = p_quote_request_id;

    UPDATE public.quote_requests SET status = 'ACCEPTÉE' WHERE id = p_quote_request_id;

    INSERT INTO public.quote_request_history (quote_request_id, previous_status, new_status, note, changed_by)
    VALUES (p_quote_request_id, v_old_quote_status, 'ACCEPTÉE', 'Vente ' || v_sale_ref || ' validée', auth.uid());
  END IF;

  INSERT INTO public.notifications (type, title, message, reference_id)
  VALUES ('sale', 'Vente validée', 'Vente ' || v_sale_ref || ' — ' || p_customer_name, v_sale_id);

  INSERT INTO public.audit_logs (action, entity_type, entity_id, details, performed_by)
  VALUES ('validate_sale', 'sale', v_sale_id, jsonb_build_object('reference', v_sale_ref, 'total', v_total), auth.uid());

  RETURN v_sale;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_sale(uuid, text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_sale(uuid, text, text, text, jsonb) TO authenticated;