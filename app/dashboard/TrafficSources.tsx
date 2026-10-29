import { TRAFFIC_SOURCES } from './data';

export default function TrafficSources() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Traffic sources</h2>
        <p className="text-sm text-slate-500">12,480 sessions this month</p>
      </div>

      <ul className="mt-6 space-y-5">
        {TRAFFIC_SOURCES.map((source) => (
          <li key={source.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{source.label}</span>
              <span className="font-medium text-slate-900">{source.percent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${source.barClass}`}
                style={{ width: `${source.percent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
