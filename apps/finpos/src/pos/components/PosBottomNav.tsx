import { LayoutDashboard, ShoppingCart, Package, BarChart2, Settings } from 'lucide-react';
import { PosRole, PosScreen } from '../types';
import { usePos } from '../context/PosContext';

interface TabDef { id: PosScreen; label: string; icon: React.ReactNode; allowedRoles: PosRole[]; }

const TABS: TabDef[] = [
  { id: 'dashboard', label: 'Beranda', icon: <LayoutDashboard size={20} />, allowedRoles: ['owner', 'manager', 'cashier'] },
  { id: 'cashier', label: 'Kasir', icon: <ShoppingCart size={20} />, allowedRoles: ['owner', 'manager', 'cashier'] },
  { id: 'products', label: 'Produk', icon: <Package size={20} />, allowedRoles: ['owner', 'manager'] },
  { id: 'reports', label: 'Laporan', icon: <BarChart2 size={20} />, allowedRoles: ['owner', 'manager'] },
  { id: 'settings', label: 'Pengaturan', icon: <Settings size={20} />, allowedRoles: ['owner', 'manager'] },
];

export default function PosBottomNav() {
  const { screen, setScreen, currentCashier } = usePos();
  const role = currentCashier?.role ?? 'cashier';
  const visibleTabs = TABS.filter(t => t.allowedRoles.includes(role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/98 backdrop-blur-xl border-t border-gray-200/80 shadow-2xl shadow-black/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex h-[62px] max-w-lg mx-auto">
        {visibleTabs.map(tab => {
          const isActive = screen === tab.id;
          return (
            <button key={tab.id} onClick={() => setScreen(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-150 active:scale-90">
              {isActive && <span className="absolute top-1.5 w-1 h-1 bg-emerald-500 rounded-full" />}
              <span className={`transition-all duration-200 p-1.5 rounded-xl ${isActive ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'}`}>
                {tab.icon}
              </span>
              <span className={`text-[9px] font-bold tracking-wide transition-colors leading-none ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
