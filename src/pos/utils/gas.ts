// ─── POS Google Apps Script Integration ──────────────────────────────────────

export async function posGasPost(gasUrl: string, action: string, payload: object): Promise<void> {
  if (!gasUrl) return;
  try {
    await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    // silent fail on no-cors
  }
}

/**
 * Upload image to Google Drive via GAS and get back a public URL.
 * GAS must handle action: 'uploadImage' and return { url: string }
 */
export async function uploadImageToGDrive(
  gasUrl: string,
  base64: string,
  filename: string
): Promise<string> {
  if (!gasUrl) throw new Error('GAS URL belum diset');
  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'uploadImage',
      filename,
      base64,
    }),
  });
  const data = await response.json();
  if (!data.url) throw new Error('Upload gagal: ' + (data.error || 'Unknown'));
  return data.url as string;
}

/** Convert File to base64 string */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix: "data:image/jpeg;base64,..."
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Convert File to full data URL (for local preview) */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── GAS Script Template ─────────────────────────────────────────────────────
export const GAS_POS_ADDON = `
// ─── ADD THIS TO YOUR EXISTING GAS SCRIPT ────────────────────────────────────
// This extends the FinTrack GAS with POS support + Google Drive image upload

// Add these sheets if they don't exist:
// POS_Products, POS_Categories, POS_Sales, POS_StockHistory, POS_Cashiers

function handlePosAction(action, data, ss) {
  switch (action) {
    case 'uploadImage':      return handleUploadImage(data);
    case 'addPosProduct':    return appendToSheet(ss, 'POS_Products', data.product);
    case 'updatePosProduct': return updateSheetRow(ss, 'POS_Products', data.id, data.data);
    case 'addPosSale':       return appendToSheet(ss, 'POS_Sales', flattenSale(data.sale));
    case 'addStockHistory':  return appendToSheet(ss, 'POS_StockHistory', data.history);
    case 'addPosCashier':    return appendToSheet(ss, 'POS_Cashiers', data.cashier);
  }
}

function handleUploadImage(data) {
  const folder = DriveApp.getFolderById('YOUR_FOLDER_ID'); // ganti dengan folder ID
  const blob = Utilities.newBlob(
    Utilities.base64Decode(data.base64),
    'image/jpeg',
    data.filename
  );
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return JSON.stringify({ url: 'https://drive.google.com/uc?id=' + file.getId() });
}

function flattenSale(sale) {
  return {
    ...sale,
    items: JSON.stringify(sale.items),
    payments: JSON.stringify(sale.payments),
  };
}
`;
