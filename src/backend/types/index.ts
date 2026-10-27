export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  reference: string | null;
  slug: string;
  short_description: string | null;
  long_description: string | null;
  image_url: string | null;
  additional_images: string[] | null;
  unit_price: number;
  currency: string;
  show_public_price: boolean;
  is_active: boolean;
  is_archived: boolean;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
};

export type ProductWithCategory = Product & {
  categories: Pick<Category, 'id' | 'name' | 'slug'> | null;
};

export type QuoteStatus =
  | 'NOUVELLE'
  | 'CONTACTÉE'
  | 'EN NÉGOCIATION'
  | 'DEVIS ENVOYÉ'
  | 'ACCEPTÉE'
  | 'REFUSÉE'
  | 'ANNULÉE';

export type QuoteRequest = {
  id: string;
  reference: string;
  product_id: string;
  quantity: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  address: string;
  city: string | null;
  country: string;
  message: string | null;
  consent: boolean;
  status: QuoteStatus;
  negotiated_amount: number | null;
  commercial_notes: string | null;
  assigned_to: string | null;
  contacted_at: string | null;
  negotiation_started_at: string | null;
  quote_sent_at: string | null;
  accepted_at: string | null;
  refused_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteRequestWithProduct = QuoteRequest & {
  products: Pick<Product, 'id' | 'name' | 'reference'> | null;
};

export type QuoteHistoryEntry = {
  id: string;
  quote_request_id: string;
  previous_status: QuoteStatus | null;
  new_status: QuoteStatus;
  note: string | null;
  changed_by: string | null;
  created_at: string;
};

export type SaleStatus = 'VALIDÉE' | 'ANNULÉE';
export type PaymentStatus = 'EN ATTENTE' | 'PAYÉ' | 'PARTIEL' | 'NON REQUIS';
export type DeliveryStatus = 'EN ATTENTE' | 'EXPÉDIÉE' | 'LIVRÉE' | 'RETOUR';
export type OrderStatus = 'EN COURS' | 'FINALISÉE' | 'ANNULÉE';

export type Sale = {
  id: string;
  reference: string;
  quote_request_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  total_amount: number;
  currency: string;
  status: SaleStatus;
  validated_by: string | null;
  validated_at: string | null;
  payment_status: PaymentStatus;
  payment_method: string | null;
  payment_amount: number;
  payment_date: string | null;
  delivery_status: DeliveryStatus;
  delivery_date: string | null;
  tracking_reference: string | null;
  delivery_address: string | null;
  order_status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  product_name_snapshot: string;
  product_reference_snapshot: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
};

export type SaleWithItems = Sale & {
  sale_items: SaleItem[];
};

export type InventoryMovement = {
  id: string;
  product_id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  reason: string | null;
  reference_type: string | null;
  reference_id: string | null;
  performed_by: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  type: 'quote' | 'sale' | 'stock' | 'system';
  title: string;
  message: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
};

export type DashboardStats = {
  total_quotes: number;
  new_quotes: number;
  negotiation_quotes: number;
  quote_sent_quotes: number;
  accepted_quotes: number;
  refused_quotes: number;
  active_products: number;
  unavailable_products: number;
  low_stock_products: number;
  validated_sales: number;
  revenue: number;
  paid_amount: number;
  pending_payments: number;
  pending_deliveries: number;
};

export type Profile = {
  id: string;
  role: 'user' | 'admin' | 'superadmin';
  full_name: string | null;
  created_at: string;
  updated_at: string;
};
