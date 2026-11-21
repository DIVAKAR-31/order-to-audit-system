import React from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Layers,
  Factory,
  FileText,
  CreditCard,
  BarChart3,
  Cookie,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activePage: string;
  onSelectPage: (page: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, canAccess } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Sales, orders & overview' },
    { id: 'products', label: 'Products', icon: Package, desc: 'Murukku, Mixture & Sweets' },
    { id: 'customers', label: 'Customers', icon: Users, desc: 'Retailers & Distributors' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, desc: 'Book & track snack orders' },
    { id: 'inventory', label: 'Inventory', icon: Layers, desc: 'Raw materials & packaging' },
    { id: 'production', label: 'Production', icon: Factory, desc: 'Batch logging & wastage' },
    { id: 'invoices', label: 'Invoices', icon: FileText, desc: '5% GST tax billing (TN/IGST)' },
    { id: 'payments', label: 'Payments', icon: CreditCard, desc: 'Collections & receipts' },
    { id: 'reports', label: 'Reports', icon: BarChart3, desc: 'Sales, yield & audit exports' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950/60">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/30">
            <Cookie className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white leading-tight">
              Order-to-Audit
            </h1>
            <p className="text-[11px] font-medium text-blue-400 flex items-center gap-1">
              <span>South Indian Snacks Mfg</span>
            </p>
          </div>
        </div>

        {/* Snacks Specialties Pill */}
        <div className="px-4 pt-3 pb-1">
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-300">
            <span className="font-semibold text-blue-300">Murukku</span>
            <span className="text-slate-500">•</span>
            <span className="font-semibold text-emerald-300">Mixture</span>
            <span className="text-slate-500">•</span>
            <span className="font-semibold text-amber-300">Chips</span>
            <span className="text-slate-500">•</span>
            <span className="font-semibold text-rose-300">Sweets</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operations & Audit
          </div>

          {menuItems.map((item) => {
            const hasAccess = canAccess(item.id);
            const isActive = activePage === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (hasAccess) {
                    onSelectPage(item.id);
                    onCloseMobile();
                  }
                }}
                disabled={!hasAccess}
                title={!hasAccess ? `Access restricted to ${item.label} for your role` : item.desc}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : hasAccess
                    ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-600 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? 'text-white' : hasAccess ? 'text-blue-400' : 'text-slate-600'
                    }`}
                  />
                  <div className="text-left">
                    <div className="leading-snug">{item.label}</div>
                  </div>
                </div>

                {isActive && (
                  <ChevronRight className="w-4 h-4 text-white/80" />
                )}

                {!hasAccess && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 uppercase font-mono">
                    Lock
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Role Card in Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-sm">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.full_name || 'Admin User'}
              </p>
              <p className="text-[11px] text-blue-400 capitalize flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 inline" />
                {user?.role?.replace('_', ' ') || 'Admin'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
