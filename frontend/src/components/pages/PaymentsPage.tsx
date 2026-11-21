import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  IndianRupee,
  CheckCircle2,
  Calendar,
  Building,
  FileText,
  Clock,
  ArrowDownLeft,
} from 'lucide-react';
import { api } from '../../api/client';
import { Payment, Customer, Invoice } from '../../types';
import { Modal } from '../common/Modal';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customer_id: '' as number | '',
    invoice_id: '' as number | '',
    amount: 10000,
    payment_mode: 'Bank Transfer / NEFT',
    reference_number: '',
    notes: 'Payment received against outstanding snacks bill',
  });

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPayments();
      setPayments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payment ledger');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [custData, invData] = await Promise.all([
        api.getCustomers(),
        api.getInvoices(),
      ]);
      setCustomers(custData);
      setInvoices(invData);
      if (custData.length > 0 && formData.customer_id === '') {
        setFormData((prev) => ({ ...prev, customer_id: custData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load customers/invoices for payments', err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchMetadata();
  }, []);

  const handleOpenRecord = () => {
    const custWithDue = customers.find((c) => c.outstanding_balance > 0) || customers[0];
    const custId = custWithDue ? custWithDue.id : (customers[0]?.id || 1);
    const unpaidInv = invoices.find((i) => i.customer_id === custId && i.balance_due > 0);

    setFormData({
      customer_id: custId,
      invoice_id: unpaidInv ? unpaidInv.id : '',
      amount: unpaidInv ? unpaidInv.balance_due : (custWithDue ? custWithDue.outstanding_balance : 5000),
      payment_mode: 'Bank Transfer / NEFT',
      reference_number: `HDFC${Date.now().toString().slice(-6)}`,
      notes: 'Customer payment received via NEFT',
    });
    setIsRecordOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) {
      alert('Please select a customer');
      return;
    }
    if (formData.amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      await api.recordPayment({
        customer_id: Number(formData.customer_id),
        invoice_id: formData.invoice_id ? Number(formData.invoice_id) : undefined,
        amount: formData.amount,
        payment_mode: formData.payment_mode,
        reference_number: formData.reference_number,
        notes: formData.notes,
      });
      setIsRecordOpen(false);
      fetchPayments();
      fetchMetadata();
      alert('Payment receipt recorded successfully! Customer outstanding balance reconciled.');
    } catch (err: any) {
      alert(`Error recording payment: ${err.message}`);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Customer Collections & Receipts</h2>
          <p className="text-xs text-slate-500">
            Record customer bank transfers, UPI and cash payments with real-time balance reconciliation
          </p>
        </div>

        <button
          onClick={handleOpenRecord}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Customer Payment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Collections Recorded</p>
            <h4 className="text-xl font-bold text-emerald-600">{formatCurrency(totalCollected)}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Receipts Issued</p>
            <h4 className="text-xl font-bold text-slate-900">{payments.length} Receipts</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Customer Ledger</p>
            <h4 className="text-xl font-bold text-purple-600">{customers.length} Accounts</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between text-xs">
          <span>{error}</span>
          <button onClick={fetchPayments} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-2 text-xs text-slate-500 font-medium">Loading collection receipts...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Payments Recorded Yet</h4>
            <p className="text-xs text-slate-500 mt-1">Record a customer receipt to update balances</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Payment Date</th>
                  <th className="py-3.5 px-4">Payment Mode</th>
                  <th className="py-3.5 px-4">Reference / UTR #</th>
                  <th className="py-3.5 px-4">Linked Invoice</th>
                  <th className="py-3.5 px-4 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {p.receipt_number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {p.customer_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(p.payment_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.payment_mode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {p.reference_number || 'Direct Payment'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-blue-600 font-semibold">
                      {p.invoice_number || 'On Account'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 text-sm font-mono">
                      {formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title="Record Customer Payment Receipt"
        subtitle="Log received money against customer balance or specific 5% GST invoice"
      >
        <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
            <select
              value={formData.customer_id}
              onChange={(e) => {
                const cId = Number(e.target.value);
                const cust = customers.find((c) => c.id === cId);
                const unpaid = invoices.find((i) => i.customer_id === cId && i.balance_due > 0);
                setFormData({
                  ...formData,
                  customer_id: cId,
                  invoice_id: unpaid ? unpaid.id : '',
                  amount: unpaid ? unpaid.balance_due : (cust?.outstanding_balance || 5000),
                });
              }}
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-bold text-slate-900"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city}) — Outstanding Due: ₹{c.outstanding_balance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Link to Invoice (Optional)</label>
              <select
                value={formData.invoice_id}
                onChange={(e) => {
                  const invId = e.target.value ? Number(e.target.value) : '';
                  const inv = invoices.find((i) => i.id === invId);
                  setFormData({
                    ...formData,
                    invoice_id: invId,
                    amount: inv ? inv.balance_due : formData.amount,
                  });
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-mono"
              >
                <option value="">General Balance (On Account)</option>
                {invoices
                  .filter((i) => i.customer_id === Number(formData.customer_id))
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.invoice_number} — Due: ₹{i.balance_due.toFixed(2)} ({i.payment_status})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount Received (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-bold text-emerald-600 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Mode *</label>
              <select
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                <option value="UPI / QR Code">UPI / QR Code (Google Pay, PhonePe)</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash Receipt</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Ref / UTR / Cheque #</label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="e.g. UTR24987102"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Receipt Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRecordOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20"
            >
              Confirm Receipt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
