import {
  User, Product, Customer, Order, InventoryItem,
  ProductionBatch, Invoice, Payment, DashboardStats
} from '../types';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem('ota_token');
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem('ota_token', token);
    } else {
      localStorage.removeItem('ota_token');
    }
  } catch {}
}

// Initial mock dataset for standalone / offline / static Vercel preview
let localProducts: Product[] = [
  { id: 1, name: "Classic Kai Murukku 200g", code: "PRD-MRK-001", category: "Murukku", package_size: "200g", unit: "packets", price: 50.0, cost_price: 30.9, stock_quantity: 88, min_threshold: 30, description: "Hand-twisted traditional crunchy rice & urad dal murukku", is_active: true, created_at: new Date().toISOString() },
  { id: 2, name: "Crispy Butter Murukku 200g", code: "PRD-MRK-002", category: "Murukku", package_size: "200g", unit: "packets", price: 60.0, cost_price: 35.0, stock_quantity: 140, min_threshold: 25, description: "Melt-in-mouth butter murukku seasoned with cumin and sesame", is_active: true, created_at: new Date().toISOString() },
  { id: 3, name: "Spicy Mullu Murukku 250g", code: "PRD-MRK-003", category: "Murukku", package_size: "250g", unit: "packets", price: 75.0, cost_price: 42.0, stock_quantity: 95, min_threshold: 20, description: "Spicy thorny star murukku made with Guntur chili powder", is_active: true, created_at: new Date().toISOString() },
  { id: 4, name: "Ribbon Pakoda / Seeval 200g", code: "PRD-MRK-004", category: "Murukku", package_size: "200g", unit: "packets", price: 55.0, cost_price: 32.0, stock_quantity: 120, min_threshold: 25, description: "Flat crunchy ribbon pakoda flavored with garlic and roasted gram", is_active: true, created_at: new Date().toISOString() },
  { id: 5, name: "Madras Royal Mixture 200g", code: "PRD-MIX-001", category: "Mixture", package_size: "200g", unit: "packets", price: 70.0, cost_price: 40.0, stock_quantity: 160, min_threshold: 30, description: "Chennai style mixture with fried peanuts, roasted cashews, and curry leaves", is_active: true, created_at: new Date().toISOString() },
  { id: 6, name: "Kara Boondi Spicy 200g", code: "PRD-MIX-002", category: "Mixture", package_size: "200g", unit: "packets", price: 55.0, cost_price: 31.0, stock_quantity: 110, min_threshold: 20, description: "Crispy golden gram flour droplets tempered with garlic and peanuts", is_active: true, created_at: new Date().toISOString() },
  { id: 7, name: "Corn Flakes Mixture 200g", code: "PRD-MIX-003", category: "Mixture", package_size: "200g", unit: "packets", price: 65.0, cost_price: 36.0, stock_quantity: 85, min_threshold: 20, description: "Sweet and spicy roasted corn flakes tossed with raisins and mild masala", is_active: true, created_at: new Date().toISOString() },
  { id: 8, name: "Nendran Banana Chips Coconut Oil 200g", code: "PRD-CHP-001", category: "Chips", package_size: "200g", unit: "packets", price: 85.0, cost_price: 48.0, stock_quantity: 190, min_threshold: 30, description: "Yellow raw Nendran bananas fried in 100% pure cold-pressed coconut oil", is_active: true, created_at: new Date().toISOString() },
  { id: 9, name: "Tapioca / Maravalli Kizhangu Chips 200g", code: "PRD-CHP-002", category: "Chips", package_size: "200g", unit: "packets", price: 50.0, cost_price: 27.0, stock_quantity: 130, min_threshold: 25, description: "Crispy Salem tapioca sticks with sea salt and chili powder", is_active: true, created_at: new Date().toISOString() },
  { id: 10, name: "Spicy Potato Wafers 150g", code: "PRD-CHP-003", category: "Chips", package_size: "150g", unit: "packets", price: 45.0, cost_price: 24.0, stock_quantity: 90, min_threshold: 20, description: "Golden thin-cut potato crisps with Indian chat spices", is_active: true, created_at: new Date().toISOString() },
  { id: 11, name: "Tirunelveli Ghee Halwa 250g", code: "PRD-SWT-001", category: "Sweets", package_size: "250g", unit: "packets", price: 120.0, cost_price: 72.0, stock_quantity: 65, min_threshold: 15, description: "Famous wheat milk halwa with caramelized sugar and cow ghee", is_active: true, created_at: new Date().toISOString() },
  { id: 12, name: "Royal Ghee Mysore Pak 250g", code: "PRD-SWT-002", category: "Sweets", package_size: "250g", unit: "packets", price: 140.0, cost_price: 85.0, stock_quantity: 75, min_threshold: 15, description: "Rich melt-in-mouth traditional besan sweet prepared with pure ghee", is_active: true, created_at: new Date().toISOString() },
  { id: 13, name: "Traditional Athirasam 4 Pcs Box", code: "PRD-SWT-003", category: "Sweets", package_size: "250g", unit: "packets", price: 90.0, cost_price: 52.0, stock_quantity: 45, min_threshold: 10, description: "Fermented raw rice flour and organic jaggery deep fried delicacy", is_active: true, created_at: new Date().toISOString() },
  { id: 14, name: "Motichoor Laddu 250g", code: "PRD-SWT-004", category: "Sweets", package_size: "250g", unit: "packets", price: 110.0, cost_price: 64.0, stock_quantity: 55, min_threshold: 10, description: "Fine gram pearls soaked in saffron sugar syrup with pistachio", is_active: true, created_at: new Date().toISOString() },
];

