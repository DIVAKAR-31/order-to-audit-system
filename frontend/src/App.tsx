import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './components/auth/LoginPage';

import { DashboardPage } from './components/pages/DashboardPage';
import { ProductsPage } from './components/pages/ProductsPage';
import { CustomersPage } from './components/pages/CustomersPage';
import { OrdersPage } from './components/pages/OrdersPage';
import { InventoryPage } from './components/pages/InventoryPage';
import { ProductionPage } from './components/pages/ProductionPage';
import { InvoicesPage } from './components/pages/InvoicesPage';
import { PaymentsPage } from './components/pages/PaymentsPage';
import { ReportsPage } from './components/pages/ReportsPage';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, canAccess, switchRole } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!user) {
    return <LoginPage />;
  }

  const hasPageAccess = canAccess(activePage);

  const renderPage = () => {
    if (!hasPageAccess) {
      return (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Access Restricted</h3>
          <p className="text-sm text-slate-500 mt-2">
            The page <span className="font-semibold text-slate-800 capitalize">"{activePage}"</span> is restricted for role <span className="font-mono font-semibold text-blue-700 capitalize">"{user.role.replace('_', ' ')}"</span>.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => setActivePage('dashboard')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
            <button
              onClick={() => switchRole('admin')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
            >
              Switch to Admin Role
            </button>
          </div>
        </div>
      );
    }

    switch (activePage) {
      case 'dashboard':
        return <DashboardPage key={refreshTrigger} onNavigate={setActivePage} />;
      case 'products':
        return <ProductsPage key={refreshTrigger} />;
      case 'customers':
        return <CustomersPage key={refreshTrigger} />;
      case 'orders':
        return <OrdersPage key={refreshTrigger} />;
      case 'inventory':
        return <InventoryPage key={refreshTrigger} />;
      case 'production':
        return <ProductionPage key={refreshTrigger} />;
      case 'invoices':
        return <InvoicesPage key={refreshTrigger} />;
      case 'payments':
        return <PaymentsPage key={refreshTrigger} />;
      case 'reports':
        return <ReportsPage key={refreshTrigger} />;
      default:
        return <DashboardPage key={refreshTrigger} onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Sidebar */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          activePage={activePage}
          onOpenMobile={() => setIsMobileMenuOpen(true)}
          onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
