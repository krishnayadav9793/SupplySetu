# SupplySetu (सप्लाईसेतु)
### AI-Powered B2B FMCG Distribution & Order Management Platform
**Primary Industry:** FMCG Distribution and Wholesale &bull; **Location:** Jabalpur, Madhya Pradesh, India  
**Tagline:** *From WhatsApp Orders to Intelligent Distribution*  
**Live Application URL:** [https://supply-setu-gamma.vercel.app/](https://supply-setu-gamma.vercel.app/)  
**GitHub Repository:** [https://github.com/krishnayadav9793/SupplySetu](https://github.com/krishnayadav9793/SupplySetu)

---

## 1. Project Overview

**SupplySetu** is an intelligent, full-stack B2B ordering and distribution management platform built specifically for Indian FMCG wholesale distributors and kirana retail networks. 

In traditional FMCG supply chains across tier-2 and tier-3 markets like Jabalpur, distributors manage 1,800+ kirana shops using fragmented channels: WhatsApp messages in Hindi/Hinglish, photographed notebook pages, and verbal phone orders. This causes frequent errors in product identification, mismatched pack sizes, out-of-stock ordering, unapplied trade schemes, and days of manual data entry into accounting systems like Tally ERP.

SupplySetu digitizes this workflow end-to-end:
1. **Kirana Retailers** order via digital catalogue or by pasting unstructured natural-language Hinglish messages parsed instantly by Gemini AI.
2. **Beat Salesmen** take orders in areas with weak connectivity using a 100% offline-first Dexie IndexedDB engine that auto-syncs when online.
3. **Distributor Order Desk Admins** review real-time orders, manage credit limits and holds, approve batches, and export standard RFC-4180 Tally ERP CSV files.

---

## 2. Key Features

- **Full-Screen Desktop & Mobile Experience:** Edge-to-edge responsive layout built with React, Vite, and Tailwind CSS.
- **Retailer-Specific Pricing Tiers:** Dynamic rate calculation based on merchant tier (Standard, Tier 1 at 2% off, Tier 2 at 4% off, Wholesale at 6.5% off) with margin transparency vs MRP.
- **Automated Promotional Scheme Engine:** Automatic calculation of `BUY_X_GET_Y_FREE` (e.g. Parle-G 10+1, Maggi 12+1) and percentage volume discounts (e.g. Surf Excel 5% bulk discount).
- **AI-Powered Natural-Language Order Capture:** Interprets messy Hinglish/Hindi text (e.g., *"bhaiya 5 peti biscuit chhota, 2 peti washing powder 1 kilo"*) into structured SKUs, quantities, and units.
- **Human-in-the-Loop Confirmation:** Interactive review screen allowing shopkeepers to verify extracted products, adjust pack sizes, and see real-time stock alerts.
- **Credit Limit & Outstanding Khata Controls:** Real-time credit validation against retailer credit limits, automatically flagging credit holds for distributor office approval.
- **Offline Mode with Dexie IndexedDB:** Salesmen can book orders in low/no-network zones; orders are securely stored in IndexedDB with unique idempotency keys (`clientOrderId`) and auto-synced upon reconnection.
- **Tally ERP-Compatible CSV Export:** One-click streaming export of approved orders formatted with all mandatory ERP fields (Order ID, Retailer Code, GSTIN, SKU, HSN, Taxable Subtotal, GST, Total).

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React |
| **Offline Storage** | Dexie.js (IndexedDB wrapper with schema indexing & idempotency) |
| **Backend API** | Node.js, Express.js, TypeScript, tsx |
| **Database & ORM** | PostgreSQL (Supabase), Prisma ORM v6 |
| **AI / NLP** | Google Gemini API (`@google/genai`) with fallback fuzzy matching |
| **Authentication** | Mobile OTP Simulation, JWT, Role-Based Access Control (RBAC) |
| **Testing** | Automated Business Logic Verification Suite (`server/src/tests/suite.ts`) |

---

## 4. User Roles & Workflows

### 🏪 1. Retailer (Kirana Shopkeeper)
- Browse verified FMCG catalogue with live stock and tier-specific dealer rates.
- Paste Hinglish/Hindi order notes into the AI Order Pad.
- Review AI-mapped items, catch out-of-stock items, and see applied free-product schemes.
- Track order history, dispatch statuses, and available credit limit.

### 🚴 2. Salesman (Beat Sales Executive)
- Access daily beat sequence (e.g. Beat #4 Lordganj & Sarafa Sector).
- View merchant outstanding balance before visiting.
- **Offline Order Punch Pad:** Book orders without internet connectivity; orders are queued in Dexie IndexedDB.
- Inspect queued orders and sync with Jabalpur distribution hub when connectivity returns.

### 🏢 3. Distributor Admin (Order Desk Manager)
- Centralized 12-column live order desk with sound operational metrics.
- Review pending orders, credit warnings, and retailer accounts.
- One-click Approve or Reject with reason logging.
- Export approved order batches directly to Tally ERP-compatible CSV.

---

## 5. Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL Database** or **Supabase Account**

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/SupplySetu.git
cd SupplySetu
```

### Step 2: Configure Environment Variables
Copy the example environment files:
```bash
# Server environment
cp server/.env.example server/.env

# Client environment
cp client/.env.example client/.env
```
Ensure database connection strings (`DATABASE_URL` and `DIRECT_URL`) and JWT secret are configured in `server/.env`.

### Step 3: Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 4: Run Database Migrations & Demo Seed
```bash
cd ../server
npm run prisma:generate
npm run seed
```

### Step 5: Start Development Servers
Run backend:
```bash
# In server/ directory
npm run dev
# Server will run on http://localhost:5000
```

Run frontend:
```bash
# In client/ directory
npm run dev
# Application will run on http://localhost:5173
```

---

## 6. Demo Accounts

The database comes pre-seeded with test accounts representing the Jabalpur FMCG distribution hierarchy:

| Role | Mobile Number | Password | Name / Entity | Context |
|---|---|---|---|---|
| **Distributor Admin** | `9893000001` | `password123` | Ramesh Gupta | Jabalpur Distribution Head |
| **Beat Salesman** | `9893000002` | `password123` | Vikram Sharma | Beat #4 (Lordganj & Sarafa) |
| **Kirana Retailer** | `9893000003` | `password123` | Anil Patel | Shri Ganesh Kirana (Tier 1) |

*(Quick test credentials can also be selected directly on the login page via one-click role buttons).*

---

## 7. Automated Testing Suite

SupplySetu includes an end-to-end automated verification suite covering pricing tiers, scheme mechanics, credit controls, offline idempotency, and Tally export compliance.

To run the verification suite:
```bash
npm --prefix server test
```

### Test Coverage Highlights:
- **Pricing Tiers:** Standard (0%), Tier 1 (2%), Tier 2 (4%), Wholesale (6.5%), margin calculations vs MRP, and GST computations.
- **Scheme Engine:** `BUY_X_GET_Y_FREE` threshold tests (below minimum, exact minimum, multiple sets) and volume percentage discounts.
- **Credit Controls:** Clean approvals within limit vs credit hold flags when order total exceeds available credit line.
- **Offline Sync:** UUID idempotency generation (`clientOrderId`) and duplicate prevention.
- **Tally Export:** RFC-4180 CSV compliance and mandatory accounting headers.

---

## 8. Tally ERP CSV Specification

The exported CSV matches standard Tally ERP data import templates:

| Field Name | Description | Example |
|---|---|---|
| `Order ID` | Sequential distributor order number | `ORD-1001` |
| `Order Date` | ISO Date of order placement | `2026-11-05` |
| `Retailer Code` | Unique merchant identifier | `RET-9893000003` |
| `Retailer Name` | Trade shop name | `Shri Ganesh Kirana Store` |
| `GSTIN` | Merchant GST identifier | `23AABCP1234D1Z5` |
| `City` | Distribution territory | `Jabalpur` |
| `SKU Code` | Manufacturer SKU identifier | `PARLE-G-80G` |
| `Product Name` | Full product label | `Parle-G Glucose Biscuit (80g x 72 Pack)` |
| `Quantity` | Invoiced unit quantity | `10` |
| `Unit` | Commercial packaging unit | `BOX` |
| `Free Quantity` | Free scheme items | `1` |
| `Dealer Rate (INR)` | Invoiced rate before tax | `597.80` |
| `Trade Discount` | Promotional discount applied | `0.00` |
| `Taxable Subtotal` | Taxable base amount | `5978.00` |
| `GST Rate (%)` | Applicable GST percentage | `5.0` |
| `Item GST (INR)` | Tax amount | `298.90` |
| `Total Item Amount`| Final payable item amount | `6276.90` |
| `Created Channel` | Order origin channel | `SALESMAN_APP` / `AI_CAPTURE` |

---

## 9. License

This project is licensed under the MIT License.
