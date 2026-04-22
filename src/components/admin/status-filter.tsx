'use client';

import type { Status } from '@/lib/status';
import { STATUSES, STATUS_LABELS } from '@/lib/status';

type FilterOption = Status | 'TODOS';

const ALL: FilterOption = 'TODOS';

const OPTIONS: FilterOption[] = [ALL, ...STATUSES];

export function StatusFilter({
  active,
  onChange,
  counts,
}: {
  active: FilterOption;
  onChange: (s: FilterOption) => void;
  counts: Record<FilterOption, number>;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {OPTIONS.map((opt) => {
        const isActive = opt === active;
        const label = opt === ALL ? 'Todos' : STATUS_LABELS[opt as Status];
        const count = counts[opt];

        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={[
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition',
              isActive
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
            ].join(' ')}
          >
            {label}
            {count != null && (
              <span
                className={[
                  'rounded-full px-1.5 py-0.5 text-xs leading-none',
                  isActive ? 'bg-blue-500' : 'bg-gray-100',
                ].join(' ')}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}