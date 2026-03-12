import { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, ShoppingCart, X, Plus, Minus, ChevronDown,
  CreditCard, Banknote, QrCode, Smartphone, UserRound,
  Tag, Trash2, CheckCircle2,
  ScanLine, Percent, LayoutGrid, List,
  AlertTriangle, Clock,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { CartItem, PaymentMethod, SalePayment, PosSale } from '../types';
import { generateReceiptNumber } from '../utils/storage';
import ReceiptModal from '../components/ReceiptModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const fmtNum = (v: number) =>
  new Intl.NumberFormat('id-ID').format(v);

// ─── Payment Method Config ────────────────────────────────────────────────────
const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: 'cash',       label: 'Tunai',    icon: <Banknote size={18} />,    color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { id: 'transfer',   label: 'Transfer', icon: <Smartphone size={18} />,  color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
  { id: 'qris',       label: 'QRIS',     icon: <QrCode size={18} />,      color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-200' },
  { id: 'card',       label: 'Kartu',    icon: <CreditCard size={18} />,  color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200' },
  { id: 'receivable', label: 'Piutang',  icon: <UserRound size={18} />,   color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
];

// ─── Item Discount Modal ──────────────────────────────────────────────────────
function ItemDiscountModal({
  item, onSave, onClose,
}: {
  item: CartItem;
  onSave: (discountPercent: number, discountAmount: number, note: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'percent' | 'amount'>(item.discountPercent > 0 ? 'percent' : 'amount');
  const [value, setValue] = useState(
    item.discountPercent > 0 ? String(item.discountPercent) :
    item.discountAmount > 0 ? String(item.discountAmount) : ''
  );
  const [note, setNote] = useState(item.note);

  const basePrice = item.price * item.quantity;
  const discountValue = Number(value) || 0;
  const discountAmount = mode === 'percent' ? (basePrice * discountValue / 100) : discountValue;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleSave = () => {
    const dp = mode === 'percent' ? discountValue : 0;
    const da = mode === 'amount' ? discountValue : (basePrice * discountValue / 100);
    onSave(dp, da, note);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ maxWidth: '512px', margin: '0 auto', left: 0, right: 0 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl p-5 shadow-2xl">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <h3 className="font-black text-gray-900 text-base mb-1">Diskon & Catatan</h3>
        <p className="text-xs text-gray-400 mb-4 font-medium truncate">{item.productName}</p>

        {/* Discount type toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          {(['percent', 'amount'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setValue(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
            >
              {m === 'percent' ? '% Persen' : 'Rp Nominal'}
            </button>
          ))}
        </div>

        {/* Discount input */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
            {mode === 'percent' ? 'Diskon (%)' : 'Diskon (Rp)'}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-bold">{mode === 'percent' ? '%' : 'Rp'}</span>
            <input
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="0"
              className="flex-1 text-xl font-black text-gray-900 bg-transparent outline-none"
              autoFocus
            />
          </div>
          {discountValue > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs">
              <span className="text-gray-400 font-medium">Harga awal</span>
              <span className="font-bold text-gray-700">{fmt(basePrice)}</span>
            </div>
          )}
          {discountValue > 0 && (
            <div className="flex justify-between text-xs mt-1.5">
              <span className="text-red-400 font-medium">Diskon</span>
              <span className="font-bold text-red-500">- {fmt(discountAmount)}</span>
            </div>
          )}
          {discountValue > 0 && (
            <div className="flex justify-between text-xs mt-1.5 pt-1.5 border-t border-gray-200">
              <span className="text-gray-700 font-bold">Harga akhir</span>
              <span className="font-black text-emerald-600">{fmt(finalPrice)}</span>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Catatan Item</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. tidak pedas, ukuran L..."
            className="w-full text-sm text-gray-800 bg-transparent outline-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm">
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-violet-500/30"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────
function CheckoutModal({
  cart,
  subtotal,
  discountPercent,
  discountAmount,
  taxAmount,
  total,
  onSuccess,
  onClose,
}: {
  cart: CartItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  onSuccess: (sale: PosSale) => void;
  onClose: () => void;
}) {
  const { store, currentCashier, currentShift, addSale } = usePos();
  const [step, setStep] = useState<'payment' | 'processing'>('payment');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [splitMode, setSplitMode] = useState(false);
  const [cashInput, setCashInput] = useState('');

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = total - totalPaid;
  const cashValue = Number(cashInput.replace(/\D/g, '')) || 0;
  const change = selectedMethod === 'cash' && !splitMode ? Math.max(0, cashValue - total) : 0;

  const quickAmounts = useMemo(() => {
    const amounts = [total];
    const rounded = [
      Math.ceil(total / 5000) * 5000,
      Math.ceil(total / 10000) * 10000,
      Math.ceil(total / 50000) * 50000,
      Math.ceil(total / 100000) * 100000,
    ].filter((v, i, arr) => v !== total && arr.indexOf(v) === i);
    return [...amounts, ...rounded].slice(0, 4);
  }, [total]);

  const canConfirm = () => {
    if (splitMode) return totalPaid >= total;
    if (selectedMethod === 'cash') return cashValue >= total;
    return true;
  };

  const addPayment = () => {
    if (splitMode && remaining > 0) {
      const amount = Math.min(cashValue, remaining);
      setPayments(prev => [...prev, { method: selectedMethod, amount, walletId: '' }]);
      setCashInput('');
    }
  };

  const handleConfirm = async () => {
    if (!canConfirm()) return;
    setStep('processing');

    let finalPayments: SalePayment[];
    if (splitMode) {
      finalPayments = payments;
    } else {
      finalPayments = [{
        method: selectedMethod,
        amount: selectedMethod === 'cash' ? cashValue : total,
        walletId: '',
      }];
    }

    const sale: Omit<PosSale, 'id' | 'createdAt'> = {
      receiptNumber: generateReceiptNumber(),
      cashierId: currentCashier?.id ?? '',
      cashierName: currentCashier?.name ?? '',
      shiftId: currentShift?.id ?? '',
      customerName,
      items: cart,
      subtotal,
      discountPercent,
      discountAmount,
      taxPercent: store.taxEnabled ? store.taxPercent : 0,
      taxAmount,
      total,
      payments: finalPayments,
      change: selectedMethod === 'cash' && !splitMode ? change : 0,
      notes,
      syncedToFintrack: false,
    };

    await addSale(sale);
    onSuccess({ ...sale, id: '', createdAt: new Date().toISOString() });
  };

  return createPortal(
    <div className="fixed inset-0 z-[250] flex flex-col justify-end" style={{ maxWidth: '512px', margin: '0 auto', left: 0, right: 0 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[95dvh] flex flex-col">
        {/* Handle */}
        <div className="flex-shrink-0 pt-3 pb-1 px-5">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-900 text-lg">Pembayaran</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {step === 'processing' ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-5">
            <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-5 animate-bounce">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <p className="font-black text-gray-900 text-xl mb-1">Memproses...</p>
            <p className="text-sm text-gray-400">Mohon tunggu sebentar</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            {/* Order summary */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">{cart.reduce((s, i) => s + i.quantity, 0)} item</span>
                <span className="font-bold text-gray-800">{fmt(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-400 font-medium">Diskon {discountPercent > 0 ? `(${discountPercent}%)` : ''}</span>
                  <span className="font-bold text-red-500">- {fmt(discountAmount)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">PPN ({store.taxPercent}%)</span>
                  <span className="font-bold text-gray-700">{fmt(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                <span className="font-black text-gray-900 text-base">Total</span>
                <span className="font-black text-emerald-600 text-xl">{fmt(total)}</span>
              </div>
            </div>

            {/* Customer name */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserRound size={16} className="text-violet-600" />
              </div>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Nama pelanggan (opsional)"
                className="flex-1 text-sm text-gray-800 bg-transparent outline-none font-medium"
              />
            </div>

            {/* Split payment toggle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-700">Split Payment</span>
              <button
                onClick={() => { setSplitMode(!splitMode); setPayments([]); setCashInput(''); }}
                className={`w-12 h-6 rounded-full transition-colors relative ${splitMode ? 'bg-emerald-500' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${splitMode ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Payment methods */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all ${
                    selectedMethod === m.id ? m.bg + ' border-current ' + m.color : 'bg-gray-50 border-transparent text-gray-400'
                  }`}
                >
                  <span className={selectedMethod === m.id ? m.color : 'text-gray-400'}>{m.icon}</span>
                  <span className="text-[9px] font-bold leading-tight text-center">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Split payment list */}
            {splitMode && payments.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-3 mb-4 space-y-2">
                {payments.map((p, i) => {
                  const pm = PAYMENT_METHODS.find(m => m.id === p.method);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${pm?.color}`}>{pm?.label}</span>
                      <span className="flex-1 text-right text-sm font-black text-gray-800">{fmt(p.amount)}</span>
                      <button onClick={() => setPayments(prev => prev.filter((_, j) => j !== i))} className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                        <X size={12} className="text-red-500" />
                      </button>
                    </div>
                  );
                })}
                <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-bold">
                  <span className="text-gray-500">Sisa</span>
                  <span className={remaining > 0 ? 'text-red-500' : 'text-emerald-600'}>{fmt(remaining)}</span>
                </div>
              </div>
            )}

            {/* Cash input */}
            {(selectedMethod === 'cash' || splitMode) && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  {splitMode ? `Bayar dengan ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}` : 'Uang Diterima'}
                </label>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-400 font-bold text-sm">Rp</span>
                  <input
                    type="number"
                    value={cashInput}
                    onChange={e => setCashInput(e.target.value)}
                    placeholder="0"
                    className="flex-1 text-2xl font-black text-gray-900 bg-transparent outline-none"
                  />
                  {cashInput && (
                    <button onClick={() => setCashInput('')} className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                      <X size={12} className="text-gray-500" />
                    </button>
                  )}
                </div>

                {/* Quick amounts */}
                {!splitMode && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {quickAmounts.map(amount => (
                      <button
                        key={amount}
                        onClick={() => setCashInput(String(amount))}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          cashInput === String(amount)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-700'
                        }`}
                      >
                        {amount === total ? 'Pas' : fmtNum(amount)}
                      </button>
                    ))}
                  </div>
                )}

                {!splitMode && cashInput && cashValue >= total && (
                  <div className="flex justify-between items-center bg-emerald-50 rounded-xl px-3 py-2">
                    <span className="text-xs font-bold text-emerald-600">Kembalian</span>
                    <span className="text-base font-black text-emerald-600">{fmt(change)}</span>
                  </div>
                )}

                {!splitMode && cashInput && cashValue < total && (
                  <div className="flex justify-between items-center bg-red-50 rounded-xl px-3 py-2">
                    <span className="text-xs font-bold text-red-500">Kurang</span>
                    <span className="text-base font-black text-red-500">{fmt(total - cashValue)}</span>
                  </div>
                )}

                {splitMode && cashInput && (
                  <button
                    onClick={addPayment}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold"
                  >
                    + Tambah Pembayaran {fmt(Math.min(cashValue, remaining))}
                  </button>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Catatan</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Catatan untuk transaksi ini..."
                className="w-full text-sm text-gray-800 bg-transparent outline-none"
              />
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={!canConfirm()}
              className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 ${
                canConfirm()
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30 active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 size={20} />
              Konfirmasi Pembayaran · {fmt(total)}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({
  cart,
  onUpdateItem,
  onUpdateItemDiscount,
  onRemoveItem,
  onClearCart,
  onCheckout,
  discountPercent,
  discountAmount,
  onDiscountChange,
  subtotal,
  taxAmount,
  total,
  onClose,
}: {
  cart: CartItem[];
  onUpdateItem: (productId: string, qty: number) => void;
  onUpdateItemDiscount: (productId: string, dp: number, da: number, note: string) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  discountPercent: number;
  discountAmount: number;
  onDiscountChange: (dp: number, da: number) => void;
  subtotal: number;
  taxAmount: number;
  total: number;
  onClose: () => void;
}) {
  const { store } = usePos();
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [discountMode, setDiscountMode] = useState<'percent' | 'amount'>('percent');
  const [discountInput, setDiscountInput] = useState(discountPercent > 0 ? String(discountPercent) : discountAmount > 0 ? String(discountAmount) : '');
  const [showDiscount, setShowDiscount] = useState(false);

  const applyDiscount = (val: string, mode: 'percent' | 'amount') => {
    const v = Number(val) || 0;
    if (mode === 'percent') onDiscountChange(v, subtotal * v / 100);
    else onDiscountChange(0, v);
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col justify-end" style={{ maxWidth: '512px', margin: '0 auto', left: 0, right: 0 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-emerald-600" />
              <h3 className="font-black text-gray-900">Keranjang</h3>
              <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[10px] font-black">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button onClick={onClearCart} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-500 text-xs font-bold">
                  <Trash2 size={12} />
                  Kosongkan
                </button>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={15} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingCart size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-bold text-gray-400">Keranjang kosong</p>
              <p className="text-xs text-gray-300 mt-1">Tap produk untuk menambahkan</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="bg-gray-50 rounded-2xl p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-400 font-medium">{fmt(item.price)} / item</p>
                    {item.note && (
                      <p className="text-xs text-violet-500 mt-0.5 font-medium">📝 {item.note}</p>
                    )}
                    {(item.discountPercent > 0 || item.discountAmount > 0) && (
                      <div className="flex items-center gap-1 mt-1">
                        <Tag size={10} className="text-red-400" />
                        <span className="text-[10px] text-red-400 font-bold">
                          Diskon {item.discountPercent > 0 ? `${item.discountPercent}%` : fmt(item.discountAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-black text-emerald-600">{fmt(item.subtotal)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2.5">
                  {/* Qty controls */}
                  <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1">
                    <button
                      onClick={() => item.quantity <= 1 ? onRemoveItem(item.productId) : onUpdateItem(item.productId, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center active:scale-90 transition-all"
                    >
                      {item.quantity <= 1 ? <Trash2 size={12} className="text-red-400" /> : <Minus size={12} className="text-gray-600" />}
                    </button>
                    <span className="w-7 text-center text-sm font-black text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateItem(item.productId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center active:scale-90 transition-all"
                    >
                      <Plus size={12} className="text-white" />
                    </button>
                  </div>

                  {/* Edit item button */}
                  <button
                    onClick={() => setEditingItem(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-600 text-xs font-bold"
                  >
                    <Tag size={11} />
                    {(item.discountPercent > 0 || item.discountAmount > 0) ? 'Edit Diskon' : 'Diskon'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {cart.length > 0 && (
          <div className="flex-shrink-0 px-5 pt-3 pb-5 border-t border-gray-100 space-y-3">
            {/* Global discount */}
            <button
              onClick={() => setShowDiscount(!showDiscount)}
              className="w-full flex items-center justify-between py-2 px-3 bg-orange-50 rounded-xl border border-orange-100"
            >
              <div className="flex items-center gap-2">
                <Percent size={14} className="text-orange-500" />
                <span className="text-xs font-bold text-orange-600">Diskon Keseluruhan</span>
              </div>
              <div className="flex items-center gap-2">
                {(discountPercent > 0 || discountAmount > 0) && (
                  <span className="text-xs font-black text-orange-600">
                    {discountPercent > 0 ? `${discountPercent}%` : fmt(discountAmount)}
                  </span>
                )}
                <ChevronDown size={14} className={`text-orange-400 transition-transform ${showDiscount ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {showDiscount && (
              <div className="bg-orange-50 rounded-2xl p-3 border border-orange-100">
                <div className="flex bg-white rounded-xl p-1 mb-3">
                  {(['percent', 'amount'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => { setDiscountMode(m); setDiscountInput(''); onDiscountChange(0, 0); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${discountMode === m ? 'bg-orange-500 text-white' : 'text-gray-400'}`}
                    >
                      {m === 'percent' ? '% Persen' : 'Rp Nominal'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
                  <span className="text-gray-400 text-sm font-bold">{discountMode === 'percent' ? '%' : 'Rp'}</span>
                  <input
                    type="number"
                    value={discountInput}
                    onChange={e => { setDiscountInput(e.target.value); applyDiscount(e.target.value, discountMode); }}
                    placeholder="0"
                    className="flex-1 text-base font-black text-gray-900 bg-transparent outline-none"
                  />
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Subtotal</span>
                <span className="font-bold text-gray-700">{fmt(subtotal)}</span>
              </div>
              {(discountPercent > 0 || discountAmount > 0) && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-400 font-medium">Diskon {discountPercent > 0 ? `(${discountPercent}%)` : ''}</span>
                  <span className="font-bold text-red-500">- {fmt(discountAmount)}</span>
                </div>
              )}
              {store.taxEnabled && taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">PPN ({store.taxPercent}%)</span>
                  <span className="font-bold text-gray-700">{fmt(taxAmount)}</span>
                </div>
              )}
            </div>

            {/* Total & checkout */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium">Total</p>
                <p className="text-xl font-black text-emerald-600">{fmt(total)}</p>
              </div>
              <button
                onClick={onCheckout}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/30 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                <CreditCard size={16} />
                Bayar
              </button>
            </div>
          </div>
        )}
      </div>

      {editingItem && (
        <ItemDiscountModal
          item={editingItem}
          onSave={(dp, da, note) => {
            onUpdateItemDiscount(editingItem.productId, dp, da, note);
            setEditingItem(null);
          }}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>,
    document.body
  );
}

// ─── Main Cashier Screen ──────────────────────────────────────────────────────
export default function CashierScreen() {
  const { products, categories, currentShift, store } = usePos();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [completedSale, setCompletedSale] = useState<PosSale | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ─── Cart Calculations ──────────────────────────────────────────────────
  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const effectiveDiscount = discountPercent > 0 ? subtotal * discountPercent / 100 : discountAmount;
  const taxBase = subtotal - effectiveDiscount;
  const taxAmount = store.taxEnabled ? taxBase * store.taxPercent / 100 : 0;
  const total = taxBase + taxAmount;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  // ─── Filtered Products ──────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.isActive) return false;
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const activeCategories = categories.filter(c => c.isActive);

  // ─── Cart Actions ───────────────────────────────────────────────────────
  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (product.stock === 0) return;

    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty > product.stock) return prev; // don't exceed stock
        return prev.map(i => i.productId === productId
          ? { ...i, quantity: newQty, subtotal: Math.max(0, i.price * newQty - i.discountAmount) }
          : i
        );
      }
      return [...prev, {
        productId,
        productName: product.name,
        price: product.price,
        quantity: 1,
        discountPercent: 0,
        discountAmount: 0,
        note: '',
        subtotal: product.price,
      }];
    });
  };

  const updateItemQty = (productId: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (qty > product.stock) return;
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const basePrice = i.price * qty;
      const discount = i.discountPercent > 0 ? basePrice * i.discountPercent / 100 : i.discountAmount;
      return { ...i, quantity: qty, subtotal: Math.max(0, basePrice - discount) };
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const updateItemDiscount = (productId: string, dp: number, da: number, note: string) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const basePrice = i.price * i.quantity;
      const discountAmt = dp > 0 ? basePrice * dp / 100 : da;
      return { ...i, discountPercent: dp, discountAmount: discountAmt, note, subtotal: Math.max(0, basePrice - discountAmt) };
    }));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setDiscountAmount(0);
  };

  const handleSuccess = (sale: PosSale) => {
    setCompletedSale(sale);
    setShowCheckout(false);
    clearCart();
    setShowCart(false);
  };

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: '100dvh' }}>

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 pt-10 pb-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-black text-gray-900 text-lg leading-tight">Kasir</h1>
            <p className="text-xs text-gray-400 font-medium">
              {currentShift
                ? <span className="text-emerald-600 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" /> Shift aktif</span>
                : <span className="text-amber-500 font-bold flex items-center gap-1"><AlertTriangle size={10} /> Shift belum dibuka</span>
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}
              >
                <List size={15} />
              </button>
            </div>

            {/* Cart button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-90 transition-all"
            >
              <ShoppingCart size={18} className="text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[9px] font-black">{cartCount > 99 ? '99+' : cartCount}</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2.5">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari produk atau SKU..."
            className="flex-1 bg-transparent text-sm text-gray-800 outline-none font-medium placeholder-gray-400"
          />
          {searchQuery ? (
            <button onClick={() => setSearchQuery('')} className="p-0.5">
              <X size={14} className="text-gray-400" />
            </button>
          ) : (
            <ScanLine size={15} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100">
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            Semua ({products.filter(p => p.isActive).length})
          </button>
          {activeCategories.map(cat => {
            const count = products.filter(p => p.isActive && p.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? 'text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500'
                }`}
                style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}
              >
                <span>{cat.emoji}</span>
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid / List */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
              <Search size={28} className="text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-400">Produk tidak ditemukan</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(product => {
              const inCart = cart.find(i => i.productId === product.id);
              const isOutOfStock = product.stock === 0;
              const category = categories.find(c => c.id === product.categoryId);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product.id)}
                  disabled={isOutOfStock}
                  className={`relative bg-white rounded-2xl overflow-hidden border-2 text-left active:scale-[0.97] transition-all shadow-sm ${
                    isOutOfStock ? 'opacity-50 border-gray-100' :
                    inCart ? 'border-emerald-300 shadow-emerald-100' : 'border-gray-100'
                  }`}
                >
                  {/* Product image */}
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {product.imageBase64 || product.imageUrl ? (
                      <img
                        src={product.imageBase64 || product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                    {/* Stock badge */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">HABIS</span>
                      </div>
                    )}
                    {!isOutOfStock && product.stock <= product.minStock && (
                      <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg">
                        TIPIS
                      </div>
                    )}
                    {/* In cart badge */}
                    {inCart && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-[10px] font-black">{inCart.quantity}</span>
                      </div>
                    )}
                    {/* Category badge */}
                    {category && (
                      <div
                        className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-white text-[9px] font-bold"
                        style={{ backgroundColor: category.color + 'dd' }}
                      >
                        {category.emoji} {category.name}
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2 mb-1">{product.name}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-emerald-600">{fmt(product.price)}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{product.stock} {product.unit}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map(product => {
              const inCart = cart.find(i => i.productId === product.id);
              const isOutOfStock = product.stock === 0;
              const category = categories.find(c => c.id === product.categoryId);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product.id)}
                  disabled={isOutOfStock}
                  className={`w-full bg-white rounded-2xl p-3 flex items-center gap-3 border-2 text-left active:scale-[0.99] transition-all shadow-sm ${
                    isOutOfStock ? 'opacity-50 border-gray-100' :
                    inCart ? 'border-emerald-300' : 'border-gray-100'
                  }`}
                >
                  {/* Image */}
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative">
                    {product.imageBase64 || product.imageUrl ? (
                      <img src={product.imageBase64 || product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-[8px] font-black">HABIS</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {category && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg text-white" style={{ backgroundColor: category.color }}>
                          {category.emoji} {category.name}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 font-medium">{product.stock} {product.unit}</span>
                    </div>
                  </div>

                  {/* Price & cart */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    <p className="text-sm font-black text-emerald-600">{fmt(product.price)}</p>
                    {inCart ? (
                      <div className="flex items-center gap-1.5 bg-emerald-500 rounded-xl px-2 py-1">
                        <span className="text-white text-[10px] font-black">{inCart.quantity}x</span>
                      </div>
                    ) : (
                      <div className="w-7 h-7 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Plus size={14} className="text-emerald-600" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* Bottom bar - cart summary */}
      {cartCount > 0 && (
        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white text-[11px] font-black">{cartCount}</span>
              </div>
              <span className="text-white font-bold text-sm">{cart.length} jenis produk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-base">{fmt(total)}</span>
              <ChevronDown size={16} className="text-white/70 -rotate-90" />
            </div>
          </button>
        </div>
      )}

      {/* No shift warning */}
      {!currentShift && (
        <div className="flex-shrink-0 bg-amber-50 border-t border-amber-200 px-4 py-2 flex items-center gap-2">
          <Clock size={14} className="text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-semibold">Shift belum dibuka. Buka shift dari Beranda sebelum transaksi.</p>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <CartDrawer
          cart={cart}
          onUpdateItem={updateItemQty}
          onUpdateItemDiscount={updateItemDiscount}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onCheckout={() => { setShowCart(false); setShowCheckout(true); }}
          discountPercent={discountPercent}
          discountAmount={discountAmount}
          onDiscountChange={(dp, da) => { setDiscountPercent(dp); setDiscountAmount(da); }}
          subtotal={subtotal}
          taxAmount={taxAmount}
          total={total}
          onClose={() => setShowCart(false)}
        />
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          subtotal={subtotal}
          discountPercent={discountPercent}
          discountAmount={effectiveDiscount}
          taxAmount={taxAmount}
          total={total}
          onSuccess={handleSuccess}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {/* Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
}
