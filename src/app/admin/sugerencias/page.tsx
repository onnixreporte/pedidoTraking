import { EmptyState } from '../empty-state';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Sugerencias · Café de Acá' };

export default function SugerenciasPage() {
  return (
    <EmptyState
      title="Sugerencias y quejas"
      message="El buzón de sugerencias estará disponible pronto."
      icon={
        <svg className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M10 3c-4.418 0-8 2.91-8 6.5 0 1.86.96 3.53 2.5 4.7v2.55a.5.5 0 0 0 .76.43l2.86-1.72c.6.1 1.23.14 1.88.14 4.418 0 8-2.91 8-6.5S14.418 3 10 3Zm-3 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm3 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm3 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
            clipRule="evenodd"
          />
        </svg>
      }
    />
  );
}
