import Icon from './Icons';
import { NavItem } from './data';

interface SidebarProps {
  items: NavItem[];
  activeId: string;
  open: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function Sidebar({ items, activeId, open, onSelect, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-x-0 bottom-0 top-16 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed bottom-0 left-0 top-16 z-40 flex w-64 flex-col bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon name={item.icon} />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />}
              </button>
            );
          })}
        </nav>

        <div className="m-4 rounded-xl bg-slate-800 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Storage used</span>
            <span className="text-slate-400">68%</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-700">
            <div className="h-1.5 w-[68%] rounded-full bg-blue-400" />
          </div>
          <p className="mt-2 text-xs text-slate-400">6.8 GB of 10 GB</p>
        </div>
      </aside>
    </>
  );
}
