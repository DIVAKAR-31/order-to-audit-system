# Order-to-Audit System 🌾🍘
### Management & Audit Platform for South Indian Snacks Manufacturing
**Products:** Murukku, Mixture, Chips and Sweets  
**Tech Stack:** React, TypeScript, Tailwind CSS, Python FastAPI, SQLite / PostgreSQL (SQLAlchemy ORM)

---

## 🌟 Overview & Key Capabilities

The **Order-to-Audit System** is a full-stack, enterprise-grade web application custom-built for small-to-medium South Indian snack manufacturers. It unifies operations across sales, inventory, production, 5% GST tax invoicing, customer payments, and executive audit reporting.

### 🏭 Manufacturing Modules:
1. **Executive Dashboard:** Live metrics for total sales revenue, today's order count, finished packets in warehouse stock, pending order approvals, today's production output, outstanding receivables, category distribution (Murukku, Mixture, Chips, Sweets), and 6-month revenue/yield trends.
2. **Products Catalog:** Add, edit, and deactivate snack products (Kai Murukku, Butter Murukku, Mullu Murukku, Madras Mixture, Kara Boondi, Kerala Banana Chips in cold-pressed coconut oil, Tapioca Chips, Tirunelveli Ghee Halwa, Mysore Pak, Athirasam, Laddu). Real-time stock status with low-threshold warnings.
3. **Customers Directory:** Manage retail store accounts and wholesale distributors across Tamil Nadu and Interstate (Karnataka, Kerala, Andhra Pradesh). Credit limit and live ledger balance tracking.
4. **Order Booking:** Salesmen create itemized bookings with auto-calculated rates and quantities. Workflow statuses: `Pending` -> `Approved` -> `Dispatched` (auto-deducts ready packets from warehouse stock and triggers automatic 5% GST tax invoice generation).
5. **Inventory Audit:** Audit storehouse stock of raw materials (flours, groundnut oil, coconut oil, spices, asafoetida/hing, nuts) and packaging materials (metallized foil pouches, rigid boxes, corrugated shipping cartons). One-click inward stock receipts and adjustments.
6. **Production & Wastage Tracking:** Plant supervisors log frying/batch runs. Input total raw mix dough weight (kg), target packet size (g), and actual sealed packets. System computes:
   - **Expected Yield (Packets)**
   - **Actual Yield & Variance**
   - **Scrap / Wastage (kg)**
   - **Wastage Loss %** (Quality target: < 2.5%)
   - **Automated stock reconciliation:** Increases finished packets and deducts ingredients from inventory.
7. **5% GST Tax Invoices & PDF Download:**
   - **Tamil Nadu Customers (Intra-state):** CGST 2.5% + SGST 2.5%
   - **Other States (Inter-state: KA, KL, AP):** IGST 5.0%
   - **Download Official PDF:** Generates official tax invoices via ReportLab with FSSAI, GSTIN, HSN Code `21069099`, bank details, and authorized signature.
8. **Customer Payments:** Record bank NEFT, UPI, cheque, and cash receipts. Automatically updates customer ledger and marks invoices as `Paid` or `Partially Paid`.
9. **Management Audit Reports:** Summary valuations, 1-click **Export to Excel (.xlsx)** and **Download Audit PDF** with production yield audit and GST ledger.

---

## 👥 Role-Based Access Control (RBAC) & Test Logins

The application features role-based authentication and a convenient **1-click Role Switcher** in the header and login screen:

| Role | Username | Password | Full Name | Accessible Pages |
|------|----------|----------|-----------|------------------|
| **Admin** | `admin` | `admin123` | Rajesh Kumar (Managing Director) | **All 9 Pages** (Full Access) |
| **Salesman** | `salesman` | `sales123` | Senthil Nathan (Senior Sales Executive) | Dashboard, Products (View), Customers, Orders |
| **Production Supervisor** | `supervisor` | `prod123` | Muthuraman (Plant Supervisor) | Dashboard, Products (View), Inventory, Production |
| **Accountant** | `accountant` | `acc123` | Lakshmi Narayanan (Chief Accountant) | Dashboard, Customers, Invoices, Payments, Reports |

---

## 🚀 How to Run the Application

### Option A: 1-Click Launch (Recommended)
Double-click `run.bat` in the project root directory, or execute in terminal:
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
Open your browser and navigate to:
👉 **`http://localhost:8000`**

The FastAPI backend automatically serves the pre-built React frontend bundle with all routes, API endpoints, and database seed data!

### Option B: Development Mode (Vite Hot-Reloading + FastAPI)
1. **Start FastAPI Backend:**
   ```bash
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
2. **Start Vite React Frontend (in separate terminal):**
   ```bash
   cd frontend
   npm run dev
   ```
   Open **`http://localhost:5173`** (API requests are automatically proxied to port 8000).

---

## 🗄️ Database & Configuration

- **Default:** SQLite (`order_to_audit.db`) for immediate zero-config execution.
- **PostgreSQL Support:** To connect to a PostgreSQL instance, simply set the `DATABASE_URL` environment variable:
  ```bash
  set DATABASE_URL=postgresql://username:password@localhost:5432/order_to_audit
  ```
  SQLAlchemy ORM models will automatically connect and create tables on PostgreSQL.
- **Auto-Seeding:** On initial startup, authentic seed data for South Indian snacks, suppliers, distributors, batches, invoices, and payments is populated automatically.

---

## 📁 Project Structure

```
nit/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app & frontend static mounting
│   │   ├── database.py          # SQLAlchemy engine & session maker
│   │   ├── models.py            # ORM schemas (Users, Products, Orders, Inventory, Batches, Invoices, Payments)
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # JWT authentication & bcrypt security
│   │   ├── seed_data.py         # Authentic South Indian snacks initial dataset
│   │   └── routers/
│   │       ├── auth.py          # /api/auth
│   │       ├── dashboard.py     # /api/dashboard
│   │       ├── products.py      # /api/products
│   │       ├── customers.py     # /api/customers
│   │       ├── orders.py        # /api/orders
│   │       ├── inventory.py     # /api/inventory
│   │       ├── production.py    # /api/production
│   │       ├── invoices.py      # /api/invoices (with PDF generation)
│   │       ├── payments.py      # /api/payments
│   │       └── reports.py       # /api/reports (with Excel & PDF export)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts        # Typed API client
│   │   ├── context/AuthContext.tsx # Authentication, role presets & RBAC
│   │   ├── types/index.ts       # TypeScript models
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Header
│   │   │   ├── common/          # StatCard, Modal
│   │   │   ├── auth/LoginPage.tsx
│   │   │   └── pages/           # Dashboard, Products, Customers, Orders,
│   │   │                        # Inventory, Production, Invoices, Payments, Reports
│   │   ├── App.tsx
│   │   ├── index.css            # Tailwind CSS styling
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── run.bat                      # Windows launcher
├── test_app.py                  # Integration verification suite (13 endpoints)
└── README.md
```
