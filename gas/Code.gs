// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║           FinTrack + FinPOS — Google Apps Script Backend                    ║
// ║           Versi: 1.0.0  |  Support: FinTrack & FinPOS                      ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
//
// CARA SETUP:
// 1. Buka Google Sheets baru → Extensions → Apps Script
// 2. Hapus semua kode yang ada, paste kode ini
// 3. Ganti SPREADSHEET_ID dan DRIVE_FOLDER_ID di bawah
// 4. Klik Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Authorize → Copy URL deployment
// 6. Paste URL di FinTrack (Settings) dan FinPOS (Setup)

// ─── KONFIGURASI — WAJIB DIUBAH ──────────────────────────────────────────────
var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // ID dari URL Google Sheets
var DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID'; // ID folder Google Drive untuk foto produk

// ─── NAMA SHEET ───────────────────────────────────────────────────────────────
var SHEETS = {
  // FinTrack
  WALLETS:          'FT_Wallets',
  TRANSACTIONS:     'FT_Transactions',
  DEBTS:            'FT_Debts',
  INSTALLMENTS:     'FT_Installments',

  // FinPOS
  POS_STORE:        'POS_Store',
  POS_CASHIERS:     'POS_Cashiers',
  POS_CATEGORIES:   'POS_Categories',
  POS_PRODUCTS:     'POS_Products',
  POS_SALES:        'POS_Sales',
  POS_SALE_ITEMS:   'POS_SaleItems',
  POS_STOCK_HISTORY:'POS_StockHistory',
  POS_SHIFTS:       'POS_Shifts',
};

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
function doGet(e) {
  var action = e.parameter.action || '';
  var callback = e.parameter.callback || '';

  try {
    var result = handleGet(action, e.parameter);
    var json = JSON.stringify({ success: true, data: result });
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + json + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService
      .createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    var errJson = JSON.stringify({ success: false, error: err.toString() });
    return ContentService
      .createTextOutput(errJson)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action || '';
    var result = handlePost(action, body);

    // Special case: uploadImage returns content directly
    if (action === 'uploadImage') {
      return ContentService
        .createTextOutput(result)
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── GET ROUTER ───────────────────────────────────────────────────────────────
function handleGet(action, params) {
  initSheets();
  switch (action) {
    // FinTrack
    case 'getAll':         return getAllFinTrack();
    case 'getWallets':     return getSheetData(SHEETS.WALLETS);
    case 'getTransactions':return getSheetData(SHEETS.TRANSACTIONS);
    case 'getDebts':       return getSheetData(SHEETS.DEBTS);
    case 'getInstallments':return getSheetData(SHEETS.INSTALLMENTS);

    // FinPOS
    case 'posGetAll':      return getAllFinPOS();
    case 'posGetProducts': return getSheetData(SHEETS.POS_PRODUCTS);
    case 'posGetSales':    return getPOSSales(params);
    case 'posGetShifts':   return getSheetData(SHEETS.POS_SHIFTS);
    case 'posGetStock':    return getSheetData(SHEETS.POS_STOCK_HISTORY);

    // Test connection
    case 'ping':           return { pong: true, timestamp: new Date().toISOString(), version: '1.0.0' };

    default:
      return { message: 'FinTrack + FinPOS GAS v1.0.0 - OK' };
  }
}

// ─── POST ROUTER ──────────────────────────────────────────────────────────────
function handlePost(action, body) {
  initSheets();

  switch (action) {
    // ──── FinTrack ────────────────────────────────────────────────────────────
    case 'addWallet':
      return appendRow(SHEETS.WALLETS, body.wallet);
    case 'updateWallet':
      return updateRow(SHEETS.WALLETS, body.id, body.data);
    case 'deleteWallet':
      return deleteRow(SHEETS.WALLETS, body.id);

    case 'addTransaction':
      return appendRow(SHEETS.TRANSACTIONS, body.transaction);
    case 'deleteTransaction':
      return deleteRow(SHEETS.TRANSACTIONS, body.id);

    case 'addDebt':
      return appendRow(SHEETS.DEBTS, body.debt);
    case 'updateDebt':
      return updateRow(SHEETS.DEBTS, body.id, body.data);
    case 'deleteDebt':
      return deleteRow(SHEETS.DEBTS, body.id);
    case 'payDebt':
      return payDebtHandler(body.id, body.amount);

    case 'addInstallment':
      return appendRow(SHEETS.INSTALLMENTS, body.installment);
    case 'updateInstallment':
      return updateRow(SHEETS.INSTALLMENTS, body.id, body.data);
    case 'deleteInstallment':
      return deleteRow(SHEETS.INSTALLMENTS, body.id);
    case 'payInstallmentMonth':
      return payInstallmentHandler(body.id);

    // ──── FinPOS ──────────────────────────────────────────────────────────────
    case 'uploadImage':
      return handleUploadImage(body);

    case 'posSetupStore':
      return posSetupStore(body.store);

    case 'addPosCashier':
      return appendRow(SHEETS.POS_CASHIERS, body.cashier);
    case 'updatePosCashier':
      return updateRow(SHEETS.POS_CASHIERS, body.id, body.data);
    case 'deletePosCashier':
      return deleteRow(SHEETS.POS_CASHIERS, body.id);

    case 'addPosCategory':
      return appendRow(SHEETS.POS_CATEGORIES, body.category);
    case 'updatePosCategory':
      return updateRow(SHEETS.POS_CATEGORIES, body.id, body.data);
    case 'deletePosCategory':
      return deleteRow(SHEETS.POS_CATEGORIES, body.id);

    case 'addPosProduct':
      return appendRow(SHEETS.POS_PRODUCTS, flattenObject(body.product));
    case 'updatePosProduct':
      return updateRow(SHEETS.POS_PRODUCTS, body.id, body.data);
    case 'deletePosProduct':
      return deleteRow(SHEETS.POS_PRODUCTS, body.id);

    case 'addPosSale':
      return handleAddSale(body.sale);

    case 'addPosStockHistory':
      return appendRow(SHEETS.POS_STOCK_HISTORY, body.history);

    case 'addPosShift':
      return appendRow(SHEETS.POS_SHIFTS, body.shift);
    case 'updatePosShift':
      return updateRow(SHEETS.POS_SHIFTS, body.id, body.data);
    case 'closePosShift':
      return closePosShift(body.id, body.data);

    // Sync dari FinPOS ke FinTrack (otomatis catat pemasukan)
    case 'syncSaleToFinTrack':
      return syncSaleToFinTrack(body.sale, body.walletId);

    default:
      return { message: 'Action tidak dikenal: ' + action };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SHEET INITIALIZATION ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function initSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // FinTrack Sheets
  ensureSheet(ss, SHEETS.WALLETS,       ['id','name','balance','color','icon','createdAt']);
  ensureSheet(ss, SHEETS.TRANSACTIONS,  ['id','type','amount','category','description','walletId','date','createdAt']);
  ensureSheet(ss, SHEETS.DEBTS,         ['id','type','personName','amount','remainingAmount','dueDate','description','isPaid','createdAt']);
  ensureSheet(ss, SHEETS.INSTALLMENTS,  ['id','name','totalAmount','monthlyAmount','totalCount','paidCount','walletId','startDate','status','createdAt']);

  // FinPOS Sheets
  ensureSheet(ss, SHEETS.POS_STORE,     ['key','value','updatedAt']);
  ensureSheet(ss, SHEETS.POS_CASHIERS,  ['id','name','role','avatarEmoji','isActive','createdAt','lastLogin']);
  ensureSheet(ss, SHEETS.POS_CATEGORIES,['id','name','emoji','color','isActive','sortOrder','createdAt']);
  ensureSheet(ss, SHEETS.POS_PRODUCTS,  ['id','sku','name','categoryId','price','costPrice','stock','minStock','unit','imageUrl','barcode','isActive','createdAt','updatedAt']);
  ensureSheet(ss, SHEETS.POS_SALES,     ['id','receiptNumber','cashierId','cashierName','shiftId','customerName','subtotal','discountPercent','discountAmount','taxPercent','taxAmount','total','change','notes','paymentMethods','createdAt']);
  ensureSheet(ss, SHEETS.POS_SALE_ITEMS,['saleId','receiptNumber','productId','productName','price','quantity','discountPercent','discountAmount','note','subtotal']);
  ensureSheet(ss, SHEETS.POS_STOCK_HISTORY,['id','productId','productName','type','quantity','stockBefore','stockAfter','reference','cashierId','createdAt']);
  ensureSheet(ss, SHEETS.POS_SHIFTS,   ['id','cashierId','cashierName','openedAt','closedAt','openingCash','closingCash','totalSales','totalTransactions','notes']);
}

function ensureSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#7C3AED')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GENERIC CRUD ─────────────────────────────────════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════

function getSheetData(sheetName) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow(sheetName, obj) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: 'Sheet not found: ' + sheetName };
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) {
    var val = obj[h];
    if (val === undefined || val === null) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return val;
  });
  sheet.appendRow(row);
  return { ok: true };
}

