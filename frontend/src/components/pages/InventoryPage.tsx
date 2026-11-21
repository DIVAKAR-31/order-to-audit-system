import React, { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownUp,
  PackageCheck,
  CheckCircle,
  TrendingDown,
  Building,
  Edit2,
  Trash2,
} from 'lucide-react';
import { api } from '../../api/client';
import { InventoryItem, InventoryCategory } from '../../types';
import { Modal } from '../common/Modal';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    item_code: '',
    category: 'Raw Material' as InventoryCategory,
    unit: 'kg',
    current_stock: 100,
    min_threshold: 20,
    unit_cost: 50,
    supplier_name: '',
  });

  const [adjustData, setAdjustData] = useState({
    quantity_change: 50,
    reason: 'Purchase Receipt from Supplier',
  });

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getInventory(categoryFilter, searchTerm);
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [categoryFilter, searchTerm]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      item_code: `RM-${Date.now().toString().slice(-4)}`,
      category: 'Raw Material',
      unit: 'kg',
      current_stock: 100,
      min_threshold: 20,
      unit_cost: 50,
      supplier_name: '',
    });
    setIsAddOpen(true);
  };

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustData({
      quantity_change: 25,
      reason: 'Purchase Inward Stock',
    });
    setIsAdjustOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createInventoryItem(formData);
      setIsAddOpen(false);
      fetchInventory();
    } catch (err: any) {
      alert(`Error adding item: ${err.message}`);
    }
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await api.adjustStock(selectedItem.id, adjustData.quantity_change, adjustData.reason);
      setIsAdjustOpen(false);
      fetchInventory();
    } catch (err: any) {
      alert(`Error adjusting stock: ${err.message}`);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete ${name} from inventory catalog?`)) return;
    try {
      await api.deleteInventoryItem(id);
      fetchInventory();
    } catch (err: any) {
      alert(`Error deleting item: ${err.message}`);
    }
  };

  const categories = ['All', 'Raw Material', 'Packaging Material', 'Finished Goods'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Raw Materials & Packaging Inventory</h2>
          <p className="text-xs text-slate-500">
            Audit storehouse stock of flours, oils, spices, pouches, and carton boxes
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Material / Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ingredient, item code or supplier..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between text-xs">
          <span>{error}</span>
          <button onClick={fetchInventory} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-2 text-xs text-slate-500 font-medium">Checking material stock...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Inventory Items Found</h4>
            <p className="text-xs text-slate-500 mt-1">Add raw materials like flours, oils, and spices</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Material / Item Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Current Stock</th>
                  <th className="py-3.5 px-4">Unit Rate (₹)</th>
                  <th className="py-3.5 px-4">Stock Valuation (₹)</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4 text-center">Stock Level</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((itm) => {
                  const isLow = itm.current_stock <= itm.min_threshold;
                  const val = itm.current_stock * itm.unit_cost;

                  return (
                    <tr key={itm.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {itm.item_code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{itm.name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            itm.category === 'Raw Material'
                              ? 'bg-blue-100 text-blue-800'
                              : itm.category === 'Packaging Material'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {itm.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="font-bold text-sm text-slate-900">
                          {itm.current_stock.toLocaleString()}
                        </span>{' '}
                        <span className="text-[11px] text-slate-500">{itm.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        ₹{itm.unit_cost.toFixed(2)} / {itm.unit}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {itm.supplier_name || 'Standard Vendor'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low (&le;{itm.min_threshold})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3" />
                            <span>Adequate</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAdjust(itm)}
                            title="Adjust stock / Record inward purchase"
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold border border-blue-200 flex items-center gap-1"
                          >
                            <ArrowDownUp className="w-3.5 h-3.5" />
                            <span>Stock In/Out</span>
                          </button>
                          <button
                            onClick={() => handleDelete(itm.id, itm.name)}
                            title="Delete item"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Material / Inventory Item"
        subtitle="Register raw ingredients (flour, oil, spices) or packaging pouches"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Item Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Urad Dal Flour (Ulundhu Maavu)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Item Code *</label>
              <input
                type="text"
                required
                value={formData.item_code}
                onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                placeholder="e.g. RM-FLR-04"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="Raw Material">Raw Material</option>
                <option value="Packaging Material">Packaging Material</option>
                <option value="Finished Goods">Finished Goods</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit of Measurement *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="kg">kg (Kilogram)</option>
                <option value="litre">litre (Litre)</option>
                <option value="pieces">pieces (Pieces / Pouches)</option>
                <option value="packets">packets (Packets)</option>
                <option value="rolls">rolls (Rolls / Tape)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Stock</label>
              <input
                type="number"
                step="0.01"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Purchase Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Minimum Alert Threshold</label>
              <input
                type="number"
                step="0.01"
                value={formData.min_threshold}
                onChange={(e) => setFormData({ ...formData, min_threshold: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Supplier / Vendor Name</label>
            <input
              type="text"
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              placeholder="e.g. Sivakasi Flexo Prints, Ponni Agro Mills"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20"
            >
              Save Item
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title={`Adjust Stock: ${selectedItem?.name || ''}`}
        subtitle={`Current recorded stock: ${selectedItem?.current_stock} ${selectedItem?.unit}`}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveAdjust} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Quantity Change (+ for purchase/receipt, - for damage/spoilage) *
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={adjustData.quantity_change}
              onChange={(e) => setAdjustData({ ...adjustData, quantity_change: parseFloat(e.target.value) || 0 })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-bold text-center text-sm"
            />
            {selectedItem && (
              <p className="mt-1 text-[11px] text-slate-500">
                New stock balance will be:{' '}
                <b>
                  {(selectedItem.current_stock + adjustData.quantity_change).toFixed(2)} {selectedItem.unit}
                </b>
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason / Reference *</label>
            <select
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              <option value="Purchase Inward Receipt">Purchase Inward Receipt</option>
              <option value="Physical Stock Audit Adjustment">Physical Stock Audit Adjustment</option>
              <option value="Spoilage / Quality Rejection">Spoilage / Quality Rejection</option>
              <option value="Trial Batch Usage">Trial Batch Usage</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdjustOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20"
            >
              Update Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
