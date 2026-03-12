export type TransactionType = 'income' | 'expense';
export type DebtType = 'receivable' | 'payable';
export type InstallmentStatus = 'active' | 'paid';

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  color: string;
  icon: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  walletId: string;
  date: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  type: DebtType;
  personName: string;
  amount: number;
  remainingAmount: number;
  description: string;
  dueDate: string;
  isPaid: boolean;
  createdAt: string;
}

export interface Installment {
  id: string;
  name: string;
  totalAmount: number;
  monthlyAmount: number;
  paidCount: number;
  totalCount: number;
  walletId: string;
  startDate: string;
  status: InstallmentStatus;
  description: string;
  createdAt: string;
}

export interface WaNotificationConfig {
  enabled: boolean;
  fonteApiKey: string;    // Fonte API key
  phoneNumber: string;    // Target phone (with country code, e.g. 6281234567890)
  notifyDebt: boolean;
  notifyInstallment: boolean;
  notifyDailyReport: boolean;
  reminderDaysBefore: number;
}

export interface AppSettings {
  pin: string;
  gasUrl: string;
  isSetup: boolean;
  userName: string;
  currency: string;
  waNotif: WaNotificationConfig;
}

export type TabType = 'dashboard' | 'transactions' | 'wallets' | 'debts' | 'installments' | 'notifications' | 'export' | 'settings';
