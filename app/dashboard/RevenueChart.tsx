import { REVENUE_BY_MONTH } from './data';

const CHART_MAX = 80;

export default function RevenueChart() {
  const latest = REVENUE_BY_MONTH[REVENUE_BY_MONTH.length - 1];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Revenue overview</h2>
          <p className="text-sm text-slate-500">Monthly revenue over the last 12 months</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-2xl font-semibold tracking-tight text-slate-900">${latest.value}k</p>
          <p className="text-xs text-slate-500">This month</p>
        </div>
      </div>

      <div className="relative mt-6 h-64">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((line) => (
            <div key={line} className="border-t border-dashed border-slate-200" />
          ))}
        </div>
        <div className="absolute inset-0 flex items-end gap-2 sm:gap-3">
          {REVENUE_BY_MONTH.map((point) => (
            <div key={point.month} className="group flex h-full flex-1 flex-col justify-end">
              <span className="mb-1 text-center text-xs font-medium text-slate-700 opacity-0 transition-opacity group-hover:opacity-100">
                ${point.value}k
              </span>
              <div
                className="w-full rounded-t-md bg-blue-400 transition-colors duration-200 group-hover:bg-blue-600"
                style={{ height: `${(point.value / CHART_MAX) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2 sm:gap-3">
        {REVENUE_BY_MONTH.map((point) => (
          <span key={point.month} className="flex-1 text-center text-xs text-slate-500">
            {point.month}
          </span>
        ))}
      </div>
    </section>
  );
}
