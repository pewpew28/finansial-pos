import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import WalletsScreen from './screens/WalletsScreen';
import DebtsScreen from './screens/DebtsScreen';
import InstallmentsScreen from './screens/InstallmentsScreen';
import NotificationScreen from './screens/NotificationScreen';
import ExportScreen from './screens/ExportScreen';
import SettingsScreen from './screens/SettingsScreen';
import BottomNav from './components/BottomNav';
import { TabType } from './types';

// ─── FinTrack Content ─────────────────────────────────────────────────────────
function FinTrackContent() {
  const { isAuthenticated, settings } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  if (!isAuthenticated || !settings.isSetup) {
    return <LoginScreen />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':     return <DashboardScreen />;
      case 'transactions':  return <TransactionsScreen />;
      case 'wallets':       return <WalletsScreen />;
      case 'debts':         return <DebtsScreen />;
      case 'installments':  return <InstallmentsScreen />;
      case 'notifications': return <NotificationScreen />;
      case 'export':        return <ExportScreen />;
      case 'settings':      return <SettingsScreen />;
      default:              return <DashboardScreen />;
    }
  };

  return (
    <div className="relative bg-gray-50 max-w-lg mx-auto min-h-screen">
      <div className="overflow-y-auto" style={{ height: '100dvh', paddingBottom: '80px' }}>
        {renderScreen()}
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export function App() {
  return (
    <AppProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '14px',
            background: '#1e1b4b',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '600',
            padding: '10px 16px',
            maxWidth: '320px',
          },
          success: { iconTheme: { primary: '#a78bfa', secondary: '#1e1b4b' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#1e1b4b' } },
        }}
      />
      <FinTrackContent />
    </AppProvider>
  );
}
