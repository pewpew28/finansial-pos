import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Plus, Trash2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function DebtsScreen() {
  const { debts, wallets, addDebt, deleteDebt, payDebt } = useApp();
  const [tab, setTab]               = useState<'receivable' | 'payable'>('receivable');
  const [showModal, setShowModal]   = useState(false);
  const [payModalId, setPayModalId] = useState<string | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [payAmount, setPayAmount]   = useState('');
  const [payWalletId, setPayWalletId] = useState(wallets[0]?.id ?? '');
  const [form, setForm] = useState({
    type: 'receivable' as 'receivable' | 'payable',
    personName: '', amount: '', description: '', dueDate: '',
  });

  const filtered     = useMemo(() => debts.filter(d => d.type === tab), [debts, tab]);
  const activeItems  = filtered.filter(d => !d.isPaid);
  const paidItems    = filtered.filter(d => d.isPaid);
  const totalActive  = activeItems.reduce((s, d) => s + d.remainingAmount, 0);

  const handleSubmit = async () => {
    if (!form.personName || !form.amount) return;
    const amt = parseFloat(form.amount.replace(/\./g, ''));
    await addDebt({
      type: form.type,
      personName: form.personName,
      amount: amt,
      remainingAmount: amt,
      description: form.description,
      dueDate: form.dueDate,
      isPaid: false,
    });
    setShowModal(false);
    setForm({ type: tab, personName: '', amount: '', description: '', dueDate: '' });
  };

  const handlePay = async () => {
    if (!payModalId || !payAmount) return;
    await payDebt(payModalId, parseFloat(payAmount.replace(/\./g, '')));
    setPayModalId(null);
    setPayAmount('');
  };

  const fmt = (v: string) => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const isReceivable = tab === 'receivable';
  const headerGrad   = isReceivable
    ? 'from-cyan-500 to-blue-600'
    : 'from-orange-500 to-red-600';

  const DebtCard = ({ debt }: { debt: typeof debts[0] }) => {
    const pct     = Math.round(((debt.amount - debt.remainingAmount) / debt.amount) * 100);
    const overdue = debt.dueDate && !debt.isPaid && new Date(debt.dueDate) < new Date();
    const barColor = debt.isPaid ? '#10b981' : isReceivable ? '#3b82f6' : '#f97316';

    return (
      <div className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${
        debt.isPaid ? 'border-emerald-100' : overdue ? 'border-red-200' : 'border-gray-100'
      }`}>
        {/* Top band */}
        {!debt.isPaid && (
          <div className="h-1" style={{ background: barColor }} />
        )}

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
              debt.isPaid ? 'bg-emerald-50' : isReceivable ? 'bg-blue-50' : 'bg-orange-50'
            }`}>
              {debt.isPaid ? '✅' : isReceivable ? '🤝' : '💸'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 text-sm">{debt.personName}</p>
              {debt.description && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{debt.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {debt.isPaid ? (
                <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">
                  <CheckCircle2 size={10} /> Lunas
                </span>
              ) : overdue ? (
                <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
                  <AlertCircle size={10} /> Terlambat
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">
                  <Clock size={10} /> Aktif
                </span>
              )}
              <button
                onClick={() => setDeleteId(debt.id)}
                className="w-7 h-7 rounded-xl bg-gray-50 flex items-center justify-center active:scale-90 transition-transform"
              >
                <Trash2 size={11} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Amount info */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 font-medium">Sisa</p>
                <p className="font-black text-gray-900 text-sm">{formatCurrency(debt.remainingAmount)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-medium">Total</p>
                <p className="text-xs font-bold text-gray-500">{formatCurrency(debt.amount)}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>
            <p className="text-[10px] text-gray-400 font-medium text-right">{pct}% terbayar</p>

            {/* Due date & pay button */}
            <div className="flex items-center justify-between mt-1">
              {debt.dueDate ? (
                <p className={`text-xs font-medium ${overdue && !debt.isPaid ? 'text-red-500' : 'text-gray-400'}`}>
                  📅 {formatDate(debt.dueDate)}
                </p>
              ) : <span />}
              {!debt.isPaid && (
                <button
                  onClick={() => { setPayModalId(debt.id); setPayWalletId(wallets[0]?.id ?? ''); setPayAmount(''); }}
                  className={`text-xs px-4 py-2 rounded-xl font-bold text-white transition-all active:scale-90 ${
                    isReceivable ? 'bg-blue-500' : 'bg-orange-500'
                  }`}
                >
                  Bayar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${headerGrad} px-5 pt-14 pb-24`}>
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white text-xl font-black">{isReceivable ? 'Piutang' : 'Utang'}</h1>
            <p className="text-white/60 text-xs mt-0.5">{activeItems.length} aktif · {paidItems.length} lunas</p>
          </div>
          <button
            onClick={() => { setForm(f => ({ ...f, type: tab })); setShowModal(true); }}
            className="w-9 h-9 bg-white rounded-xl flex items-center justify-center active:scale-90 transition-transform shadow"
          >
            <Plus size={16} className={isReceivable ? 'text-blue-600' : 'text-orange-600'} />
          </button>
        </div>
        <div className="mt-4">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Total Belum Lunas</p>
          <p className="text-white text-3xl font-black mt-1">{formatCurrency(totalActive)}</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/60 p-1.5 flex gap-1.5">
          {(['receivable', 'payable'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                tab === t
                  ? t === 'receivable' ? 'bg-blue-500 text-white shadow-sm' : 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-400'
              }`}
            >
              {t === 'receivable' ? '🤝 Piutang' : '💸 Utang'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 mt-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center text-gray-400 shadow-sm">
            <p className="text-5xl mb-3">{isReceivable ? '🤝' : '💸'}</p>
            <p className="font-bold text-gray-600">Tidak ada {isReceivable ? 'piutang' : 'utang'}</p>
            <p className="text-sm mt-1">Ketuk + untuk menambah data</p>
          </div>
        ) : (
          <>
            {activeItems.length > 0 && (
              <div className="space-y-3">
                {activeItems.map(d => <DebtCard key={d.id} debt={d} />)}
              </div>
            )}
            {paidItems.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 mt-4 px-1">Sudah Lunas</p>
                <div className="space-y-3 opacity-60">
                  {paidItems.map(d => <DebtCard key={d.id} debt={d} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setForm(f => ({ ...f, type: tab })); setShowModal(true); }}
        className={`fixed bottom-24 right-4 w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center z-[90] active:scale-90 transition-transform ${
          isReceivable ? 'bg-blue-500 shadow-blue-500/40' : 'bg-orange-500 shadow-orange-500/40'
        }`}
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* Add Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Tambah ${form.type === 'receivable' ? 'Piutang' : 'Utang'}`}>
        <div className="space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
            {(['receivable', 'payable'] as const).map(t => (
              <button
                key={t}
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  form.type === t
                    ? t === 'receivable' ? 'bg-blue-500 text-white shadow' : 'bg-orange-500 text-white shadow'
                    : 'text-gray-400'
                }`}
              >
                {t === 'receivable' ? '🤝 Piutang' : '💸 Utang'}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold">
              Nama {form.type === 'receivable' ? 'Peminjam' : 'Pemberi Pinjaman'}
            </label>
            <input
              type="text"
              value={form.personName}
              onChange={e => setForm(f => ({ ...f, personName: e.target.value }))}
              placeholder="Nama orang / lembaga"
              className="w-full mt-1.5 px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-sm bg-gray-50 font-semibold"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold">Jumlah</label>
            <div className="relative mt-1.5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: fmt(e.target.value) }))}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl text-xl font-black outline-none focus:border-violet-400 bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold">Keterangan <span className="text-gray-400 font-normal">(opsional)</span></label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Untuk keperluan apa?"
              className="w-full mt-1.5 px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-sm bg-gray-50"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold">Jatuh Tempo <span className="text-gray-400 font-normal">(opsional)</span></label>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="w-full mt-1.5 px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-sm bg-gray-50 font-medium text-gray-700"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!form.personName || !form.amount}
            className={`w-full py-4 rounded-2xl font-black text-sm text-white active:scale-95 transition-all disabled:bg-gray-100 disabled:text-gray-400 ${
              form.type === 'receivable' ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 'bg-orange-500 shadow-lg shadow-orange-500/30'
            }`}
          >
            Simpan
          </button>
        </div>
      </Modal>

      {/* Pay Modal */}
      <Modal isOpen={!!payModalId} onClose={() => setPayModalId(null)} title="Catat Pembayaran">
        <div className="space-y-4">
          {payModalId && (() => {
            const debt = debts.find(d => d.id === payModalId);
            if (!debt) return null;
            return (
              <>
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">NAMA</p>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">{debt.personName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-semibold">SISA HUTANG</p>
                    <p className="font-black text-gray-900 text-sm mt-0.5">{formatCurrency(debt.remainingAmount)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 font-semibold">Jumlah Bayar</label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={payAmount}
                      onChange={e => setPayAmount(fmt(e.target.value))}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl text-xl font-black outline-none focus:border-emerald-400 bg-gray-50"
                    />
                  </div>
                  <button
                    onClick={() => setPayAmount(String(debt.remainingAmount).replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
                    className="text-xs text-violet-600 font-bold mt-2 px-2"
                  >
                    Bayar lunas ({formatCurrency(debt.remainingAmount)})
                  </button>
                </div>

                {wallets.length > 1 && (
                  <div>
                    <label className="text-xs text-gray-500 font-semibold">Dari Dompet</label>
                    <select
                      value={payWalletId}
                      onChange={e => setPayWalletId(e.target.value)}
                      className="w-full mt-1.5 px-4 py-3.5 border-2 border-gray-100 rounded-2xl outline-none focus:border-violet-400 text-sm bg-gray-50 font-semibold text-gray-700"
                    >
                      {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                )}

                <button
                  onClick={handlePay}
                  disabled={!payAmount}
                  className="w-full py-4 bg-emerald-500 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
                >
                  Konfirmasi Pembayaran
                </button>
              </>
            );
          })()}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteDebt(deleteId); }}
        title="Hapus Data?"
        message="Data piutang/utang ini akan dihapus permanen."
      />
    </div>
  );
}
