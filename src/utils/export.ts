import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Transaction, Wallet, Debt, Installment } from '../types';
import { formatCurrency } from './format';

function autoWidth(ws: XLSX.WorkSheet, data: Record<string, unknown>[]) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  ws['!cols'] = keys.map(k => ({
    wch: Math.max(
      k.length,
      ...data.map(row => String(row[k] ?? '').length)
    ) + 2,
  }));
}

function styleHeader(ws: XLSX.WorkSheet, colCount: number) {
  for (let c = 0; c < colCount; c++) {
    const cell = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[cell]) continue;
    ws[cell].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '7C3AED' } },
      alignment: { horizontal: 'center' },
    };
  }
}

export function exportToExcel(
  transactions: Transaction[],
  wallets: Wallet[],
  debts: Debt[],
  installments: Installment[],
  month?: number,
  year?: number
) {
  const wb = XLSX.utils.book_new();
  const now = new Date();
  const filterMonth = month ?? now.getMonth();
  const filterYear  = year  ?? now.getFullYear();

  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'];

  /* ── 1. RINGKASAN ─────────────────────────────── */
  const filteredTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
  });
  const totalIncome  = filteredTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const totalReceivable = debts.filter(d => d.type === 'receivable' && !d.isPaid).reduce((s, d) => s + d.remainingAmount, 0);
  const totalPayable    = debts.filter(d => d.type === 'payable'    && !d.isPaid).reduce((s, d) => s + d.remainingAmount, 0);
  const totalInstall    = installments.filter(i => i.status === 'active').reduce((s, i) => s + i.monthlyAmount, 0);

  const summaryData = [
    { Keterangan: 'Periode Laporan', Nilai: `${monthNames[filterMonth]} ${filterYear}` },
    { Keterangan: 'Total Saldo Semua Dompet', Nilai: formatCurrency(totalBalance) },
    { Keterangan: '', Nilai: '' },
    { Keterangan: `Pemasukan ${monthNames[filterMonth]}`, Nilai: formatCurrency(totalIncome) },
    { Keterangan: `Pengeluaran ${monthNames[filterMonth]}`, Nilai: formatCurrency(totalExpense) },
    { Keterangan: `Selisih`, Nilai: formatCurrency(totalIncome - totalExpense) },
    { Keterangan: '', Nilai: '' },
    { Keterangan: 'Total Piutang Aktif', Nilai: formatCurrency(totalReceivable) },
    { Keterangan: 'Total Utang Aktif', Nilai: formatCurrency(totalPayable) },
    { Keterangan: 'Cicilan per Bulan', Nilai: formatCurrency(totalInstall) },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  autoWidth(wsSummary, summaryData);
  styleHeader(wsSummary, 2);
  XLSX.utils.book_append_sheet(wb, wsSummary, '📊 Ringkasan');

  /* ── 2. DOMPET ───────────────────────────────── */
  const walletData = wallets.map(w => ({
    'Nama Dompet': w.name,
    'Saldo': w.balance,
    'Saldo (Format)': formatCurrency(w.balance),
    'Dibuat': new Date(w.createdAt).toLocaleDateString('id-ID'),
  }));
  const wsWallets = XLSX.utils.json_to_sheet(walletData);
  autoWidth(wsWallets, walletData);
  styleHeader(wsWallets, 4);
  XLSX.utils.book_append_sheet(wb, wsWallets, '👛 Dompet');

  /* ── 3. TRANSAKSI (bulan ini) ────────────────── */
  const txData = filteredTx
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(t => {
      const wallet = wallets.find(w => w.id === t.walletId);
      return {
        'Tanggal': new Date(t.date).toLocaleDateString('id-ID'),
        'Jenis': t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        'Kategori': t.category,
        'Keterangan': t.description || '-',
        'Dompet': wallet?.name ?? '-',
        'Jumlah': t.amount,
        'Jumlah (Format)': `${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}`,
      };
    });
  const wsTx = XLSX.utils.json_to_sheet(txData.length ? txData : [{ Info: 'Tidak ada transaksi pada periode ini' }]);
  autoWidth(wsTx, txData);
  styleHeader(wsTx, 7);
  XLSX.utils.book_append_sheet(wb, wsTx, '💰 Transaksi');

  /* ── 4. SEMUA TRANSAKSI ──────────────────────── */
  const allTxData = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(t => {
      const wallet = wallets.find(w => w.id === t.walletId);
      const d = new Date(t.date);
      return {
        'Tanggal': d.toLocaleDateString('id-ID'),
        'Bulan': monthNames[d.getMonth()],
        'Tahun': d.getFullYear(),
        'Jenis': t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        'Kategori': t.category,
        'Keterangan': t.description || '-',
        'Dompet': wallet?.name ?? '-',
        'Jumlah': t.amount,
      };
    });
  const wsAllTx = XLSX.utils.json_to_sheet(allTxData.length ? allTxData : [{ Info: 'Belum ada transaksi' }]);
  autoWidth(wsAllTx, allTxData);
  styleHeader(wsAllTx, 8);
  XLSX.utils.book_append_sheet(wb, wsAllTx, '📋 Semua Transaksi');

  /* ── 5. PIUTANG & UTANG ──────────────────────── */
  const debtData = debts.map(d => ({
    'Jenis': d.type === 'receivable' ? 'Piutang' : 'Utang',
    'Nama': d.personName,
    'Keterangan': d.description || '-',
    'Jumlah Awal': d.amount,
    'Sisa': d.remainingAmount,
    'Terbayar': d.amount - d.remainingAmount,
    'Terbayar (%)': `${Math.round(((d.amount - d.remainingAmount) / d.amount) * 100)}%`,
    'Jatuh Tempo': d.dueDate ? new Date(d.dueDate).toLocaleDateString('id-ID') : '-',
    'Status': d.isPaid ? 'Lunas' : new Date(d.dueDate) < new Date() && d.dueDate ? 'Terlambat' : 'Aktif',
  }));
  const wsDebts = XLSX.utils.json_to_sheet(debtData.length ? debtData : [{ Info: 'Belum ada data piutang/utang' }]);
  autoWidth(wsDebts, debtData);
  styleHeader(wsDebts, 9);
  XLSX.utils.book_append_sheet(wb, wsDebts, '🤝 Piutang & Utang');

  /* ── 6. CICILAN ──────────────────────────────── */
  const instData = installments.map(i => {
    const wallet = wallets.find(w => w.id === i.walletId);
    return {
      'Nama Cicilan': i.name,
      'Dompet': wallet?.name ?? '-',
      'Cicilan/Bulan': i.monthlyAmount,
      'Total Harga': i.totalAmount,
      'Terbayar': i.paidCount,
      'Sisa': i.totalCount - i.paidCount,
      'Total Bulan': i.totalCount,
      'Progress': `${Math.round((i.paidCount / i.totalCount) * 100)}%`,
      'Tanggal Mulai': new Date(i.startDate).toLocaleDateString('id-ID'),
      'Status': i.status === 'paid' ? 'Lunas' : 'Aktif',
      'Keterangan': i.description || '-',
    };
  });
  const wsInst = XLSX.utils.json_to_sheet(instData.length ? instData : [{ Info: 'Belum ada data cicilan' }]);
  autoWidth(wsInst, instData);
  styleHeader(wsInst, 11);
  XLSX.utils.book_append_sheet(wb, wsInst, '💳 Cicilan');

  /* ── 7. REKAP PER KATEGORI ───────────────────── */
  const catMap: Record<string, { income: number; expense: number }> = {};
  filteredTx.forEach(t => {
    if (!catMap[t.category]) catMap[t.category] = { income: 0, expense: 0 };
    if (t.type === 'income')  catMap[t.category].income  += t.amount;
    else                       catMap[t.category].expense += t.amount;
  });
  const catData = Object.entries(catMap)
    .sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense))
    .map(([cat, vals]) => ({
      'Kategori': cat,
      'Pemasukan': vals.income,
      'Pengeluaran': vals.expense,
      'Selisih': vals.income - vals.expense,
    }));
  const wsCat = XLSX.utils.json_to_sheet(catData.length ? catData : [{ Info: 'Tidak ada data kategori' }]);
  autoWidth(wsCat, catData);
  styleHeader(wsCat, 4);
  XLSX.utils.book_append_sheet(wb, wsCat, '📈 Per Kategori');

  /* ── Save ─────────────────────────────────────── */
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fileName = `FinTrack_${monthNames[filterMonth]}_${filterYear}.xlsx`;
  saveAs(blob, fileName);
}

export function exportAllToExcel(
  transactions: Transaction[],
  wallets: Wallet[],
  debts: Debt[],
  installments: Installment[]
) {
  const now = new Date();
  exportToExcel(transactions, wallets, debts, installments, now.getMonth(), now.getFullYear());
}
