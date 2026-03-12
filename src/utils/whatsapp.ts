import { WaNotificationConfig, Debt, Installment, Transaction } from '../types';
import { formatCurrency } from './format';

// Fonnte WhatsApp API (https://www.fonnte.com)
// Dokumentasi: https://docs.fonnte.com
// API endpoint: https://api.fonnte.com/send
// Header Authorization menggunakan Token (bukan API Key) — ambil dari halaman Device di dashboard Fonnte

const FONTE_API = 'https://api.fonnte.com/send';

async function sendWa(token: string, phone: string, message: string): Promise<boolean> {
  try {
    const res = await fetch(FONTE_API, {
      method: 'POST',
      headers: {
        Authorization: token,   // Token dari dashboard Fonnte → Device → pilih device
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: phone,
        message,
        countryCode: '62',
      }),
    });
    const data = await res.json();
    return data.status === true || data.status === 'true';
  } catch {
    return false;
  }
}

function buildDueDateReminders(
  debts: Debt[],
  installments: Installment[],
  config: WaNotificationConfig,
  userName: string
): string | null {
  const now = new Date();
  const daysBefore = config.reminderDaysBefore || 3;
  const lines: string[] = [];

  if (config.notifyDebt) {
    const upcomingDebts = debts.filter(d => {
      if (d.isPaid || !d.dueDate) return false;
      const due = new Date(d.dueDate);
      const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= daysBefore;
    });

    if (upcomingDebts.length > 0) {
      lines.push('*⚠️ Pengingat Jatuh Tempo:*');
      upcomingDebts.forEach(d => {
        const due = new Date(d.dueDate);
        const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const label = d.type === 'receivable'
          ? `Piutang dari *${d.personName}*`
          : `Utang ke *${d.personName}*`;
        lines.push(
          `• ${label}\n  Sisa: ${formatCurrency(d.remainingAmount)}\n  Jatuh tempo: ${diff === 0 ? 'HARI INI' : `${diff} hari lagi`}`
        );
      });
      lines.push('');
    }

    const overdueDebts = debts.filter(d => {
      if (d.isPaid || !d.dueDate) return false;
      return new Date(d.dueDate) < now;
    });

    if (overdueDebts.length > 0) {
      lines.push('*🔴 Sudah Lewat Jatuh Tempo:*');
      overdueDebts.forEach(d => {
        const label = d.type === 'receivable'
          ? `Piutang dari *${d.personName}*`
          : `Utang ke *${d.personName}*`;
        lines.push(`• ${label} — ${formatCurrency(d.remainingAmount)}`);
      });
      lines.push('');
    }
  }

  if (config.notifyInstallment) {
    const activeInst = installments.filter(i => i.status === 'active');
    if (activeInst.length > 0) {
      lines.push('*💳 Cicilan Aktif Bulan Ini:*');
      activeInst.forEach(i => {
        const remaining = i.totalCount - i.paidCount;
        lines.push(`• ${i.name} — ${formatCurrency(i.monthlyAmount)}/bln (sisa ${remaining}x)`);
      });
      const totalMonthly = activeInst.reduce((s, i) => s + i.monthlyAmount, 0);
      lines.push(`\n_Total cicilan: ${formatCurrency(totalMonthly)}/bulan_`);
    }
  }

  if (lines.length === 0) return null;

  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'];
  const header = `🔔 *FinTrack — Pengingat Keuangan*\nHai *${userName}*! ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}\n\n`;
  const footer = `\n_Pesan otomatis dari FinTrack_`;
  return header + lines.join('\n') + footer;
}

function buildDailyReport(
  transactions: Transaction[],
  config: WaNotificationConfig,
  userName: string
): string | null {
  if (!config.notifyDailyReport) return null;

  const today = new Date().toDateString();
  const todayTx = transactions.filter(t => new Date(t.date).toDateString() === today);
  if (todayTx.length === 0) return null;

  const income  = todayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = todayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const now = new Date();
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'];

  let msg = `📊 *Laporan Harian FinTrack*\nHai *${userName}*! Ringkasan ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}\n\n`;
  msg += `✅ Pemasukan: *${formatCurrency(income)}*\n`;
  msg += `❌ Pengeluaran: *${formatCurrency(expense)}*\n`;
  msg += `💰 Selisih: *${formatCurrency(income - expense)}*\n\n`;

  if (todayTx.length <= 5) {
    msg += `*Detail (${todayTx.length} transaksi):*\n`;
    todayTx.forEach(t => {
      const sign = t.type === 'income' ? '↑' : '↓';
      msg += `${sign} ${t.category} ${formatCurrency(t.amount)}${t.description ? ` — ${t.description}` : ''}\n`;
    });
  } else {
    msg += `_Total ${todayTx.length} transaksi hari ini_`;
  }

  msg += `\n_FinTrack - Manajemen Keuangan_`;
  return msg;
}

export async function sendDueDateReminder(
  config: WaNotificationConfig,
  debts: Debt[],
  installments: Installment[],
  userName: string
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled || !config.fonteApiKey || !config.phoneNumber) {
    return { success: false, message: 'Konfigurasi WhatsApp belum lengkap' };
  }
  const msg = buildDueDateReminders(debts, installments, config, userName);
  if (!msg) {
    return { success: false, message: 'Tidak ada pengingat yang perlu dikirim saat ini' };
  }
  const ok = await sendWa(config.fonteApiKey, config.phoneNumber, msg);
  return {
    success: ok,
    message: ok ? 'Notifikasi WhatsApp berhasil dikirim!' : 'Gagal mengirim. Pastikan Token Fonnte benar & device terhubung',
  };
}

export async function sendDailyReport(
  config: WaNotificationConfig,
  transactions: Transaction[],
  userName: string
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled || !config.fonteApiKey || !config.phoneNumber) {
    return { success: false, message: 'Konfigurasi WhatsApp belum lengkap' };
  }
  const msg = buildDailyReport(transactions, config, userName);
  if (!msg) {
    return { success: false, message: 'Tidak ada transaksi hari ini' };
  }
  const ok = await sendWa(config.fonteApiKey, config.phoneNumber, msg);
  return {
    success: ok,
    message: ok ? 'Laporan harian berhasil dikirim!' : 'Gagal mengirim laporan. Pastikan Token Fonnte benar & device terhubung',
  };
}

export async function sendTestMessage(
  config: WaNotificationConfig,
  userName: string
): Promise<{ success: boolean; message: string }> {
  if (!config.fonteApiKey || !config.phoneNumber) {
    return { success: false, message: 'Token Fonnte atau nomor HP belum diisi' };
  }
  const msg = `✅ *FinTrack — Test Notifikasi*\n\nHai *${userName}*! Notifikasi WhatsApp berhasil terhubung 🎉\n\nAnda akan mendapatkan pengingat:\n• Jatuh tempo piutang/utang\n• Cicilan bulanan\n• Laporan harian\n\n_FinTrack - Manajemen Keuangan_`;
  const ok = await sendWa(config.fonteApiKey, config.phoneNumber, msg);
  return {
    success: ok,
    message: ok ? 'Pesan test berhasil dikirim! Cek WhatsApp Anda.' : 'Gagal mengirim. Pastikan Token Fonnte benar & device aktif di Fonnte.',
  };
}