function updateRow(sheetName, id, updates) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: 'Sheet not found' };
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx = headers.indexOf('id');
  if (idIdx < 0) return { error: 'No id column' };

  for (var i = 1; i < data.length; i++) {
    if (data[i][idIdx] == id) {
      Object.keys(updates).forEach(function(key) {
        var colIdx = headers.indexOf(key);
        if (colIdx >= 0) {
          var val = updates[key];
          if (typeof val === 'object') val = JSON.stringify(val);
          sheet.getRange(i + 1, colIdx + 1).setValue(val);
        }
      });
      return { ok: true };
    }
  }
  return { error: 'Row not found: ' + id };
}

function deleteRow(sheetName, id) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: 'Sheet not found' };
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx = headers.indexOf('id');
  if (idIdx < 0) return { error: 'No id column' };

  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][idIdx] == id) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { error: 'Row not found' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── FINTRACK SPECIFIC ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function getAllFinTrack() {
  return {
    wallets:      getSheetData(SHEETS.WALLETS),
    transactions: getSheetData(SHEETS.TRANSACTIONS),
    debts:        getSheetData(SHEETS.DEBTS),
    installments: getSheetData(SHEETS.INSTALLMENTS),
  };
}

function payDebtHandler(id, amount) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEETS.DEBTS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx = headers.indexOf('id');
  var remainingIdx = headers.indexOf('remainingAmount');
  var isPaidIdx = headers.indexOf('isPaid');

  for (var i = 1; i < data.length; i++) {
    if (data[i][idIdx] == id) {
      var remaining = Math.max(0, data[i][remainingIdx] - amount);
      sheet.getRange(i + 1, remainingIdx + 1).setValue(remaining);
      sheet.getRange(i + 1, isPaidIdx + 1).setValue(remaining === 0);
      return { ok: true, remaining: remaining };
    }
  }
  return { error: 'Debt not found' };
}

