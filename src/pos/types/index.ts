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

// ─── Store ────────────────────────────────────────────────────────────────────
export interface StoreProfile {
  name: string;
  address: string;
  phone: string;
  logoUrl: string;          // Google Drive public URL
  logoBase64: string;       // local preview before upload
  receiptHeader: string;    // custom text below logo
  receiptFooter: string;    // e.g. "Terima kasih!"
  taxEnabled: boolean;
  taxPercent: number;
  currency: string;
  gasUrl: string;           // shared with FinTrack
  fonntToken: string;
  fonntPhone: string;
  isSetup: boolean;
}

// ─── Cashier / User ───────────────────────────────────────────────────────────
export interface PosCashier {
  id: string;
  name: string;
  pin: string;              // 6-digit hashed with btoa (simple)
  role: PosRole;
  avatarEmoji: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

// ─── Shift ────────────────────────────────────────────────────────────────────
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

// ─── Category ─────────────────────────────────────────────────────────────────
export interface PosCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface PosProduct {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  price: number;            // harga jual
  costPrice: number;        // harga modal
  stock: number;
  minStock: number;         // alert threshold
  unit: string;             // pcs, kg, liter, etc.
  imageUrl: string;         // Google Drive URL
  imageBase64: string;      // local preview
  barcode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
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

// ─── Sale ─────────────────────────────────────────────────────────────────────
export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'card' | 'receivable';

export interface SalePayment {
  method: PaymentMethod;
  amount: number;
  walletId: string;         // linked to FinTrack wallet
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

// ─── Stock History ────────────────────────────────────────────────────────────
export type StockMoveType = 'sale' | 'restock' | 'adjustment' | 'damage' | 'return';

export interface StockHistory {
  id: string;
  productId: string;
  productName: string;
  type: StockMoveType;
  quantity: number;         // positive = in, negative = out
  stockBefore: number;
  stockAfter: number;
  reference: string;        // sale ID or manual note
  cashierId: string;
  createdAt: string;
}

// ─── Receipt Settings ─────────────────────────────────────────────────────────
export interface ReceiptSettings {
  // Header
  showLogo: boolean;
  showStoreName: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showHeaderText: boolean;

  // Body
  showReceiptNumber: boolean;
  showDate: boolean;
  showCashierName: boolean;
  showCustomerName: boolean;
  showSku: boolean;
  showItemNote: boolean;
  showItemDiscount: boolean;

  // Footer
  showSubtotal: boolean;
  showDiscount: boolean;
  showTax: boolean;
  showPaymentMethod: boolean;
  showChange: boolean;
  showFooterText: boolean;
  showThankYou: boolean;

  // Style
  fontFamily: 'monospace' | 'sans';
  paperWidth: '58mm' | '80mm';
  fontSize: 'small' | 'normal' | 'large';
  dividerStyle: 'dashed' | 'solid' | 'double' | 'none';

  // Fonnte WA
  waReceiptEnabled: boolean;
  waDefaultPhone: string; // pre-fill pelanggan
}

// ─── Setup Wizard Steps ───────────────────────────────────────────────────────
export type SetupStep = 'store' | 'logo' | 'gas' | 'owner' | 'done';
