import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Search,
  Eye,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  Building,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../api/client';
import { Invoice, PaymentStatus } from '../../types';
import { Modal } from '../common/Modal';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getInvoices(statusFilter);
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tax invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleDownloadPdf = (invoiceId: number, invoiceNum: string) => {
    const url = api.downloadInvoicePdfUrl(invoiceId);
    window.open(url, '_blank');
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amt);
  };

  const statuses = ['All', 'Paid', 'Partially Paid', 'Unpaid'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">5% GST Tax Invoices & Billing</h2>
          <p className="text-xs text-slate-500">
            Compliant South Indian snacks billing: CGST 2.5% + SGST 2.5% for Tamil Nadu | IGST 5.0% for Interstate
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
          <ShieldCheck className="w-4 h-4" />
          <span>HSN Code: 21069099 (5% GST Rate)</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3.5 rounded-2xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-500 mr-1">Payment Status:</span>
        {statuses.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between text-xs">
          <span>{error}</span>
          <button onClick={fetchInvoices} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-2 text-xs text-slate-500 font-medium">Fetching tax invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Invoices Found</h4>
            <p className="text-xs text-slate-500 mt-1">Dispatch an order to generate an automatic GST invoice</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">State & GST Type</th>
                  <th className="py-3.5 px-4">Invoice Date</th>
                  <th className="py-3.5 px-4 text-right">Taxable Subtotal</th>
                  <th className="py-3.5 px-4 text-right">5% GST</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-right">Balance Due</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inv.customer_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          GSTIN: {inv.customer_gstin || 'Unregistered'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.is_tamil_nadu
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {inv.is_tamil_nadu
                            ? 'Tamil Nadu (CGST+SGST)'
                            : `${inv.customer_state || 'Interstate'} (IGST)`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(inv.invoice_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {formatCurrency(inv.subtotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                        {formatCurrency(inv.total_tax)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-sm">
                        {formatCurrency(inv.grand_total)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono">
                        <span className={inv.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {formatCurrency(inv.balance_due)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.payment_status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.payment_status === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsDetailOpen(true);
                            }}
                            title="View tax invoice preview"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(inv.id, inv.invoice_number)}
                            title="Download official PDF invoice"
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail / Print Preview Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Tax Invoice: ${selectedInvoice?.invoice_number || ''}`}
        subtitle="Compliant 5% GST billing details and tax schedule"
        maxWidth="2xl"
      >
        {selectedInvoice && (
          <div className="space-y-4 text-xs font-sans">
            {/* Header / Company banner */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex items-start justify-between">
              <div>
                <h4 className="font-bold text-sm tracking-tight text-white">
                  ORDER-TO-AUDIT FOODS PVT LTD
                </h4>
                <p className="text-[11px] text-blue-300">
                  Murukku, Mixture, Chips & Traditional Sweets
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Plot 42, SIDCO Estate, Guindy, Chennai - 600032 | GSTIN: 33AABCO9988Z1Z5
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-xs">
                  TAX INVOICE
                </span>
                <p className="text-xs font-bold text-white mt-1 font-mono">
                  {selectedInvoice.invoice_number}
                </p>
                <p className="text-[11px] text-slate-400">
                  {new Date(selectedInvoice.invoice_date).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Billed To (Customer):</p>
                <p className="font-bold text-slate-900 text-sm">{selectedInvoice.customer_name}</p>
                <p className="text-slate-600">{selectedInvoice.customer_address}</p>
                <p className="text-slate-600 font-semibold">
                  State: {selectedInvoice.customer_state} (GSTIN: {selectedInvoice.customer_gstin || 'Unregistered'})
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-500 uppercase">GST Determination:</p>
                <p className="font-bold text-blue-700">
                  {selectedInvoice.is_tamil_nadu
                    ? 'Intra-State Supply (Tamil Nadu)'
                    : 'Inter-State Supply (Other State)'}
                </p>
                <p className="text-slate-500">
                  {selectedInvoice.is_tamil_nadu
                    ? 'CGST 2.5% + SGST 2.5% = 5.0%'
                    : 'Integrated GST (IGST) = 5.0%'}
                </p>
                <p className="text-slate-500 mt-1">
                  Payment Status: <b className="text-slate-900">{selectedInvoice.payment_status}</b>
                </p>
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Description of Goods</th>
                    <th className="py-2.5 px-3">HSN Code</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-center">Tax</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items.map((itm, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{itm.product_name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{itm.hsn_code}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{itm.quantity} pkts</td>
                      <td className="py-2.5 px-3 text-right">₹{itm.unit_price.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center">{itm.tax_rate}%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                        ₹{itm.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tax Schedule Calculation Box */}
            <div className="flex justify-end">
              <div className="w-72 bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatCurrency(selectedInvoice.subtotal)}
                  </span>
                </div>

                {selectedInvoice.is_tamil_nadu ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST (2.5%):</span>
                      <span className="font-mono">{formatCurrency(selectedInvoice.cgst_amount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST (2.5%):</span>
                      <span className="font-mono">{formatCurrency(selectedInvoice.sgst_amount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST (5.0% Inter-state):</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.igst_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                  <span className="font-semibold">Total GST (5%):</span>
                  <span className="font-semibold font-mono">{formatCurrency(selectedInvoice.total_tax)}</span>
                </div>

                <div className="flex justify-between text-slate-900 font-bold border-t border-slate-300 pt-1 text-sm text-blue-900">
                  <span>Grand Total:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.grand_total)}</span>
                </div>

                <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                  <span>Paid Amount:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.paid_amount)}</span>
                </div>

                <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-slate-200">
                  <span>Balance Due:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.balance_due)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoice_number)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Official PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
