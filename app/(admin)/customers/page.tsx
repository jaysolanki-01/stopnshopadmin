import { CustomersTable } from '@/components/customers/CustomersTable';

export const metadata = { title: 'Customers — Product Manager' };

export default function CustomersPage() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Customers</h1>
        <p className="text-sm text-neutral-500 mt-0.5">View registered customers and their order history</p>
      </div>

      <CustomersTable />
    </div>
  );
}
