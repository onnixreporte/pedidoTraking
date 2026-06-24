'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; icon: React.ReactNode };

const ITEMS: NavItem[] = [
  {
    href: '/admin/pedidos',
    label: 'Pedidos',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M5 1.75A1.75 1.75 0 0 1 6.75 0h6.5A1.75 1.75 0 0 1 15 1.75v16.5a.75.75 0 0 1-1.18.614L12 17.6l-1.32.93a.75.75 0 0 1-.86 0L8.5 17.6l-1.32.93a.75.75 0 0 1-.86 0L5 17.6l-1.82 1.264A.75.75 0 0 1 2 18.25V1.75A1.75 1.75 0 0 1 3.75 0h.5A.75.75 0 0 1 5 .75v1ZM6.75 5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3.5a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    href: '/admin/reservas',
    label: 'Reservas',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.5A2.5 2.5 0 0 1 18 6.5v8A2.5 2.5 0 0 1 15.5 17h-11A2.5 2.5 0 0 1 2 14.5v-8A2.5 2.5 0 0 1 4.5 4H5V2.75A.75.75 0 0 1 5.75 2ZM3.5 9.5v5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-5h-13Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    href: '/admin/sugerencias',
    label: 'Sugerencias',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M10 3c-4.418 0-8 2.91-8 6.5 0 1.86.96 3.53 2.5 4.7v2.55a.5.5 0 0 0 .76.43l2.86-1.72c.6.1 1.23.14 1.88.14 4.418 0 8-2.91 8-6.5S14.418 3 10 3Zm-3 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm3 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm3 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Secciones del panel">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={[
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
              active
                ? 'bg-[#066731]/10 text-[#066731]'
                : 'text-[#5a5a5a] hover:bg-black/5 hover:text-[#1f1f1f]',
            ].join(' ')}
          >
            <span aria-hidden className={active ? 'text-[#066731]' : 'text-[#8a8a8a]'}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
