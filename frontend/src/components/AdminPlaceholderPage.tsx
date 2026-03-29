import Link from 'next/link';

type QuickAction = {
  label: string;
  icon: string;
};

type AdminPlaceholderPageProps = {
  title: string;
  subtitle: string;
  primaryAction: string;
  onPrimaryAction?: () => void;
  quickActions: QuickAction[];
  emptyTitle: string;
  emptyDescription: string;
};

export default function AdminPlaceholderPage({
  title,
  subtitle,
  primaryAction,
  onPrimaryAction,
  quickActions,
  emptyTitle,
  emptyDescription,
}: AdminPlaceholderPageProps) {
  return (
    <div className="pb-16 pt-4">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-[12px] text-slate-500">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onPrimaryAction}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-[12px] font-semibold text-white hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          {primaryAction}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[14px] text-slate-500">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      <div className="max-w-[980px] rounded-md border border-slate-200 bg-white p-10 text-center">
        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <span className="material-symbols-outlined text-[20px]">inbox</span>
        </div>
        <h2 className="text-[14px] font-semibold text-slate-900">{emptyTitle}</h2>
        <p className="mt-1 text-[11px] text-slate-500">{emptyDescription}</p>

        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex h-8 items-center rounded-full border border-slate-300 px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Go to Scheduling
          </Link>
        </div>
      </div>
    </div>
  );
}
