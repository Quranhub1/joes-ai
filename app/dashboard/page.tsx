'use client';

import { useState } from 'react';
import Header from './Header';
import RecentActivity from './RecentActivity';
import RevenueChart from './RevenueChart';
import Sidebar from './Sidebar';
import StatCard from './StatCard';
import TrafficSources from './TrafficSources';
import { NAV_ITEMS, STATS } from './data';

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState(NAV_ITEMS[0].id);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelect = (id: string) => {
    setActiveNav(id);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased">
      <Header menuOpen={menuOpen} onMenuToggle={() => setMenuOpen((open) => !open)} />
      <Sidebar
        items={NAV_ITEMS}
        activeId={activeNav}
        open={menuOpen}
        onSelect={handleSelect}
        onClose={() => setMenuOpen(false)}
      />

      <main className="pt-16 lg:pl-64">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back, Alex</h1>
            <p className="mt-1 text-sm text-slate-500">Here is what is happening across your business this month.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {STATS.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <RevenueChart />
            </div>
            <TrafficSources />
          </div>

          <RecentActivity />
        </div>
      </main>
    </div>
  );
}
