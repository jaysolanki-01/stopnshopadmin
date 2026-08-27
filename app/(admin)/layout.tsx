import { Sidebar } from '@/components/layout/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const wpAdminUrl = `${(process.env.WORDPRESS_URL ?? '').replace(/\/$/, '')}/wp-admin`;

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar wpAdminUrl={wpAdminUrl} />
      <main className="flex-1 overflow-auto lg:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
