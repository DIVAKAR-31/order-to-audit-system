import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  Factory,
  Package,
  TrendingUp,
  Percent,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { api } from '../../api/client';
import { StatCard } from '../common/StatCard';

export const ReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await api.getReportsSummary();
        setSummary(data);
      } catch (err) {
        console.error('Failed to load reports summary', err);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  const handleDownloadExcel = () => {
    window.open(api.downloadExcelUrl(), '_blank');
  };

  const handleDownloadPdf = () => {
    window.open(api.downloadPdfReportUrl(), '_blank');
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Direct Excel & PDF Download Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md">
        <div>
          <span className="px-2.5 py-1 rounded-full bg-blue-600/40 text-blue-200 text-xs font-semibold mb-2 inline-block">
            📊 Factory Audit & Compliance Module
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Order-to-Audit Management Reports
          </h2>
          <p className="text-xs text-blue-200/90 mt-1 max-w-xl">
            Download comprehensive audit reports for GST tax filings, production yield audit, raw material valuation, and accounts receivable reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Download Audit PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Invoiced Revenue"
          value={formatCurrency(summary?.financial_summary?.total_sales)}
          subtitle="Taxable snacks turnover"
          icon={IndianRupee}
          variant="blue"
        />
        <StatCard
          title="5% GST Collected"
          value={formatCurrency(summary?.financial_summary?.total_tax_collected)}
          subtitle="CGST, SGST & IGST"
          icon={TrendingUp}
          variant="purple"
        />
        <StatCard
          title="Total Packets Produced"
          value={`${(summary?.manufacturing_summary?.total_packets_produced || 0).toLocaleString()} pkts`}
          subtitle="Murukku, Mixture & Sweets"
          icon={Factory}
          variant="emerald"
        />
        <StatCard
          title="Average Plant Wastage"
          value={`${summary?.manufacturing_summary?.average_wastage_percentage || 1.8}%`}
          subtitle="Below 2.5% quality target"
          icon={Percent}
          variant="amber"
        />
      </div>

      {/* Valuation Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inventory Valuation Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Storehouse Stock Valuation</h3>
              <p className="text-xs text-slate-500">Raw materials & finished goods value</p>
            </div>
            <Package className="w-6 h-6 text-blue-600" />
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700">Raw Materials & Packaging Stock</p>
                <p className="text-[11px] text-slate-400">Rice flour, oils, spices, pouches, cartons</p>
              </div>
              <p className="text-base font-bold text-slate-900 font-mono">
                {formatCurrency(summary?.manufacturing_summary?.raw_packaging_valuation)}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700">Finished Packets Ready Stock</p>
                <p className="text-[11px] text-slate-400">Murukku, Mixture, Banana Chips, Sweets</p>
              </div>
              <p className="text-base font-bold text-emerald-700 font-mono">
                {formatCurrency(summary?.manufacturing_summary?.finished_goods_valuation)}
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
              <span className="font-bold text-blue-950 text-xs">Total Enterprise Asset Value:</span>
              <span className="text-lg font-extrabold text-blue-900 font-mono">
                {formatCurrency(
                  (summary?.manufacturing_summary?.raw_packaging_valuation || 0) +
                  (summary?.manufacturing_summary?.finished_goods_valuation || 0)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Financial & Tax Audit Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Collections & Debtors Audit</h3>
              <p className="text-xs text-slate-500">Cash-flow and outstanding credit balance</p>
            </div>
            <IndianRupee className="w-6 h-6 text-emerald-600" />
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700">Collected from Retailers</p>
                <p className="text-[11px] text-slate-400">Bank NEFT, UPI, Cash receipts</p>
              </div>
              <p className="text-base font-bold text-emerald-600 font-mono">
                {formatCurrency(summary?.financial_summary?.total_collected)}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700">Outstanding Customer Due</p>
                <p className="text-[11px] text-slate-400">Pending receivables across distributors</p>
              </div>
              <p className="text-base font-bold text-rose-600 font-mono">
                {formatCurrency(summary?.financial_summary?.total_receivables)}
              </p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <span className="font-bold text-emerald-950 text-xs">Total Sales Value Realized:</span>
              <span className="text-lg font-extrabold text-emerald-900 font-mono">
                {formatCurrency(summary?.financial_summary?.total_sales)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Schedule Explanations */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-2">Audit Compliance Schedules Generated:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="font-bold text-slate-800">1. GST 5% Tax Schedule</p>
            <p className="text-slate-500 mt-1">
              Provides detailed bifurcation of CGST 2.5% + SGST 2.5% for intra-state Tamil Nadu deliveries, and IGST 5.0% for interstate dispatches.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="font-bold text-slate-800">2. Production Yield & Loss Log</p>
            <p className="text-slate-500 mt-1">
              Compares prepared mix dough weight against actual finished sealed packets, identifying wastage percentages and conveyor losses.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="font-bold text-slate-800">3. Stock Ledger Valuation</p>
            <p className="text-slate-500 mt-1">
              Audits warehouse inventory stock levels with purchase unit rates, supplier references, and real-time consumption records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
