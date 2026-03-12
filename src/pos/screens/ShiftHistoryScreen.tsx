import { useState } from 'react';
import { ChevronLeft, Clock, PlayCircle, StopCircle, Search } from 'lucide-react';
import { usePos } from '../context/PosContext';

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

export default function ShiftHistoryScreen({ onBack }: { onBack: () => void }) {
  const { shifts, currentShift, cashiers } = usePos();
  const [search, setSearch] = useState('');
  const [filterCashier, setFilterCashier] = useState('all');

  const allShifts = [
    ...(currentShift ? [{ ...currentShift, closedAt: null }] : []),
    ...shifts,
  ];

  const filtered = allShifts.filter(s => {
    if (filterCashier !== 'all' && s.cashierId !== filterCashier) return false;
    if (search && !s.cashierName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatDuration = (openedAt: string, closedAt: string | null) => {
    const end = closedAt ? new Date(closedAt) : new Date();
    const diff = end.getTime() - new Date(openedAt).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}j ${m}m`;
  };

  const totalRevenue = filtered.reduce((s, x) => s + x.totalSales, 0);
  const totalTrx = filtered.reduce((s, x) => s + x.totalTransactions, 0);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 px-4 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center active:scale-90">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-white font-black text-lg">Riwayat Shift</h1>
            <p className="text-indigo-200 text-xs">{filtered.length} shift</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-2xl p-3 border border-white/10">
            <p className="text-indigo-200 text-[10px] font-bold uppercase">Total Pendapatan</p>
            <p className="text-white font-black text-lg">{fmt(totalRevenue)}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 border border-white/10">
            <p className="text-indigo-200 text-[10px] font-bold uppercase">Total Transaksi</p>
            <p className="text-white font-black text-lg">{totalTrx}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari kasir..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-700"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setFilterCashier('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterCashier === 'all' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            Semua Kasir
          </button>
          {cashiers.map(c => (
            <button
              key={c.id}
              onClick={() => setFilterCashier(c.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterCashier === c.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              {c.avatarEmoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-4 pb-24 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Clock size={40} className="text-gray-200 mb-4" />
            <p className="text-sm font-bold text-gray-400">Belum ada riwayat shift</p>
          </div>
        ) : (
          filtered.map(shift => (
            <div key={shift.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className={`flex items-center gap-3 p-4 ${shift.closedAt === null ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  shift.closedAt === null ? 'bg-emerald-500' : 'bg-gray-400'
                }`}>
                  {shift.closedAt === null
                    ? <PlayCircle size={18} className="text-white" />
                    : <StopCircle size={18} className="text-white" />
                  }
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-gray-900">{shift.cashierName}</p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      shift.closedAt === null ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {shift.closedAt === null ? '🟢 AKTIF' : 'SELESAI'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(shift.openedAt).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}
                    {new Date(shift.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    {shift.closedAt && ` – ${new Date(shift.closedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-0 divide-x divide-gray-100 border-t border-gray-100">
                {[
                  { label: 'Durasi', value: formatDuration(shift.openedAt, shift.closedAt) },
                  { label: 'Transaksi', value: String(shift.totalTransactions) },
                  { label: 'Penjualan', value: shift.totalSales >= 1000000 ? `${(shift.totalSales / 1000000).toFixed(1)}jt` : `${(shift.totalSales / 1000).toFixed(0)}rb` },
                ].map(s => (
                  <div key={s.label} className="py-3 text-center">
                    <p className="text-sm font-black text-gray-900">{s.value}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Kas info */}
              {(shift.openingCash > 0 || (shift.closingCash !== null && shift.closingCash > 0)) && (
                <div className="flex gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50">
                  {shift.openingCash > 0 && (
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Kas Awal</p>
                      <p className="text-xs font-black text-gray-700">{fmt(shift.openingCash)}</p>
                    </div>
                  )}
                  {shift.closingCash !== null && shift.closingCash > 0 && (
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Kas Akhir</p>
                      <p className="text-xs font-black text-gray-700">{fmt(shift.closingCash)}</p>
                    </div>
                  )}
                  {shift.notes && (
                    <div className="flex-1">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Catatan</p>
                      <p className="text-xs text-gray-600 truncate">{shift.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
