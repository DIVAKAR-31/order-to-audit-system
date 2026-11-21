import React from 'react';
import {
  Menu,
  Shield,
  LogOut,
  Bell,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface HeaderProps {
  activePage: string;
  onOpenMobile: () => void;
  onRefresh?: () => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Operations Dashboard', subtitle: 'Live overview of sales, orders, production yield and inventory' },
  products: { title: 'Products & Snacks Catalog', subtitle: 'Manage Murukku, Mixture, Chips and Sweets pricing & ready stock' },
  customers: { title: 'Customer Accounts (Retail & Wholesale)', subtitle: 'Retailers & Distributors directory with state GST tracking' },
  orders: { title: 'Order Booking & Dispatch Management', subtitle: 'Sales booking, workflow approvals, dispatch and invoice generation' },
  inventory: { title: 'Raw Material & Packaging Inventory', subtitle: 'Stock audit for flours, cooking oils, spices and packaging pouches' },
  production: { title: 'Snack Production & Wastage Tracking', subtitle: 'Supervisor batch run logging, expected vs actual yield & loss %' },
  invoices: { title: 'GST Tax Invoices & Billing', subtitle: '5% GST tax billing (CGST+SGST 2.5% for TN, IGST 5% Interstate) with PDF download' },
  payments: { title: 'Customer Collections & Payments', subtitle: 'Record receipts, auto-reconcile invoices and credit balances' },
  reports: { title: 'Business Audit Reports & Analytics', subtitle: 'Monthly sales, production loss, ledger audit with Excel & PDF export' },
};

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onOpenMobile,
  onRefresh,
}) => {
  const { user, logout, switchRole } = useAuth();
  const pageInfo = PAGE_TITLES[activePage] || { title: activePage, subtitle: '' };

  const roleLabels: Record<UserRole, { label: string; badgeClass: string }> = {
    admin: { label: 'Admin (Director)', badgeClass: 'bg-purple-100 text-purple-700 border-purple-200' },
    salesman: { label: 'Salesman', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
    production_supervisor: { label: 'Production Supervisor', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
    accountant: { label: 'Accountant', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  };

  const currentRole = (user?.role as UserRole) || 'admin';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {pageInfo.title}
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Role Switcher + User Profile + Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher (For seamless testing of all 4 roles) */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg p-1">
            <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-600" />
              Role:
            </span>
            {(['admin', 'salesman', 'production_supervisor', 'accountant'] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => switchRole(role)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                  currentRole === role
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {role === 'production_supervisor' ? 'Supervisor' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh data"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Role Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleLabels[currentRole].badgeClass}`}>
            <UserCheck className="w-3.5 h-3.5" />
            <span>{roleLabels[currentRole].label}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Sign out"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
