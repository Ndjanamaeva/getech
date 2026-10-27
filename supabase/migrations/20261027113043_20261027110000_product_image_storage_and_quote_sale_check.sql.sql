/*
# Product image storage bucket + quote-sale link helper

## 1. Storage bucket for product images
- Creates a `product-images` storage bucket (public read, authenticated write).
- Policies: anon/authenticated can READ; authenticated can UPLOAD/DELETE.

## 2. RPC: get_quote_sale
- Given a quote_request_id, returns the sale record linked to it (if any).
- SECURITY DEFINER, is_admin() check.
- Used by admin UI to detect if a sale already exists for a quote (prevent duplicates).

## 3. Notes
- No data columns changed, no data lost.
- The bucket is public-read so product images display on the public site.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_read" ON storage.objects;
CREATE POLICY "product_images_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_upload" ON storage.objects;
CREATE POLICY "product_images_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_update" ON storage.objects;
CREATE POLICY "product_images_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_delete" ON storage.objects;
CREATE POLICY "product_images_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- RPC to check if a quote already has a linked sale
CREATE OR REPLACE FUNCTION public.get_quote_sale(p_quote_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'PERMISSION_DENIED';
  END IF;

  SELECT jsonb_build_object(
    'id', s.id,
    'reference', s.reference,
    'status', s.status,
    'total_amount', s.total_amount,
    'payment_status', s.payment_status,
    'delivery_status', s.delivery_status,
    'order_status', s.order_status,
    'created_at', s.created_at
  )
  INTO v_result
  FROM sales s
  WHERE s.quote_request_id = p_quote_id
  LIMIT 1;

  RETURN COALESCE(v_result, 'null'::jsonb);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_quote_sale(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_quote_sale(uuid) TO authenticated;
