import type { IconName } from './Icons';

export type StatTone = 'blue' | 'emerald' | 'amber' | 'rose';

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
}

export interface StatCardData {
  label: string;
  value: string;
  change: number;
  helper: string;
  icon: IconName;
  tone: StatTone;
}

export interface RevenuePoint {
  month: string;
  value: number;
}

export interface TrafficSource {
  label: string;
  percent: number;
  barClass: string;
}

export type ActivityStatus = 'Completed' | 'Pending' | 'Failed';

export interface ActivityRow {
  id: string;
  user: string;
  initials: string;
  action: string;
  project: string;
  amount: string;
  status: ActivityStatus;
  date: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  { id: 'projects', label: 'Projects', icon: 'projects' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export const STATS: StatCardData[] = [
  { label: 'Total Users', value: '24,589', change: 12.5, helper: 'vs. last month', icon: 'users', tone: 'blue' },
  { label: 'Revenue', value: '$48,290', change: 8.2, helper: 'vs. last month', icon: 'revenue', tone: 'emerald' },
  { label: 'Active Projects', value: '132', change: -3.1, helper: 'vs. last month', icon: 'bolt', tone: 'amber' },
  { label: 'Growth', value: '18.4%', change: 4.6, helper: 'vs. last quarter', icon: 'trendUp', tone: 'rose' },
];

export const REVENUE_BY_MONTH: RevenuePoint[] = [
  { month: 'Nov', value: 32 },
  { month: 'Dec', value: 38 },
  { month: 'Jan', value: 35 },
  { month: 'Feb', value: 44 },
  { month: 'Mar', value: 41 },
  { month: 'Apr', value: 52 },
  { month: 'May', value: 48 },
  { month: 'Jun', value: 57 },
  { month: 'Jul', value: 53 },
  { month: 'Aug', value: 61 },
  { month: 'Sep', value: 58 },
  { month: 'Oct', value: 69 },
];

export const TRAFFIC_SOURCES: TrafficSource[] = [
  { label: 'Organic Search', percent: 42, barClass: 'bg-blue-500' },
  { label: 'Direct', percent: 24, barClass: 'bg-emerald-500' },
  { label: 'Social Media', percent: 18, barClass: 'bg-amber-500' },
  { label: 'Referral', percent: 10, barClass: 'bg-rose-500' },
  { label: 'Email', percent: 6, barClass: 'bg-slate-400' },
];

export const RECENT_ACTIVITY: ActivityRow[] = [
  { id: '1', user: 'Sarah Chen', initials: 'SC', action: 'Upgraded plan', project: 'Enterprise Suite', amount: '$1,200.00', status: 'Completed', date: 'Today, 09:42' },
  { id: '2', user: 'Marcus Johnson', initials: 'MJ', action: 'Created project', project: 'Atlas Migration', amount: '$0.00', status: 'Completed', date: 'Today, 08:15' },
  { id: '3', user: 'Priya Patel', initials: 'PP', action: 'Invoice paid', project: 'Q3 Retainer', amount: '$4,850.00', status: 'Completed', date: 'Yesterday, 17:30' },
  { id: '4', user: 'Tom Becker', initials: 'TB', action: 'Refund requested', project: 'Starter Kit', amount: '$89.00', status: 'Pending', date: 'Yesterday, 11:04' },
  { id: '5', user: 'Lena Muller', initials: 'LM', action: 'Payment failed', project: 'Nova Analytics', amount: '$320.00', status: 'Failed', date: 'Oct 27, 14:22' },
  { id: '6', user: 'Daniel Ortiz', initials: 'DO', action: 'Invited team member', project: 'Orion Web', amount: '$0.00', status: 'Completed', date: 'Oct 26, 10:58' },
  { id: '7', user: 'Aisha Rahman', initials: 'AR', action: 'Subscription renewed', project: 'Growth Plan', amount: '$540.00', status: 'Completed', date: 'Oct 25, 16:10' },
];