let localCustomers: Customer[] = [
  { id: 1, name: "Retailer A (Chennai Stores)", contact_person: "R. Shanmugam", phone: "9840123456", email: "retailera@gmail.com", customer_type: "Retailer", gstin: "33AAACA1234F1Z8", address: "14, Ranganathan Street, T. Nagar", city: "Chennai", state: "Tamil Nadu", pincode: "600017", credit_limit: 100000.0, outstanding_balance: 3875.0, is_active: true, created_at: new Date().toISOString() },
  { id: 2, name: "Distributor B (Karnataka)", contact_person: "V. R. Venkatesh", phone: "9880145678", email: "distributorb@blr.com", customer_type: "Distributor", gstin: "29AABCB1122D1ZY", address: "88, 8th Cross, Malleswaram", city: "Bengaluru", state: "Karnataka", pincode: "560003", credit_limit: 150000.0, outstanding_balance: 0.0, is_active: true, created_at: new Date().toISOString() },
  { id: 3, name: "Murugan Departmental Stores", contact_person: "M. Palaniappan", phone: "9842187654", email: "muruganstores@gmail.com", customer_type: "Retailer", gstin: "33AABCM9876C1ZG", address: "45, West Masi Street", city: "Madurai", state: "Tamil Nadu", pincode: "625001", credit_limit: 75000.0, outstanding_balance: 12400.0, is_active: true, created_at: new Date().toISOString() },
  { id: 4, name: "Kovai Nilgiris Supermarket", contact_person: "K. Balakrishnan", phone: "9894011223", email: "cbe.nilgiris@retail.in", customer_type: "Retailer", gstin: "33AABCN5544B1ZH", address: "112, D.B. Road, R.S. Puram", city: "Coimbatore", state: "Tamil Nadu", pincode: "641002", credit_limit: 90000.0, outstanding_balance: 0.0, is_active: true, created_at: new Date().toISOString() },
  { id: 5, name: "Meenakshi Traders & Wholesale", contact_person: "S. Karthikeyan", phone: "9786044556", email: "meenakshi@yahoo.com", customer_type: "Distributor", gstin: "33AACMT7788P1ZX", address: "28, High Ground Road", city: "Tirunelveli", state: "Tamil Nadu", pincode: "627002", credit_limit: 200000.0, outstanding_balance: 24500.0, is_active: true, created_at: new Date().toISOString() },
  { id: 6, name: "Malabar Spice & Snacks", contact_person: "P. K. Nambiar", phone: "9847033445", email: "malabar.snacks@rediff.com", customer_type: "Retailer", gstin: "32AABCM3322E1Z2", address: "19, MG Road, Ernakulam", city: "Kochi", state: "Kerala", pincode: "682011", credit_limit: 80000.0, outstanding_balance: 15300.0, is_active: true, created_at: new Date().toISOString() },
  { id: 7, name: "Sri Venkateswara Grand Bazaar", contact_person: "Ch. Ramana Murthy", phone: "9849055667", email: "grandbazaar.tpt@gmail.com", customer_type: "Retailer", gstin: "37AABCS6655Q1ZU", address: "104, Gandhi Road", city: "Tirupati", state: "Andhra Pradesh", pincode: "517501", credit_limit: 85000.0, outstanding_balance: 0.0, is_active: true, created_at: new Date().toISOString() },
];

