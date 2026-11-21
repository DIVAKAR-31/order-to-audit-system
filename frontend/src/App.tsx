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
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Application Notice</h2>
            <p className="text-sm text-slate-600 mt-2">
              An unexpected render issue occurred. You can reload the application to continue smoothly.
            </p>
            {this.state.error?.message && (
              <div className="mt-4 p-3 bg-slate-100 rounded-xl text-xs font-mono text-slate-700 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { user, loading, canAccess, switchRole } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium text-sm">Loading Order-to-Audit System...</p>
        </div>
      </div>
    );
  }

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
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
