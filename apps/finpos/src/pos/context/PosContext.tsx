import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  StoreProfile, PosCashier, PosCategory, PosProduct,
  PosSale, StockHistory, PosShift, PosScreen, ReceiptSettings,
} from '../types';
import {
  POS_KEYS, posLoad, posSave,
  generatePosId, encodePin, verifyPin,
} from '../utils/storage';
import { posGasPost } from '../utils/gas';
import toast from 'react-hot-toast';

export const defaultReceiptSettings: ReceiptSettings = {
  showLogo: true, showStoreName: true, showAddress: true, showPhone: true,
  showHeaderText: true, showReceiptNumber: true, showDate: true,
  showCashierName: true, showCustomerName: true, showSku: false,
  showItemNote: true, showItemDiscount: true, showSubtotal: true,
  showDiscount: true, showTax: true, showPaymentMethod: true,
  showChange: true, showFooterText: true, showThankYou: true,
  fontFamily: 'monospace', paperWidth: '58mm', fontSize: 'normal',
  dividerStyle: 'dashed', waReceiptEnabled: false, waDefaultPhone: '',
};

const defaultStore: StoreProfile = {
  name: '', address: '', phone: '', logoUrl: '', logoBase64: '',
  receiptHeader: '', receiptFooter: 'Terima kasih telah berbelanja!',
  taxEnabled: false, taxPercent: 11, currency: 'IDR',
  gasUrl: '', fonntToken: '', fonntPhone: '', isSetup: false,
};

interface PosContextType {
  screen: PosScreen; setScreen: (s: PosScreen) => void;
  currentCashier: PosCashier | null;
  loginCashier: (id: string, pin: string) => boolean;
  logoutCashier: () => void;
  store: StoreProfile; saveStore: (s: Partial<StoreProfile>) => void;
  receiptSettings: ReceiptSettings; saveReceiptSettings: (s: Partial<ReceiptSettings>) => void;
  cashiers: PosCashier[];
  addCashier: (c: Omit<PosCashier, 'id' | 'createdAt' | 'lastLogin'>) => void;
  updateCashier: (id: string, c: Partial<PosCashier>) => void;
  deleteCashier: (id: string) => void;
  changeCashierPin: (id: string, newPin: string) => void;
  categories: PosCategory[];
  addCategory: (c: Omit<PosCategory, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, c: Partial<PosCategory>) => void;
  deleteCategory: (id: string) => void;
  products: PosProduct[];
  addProduct: (p: Omit<PosProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, p: Partial<PosProduct>) => Promise<void>;
  deleteProduct: (id: string) => void;
  sales: PosSale[]; addSale: (s: Omit<PosSale, 'id' | 'createdAt'>) => Promise<void>;
  stockHistory: StockHistory[];
  adjustStock: (productId: string, quantity: number, type: StockHistory['type'], ref: string) => void;
  shifts: PosShift[]; currentShift: PosShift | null;
  openShift: (openingCash: number) => void;
  closeShift: (closingCash: number, notes: string) => void;
  canAccessScreen: (screen: string) => boolean;
  isSyncing: boolean; lastSync: string | null;
}

const PosContext = createContext<PosContextType | null>(null);

