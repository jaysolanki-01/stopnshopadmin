import { wcFetch, wcFetchRaw } from './client';
import type { WCOrder, WCOrderStatus, OrderListParams } from '@/types/woocommerce';

function buildOrderParams(params: OrderListParams) {
  return {
    page: params.page ?? 1,
    per_page: params.per_page ?? 20,
    search: params.search || undefined,
    status: params.status || undefined,
    orderby: 'date',
    order: 'desc',
  };
}

export async function getOrdersWithMeta(params: OrderListParams = {}): Promise<{
  orders: WCOrder[];
  total: number;
  totalPages: number;
}> {
  const response = await wcFetchRaw('/orders', { params: buildOrderParams(params) });
  const orders = (await response.json()) as WCOrder[];
  const total = parseInt(response.headers.get('X-WP-Total') ?? '0', 10);
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') ?? '1', 10);
  return { orders, total, totalPages };
}

export async function getOrdersByCustomer(customerId: number): Promise<WCOrder[]> {
  const response = await wcFetchRaw('/orders', {
    params: { customer: customerId, per_page: 20, orderby: 'date', order: 'desc' },
  });
  return (await response.json()) as WCOrder[];
}

export async function updateOrderStatus(id: number, status: WCOrderStatus): Promise<WCOrder> {
  return wcFetch<WCOrder>(`/orders/${id}`, { method: 'PUT', body: { status } });
}
