import { supabase } from '@/backend/lib/supabase';
import type { Sale, SaleWithItems, SaleItem, InventoryMovement, Notification, DashboardStats, PaymentStatus, DeliveryStatus, OrderStatus } from '@/backend/types';
import type { SaleItemInput } from '@/backend/lib/validations';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('get_dashboard_stats');
  if (error) throw error;
  return data as DashboardStats;
}

export async function fetchRecentQuotes(limit = 5) {
  const { data, error } = await supabase
    .from('quote_requests')
    .select('*, products(id, name, reference)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchRecentSales(limit = 5): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Sale[];
}

export async function fetchSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Sale[];
}

export async function fetchSaleById(id: string): Promise<SaleWithItems | null> {
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as SaleWithItems | null;
}

export async function validateSale(params: {
  quoteRequestId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: SaleItemInput[];
}): Promise<Sale> {
  const { data, error } = await supabase.rpc('validate_sale', {
    p_quote_request_id: params.quoteRequestId || null,
    p_customer_name: params.customerName,
    p_customer_email: params.customerEmail || null,
    p_customer_phone: params.customerPhone || null,
    p_items: params.items,
  });
  if (error) throw error;
  return data as Sale;
}

export async function cancelSale(saleId: string, reason: string): Promise<Sale> {
  const { data, error } = await supabase.rpc('cancel_sale', {
    p_sale_id: saleId,
    p_reason: reason,
  });
  if (error) throw error;
  return data as Sale;
}

export async function updateSalePayment(params: {
  saleId: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  paymentAmount?: number | null;
  paymentDate?: string | null;
  notes?: string | null;
}): Promise<Sale> {
  const { data, error } = await supabase.rpc('update_sale_payment', {
    p_sale_id: params.saleId,
    p_payment_status: params.paymentStatus,
    p_payment_method: params.paymentMethod ?? null,
    p_payment_amount: params.paymentAmount ?? null,
    p_payment_date: params.paymentDate ?? null,
    p_notes: params.notes ?? null,
  });
  if (error) throw error;
  return data as Sale;
}

export async function updateSaleDelivery(params: {
  saleId: string;
  deliveryStatus: DeliveryStatus;
  deliveryDate?: string | null;
  trackingReference?: string | null;
  deliveryAddress?: string | null;
  notes?: string | null;
}): Promise<Sale> {
  const { data, error } = await supabase.rpc('update_sale_delivery', {
    p_sale_id: params.saleId,
    p_delivery_status: params.deliveryStatus,
    p_delivery_date: params.deliveryDate ?? null,
    p_tracking_reference: params.trackingReference ?? null,
    p_delivery_address: params.deliveryAddress ?? null,
    p_notes: params.notes ?? null,
  });
  if (error) throw error;
  return data as Sale;
}

export async function updateSaleOrderStatus(params: {
  saleId: string;
  orderStatus: OrderStatus;
  notes?: string | null;
}): Promise<Sale> {
  const { data, error } = await supabase.rpc('update_sale_order_status', {
    p_sale_id: params.saleId,
    p_order_status: params.orderStatus,
    p_notes: params.notes ?? null,
  });
  if (error) throw error;
  return data as Sale;
}

export async function getQuoteSale(quoteId: string): Promise<{
  id: string;
  reference: string;
  status: string;
  total_amount: number;
  payment_status: string;
  delivery_status: string;
  order_status: string;
  created_at: string;
} | null> {
  const { data, error } = await supabase.rpc('get_quote_sale', { p_quote_id: quoteId });
  if (error) throw error;
  return data as Awaited<ReturnType<typeof getQuoteSale>>;
}

export async function fetchInventoryMovements(productId?: string): Promise<InventoryMovement[]> {
  let query = supabase
    .from('inventory_movements')
    .select('*')
    .order('created_at', { ascending: false });
  if (productId) query = query.eq('product_id', productId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as InventoryMovement[];
}

export async function adjustStock(productId: string, newQuantity: number, reason: string) {
  const { data, error } = await supabase.rpc('adjust_stock', {
    p_product_id: productId,
    p_new_quantity: newQuantity,
    p_reason: reason,
  });
  if (error) throw error;
  return data;
}

export async function addStock(productId: string, quantity: number, reason: string) {
  const { data, error } = await supabase.rpc('add_stock', {
    p_product_id: productId,
    p_quantity: quantity,
    p_reason: reason,
  });
  if (error) throw error;
  return data;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function fetchSalesChartData(months = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const { data, error } = await supabase
    .from('sales')
    .select('total_amount, currency, status, validated_at, created_at')
    .gte('created_at', start.toISOString())
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchQuotesChartData(months = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const { data, error } = await supabase
    .from('quote_requests')
    .select('status, created_at')
    .gte('created_at', start.toISOString())
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
