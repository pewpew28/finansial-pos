import { useState } from 'react';
import {
  ShoppingCart, TrendingUp, Package, Users, LogOut,
  ChevronRight, AlertTriangle, Clock, Store, DollarSign,
  PlayCircle, StopCircle, Banknote,
  ArrowRight, ReceiptText,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { createPortal } from 'react-dom';

// ─── Open Shift Modal ─────────────────────────────────────────────────────────
function OpenShiftModal({ onClose }: { onClose: () => void }) {
  const { openShift, currentCashier } = usePos();
  const [cash, setCash] = useState('');

  const fmt = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

  const handleOpen = () => {
    openShift(Number(cash.replace(/\D/g, '')) || 0);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ maxWidth: '512px', margin: '0 auto', left: 0, right: 0 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl p-6 shadow-2xl">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        {/* Icon */}
        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <PlayCircle size={28} className="text-emerald-600" />
        </div>

        <h2 className="text-xl font-black text-gray-900 text-center mb-1">Buka Shift</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Halo <span className="font-bold text-emerald-600">{currentCashier?.avatarEmoji} {currentCashier?.name}</span>! Siap mulai bekerja?
        </p>

        {/* Cash input */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
            Uang Kas Awal (Opsional)
          </label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Banknote size={18} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-medium mb-0.5">Jumlah uang tunai di laci kas</p>
              <input
                type="number"
                value={cash}
                onChange={e => setCash(e.target.value)}
                placeholder="0"
                className="w-full text-lg font-bold text-gray-900 bg-transparent outline-none"
              />
            </div>
          </div>
          {cash && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">Setara: <span className="font-bold text-gray-800">{fmt(Number(cash) || 0)}</span></p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm active:scale-95 transition-all">
            Batal
          </button>
          <button
            onClick={handleOpen}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <PlayCircle size={16} />
            Mulai Shift
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Close Shift Modal ────────────────────────────────────────────────────────
function CloseShiftModal({ onClose }: { onClose: () => void }) {
  const { closeShift, currentShift } = usePos();
  const [cash, setCash] = useState('');
  const [notes, setNotes] = useState('');

  const fmt = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

  const duration = () => {
    if (!currentShift) return '';
    const diff = Date.now() - new Date(currentShift.openedAt).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}j ${m}m`;
  };

  const handleClose = () => {
    closeShift(Number(cash.replace(/\D/g, '')) || 0, notes);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ maxWidth: '512px', margin: '0 auto', left: 0, right: 0 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl p-6 shadow-2xl max-h-[92dvh] overflow-y-auto">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        {/* Icon */}
        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <StopCircle size={28} className="text-orange-500" />
        </div>

        <h2 className="text-xl font-black text-gray-900 text-center mb-1">Tutup Shift</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Rekap shift sebelum menutup</p>

        {/* Shift Summary */}
        {currentShift && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold">Durasi Shift</span>
              <span className="text-sm font-black text-gray-900">{duration()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold">Total Transaksi</span>
              <span className="text-sm font-black text-emerald-600">{currentShift.totalTransactions} transaksi</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold">Total Penjualan</span>
              <span className="text-sm font-black text-emerald-600">{fmt(currentShift.totalSales)}</span>
            </div>
            {currentShift.openingCash > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-semibold">Kas Awal</span>
                <span className="text-sm font-black text-gray-900">{fmt(currentShift.openingCash)}</span>
              </div>
            )}
          </div>
        )}

        {/* Closing cash */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
            Uang Kas Akhir (Opsional)
          </label>
          <input
            type="number"
            value={cash}
            onChange={e => setCash(e.target.value)}
            placeholder="Jumlah uang di laci kas"
            className="w-full text-base font-bold text-gray-900 bg-transparent outline-none"
          />
        </div>

        {/* Notes */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
            Catatan (Opsional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Catatan untuk shift ini..."
            rows={2}
            className="w-full text-sm text-gray-800 bg-transparent outline-none resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm active:scale-95 transition-all">
            Batal
          </button>
          <button
            onClick={handleClose}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <StopCircle size={16} />
            Tutup Shift
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Cashier Dashboard (minimal view) ─────────────────────────────────────────
function CashierDashboard() {
  const { store, currentCashier, sales, currentShift, logoutCashier, setScreen } = usePos();
  const [showOpenShift, setShowOpenShift] = useState(false);
  const [showCloseShift, setShowCloseShift] = useState(false);

  const today = new Date().toDateString();
  const mySales = sales.filter(
    s => new Date(s.createdAt).toDateString() === today && s.cashierId === currentCashier?.id
  );
  const myRevenue = mySales.reduce((sum, s) => sum + s.total, 0);

  const fmt = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const shiftDuration = () => {
    if (!currentShift) return null;
    const diff = Date.now() - new Date(currentShift.openedAt).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}j ${m}m`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 px-5 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {store.logoBase64 ? (
              <div className="w-11 h-11 rounded-2xl overflow-hidden ring-2 ring-white/30 flex-shrink-0">
                <img src={store.logoBase64} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Store size={20} className="text-white" />
              </div>
            )}
            <div>
              <p className="text-emerald-200 text-xs font-semibold">{store.name}</p>
              <h1 className="text-white font-black text-base leading-tight">
                {currentCashier?.avatarEmoji} {currentCashier?.name}
              </h1>
            </div>
          </div>
          <button
            onClick={logoutCashier}
            className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl active:scale-90 transition-all border border-white/20"
          >
            <LogOut size={16} className="text-white" />
          </button>
        </div>

        {/* Role badge */}
        <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-xl px-3 py-1.5 mb-5">
          <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
          <span className="text-white text-xs font-bold uppercase tracking-wider">Kasir</span>
        </div>

        {/* My stats today */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <p className="text-emerald-200 text-xs font-bold mb-1">Penjualanku Hari Ini</p>
          <p className="text-white text-3xl font-black">{fmt(myRevenue)}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <ReceiptText size={12} className="text-emerald-300" />
            <span className="text-emerald-200 text-xs font-semibold">{mySales.length} transaksi</span>
            {currentShift && (
              <>
                <span className="text-emerald-300 mx-1">·</span>
                <Clock size={12} className="text-emerald-300" />
                <span className="text-emerald-200 text-xs font-semibold">
                  Shift aktif {shiftDuration()}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">

        {/* Shift Status Card */}
        <div className={`rounded-2xl p-5 border-2 ${
          currentShift
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-gray-100 border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              currentShift ? 'bg-emerald-500' : 'bg-gray-400'
            }`}>
              <Clock size={22} className="text-white" />
            </div>
            <div>
              <p className="font-black text-gray-900">
                {currentShift ? 'Shift Sedang Berjalan' : 'Belum Ada Shift Aktif'}
              </p>
              <p className="text-xs text-gray-500 font-medium">
                {currentShift
                  ? `Dibuka pukul ${formatTime(currentShift.openedAt)} · ${currentShift.totalTransactions} transaksi`
                  : 'Buka shift untuk mulai menerima transaksi'}
              </p>
            </div>
          </div>

          {currentShift ? (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xl font-black text-emerald-600">{currentShift.totalTransactions}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Transaksi</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-sm font-black text-emerald-600">{fmt(currentShift.totalSales)}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Total Penjualan</p>
              </div>
            </div>
          ) : null}

          {!currentShift ? (
            <button
              onClick={() => setShowOpenShift(true)}
              className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/30"
            >
              <PlayCircle size={18} />
              Buka Shift Sekarang
            </button>
          ) : (
            <button
              onClick={() => setShowCloseShift(true)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-orange-500/25"
            >
              <StopCircle size={18} />
              Tutup Shift
            </button>
          )}
        </div>

        {/* Go to Cashier */}
        <button
          onClick={() => setScreen('cashier')}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <ShoppingCart size={24} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-black text-lg leading-tight">Buka Kasir</p>
            <p className="text-emerald-200 text-xs mt-0.5">Mulai transaksi penjualan</p>
          </div>
          <ArrowRight size={20} className="text-white/70" />
        </button>

        {/* Recent my sales */}
        {mySales.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <ReceiptText size={15} className="text-emerald-500" />
              <p className="text-sm font-bold text-gray-900">Transaksi Terakhirku</p>
            </div>
            <div className="divide-y divide-gray-50">
              {mySales.slice(0, 5).map(sale => (
                <div key={sale.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart size={15} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{sale.receiptNumber}</p>
                    <p className="text-xs text-gray-400">{formatTime(sale.createdAt)} · {sale.items.length} item</p>
                  </div>
                  <p className="text-sm font-black text-emerald-600 flex-shrink-0">{fmt(sale.total)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showOpenShift && <OpenShiftModal onClose={() => setShowOpenShift(false)} />}
      {showCloseShift && <CloseShiftModal onClose={() => setShowCloseShift(false)} />}
    </div>
  );
}

// ─── Owner / Manager Dashboard ────────────────────────────────────────────────
function OwnerDashboard() {
  const { store, currentCashier, sales, products, cashiers, currentShift, logoutCashier, setScreen } = usePos();
  const [showOpenShift, setShowOpenShift] = useState(false);
  const [showCloseShift, setShowCloseShift] = useState(false);

  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.createdAt).toDateString() === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const yesterdaySales = sales.filter(s => new Date(s.createdAt).toDateString() === yesterday);
  const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + s.total, 0);
  const revenueChange = yesterdayRevenue > 0
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
    : null;

  const lowStockProducts = products.filter(p => p.isActive && p.stock <= p.minStock && p.stock > 0);
  const outOfStockProducts = products.filter(p => p.isActive && p.stock === 0);

  const fmt = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 px-5 pt-12 pb-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            {store.logoBase64 ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-white/30">
                <img src={store.logoBase64} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Store size={22} className="text-white" />
              </div>
            )}
            <div>
              <h1 className="text-white font-black text-base leading-tight">{store.name}</h1>
              <p className="text-emerald-200 text-xs font-medium">
                {currentCashier?.avatarEmoji} {currentCashier?.name}
                <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-full text-[9px] font-bold uppercase">
                  {currentCashier?.role}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={logoutCashier}
            className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl active:scale-90 transition-all border border-white/20"
          >
            <LogOut size={16} className="text-white" />
          </button>
        </div>

        {/* Revenue card */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <p className="text-emerald-200 text-xs font-bold mb-1">Pendapatan Hari Ini</p>
          <p className="text-white text-2xl font-black">{fmt(todayRevenue)}</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <ShoppingCart size={12} className="text-emerald-300" />
              <span className="text-emerald-200 text-xs font-semibold">{todaySales.length} transaksi</span>
            </div>
            {revenueChange !== null && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                Number(revenueChange) >= 0 ? 'bg-emerald-400/30 text-emerald-200' : 'bg-red-400/30 text-red-200'
              }`}>
                {Number(revenueChange) >= 0 ? '↑' : '↓'} {Math.abs(Number(revenueChange))}% vs kemarin
              </div>
            )}
            {currentShift && (
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                <span className="text-emerald-200 text-xs font-semibold">Shift aktif</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setScreen('cashier')}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg shadow-emerald-500/30 active:scale-[0.97] transition-all flex flex-col gap-3"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingCart size={20} />
            </div>
            <div>
              <p className="font-black text-base leading-tight">Buka Kasir</p>
              <p className="text-emerald-200 text-xs">Mulai transaksi</p>
            </div>
          </button>

          {!currentShift ? (
            <button
              onClick={() => setShowOpenShift(true)}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/30 active:scale-[0.97] transition-all flex flex-col gap-3"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <PlayCircle size={20} />
              </div>
              <div>
                <p className="font-black text-base leading-tight">Buka Shift</p>
                <p className="text-blue-200 text-xs">Mulai shift kerja</p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setShowCloseShift(true)}
              className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/30 active:scale-[0.97] transition-all flex flex-col gap-3"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <StopCircle size={20} />
              </div>
              <div>
                <p className="font-black text-base leading-tight">Tutup Shift</p>
                <p className="text-orange-200 text-xs">{currentShift.totalTransactions} transaksi</p>
              </div>
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Produk Aktif', value: products.filter(p => p.isActive).length, icon: <Package size={16} className="text-violet-500" />, bg: 'bg-violet-50', border: 'border-violet-100' },
            { label: 'Kasir Aktif', value: cashiers.filter(c => c.isActive).length, icon: <Users size={16} className="text-blue-500" />, bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Stok Kritis', value: lowStockProducts.length + outOfStockProducts.length, icon: <AlertTriangle size={16} className="text-amber-500" />, bg: 'bg-amber-50', border: 'border-amber-100' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-3 text-center`}>
              <div className="flex justify-center mb-1.5">{stat.icon}</div>
              <p className="text-xl font-black text-gray-900">{stat.value}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide leading-tight mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue comparison */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-emerald-500" />
            <p className="text-sm font-bold text-gray-900">Perbandingan Penjualan</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-1">Hari Ini</p>
              <p className="text-lg font-black text-emerald-600">{fmt(todayRevenue)}</p>
              <p className="text-xs text-gray-400">{todaySales.length} transaksi</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-1">Kemarin</p>
              <p className="text-lg font-black text-gray-600">{fmt(yesterdayRevenue)}</p>
              <p className="text-xs text-gray-400">{yesterdaySales.length} transaksi</p>
            </div>
          </div>
        </div>

        {/* Stock alerts */}
        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <AlertTriangle size={15} className="text-amber-500" />
              <p className="text-sm font-bold text-gray-900">Peringatan Stok</p>
              <span className="ml-auto text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {lowStockProducts.length + outOfStockProducts.length}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {outOfStockProducts.slice(0, 2).map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.imageBase64 ? <img src={p.imageBase64} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">📦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-red-500 font-bold">Stok Habis</p>
                  </div>
                  <span className="text-xs font-black text-red-500 bg-red-50 px-2 py-1 rounded-xl flex-shrink-0">0 {p.unit}</span>
                </div>
              ))}
              {lowStockProducts.slice(0, 2).map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.imageBase64 ? <img src={p.imageBase64} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">📦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-amber-600 font-bold">Stok Menipis</p>
                  </div>
                  <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-xl flex-shrink-0">{p.stock} {p.unit}</span>
                </div>
              ))}
            </div>
            {(lowStockProducts.length + outOfStockProducts.length) > 4 && (
              <button
                onClick={() => setScreen('stock' as any)}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-emerald-600 border-t border-gray-100 active:bg-gray-50"
              >
                Kelola Stok <ChevronRight size={13} />
              </button>
            )}
          </div>
        )}

        {/* Recent Sales */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <DollarSign size={15} className="text-emerald-500" />
              <p className="text-sm font-bold text-gray-900">Transaksi Hari Ini</p>
            </div>
            <button onClick={() => setScreen('reports')} className="text-xs font-bold text-emerald-600 flex items-center gap-1 active:scale-95">
              Semua <ChevronRight size={12} />
            </button>
          </div>
          {todaySales.length === 0 ? (
            <div className="py-10 text-center">
              <ShoppingCart size={28} className="mx-auto mb-2 text-gray-200" />
              <p className="text-xs text-gray-400 font-medium">Belum ada transaksi hari ini</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todaySales.slice(0, 5).map(sale => (
                <div key={sale.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart size={16} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{sale.receiptNumber}</p>
                    <p className="text-xs text-gray-400">{sale.cashierName} · {formatTime(sale.createdAt)}</p>
                  </div>
                  <p className="text-sm font-black text-emerald-600 flex-shrink-0">{fmt(sale.total)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shift history (today) */}
        {currentShift && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} className="text-blue-500" />
              <p className="text-sm font-bold text-gray-900">Shift Aktif</p>
              <span className="ml-auto flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-600 font-bold">Live</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-xl p-2.5 text-center">
                <p className="text-base font-black text-blue-600">{currentShift.totalTransactions}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase">Transaksi</p>
              </div>
              <div className="bg-white rounded-xl p-2.5 text-center">
                <p className="text-xs font-black text-emerald-600">{fmt(currentShift.totalSales)}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase">Penjualan</p>
              </div>
              <div className="bg-white rounded-xl p-2.5 text-center">
                <p className="text-xs font-black text-gray-700">{formatTime(currentShift.openedAt)}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase">Mulai</p>
              </div>
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>

      {showOpenShift && <OpenShiftModal onClose={() => setShowOpenShift(false)} />}
      {showCloseShift && <CloseShiftModal onClose={() => setShowCloseShift(false)} />}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function PosDashboardScreen() {
  const { currentCashier } = usePos();
  const role = currentCashier?.role ?? 'cashier';

  if (role === 'cashier') return <CashierDashboard />;
  return <OwnerDashboard />;
}
