import { ActivityStatus, RECENT_ACTIVITY } from './data';

const STATUS_CLASSES: Record<ActivityStatus, string> = {
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Failed: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export default function RecentActivity() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
          <p className="text-sm text-slate-500">Latest actions across your projects</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium">User</th>
              <th scope="col" className="px-6 py-3 font-medium">Action</th>
              <th scope="col" className="px-6 py-3 font-medium">Project</th>
              <th scope="col" className="px-6 py-3 text-right font-medium">Amount</th>
              <th scope="col" className="px-6 py-3 font-medium">Status</th>
              <th scope="col" className="px-6 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {RECENT_ACTIVITY.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-slate-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-700">
                      {row.initials}
                    </div>
                    <span className="font-medium text-slate-900">{row.user}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-slate-600">{row.action}</td>
                <td className="whitespace-nowrap px-6 py-4 text-slate-600">{row.project}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-slate-900">{row.amount}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_CLASSES[row.status]}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-slate-500">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
