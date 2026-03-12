import { LayoutDashboard, ArrowLeftRight, Wallet, Users, CreditCard, Settings, MessageCircle, FileSpreadsheet } from 'lucide-react';
import { TabType } from '../types';

interface Props {
  active: TabType;
  onChange: (t: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',     label: 'Beranda',   icon: <LayoutDashboard size={19} /> },
  { id: 'transactions',  label: 'Transaksi', icon: <ArrowLeftRight size={19} /> },
  { id: 'wallets',       label: 'Dompet',    icon: <Wallet size={19} /> },
  { id: 'debts',         label: 'Utang',     icon: <Users size={19} /> },
  { id: 'installments',  label: 'Cicilan',   icon: <CreditCard size={19} /> },
  { id: 'notifications', label: 'WA Notif',  icon: <MessageCircle size={19} /> },
  { id: 'export',        label: 'Export',    icon: <FileSpreadsheet size={19} /> },
  { id: 'settings',      label: 'Pengaturan',icon: <Settings size={19} /> },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] bg-white/98 backdrop-blur-xl border-t border-gray-200/80 shadow-2xl shadow-black/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="flex h-[62px] overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map(tab => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="flex-shrink-0 flex flex-col items-center justify-center gap-0.5 px-3.5 relative transition-all duration-150 active:scale-90 min-w-[68px]"
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-1 w-1 h-1 bg-violet-600 rounded-full" />
              )}
              {/* Active background pill */}
              <span className={`transition-all duration-200 p-1.5 rounded-xl ${
                isActive
                  ? 'text-violet-600 bg-violet-50'
                  : 'text-gray-400'
              }`}>
                {tab.icon}
              </span>
              <span className={`text-[9px] font-bold tracking-wide transition-colors duration-200 leading-none ${
                isActive ? 'text-violet-600' : 'text-gray-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