function payInstallmentHandler(id) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEETS.INSTALLMENTS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx = headers.indexOf('id');
  var paidCountIdx = headers.indexOf('paidCount');
  var totalCountIdx = headers.indexOf('totalCount');
  var statusIdx = headers.indexOf('status');

  for (var i = 1; i < data.length; i++) {
    if (data[i][idIdx] == id) {
      var newPaid = data[i][paidCountIdx] + 1;
      var total = data[i][totalCountIdx];
      var status = newPaid >= total ? 'paid' : 'active';
      sheet.getRange(i + 1, paidCountIdx + 1).setValue(newPaid);
      sheet.getRange(i + 1, statusIdx + 1).setValue(status);
      return { ok: true, paidCount: newPaid, status: status };
    }
  }
  return { error: 'Installment not found' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── FINPOS SPECIFIC ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function getAllFinPOS() {
  return {
    cashiers:     getSheetData(SHEETS.POS_CASHIERS),
    categories:   getSheetData(SHEETS.POS_CATEGORIES),
    products:     getSheetData(SHEETS.POS_PRODUCTS),
    sales:        getSheetData(SHEETS.POS_SALES).slice(-100), // last 100
    stockHistory: getSheetData(SHEETS.POS_STOCK_HISTORY).slice(-200),
    shifts:       getSheetData(SHEETS.POS_SHIFTS).slice(-50),
  };
}

function getPOSSales(params) {
  var sales = getSheetData(SHEETS.POS_SALES);
  var startDate = params.startDate || '';
  var endDate = params.endDate || '';
  var cashierId = params.cashierId || '';

  if (startDate) {
    sales = sales.filter(function(s) { return s.createdAt >= startDate; });
  }
  if (endDate) {
    sales = sales.filter(function(s) { return s.createdAt <= endDate; });
  }
  if (cashierId) {
    sales = sales.filter(function(s) { return s.cashierId === cashierId; });
  }
  return sales;
}

function handleAddSale(sale) {
  // 1. Simpan ke POS_Sales
  var saleRow = {
    id:             sale.id,
    receiptNumber:  sale.receiptNumber,
    cashierId:      sale.cashierId,
    cashierName:    sale.cashierName,
    shiftId:        sale.shiftId,
    customerName:   sale.customerName,
    subtotal:       sale.subtotal,
    discountPercent:sale.discountPercent,
    discountAmount: sale.discountAmount,
    taxPercent:     sale.taxPercent,
    taxAmount:      sale.taxAmount,
    total:          sale.total,
    change:         sale.change,
    notes:          sale.notes,
    paymentMethods: JSON.stringify(sale.payments),
    createdAt:      sale.createdAt,
  };
  appendRow(SHEETS.POS_SALES, saleRow);

  // 2. Simpan item detail ke POS_SaleItems
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var itemSheet = ss.getSheetByName(SHEETS.POS_SALE_ITEMS);
  if (sale.items && sale.items.length > 0) {
    sale.items.forEach(function(item) {
      appendRow(SHEETS.POS_SALE_ITEMS, {
        saleId:          sale.id,
        receiptNumber:   sale.receiptNumber,
        productId:       item.productId,
        productName:     item.productName,
        price:           item.price,
        quantity:        item.quantity,
        discountPercent: item.discountPercent,
        discountAmount:  item.discountAmount,
        note:            item.note,
        subtotal:        item.subtotal,
      });
    });
  }

  // 3. Update stok produk di sheet
  if (sale.items && sale.items.length > 0) {
    updateStockAfterSale(sale.items);
  }

  return { ok: true, saleId: sale.id };
}

function updateStockAfterSale(items) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEETS.POS_PRODUCTS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx = headers.indexOf('id');
  var stockIdx = headers.indexOf('stock');

  items.forEach(function(item) {
    for (var i = 1; i < data.length; i++) {
      if (data[i][idIdx] == item.productId) {
        var newStock = Math.max(0, data[i][stockIdx] - item.quantity);
        sheet.getRange(i + 1, stockIdx + 1).setValue(newStock);
        break;
      }
    }
  });
}

