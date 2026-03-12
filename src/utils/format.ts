export function formatCurrency(amount: number, currency = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateStr));
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export const INCOME_CATEGORIES = [
  'Gaji', 'Bonus', 'Freelance', 'Investasi', 'Bisnis', 'Hadiah', 'Lainnya',
];

export const EXPENSE_CATEGORIES = [
  'Makanan & Minuman', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan',
  'Kesehatan', 'Pendidikan', 'Investasi', 'Tabungan', 'Rumah', 'Lainnya',
];

export const WALLET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

export const WALLET_ICONS = [
  'wallet', 'credit-card', 'building-2', 'piggy-bank', 'briefcase',
  'smartphone', 'star', 'heart', 'zap', 'globe',
];
