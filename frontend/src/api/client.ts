import {
  User, Product, Customer, Order, InventoryItem,
  ProductionBatch, Invoice, Payment, DashboardStats
} from '../types';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('ota_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('ota_token', token);
  } else {
    localStorage.removeItem('ota_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getProfile: () => request<User>('/auth/me'),
  getUsers: () => request<User[]>('/auth/users'),

  // Dashboard
  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),

  // Products
  getProducts: (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);
    return request<Product[]>(`/products?${params.toString()}`);
  },
  createProduct: (data: Partial<Product>) =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: number, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: number) =>
    request<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),

  // Customers
  getCustomers: (customerType?: string, state?: string, search?: string) => {
    const params = new URLSearchParams();
    if (customerType && customerType !== 'All') params.append('customer_type', customerType);
    if (state && state !== 'All') params.append('state', state);
    if (search) params.append('search', search);
    return request<Customer[]>(`/customers?${params.toString()}`);
  },
  createCustomer: (data: Partial<Customer>) =>
    request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCustomer: (id: number, data: Partial<Customer>) =>
    request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCustomer: (id: number) =>
    request<{ message: string }>(`/customers/${id}`, {
      method: 'DELETE',
    }),

  // Orders
  getOrders: (status?: string, customerId?: number) => {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status);
    if (customerId) params.append('customer_id', customerId.toString());
    return request<Order[]>(`/orders?${params.toString()}`);
  },
  createOrder: (data: { customer_id: number; salesman_id?: number; notes?: string; items: { product_id: number; quantity: number; unit_price: number }[] }) =>
    request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateOrderStatus: (id: number, status: string) =>
    request<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Inventory
  getInventory: (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);
    return request<InventoryItem[]>(`/inventory?${params.toString()}`);
  },
  createInventoryItem: (data: Partial<InventoryItem>) =>
    request<InventoryItem>('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adjustStock: (id: number, quantity_change: number, reason: string) =>
    request<InventoryItem>(`/inventory/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ quantity_change, reason }),
    }),
  deleteInventoryItem: (id: number) =>
    request<{ message: string }>(`/inventory/${id}`, {
      method: 'DELETE',
    }),

  // Production
  getProductionBatches: (productId?: number) => {
    const params = new URLSearchParams();
    if (productId) params.append('product_id', productId.toString());
    return request<ProductionBatch[]>(`/production?${params.toString()}`);
  },
  createProductionBatch: (data: {
    product_id: number;
    supervisor_id?: number;
    raw_material_weight_kg: number;
    packet_size_g: number;
    expected_packets: number;
    actual_packets: number;
    notes?: string;
    materials_used: { inventory_item_id: number; quantity_used: number; unit: string }[];
  }) =>
    request<ProductionBatch>('/production', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Invoices
  getInvoices: (status?: string, customerId?: number) => {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status);
    if (customerId) params.append('customer_id', customerId.toString());
    return request<Invoice[]>(`/invoices?${params.toString()}`);
  },
  getInvoice: (id: number) => request<Invoice>(`/invoices/${id}`),
  downloadInvoicePdfUrl: (id: number) => `${API_BASE}/invoices/${id}/pdf`,

  // Payments
  getPayments: (customerId?: number, invoiceId?: number) => {
    const params = new URLSearchParams();
    if (customerId) params.append('customer_id', customerId.toString());
    if (invoiceId) params.append('invoice_id', invoiceId.toString());
    return request<Payment[]>(`/payments?${params.toString()}`);
  },
  recordPayment: (data: {
    customer_id: number;
    invoice_id?: number;
    amount: number;
    payment_mode: string;
    reference_number?: string;
    notes?: string;
  }) =>
    request<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Reports
  getReportsSummary: () => request<any>('/reports/summary'),
  downloadExcelUrl: () => `${API_BASE}/reports/export/excel`,
  downloadPdfReportUrl: () => `${API_BASE}/reports/export/pdf`,
};
