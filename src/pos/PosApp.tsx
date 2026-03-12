import { Toaster } from 'react-hot-toast';
import { PosProvider, usePos } from './context/PosContext';
import SetupScreen from './screens/SetupScreen';
import PosLoginScreen from './screens/PosLoginScreen';
import PosDashboardScreen from './screens/PosDashboardScreen';
import CashiersScreen from './screens/CashiersScreen';
import PosSettingsScreen from './screens/PosSettingsScreen';
import ProductsScreen from './screens/ProductsScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import CashierScreen from './screens/CashierScreen';
import ReceiptSettingsScreen from './screens/ReceiptSettingsScreen';
import StockScreen from './screens/StockScreen';
import ReportsScreen from './screens/ReportsScreen';
import StoreSettingsScreen from './screens/StoreSettingsScreen';
import ShiftHistoryScreen from './screens/ShiftHistoryScreen';
import PosExportScreen from './screens/PosExportScreen';
import PosNotifScreen from './screens/PosNotifScreen';
import PosBottomNav from './components/PosBottomNav';

// Role-based screen access control
const CASHIER_ALLOWED: string[] = ['dashboard', 'cashier'];
const MANAGER_ALLOWED: string[] = [
  'dashboard', 'cashier', 'products', 'categories',
  'stock', 'reports', 'settings', 'shift-history', 'export', 'notif',
];

// Screens that hide the bottom nav
const NO_NAV_SCREENS = [
  'cashiers', 'setup', 'login', 'categories', 'stock',
  'receipt-settings', 'store-settings', 'shift-history',
  'export', 'notif',
];

function PosContent() {
  const { screen, setScreen, store, currentCashier } = usePos();

  // First time setup
  if (!store.isSetup) return <SetupScreen />;

  // Not logged in
  if (!currentCashier) return <PosLoginScreen />;

  // Guard: redirect unauthorized screen access
  const role = currentCashier.role;
  const allowed =
    role === 'owner' ? null
    : role === 'manager' ? MANAGER_ALLOWED
    : CASHIER_ALLOWED;

  if (allowed && !allowed.includes(screen)) {
    setTimeout(() => setScreen('dashboard'), 0);
    return null;
  }

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return <PosDashboardScreen />;

      case 'cashier':
        return <CashierScreen />;

      case 'products':
        return <ProductsScreen />;

      case 'categories':
        return <CategoriesScreen onBack={() => setScreen('products')} />;

      case 'stock':
        return <StockScreen />;

      case 'reports':
        return <ReportsScreen />;

      case 'cashiers':
        return <CashiersScreen />;

      case 'receipt-settings':
        return <ReceiptSettingsScreen onBack={() => setScreen('settings')} />;

      case 'store-settings':
        return <StoreSettingsScreen onBack={() => setScreen('settings')} />;

      case 'shift-history':
        return <ShiftHistoryScreen onBack={() => setScreen('reports')} />;

      case 'export':
        return <PosExportScreen onBack={() => setScreen('settings')} />;

      case 'notif':
        return <PosNotifScreen onBack={() => setScreen('settings')} />;

      case 'settings':
        return <PosSettingsScreen />;

      default:
        return <PosDashboardScreen />;
    }
  };

  const showNav = !NO_NAV_SCREENS.includes(screen);

  return (
    <div className="relative bg-gray-50 max-w-lg mx-auto min-h-screen">
      <div
        className="overflow-y-auto"
        style={{ height: '100dvh', paddingBottom: showNav ? '80px' : '0px' }}
      >
        {renderScreen()}
      </div>
      {showNav && <PosBottomNav />}
    </div>
  );
}

export default function PosApp() {
  return (
    <PosProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '14px',
            background: '#064e3b',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '600',
            padding: '10px 16px',
            maxWidth: '320px',
          },
          success: { iconTheme: { primary: '#6ee7b7', secondary: '#064e3b' } },
          error: {
            style: { background: '#7f1d1d' },
            iconTheme: { primary: '#fca5a5', secondary: '#7f1d1d' },
          },
        }}
      />
      <PosContent />
    </PosProvider>
  );
}
