# 🛒 QuickBill — Retail POS & Customer Order Management Web App

A production-ready **Billing and Order Management Web Application** designed for small retail and grocery shops. Features dual dashboards (Admin Console & Customer Store), lightning-fast POS billing with barcode lookup, live inventory management, customer order lifecycle tracking, and pixel-perfect **4-inch thermal receipt printing**.

---

## 🚀 Key Features

### 1. Dual Dashboards & Role-Based Access
- **Admin Dashboard (`/admin/*`)**:
  - Summary KPI cards: Today's Sales (₹), Today's Invoices, Total Products, Low Stock Alerts, Total Customers, Pending Orders.
  - Interactive charts for 7-day revenue trend, sales by payment mode, and top-selling products.
  - POS Billing with barcode lookup & keyboard shortcuts (`F1`, `F2`, `F4`, `F8`, `F9`, `Esc`).
  - Product Catalog CRUD with SKU/Barcode, pricing, stock levels, and threshold warnings.
  - Stock Management with inventory status badges and complete **Audit History Trail**.
  - Customer Orders Queue with status pipeline and **1-click Convert-to-Bill & Print**.
  - Daily Bills with date filters, revenue breakdowns, and thermal receipt reprint.
  - Financial Reports with profit margins, category sales, top products, and CSV export.
  - Shop Settings with live thermal receipt preview.

- **Customer Dashboard (`/customer/*`)**:
  - Mobile-first shopping catalog with instant search and category pills.
  - Live stock indicators: "In Stock", "Low Stock (Only X left)", and "Out of Stock".
  - Shopping Cart with quantity steppers and delivery/pickup notes.
  - Live **Order Fulfillment Timeline**: `Pending Review` ➔ `Accepted` ➔ `Preparing` ➔ `Ready for Pickup` ➔ `Completed`.
  - Customer Profile with previous store purchase invoices.

---

### 2. 🖨️ 4-inch Thermal Receipt Printer Engine
- Optimized specifically for standard **4-inch / 80mm–100mm Thermal Roll Printers**.
- Pure `@media print` CSS engine:
  - Hides all web app UI, sidebars, buttons, and backgrounds.
  - High-contrast black-on-white monospace typography (`JetBrains Mono`, `Consolas`, `monospace`).
  - Automatic line wrapping for long product names without breaking character alignment.
  - Standard tax invoice structure: Store Info, Tax Invoice Header, Bill No, Date/Time, Customer Info, Item Table (`ITEM | QTY | RATE | TOTAL`), Subtotal, Discounts, Tax, Grand Total (₹), Payment Mode, and Custom Footer Message.
  - Dedicated interactive on-screen Receipt Preview modal with **Print**, **Reprint**, and **Copy Text** capabilities.

---

### 3. ⌨️ POS Billing Keyboard Shortcuts
| Shortcut | Action | Description |
| :--- | :--- | :--- |
| **`F1`** | New / Clear Bill | Resets the current POS cart to a fresh bill |
| **`F2`** | Barcode / SKU Scanner | Focuses the scanner input field for rapid item lookup |
| **`F4`** | Customer Selector | Opens the customer lookup & quick walk-in modal |
| **`F8`** | Complete Bill | Saves the bill and decrements stock atomically |
| **`F9`** | Complete & Print Bill | Saves the bill and immediately opens the 4-inch thermal print dialog |
| **`Esc`** | Close Modal / Cancel | Drops focus or closes active dialogs |

---

## 👥 Demo User Accounts

| Role | Identifier / Email | Mobile Phone | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@shop.com` | `9876543200` | `admin123` |
| **Customer** | `customer@gmail.com` | `9876543210` | `customer123` |
| **Customer 2** | `priya@gmail.com` | `9876543220` | `customer123` |
| **Customer 3** | `karthik@gmail.com` | `9876543230` | `customer123` |

*(1-Click Demo login buttons are also available on the Login screen)*

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, React Router v6.
- **Backend**: Node.js, Express.js, `sql.js` (WebAssembly SQLite engine with synchronous zero-latency ACID transactions & persistent file sync).
- **Authentication**: JWT tokens with role-based middleware guards (`requireAdmin`, `requireCustomer`).
- **Database Schema**:
  - `users`: Authentication & role accounts
  - `customers`: Customer profiles & aggregate metrics
  - `products`: Product catalog, SKU, barcode, cost/sell price, units & stock levels
  - `orders`: Online customer pickup/delivery orders
  - `order_items`: Line items for orders
  - `bills`: POS Invoices with unique invoice numbers (`INV-YYYYMMDD-XXX`)
  - `bill_items`: Line items for bills
  - `stock_transactions`: Full audit log of all stock movements
  - `settings`: Shop metadata, tax rates, footer message & thermal printer roll settings

---

## 🏃 Running the Application

### 1. Install Dependencies
```bash
npm install
npm --prefix frontend install
```

### 2. Start Both Backend & Frontend
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000/api`
- **Frontend App**: `http://localhost:5173`

### 3. Build for Production
```bash
npm run build
npm start
```

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/login` — Sign in with identifier & password
- `POST /api/auth/register` — Register a customer account
- `GET /api/auth/me` — Verify active JWT session

### Products & Catalog
- `GET /api/products` — List products with filters (category, stock status, search)
- `GET /api/products/lookup/:code` — Fast lookup by SKU or Barcode
- `POST /api/products` — Add new product (Admin)
- `PUT /api/products/:id` — Update product details (Admin)
- `DELETE /api/products/:id` — Delete / deactivate product (Admin)

### Stock & Inventory
- `GET /api/stock` — Inventory table with status badges & summary metrics
- `POST /api/stock/adjust` — Restock, reduce, or audit correction
- `GET /api/stock/history` — Stock movement audit trail

### Customer Orders
- `GET /api/orders` — List orders (filtered by status or user)
- `POST /api/orders` — Place customer order
- `PATCH /api/orders/:id/status` — Update order status (`pending` ➔ `accepted` ➔ `preparing` ➔ `ready` ➔ `completed`)
- `POST /api/orders/:id/convert-to-bill` — 1-click convert order to completed POS bill

### POS Billing & Daily Bills
- `POST /api/bills` — POS Bill creation with atomic stock decrement
- `GET /api/bills` — Daily bills list with date filters & financial summary
- `GET /api/bills/:id` — Full bill details for thermal receipt printing

### Reports & Settings
- `GET /api/reports/sales` — Financial reports, profits, category distribution
- `GET /api/settings` — Fetch shop & thermal printer settings
- `PUT /api/settings` — Update store identity and receipt format
