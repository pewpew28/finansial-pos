import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateShort } from '../utils/format';
import { TrendingUp, TrendingDown, RefreshCw, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const PIE_COLORS = ['#7c3aed','#a855f7','#ec4899','#f43f5e','#f97316'];

export default function DashboardScreen() {
  const { wallets, transactions, debts, installments, settings, syncData, isSyncing } = useApp();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const totalBalance = useMemo(() => wallets.reduce((s, w) => s + w.balance, 0), [wallets]);
  const monthlyStats = useMemo(() => {
    const monthly = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; });
    return { income: monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), expense: monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) };
  }, [transactions, currentMonth, currentYear]);
  const chartData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const dayTx = transactions.filter(t => new Date(t.date).toDateString() === key);
    return { date: `${d.getDate()}/${d.getMonth() + 1}`, income: dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), expense: dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) };
  }), [transactions]);
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth).forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));
  }, [transactions, currentMonth]);
  const totalReceivable = debts.filter(d => d.type === 'receivable' && !d.isPaid).reduce((s, d) => s + d.remainingAmount, 0);
  const totalPayable = debts.filter(d => d.type === 'payable' && !d.isPaid).reduce((s, d) => s + d.remainingAmount, 0);
  const totalMonthlyInstall = installments.filter(i => i.status === 'active').reduce((s, i) => s + i.monthlyAmount, 0);
  const recentTx = transactions.slice(0, 5);
  const WALLET_ICON_LIST: Record<string, string> = { wallet: '👛', card: '💳', bank: '🏦', piggy: '🐷', bag: '💼', phone: '📱', star: '⭐', dollar: '💵', gem: '💎', chart: '📈' };

  return (
    <div className="pb-4">
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-700 px-5 pt-14 pb-28">
        <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-white/60 text-sm font-medium">Selamat datang 👋</p>
            <h1 className="text-white text-xl font-black mt-0.5">{settings.userName}</h1>
          </div>
          <button onClick={syncData} className={`w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center active:scale-90 transition-transform ${isSyncing ? 'animate-spin' : ''}`}>
            <RefreshCw size={16} className="text-white" />
          </button>
        </div>
        <div className="relative mt-6">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Total Saldo</p>
          <p className="text-white text-4xl font-black mt-1 tracking-tight">{formatCurrency(totalBalance)}</p>
          <p className="text-white/50 text-xs mt-2">{MONTH_NAMES[currentMonth]} {currentYear}</p>
        </div>
      </div>
      <div className="px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-purple-900/10 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 bg-emerald-500 rounded-xl flex items-center justify-center"><TrendingUp size={13} className="text-white" /></div><span className="text-xs text-gray-500 font-medium">Pemasukan</span></div>
              <p className="font-black text-emerald-600 text-base">{formatCurrency(monthlyStats.income)}</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 bg-red-500 rounded-xl flex items-center justify-center"><TrendingDown size={13} className="text-white" /></div><span className="text-xs text-gray-500 font-medium">Pengeluaran</span></div>
              <p className="font-black text-red-500 text-base">{formatCurrency(monthlyStats.expense)}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 mt-4 space-y-4">
        {wallets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-bold text-gray-800">Dompet Saya</h2><span className="text-xs text-violet-600 font-semibold">{wallets.length} dompet</span></div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
              {wallets.map((w, idx) => (
                <div key={w.id} className="flex-shrink-0 w-44 rounded-2xl p-4 text-white relative overflow-hidden" style={{ background: w.color }}>
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                  <div className="text-2xl mb-3">{WALLET_ICON_LIST[w.icon] ?? '👛'}</div>
                  <p className="text-white/80 text-xs font-medium truncate">{w.name}</p>
                  <p className="font-black text-sm mt-0.5 truncate">{formatCurrency(w.balance)}</p>
                  {idx === 0 && <div className="absolute top-3 right-3"><span className="text-[9px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-bold">UTAMA</span></div>}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 text-center"><p className="text-lg font-black text-blue-500">🤝</p><p className="text-[10px] text-gray-400 font-medium mt-1">Piutang</p><p className="font-black text-blue-600 text-[11px] mt-0.5">{formatCurrency(totalReceivable)}</p></div>
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 text-center"><p className="text-lg font-black text-orange-500">💸</p><p className="text-[10px] text-gray-400 font-medium mt-1">Utang</p><p className="font-black text-orange-600 text-[11px] mt-0.5">{formatCurrency(totalPayable)}</p></div>
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 text-center"><p className="text-lg font-black text-violet-500">💳</p><p className="text-[10px] text-gray-400 font-medium mt-1">Cicilan/bln</p><p className="font-black text-violet-600 text-[11px] mt-0.5">{formatCurrency(totalMonthlyInstall)}</p></div>
        </div>
        {transactions.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-1"><h2 className="text-sm font-bold text-gray-800">Tren 7 Hari</h2><div className="flex items-center gap-3 text-[10px] text-gray-400"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Masuk</span><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Keluar</span></div></div>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={chartData} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity={0.35} /><stop offset="100%" stopColor="#34d399" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f87171" stopOpacity={0.35} /><stop offset="100%" stopColor="#f87171" stopOpacity={0} /></linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: 11, background: '#1e1b4b', color: '#fff' }} labelStyle={{ color: '#a78bfa', fontWeight: 700 }} />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#gIncome)" dot={false} name="Pemasukan" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#gExpense)" dot={false} name="Pengeluaran" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-bold text-gray-800 mb-3">Pengeluaran per Kategori</h2>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <PieChart width={96} height={96}><Pie data={categoryData} cx={43} cy={43} innerRadius={26} outerRadius={44} paddingAngle={3} dataKey="value">{categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie></PieChart>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {categoryData.map((cat, i) => { const total = categoryData.reduce((s, c) => s + c.value, 0); const pct = Math.round((cat.value / total) * 100); return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <div className="flex-1 min-w-0"><div className="flex items-center justify-between"><span className="text-xs text-gray-600 font-medium truncate">{cat.name}</span><span className="text-[10px] text-gray-400 ml-1">{pct}%</span></div><div className="w-full h-1 bg-gray-100 rounded-full mt-0.5"><div className="h-1 rounded-full" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} /></div></div>
                  </div>
                ); })}
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50"><h2 className="text-sm font-bold text-gray-800">Transaksi Terbaru</h2><ChevronRight size={15} className="text-gray-400" /></div>
          {recentTx.length === 0 ? (<div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">💳</p><p className="text-sm font-medium">Belum ada transaksi</p></div>) : (
            <div className="divide-y divide-gray-50">
              {recentTx.map(tx => { const wallet = wallets.find(w => w.id === tx.walletId); return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'}`}>{tx.type === 'income' ? <ArrowUpRight size={15} className="text-emerald-500" /> : <ArrowDownRight size={15} className="text-red-500" />}</div>
                  <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-800 truncate">{tx.description || tx.category}</p><p className="text-[10px] text-gray-400">{formatDateShort(tx.date)} · {wallet?.name ?? '-'}</p></div>
                  <p className={`text-xs font-black flex-shrink-0 ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}</p>
                </div>
              ); })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