export function PosProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<PosScreen>('login');
  const [currentCashier, setCurrentCashier] = useState<PosCashier | null>(null);
  const [store, setStore] = useState<StoreProfile>(() => posLoad(POS_KEYS.store, defaultStore));
  const [cashiers, setCashiers] = useState<PosCashier[]>(() => posLoad(POS_KEYS.cashiers, []));
  const [categories, setCategories] = useState<PosCategory[]>(() => posLoad(POS_KEYS.categories, []));
  const [products, setProducts] = useState<PosProduct[]>(() => posLoad(POS_KEYS.products, []));
  const [sales, setSales] = useState<PosSale[]>(() => posLoad(POS_KEYS.sales, []));
  const [stockHistory, setStockHistory] = useState<StockHistory[]>(() => posLoad(POS_KEYS.stockHistory, []));
  const [shifts, setShifts] = useState<PosShift[]>(() => posLoad(POS_KEYS.shifts, []));
  const [currentShift, setCurrentShift] = useState<PosShift | null>(() => posLoad(POS_KEYS.currentShift, null));
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(() =>
    posLoad(POS_KEYS.receiptSettings, defaultReceiptSettings)
  );
  const [isSyncing] = useState(false);
  const [lastSync] = useState<string | null>(() => localStorage.getItem(POS_KEYS.lastSync));

  useEffect(() => { posSave(POS_KEYS.store, store); }, [store]);
  useEffect(() => { posSave(POS_KEYS.cashiers, cashiers); }, [cashiers]);
  useEffect(() => { posSave(POS_KEYS.categories, categories); }, [categories]);
  useEffect(() => { posSave(POS_KEYS.products, products); }, [products]);
  useEffect(() => { posSave(POS_KEYS.sales, sales); }, [sales]);
  useEffect(() => { posSave(POS_KEYS.stockHistory, stockHistory); }, [stockHistory]);
  useEffect(() => { posSave(POS_KEYS.shifts, shifts); }, [shifts]);
  useEffect(() => { posSave(POS_KEYS.currentShift, currentShift); }, [currentShift]);
  useEffect(() => { posSave(POS_KEYS.receiptSettings, receiptSettings); }, [receiptSettings]);

  useEffect(() => { if (!store.isSetup) setScreen('setup'); }, [store.isSetup]);

  const gasPost = useCallback(async (action: string, payload: object) => {
    await posGasPost(store.gasUrl, action, payload);
  }, [store.gasUrl]);

  const loginCashier = (id: string, pin: string): boolean => {
    const cashier = cashiers.find(c => c.id === id && c.isActive);
    if (!cashier || !verifyPin(pin, cashier.pin)) return false;
    const updated = { ...cashier, lastLogin: new Date().toISOString() };
    setCashiers(prev => prev.map(c => c.id === id ? updated : c));
    setCurrentCashier(updated);
    setScreen('dashboard');
    return true;
  };

  const logoutCashier = () => { setCurrentCashier(null); setScreen('login'); };
  const saveStore = (s: Partial<StoreProfile>) => setStore(prev => ({ ...prev, ...s }));
  const saveReceiptSettings = (s: Partial<ReceiptSettings>) => setReceiptSettings(prev => ({ ...prev, ...s }));

  const addCashier = (c: Omit<PosCashier, 'id' | 'createdAt' | 'lastLogin'>) => {
    const cashier: PosCashier = { ...c, id: generatePosId(), pin: encodePin(c.pin), createdAt: new Date().toISOString(), lastLogin: null };
    setCashiers(prev => [...prev, cashier]);
    gasPost('addPosCashier', { cashier });
    toast.success(`Kasir "${c.name}" ditambahkan`);
  };

  const updateCashier = (id: string, c: Partial<PosCashier>) =>
    setCashiers(prev => prev.map(x => x.id === id ? { ...x, ...c } : x));

  const deleteCashier = (id: string) => {
    const isOwner = cashiers.find(c => c.id === id)?.role === 'owner';
    if (isOwner && cashiers.filter(c => c.role === 'owner').length <= 1) {
      toast.error('Harus ada minimal 1 owner'); return;
    }
    setCashiers(prev => prev.filter(c => c.id !== id));
    toast.success('Kasir dihapus');
  };

  const changeCashierPin = (id: string, newPin: string) => {
    setCashiers(prev => prev.map(c => c.id === id ? { ...c, pin: encodePin(newPin) } : c));
    toast.success('PIN berhasil diubah');
  };

  const addCategory = (c: Omit<PosCategory, 'id' | 'createdAt'>) => {
    setCategories(prev => [...prev, { ...c, id: generatePosId(), createdAt: new Date().toISOString() }]);
    toast.success(`Kategori "${c.name}" ditambahkan`);
  };

  const updateCategory = (id: string, c: Partial<PosCategory>) =>
    setCategories(prev => prev.map(x => x.id === id ? { ...x, ...c } : x));

  const deleteCategory = (id: string) => {
    if (products.some(p => p.categoryId === id)) { toast.error('Kategori masih digunakan oleh produk'); return; }
    setCategories(prev => prev.filter(c => c.id !== id));
    toast.success('Kategori dihapus');
  };

  const addProduct = async (p: Omit<PosProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const product: PosProduct = { ...p, id: generatePosId(), createdAt: now, updatedAt: now };
    setProducts(prev => [...prev, product]);
    await gasPost('addPosProduct', { product });
    toast.success(`Produk "${p.name}" ditambahkan`);
  };

  const updateProduct = async (id: string, p: Partial<PosProduct>) => {
    const updated = { ...p, updatedAt: new Date().toISOString() };
    setProducts(prev => prev.map(x => x.id === id ? { ...x, ...updated } : x));
    await gasPost('updatePosProduct', { id, data: updated });
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Produk dihapus');
  };

  const addSale = async (s: Omit<PosSale, 'id' | 'createdAt'>) => {
    const sale: PosSale = { ...s, id: generatePosId(), createdAt: new Date().toISOString() };
    setSales(prev => [sale, ...prev]);
    for (const item of sale.items) {
      setProducts(prev => prev.map(p =>
        p.id === item.productId ? { ...p, stock: Math.max(0, p.stock - item.quantity), updatedAt: new Date().toISOString() } : p
      ));
      const product = products.find(p => p.id === item.productId);
      if (product) {
        setStockHistory(prev => [{
          id: generatePosId(), productId: item.productId, productName: item.productName,
          type: 'sale', quantity: -item.quantity, stockBefore: product.stock,
          stockAfter: product.stock - item.quantity, reference: sale.receiptNumber,
          cashierId: sale.cashierId, createdAt: sale.createdAt,
        }, ...prev]);
      }
    }
    if (currentShift) {
      setCurrentShift(prev => prev ? { ...prev, totalSales: prev.totalSales + sale.total, totalTransactions: prev.totalTransactions + 1 } : null);
    }
    await gasPost('addPosSale', { sale });
    toast.success(`Transaksi ${sale.receiptNumber} berhasil`);
  };

  const adjustStock = (productId: string, quantity: number, type: StockHistory['type'], ref: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newStock = product.stock + quantity;
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, stock: Math.max(0, newStock), updatedAt: new Date().toISOString() } : p
    ));
    setStockHistory(prev => [{
      id: generatePosId(), productId, productName: product.name, type, quantity,
      stockBefore: product.stock, stockAfter: Math.max(0, newStock),
      reference: ref, cashierId: currentCashier?.id ?? '', createdAt: new Date().toISOString(),
    }, ...prev]);
    toast.success('Stok diperbarui');
  };

  const openShift = (openingCash: number) => {
    if (!currentCashier) return;
    setCurrentShift({
      id: generatePosId(), cashierId: currentCashier.id, cashierName: currentCashier.name,
      openedAt: new Date().toISOString(), closedAt: null, openingCash,
      closingCash: null, totalSales: 0, totalTransactions: 0, notes: '',
    });
    toast.success('Shift dibuka');
  };

  const closeShift = (closingCash: number, notes: string) => {
    if (!currentShift) return;
    setShifts(prev => [{ ...currentShift, closedAt: new Date().toISOString(), closingCash, notes }, ...prev]);
    setCurrentShift(null);
    toast.success('Shift ditutup');
  };

  const CASHIER_SCREENS = ['dashboard', 'cashier'];
  const MANAGER_SCREENS = ['dashboard', 'cashier', 'products', 'reports', 'settings'];
  const canAccessScreen = (s: string): boolean => {
    const role = currentCashier?.role ?? 'cashier';
    if (role === 'owner') return true;
    if (role === 'manager') return MANAGER_SCREENS.includes(s);
    return CASHIER_SCREENS.includes(s);
  };

  return (
    <PosContext.Provider value={{
      screen, setScreen, currentCashier, loginCashier, logoutCashier,
      store, saveStore, receiptSettings, saveReceiptSettings,
      cashiers, addCashier, updateCashier, deleteCashier, changeCashierPin,
      categories, addCategory, updateCategory, deleteCategory,
      products, addProduct, updateProduct, deleteProduct,
      sales, addSale, stockHistory, adjustStock,
      shifts, currentShift, openShift, closeShift,
      isSyncing, lastSync, canAccessScreen,
    }}>
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error('usePos must be used within PosProvider');
  return ctx;
}
