/*
# GENESYS Cameroon — Business logic RPC functions

Server-enforced, atomic business operations as SECURITY DEFINER functions.
submit_quote is public; all others require admin via is_admin().
*/

-- ---------------------------------------------------------------------------
-- reference generators
-- ---------------------------------------------------------------------------
create or replace function public.generate_quote_reference()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := extract(year from now());
  v_count int;
  v_ref text;
begin
  select count(*) + 1 into v_count
  from public.quote_requests
  where reference like 'DEV-' || v_year || '-%';
  v_ref := 'DEV-' || v_year || '-' || lpad(v_count::text, 6, '0');
  return v_ref;
end;
$$;

revoke execute on function public.generate_quote_reference() from public, anon;
grant execute on function public.generate_quote_reference() to authenticated;

create or replace function public.generate_sale_reference()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := extract(year from now());
  v_count int;
  v_ref text;
begin
  select count(*) + 1 into v_count
  from public.sales
  where reference like 'VEN-' || v_year || '-%';
  v_ref := 'VEN-' || v_year || '-' || lpad(v_count::text, 6, '0');
  return v_ref;
end;
$$;

revoke execute on function public.generate_sale_reference() from public, anon;
grant execute on function public.generate_sale_reference() to authenticated;

-- ---------------------------------------------------------------------------
-- submit_quote (public)
-- ---------------------------------------------------------------------------
create or replace function public.submit_quote(
  p_product_id uuid,
  p_quantity int,
  p_first_name text,
  p_last_name text,
  p_email text default null,
  p_phone text default null,
  p_address text default null,
  p_city text default null,
  p_country text default 'Cameroun',
  p_message text default null
)
returns public.quote_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.quote_requests;
  v_ref text;
  v_product_name text;
begin
  select name into v_product_name from public.products
  where id = p_product_id and is_active = true and is_archived = false;
  if not found then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  if p_first_name is null or length(trim(p_first_name)) = 0 then
    raise exception 'FIRST_NAME_REQUIRED';
  end if;
  if p_last_name is null or length(trim(p_last_name)) = 0 then
    raise exception 'LAST_NAME_REQUIRED';
  end if;
  if p_phone is null or length(trim(p_phone)) = 0 then
    raise exception 'PHONE_REQUIRED';
  end if;
  if p_address is null or length(trim(p_address)) = 0 then
    raise exception 'ADDRESS_REQUIRED';
  end if;

  v_ref := public.generate_quote_reference();

  insert into public.quote_requests (
    reference, product_id, quantity, first_name, last_name, email, phone,
    address, city, country, message, consent, status
  ) values (
    v_ref, p_product_id, p_quantity, p_first_name, p_last_name, p_email,
    p_phone, p_address, p_city, coalesce(p_country, 'Cameroun'), p_message,
    true, 'NOUVELLE'
  ) returning * into v_row;

  insert into public.quote_request_history (quote_request_id, previous_status, new_status, note)
  values (v_row.id, null, 'NOUVELLE', 'Demande créée');

  insert into public.notifications (type, title, message, reference_id)
  values (
    'quote',
    'Nouvelle demande de devis',
    'Demande ' || v_row.reference || ' — ' || p_first_name || ' ' || p_last_name ||
    ' — Produit : ' || coalesce(v_product_name, 'inconnu'),
    v_row.id
  );

  return v_row;
end;
$$;

