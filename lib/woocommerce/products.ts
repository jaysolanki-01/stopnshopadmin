import { wcFetch, wcFetchRaw } from './client';
import type {
  WCProduct,
  WCProductVariation,
  WCCreateProductInput,
  WCUpdateProductInput,
  ProductListParams,
} from '@/types/woocommerce';

function buildProductParams(params: ProductListParams) {
  return {
    page: params.page ?? 1,
    per_page: params.per_page ?? 20,
    search: params.search || undefined,
    status: params.status || undefined,
    category: params.category || undefined,
    orderby: 'date',
    order: 'desc',
  };
}

// Returns products + WooCommerce pagination metadata from response headers
export async function getProductsWithMeta(params: ProductListParams = {}): Promise<{
  products: WCProduct[];
  total: number;
  totalPages: number;
}> {
  const response = await wcFetchRaw('/products', { params: buildProductParams(params) });
  const products = (await response.json()) as WCProduct[];
  const total = parseInt(response.headers.get('X-WP-Total') ?? '0', 10);
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') ?? '1', 10);
  return { products, total, totalPages };
}

export async function getProducts(params: ProductListParams = {}): Promise<WCProduct[]> {
  return wcFetch<WCProduct[]>('/products', { params: buildProductParams(params) });
}

export async function getProduct(id: number): Promise<WCProduct> {
  return wcFetch<WCProduct>(`/products/${id}`);
}

export async function createProduct(data: WCCreateProductInput): Promise<WCProduct> {
  return wcFetch<WCProduct>('/products', { method: 'POST', body: data });
}

export async function updateProduct(id: number, data: WCUpdateProductInput): Promise<WCProduct> {
  return wcFetch<WCProduct>(`/products/${id}`, { method: 'PUT', body: data });
}

// Moves to trash by default — pass force=true to permanently delete
export async function deleteProduct(id: number, force = false): Promise<WCProduct> {
  return wcFetch<WCProduct>(`/products/${id}`, {
    method: 'DELETE',
    params: { force: String(force) },
  });
}

// ─── Variations ────────────────────────────────────────────────────────────────

export async function getVariations(productId: number): Promise<WCProductVariation[]> {
  return wcFetch<WCProductVariation[]>(`/products/${productId}/variations`, {
    params: { per_page: '100' },
  });
}

export async function createVariation(
  productId: number,
  data: Partial<WCProductVariation>,
): Promise<WCProductVariation> {
  return wcFetch<WCProductVariation>(`/products/${productId}/variations`, {
    method: 'POST',
    body: data,
  });
}

export async function updateVariation(
  productId: number,
  variationId: number,
  data: Partial<WCProductVariation>,
): Promise<WCProductVariation> {
  return wcFetch<WCProductVariation>(`/products/${productId}/variations/${variationId}`, {
    method: 'PUT',
    body: data,
  });
}

export async function deleteVariation(
  productId: number,
  variationId: number,
): Promise<WCProductVariation> {
  return wcFetch<WCProductVariation>(`/products/${productId}/variations/${variationId}`, {
    method: 'DELETE',
    params: { force: 'true' },
  });
}