let localInventory: InventoryItem[] = [
  { id: 1, name: "Raw Flour (Murukku Grade)", item_code: "RM-FLR-01", category: "Raw Material", unit: "kg", current_stock: 120.0, min_threshold: 40.0, unit_cost: 45.0, supplier_name: "Ponni Agro Mills, Erode", last_updated: new Date().toISOString() },
  { id: 2, name: "Cooking Oil (Refined Groundnut)", item_code: "RM-OIL-01", category: "Raw Material", unit: "litre", current_stock: 19.5, min_threshold: 15.0, unit_cost: 140.0, supplier_name: "VVS Refineries", last_updated: new Date().toISOString() },
  { id: 3, name: "Salt and Spice Mix", item_code: "RM-SPC-01", category: "Raw Material", unit: "kg", current_stock: 3.8, min_threshold: 2.0, unit_cost: 200.0, supplier_name: "Guntur Spice Syndicate", last_updated: new Date().toISOString() },
  { id: 4, name: "200g Printed Foil Pouches", item_code: "PK-PCH-200", category: "Packaging Material", unit: "pieces", current_stock: 306.0, min_threshold: 100.0, unit_cost: 2.50, supplier_name: "Sivakasi Flexo Prints", last_updated: new Date().toISOString() },
  { id: 5, name: "Master Cartons (holds 20 pkts)", item_code: "PK-CTN-M20", category: "Packaging Material", unit: "pieces", current_stock: 21.0, min_threshold: 10.0, unit_cost: 15.0, supplier_name: "Universal Corrugators", last_updated: new Date().toISOString() },
  { id: 6, name: "Pure Coconut Oil (Cold Pressed)", item_code: "RM-OIL-02", category: "Raw Material", unit: "litre", current_stock: 150.0, min_threshold: 30.0, unit_cost: 240.0, supplier_name: "Kera Natural Oils", last_updated: new Date().toISOString() },
  { id: 7, name: "Pure Cow Ghee", item_code: "RM-GHEE-01", category: "Raw Material", unit: "kg", current_stock: 85.0, min_threshold: 20.0, unit_cost: 580.0, supplier_name: "Aavin Dairy, Salem", last_updated: new Date().toISOString() },
  { id: 8, name: "Refined Sugar Grade M-30", item_code: "RM-SGR-01", category: "Raw Material", unit: "kg", current_stock: 450.0, min_threshold: 100.0, unit_cost: 42.0, supplier_name: "Sakthi Sugars", last_updated: new Date().toISOString() },
];

