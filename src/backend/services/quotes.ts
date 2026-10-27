import { supabase } from '@/backend/lib/supabase';
import type { QuoteFormValues } from '@/backend/lib/validations';
import type { QuoteRequest, QuoteRequestWithProduct, QuoteHistoryEntry, QuoteStatus } from '@/backend/types';

export async function submitQuote(values: QuoteFormValues): Promise<QuoteRequest> {
  const { data, error } = await supabase.rpc('submit_quote', {
    p_product_id: values.product_id,
    p_quantity: values.quantity,
    p_first_name: values.first_name,
    p_last_name: values.last_name,
    p_email: values.email || null,
    p_phone: values.phone,
    p_address: values.address,
    p_city: values.city || null,
    p_country: values.country,
    p_message: values.message || null,
  });
  if (error) throw error;
  return data as QuoteRequest;
}

export async function fetchQuotesAdmin(filters?: {
  status?: QuoteStatus | 'all';
  search?: string;
  productId?: string;
}): Promise<QuoteRequestWithProduct[]> {
  let query = supabase
    .from('quote_requests')
    .select('*, products(id, name, reference)')
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.productId) {
    query = query.eq('product_id', filters.productId);
  }
  if (filters?.search) {
    query = query.or(
      `reference.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
    );
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as QuoteRequestWithProduct[];
}

export async function fetchQuoteById(id: string): Promise<QuoteRequestWithProduct | null> {
  const { data, error } = await supabase
    .from('quote_requests')
    .select('*, products(id, name, reference)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as QuoteRequestWithProduct | null;
}

export async function fetchQuoteHistory(quoteId: string): Promise<QuoteHistoryEntry[]> {
  const { data, error } = await supabase
    .from('quote_request_history')
    .select('*')
    .eq('quote_request_id', quoteId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as QuoteHistoryEntry[];
}

export async function updateQuoteStatus(
  quoteId: string,
  newStatus: QuoteStatus,
  note?: string,
  negotiatedAmount?: number | null,
  commercialNotes?: string | null,
  assignedTo?: string | null
): Promise<QuoteRequest> {
  const { data, error } = await supabase.rpc('update_quote_status', {
    p_quote_id: quoteId,
    p_new_status: newStatus,
    p_note: note ?? null,
    p_negotiated_amount: negotiatedAmount ?? null,
    p_commercial_notes: commercialNotes ?? null,
    p_assigned_to: assignedTo ?? null,
  });
  if (error) throw error;
  return data as QuoteRequest;
}
