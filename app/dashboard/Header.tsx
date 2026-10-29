import Icon from './Icons';

interface HeaderProps {
  menuOpen: boolean;
  onMenuToggle: () => void;
}

export default function Header({ menuOpen, onMenuToggle }: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        >
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
          <Icon name="bolt" className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-base font-semibold text-slate-900">Northstar</p>
          <p className="hidden text-xs text-slate-500 sm:block">Business Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Icon name="bell" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white">
            AM
          </div>
          <div className="hidden leading-tight md:block">
            <p className="text-sm font-medium text-slate-900">Alex Morgan</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
