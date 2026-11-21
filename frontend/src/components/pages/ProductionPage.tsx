import React, { useEffect, useState } from 'react';
import {
  Factory,
  Plus,
  Scale,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight,
  TrendingDown,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client';
import { ProductionBatch, Product, InventoryItem } from '../../types';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export const ProductionPage: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [rawMaterialWeightKg, setRawMaterialWeightKg] = useState<number>(100);
  const [packetSizeG, setPacketSizeG] = useState<number>(200);
  const [actualPackets, setActualPackets] = useState<number>(490);
  const [batchNotes, setBatchNotes] = useState<string>('Standard conveyor frying run. Moisture levels within tolerance.');

  // Raw materials used in this batch
  const [materialsUsed, setMaterialsUsed] = useState<Array<{ inventory_item_id: number; quantity_used: number; unit: string }>>([
    { inventory_item_id: 1, quantity_used: 75, unit: 'kg' },
    { inventory_item_id: 4, quantity_used: 20, unit: 'litre' },
    { inventory_item_id: 17, quantity_used: 495, unit: 'pieces' }, // pouches
  ]);

  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProductionBatches();
      setBatches(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch production logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [prodData, invData] = await Promise.all([
        api.getProducts(),
        api.getInventory(),
      ]);
      setProducts(prodData);
      setInventoryItems(invData);
      if (prodData.length > 0 && selectedProductId === '') {
        setSelectedProductId(prodData[0].id);
      }
    } catch (err) {
      console.error('Failed to load products/inventory metadata for production', err);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchMetadata();
  }, []);

  // Real-time calculations for production batch form
  const expectedPackets = packetSizeG > 0 ? Math.floor((rawMaterialWeightKg * 1000) / packetSizeG) : 0;
  const variancePackets = actualPackets - expectedPackets;
  const actualFinishedWeightKg = (actualPackets * packetSizeG) / 1000.0;
  const wastageKg = Math.max(0, parseFloat((rawMaterialWeightKg - actualFinishedWeightKg).toFixed(2)));
  const wastagePercentage = rawMaterialWeightKg > 0 ? parseFloat(((wastageKg / rawMaterialWeightKg) * 100).toFixed(2)) : 0;

  const handleOpenLogModal = () => {
    if (products.length > 0) {
      setSelectedProductId(products[0].id);
    }
    setRawMaterialWeightKg(100);
    setPacketSizeG(200);
    setActualPackets(490);
    setBatchNotes('Standard conveyor frying run. Moisture levels within tolerance.');

    // Auto-match default ingredients if available
    const flour = inventoryItems.find((i) => i.name.toLowerCase().includes('flour')) || inventoryItems[0];
    const oil = inventoryItems.find((i) => i.name.toLowerCase().includes('oil')) || inventoryItems[1];
    const pouch = inventoryItems.find((i) => i.name.toLowerCase().includes('pouch')) || inventoryItems[2];

    const defaultMaterials: any[] = [];
    if (flour) defaultMaterials.push({ inventory_item_id: flour.id, quantity_used: 75, unit: flour.unit });
    if (oil) defaultMaterials.push({ inventory_item_id: oil.id, quantity_used: 20, unit: oil.unit });
    if (pouch) defaultMaterials.push({ inventory_item_id: pouch.id, quantity_used: 495, unit: pouch.unit });

    setMaterialsUsed(defaultMaterials.length > 0 ? defaultMaterials : [{ inventory_item_id: 1, quantity_used: 50, unit: 'kg' }]);
    setIsLogOpen(true);
  };

  const handleAddMaterialRow = () => {
    const item = inventoryItems[0];
    if (item) {
      setMaterialsUsed([...materialsUsed, { inventory_item_id: item.id, quantity_used: 10, unit: item.unit }]);
    }
  };

  const handleRemoveMaterialRow = (idx: number) => {
    if (materialsUsed.length === 1) return;
    setMaterialsUsed(materialsUsed.filter((_, i) => i !== idx));
  };

  const handleMaterialChange = (idx: number, field: string, value: any) => {
    const updated = [...materialsUsed];
    if (field === 'inventory_item_id') {
      const id = parseInt(value);
      const inv = inventoryItems.find((i) => i.id === id);
      updated[idx].inventory_item_id = id;
      if (inv) updated[idx].unit = inv.unit;
    } else if (field === 'quantity_used') {
      updated[idx].quantity_used = parseFloat(value) || 0;
    }
    setMaterialsUsed(updated);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Please select a target snack product');
      return;
    }

    try {
      await api.createProductionBatch({
        product_id: Number(selectedProductId),
        supervisor_id: user?.id,
        raw_material_weight_kg: rawMaterialWeightKg,
        packet_size_g: packetSizeG,
        expected_packets: expectedPackets,
        actual_packets: actualPackets,
        notes: batchNotes,
        materials_used: materialsUsed,
      });
      setIsLogOpen(false);
      fetchBatches();
      // Notify success
      alert('Production batch logged! Ready snack stock increased and raw ingredients deducted from inventory.');
    } catch (err: any) {
      alert(`Error logging production batch: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Snack Production & Batch Audit</h2>
          <p className="text-xs text-slate-500">
            Log plant manufacturing runs, compare expected vs actual packet output and audit wastage loss %
          </p>
        </div>

        <button
          onClick={handleOpenLogModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Production Batch</span>
        </button>
      </div>

      {/* Production KPIs Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Batches Completed</p>
            <h4 className="text-xl font-bold text-slate-900">{batches.length} Runs</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Factory className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Packets Produced</p>
            <h4 className="text-xl font-bold text-emerald-600">
              {batches.reduce((sum, b) => sum + b.actual_packets, 0).toLocaleString()} pkts
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Average Plant Wastage</p>
            <h4 className="text-xl font-bold text-indigo-600">
              {(
                batches.reduce((sum, b) => sum + b.wastage_percentage, 0) / (batches.length || 1)
              ).toFixed(2)}
              %
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between text-xs">
          <span>{error}</span>
          <button onClick={fetchBatches} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-2 text-xs text-slate-500 font-medium">Loading production audit logs...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="py-16 text-center">
            <Factory className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Production Batches Recorded</h4>
            <p className="text-xs text-slate-500 mt-1">Log your first manufacturing batch to track yield</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4">Batch #</th>
                  <th className="py-3.5 px-4">Snack Product</th>
                  <th className="py-3.5 px-4">Production Date</th>
                  <th className="py-3.5 px-4">Plant Supervisor</th>
                  <th className="py-3.5 px-4 text-center">Raw Input (kg)</th>
                  <th className="py-3.5 px-4 text-center">Expected / Actual Packets</th>
                  <th className="py-3.5 px-4 text-center">Wastage (kg)</th>
                  <th className="py-3.5 px-4 text-center">Loss %</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => {
                  const isLowLoss = b.wastage_percentage <= 2.0;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {b.batch_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{b.product_name}</div>
                        <div className="text-[11px] text-slate-400">Target size: {b.packet_size_g}g</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(b.batch_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {b.supervisor_name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 font-mono">
                        {b.raw_material_weight_kg.toFixed(1)} kg
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="text-slate-500">{b.expected_packets}</span> /{' '}
                        <span className="font-bold text-slate-900 text-sm">{b.actual_packets}</span>
                        {b.variance_packets !== 0 && (
                          <span
                            className={`ml-1 text-[11px] font-bold ${
                              b.variance_packets < 0 ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            ({b.variance_packets > 0 ? '+' : ''}{b.variance_packets})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                        {b.wastage_kg.toFixed(2)} kg
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isLowLoss
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {b.wastage_percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedBatch(b);
                            setIsDetailOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          View Log
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Production Batch Modal */}
      <Modal
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        title="Log Snack Production Run"
        subtitle="Record raw materials mixed/fried and actual packets sealed with loss calculation"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveBatch} className="space-y-4 text-xs">
          {/* Target Product */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Snack Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                const pId = Number(e.target.value);
                setSelectedProductId(pId);
                const p = products.find((prod) => prod.id === pId);
                if (p) {
                  const matchSize = parseInt(p.package_size);
                  if (matchSize) setPacketSizeG(matchSize);
                }
              }}
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-bold text-slate-900"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) — Pkt Size: {p.package_size} | Current Stock: {p.stock_quantity}
                </option>
              ))}
            </select>
          </div>

          {/* Production Measurements */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
            <div>
              <label className="block font-semibold text-blue-950 mb-1">Total Dough/Mix Weight (kg) *</label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={rawMaterialWeightKg}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setRawMaterialWeightKg(val);
                  // auto update actual estimation
                  setActualPackets(Math.floor((val * 1000) / (packetSizeG || 200)) - 8);
                }}
                className="w-full p-2.5 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-bold text-slate-900 text-center"
              />
            </div>

            <div>
              <label className="block font-semibold text-blue-950 mb-1">Packet Size (grams) *</label>
              <input
                type="number"
                step="10"
                min="10"
                required
                value={packetSizeG}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 200;
                  setPacketSizeG(val);
                }}
                className="w-full p-2.5 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-bold text-slate-900 text-center"
              />
            </div>

            <div>
              <label className="block font-semibold text-blue-950 mb-1">Actual Packets Packed *</label>
              <input
                type="number"
                min="0"
                required
                value={actualPackets}
                onChange={(e) => setActualPackets(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-bold text-slate-900 text-center text-sm"
              />
            </div>
          </div>

          {/* Real-time Yield & Wastage Audit Display */}
          <div className="p-4 bg-slate-900 text-white rounded-xl shadow-inner grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400">Expected Yield</p>
              <p className="text-lg font-bold text-white">{expectedPackets} pkts</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400">Actual Yield</p>
              <p className="text-lg font-bold text-emerald-400">{actualPackets} pkts</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400">Wastage Loss</p>
              <p className="text-lg font-bold text-amber-400">{wastageKg} kg</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400">Loss Percentage</p>
              <p
                className={`text-lg font-bold ${
                  wastagePercentage <= 2.0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {wastagePercentage}%
              </p>
            </div>
          </div>

          {/* Raw Materials Deducted */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800">
                Ingredients & Packaging Used (Deducted from Inventory)
              </label>
              <button
                type="button"
                onClick={handleAddMaterialRow}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ingredient</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {materialsUsed.map((mat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="flex-1 min-w-[200px]">
                    <select
                      value={mat.inventory_item_id}
                      onChange={(e) => handleMaterialChange(idx, 'inventory_item_id', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    >
                      {inventoryItems.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} ({inv.category}) — In Stock: {inv.current_stock} {inv.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28 flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={mat.quantity_used}
                      onChange={(e) => handleMaterialChange(idx, 'quantity_used', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-center font-bold"
                    />
                    <span className="text-slate-500 text-[11px] font-medium">{mat.unit}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveMaterialRow(idx)}
                    disabled={materialsUsed.length === 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Supervisor Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Supervisor Quality Observations</label>
            <input
              type="text"
              value={batchNotes}
              onChange={(e) => setBatchNotes(e.target.value)}
              placeholder="e.g. Crispiness and frying temperature checked at 180°C..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsLogOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20"
            >
              Save & Update Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Batch Audit: ${selectedBatch?.batch_number || ''}`}
        subtitle={`${selectedBatch?.product_name} production audit breakdown`}
      >
        {selectedBatch && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-500">Product Line:</p>
                <p className="font-bold text-slate-900 text-sm">{selectedBatch.product_name}</p>
                <p className="text-slate-500 mt-1">Supervisor: {selectedBatch.supervisor_name}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Status:</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  {selectedBatch.status}
                </span>
                <p className="text-slate-500 mt-1">
                  Run Date: {new Date(selectedBatch.batch_date).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div>
                <p className="text-slate-500">Dough Weight</p>
                <p className="font-bold text-slate-900">{selectedBatch.raw_material_weight_kg} kg</p>
              </div>
              <div>
                <p className="text-slate-500">Expected</p>
                <p className="font-bold text-slate-900">{selectedBatch.expected_packets} pkts</p>
              </div>
              <div>
                <p className="text-slate-500">Actual</p>
                <p className="font-bold text-emerald-700">{selectedBatch.actual_packets} pkts</p>
              </div>
              <div>
                <p className="text-slate-500">Wastage %</p>
                <p className="font-bold text-amber-700">
                  {selectedBatch.wastage_percentage}% ({selectedBatch.wastage_kg} kg)
                </p>
              </div>
            </div>

            {selectedBatch.materials_used && selectedBatch.materials_used.length > 0 && (
              <div>
                <p className="font-bold text-slate-800 mb-1.5">Raw Materials & Packaging Deducted:</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-2 px-3">Ingredient / Pouch</th>
                        <th className="py-2 px-3 text-right">Quantity Consumed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedBatch.materials_used.map((m, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-medium text-slate-900">{m.item_name}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            {m.quantity_used} {m.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedBatch.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 italic">
                "{selectedBatch.notes}"
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
