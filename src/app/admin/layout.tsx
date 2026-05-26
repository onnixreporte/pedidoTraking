import Link from 'next/link';
import { getSession } from '@/lib/session';
import { AdminHeader } from './admin-header';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-[#fcf9f2]">
      {session ? (
        <AdminHeader email={session.email} />
      ) : (
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/admin" className="text-sm font-semibold tracking-wide">
              Café de Acá · Pedidos
            </Link>
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
