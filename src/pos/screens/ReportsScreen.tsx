import { useState, useMemo } from 'react';
import {
  BarChart2, TrendingUp, TrendingDown, ShoppingCart, Users,
  Package, ChevronLeft, Download, Filter,
  ArrowUpRight, ReceiptText, Clock, Star, DollarSign,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { PosSale } from '../types';

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

type Period = 'today' | 'week' | '7days' | 'month' | 'custom';

function getDateRange(period: Period, customStart?: string, customEnd?: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
    case 'week': {
      const day = today.getDay();
      const mon = new Date(today); mon.setDate(today.getDate() - ((day + 6) % 7));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59);
      return { start: mon, end: sun };
    }
    case '7days': {
      const s = new Date(today); s.setDate(today.getDate() - 6);
      return { start: s, end: new Date(now) };
    }
    case 'month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start: s, end: e };
    }
    case 'custom': {
      const s = customStart ? new Date(customStart) : today;
      const e = customEnd ? new Date(customEnd + 'T23:59:59') : new Date(now);
      return { start: s, end: e };
    }
    default:
      return { start: today, end: new Date(now) };
  }
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function MiniBarChart({ data, height = 80 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-teal-400 transition-all"
            style={{ height: `${Math.max(4, (d.value / max) * (height - 20))}px` }}
          />
          <span className="text-[8px] text-gray-400 font-bold">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Sales Summary Cards ──────────────────────────────────────────────────────
function SummaryCards({ sales }: { sales: PosSale[] }) {
  const revenue = sales.reduce((s, x) => s + x.total, 0);
  const transactions = sales.length;
  const avgOrder = transactions > 0 ? revenue / transactions : 0;
  const itemsSold = sales.reduce((s, x) => s + x.items.reduce((ss, i) => ss + i.quantity, 0), 0);

  const cards = [
    { label: 'Total Pendapatan', value: fmt(revenue), icon: <DollarSign size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Jumlah Transaksi', value: String(transactions), icon: <ReceiptText size={18} />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Rata-rata Order', value: fmt(avgOrder), icon: <TrendingUp size={18} />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Item Terjual', value: String(itemsSold), icon: <Package size={18} />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} border ${c.border} rounded-2xl p-4`}>
          <div className={`w-9 h-9 bg-white rounded-xl flex items-center justify-center ${c.color} mb-3 shadow-sm`}>
            {c.icon}
          </div>
          <p className="text-lg font-black text-gray-900 leading-tight">{c.value}</p>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Daily Chart ──────────────────────────────────────────────────────────────
function DailyChart({ sales, days = 7 }: { sales: PosSale[]; days?: number }) {
  const data = useMemo(() => {
    const result: { label: string; value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const dateStr = d.toDateString();
      const value = sales
        .filter(s => new Date(s.createdAt).toDateString() === dateStr)
        .reduce((sum, s) => sum + s.total, 0);
      result.push({ label, value });
    }
    return result;
  }, [sales, days]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={15} className="text-emerald-500" />
          <p className="text-sm font-bold text-gray-900">Tren Penjualan ({days} Hari)</p>
        </div>
        <p className="text-xs text-gray-400 font-medium">
          Total: {fmt(data.reduce((s, d) => s + d.value, 0))}
        </p>
      </div>
      <MiniBarChart data={data} height={100} />
    </div>
  );
}

// ─── Top Products ─────────────────────────────────────────────────────────────
function TopProducts({ sales }: { sales: PosSale[] }) {
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        if (!map[item.productId]) {
          map[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
        }
        map[item.productId].qty += item.quantity;
        map[item.productId].revenue += item.subtotal;
      }
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [sales]);

  if (topProducts.length === 0) return null;
  const maxRevenue = topProducts[0].revenue;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <Star size={15} className="text-amber-500" />
        <p className="text-sm font-bold text-gray-900">Produk Terlaris</p>
      </div>
      <div className="divide-y divide-gray-50">
        {topProducts.map((p, i) => (
          <div key={p.name} className="px-4 py-3">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                i === 0 ? 'bg-amber-100 text-amber-600' :
                i === 1 ? 'bg-gray-100 text-gray-600' :
                i === 2 ? 'bg-orange-100 text-orange-600' :
                'bg-gray-50 text-gray-400'
              }`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.qty}x terjual</p>
              </div>
              <p className="text-sm font-black text-emerald-600 flex-shrink-0">{fmt(p.revenue)}</p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Per Cashier ──────────────────────────────────────────────────────────────
function PerCashierReport({ sales }: { sales: PosSale[] }) {
  const data = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; count: number }> = {};
    for (const sale of sales) {
      if (!map[sale.cashierId]) {
        map[sale.cashierId] = { name: sale.cashierName, revenue: 0, count: 0 };
      }
      map[sale.cashierId].revenue += sale.total;
      map[sale.cashierId].count += 1;
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <Users size={15} className="text-blue-500" />
        <p className="text-sm font-bold text-gray-900">Penjualan per Kasir</p>
      </div>
      <div className="divide-y divide-gray-50">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-3 px-4 py-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
              i === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
            }`}>
              #{i + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">{d.name}</p>
              <p className="text-xs text-gray-400">{d.count} transaksi</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-gray-900">{fmt(d.revenue)}</p>
              <p className="text-xs text-gray-400">{fmt(d.count > 0 ? d.revenue / d.count : 0)} avg</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Per Category ─────────────────────────────────────────────────────────────
function PerCategoryReport({ sales }: { sales: PosSale[] }) {
  const { categories, products } = usePos();

  const data = useMemo(() => {
    const map: Record<string, { name: string; emoji: string; color: string; revenue: number; qty: number }> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        const product = products.find(p => p.id === item.productId);
        const category = categories.find(c => c.id === product?.categoryId);
        const key = category?.id ?? 'uncategorized';
        if (!map[key]) {
          map[key] = {
            name: category?.name ?? 'Tanpa Kategori',
            emoji: category?.emoji ?? '📦',
            color: category?.color ?? '#6b7280',
            revenue: 0,
            qty: 0,
          };
        }
        map[key].revenue += item.subtotal;
        map[key].qty += item.quantity;
      }
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [sales, categories, products]);

  if (data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <Package size={15} className="text-violet-500" />
        <p className="text-sm font-bold text-gray-900">Penjualan per Kategori</p>
      </div>
      <div className="divide-y divide-gray-50">
        {data.map(d => (
          <div key={d.name} className="px-4 py-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: d.color + '22' }}>
                {d.emoji}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">{d.name}</p>
                <p className="text-xs text-gray-400">{d.qty} item</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-gray-900">{fmt(d.revenue)}</p>
                <p className="text-xs text-gray-400">{((d.revenue / total) * 100).toFixed(1)}%</p>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(d.revenue / total) * 100}%`, backgroundColor: d.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Payment Method Breakdown ─────────────────────────────────────────────────
function PaymentBreakdown({ sales }: { sales: PosSale[] }) {
  const data = useMemo(() => {
    const map: Record<string, { label: string; amount: number; count: number }> = {
      cash: { label: '💵 Tunai', amount: 0, count: 0 },
      transfer: { label: '📱 Transfer', amount: 0, count: 0 },
      qris: { label: '📲 QRIS', amount: 0, count: 0 },
      card: { label: '💳 Kartu', amount: 0, count: 0 },
      receivable: { label: '👤 Piutang', amount: 0, count: 0 },
    };
    for (const sale of sales) {
      for (const p of sale.payments) {
        if (map[p.method]) {
          map[p.method].amount += p.amount;
          map[p.method].count += 1;
        }
      }
    }
    return Object.entries(map)
      .map(([, v]) => v)
      .filter(v => v.count > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [sales]);

  if (data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <TrendingUp size={15} className="text-teal-500" />
        <p className="text-sm font-bold text-gray-900">Metode Pembayaran</p>
      </div>
      <div className="divide-y divide-gray-50 px-4">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-3 py-3">
            <p className="text-sm font-semibold text-gray-700 flex-1">{d.label}</p>
            <p className="text-xs text-gray-400">{d.count}x</p>
            <p className="text-sm font-black text-gray-900">{fmt(d.amount)}</p>
            <p className="text-xs text-gray-400 w-10 text-right">{((d.amount / total) * 100).toFixed(0)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shift History ────────────────────────────────────────────────────────────
function ShiftHistoryList({ onViewAll }: { onViewAll: () => void }) {
  const { shifts } = usePos();
  const recent = shifts.slice(0, 5);

  if (recent.length === 0) return null;

  const formatDuration = (openedAt: string, closedAt: string | null) => {
    const end = closedAt ? new Date(closedAt) : new Date();
    const diff = end.getTime() - new Date(openedAt).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}j ${m}m`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-indigo-500" />
          <p className="text-sm font-bold text-gray-900">Riwayat Shift</p>
        </div>
        <button onClick={onViewAll} className="text-xs font-bold text-emerald-600 flex items-center gap-1">
          Semua <ArrowUpRight size={11} />
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {recent.map(shift => (
          <div key={shift.id} className="px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-gray-800">{shift.cashierName}</p>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                shift.closedAt ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {shift.closedAt ? 'Selesai' : 'Aktif'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{new Date(shift.openedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
              <span>·</span>
              <span>{formatDuration(shift.openedAt, shift.closedAt)}</span>
              <span>·</span>
              <span className="font-bold text-emerald-600">{fmt(shift.totalSales)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Transaction List ─────────────────────────────────────────────────────────
function TransactionList({ sales }: { sales: PosSale[] }) {
  const [expanded, setExpanded] = useState(false);
  const display = expanded ? sales : sales.slice(0, 10);

  if (sales.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-12 text-center">
      <ShoppingCart size={32} className="mx-auto mb-3 text-gray-200" />
      <p className="text-sm font-bold text-gray-400">Tidak ada transaksi</p>
      <p className="text-xs text-gray-300 mt-1">pada periode yang dipilih</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ReceiptText size={15} className="text-emerald-500" />
          <p className="text-sm font-bold text-gray-900">Riwayat Transaksi</p>
        </div>
        <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {sales.length}
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {display.map(sale => (
          <div key={sale.id} className="px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingCart size={15} className="text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{sale.receiptNumber}</p>
              <p className="text-xs text-gray-400">
                {sale.cashierName} · {new Date(sale.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                {sale.customerName && ` · ${sale.customerName}`}
              </p>
            </div>
            <p className="text-sm font-black text-emerald-600 flex-shrink-0">{fmt(sale.total)}</p>
          </div>
        ))}
      </div>
      {sales.length > 10 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-3 text-xs font-bold text-emerald-600 border-t border-gray-100 flex items-center justify-center gap-1"
        >
          {expanded ? 'Sembunyikan' : `Tampilkan ${sales.length - 10} lainnya`}
        </button>
      )}
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const { sales, setScreen, currentCashier } = usePos();
  const [period, setPeriod] = useState<Period>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'cashiers' | 'products'>('overview');

  const { start, end } = getDateRange(period, customStart, customEnd);

  const filteredSales = useMemo(() =>
    sales.filter(s => {
      const d = new Date(s.createdAt);
      return d >= start && d <= end;
    }),
    [sales, start, end]
  );

  const prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()) - 1);
  const prevEnd = new Date(start.getTime() - 1);
  const prevSales = useMemo(() =>
    sales.filter(s => {
      const d = new Date(s.createdAt);
      return d >= prevStart && d <= prevEnd;
    }),
    [sales, prevStart, prevEnd]
  );

  const currentRevenue = filteredSales.reduce((s, x) => s + x.total, 0);
  const prevRevenue = prevSales.reduce((s, x) => s + x.total, 0);
  const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100) : null;

  const PERIODS: { id: Period; label: string }[] = [
    { id: 'today', label: 'Hari Ini' },
    { id: 'week', label: 'Minggu Ini' },
    { id: '7days', label: '7 Hari' },
    { id: 'month', label: 'Bulan Ini' },
    { id: 'custom', label: 'Kustom' },
  ];

  const TABS = [
    { id: 'overview', label: 'Ringkasan' },
    { id: 'transactions', label: 'Transaksi' },
    { id: 'cashiers', label: 'Kasir' },
    { id: 'products', label: 'Produk' },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-4 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setScreen('dashboard')}
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center active:scale-90"
          >
            <ChevronLeft size={18} className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-black text-lg">Laporan Penjualan</h1>
            <p className="text-blue-200 text-xs font-medium">
              {start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} –{' '}
              {end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          {(currentCashier?.role === 'owner' || currentCashier?.role === 'manager') && (
            <button
              onClick={() => setScreen('export' as any)}
              className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center active:scale-90"
            >
              <Download size={16} className="text-white" />
            </button>
          )}
        </div>

        {/* Revenue Hero */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/10 mb-4">
          <p className="text-blue-200 text-xs font-bold mb-1">Total Pendapatan</p>
          <p className="text-white text-3xl font-black">{fmt(currentRevenue)}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <ShoppingCart size={12} className="text-blue-300" />
              <span className="text-blue-200 text-xs font-semibold">{filteredSales.length} transaksi</span>
            </div>
            {revenueChange !== null && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                revenueChange >= 0 ? 'bg-emerald-400/30 text-emerald-200' : 'bg-red-400/30 text-red-200'
              }`}>
                {revenueChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(revenueChange).toFixed(1)}% vs sebelumnya
              </div>
            )}
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === p.id ? 'bg-white text-blue-700 shadow-sm' : 'bg-white/20 text-white'
              }`}
            >
              {p.id === 'custom' && <Filter size={10} />}
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date picker */}
        {period === 'custom' && (
          <div className="flex gap-2 mt-3">
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="flex-1 bg-white/20 text-white text-xs font-semibold rounded-xl px-3 py-2 outline-none border border-white/30"
            />
            <span className="text-white/60 self-center text-xs">s/d</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="flex-1 bg-white/20 text-white text-xs font-semibold rounded-xl px-3 py-2 outline-none border border-white/30"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-500'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4 pb-24">
        {activeTab === 'overview' && (
          <>
            <SummaryCards sales={filteredSales} />
            <DailyChart sales={sales} days={7} />
            <PaymentBreakdown sales={filteredSales} />
            <ShiftHistoryList onViewAll={() => setScreen('shift-history' as any)} />
          </>
        )}

        {activeTab === 'transactions' && (
          <TransactionList sales={filteredSales} />
        )}

        {activeTab === 'cashiers' && (
          <>
            <PerCashierReport sales={filteredSales} />
            {filteredSales.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-12 text-center">
                <Users size={32} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-bold text-gray-400">Tidak ada data kasir</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'products' && (
          <>
            <TopProducts sales={filteredSales} />
            <PerCategoryReport sales={filteredSales} />
            {filteredSales.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-12 text-center">
                <Package size={32} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-bold text-gray-400">Tidak ada data produk</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
