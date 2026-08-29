import { CustomersTable } from '@/components/customers/CustomersTable';

export const metadata = { title: 'Customers — Product Manager' };

export default function CustomersPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-semibold text-neutral-900">Customers</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">View registered customers and order history</p>
      </div>

      <CustomersTable />
    </div>
  );
}
