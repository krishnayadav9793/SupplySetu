# Deployment Guide & Reviewer Instructions — SupplySetu (सप्लाईसेतु)

> **Repository URL:** [https://github.com/krishnayadav9793/SupplySetu](https://github.com/krishnayadav9793/SupplySetu)  
> **Target Production URL:** [https://supplysetu.vercel.app](https://supplysetu.vercel.app) *(or your deployed staging URL)*  
> **Primary Technology Stack:** React 18, Vite, TypeScript, Tailwind CSS, Node.js, Express, Prisma ORM v6, Supabase (PostgreSQL), Google Gemini 1.5 Flash API, Dexie.js (IndexedDB).

---

## 1. Demo Login Credentials for the Reviewer

The platform is pre-seeded with realistic FMCG wholesale distribution sample data for the **Jabalpur (Madhya Pradesh)** distribution hub.

| Role | Mobile Number | Password | Name / Entity | Assigned Scope & Territory |
|---|---|---|---|---|
| **Distributor Admin** | `9893000001` | `password123` | Ramesh Gupta | Jabalpur Central Distribution Hub (Full Access to Order Desk, Approvals, Tally Export, Executive KPIs) |
| **Beat Salesman** | `9893000002` | `password123` | Vikram Sharma | Beat #4 (Lordganj & Sarafa Kirana Sector, 18 Kiranas, Offline Ordering Enabled) |
| **Kirana Retailer** | `9893000003` | `password123` | Anil Patel | Shri Ganesh Kirana Store (Tier 1 Pricing, ₹50,000 Credit Line, Multimodal AI Order Pad) |

> **Reviewer Pro-Tip:** The login screen at `/auth` features **One-Click Demo Account Selector Buttons** at the bottom of the sign-in card. You can click any role pill (*Admin*, *Salesman*, or *Retailer*) to instantly auto-fill the test credentials without typing.

---

## 2. Step-by-Step Local Setup & Execution Guide

### 2.1 System Prerequisites
Ensure the following developer tooling is installed on your local workstation:
- **Node.js**: v18.0.0 or higher (LTS recommended)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: Local instance OR a free cloud instance on [Supabase](https://supabase.com)
- **Git**: v2.30+

---

### 2.2 Repository Setup & Dependency Installation

Clone the public repository:
```bash
git clone https://github.com/krishnayadav9793/SupplySetu.git
cd SupplySetu
```

Install backend dependencies:
```bash
cd server
npm install
```

Install frontend dependencies:
```bash
cd ../client
npm install
cd ..
```

---

### 2.3 Environment Variable Configuration

Create the local configuration files from the provided templates.  
*(Refer to Section 3 for the comprehensive list of environment variable names.)*

```bash
# In the server directory:
cp server/.env.example server/.env

# In the client directory:
cp client/.env.example client/.env
```

Populate `server/.env` with your PostgreSQL / Supabase connection strings, a secure JWT secret, and (optionally) your Google Gemini API key.  
Populate `client/.env` with your frontend API endpoint (`http://localhost:5000/api`) and Supabase public parameters.

---

### 2.4 Database Schema Migration & Realistic FMCG Data Seeding

From the project root, navigate to the `server` directory and execute Prisma migrations and data seeding:

```bash
cd server

# 1. Generate Prisma Client bindings
npm run prisma:generate

# 2. Push schema to database
npx prisma db push

# 3. Populate database with realistic FMCG catalogue, schemes, pricing tiers, and users
npm run seed
```

The seed script creates:
- 3 distinct user roles with active authentication credentials.
- Retailer profiles with credit lines, outstanding balances, and price tiers (`STANDARD`, `TIER_1`, `TIER_2`, `WHOLESALE`).
- 25+ real FMCG SKUs across categories (Biscuits, Confectionery, Tea, Detergents, Personal Care, Spices) with HSN codes, MRP, base dealer rates, and 5%/12%/18% GST rates.
- Active trade schemes (e.g., *Buy 10 Get 1 Free* on Parle-G, *5% Volume Discount* on Surf Excel).
- Live inventory quantities and historical orders.

---

### 2.5 Run the Automated Verification & Logic Test Suite

SupplySetu includes an end-to-end automated business logic verification suite that tests pricing tiers, scheme mechanics, credit controls, offline sync idempotency, multimodal safety rules, tax invoice calculations, and Tally ERP CSV formatting:

```bash
# Run tests from the server directory
npm run test
```

*Expected output: All 31 verification tests pass (`31 passed, 0 failed`).*

---

### 2.6 Running the Development Applications

Open two terminal windows:

**Terminal 1 — Backend Express Server:**
```bash
cd server
npm run dev
# Server initiates on http://localhost:5000
# Health check available at: http://localhost:5000/api/health
```

**Terminal 2 — Frontend Client Application:**
```bash
cd client
npm run dev
# Frontend Vite dev server initiates on http://localhost:5173
```

Visit `http://localhost:5173` in your browser to interact with the full application.

---

## 3. Production Deployment Architecture & Environment Variables

### 3.1 Deployment Topography
1. **Frontend Client:** Deployed as a single-page application (SPA) on **Vercel** or **Netlify**. Edge routing directs all client routes (`/retailer`, `/salesman`, `/admin`) to `index.html`.
2. **Backend API:** Containerized or hosted on **Render**, **Railway**, or **AWS ECS/EC2**, binding to the designated dynamic production port.
3. **Database Layer:** Managed PostgreSQL hosted on **Supabase** with PgBouncer connection pooling enabled for high concurrency.
4. **AI Gateway:** Direct HTTPS integration with Google Gemini 1.5 Flash API via `@google/genai` with automatic fallback to localized fuzzy FMCG domain parsing on network timeouts.

---

### 3.2 Required Environment Variables (Names Only)

In strict compliance with submission safety rules, **only variable names are documented below; values are excluded**.

#### Server Environment Variables (`server/.env`)

| Variable Name | Purpose & Scope |
|---|---|
| `PORT` | Local and production HTTP listening port for Express API |
| `NODE_ENV` | Environment identifier (`development` \| `production`) |
| `CLIENT_URL` | Frontend client origin allowed by CORS middleware |
| `SUPABASE_URL` | Supabase project instance URL |
| `SUPABASE_PUBLISHABLE_KEY` | Public client key for Supabase services |
| `SUPABASE_SECRET_KEY` | Backend service-role key for administrative operations |
| `DATABASE_URL` | Transaction connection pool URL for Prisma (via PgBouncer :6543) |
| `DIRECT_URL` | Direct PostgreSQL connection string for Prisma migrations (:5432) |
| `JWT_SECRET` | Cryptographic secret for signing and validating session JWTs |
| `GEMINI_API_KEY` | Google Gemini API key for multimodal parchi parsing and NLP orders |

#### Client Environment Variables (`client/.env`)

| Variable Name | Purpose & Scope |
|---|---|
| `VITE_API_URL` | Base URL pointing to the backend API (`/api`) |
| `VITE_SUPABASE_URL` | Public Supabase project instance URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY`| Public anonymous API key for client-side storage queries |

---

## 4. Guided Walkthrough for Reviewers

To evaluate the complete end-to-end functionality in under 5 minutes, follow this sequence:

1. **Step 1: Retailer Multimodal AI Ordering (`9893000003` / `password123`)**
   - Click the **"AI Order Pad"** button in the top navigation.
   - Type or paste an unstructured Hinglish message into the text box:  
     `"bhaiya 10 peti parle g biscuit aur 5 packet surf excel 1kg bhej do kal subah tak"`
   - Click **"Process with AI"**.
   - Observe how Gemini extracts structured SKUs, computes quantities, applies the active *Buy 10 Get 1 Free* scheme (giving +1 free unit), and verifies warehouse stock.
   - Confirm and add items to the live cart, then submit the order.

2. **Step 2: Beat Salesman Offline Booking Mode (`9893000002` / `password123`)**
   - Access the salesman beat view for *Beat #4 (Lordganj & Sarafa)*.
   - Open browser DevTools (`F12`), switch to the **Network** tab, and toggle **Offline**.
   - Search for a kirana store, add 5 boxes of Maggi Noodles, and tap **"Punch Offline Order"**.
   - Notice the persistent Dexie IndexedDB sync badge: *"1 order pending sync"*.
   - Toggle the network back to **Online**; observe the automatic reconciliation and server sync using idempotent `clientOrderId`.

3. **Step 3: Distributor Admin Order Desk & Tally ERP Export (`9893000001` / `password123`)**
   - Navigate to the **Admin Order Desk**.
   - Inspect the pending orders, credit utilization indicators, and automated credit hold warnings.
   - Click **Approve** on the newly created order.
   - Click **"Export Tally CSV"** in the top action bar to download an RFC-4180 compliant CSV file formatted with exact Tally ERP accounting headers (HSN, taxable base, CGST, SGST, GSTIN).
