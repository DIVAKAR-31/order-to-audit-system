import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Eye,
  Trash2,
  Calendar,
  User,
  MapPin,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../api/client';
import { Order, OrderStatus, Customer, Product } from '../../types';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // New Order Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderItems, setOrderItems] = useState<Array<{ product_id: number; quantity: number; unit_price: number }>>([
    { product_id: 1, quantity: 50, unit_price: 65 },
  ]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrders(statusFilter);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [custData, prodData] = await Promise.all([
        api.getCustomers(),
        api.getProducts(),
      ]);
      setCustomers(custData);
      setProducts(prodData);
      if (custData.length > 0 && selectedCustomerId === '') {
        setSelectedCustomerId(custData[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch customers/products for order creation', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleOpenCreate = () => {
    if (customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
    const firstProd = products[0];
    setOrderItems([
      { product_id: firstProd ? firstProd.id : 1, quantity: 50, unit_price: firstProd ? firstProd.price : 65 },
    ]);
    setOrderNotes('');
    setIsCreateOpen(true);
  };

  const handleAddItemRow = () => {
    const firstProd = products[0];
    setOrderItems([
      ...orderItems,
      { product_id: firstProd ? firstProd.id : 1, quantity: 50, unit_price: firstProd ? firstProd.price : 60 },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    if (field === 'product_id') {
      const pId = parseInt(value);
      const prod = products.find((p) => p.id === pId);
      updated[index].product_id = pId;
      if (prod) {
        updated[index].unit_price = prod.price;
      }
    } else if (field === 'quantity') {
      updated[index].quantity = Math.max(1, parseInt(value) || 1);
    } else if (field === 'unit_price') {
      updated[index].unit_price = parseFloat(value) || 0;
    }
    setOrderItems(updated);
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((acc, itm) => acc + itm.quantity * itm.unit_price, 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Please select a customer');
      return;
    }
    if (orderItems.length === 0) {
      alert('Please add at least one snack product');
      return;
    }

    try {
      await api.createOrder({
        customer_id: Number(selectedCustomerId),
        salesman_id: user?.id,
        notes: orderNotes,
        items: orderItems,
      });
      setIsCreateOpen(false);
      fetchOrders();
    } catch (err: any) {
      alert(`Error creating order: ${err.message}`);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as OrderStatus });
      }
    } catch (err: any) {
      alert(`Error updating order status: ${err.message}`);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const statusColors: Record<OrderStatus, { bg: string; text: string; icon: any }> = {
    Pending: { bg: 'bg-amber-100 text-amber-800 border-amber-200', text: 'text-amber-700', icon: Clock },
    Approved: { bg: 'bg-blue-100 text-blue-800 border-blue-200', text: 'text-blue-700', icon: CheckCircle2 },
    Rejected: { bg: 'bg-rose-100 text-rose-800 border-rose-200', text: 'text-rose-700', icon: XCircle },
    Dispatched: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'text-emerald-700', icon: Truck },
  };

  const statuses = ['All', 'Pending', 'Approved', 'Dispatched', 'Rejected'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Snack Orders & Sales Bookings</h2>
          <p className="text-xs text-slate-500">
            Book retailer orders, approve dispatches and automatically generate 5% GST tax invoices
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Order</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3.5 rounded-2xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-500 mr-1">Status Filter:</span>
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
          <button onClick={fetchOrders} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-2 text-xs text-slate-500 font-medium">Fetching orders list...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Orders Found</h4>
            <p className="text-xs text-slate-500 mt-1">Book your first snack order for a retailer</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Date Booked</th>
                  <th className="py-3.5 px-4">Sales Representative</th>
                  <th className="py-3.5 px-4">Packets / Items</th>
                  <th className="py-3.5 px-4 text-right">Order Value</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => {
                  const StIcon = statusColors[o.status]?.icon || Clock;
                  const totalPkts = o.items.reduce((sum, itm) => sum + itm.quantity, 0);

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {o.order_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{o.customer_name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{o.customer_city}, {o.customer_state}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(o.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {o.salesman_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900">{totalPkts}</span> pkts{' '}
                        <span className="text-slate-400 text-[11px]">({o.items.length} items)</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(o.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColors[o.status]?.bg}`}
                        >
                          <StIcon className="w-3 h-3" />
                          <span>{o.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Workflow Action button */}
                          {o.status === 'Pending' && (
                            <button
                              onClick={() => handleStatusChange(o.id, 'Approved')}
                              title="Approve order"
                              className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-bold border border-blue-200"
                            >
                              Approve
                            </button>
                          )}
                          {o.status === 'Approved' && (
                            <button
                              onClick={() => handleStatusChange(o.id, 'Dispatched')}
                              title="Dispatch order (creates invoice & reduces stock)"
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold border border-emerald-200 flex items-center gap-1"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedOrder(o);
                              setIsDetailOpen(true);
                            }}
                            title="View order details"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
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

      {/* Create Order Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Snack Sales Order"
        subtitle="Book retailer order with multiple Murukku, Mixture, Chips or Sweets line items"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          {/* Customer selection */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block font-semibold text-slate-700 mb-1">Select Customer Store *</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
              required
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.city}, {c.state} ({c.customer_type})
                </option>
              ))}
            </select>
            {selectedCustomerId && (
              <p className="mt-1 text-[11px] text-blue-600 font-medium">
                Destination state:{' '}
                <b>{customers.find((c) => c.id === Number(selectedCustomerId))?.state}</b> (
                {customers.find((c) => c.id === Number(selectedCustomerId))?.state.toLowerCase() ===
                'tamil nadu'
                  ? 'Intra-state: CGST 2.5% + SGST 2.5%'
                  : 'Inter-state: IGST 5.0%'}
                )
              </p>
            )}
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800">Snack Products & Quantities</label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {orderItems.map((item, idx) => {
                const prod = products.find((p) => p.id === item.product_id);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <div className="flex-1 min-w-[180px]">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.package_size}) — ₹{p.price} [Stock: {p.stock_quantity}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-center font-bold"
                      />
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                        placeholder="Price"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-right font-medium"
                      />
                    </div>

                    <div className="w-28 text-right font-bold text-slate-900 font-mono text-xs">
                      ₹{(item.quantity * item.unit_price).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      disabled={orderItems.length === 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subtotal & GST Summary preview */}
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between">
            <span className="font-semibold text-blue-900">Estimated Order Value:</span>
            <div className="text-right">
              <span className="text-lg font-extrabold text-blue-900">
                {formatCurrency(calculateSubtotal())}
              </span>
              <p className="text-[11px] text-blue-600">5% GST will be applied on invoice generation</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dispatch / Order Notes</label>
            <input
              type="text"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g. Deliver via Salem Transport Hub before Friday"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Order Details: ${selectedOrder?.order_number || ''}`}
        subtitle="Itemized snack dispatch breakdown"
        maxWidth="lg"
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-500">Customer:</p>
                <p className="font-bold text-slate-900 text-sm">{selectedOrder.customer_name}</p>
                <p className="text-slate-500">{selectedOrder.customer_city}, {selectedOrder.customer_state}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Status:</p>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full font-bold mt-0.5 ${
                    statusColors[selectedOrder.status]?.bg
                  }`}
                >
                  {selectedOrder.status}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Booked by {selectedOrder.salesman_name}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Snack Product</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{item.product_name}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.quantity} pkts</td>
                      <td className="py-2.5 px-3 text-right">₹{item.unit_price.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ₹{item.total_price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200 font-bold">
                    <td colSpan={3} className="py-2.5 px-3 text-right">Grand Total:</td>
                    <td className="py-2.5 px-3 text-right text-sm text-blue-700">
                      {formatCurrency(selectedOrder.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Status change actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-500">Update status:</span>
              <div className="flex items-center gap-2">
                {['Pending', 'Approved', 'Dispatched', 'Rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedOrder.id, st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      selectedOrder.status === st
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
