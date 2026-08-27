import { OrdersTable } from '@/components/orders/OrdersTable';

export const metadata = { title: 'Orders — Product Manager' };

export default function OrdersPage() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Orders</h1>
        <p className="text-sm text-neutral-500 mt-0.5">View all orders and customer details</p>
      </div>

      <OrdersTable />
    </div>
  );
}
