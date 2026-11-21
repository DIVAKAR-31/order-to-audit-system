import React, { useEffect, useState } from 'react';
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Clock,
  CheckCircle2,
  Factory,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { api } from '../../api/client';
import { DashboardStats } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-sm font-medium text-slate-500">Loading factory dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-700/60 text-blue-200 text-xs font-semibold mb-2">
              <span>🏭 Plant Operational Status: Optimal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Partner'}!
            </h1>
            <p className="text-sm text-blue-200/90 mt-1 max-w-2xl">
              Order-to-Audit system monitoring batch production of <b>Murukku, Mixture, Chips and Sweets</b> with real-time stock deductions and 5% GST reconciliation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('orders')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Order</span>
            </button>
            <button
              onClick={() => onNavigate('production')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Factory className="w-4 h-4" />
              <span>Log Batch</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={fetchStats} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Main 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Net Sales"
          value={formatCurrency(stats?.total_sales || 0)}
          subtitle="All invoiced revenue"
          icon={IndianRupee}
          variant="blue"
          trend={{ value: '18.4% MoM', positive: true }}
        />
        <StatCard
          title="Today's Orders"
          value={stats?.today_orders_count || 0}
          subtitle={`${stats?.pending_orders_count || 0} pending dispatch`}
          icon={ShoppingBag}
          variant="emerald"
          trend={{ value: '2 booked today', positive: true }}
        />
        <StatCard
          title="Finished Stock"
          value={`${(stats?.available_stock_packets || 0).toLocaleString()} pkts`}
          subtitle="Packets in dispatch warehouse"
          icon={Package}
          variant="amber"
        />
        <StatCard
          title="Production Output"
          value={`${(stats?.today_production_packets || 0).toLocaleString()} pkts`}
          subtitle="Produced today"
          icon={Factory}
          variant="purple"
          trend={{ value: 'Avg loss: 1.8%', positive: true }}
        />
      </div>

      {/* Secondary Highlights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Pending Approvals</p>
            <h4 className="text-xl font-bold text-amber-600">{stats?.pending_orders_count || 0} Orders</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Approved / In-Transit</p>
            <h4 className="text-xl font-bold text-blue-600">{stats?.approved_orders_count || 0} Orders</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Outstanding Receivables</p>
            <h4 className="text-xl font-bold text-rose-600">{formatCurrency(stats?.total_receivables || 0)}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Monthly Sales & Production Yield</h3>
              <p className="text-xs text-slate-500">Revenue (₹) vs Finished Packets Produced over last 6 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-3 h-3 rounded-sm bg-blue-600" /> Revenue (₹)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Yield (Packets)
              </span>
            </div>
          </div>

          {/* SVG Bar / Line visualization */}
          <div className="h-64 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
            {(stats?.monthly_trend || []).map((m, idx) => {
              const maxSales = 450000;
              const maxProd = 7000;
              const salesHeight = Math.max(15, (m.sales / maxSales) * 190);
              const prodHeight = Math.max(15, (m.production / maxProd) * 190);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] rounded-lg p-2 pointer-events-none whitespace-nowrap shadow-lg z-20">
                    <p className="font-bold">{m.month}: ₹{(m.sales).toLocaleString()}</p>
                    <p className="text-emerald-300">{m.production.toLocaleString()} packets (Loss: {m.wastage}%)</p>
                  </div>

                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2">
                    <div
                      style={{ height: `${salesHeight}px` }}
                      className="w-1/2 bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-md transition-all duration-300 group-hover:from-blue-600 group-hover:to-blue-400"
                    />
                    <div
                      style={{ height: `${prodHeight}px` }}
                      className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-300 group-hover:from-emerald-500 group-hover:to-emerald-300"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 mt-2">{m.month}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>* Peak season festive orders in October (Diwali)</span>
            <span className="font-medium text-emerald-600">Factory Wastage Target: &lt; 2.5% (Achieved: 1.7%)</span>
          </div>
        </div>

        {/* Snack Categories Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-base">Snack Product Inventory</h3>
              <span className="text-xs font-semibold text-blue-600">By Category</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Ready-to-dispatch packets in warehouse</p>

            <div className="space-y-3.5">
              {(stats?.category_sales || []).map((cat, idx) => {
                const totalStock = stats?.available_stock_packets || 1;
                const percentage = Math.round((cat.total_stock / totalStock) * 100);
                const colors = [
                  { bar: 'bg-blue-600', text: 'text-blue-700', bg: 'bg-blue-50' },
                  { bar: 'bg-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                  { bar: 'bg-amber-600', text: 'text-amber-700', bg: 'bg-amber-50' },
                  { bar: 'bg-rose-600', text: 'text-rose-700', bg: 'bg-rose-50' },
                ][idx % 4];

                return (
                  <div key={idx} className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1.5">
                      <span className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${colors.bar}`} />
                        {cat.category}
                      </span>
                      <span>{cat.total_stock.toLocaleString()} pkts ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors.bar}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                      <span>{cat.product_count} active varieties</span>
                      <span className="text-slate-500 font-medium">Ready Stock</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigate('products')}
            className="w-full mt-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-1"
          >
            <span>View All Products</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tables Row: Recent Orders & Recent Production Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Sales Orders</h3>
              <p className="text-xs text-slate-500">Retailer & distributor bookings</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">City / State</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(stats?.recent_orders || []).map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-700">{o.order_number}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{o.customer_name}</td>
                    <td className="py-3 px-4 text-slate-500">{o.city}, {o.state}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{formatCurrency(o.total_amount)}</td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          o.status === 'Dispatched'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'Approved'
                            ? 'bg-blue-100 text-blue-800'
                            : o.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Production Batches */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Production Batch Yield & Loss</h3>
              <p className="text-xs text-slate-500">Murukku, Chips & Sweets line logs</p>
            </div>
            <button
              onClick={() => onNavigate('production')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3 px-4">Batch #</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4 text-center">Expected / Actual</th>
                  <th className="py-3 px-4 text-center">Wastage %</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(stats?.recent_batches || []).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700">{b.batch_number}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{b.product_name}</td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="text-slate-500">{b.expected_packets}</span> / <span className="font-bold text-slate-900">{b.actual_packets}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          b.wastage_percentage <= 2.0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {b.wastage_percentage}% ({b.wastage_kg} kg)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
