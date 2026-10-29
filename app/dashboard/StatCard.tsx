import Icon from './Icons';
import { StatCardData, StatTone } from './data';

const TONE_CLASSES: Record<StatTone, string> = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
};

export default function StatCard({ label, value, change, helper, icon, tone }: StatCardData) {
  const positive = change >= 0;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>
          <Icon name={icon} />
        </div>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          <Icon name={positive ? 'trendUp' : 'trendDown'} className="h-3.5 w-3.5" />
          {Math.abs(change)}%
        </span>
        <span className="text-slate-500">{helper}</span>
      </div>
    </div>
  );
}
