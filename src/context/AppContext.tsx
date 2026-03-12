import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppSettings, Debt, Installment, Transaction, Wallet } from '../types';
import toast from 'react-hot-toast';

interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  settings: AppSettings;
  login: (pin: string) => boolean;
  logout: () => void;
  saveSettings: (s: Partial<AppSettings>) => void;

  // Wallets
  wallets: Wallet[];
  addWallet: (w: Omit<Wallet, 'id' | 'createdAt'>) => Promise<void>;
  updateWallet: (id: string, w: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;

  // Transactions
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Debts
  debts: Debt[];
  addDebt: (d: Omit<Debt, 'id' | 'createdAt'>) => Promise<void>;
  updateDebt: (id: string, d: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  payDebt: (id: string, amount: number) => Promise<void>;

  // Installments
  installments: Installment[];
  addInstallment: (i: Omit<Installment, 'id' | 'createdAt'>) => Promise<void>;
  updateInstallment: (id: string, i: Partial<Installment>) => Promise<void>;
  deleteInstallment: (id: string) => Promise<void>;
  payInstallmentMonth: (id: string) => Promise<void>;

  // Sync
  syncData: () => Promise<void>;
  isSyncing: boolean;
  lastSync: string | null;
}

const defaultSettings: AppSettings = {
  pin: '',
  gasUrl: '',
  isSetup: false,
  userName: 'Pengguna',
  currency: 'IDR',
  waNotif: {
    enabled: false,
    fonteApiKey: '',
    phoneNumber: '',
    notifyDebt: true,
    notifyInstallment: true,
    notifyDailyReport: false,
    reminderDaysBefore: 3,
  },
};

const AppContext = createContext<AppContextType | null>(null);

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const LOCAL_KEYS = {
  settings: 'fintrack_settings',
  wallets: 'fintrack_wallets',
  transactions: 'fintrack_transactions',
  debts: 'fintrack_debts',
  installments: 'fintrack_installments',
  lastSync: 'fintrack_last_sync',
};

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => loadLocal(LOCAL_KEYS.settings, defaultSettings));
  const [wallets, setWallets] = useState<Wallet[]>(() => loadLocal(LOCAL_KEYS.wallets, []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadLocal(LOCAL_KEYS.transactions, []));
  const [debts, setDebts] = useState<Debt[]>(() => loadLocal(LOCAL_KEYS.debts, []));
  const [installments, setInstallments] = useState<Installment[]>(() => loadLocal(LOCAL_KEYS.installments, []));
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(() => localStorage.getItem(LOCAL_KEYS.lastSync));

  // Persist
  useEffect(() => { saveLocal(LOCAL_KEYS.wallets, wallets); }, [wallets]);
  useEffect(() => { saveLocal(LOCAL_KEYS.transactions, transactions); }, [transactions]);
  useEffect(() => { saveLocal(LOCAL_KEYS.debts, debts); }, [debts]);
  useEffect(() => { saveLocal(LOCAL_KEYS.installments, installments); }, [installments]);
  useEffect(() => { saveLocal(LOCAL_KEYS.settings, settings); }, [settings]);

  const login = (pin: string): boolean => {
    if (settings.pin === pin) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => setIsAuthenticated(false);

  const saveSettings = (s: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
  };

  // GAS sync helper
  const gasPost = useCallback(async (action: string, payload: object) => {
    if (!settings.gasUrl) return;
    try {
      await fetch(settings.gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
    } catch {
      // no-cors silently fails
    }
  }, [settings.gasUrl]);

  const syncData = useCallback(async () => {
    if (!settings.gasUrl) {
      toast.error('URL Google Apps Script belum diset');
      return;
    }
    setIsSyncing(true);
    try {
      const response = await fetch(`${settings.gasUrl}?action=getAll`, { mode: 'cors' });
      if (!response.ok) throw new Error('Gagal sync');
      const data = await response.json();
      if (data.wallets) { setWallets(data.wallets); }
      if (data.transactions) { setTransactions(data.transactions); }
      if (data.debts) { setDebts(data.debts); }
      if (data.installments) { setInstallments(data.installments); }
      const now = new Date().toISOString();
      setLastSync(now);
      localStorage.setItem(LOCAL_KEYS.lastSync, now);
      toast.success('Data berhasil disinkronkan!');
    } catch {
      toast.error('Sync gagal – data tersimpan lokal');
    } finally {
      setIsSyncing(false);
    }
  }, [settings.gasUrl]);

  // Wallet ops
  const addWallet = async (w: Omit<Wallet, 'id' | 'createdAt'>) => {
    const wallet: Wallet = { ...w, id: generateId(), createdAt: new Date().toISOString() };
    setWallets(prev => [...prev, wallet]);
    await gasPost('addWallet', { wallet });
    toast.success('Wallet berhasil ditambahkan');
  };

  const updateWallet = async (id: string, w: Partial<Wallet>) => {
    setWallets(prev => prev.map(x => x.id === id ? { ...x, ...w } : x));
    await gasPost('updateWallet', { id, data: w });
  };

  const deleteWallet = async (id: string) => {
    setWallets(prev => prev.filter(x => x.id !== id));
    await gasPost('deleteWallet', { id });
    toast.success('Wallet dihapus');
  };

  // Transaction ops
  const addTransaction = async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const tx: Transaction = { ...t, id: generateId(), createdAt: new Date().toISOString() };
    setTransactions(prev => [tx, ...prev]);
    // Update wallet balance
    setWallets(prev => prev.map(w => {
      if (w.id !== t.walletId) return w;
      const delta = t.type === 'income' ? t.amount : -t.amount;
      return { ...w, balance: w.balance + delta };
    }));
    await gasPost('addTransaction', { transaction: tx });
    toast.success(t.type === 'income' ? 'Pemasukan dicatat' : 'Pengeluaran dicatat');
  };

  const deleteTransaction = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      setWallets(prev => prev.map(w => {
        if (w.id !== tx.walletId) return w;
        const delta = tx.type === 'income' ? -tx.amount : tx.amount;
        return { ...w, balance: w.balance + delta };
      }));
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
    await gasPost('deleteTransaction', { id });
    toast.success('Transaksi dihapus');
  };

  // Debt ops
  const addDebt = async (d: Omit<Debt, 'id' | 'createdAt'>) => {
    const debt: Debt = { ...d, id: generateId(), createdAt: new Date().toISOString() };
    setDebts(prev => [debt, ...prev]);
    await gasPost('addDebt', { debt });
    toast.success(d.type === 'receivable' ? 'Piutang dicatat' : 'Utang dicatat');
  };

  const updateDebt = async (id: string, d: Partial<Debt>) => {
    setDebts(prev => prev.map(x => x.id === id ? { ...x, ...d } : x));
    await gasPost('updateDebt', { id, data: d });
  };

  const deleteDebt = async (id: string) => {
    setDebts(prev => prev.filter(x => x.id !== id));
    await gasPost('deleteDebt', { id });
    toast.success('Data dihapus');
  };

  const payDebt = async (id: string, amount: number) => {
    setDebts(prev => prev.map(x => {
      if (x.id !== id) return x;
      const remaining = Math.max(0, x.remainingAmount - amount);
      return { ...x, remainingAmount: remaining, isPaid: remaining === 0 };
    }));
    await gasPost('payDebt', { id, amount });
    toast.success('Pembayaran dicatat');
  };

  // Installment ops
  const addInstallment = async (i: Omit<Installment, 'id' | 'createdAt'>) => {
    const inst: Installment = { ...i, id: generateId(), createdAt: new Date().toISOString() };
    setInstallments(prev => [inst, ...prev]);
    await gasPost('addInstallment', { installment: inst });
    toast.success('Cicilan ditambahkan');
  };

  const updateInstallment = async (id: string, i: Partial<Installment>) => {
    setInstallments(prev => prev.map(x => x.id === id ? { ...x, ...i } : x));
    await gasPost('updateInstallment', { id, data: i });
  };

  const deleteInstallment = async (id: string) => {
    setInstallments(prev => prev.filter(x => x.id !== id));
    await gasPost('deleteInstallment', { id });
    toast.success('Cicilan dihapus');
  };

  const payInstallmentMonth = async (id: string) => {
    setInstallments(prev => prev.map(x => {
      if (x.id !== id) return x;
      const newPaid = x.paidCount + 1;
      const status = newPaid >= x.totalCount ? 'paid' : 'active';
      return { ...x, paidCount: newPaid, status };
    }));
    // Deduct from wallet
    const inst = installments.find(x => x.id === id);
    if (inst) {
      setWallets(prev => prev.map(w => {
        if (w.id !== inst.walletId) return w;
        return { ...w, balance: w.balance - inst.monthlyAmount };
      }));
    }
    await gasPost('payInstallmentMonth', { id });
    toast.success('Cicilan bulan ini dibayar');
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, settings, login, logout, saveSettings,
      wallets, addWallet, updateWallet, deleteWallet,
      transactions, addTransaction, deleteTransaction,
      debts, addDebt, updateDebt, deleteDebt, payDebt,
      installments, addInstallment, updateInstallment, deleteInstallment, payInstallmentMonth,
      syncData, isSyncing, lastSync,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
