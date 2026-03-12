import { useState } from 'react';
import { ChevronLeft, Download, FileSpreadsheet, BarChart2, Package, ShoppingCart, Clock } from 'lucide-react';
import { usePos } from '../context/PosContext';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function PosExportScreen({ onBack }: { onBack: () => void }) {
  const { sales, products, categories, cashiers, shifts, store } = usePos();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [exporting, setExporting] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const periodSales = sales.filter(s => {
    const d = new Date(s.createdAt);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalRevenue = periodSales.reduce((s, x) => s + x.total, 0);
  const totalTransactions = periodSales.length;
  const itemsSold = periodSales.reduce((s, x) => s + x.items.reduce((ss, i) => ss + i.quantity, 0), 0);

  const handleExport = async () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      const headerStyle = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '059669' } } };

      // ── Sheet 1: Ringkasan ────────────────────────────────────────────────
      const summaryData = [
        ['FinPOS — Laporan Penjualan', '', '', ''],
        [`Toko: ${store.name}`, '', '', ''],
        [`Periode: ${MONTHS[selectedMonth]} ${selectedYear}`, '', '', ''],
        ['', '', '', ''],
        ['RINGKASAN', '', '', ''],
        ['Total Pendapatan', fmt(totalRevenue), '', ''],
        ['Jumlah Transaksi', totalTransactions, '', ''],
        ['Item Terjual', itemsSold, '', ''],
        ['Rata-rata Order', fmt(totalTransactions > 0 ? totalRevenue / totalTransactions : 0), '', ''],
        ['', '', '', ''],
        ['PRODUK', '', '', ''],
        ['Total Produk Aktif', products.filter(p => p.isActive).length, '', ''],
        ['Stok Menipis', products.filter(p => p.isActive && p.stock <= p.minStock && p.stock > 0).length, '', ''],
        ['Stok Habis', products.filter(p => p.isActive && p.stock === 0).length, '', ''],
      ];
      const wsSum = XLSX.utils.aoa_to_sheet(summaryData);
      wsSum['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsSum, '📊 Ringkasan');

      // ── Sheet 2: Transaksi ────────────────────────────────────────────────
      const txHeaders = ['No Struk', 'Tanggal', 'Waktu', 'Kasir', 'Pelanggan', 'Item', 'Subtotal', 'Diskon', 'Pajak', 'Total', 'Pembayaran', 'Kembalian', 'Catatan'];
      const txRows = periodSales.map(s => [
        s.receiptNumber,
        new Date(s.createdAt).toLocaleDateString('id-ID'),
        new Date(s.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        s.cashierName,
        s.customerName || '-',
        s.items.reduce((sum, i) => sum + i.quantity, 0),
        s.subtotal,
        s.discountAmount,
        s.taxAmount,
        s.total,
        s.payments.map(p => `${p.method}:${fmt(p.amount)}`).join(' + '),
        s.change,
        s.notes || '-',
      ]);
      const wsTx = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
      wsTx['!cols'] = txHeaders.map((_, i) => ({ wch: [18, 12, 8, 15, 15, 6, 14, 12, 12, 14, 25, 12, 20][i] || 15 }));
      XLSX.utils.book_append_sheet(wb, wsTx, '💰 Transaksi');

      // ── Sheet 3: Detail Item Terjual ──────────────────────────────────────
      const itemHeaders = ['No Struk', 'Tanggal', 'Produk', 'SKU', 'Qty', 'Harga Satuan', 'Diskon', 'Subtotal', 'Catatan'];
      const itemRows: (string | number)[][] = [];
      for (const sale of periodSales) {
        for (const item of sale.items) {
          const product = products.find(p => p.id === item.productId);
          itemRows.push([
            sale.receiptNumber,
            new Date(sale.createdAt).toLocaleDateString('id-ID'),
            item.productName,
            product?.sku || '-',
            item.quantity,
            item.price,
            item.discountAmount,
            item.subtotal,
            item.note || '-',
          ]);
        }
      }
      const wsItems = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemRows]);
      wsItems['!cols'] = [18, 12, 25, 12, 6, 14, 12, 14, 20].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, wsItems, '🛍️ Detail Item');

      // ── Sheet 4: Per Kasir ────────────────────────────────────────────────
      const cashierMap: Record<string, { name: string; revenue: number; count: number; items: number }> = {};
      for (const sale of periodSales) {
        if (!cashierMap[sale.cashierId]) {
          cashierMap[sale.cashierId] = { name: sale.cashierName, revenue: 0, count: 0, items: 0 };
        }
        cashierMap[sale.cashierId].revenue += sale.total;
        cashierMap[sale.cashierId].count += 1;
        cashierMap[sale.cashierId].items += sale.items.reduce((s, i) => s + i.quantity, 0);
      }
      const cashierHeaders = ['Nama Kasir', 'Jumlah Transaksi', 'Item Terjual', 'Total Penjualan', 'Rata-rata Order'];
      const cashierRows = Object.values(cashierMap).map(c => [
        c.name, c.count, c.items, c.revenue, c.count > 0 ? c.revenue / c.count : 0,
      ]);
      const wsCashier = XLSX.utils.aoa_to_sheet([cashierHeaders, ...cashierRows]);
      wsCashier['!cols'] = [20, 20, 14, 18, 18].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, wsCashier, '👥 Per Kasir');

      // ── Sheet 5: Per Produk ───────────────────────────────────────────────
      const productMap: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
      for (const sale of periodSales) {
        for (const item of sale.items) {
          const product = products.find(p => p.id === item.productId);
          const category = categories.find(c => c.id === product?.categoryId);
          if (!productMap[item.productId]) {
            productMap[item.productId] = { name: item.productName, category: category?.name || '-', qty: 0, revenue: 0 };
          }
          productMap[item.productId].qty += item.quantity;
          productMap[item.productId].revenue += item.subtotal;
        }
      }
      const prodHeaders = ['Nama Produk', 'Kategori', 'Qty Terjual', 'Total Pendapatan', 'Rata-rata Harga'];
      const prodRows = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .map(p => [p.name, p.category, p.qty, p.revenue, p.qty > 0 ? p.revenue / p.qty : 0]);
      const wsProd = XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]);
      wsProd['!cols'] = [25, 18, 12, 18, 16].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, wsProd, '📦 Per Produk');

      // ── Sheet 6: Stok Produk ──────────────────────────────────────────────
      const stockHeaders = ['SKU', 'Nama Produk', 'Kategori', 'Stok', 'Min Stok', 'Satuan', 'Harga Jual', 'Harga Modal', 'Nilai Stok', 'Status'];
      const stockRows = products.filter(p => p.isActive).map(p => {
        const cat = categories.find(c => c.id === p.categoryId);
        const status = p.stock === 0 ? 'HABIS' : p.stock <= p.minStock ? 'MENIPIS' : 'NORMAL';
        return [p.sku, p.name, cat?.name || '-', p.stock, p.minStock, p.unit, p.price, p.costPrice, p.stock * p.costPrice, status];
      });
      const wsStock = XLSX.utils.aoa_to_sheet([stockHeaders, ...stockRows]);
      wsStock['!cols'] = [12, 25, 18, 8, 10, 8, 14, 14, 14, 10].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, wsStock, '📋 Stok Produk');

      // ── Sheet 7: Riwayat Shift ────────────────────────────────────────────
      const monthShifts = shifts.filter(s => {
        const d = new Date(s.openedAt);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });
      const shiftHeaders = ['Kasir', 'Dibuka', 'Ditutup', 'Durasi', 'Kas Awal', 'Kas Akhir', 'Total Penjualan', 'Transaksi', 'Catatan'];
      const shiftRows = monthShifts.map(s => {
        const duration = s.closedAt
          ? (() => {
              const diff = new Date(s.closedAt).getTime() - new Date(s.openedAt).getTime();
              const h = Math.floor(diff / 3600000);
              const m = Math.floor((diff % 3600000) / 60000);
              return `${h}j ${m}m`;
            })()
          : 'Aktif';
        return [
          s.cashierName,
          new Date(s.openedAt).toLocaleString('id-ID'),
          s.closedAt ? new Date(s.closedAt).toLocaleString('id-ID') : '-',
          duration,
          s.openingCash,
          s.closingCash ?? '-',
          s.totalSales,
          s.totalTransactions,
          s.notes || '-',
        ];
      });
      const wsShift = XLSX.utils.aoa_to_sheet([shiftHeaders, ...shiftRows]);
      wsShift['!cols'] = [18, 20, 20, 10, 14, 14, 16, 12, 20].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, wsShift, '⏰ Riwayat Shift');

      // Apply header styling
      [wsSum, wsTx, wsItems, wsCashier, wsProd, wsStock, wsShift].forEach(ws => {
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
          if (cell) cell.s = headerStyle;
        }
      });

      const filename = `FinPOS_${store.name || 'Toko'}_${MONTHS[selectedMonth]}_${selectedYear}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`File "${filename}" berhasil diunduh!`);
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat file Excel');
    } finally {
      setExporting(false);
    }
  };

  const SHEETS = [
    { icon: '📊', label: 'Ringkasan', desc: 'Total pendapatan, transaksi, produk' },
    { icon: '💰', label: 'Transaksi', desc: `${totalTransactions} transaksi periode ini` },
    { icon: '🛍️', label: 'Detail Item', desc: 'Setiap item dalam setiap transaksi' },
    { icon: '👥', label: 'Per Kasir', desc: 'Rekap penjualan per kasir' },
    { icon: '📦', label: 'Per Produk', desc: 'Produk terlaris & revenue' },
    { icon: '📋', label: 'Stok Produk', desc: 'Kondisi stok semua produk' },
    { icon: '⏰', label: 'Riwayat Shift', desc: 'Semua shift bulan ini' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center active:scale-90">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-white font-black text-lg">Export Laporan</h1>
            <p className="text-teal-200 text-xs font-medium">File Excel (.xlsx)</p>
          </div>
        </div>

        {/* Period stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <ShoppingCart size={14} />, label: 'Transaksi', value: totalTransactions },
            { icon: <Package size={14} />, label: 'Item Terjual', value: itemsSold },
            { icon: <BarChart2 size={14} />, label: 'Pendapatan', value: totalRevenue >= 1000000 ? `${(totalRevenue / 1000000).toFixed(1)}jt` : `${(totalRevenue / 1000).toFixed(0)}rb` },
          ].map(s => (
            <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <div className="flex justify-center text-teal-200 mb-1">{s.icon}</div>
              <p className="text-white font-black text-base">{s.value}</p>
              <p className="text-teal-200 text-[9px] font-bold uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 pb-24 space-y-4">

        {/* Period Selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Pilih Periode</p>

          {/* Month */}
          <p className="text-[10px] font-bold text-gray-400 mb-2">Bulan</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(i)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedMonth === i ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-50 text-gray-600 border border-gray-100'
                }`}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Year */}
          <p className="text-[10px] font-bold text-gray-400 mb-2">Tahun</p>
          <div className="flex gap-2">
            {years.map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedYear === y ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-50 text-gray-600 border border-gray-100'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Sheet preview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <FileSpreadsheet size={15} className="text-emerald-600" />
            <p className="text-sm font-bold text-gray-900">Isi File Excel (7 Sheet)</p>
          </div>
          <div className="divide-y divide-gray-50">
            {SHEETS.map(s => (
              <div key={s.label} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl w-8 text-center flex-shrink-0">{s.icon}</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shift stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-indigo-500" />
            <p className="text-sm font-bold text-gray-900">Shift Bulan Ini</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-indigo-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-indigo-600">
                {shifts.filter(s => {
                  const d = new Date(s.openedAt);
                  return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
                }).length}
              </p>
              <p className="text-[10px] text-indigo-400 font-bold uppercase">Total Shift</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-emerald-600">
                {cashiers.filter(c => c.isActive).length}
              </p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase">Kasir Aktif</p>
            </div>
          </div>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl py-4 text-white font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {exporting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Membuat File...
            </>
          ) : (
            <>
              <Download size={20} />
              Download Excel — {MONTHS[selectedMonth]} {selectedYear}
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          Kompatibel dengan Microsoft Excel, Google Sheets, & LibreOffice
        </p>
      </div>
    </div>
  );
}
