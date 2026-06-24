export function EmptyState({
  title,
  message,
  icon,
}: {
  title: string;
  message: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      {icon && (
        <div className="mb-4 text-[#8a8a8a]" aria-hidden>
          {icon}
        </div>
      )}
      <h1 className="text-lg font-bold text-[#1f1f1f]">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-[#5a5a5a]">{message}</p>
      <span className="mt-4 rounded-full bg-[#066731]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#066731]">
        Próximamente
      </span>
    </div>
  );
}
