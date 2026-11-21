export type UserRole = 'admin' | 'salesman' | 'production_supervisor' | 'accountant';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  code: string;
  category: 'Murukku' | 'Mixture' | 'Chips' | 'Sweets' | string;
  unit: string;
  package_size: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_threshold: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  customer_type: 'Retailer' | 'Distributor';
  gstin?: string;
  address: string;
  city: string;
  state: string; // "Tamil Nadu" vs Interstate
  pincode?: string;
  credit_limit: number;
  outstanding_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface OrderItem {
  id?: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export type OrderStatus = 'Pending' | 'Approved' | 'Rejected' | 'Dispatched';

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name?: string;
  customer_city?: string;
  customer_state?: string;
  salesman_id?: number;
  salesman_name?: string;
  status: OrderStatus;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export type InventoryCategory = 'Raw Material' | 'Finished Goods' | 'Packaging Material';

export interface InventoryItem {
  id: number;
  name: string;
  item_code: string;
  category: InventoryCategory;
  unit: string;
  current_stock: number;
  min_threshold: number;
  unit_cost: number;
  supplier_name?: string;
  last_updated: string;
}

export interface MaterialUsed {
  id?: number;
  inventory_item_id: number;
  item_name?: string;
  quantity_used: number;
  unit: string;
}

export interface ProductionBatch {
  id: number;
  batch_number: string;
  product_id: number;
  product_name?: string;
  supervisor_id?: number;
  supervisor_name?: string;
  batch_date: string;
  raw_material_weight_kg: number;
  packet_size_g: number;
  expected_packets: number;
  actual_packets: number;
  wastage_kg: number;
  wastage_percentage: number;
  variance_packets: number;
  status: string;
  notes?: string;
  created_at: string;
  materials_used: MaterialUsed[];
}

export interface InvoiceItem {
  id?: number;
  product_id?: number;
  product_name: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid';

export interface Invoice {
  id: number;
  invoice_number: string;
  order_id?: number;
  customer_id: number;
  customer_name?: string;
  customer_gstin?: string;
  customer_address?: string;
  customer_state?: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  is_tamil_nadu: boolean;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_tax: number;
  grand_total: number;
  paid_amount: number;
  balance_due: number;
  payment_status: PaymentStatus;
  notes?: string;
  created_at: string;
  items: InvoiceItem[];
}

export interface Payment {
  id: number;
  receipt_number: string;
  customer_id: number;
  customer_name?: string;
  invoice_id?: number;
  invoice_number?: string;
  amount: number;
  payment_date: string;
  payment_mode: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface DashboardStats {
  total_sales: number;
  today_orders_count: number;
  available_stock_packets: number;
  pending_orders_count: number;
  approved_orders_count: number;
  today_production_packets: number;
  total_receivables: number;
  low_stock_alerts: number;
  recent_orders: Array<{
    id: number;
    order_number: string;
    customer_name: string;
    city: string;
    state: string;
    status: OrderStatus;
    total_amount: number;
    created_at: string;
  }>;
  category_sales: Array<{
    category: string;
    product_count: number;
    total_stock: number;
  }>;
  monthly_trend: Array<{
    month: string;
    sales: number;
    production: number;
    wastage: number;
  }>;
  recent_batches: Array<{
    id: number;
    batch_number: string;
    product_name: string;
    expected_packets: number;
    actual_packets: number;
    wastage_percentage: number;
    wastage_kg: number;
    status: string;
    date: string;
  }>;
}
