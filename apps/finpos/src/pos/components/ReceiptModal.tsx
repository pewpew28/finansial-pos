import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, ShoppingBag, CheckCircle2, MessageCircle, Download, Send } from 'lucide-react';
import { PosSale } from '../types';
import { usePos } from '../context/PosContext';

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Tunai', transfer: 'Transfer', qris: 'QRIS', card: 'Kartu', receivable: 'Piutang',
};

interface Props { sale: PosSale; onClose: () => void; }

export default function ReceiptModal({ sale, onClose }: Props) {
  const { store, receiptSettings } = usePos();
  const receiptRef = useRef<HTMLDivElement>(null);
  const rs = receiptSettings;
  const [waPhone, setWaPhone] = useState(rs.waDefaultPhone || '');
  const [showWaInput, setShowWaInput] = useState(false);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const fontStyle = rs.fontFamily === 'monospace'
    ? { fontFamily: "'Courier New', monospace" }
    : { fontFamily: 'system-ui, -apple-system, sans-serif' };
  const baseFontSize = rs.fontSize === 'small' ? '10px' : rs.fontSize === 'large' ? '14px' : '12px';
  const paperWidth = rs.paperWidth === '80mm' ? '320px' : '240px';

  const dividerEl = () => {
    if (rs.dividerStyle === 'none') return null;
    const borderStyle = rs.dividerStyle === 'double' ? '3px double #9ca3af' : `1px ${rs.dividerStyle} #9ca3af`;
    return <div style={{ borderTop: borderStyle, margin: '8px 0' }} />;
  };

  const handlePrint = () => {
    const html = `<!DOCTYPE html><html><head><title>Struk ${sale.receiptNumber}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:${rs.fontFamily === 'monospace' ? "'Courier New', monospace" : 'system-ui'};font-size:${baseFontSize};color:#000;background:#fff}.receipt{width:${paperWidth};margin:0 auto;padding:12px}.center{text-align:center}.bold{font-weight:bold}.row{display:flex;justify-content:space-between;margin:2px 0}.divider{border-top:1px ${rs.dividerStyle === 'none' ? 'none' : rs.dividerStyle} #000;margin:6px 0}.store-name{font-size:1.3em;font-weight:900;text-align:center}@media print{@page{margin:0;size:${rs.paperWidth} auto}}</style></head>
<body><div class="receipt">
${rs.showStoreName ? `<p class="store-name">${store.name || 'Toko'}</p>` : ''}
${rs.showAddress && store.address ? `<p class="center">${store.address}</p>` : ''}
<div class="divider"></div>
${rs.showReceiptNumber ? `<p class="center bold">${sale.receiptNumber}</p>` : ''}
${rs.showDate ? `<p class="center">${formatDate(sale.createdAt)}</p>` : ''}
<div class="divider"></div>
${sale.items.map(item => `<div class="row"><span class="bold">${item.productName}</span><span class="bold">${fmt(item.subtotal)}</span></div><div class="row"><span>${item.quantity} × ${fmt(item.price)}</span></div>`).join('')}
<div class="divider"></div>
<div class="row"><span class="bold" style="font-size:1.2em">TOTAL</span><span class="bold" style="font-size:1.2em">${fmt(sale.total)}</span></div>
<div class="divider"></div>
${rs.showThankYou ? `<p class="center">${store.receiptFooter || 'Terima kasih!'}</p>` : ''}
</div><script>window.onload=function(){window.print();window.close()}</script></body></html>`;
    const win = window.open('', '_blank', 'width=400,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas').catch(() => ({ default: null as any }));
      if (!html2canvas) { handlePrint(); return; }
      const canvas = await html2canvas(receiptRef.current, { scale: 3, backgroundColor: '#ffffff', logging: false });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `struk-${sale.receiptNumber}.png`;
      a.click();
    } catch { handlePrint(); }
  };

  const buildWaText = () => {
    const items = sale.items.map(i => `• ${i.productName} x${i.quantity} = ${fmt(i.subtotal)}`).join('\n');
    return `🧾 *STRUK ${store.name?.toUpperCase() || 'TOKO'}*\n${'─'.repeat(28)}\nNo: ${sale.receiptNumber}\nTgl: ${formatDate(sale.createdAt)}\nKasir: ${sale.cashierName}\n${'─'.repeat(28)}\n${items}\n${'─'.repeat(28)}\n*TOTAL: ${fmt(sale.total)}*\n${'─'.repeat(28)}\n${rs.showThankYou ? (store.receiptFooter || 'Terima kasih! 🙏') : ''}`;
  };

  const handleSendWA = (phone?: string) => {
    const encoded = encodeURIComponent(buildWaText());
    const target = phone ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(target, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 z-[350] flex items-end justify-center" style={{ maxWidth: '512px', margin: '0 auto', left: 0, right: 0 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[95dvh]">
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-black text-gray-900 leading-tight">Transaksi Berhasil!</h2>
                <p className="text-[11px] text-gray-400 font-medium">{sale.receiptNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <X size={15} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div ref={receiptRef} className="mx-auto bg-white rounded-2xl border border-gray-200 shadow-inner overflow-hidden"
            style={{ ...fontStyle, fontSize: baseFontSize, maxWidth: paperWidth, padding: '16px' }}>
            {rs.showLogo && (store.logoBase64 || store.logoUrl) && (
              <div className="flex justify-center mb-2">
                <img src={store.logoBase64 || store.logoUrl} alt="logo" className="w-14 h-14 object-cover rounded-xl" />
              </div>
            )}
            {rs.showStoreName && <p className="text-center font-black text-sm text-gray-900">{store.name || 'Nama Toko'}</p>}
            {rs.showAddress && store.address && <p className="text-center text-[11px] text-gray-500 mt-0.5">{store.address}</p>}
            {rs.showPhone && store.phone && <p className="text-center text-[11px] text-gray-500">Telp: {store.phone}</p>}
            {dividerEl()}
            <div className="text-center space-y-0.5">
              {rs.showReceiptNumber && <p className="font-black text-gray-800 text-[11px]">{sale.receiptNumber}</p>}
              {rs.showDate && <p className="text-[10px] text-gray-500">{formatDate(sale.createdAt)}</p>}
              {rs.showCashierName && <p className="text-[10px] text-gray-500">Kasir: <span className="font-bold">{sale.cashierName}</span></p>}
              {rs.showCustomerName && sale.customerName && <p className="text-[10px] text-gray-500">Pelanggan: <span className="font-bold">{sale.customerName}</span></p>}
            </div>
            {dividerEl()}
            <div className="space-y-1.5">
              {sale.items.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-gray-800 flex-1 mr-1">{item.productName}</span>
                    <span className="font-bold text-gray-800">{fmt(item.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 pl-2">
                    <span>{item.quantity} × {fmt(item.price)}</span>
                    {rs.showItemDiscount && item.discountAmount > 0 && <span className="text-red-400">-{fmt(item.discountAmount)}</span>}
                  </div>
                  {rs.showItemNote && item.note && <p className="text-[10px] text-violet-400 pl-2 italic">📝 {item.note}</p>}
                </div>
              ))}
            </div>
            {dividerEl()}
            <div className="space-y-0.5 text-[11px]">
              {rs.showSubtotal && <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-bold">{fmt(sale.subtotal)}</span></div>}
              {rs.showDiscount && sale.discountAmount > 0 && <div className="flex justify-between text-red-500"><span>Diskon</span><span className="font-bold">-{fmt(sale.discountAmount)}</span></div>}
              {rs.showTax && sale.taxAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">PPN ({sale.taxPercent}%)</span><span className="font-bold">{fmt(sale.taxAmount)}</span></div>}
            </div>
            {dividerEl()}
            <div className="flex justify-between items-center">
              <span className="font-black text-gray-900 text-sm">TOTAL</span>
              <span className="font-black text-emerald-600 text-sm">{fmt(sale.total)}</span>
            </div>
            {dividerEl()}
            <div className="space-y-0.5 text-[11px]">
              {rs.showPaymentMethod && sale.payments.map((p, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-500">{PAYMENT_LABELS[p.method] || p.method}</span>
                  <span className="font-bold">{fmt(p.amount)}</span>
                </div>
              ))}
              {rs.showChange && sale.change > 0 && <div className="flex justify-between"><span className="text-gray-500">Kembalian</span><span className="font-bold text-blue-600">{fmt(sale.change)}</span></div>}
            </div>
            {dividerEl()}
            {rs.showThankYou && <p className="text-center text-[11px] text-gray-500 italic">{store.receiptFooter || 'Terima kasih! 🙏'}</p>}
          </div>

          {showWaInput && (
            <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-emerald-700 mb-2">Nomor WhatsApp Pelanggan</p>
              <div className="flex gap-2">
                <input type="tel" value={waPhone} onChange={e => setWaPhone(e.target.value)} placeholder="628xxxx"
                  className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none" autoFocus />
                <button onClick={() => { handleSendWA(waPhone); setShowWaInput(false); }}
                  className="px-4 py-2 bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center gap-1.5">
                  <Send size={14} />Kirim
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { icon: <Printer size={18} />, label: 'Cetak', color: 'blue', action: handlePrint },
              { icon: <Download size={18} />, label: 'Unduh', color: 'violet', action: handleDownload },
              { icon: <MessageCircle size={18} />, label: 'WA', color: 'emerald', action: () => rs.waReceiptEnabled ? setShowWaInput(!showWaInput) : handleSendWA() },
              { icon: <ShoppingBag size={18} />, label: 'Baru', color: 'gray', action: onClose },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-${btn.color}-50 border border-${btn.color}-100 active:scale-95 transition-all`}>
                <span className={`text-${btn.color}-600`}>{btn.icon}</span>
                <span className={`text-[10px] font-bold text-${btn.color}-600`}>{btn.label}</span>
              </button>
            ))}
          </div>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all">
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
