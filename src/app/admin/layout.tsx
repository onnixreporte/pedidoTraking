import { getSession } from '@/lib/session';
import { AdminSidebar } from './admin-sidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Sin sesión (p. ej. /admin/login): sin shell, solo children.
  if (!session) {
    return <div className="min-h-screen bg-[#fcf9f2]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#fcf9f2] md:flex">
      <AdminSidebar email={session.email} />
      {/* Contenedor de contenido: en mobile deja espacio para la topbar;
          en desktop ocupa el resto del ancho a la derecha del sidebar. */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