grant execute on function public.submit_quote(uuid, int, text, text, text, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- update_quote_status (admin)
-- ---------------------------------------------------------------------------
create or replace function public.update_quote_status(
  p_quote_id uuid,
  p_new_status text,
  p_note text default null,
  p_negotiated_amount numeric default null,
  p_commercial_notes text default null
)
returns public.quote_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.quote_requests;
  v_old_status text;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_row from public.quote_requests where id = p_quote_id;
  if not found then
    raise exception 'QUOTE_NOT_FOUND';
  end if;
  v_old_status := v_row.status;

  update public.quote_requests
  set status = p_new_status,
      negotiated_amount = p_negotiated_amount,
      commercial_notes = p_commercial_notes
  where id = p_quote_id
  returning * into v_row;

  insert into public.quote_request_history (quote_request_id, previous_status, new_status, note, changed_by)
  values (p_quote_id, v_old_status, p_new_status, p_note, auth.uid());

  insert into public.audit_logs (action, entity_type, entity_id, details, performed_by)
  values (
    'update_quote_status', 'quote_request', p_quote_id,
    jsonb_build_object('previous', v_old_status, 'new', p_new_status, 'note', p_note),
    auth.uid()
  );

  return v_row;
end;
$$;

revoke execute on function public.update_quote_status(uuid, text, text, numeric, text) from public, anon;
grant execute on function public.update_quote_status(uuid, text, text, numeric, text) to authenticated;

-- ---------------------------------------------------------------------------
-- validate_sale (admin, atomic)
-- ---------------------------------------------------------------------------
create or replace function public.validate_sale(
  p_quote_request_id uuid default null,
  p_customer_name text default null,
  p_customer_email text default null,
  p_customer_phone text default null,
  p_items jsonb default null
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
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
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  if p_customer_name is null or length(trim(p_customer_name)) = 0 then
    raise exception 'CUSTOMER_NAME_REQUIRED';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'NO_ITEMS';
  end if;

  if p_quote_request_id is not null then
    select id into v_existing_sale_id from public.sales
    where quote_request_id = p_quote_request_id and status = 'VALIDÉE' limit 1;
    if found then
      raise exception 'QUOTE_ALREADY_SOLD';
    end if;
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'INVALID_QUANTITY';
    end if;
    select * into v_product from public.products where id = v_product_id;
    if not found then
      raise exception 'PRODUCT_NOT_FOUND: %', v_product_id;
    end if;
    if (v_product.stock_quantity - v_product.reserved_quantity) < v_qty then
      raise exception 'INSUFFICIENT_STOCK: %', v_product.name;
    end if;
    v_total := v_total + v_qty * (v_item->>'unit_price')::numeric;
  end loop;

  v_sale_ref := public.generate_sale_reference();

  insert into public.sales (
    reference, quote_request_id, customer_name, customer_email,
    customer_phone, total_amount, currency, status, validated_by, validated_at
  ) values (
    v_sale_ref, p_quote_request_id, p_customer_name, p_customer_email,
    p_customer_phone, v_total, 'XAF', 'VALIDÉE', auth.uid(), now()
  ) returning * into v_sale;
  v_sale_id := v_sale.id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;
    v_unit := (v_item->>'unit_price')::numeric;
    v_line_total := v_qty * v_unit;

    select * into v_product from public.products where id = v_product_id;

    insert into public.sale_items (
      sale_id, product_id, product_name_snapshot, product_reference_snapshot,
      quantity, unit_price, line_total
    ) values (
      v_sale_id, v_product_id, v_product.name, v_product.reference,
      v_qty, v_unit, v_line_total
    );

    update public.products
    set stock_quantity = stock_quantity - v_qty
    where id = v_product_id;

    insert into public.inventory_movements (
      product_id, movement_type, quantity, reason, reference_type, reference_id, performed_by
    ) values (
      v_product_id, 'OUT', -v_qty, 'Vente ' || v_sale_ref, 'sale', v_sale_id, auth.uid()
    );
  end loop;

  if p_quote_request_id is not null then
    update public.quote_requests set status = 'ACCEPTÉE' where id = p_quote_request_id;
    insert into public.quote_request_history (quote_request_id, previous_status, new_status, note, changed_by)
    select id, status, 'ACCEPTÉE', 'Vente ' || v_sale_ref || ' validée', auth.uid()
    from public.quote_requests where id = p_quote_request_id;
  end if;

  insert into public.notifications (type, title, message, reference_id)
  values ('sale', 'Vente validée', 'Vente ' || v_sale_ref || ' — ' || p_customer_name, v_sale_id);

  insert into public.audit_logs (action, entity_type, entity_id, details, performed_by)
  values ('validate_sale', 'sale', v_sale_id, jsonb_build_object('reference', v_sale_ref, 'total', v_total), auth.uid());

  return v_sale;
end;
$$;

revoke execute on function public.validate_sale(uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.validate_sale(uuid, text, text, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- cancel_sale (admin, returns stock once)
-- ---------------------------------------------------------------------------
create or replace function public.cancel_sale(
  p_sale_id uuid,
  p_reason text default null
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales;
  v_item record;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_sale from public.sales where id = p_sale_id;
  if not found then
    raise exception 'SALE_NOT_FOUND';
  end if;
  if v_sale.status != 'VALIDÉE' then
    raise exception 'SALE_NOT_CANCELLABLE';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'REASON_REQUIRED';
  end if;

  update public.sales set status = 'ANNULÉE' where id = p_sale_id returning * into v_sale;

  for v_item in select * from public.sale_items where sale_id = p_sale_id
  loop
    update public.products
    set stock_quantity = stock_quantity + v_item.quantity
    where id = v_item.product_id;

    insert into public.inventory_movements (
      product_id, movement_type, quantity, reason, reference_type, reference_id, performed_by
    ) values (
      v_item.product_id, 'RETURN', v_item.quantity,
      'Annulation vente ' || v_sale.reference || ' : ' || p_reason,
      'sale', p_sale_id, auth.uid()
    );
  end loop;

  insert into public.audit_logs (action, entity_type, entity_id, details, performed_by)
  values ('cancel_sale', 'sale', p_sale_id, jsonb_build_object('reason', p_reason), auth.uid());

  return v_sale;
end;
$$;

revoke execute on function public.cancel_sale(uuid, text) from public, anon;
grant execute on function public.cancel_sale(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- adjust_stock (admin)
-- ---------------------------------------------------------------------------
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_new_quantity int,
  p_reason text default null
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
  v_delta int;
  v_old int;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_new_quantity < 0 then
    raise exception 'NEGATIVE_STOCK';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'REASON_REQUIRED';
  end if;

  select * into v_product from public.products where id = p_product_id;
  if not found then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;
  v_old := v_product.stock_quantity;
  v_delta := p_new_quantity - v_old;

  update public.products set stock_quantity = p_new_quantity where id = p_product_id
  returning * into v_product;

  insert into public.inventory_movements (
    product_id, movement_type, quantity, reason, reference_type, reference_id, performed_by
  ) values (
    p_product_id, 'ADJUSTMENT', v_delta, p_reason, 'adjustment', p_product_id, auth.uid()
  );

  insert into public.audit_logs (action, entity_type, entity_id, details, performed_by)
  values ('adjust_stock', 'product', p_product_id,
    jsonb_build_object('old', v_old, 'new', p_new_quantity, 'delta', v_delta, 'reason', p_reason),
    auth.uid());

  return v_product;
end;
$$;

revoke execute on function public.adjust_stock(uuid, int, text) from public, anon;
grant execute on function public.adjust_stock(uuid, int, text) to authenticated;

-- ---------------------------------------------------------------------------
-- add_stock (admin)
-- ---------------------------------------------------------------------------
create or replace function public.add_stock(
  p_product_id uuid,
  p_quantity int,
  p_reason text default null
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'REASON_REQUIRED';
  end if;

  update public.products
  set stock_quantity = stock_quantity + p_quantity
  where id = p_product_id
  returning * into v_product;

  if not found then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  insert into public.inventory_movements (
    product_id, movement_type, quantity, reason, reference_type, reference_id, performed_by
  ) values (
    p_product_id, 'IN', p_quantity, p_reason, 'adjustment', p_product_id, auth.uid()
  );

  insert into public.audit_logs (action, entity_type, entity_id, details, performed_by)
  values ('add_stock', 'product', p_product_id,
    jsonb_build_object('quantity', p_quantity, 'reason', p_reason), auth.uid());

  return v_product;
end;
$$;

revoke execute on function public.add_stock(uuid, int, text) from public, anon;
grant execute on function public.add_stock(uuid, int, text) to authenticated;

-- ---------------------------------------------------------------------------
-- get_dashboard_stats (admin)
-- ---------------------------------------------------------------------------
create or replace function public.get_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select jsonb_build_object(
    'total_quotes', (select count(*) from public.quote_requests),
    'new_quotes', (select count(*) from public.quote_requests where status = 'NOUVELLE'),
    'negotiation_quotes', (select count(*) from public.quote_requests where status = 'EN NÉGOCIATION'),
    'active_products', (select count(*) from public.products where is_active = true and is_archived = false),
    'unavailable_products', (select count(*) from public.products where is_active = true and is_archived = false and stock_quantity <= 0),
    'low_stock_products', (select count(*) from public.products where is_active = true and is_archived = false and stock_quantity > 0 and stock_quantity <= low_stock_threshold),
    'validated_sales', (select count(*) from public.sales where status = 'VALIDÉE'),
    'revenue', (select coalesce(sum(total_amount), 0) from public.sales where status = 'VALIDÉE')
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.get_dashboard_stats() from public, anon;
grant execute on function public.get_dashboard_stats() to authenticated;