import { wcFetchRaw } from './client';
import type { WCCustomer, CustomerListParams } from '@/types/woocommerce';

function buildCustomerParams(params: CustomerListParams) {
  return {
    page: params.page ?? 1,
    per_page: params.per_page ?? 20,
    search: params.search || undefined,
    role: params.role || 'all',
    orderby: params.orderby ?? 'registered_date',
    order: params.order ?? 'desc',
  };
}

export async function getCustomersWithMeta(params: CustomerListParams = {}): Promise<{
  customers: WCCustomer[];
  total: number;
  totalPages: number;
}> {
  const response = await wcFetchRaw('/customers', { params: buildCustomerParams(params) });
  const customers = (await response.json()) as WCCustomer[];
  const total = parseInt(response.headers.get('X-WP-Total') ?? '0', 10);
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') ?? '1', 10);
  return { customers, total, totalPages };
}
