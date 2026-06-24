import { EmptyState } from '../empty-state';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Reservas · Café de Acá' };

export default function ReservasPage() {
  return (
    <EmptyState
      title="Reservas"
      message="La gestión de reservas estará disponible pronto."
      icon={
        <svg className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.5A2.5 2.5 0 0 1 18 6.5v8A2.5 2.5 0 0 1 15.5 17h-11A2.5 2.5 0 0 1 2 14.5v-8A2.5 2.5 0 0 1 4.5 4H5V2.75A.75.75 0 0 1 5.75 2ZM4.5 5.5A1 1 0 0 0 3.5 6.5V8h13V6.5a1 1 0 0 0-1-1h-11ZM16.5 9.5h-13v5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-5Z"
            clipRule="evenodd"
          />
        </svg>
      }
    />
  );
}
