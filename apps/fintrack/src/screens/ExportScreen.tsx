import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportToExcel } from '../utils/export';
import { formatCurrency } from '../utils/format';
import { Download, FileSpreadsheet, Calendar, TrendingUp, TrendingDown, Wallet, CreditCard, Users, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function ExportScreen() {
  const { transactions, wallets, debts, installments } = useApp();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const filteredTx = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear; });
  const income = filteredTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const activeDebts = debts.filter(d => !d.isPaid).length;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 300));
      exportToExcel(transactions, wallets, debts, installments, selectedMonth, selectedYear);
      setExported(true);
      toast.success(`Laporan ${MONTH_NAMES[selectedMonth]} ${selectedYear} berhasil didownload!`);
      setTimeout(() => setExported(false), 3000);
    } catch { toast.error('Gagal mengekspor laporan'); } finally { setIsExporting(false); }
  };

  const sheetInfo = [
    { icon: '📊', label: 'Ringkasan', desc: 'Total saldo, pemasukan, pengeluaran bulan ini' },
    { icon: '👛', label: 'Dompet', desc: 'Semua dompet & saldo terkini' },
    { icon: '💰', label: 'Transaksi', desc: `Transaksi bulan ${MONTH_NAMES[selectedMonth]}` },
    { icon: '📋', label: 'Semua Transaksi', desc: 'Seluruh riwayat transaksi' },
    { icon: '🤝', label: 'Piutang & Utang', desc: 'Status & progress pembayaran' },
    { icon: '💳', label: 'Cicilan', desc: 'Semua cicilan & progres' },
    { icon: '📈', label: 'Per Kategori', desc: `Rekap kategori bulan ${MONTH_NAMES[selectedMonth]}` },
  ];

  return (
    <div className="pb-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-5 pt-14 pb-28">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center"><FileSpreadsheet size={16} className="text-white" /></div><span className="text-white/70 text-xs font-semibold uppercase tracking-widest">Excel</span></div>
          <h1 className="text-white text-2xl font-black">Export Laporan</h1><p className="text-white/60 text-xs mt-1">Download laporan keuangan lengkap</p>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-2xl px-4 py-3"><p className="text-white/60 text-[10px] font-semibold uppercase">Total Saldo</p><p className="text-white font-black text-base mt-0.5">{formatCurrency(totalBalance)}</p></div>
          <div className="bg-white/10 rounded-2xl px-4 py-3"><p className="text-white/60 text-[10px] font-semibold uppercase">Total Transaksi</p><p className="text-white font-black text-base mt-0.5">{transactions.length}</p></div>
        </div>
      </div>

      <div className="px-4 -mt-16 relative z-10 space-y-4">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-gray-100"><div className="flex items-center gap-2"><Calendar size={15} className="text-blue-600" /><p className="font-black text-gray-900 text-sm">Pilih Periode</p></div></div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-bold mb-2 block">Bulan</label>
              <div className="grid grid-cols-4 gap-2">
                {MONTH_NAMES.map((m, i) => (
                  <button key={i} onClick={() => setSelectedMonth(i)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${selectedMonth === i ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-gray-100 text-gray-500'}`}>
                    {m.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold mb-2 block">Tahun</label>
              <div className="flex gap-2">
                {years.map(y => <button key={y} onClick={() => setSelectedYear(y)} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95 ${selectedYear === y ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-gray-100 text-gray-500'}`}>{y}</button>)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50"><p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Preview — {MONTH_NAMES[selectedMonth]} {selectedYear}</p></div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-2xl p-3.5"><div className="flex items-center gap-2 mb-1.5"><TrendingUp size={13} className="text-emerald-600" /><p className="text-[10px] text-gray-500 font-semibold">Pemasukan</p></div><p className="font-black text-emerald-600 text-sm">{formatCurrency(income)}</p></div>
            <div className="bg-red-50 rounded-2xl p-3.5"><div className="flex items-center gap-2 mb-1.5"><TrendingDown size={13} className="text-red-500" /><p className="text-[10px] text-gray-500 font-semibold">Pengeluaran</p></div><p className="font-black text-red-500 text-sm">{formatCurrency(expense)}</p></div>
            <div className="bg-violet-50 rounded-2xl p-3.5"><div className="flex items-center gap-2 mb-1.5"><Wallet size={13} className="text-violet-600" /><p className="text-[10px] text-gray-500 font-semibold">Dompet</p></div><p className="font-black text-violet-600 text-sm">{wallets.length} dompet</p></div>
            <div className="bg-orange-50 rounded-2xl p-3.5"><div className="flex items-center gap-2 mb-1.5"><Users size={13} className="text-orange-500" /><p className="text-[10px] text-gray-500 font-semibold">Utang/Piutang</p></div><p className="font-black text-orange-500 text-sm">{activeDebts} aktif</p></div>
            <div className="col-span-2 bg-blue-50 rounded-2xl p-3.5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><CreditCard size={13} className="text-blue-600" /><p className="text-[10px] text-gray-500 font-semibold">Transaksi periode ini</p></div><p className="font-black text-blue-600 text-sm">{filteredTx.length} transaksi</p></div></div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50"><div className="flex items-center gap-2"><FileSpreadsheet size={14} className="text-gray-500" /><p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Isi File Excel ({sheetInfo.length} Sheet)</p></div></div>
          <div className="divide-y divide-gray-50">
            {sheetInfo.map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <span className="text-lg w-7 flex-shrink-0">{s.icon}</span>
                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-800">{s.label}</p><p className="text-xs text-gray-400 truncate">{s.desc}</p></div>
                <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleExport} disabled={isExporting}
          className={`w-full py-5 rounded-3xl font-black text-base flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70 shadow-xl ${exported ? 'bg-emerald-500 text-white shadow-emerald-500/40' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/40'}`}>
          {isExporting ? <><Loader2 size={20} className="animate-spin" /> Mengexport...</> : exported ? <><CheckCircle2 size={20} /> Berhasil Didownload!</> : <><Download size={20} /> Download Excel — {MONTH_NAMES[selectedMonth]} {selectedYear}</>}
        </button>

        <p className="text-center text-xs text-gray-400 -mt-1">File akan tersimpan sebagai <span className="font-mono font-bold text-gray-600">FinTrack_{MONTH_NAMES[selectedMonth]}_{selectedYear}.xlsx</span></p>
      </div>
    </div>
  );
}