let localOrders: Order[] = [
  {
    id: 1,
    order_number: "ORD-2026-001",
    customer_id: 1,
    customer_name: "Retailer A (Chennai Stores)",
    customer_city: "Chennai",
    customer_state: "Tamil Nadu",
    salesman_id: 2,
    salesman_name: "Senthil Nathan (Salesman A)",
    status: "Dispatched",
    total_amount: 7500.0,
    notes: "Benchmark Scenario: 150 packets Murukku 200g dispatched",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [{ id: 1, product_id: 1, product_name: "Classic Kai Murukku 200g", quantity: 150, unit_price: 50.0, total_price: 7500.0 }]
  },
  {
    id: 2,
    order_number: "ORD-2026-002",
    customer_id: 2,
    customer_name: "Distributor B (Karnataka)",
    customer_city: "Bengaluru",
    customer_state: "Karnataka",
    salesman_id: 2,
    salesman_name: "Senthil Nathan (Salesman B)",
    status: "Pending",
    total_amount: 6000.0,
    notes: "Benchmark Scenario: 120 pkts booked. Shortage of 32 packets flagged against current stock (88 pkts).",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [{ id: 2, product_id: 1, product_name: "Classic Kai Murukku 200g", quantity: 120, unit_price: 50.0, total_price: 6000.0 }]
  }
];

let localBatches: ProductionBatch[] = [
  {
    id: 1,
    batch_number: "BAT-2026-001",
    product_id: 1,
    product_name: "Classic Kai Murukku 200g",
    supervisor_id: 3,
    supervisor_name: "Muthuraman (Plant Supervisor)",
    batch_date: new Date().toISOString(),
    raw_material_weight_kg: 40.0,
    packet_size_g: 200.0,
    expected_packets: 200,
    actual_packets: 188,
    wastage_kg: 2.4,
    wastage_percentage: 6.0,
    variance_packets: -12,
    status: "Completed",
    notes: "Benchmark run: Issued 40 kg flour, 10.5 L oil (+5% variance), 1.2 kg spice mix. Actual: 188 good pkts, 6 damaged pouches, 9 cartons used.",
    created_at: new Date().toISOString(),
    materials_used: [
      { id: 1, inventory_item_id: 1, item_name: "Raw Flour (Murukku Grade)", quantity_used: 40.0, unit: "kg" },
      { id: 2, inventory_item_id: 2, item_name: "Cooking Oil (Refined Groundnut)", quantity_used: 10.5, unit: "litre" },
      { id: 3, inventory_item_id: 3, item_name: "Salt and Spice Mix", quantity_used: 1.2, unit: "kg" },
      { id: 4, inventory_item_id: 4, item_name: "200g Printed Foil Pouches", quantity_used: 194.0, unit: "pieces" },
    ]
  }
];

let localInvoices: Invoice[] = [
  {
    id: 1,
    invoice_number: "INV-2026-001",
    order_id: 1,
    customer_id: 1,
    customer_name: "Retailer A (Chennai Stores)",
    customer_gstin: "33AAACA1234F1Z8",
    customer_address: "14, Ranganathan Street, T. Nagar, Chennai - 600017",
    customer_state: "Tamil Nadu",
    invoice_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 30 * 86400000).toISOString(),
    subtotal: 7500.0,
    is_tamil_nadu: true,
    cgst_rate: 2.5,
    cgst_amount: 187.50,
    sgst_rate: 2.5,
    sgst_amount: 187.50,
    igst_rate: 0.0,
    igst_amount: 0.0,
    total_tax: 375.0,
    grand_total: 7875.0,
    paid_amount: 4000.0,
    balance_due: 3875.0,
    payment_status: "Partially Paid",
    notes: "Benchmark: Retailer A invoice with 5% GST (CGST ₹187.50 + SGST ₹187.50). Paid: ₹4,000, Outstanding: ₹3,875.",
    created_at: new Date().toISOString(),
    items: [
      { id: 1, product_id: 1, product_name: "Classic Kai Murukku 200g", hsn_code: "21069099", quantity: 150, unit_price: 50.0, tax_rate: 5.0, amount: 7500.0 }
    ]
  }
];

