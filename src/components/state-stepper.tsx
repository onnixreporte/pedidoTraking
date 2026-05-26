import { STATUSES_LINEAR, STATUS_SHORT_LABELS, type Status } from '@/lib/status';

export function StateStepper({ current }: { current: Status }) {
  const currentIdx = STATUSES_LINEAR.indexOf(current as (typeof STATUSES_LINEAR)[number]);

  return (
    <ol className="flex items-start text-[11px] sm:text-xs">
      {STATUSES_LINEAR.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const hasLeftLine = i > 0;
        const hasRightLine = i < STATUSES_LINEAR.length - 1;
        const leftLineGreen = i <= currentIdx;
        const rightLineGreen = i < currentIdx;

        return (
          <li key={s} className="flex flex-1 flex-col items-center">
            <span
              className={[
                'mb-2 font-medium leading-tight',
                done && 'text-green-600',
                active && 'text-[#b4191e]',
                !done && !active && 'text-gray-400',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {STATUS_SHORT_LABELS[s]}
            </span>

            <div className="relative flex h-7 w-full items-center justify-center">
              {hasLeftLine && (
                <span
                  className={[
                    'absolute left-0 top-1/2 h-0.5 w-1/2 -translate-y-1/2',
                    leftLineGreen ? 'bg-green-500' : 'bg-gray-200',
                  ].join(' ')}
                />
              )}
              {hasRightLine && (
                <span
                  className={[
                    'absolute left-1/2 top-1/2 h-0.5 w-1/2 -translate-y-1/2',
                    rightLineGreen ? 'bg-green-500' : 'bg-gray-200',
                  ].join(' ')}
                />
              )}

              {done && (
                <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 0 1 .006 1.415l-7.5 7.55a1 1 0 0 1-1.42 0L3.29 9.755a1 1 0 1 1 1.42-1.41l3.79 3.81 6.79-6.84a1 1 0 0 1 1.414-.025Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
              {active && (
                <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#b4191e] step-active-live">
                  <span className="h-2.5 w-2.5 rounded-full bg-white" />
                </span>
              )}
              {!done && !active && (
                <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-gray-300 bg-white" />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
