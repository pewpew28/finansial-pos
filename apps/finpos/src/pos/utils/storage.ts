export const POS_KEYS = {
  store: 'finpos_store',
  cashiers: 'finpos_cashiers',
  categories: 'finpos_categories',
  products: 'finpos_products',
  sales: 'finpos_sales',
  stockHistory: 'finpos_stock_history',
  shifts: 'finpos_shifts',
  currentShift: 'finpos_current_shift',
  lastSync: 'finpos_last_sync',
  receiptSettings: 'finpos_receipt_settings',
} as const;

export function posLoad<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function posSave<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function posRemove(key: string): void {
  localStorage.removeItem(key);
}

export const generatePosId = (): string =>
  `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const generateSku = (name: string): string => {
  const prefix = name.slice(0, 3).toUpperCase().replace(/\s/g, '');
  const suffix = Date.now().toString().slice(-5);
  return `${prefix}-${suffix}`;
};

export const generateReceiptNumber = (): string => {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  return `INV-${date}-${time}`;
};

export const encodePin = (pin: string): string => btoa(pin);
export const decodePin = (encoded: string): string => {
  try { return atob(encoded); } catch { return ''; }
};
export const verifyPin = (input: string, encoded: string): boolean =>
  input === decodePin(encoded);