let localPayments: Payment[] = [
  {
    id: 1,
    receipt_number: "RCP-2026-001",
    customer_id: 1,
    customer_name: "Retailer A (Chennai Stores)",
    invoice_id: 1,
    invoice_number: "INV-2026-001",
    amount: 4000.0,
    payment_date: new Date().toISOString(),
    payment_mode: "Bank Transfer / NEFT",
    reference_number: "HDFCN260549321",
    notes: "Benchmark Scenario: Advance payment of ₹4,000 from Retailer A against INV-2026-001",
    created_at: new Date().toISOString()
  }
];

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
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.ok) {
      // Check if response is JSON (not HTML from rewrite)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return response.json();
      }
    }
  } catch (err) {
    // Network offline or static Vercel host without live Python server
  }

  // Resilient fallback logic for client operations
  return getLocalFallback<T>(endpoint, options);
}

function getLocalFallback<T>(endpoint: string, options: RequestInit): T {
  // 1. Auth Profile
  if (endpoint.startsWith('/auth/me')) {
    return {
      id: 1,
      username: 'admin',
      email: 'admin@ordertoaudit.com',
      full_name: 'Rajesh Kumar (Managing Director)',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString()
    } as T;
  }

  // 2. Auth Login
  if (endpoint.startsWith('/auth/login')) {
    const user = {
      id: 1,
      username: 'admin',
      email: 'admin@ordertoaudit.com',
      full_name: 'Rajesh Kumar (Managing Director)',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString()
    };
    return { access_token: 'demo_token', token_type: 'bearer', user } as T;
  }

  // 3. Dashboard Stats
  if (endpoint.startsWith('/dashboard/stats')) {
    const totalSales = localInvoices.reduce((s, i) => s + i.grand_total, 0);
    const availableStock = localProducts.reduce((s, p) => s + p.stock_quantity, 0);
    const receivables = localCustomers.reduce((s, c) => s + c.outstanding_balance, 0);

    return {
      total_sales: totalSales,
      today_orders_count: localOrders.length,
      available_stock_packets: availableStock,
      pending_orders_count: localOrders.filter(o => o.status === 'Pending').length,
      approved_orders_count: localOrders.filter(o => o.status === 'Approved').length,
      today_production_packets: 188,
      total_receivables: receivables,
      low_stock_alerts: 2,
      recent_orders: localOrders.map(o => ({
        id: o.id,
        order_number: o.order_number,
        customer_name: o.customer_name || 'Customer',
        city: o.customer_city || 'Chennai',
        state: o.customer_state || 'Tamil Nadu',
        status: o.status,
        total_amount: o.total_amount,
        created_at: o.created_at
      })),
      category_sales: [
        { category: "Murukku", product_count: 4, total_stock: 443 },
        { category: "Mixture", product_count: 3, total_stock: 355 },
        { category: "Chips", product_count: 3, total_stock: 410 },
        { category: "Sweets", product_count: 4, total_stock: 240 },
      ],
      monthly_trend: [
        { month: "Jun", sales: 185000, production: 3200, wastage: 2.4 },
        { month: "Jul", sales: 210000, production: 3800, wastage: 2.1 },
        { month: "Aug", sales: 260000, production: 4500, wastage: 1.9 },
        { month: "Sep", sales: 295000, production: 4900, wastage: 1.8 },
        { month: "Oct", sales: 410000, production: 6800, wastage: 1.6 },
        { month: "Nov", sales: 340000, production: 5600, wastage: 1.7 },
      ],
      recent_batches: localBatches.map(b => ({
        id: b.id,
        batch_number: b.batch_number,
        product_name: b.product_name || 'Murukku 200g',
        expected_packets: b.expected_packets,
        actual_packets: b.actual_packets,
        wastage_percentage: b.wastage_percentage,
        wastage_kg: b.wastage_kg,
        status: b.status,
        date: new Date(b.batch_date).toLocaleDateString('en-IN')
      }))
    } as T;
  }

  // 4. Products
  if (endpoint.startsWith('/products')) {
    if (options.method === 'POST') {
      const data = JSON.parse(options.body as string);
      const newProd: Product = {
        id: localProducts.length + 1,
        ...data,
        is_active: true,
        created_at: new Date().toISOString()
      };
      localProducts.push(newProd);
      return newProd as T;
    }
    return localProducts as T;
  }

  // 5. Customers
  if (endpoint.startsWith('/customers')) {
    if (options.method === 'POST') {
      const data = JSON.parse(options.body as string);
      const newCust: Customer = {
        id: localCustomers.length + 1,
        ...data,
        is_active: true,
        created_at: new Date().toISOString()
      };
      localCustomers.push(newCust);
      return newCust as T;
    }
    return localCustomers as T;
  }

  // 6. Orders
  if (endpoint.startsWith('/orders')) {
    if (options.method === 'POST') {
      const data = JSON.parse(options.body as string);
      const cust = localCustomers.find(c => c.id === data.customer_id);
      const totalAmount = data.items.reduce((s: number, i: any) => s + (i.quantity * i.unit_price), 0);
      const newOrd: Order = {
        id: localOrders.length + 1,
        order_number: `ORD-2026-${String(localOrders.length + 1).padStart(3, '0')}`,
        customer_id: data.customer_id,
        customer_name: cust ? cust.name : 'Customer',
        customer_city: cust ? cust.city : 'City',
        customer_state: cust ? cust.state : 'Tamil Nadu',
        salesman_id: data.salesman_id || 2,
        salesman_name: 'Senthil Nathan (Salesman)',
        status: 'Pending',
        total_amount: totalAmount,
        notes: data.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: data.items.map((itm: any, idx: number) => {
          const prod = localProducts.find(p => p.id === itm.product_id);
          return {
            id: idx + 1,
            product_id: itm.product_id,
            product_name: prod ? prod.name : 'Snack',
            quantity: itm.quantity,
            unit_price: itm.unit_price,
            total_price: itm.quantity * itm.unit_price
          };
        })
      };
      localOrders.unshift(newOrd);
      return newOrd as T;
    }
    return localOrders as T;
  }

  // 7. Inventory
  if (endpoint.startsWith('/inventory')) {
    if (endpoint.includes('/adjust')) {
      const id = parseInt(endpoint.split('/')[2]);
      const data = JSON.parse(options.body as string);
      const itm = localInventory.find(i => i.id === id);
      if (itm) {
        itm.current_stock = Math.max(0, itm.current_stock + data.quantity_change);
        itm.last_updated = new Date().toISOString();
        return itm as T;
      }
    }
    if (options.method === 'POST') {
      const data = JSON.parse(options.body as string);
      const newItm: InventoryItem = {
        id: localInventory.length + 1,
        ...data,
        last_updated: new Date().toISOString()
      };
      localInventory.push(newItm);
      return newItm as T;
    }
    return localInventory as T;
  }

  // 8. Production
  if (endpoint.startsWith('/production')) {
    if (options.method === 'POST') {
      const data = JSON.parse(options.body as string);
      const prod = localProducts.find(p => p.id === data.product_id);
      const packetKg = (data.packet_size_g || 200) / 1000.0;
      const expected = Math.floor(data.raw_material_weight_kg / packetKg);
      const actual = data.actual_packets;
      const producedKg = actual * packetKg;
      const wastageKg = Math.max(0, data.raw_material_weight_kg - producedKg);
      const wastagePct = parseFloat(((wastageKg / data.raw_material_weight_kg) * 100).toFixed(2));

      // Update product stock
      if (prod) {
        prod.stock_quantity += actual;
      }

      // Deduct inventory
      data.materials_used?.forEach((mat: any) => {
        const inv = localInventory.find(i => i.id === mat.inventory_item_id);
        if (inv) {
          inv.current_stock = Math.max(0, inv.current_stock - mat.quantity_used);
        }
      });

      const newBatch: ProductionBatch = {
        id: localBatches.length + 1,
        batch_number: `BAT-2026-${String(localBatches.length + 1).padStart(3, '0')}`,
        product_id: data.product_id,
        product_name: prod ? prod.name : 'Snack Product',
        supervisor_id: data.supervisor_id || 3,
        supervisor_name: 'Muthuraman (Plant Supervisor)',
        batch_date: new Date().toISOString(),
        raw_material_weight_kg: data.raw_material_weight_kg,
        packet_size_g: data.packet_size_g,
        expected_packets: expected,
        actual_packets: actual,
        wastage_kg: wastageKg,
        wastage_percentage: wastagePct,
        variance_packets: actual - expected,
        status: 'Completed',
        notes: data.notes,
        created_at: new Date().toISOString(),
        materials_used: data.materials_used || []
      };
      localBatches.unshift(newBatch);
      return newBatch as T;
    }
    return localBatches as T;
  }

  // 9. Invoices
  if (endpoint.startsWith('/invoices')) {
    return localInvoices as T;
  }

  // 10. Payments
  if (endpoint.startsWith('/payments')) {
    if (options.method === 'POST') {
      const data = JSON.parse(options.body as string);
      const cust = localCustomers.find(c => c.id === data.customer_id);
      if (cust) {
        cust.outstanding_balance = Math.max(0, cust.outstanding_balance - data.amount);
      }
      const newPay: Payment = {
        id: localPayments.length + 1,
        receipt_number: `RCP-2026-${String(localPayments.length + 1).padStart(3, '0')}`,
        customer_id: data.customer_id,
        customer_name: cust ? cust.name : 'Customer',
        invoice_id: data.invoice_id,
        invoice_number: data.invoice_id ? 'INV-2026-001' : undefined,
        amount: data.amount,
        payment_date: new Date().toISOString(),
        payment_mode: data.payment_mode,
        reference_number: data.reference_number,
        notes: data.notes,
        created_at: new Date().toISOString()
      };
      localPayments.unshift(newPay);
      return newPay as T;
    }
    return localPayments as T;
  }

  // 11. Reports Summary
  if (endpoint.startsWith('/reports/summary')) {
    return {
      financial_summary: {
        total_sales: 7875.0,
        total_tax_collected: 375.0,
        total_collected: 4000.0,
        total_receivables: 3875.0
      },
      manufacturing_summary: {
        total_packets_produced: 188,
        average_wastage_percentage: 6.0,
        raw_packaging_valuation: 18500.0,
        finished_goods_valuation: 4400.0
      }
    } as T;
  }

  return {} as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getProfile: () => request<User>('/auth/me'),
  getUsers: () => request<User[]>('/auth/users'),

  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),

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
  updateOrderStatus: (id: number, status: string) => {
    const ord = localOrders.find(o => o.id === id);
    if (ord) ord.status = status as any;
    return request<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

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

  getInvoices: (status?: string, customerId?: number) => {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status);
    if (customerId) params.append('customer_id', customerId.toString());
    return request<Invoice[]>(`/invoices?${params.toString()}`);
  },
  getInvoice: (id: number) => request<Invoice>(`/invoices/${id}`),
  downloadInvoicePdfUrl: (id: number) => `${API_BASE}/invoices/${id}/pdf`,

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

  getReportsSummary: () => request<any>('/reports/summary'),
  downloadExcelUrl: () => `${API_BASE}/reports/export/excel`,
  downloadPdfReportUrl: () => `${API_BASE}/reports/export/pdf`,
};
