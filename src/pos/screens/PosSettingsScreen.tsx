import {
  Store, Users, Package, ChevronRight, LogOut,
  Info, Code, Link2, Receipt, Settings,
  Download, Bell, Clock, BarChart2,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { GAS_POS_ADDON } from '../utils/gas';
import toast from 'react-hot-toast';

export default function PosSettingsScreen() {
  const { store, currentCashier, logoutCashier, setScreen, cashiers, receiptSettings, products } = usePos();

  const isOwner = currentCashier?.role === 'owner';
  const isManager = currentCashier?.role === 'owner' || currentCashier?.role === 'manager';

  const lowStock = products.filter(p => p.isActive && p.stock <= p.minStock && p.stock > 0).length;
  const outOfStock = products.filter(p => p.isActive && p.stock === 0).length;

  const menus = [
    {
      group: 'Laporan & Data',
      items: [
        {
          icon: <BarChart2 size={18} className="text-blue-600" />,
          bg: 'bg-blue-100',
          label: 'Laporan Penjualan',
          desc: 'Statistik, grafik, per kasir & produk',
          action: () => setScreen('reports'),
          show: isManager,
        },
        {
          icon: <Clock size={18} className="text-indigo-600" />,
          bg: 'bg-indigo-100',
          label: 'Riwayat Shift',
          desc: 'Semua shift & rekap',
          action: () => setScreen('shift-history'),
          show: isManager,
        },
        {
          icon: <Download size={18} className="text-teal-600" />,
          bg: 'bg-teal-100',
          label: 'Export Excel',
          desc: 'Download laporan spreadsheet',
          action: () => setScreen('export'),
          show: isManager,
        },
      ],
    },
    {
      group: 'Manajemen',
      items: [
        {
          icon: <Users size={18} className="text-blue-600" />,
          bg: 'bg-blue-100',
          label: 'Manajemen Kasir',
          desc: `${cashiers.filter(c => c.isActive).length} kasir aktif dari ${cashiers.length} terdaftar`,
          action: () => setScreen('cashiers'),
          show: isManager,
        },
        {
          icon: <Package size={18} className="text-violet-600" />,
          bg: 'bg-violet-100',
          label: 'Produk & Kategori',
          desc: `${products.filter(p => p.isActive).length} produk aktif${lowStock + outOfStock > 0 ? ` · ⚠️ ${lowStock + outOfStock} perlu perhatian` : ''}`,
          action: () => setScreen('products'),
          show: isManager,
        },
      ],
    },
    {
      group: 'Konfigurasi',
      items: [
        {
          icon: <Store size={18} className="text-emerald-600" />,
          bg: 'bg-emerald-100',
          label: 'Profil & Pengaturan Toko',
          desc: `${store.name} · ${store.gasUrl ? '🔗 GAS terhubung' : '⚠️ GAS belum diset'}`,
          action: () => setScreen('store-settings'),
          show: isOwner,
        },
        {
          icon: <Receipt size={18} className="text-orange-600" />,
          bg: 'bg-orange-100',
          label: 'Kustomisasi Struk',
          desc: `Font: ${receiptSettings.fontFamily} · Kertas: ${receiptSettings.paperWidth}`,
          action: () => setScreen('receipt-settings'),
          show: isManager,
        },
        {
          icon: <Bell size={18} className="text-green-600" />,
          bg: 'bg-green-100',
          label: 'Notifikasi WhatsApp',
          desc: store.fonntToken ? '✓ Fonnte terhubung' : 'Belum dikonfigurasi',
          action: () => setScreen('notif'),
          show: isManager,
        },
      ],
    },
    {
      group: 'Integrasi',
      items: [
        {
          icon: <Link2 size={18} className="text-teal-600" />,
          bg: 'bg-teal-100',
          label: 'Google Apps Script',
          desc: store.gasUrl ? '✓ Terhubung ke spreadsheet' : 'Belum diatur',
          action: () => setScreen('store-settings'),
          show: isOwner,
        },
        {
          icon: <Code size={18} className="text-gray-600" />,
          bg: 'bg-gray-100',
          label: 'Salin Kode GAS POS',
          desc: 'Tambahkan ke script FinTrack yang ada',
          action: () => {
            navigator.clipboard?.writeText(GAS_POS_ADDON);
            toast.success('Kode GAS disalin!');
          },
          show: isOwner,
        },
      ],
    },
    {
      group: 'Tentang',
      items: [
        {
          icon: <Info size={18} className="text-blue-600" />,
          bg: 'bg-blue-100',
          label: 'Tentang FinPOS',
          desc: 'Versi 1.0.0 — Semua Fitur (A–F)',
          action: () => {},
          show: true,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-gray-700" />
          <h1 className="text-lg font-black text-gray-900">Pengaturan</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Profile card */}
        <div className="mx-4 mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg shadow-emerald-500/30">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
              {currentCashier?.avatarEmoji}
            </div>
            <div className="flex-1">
              <p className="font-black text-lg leading-tight">{currentCashier?.name}</p>
              <span className="text-xs font-bold px-2 py-0.5 bg-white/20 rounded-full">
                {currentCashier?.role?.toUpperCase()}
              </span>
              <p className="text-emerald-200 text-xs mt-1">{store.name}</p>
            </div>
          </div>
        </div>

        {/* Stock alert banner if needed */}
        {isManager && (lowStock + outOfStock > 0) && (
          <button
            onClick={() => setScreen('stock' as any)}
            className="mx-4 mt-3 w-[calc(100%-2rem)] bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-all"
          >
            <span className="text-xl">⚠️</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-amber-800">Perhatikan Stok!</p>
              <p className="text-xs text-amber-600">{outOfStock} produk habis · {lowStock} produk menipis</p>
            </div>
            <ChevronRight size={16} className="text-amber-400" />
          </button>
        )}

        {/* Menu groups */}
        {menus.map(group => {
          const visibleItems = group.items.filter(i => i.show);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.group} className="mx-4 mt-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                {group.group}
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {visibleItems.map((item, idx, arr) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`w-full flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors ${
                      idx < arr.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Logout */}
        <div className="mx-4 mt-4">
          <button
            onClick={logoutCashier}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-red-50 border border-red-100 text-red-500 font-bold rounded-2xl active:scale-[0.98] transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-300 font-medium mt-6 pb-2">
          FinPOS v1.0 · Fitur A–F Lengkap<br />
          Auth · Produk · Kasir · Struk · Stok · Laporan
        </p>
      </div>
    </div>
  );
}