function posSetupStore(store) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEETS.POS_STORE);
  // Clear and rewrite store config
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 3).clearContent();
  }
  var now = new Date().toISOString();
  Object.keys(store).forEach(function(key) {
    sheet.appendRow([key, store[key], now]);
  });
  return { ok: true };
}

function closePosShift(id, data) {
  updateRow(SHEETS.POS_SHIFTS, id, data);
  return { ok: true };
}

// ─── Sync POS Sale → FinTrack Transaction ─────────────────────────────────────
function syncSaleToFinTrack(sale, walletId) {
  var transaction = {
    id:          'pos_' + sale.id,
    type:        'income',
    amount:      sale.total,
    category:    'Penjualan POS',
    description: 'POS ' + sale.receiptNumber + ' - ' + sale.cashierName,
    walletId:    walletId,
    date:        sale.createdAt.split('T')[0],
    createdAt:   sale.createdAt,
  };
  return appendRow(SHEETS.TRANSACTIONS, transaction);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GOOGLE DRIVE IMAGE UPLOAD ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function handleUploadImage(data) {
  try {
    var folder;
    try {
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    } catch (e) {
      // Jika folder tidak ditemukan, buat folder baru
      folder = DriveApp.createFolder('FinPOS_Images');
    }

    // Detect MIME type dari base64 header atau default ke JPEG
    var mimeType = 'image/jpeg';
    var base64Data = data.base64;

    if (base64Data && base64Data.indexOf('data:') === 0) {
      var parts = base64Data.split(',');
      mimeType = parts[0].split(':')[1].split(';')[0];
      base64Data = parts[1];
    }

    var blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      mimeType,
      data.filename || ('image_' + Date.now() + '.jpg')
    );

    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var url = 'https://drive.google.com/uc?export=view&id=' + fileId;
    var thumbnailUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400';

    return JSON.stringify({
      success: true,
      url:          url,
      thumbnailUrl: thumbnailUrl,
      fileId:       fileId,
    });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function flattenObject(obj) {
  var result = {};
  Object.keys(obj).forEach(function(key) {
    var val = obj[key];
    if (typeof val === 'object' && val !== null) {
      result[key] = JSON.stringify(val);
    } else {
      result[key] = val;
    }
  });
  return result;
}

// ─── TEST FUNCTION (jalankan manual untuk test) ───────────────────────────────
function testSetup() {
  initSheets();
  Logger.log('✅ Semua sheet berhasil dibuat!');
  Logger.log('Sheets: ' + Object.values(SHEETS).join(', '));

  // Test ping
  var result = handleGet('ping', {});
  Logger.log('Ping result: ' + JSON.stringify(result));
}

// ─── TRIGGER: Auto-backup harian ─────────────────────────────────────────────
function setupDailyBackup() {
  // Jalankan 1x untuk setup trigger backup harian jam 23:00
  ScriptApp.newTrigger('dailyBackup')
    .timeBased()
    .atHour(23)
    .everyDays(1)
    .create();
}

function dailyBackup() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var backupName = 'Backup_' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd');
  ss.copy(backupName);
  Logger.log('Backup created: ' + backupName);
}
