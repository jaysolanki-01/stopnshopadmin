// WooCommerce REST API types — server-side safe, no secrets

export interface WCImage {
  id: number;
  src: string;
  name: string;
  alt: string;
  date_created?: string;
}

export interface WCCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  count: number;
}

export interface WCProductCategory {
  id: number;
  name: string;
  slug: string;
}

export type WCProductStatus = 'publish' | 'draft' | 'pending' | 'private' | 'trash';

export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  status: WCProductStatus;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  description: string;
  short_description: string;
  categories: WCProductCategory[];
  images: WCImage[];
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  backorders: 'no' | 'notify' | 'yes';
  low_stock_amount: number | null;
  sold_individually: boolean;
  date_created: string;
  date_modified: string;
}

export interface WCCreateProductInput {
  name: string;
  status: 'publish' | 'draft';
  sku?: string;
  regular_price?: string;
  sale_price?: string;
  description?: string;
  short_description?: string;
  categories?: Array<{ id: number }>;
  images?: Array<{ id?: number; src?: string; alt?: string }>;
  manage_stock?: boolean;
  stock_quantity?: number | null;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  backorders?: 'no' | 'notify' | 'yes';
  low_stock_amount?: number | null;
  sold_individually?: boolean;
}

export type WCUpdateProductInput = Partial<WCCreateProductInput>;

export interface WCMediaItem {
  id: number;
  source_url: string;
  media_details: {
    width: number;
    height: number;
    file: string;
  };
  alt_text: string;
  title: { rendered: string };
}

// Normalized API response shapes used by our own /api/* routes
export interface AppError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface AppSuccess<T> {
  success: true;
  data: T;
}

export type AppResponse<T> = AppSuccess<T> | AppError;

// Query params for GET /api/products
export interface ProductListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  category?: string;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type WCOrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed'
  | 'trash';

export interface WCOrderBilling {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export interface WCOrderShipping {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
}

export interface WCOrderLineItem {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  subtotal: string;
  total: string;
  price: number;
  sku: string;
  image: { id: number; src: string } | null;
}

export interface WCOrder {
  id: number;
  number: string;
  status: WCOrderStatus;
  currency: string;
  total: string;
  subtotal: string;
  total_tax: string;
  discount_total: string;
  shipping_total: string;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  date_created: string;
  date_modified: string;
  date_completed: string | null;
  date_paid: string | null;
  billing: WCOrderBilling;
  shipping: WCOrderShipping;
  line_items: WCOrderLineItem[];
  customer_id: number;
  customer_note: string;
}

export interface OrderListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
}

// ─── Customers ──────────────────────────────────────────────────────────────

export interface WCCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  role: string;
  billing: WCOrderBilling;
  shipping: WCOrderShipping;
  is_paying_customer: boolean;
  avatar_url: string;
  date_created: string;
  date_modified: string;
  orders_count: number;
  total_spent: string;
}

export interface CustomerListParams {
  page?: number;
  per_page?: number;
  search?: string;
  role?: string;
  orderby?: string;
  order?: string;
}

// Client-side image upload state (lives in the browser, never sent to server as-is)
export interface UploadedImage {
  localId: string;          // temporary browser-side ID
  previewUrl: string;       // blob: URL (before upload) or WP src (after)
  filename: string;
  status: 'uploading' | 'done' | 'error';
  alt: string;
  mediaId?: number;         // WordPress media library ID (set after upload)
  src?: string;             // WordPress CDN URL (set after upload)
  error?: string;
  _file?: File;             // kept for retry; never serialised to the API
}

// Response from /api/media
export interface MediaUploadResult {
  id: number;
  src: string;
  alt: string;
}
