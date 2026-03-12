// ─── POS Types ────────────────────────────────────────────────────────────────

export type PosRole = 'owner' | 'manager' | 'cashier';
export type PosScreen =
  | 'login'
  | 'setup'
  | 'dashboard'
  | 'cashier'
  | 'products'
  | 'categories'
  | 'stock'
  | 'reports'
  | 'settings'
  | 'cashiers'
  | 'receipt-settings'
  | 'store-settings'
  | 'shift-history'
  | 'export'
  | 'notif';

export interface StoreProfile {
  name: string;
  address: string;
  phone: string;
  logoUrl: string;
  logoBase64: string;
  receiptHeader: string;
  receiptFooter: string;
  taxEnabled: boolean;
  taxPercent: number;
  currency: string;
  gasUrl: string;
  fonntToken: string;
  fonntPhone: string;
  isSetup: boolean;
}

export interface PosCashier {
  id: string;
  name: string;
  pin: string;
  role: PosRole;
  avatarEmoji: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface PosShift {
  id: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  closingCash: number | null;
  totalSales: number;
  totalTransactions: number;
  notes: string;
}

export interface PosCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface PosProduct {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  imageUrl: string;
  imageBase64: string;
  barcode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  discountPercent: number;
  discountAmount: number;
  note: string;
  subtotal: number;
}

export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'card' | 'receivable';

export interface SalePayment {
  method: PaymentMethod;
  amount: number;
  walletId: string;
}

export interface PosSale {
  id: string;
  receiptNumber: string;
  cashierId: string;
  cashierName: string;
  shiftId: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  payments: SalePayment[];
  change: number;
  notes: string;
  createdAt: string;
  syncedToFintrack: boolean;
}

export type StockMoveType = 'sale' | 'restock' | 'adjustment' | 'damage' | 'return';

export interface StockHistory {
  id: string;
  productId: string;
  productName: string;
  type: StockMoveType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reference: string;
  cashierId: string;
  createdAt: string;
}

export interface ReceiptSettings {
  showLogo: boolean;
  showStoreName: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showHeaderText: boolean;
  showReceiptNumber: boolean;
  showDate: boolean;
  showCashierName: boolean;
  showCustomerName: boolean;
  showSku: boolean;
  showItemNote: boolean;
  showItemDiscount: boolean;
  showSubtotal: boolean;
  showDiscount: boolean;
  showTax: boolean;
  showPaymentMethod: boolean;
  showChange: boolean;
  showFooterText: boolean;
  showThankYou: boolean;
  fontFamily: 'monospace' | 'sans';
  paperWidth: '58mm' | '80mm';
  fontSize: 'small' | 'normal' | 'large';
  dividerStyle: 'dashed' | 'solid' | 'double' | 'none';
  waReceiptEnabled: boolean;
  waDefaultPhone: string;
}

export type SetupStep = 'store' | 'logo' | 'gas' | 'owner' | 'done';
