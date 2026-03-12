import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/format';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Search, SlidersHorizontal } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Transaction } from '../types';

type FilterType = 'all' | 'income' | 'expense';

export default function TransactionsScreen() {
  const { transactions, wallets, addTransaction, deleteTransaction } = useApp();
  const [showModal, setShowModal]   = useState(false);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [search, setSearch]         = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    walletId: wallets[0]?.id ?? '',
    date: new Date().toISOString().split('T')[0],
  });

  const filtered = useMemo(() => transactions.filter(t => {
    const matchType   = filterType === 'all' || t.type === filterType;
    const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  }), [transactions, filterType, search]);

  const grouped = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    filtered.forEach(t => {
      const key = t.date.split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const totalIncome  = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions]);

  const openModal = () => {
    setForm({ type: 'expense', amount: '', category: '', description: '', walletId: wallets[0]?.id ?? '', date: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.amount || !form.walletId || !form.category) return;
    await addTransaction({
      type: form.type,
      amount: parseFloat(form.amount.replace(/\./g, '')),
      category: form.category,
      description: form.description,
      walletId: form.walletId,
      date: form.date,
    });
    setShowModal(false);
  };

  const formatAmount = (val: string) => val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const filterLabels: Record<FilterType, string> = { all: 'Semua', income: 'Pemasukan', expense: 'Pengeluaran' };
  const filterColors: Record<FilterType, string> = {
    all: 'bg-violet-600 text-white',
    income: 'bg-emerald-500 text-white',
    expense: 'bg-red-500 text-white',
  };

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 px-5 pt-14 pb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-white text-xl font-black">Transaksi</h1>
            <p className="text-white/60 text-xs mt-0.5">{transactions.length} total transaksi</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(s => !s)} className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
              <Search size={16} className="text-white" />
            </button>
            <button onClick={openModal} className="w-9 h-9 bg-white rounded-xl flex items-center justify-center active:scale-90 transition-transform shadow">
              <Plus size={16} className="text-violet-600" />
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 bg-white/10 rounded-2xl px-3 py-2.5">
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide">Total Masuk</p>
            <p className="text-white font-black text-sm mt-0.5">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-2xl px-3 py-2.5">
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide">Total Keluar</p>
            <p className="text-white font-black text-sm mt-0.5">{formatCurrency(totalExpense)}</p>
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="px-4 pt-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kategori atau keterangan..." autoFocus
              className="w-full bg-white border border-gray-200 rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-violet-400 transition" />
          </div>
        </div>
      )}

      <div className="px-4 pt-3 flex gap-2">
        {(['all', 'income', 'expense'] as FilterType[]).map(f => (
          <button key={f} onClick={() => setFilterType(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${filterType === f ? filterColors[f] : 'bg-white text-gray-500 border border-gray-200'}`}>
            {filterLabels[f]}
          </button>
        ))}
        <button className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl flex-shrink-0">
          <SlidersHorizontal size={14} className="text-gray-400" />
        </button>
      </div>

      <div className="px-4 mt-3">
        {grouped.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">💸</p>
            <p className="font-bold text-gray-600">Belum ada transaksi</p>
            <p className="text-sm mt-1">Ketuk + untuk menambah transaksi</p>
          </div>
        ) : (
          grouped.map(([date, txs]) => {
            const dayIncome  = txs.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
            const dayExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            return (
              <div key={date} className="mb-4">
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-xs font-bold text-gray-500">{formatDate(date)}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    {dayIncome  > 0 && <span className="text-emerald-500">+{formatCurrency(dayIncome)}</span>}
                    {dayExpense > 0 && <span className="text-red-500">-{formatCurrency(dayExpense)}</span>}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {txs.map((tx, idx) => {
                    const wallet = wallets.find(w => w.id === tx.walletId);
                    return (
                      <div key={tx.id} className={`flex items-center gap-3 px-4 py-3 ${idx < txs.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                          {tx.type === 'income' ? <ArrowUpRight size={15} className="text-emerald-500" /> : <ArrowDownRight size={15} className="text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{tx.description || tx.category}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md font-medium">{tx.category}</span>
                            {wallet && <span className="text-[10px] text-gray-400">· {wallet.name}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <p className={`text-sm font-black ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                          <button onClick={() => setDeleteId(tx.id)} className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center active:scale-90 transition-transform">
                            <Trash2 size={11} className="text-gray-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <button onClick={openModal} className="fixed bottom-24 right-4 w-14 h-14 bg-violet-600 rounded-2xl shadow-lg shadow-violet-500/40 flex items-center justify-center z-[90] active:scale-90 transition-transform">
        <Plus size={24} className="text-white" />
      </button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Transaksi">
        <div className="space-y-4">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
            {(['expense', 'income'] as const).map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category: '' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${form.type === t ? t === 'income' ? 'bg-emerald-500 text-white shadow' : 'bg-red-500 text-white shadow' : 'text-gray-400'}`}>
                {t === 'income' ? '↑ Pemasukan' : '↓ Pengeluaran'}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-500 font-semibold">Jumlah</label>
            <div className="relative mt-1.5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Rp</span>
              <input type="text" inputMode="numeric" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: formatAmount(e.target.value) }))} placeholder="0"
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl text-xl font-black outline-none focus:border-violet-400 transition bg-gray-50" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-semibold">Kategori</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${form.category === c ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-semibold">Dompet</label>
            <select value={form.walletId} onChange={e => setForm(f => ({ ...f, walletId: e.target.value }))}
              className="w-full mt-1.5 px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-sm font-semibold bg-gray-50 text-gray-700">
              {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-semibold">Keterangan <span className="text-gray-400 font-normal">(opsional)</span></label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Contoh: Makan siang bareng teman"
              className="w-full mt-1.5 px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-sm bg-gray-50" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-semibold">Tanggal</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full mt-1.5 px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-sm bg-gray-50 font-medium text-gray-700" />
          </div>
          <button onClick={handleSubmit} disabled={!form.amount || !form.walletId || !form.category}
            className={`w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${!form.amount || !form.walletId || !form.category ? 'bg-gray-100 text-gray-400' : form.type === 'income' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-red-500 text-white shadow-lg shadow-red-500/30'}`}>
            Simpan Transaksi
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) deleteTransaction(deleteId); }}
        title="Hapus Transaksi?" message="Transaksi akan dihapus dan saldo dompet akan disesuaikan kembali." />
    </div>
  );
}
