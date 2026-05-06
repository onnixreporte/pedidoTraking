import { STATUSES, STATUS_LABELS, type Status } from '@/lib/status';

export function StateStepper({ current }: { current: Status }) {
  const currentIdx = STATUSES.indexOf(current);

  return (
    <ol className="flex items-start justify-between gap-1 text-[10px] sm:text-xs">
      {STATUSES.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={s} className="flex flex-1 flex-col items-center text-center">
            <div
              className={[
                'mb-1 flex h-8 w-8 items-center justify-center rounded-full font-semibold',
                active && 'bg-blue-600 text-white step-active-live',
                done && 'bg-green-500 text-white',
                !active && !done && 'bg-gray-200 text-gray-400',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {done ? '✓' : i + 1}
            </div>
            <span
              className={
                active
                  ? 'font-semibold leading-tight text-gray-900'
                  : 'leading-tight text-gray-500'
              }
            >
              {STATUS_LABELS[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
