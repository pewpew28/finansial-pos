import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Printer, ShoppingBag, CheckCircle2,
  MessageCircle, Download, Send,
} from 'lucide-react';
import { PosSale } from '../types';
import { usePos } from '../context/PosContext';

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  qris: 'QRIS',
  card: 'Kartu',
  card_debit: 'Kartu Debit',
  receivable: 'Piutang',
};

interface Props {
  sale: PosSale;
  onClose: () => void;
}

export default function ReceiptModal({ sale, onClose }: Props) {
  const { store, receiptSettings } = usePos();
  const receiptRef = useRef<HTMLDivElement>(null);
  const rs = receiptSettings;

  const [waPhone, setWaPhone] = useState(rs.waDefaultPhone || '');
  const [showWaInput, setShowWaInput] = useState(false);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
    }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // ─── Font / Size helpers ──────────────────────────────────────────────────
  const fontStyle = rs.fontFamily === 'monospace'
    ? { fontFamily: "'Courier New', monospace" }
    : { fontFamily: "system-ui, -apple-system, sans-serif" };

  const baseFontSize = rs.fontSize === 'small' ? '10px' : rs.fontSize === 'large' ? '14px' : '12px';
  const paperWidth = rs.paperWidth === '80mm' ? '320px' : '240px';

  const dividerEl = () => {
    if (rs.dividerStyle === 'none') return null;
    const borderStyle = rs.dividerStyle === 'double' ? '3px double #9ca3af' : `1px ${rs.dividerStyle} #9ca3af`;
    return <div style={{ borderTop: borderStyle, margin: '8px 0' }} />;
  };

  // ─── Generate Print HTML ──────────────────────────────────────────────────
  const handlePrint = () => {
    const borderStyle = rs.dividerStyle === 'none' ? 'none'
      : rs.dividerStyle === 'double' ? '3px double #000'
      : `1px ${rs.dividerStyle} #000`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Struk ${sale.receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${rs.fontFamily === 'monospace' ? "'Courier New', monospace" : "system-ui, sans-serif"};
      font-size: ${baseFontSize};
      color: #000;
      background: #fff;
    }
    .receipt { width: ${paperWidth}; margin: 0 auto; padding: 12px; }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .divider { border-top: ${borderStyle}; margin: 6px 0; }
    .store-name { font-size: 1.3em; font-weight: 900; text-align: center; }
    .total-row { font-size: 1.3em; font-weight: 900; }
    .item-note { font-size: 0.85em; padding-left: 8px; color: #666; font-style: italic; }
    @media print { @page { margin: 0; size: ${rs.paperWidth} auto; } }
  </style>
</head>
<body>
<div class="receipt">
  ${rs.showLogo && store.logoUrl ? `<div class="center"><img src="${store.logoUrl}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;margin-bottom:6px" /></div>` : ''}
  ${rs.showStoreName ? `<p class="store-name">${store.name || 'Toko'}</p>` : ''}
  ${rs.showAddress && store.address ? `<p class="center" style="font-size:0.9em;color:#666">${store.address}</p>` : ''}
  ${rs.showPhone && store.phone ? `<p class="center" style="font-size:0.9em;color:#666">Telp: ${store.phone}</p>` : ''}
  ${rs.showHeaderText && store.receiptHeader ? `<p class="center" style="font-size:0.85em;color:#666;font-style:italic">${store.receiptHeader}</p>` : ''}

  <div class="divider"></div>

  ${rs.showReceiptNumber ? `<p class="center bold">${sale.receiptNumber}</p>` : ''}
  ${rs.showDate ? `<p class="center" style="color:#666">${formatDate(sale.createdAt)}</p>` : ''}
  ${rs.showCashierName ? `<p class="center" style="color:#666">Kasir: ${sale.cashierName}</p>` : ''}
  ${rs.showCustomerName && sale.customerName ? `<p class="center" style="color:#666">Pelanggan: ${sale.customerName}</p>` : ''}

  <div class="divider"></div>

  ${sale.items.map(item => `
    <div class="row">
      <span class="bold" style="flex:1;margin-right:4px">${item.productName}</span>
      <span class="bold">${fmt(item.subtotal)}</span>
    </div>
    <div class="row" style="color:#666;padding-left:8px;font-size:0.9em">
      <span>${item.quantity} × ${fmt(item.price)}${rs.showSku ? '' : ''}</span>
      ${rs.showItemDiscount && item.discountAmount > 0 ? `<span style="color:#ef4444">-${fmt(item.discountAmount)}</span>` : ''}
    </div>
    ${rs.showItemNote && item.note ? `<div class="item-note">📝 ${item.note}</div>` : ''}
  `).join('')}

  <div class="divider"></div>

  ${rs.showSubtotal ? `<div class="row"><span style="color:#666">Subtotal</span><span class="bold">${fmt(sale.subtotal)}</span></div>` : ''}
  ${rs.showDiscount && sale.discountAmount > 0 ? `<div class="row"><span style="color:#ef4444">Diskon ${sale.discountPercent > 0 ? `(${sale.discountPercent}%)` : ''}</span><span class="bold" style="color:#ef4444">-${fmt(sale.discountAmount)}</span></div>` : ''}
  ${rs.showTax && sale.taxAmount > 0 ? `<div class="row"><span style="color:#666">PPN (${sale.taxPercent}%)</span><span class="bold">${fmt(sale.taxAmount)}</span></div>` : ''}

  <div class="divider"></div>

  <div class="row total-row"><span>TOTAL</span><span>${fmt(sale.total)}</span></div>

  <div class="divider"></div>

  ${rs.showPaymentMethod ? sale.payments.map(p => `
    <div class="row"><span style="color:#666">${PAYMENT_LABELS[p.method] || p.method}</span><span class="bold">${fmt(p.amount)}</span></div>
  `).join('') : ''}
  ${rs.showChange && sale.change > 0 ? `<div class="row"><span style="color:#666">Kembalian</span><span class="bold" style="color:#2563eb">${fmt(sale.change)}</span></div>` : ''}

  <div class="divider"></div>

  ${rs.showThankYou ? `<p class="center" style="font-style:italic;color:#666">${store.receiptFooter || 'Terima kasih telah berbelanja!'}</p>` : ''}
  ${rs.showFooterText ? `<p class="center" style="font-size:0.8em;color:#9ca3af;margin-top:4px">Barang yang sudah dibeli tidak dapat dikembalikan</p>` : ''}
</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=400,height=700');
    if (!win) return;
    win.document.write(html.replace('onload=""', 'onload="window.print();window.close()"'));
    win.document.close();
  };

  // ─── Download PNG (html2canvas fallback: use print) ───────────────────────
  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      // Try html2canvas if available, otherwise use print
      const { default: html2canvas } = await import('html2canvas').catch(() => ({ default: null }));
      if (!html2canvas) {
        handlePrint();
        return;
      }
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `struk-${sale.receiptNumber}.png`;
      a.click();
    } catch {
      handlePrint();
    }
  };

  // ─── Generate WA Text ─────────────────────────────────────────────────────
  const buildWaText = () => {
    const items = sale.items.map(i =>
      `• ${i.productName} x${i.quantity} = ${fmt(i.subtotal)}${
        rs.showItemDiscount && i.discountAmount > 0 ? ` (diskon -${fmt(i.discountAmount)})` : ''
      }${rs.showItemNote && i.note ? `\n  📝 ${i.note}` : ''}`
    ).join('\n');

    return `🧾 *STRUK ${store.name?.toUpperCase() || 'TOKO'}*\n` +
      `${'─'.repeat(28)}\n` +
      (rs.showReceiptNumber ? `No: ${sale.receiptNumber}\n` : '') +
      (rs.showDate ? `Tgl: ${formatDate(sale.createdAt)}\n` : '') +
      (rs.showCashierName ? `Kasir: ${sale.cashierName}\n` : '') +
      (rs.showCustomerName && sale.customerName ? `Pelanggan: ${sale.customerName}\n` : '') +
      `${'─'.repeat(28)}\n` +
      `${items}\n` +
      `${'─'.repeat(28)}\n` +
      (rs.showSubtotal ? `Subtotal: ${fmt(sale.subtotal)}\n` : '') +
      (rs.showDiscount && sale.discountAmount > 0 ? `Diskon: -${fmt(sale.discountAmount)}\n` : '') +
      (rs.showTax && sale.taxAmount > 0 ? `PPN (${sale.taxPercent}%): ${fmt(sale.taxAmount)}\n` : '') +
      `*TOTAL: ${fmt(sale.total)}*\n` +
      `${'─'.repeat(28)}\n` +
      (rs.showPaymentMethod ? sale.payments.map(p => `${PAYMENT_LABELS[p.method]}: ${fmt(p.amount)}`).join('\n') + '\n' : '') +
      (rs.showChange && sale.change > 0 ? `Kembalian: ${fmt(sale.change)}\n` : '') +
      `${'─'.repeat(28)}\n` +
      (rs.showThankYou ? (store.receiptFooter || 'Terima kasih telah berbelanja! 🙏') : '');
  };

  const handleSendWA = (phone?: string) => {
    const text = buildWaText();
    const encoded = encodeURIComponent(text);
    const target = phone ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(target, '_blank');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[350] flex items-end justify-center"
      style={{ maxWidth: '512px', margin: '0 auto', left: 0, right: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[95dvh]">

        {/* Header */}
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

        {/* Receipt Preview */}
        <div className="flex-1 overflow-y-auto px-4 py-4">

          {/* Struk Paper */}
          <div
            ref={receiptRef}
            className="mx-auto bg-white rounded-2xl border border-gray-200 shadow-inner overflow-hidden"
            style={{
              ...fontStyle,
              fontSize: baseFontSize,
              maxWidth: paperWidth,
              padding: '16px',
            }}
          >
            {/* Store Header */}
            {rs.showLogo && (store.logoBase64 || store.logoUrl) && (
              <div className="flex justify-center mb-2">
                <img
                  src={store.logoBase64 || store.logoUrl}
                  alt="logo"
                  className="w-14 h-14 object-cover rounded-xl"
                />
              </div>
            )}
            {rs.showStoreName && (
              <p className="text-center font-black text-sm text-gray-900">{store.name || 'Nama Toko'}</p>
            )}
            {rs.showAddress && store.address && (
              <p className="text-center text-[11px] text-gray-500 mt-0.5">{store.address}</p>
            )}
            {rs.showPhone && store.phone && (
              <p className="text-center text-[11px] text-gray-500">Telp: {store.phone}</p>
            )}
            {rs.showHeaderText && store.receiptHeader && (
              <p className="text-center text-[11px] text-gray-400 italic mt-0.5">{store.receiptHeader}</p>
            )}

            {dividerEl()}

            {/* Info */}
            <div className="text-center space-y-0.5">
              {rs.showReceiptNumber && (
                <p className="font-black text-gray-800 text-[11px]">{sale.receiptNumber}</p>
              )}
              {rs.showDate && (
                <p className="text-[10px] text-gray-500">{formatDate(sale.createdAt)}</p>
              )}
              {rs.showCashierName && (
                <p className="text-[10px] text-gray-500">Kasir: <span className="font-bold text-gray-700">{sale.cashierName}</span></p>
              )}
              {rs.showCustomerName && sale.customerName && (
                <p className="text-[10px] text-gray-500">Pelanggan: <span className="font-bold text-gray-700">{sale.customerName}</span></p>
              )}
            </div>

            {dividerEl()}

            {/* Items */}
            <div className="space-y-1.5">
              {sale.items.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-gray-800 flex-1 mr-1 leading-tight">
                      {item.productName}
                    </span>
                    <span className="font-bold text-gray-800 flex-shrink-0">{fmt(item.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 pl-2">
                    <span>{item.quantity} × {fmt(item.price)}</span>
                    {rs.showItemDiscount && item.discountAmount > 0 && (
                      <span className="text-red-400">-{fmt(item.discountAmount)}</span>
                    )}
                  </div>
                  {rs.showItemNote && item.note && (
                    <p className="text-[10px] text-violet-400 pl-2 italic">📝 {item.note}</p>
                  )}
                </div>
              ))}
            </div>

            {dividerEl()}

            {/* Totals */}
            <div className="space-y-0.5 text-[11px]">
              {rs.showSubtotal && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold text-gray-700">{fmt(sale.subtotal)}</span>
                </div>
              )}
              {rs.showDiscount && sale.discountAmount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Diskon {sale.discountPercent > 0 ? `(${sale.discountPercent}%)` : ''}</span>
                  <span className="font-bold">-{fmt(sale.discountAmount)}</span>
                </div>
              )}
              {rs.showTax && sale.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">PPN ({sale.taxPercent}%)</span>
                  <span className="font-bold text-gray-700">{fmt(sale.taxAmount)}</span>
                </div>
              )}
            </div>

            {dividerEl()}

            <div className="flex justify-between items-center">
              <span className="font-black text-gray-900 text-sm">TOTAL</span>
              <span className="font-black text-emerald-600 text-sm">{fmt(sale.total)}</span>
            </div>

            {dividerEl()}

            {/* Payment */}
            <div className="space-y-0.5 text-[11px]">
              {rs.showPaymentMethod && sale.payments.map((p, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-500">{PAYMENT_LABELS[p.method] || p.method}</span>
                  <span className="font-bold text-gray-700">{fmt(p.amount)}</span>
                </div>
              ))}
              {rs.showChange && sale.change > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Kembalian</span>
                  <span className="font-bold text-blue-600">{fmt(sale.change)}</span>
                </div>
              )}
            </div>

            {dividerEl()}

            {rs.showThankYou && (
              <p className="text-center text-[11px] text-gray-500 italic">
                {store.receiptFooter || 'Terima kasih telah berbelanja! 🙏'}
              </p>
            )}
            {rs.showFooterText && (
              <p className="text-center text-[10px] text-gray-400 mt-1">
                Barang yang sudah dibeli tidak dapat dikembalikan
              </p>
            )}
          </div>

          {/* WA Input */}
          {showWaInput && (
            <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-emerald-700 mb-2">Nomor WhatsApp Pelanggan</p>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={waPhone}
                  onChange={e => setWaPhone(e.target.value)}
                  placeholder="628xxxx"
                  className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none"
                  autoFocus
                />
                <button
                  onClick={() => { handleSendWA(waPhone); setShowWaInput(false); }}
                  className="px-4 py-2 bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center gap-1.5"
                >
                  <Send size={14} />
                  Kirim
                </button>
              </div>
              <p className="text-[10px] text-emerald-600 mt-1.5">Kosongkan dan tekan kirim untuk pilih kontak manual</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-gray-100">
          {/* Action buttons row */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <button
              onClick={handlePrint}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-blue-50 border border-blue-100 active:scale-95 transition-all"
            >
              <Printer size={18} className="text-blue-600" />
              <span className="text-[10px] font-bold text-blue-600">Cetak</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-violet-50 border border-violet-100 active:scale-95 transition-all"
            >
              <Download size={18} className="text-violet-600" />
              <span className="text-[10px] font-bold text-violet-600">Unduh</span>
            </button>

            <button
              onClick={() => {
                if (rs.waReceiptEnabled) {
                  setShowWaInput(!showWaInput);
                } else {
                  handleSendWA();
                }
              }}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 active:scale-95 transition-all"
            >
              <MessageCircle size={18} className="text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-600">WA</span>
            </button>

            <button
              onClick={onClose}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-gray-100 border border-gray-200 active:scale-95 transition-all"
            >
              <ShoppingBag size={18} className="text-gray-600" />
              <span className="text-[10px] font-bold text-gray-600">Baru</span>
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
