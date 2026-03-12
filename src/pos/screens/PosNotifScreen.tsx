import { useState } from 'react';
import {
  ChevronLeft, Bell, Send, CheckCircle2, AlertCircle,
  ShoppingCart, Package, Clock, MessageSquare,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import toast from 'react-hot-toast';

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

async function sendFonnte(token: string, phone: string, message: string): Promise<boolean> {
  try {
    const res = await fetch('https://fontee.io/api/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target: phone, message }),
    });
    const data = await res.json();
    return data.status === true || res.ok;
  } catch {
    return false;
  }
}

export default function PosNotifScreen({ onBack }: { onBack: () => void }) {
  const { store, sales, products, currentShift } = usePos();
  const [sending, setSending] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState(store.fonntPhone);

  const hasConfig = store.fonntToken && store.fonntPhone;

  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.createdAt).toDateString() === today);
  const todayRevenue = todaySales.reduce((s, x) => s + x.total, 0);
  const lowStockProducts = products.filter(p => p.isActive && p.stock <= p.minStock && p.stock > 0);
  const outOfStockProducts = products.filter(p => p.isActive && p.stock === 0);

  const sendMessage = async (key: string, phone: string, message: string) => {
    if (!store.fonntToken) {
      toast.error('Token Fonnte belum diatur di Pengaturan Toko');
      return;
    }
    if (!phone) {
      toast.error('Nomor tujuan belum diisi');
      return;
    }
    setSending(key);
    const ok = await sendFonnte(store.fonntToken, phone, message);
    setSending(null);
    if (ok) {
      toast.success('Pesan WhatsApp berhasil dikirim! ✓');
    } else {
      toast.error('Gagal kirim WA. Periksa Token & nomor HP.');
    }
  };

  const buildDailyReport = () => {
    const lines = [
      `📊 *LAPORAN HARIAN — ${store.name}*`,
      `📅 ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      '',
      `💰 *Total Pendapatan: ${fmt(todayRevenue)}*`,
      `🧾 Jumlah Transaksi: ${todaySales.length}`,
      `🛍️ Item Terjual: ${todaySales.reduce((s, x) => s + x.items.reduce((ss, i) => ss + i.quantity, 0), 0)}`,
      '',
    ];

    // Per cashier breakdown
    const cashierMap: Record<string, { name: string; revenue: number; count: number }> = {};
    for (const sale of todaySales) {
      if (!cashierMap[sale.cashierId]) cashierMap[sale.cashierId] = { name: sale.cashierName, revenue: 0, count: 0 };
      cashierMap[sale.cashierId].revenue += sale.total;
      cashierMap[sale.cashierId].count += 1;
    }
    const cashierList = Object.values(cashierMap);
    if (cashierList.length > 0) {
      lines.push('👥 *Per Kasir:*');
      cashierList.forEach(c => lines.push(`  • ${c.name}: ${fmt(c.revenue)} (${c.count} trx)`));
      lines.push('');
    }

    // Shift summary
    if (currentShift) {
      lines.push(`⏱️ Shift aktif sejak ${new Date(currentShift.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
    }

    lines.push('');
    lines.push('_Dikirim otomatis oleh FinPOS_');
    return lines.join('\n');
  };

  const buildStockAlert = () => {
    if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
      return `✅ *Stok Aman — ${store.name}*\n\nSemua produk stok mencukupi.\n\n_Dikirim oleh FinPOS_`;
    }
    const lines = [
      `⚠️ *ALERT STOK — ${store.name}*`,
      `📅 ${new Date().toLocaleDateString('id-ID')}`,
      '',
    ];
    if (outOfStockProducts.length > 0) {
      lines.push(`🔴 *Stok Habis (${outOfStockProducts.length} produk):*`);
      outOfStockProducts.slice(0, 10).forEach(p => lines.push(`  • ${p.name} — 0 ${p.unit}`));
      lines.push('');
    }
    if (lowStockProducts.length > 0) {
      lines.push(`🟡 *Stok Menipis (${lowStockProducts.length} produk):*`);
      lowStockProducts.slice(0, 10).forEach(p => lines.push(`  • ${p.name} — ${p.stock} ${p.unit} (min: ${p.minStock})`));
      lines.push('');
    }
    lines.push('_Segera lakukan restok!_');
    lines.push('_Dikirim oleh FinPOS_');
    return lines.join('\n');
  };

  const buildShiftReport = () => {
    if (!currentShift) return 'Tidak ada shift aktif saat ini.';
    const diff = Date.now() - new Date(currentShift.openedAt).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return [
      `📋 *LAPORAN SHIFT — ${store.name}*`,
      `👤 Kasir: ${currentShift.cashierName}`,
      `⏰ Durasi: ${h}j ${m}m`,
      '',
      `🧾 Total Transaksi: ${currentShift.totalTransactions}`,
      `💰 Total Penjualan: ${fmt(currentShift.totalSales)}`,
      currentShift.openingCash > 0 ? `💵 Kas Awal: ${fmt(currentShift.openingCash)}` : '',
      '',
      '_Dikirim oleh FinPOS_',
    ].filter(Boolean).join('\n');
  };

  const ACTIONS = [
    {
      id: 'daily',
      icon: <ShoppingCart size={20} />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      label: 'Laporan Harian',
      desc: `${todaySales.length} transaksi hari ini · ${fmt(todayRevenue)}`,
      message: () => buildDailyReport(),
      phone: store.fonntPhone,
    },
    {
      id: 'stock',
      icon: <Package size={20} />,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      label: 'Alert Stok Kritis',
      desc: `${outOfStockProducts.length} habis · ${lowStockProducts.length} menipis`,
      message: () => buildStockAlert(),
      phone: store.fonntPhone,
    },
    {
      id: 'shift',
      icon: <Clock size={20} />,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      label: 'Rekap Shift Aktif',
      desc: currentShift ? `${currentShift.totalTransactions} trx · ${fmt(currentShift.totalSales)}` : 'Tidak ada shift aktif',
      message: () => buildShiftReport(),
      phone: store.fonntPhone,
      disabled: !currentShift,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center active:scale-90">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-white font-black text-lg">Notifikasi WhatsApp</h1>
            <p className="text-green-200 text-xs font-medium">via Fonnte</p>
          </div>
        </div>

        {/* Status */}
        <div className={`flex items-center gap-3 rounded-2xl p-3 border ${
          hasConfig
            ? 'bg-white/15 border-white/20'
            : 'bg-red-500/20 border-red-400/30'
        }`}>
          {hasConfig ? (
            <CheckCircle2 size={18} className="text-green-200 flex-shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-red-200 flex-shrink-0" />
          )}
          <div>
            <p className={`text-sm font-bold ${hasConfig ? 'text-white' : 'text-red-100'}`}>
              {hasConfig ? 'Fonnte Terhubung' : 'Fonnte Belum Dikonfigurasi'}
            </p>
            <p className={`text-xs ${hasConfig ? 'text-green-200' : 'text-red-200'}`}>
              {hasConfig ? `Token aktif · ${store.fonntPhone}` : 'Atur di Pengaturan Toko → Fonnte'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 pb-24 space-y-4">

        {/* Test message */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Kirim Pesan Test</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2 border border-gray-200">
              <MessageSquare size={14} className="text-gray-400 flex-shrink-0" />
              <input
                type="tel"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="628xxxxxxxxxx"
                className="flex-1 text-sm text-gray-800 bg-transparent outline-none font-medium"
              />
            </div>
            <button
              onClick={() => sendMessage('test', testPhone, `✅ *Test Notifikasi FinPOS*\n\nHalo dari ${store.name}!\nKoneksi Fonnte berhasil. 🎉\n\n_FinPOS v1.0_`)}
              disabled={sending === 'test'}
              className="flex items-center gap-1.5 bg-green-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-green-500/30 active:scale-95 transition-all disabled:opacity-60"
            >
              {sending === 'test' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Test
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Kirim Laporan</p>
        <div className="space-y-3">
          {ACTIONS.map(action => (
            <div key={action.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${action.disabled ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-11 h-11 ${action.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <span className={action.color}>{action.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{action.label}</p>
                  <p className="text-xs text-gray-400">{action.desc}</p>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Preview Pesan</p>
                <p className="text-[11px] text-gray-600 font-mono whitespace-pre-line leading-relaxed line-clamp-4">
                  {action.message()}
                </p>
              </div>

              <button
                onClick={() => sendMessage(action.id, action.phone, action.message())}
                disabled={!!sending || action.disabled}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                  action.disabled
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                }`}
              >
                {sending === action.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Kirim ke {action.phone || 'nomor owner'}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={14} className="text-green-600" />
            <p className="text-xs font-black text-green-700">Tentang Fonnte</p>
          </div>
          <p className="text-xs text-green-700 leading-relaxed">
            Fonnte adalah layanan WhatsApp API yang memungkinkan pengiriman pesan otomatis. 
            <strong> 1.000 pesan gratis/bulan</strong> untuk akun baru.{' '}
            <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">
              fonnte.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
