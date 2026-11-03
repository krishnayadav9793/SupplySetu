# SupplySetu
## AI-Powered B2B Ordering & Distribution Management Platform

**Project Type:** Full-Stack B2B SaaS / Distribution Management System  
**Primary Industry:** FMCG Distribution and Wholesale  
**Client Location:** Jabalpur, Madhya Pradesh, India  
**Development Timeline:** 7 Days  
**Primary Objective:** Digitize and automate the ordering workflow between FMCG distributors and retail shopkeepers using AI, real-time inventory visibility, retailer-specific pricing, and automated scheme calculations.

---

# 1. PROJECT OVERVIEW

SupplySetu is an AI-powered B2B ordering and distribution management platform designed for FMCG distributors who supply packaged food and home-care products to retail shops.

The platform connects distributors, retailers, salesmen, and the internal order management team through a centralized digital system.

Currently, many small and medium-sized distributors receive orders through WhatsApp messages, handwritten notebooks, product-list photographs, and voice notes. Their office employees manually interpret these orders and enter them into accounting or inventory software such as Tally.

This manual workflow creates several problems:

- Incorrect product identification.
- Wrong quantities and units.
- Delays in processing orders.
- Lack of real-time stock visibility.
- Retailers ordering products that are unavailable.
- Incorrect application of promotional schemes.
- Additional workload for office employees.
- Poor visibility into retailer purchasing activity.

SupplySetu addresses these problems by providing retailers with an easy-to-use digital ordering platform and distributors with an intelligent order management dashboard.

The application allows retailers to browse products, view their personalized prices, check inventory, understand promotional schemes, and place orders.

It also provides an AI-powered order capture feature that converts natural-language messages into structured shopping carts.

The distributor's order desk can review incoming orders, approve or reject them, handle credit-limit restrictions, and export approved orders into a Tally-compatible CSV format.

The system is designed to reduce manual work, minimize ordering mistakes, and improve operational efficiency.

# 2. BUSINESS PROBLEM

## 2.1 Existing Business Scenario

The client is an FMCG distributor based in Jabalpur, Madhya Pradesh.

Business details:

- Distributes products for 4 packaged food and home-care brands.
- Serves approximately 1,800 kirana shops.
- Employs approximately 70 people.
- Has 18 salesmen.
- Generates annual revenue of approximately ₹85–100 crore.

The company processes approximately 600 orders every day.

Currently, retailers communicate their orders through different channels:

1. WhatsApp text messages.
2. Photographs of handwritten product lists.
3. Hindi voice notes.
4. Orders communicated directly to salesmen.
5. Handwritten notebooks.

The office team receives these orders and manually enters them into Tally the following morning.

## 2.2 Major Problems

**Problem 1: Manual Order Processing**

Six employees are involved in manually interpreting and entering retailer orders.

**Problem 2: Incorrect Orders**

Approximately 5% of orders contain incorrect product names or quantities, resulting in returns and redelivery costs.

**Problem 3: Lack of Inventory Visibility**

Salesmen and retailers cannot reliably check product availability while placing orders.

**Problem 4: Scheme Calculation Errors**

Promotional schemes such as Buy 10 Get 1 Free and quantity-based discounts require manual calculation.

**Problem 5: Fragmented Ordering Channels**

Orders arrive through multiple WhatsApp conversations, photographs, voice messages, and notebooks.

**Problem 6: Poor Retailer Engagement**

The distributor cannot easily identify retailers who have stopped placing orders.

# 3. PROJECT OBJECTIVES

SupplySetu aims to achieve the following:

1. Provide a centralized ordering platform for all retailers.
2. Display retailer-specific product prices.
3. Show available stock before order placement.
4. Automatically calculate promotional schemes.
5. Convert unstructured text messages into structured orders using AI.
6. Allow users to review and confirm AI-generated orders.
7. Provide a centralized order management dashboard.
8. Support order approval and credit-limit checks.
9. Generate Tally-compatible CSV exports.
10. Support offline order creation for salesmen.
11. Reduce manual order entry and incorrect orders.
12. Improve retailer ordering experience.

## Business Success Metrics

The expected business targets are:

- At least 50% of orders placed through the app or captured by AI within four months.
- Reduce incorrect orders from 5% to below 1%.
- Reduce the order-entry team from six employees to three.
- Reduce order-processing delays.
- Improve stock visibility and retailer satisfaction.

# 4. TARGET USERS AND ROLES

The platform will support three user roles.

## 4.1 Retailer

The retailer is a shop owner who purchases products from the distributor.

Responsibilities and permissions:

- Log in using mobile OTP.
- Browse the product catalogue.
- Search for products.
- View retailer-specific prices.
- Check available stock.
- View active promotional schemes.
- Add products to the cart.
- Place orders.
- Repeat previous orders.
- Submit natural-language order messages to AI.
- Review AI-generated order suggestions.
- Confirm or edit order quantities.
- View order history.
- Track order status.
- View their own credit limit and outstanding credit information.

A retailer must never be able to access another retailer's prices, orders, or credit information.

## 4.2 Salesman

The salesman visits retailers and helps them place orders.

Responsibilities and permissions:

- Log in to salesman mode.
- View assigned retailers.
- Browse the product catalogue.
- Place orders on behalf of assigned retailers.
- View retailer-specific prices and schemes.
- Create orders while offline.
- Store pending orders locally.
- Synchronize orders when internet connectivity returns.
- View order synchronization status.

The salesman should not have access to unrestricted distributor administration.

## 4.3 Order Desk / Office Manager

The order desk is responsible for reviewing and processing orders.

Responsibilities and permissions:

- View incoming orders from all retailers.
- View AI-captured orders.
- Review order details.
- Approve orders.
- Reject orders with a reason.
- Handle credit-limit holds.
- Check product availability.
- View retailer information.
- Manage product inventory.
- Manage retailer-specific prices.
- Manage promotional schemes.
- Export approved orders to CSV.
- View sales and operational dashboards.
- Identify retailers who have not ordered in the last 14 days.

# 5. CORE FEATURES AND MODULES

## MODULE 1: Authentication and Role-Based Access Control

The platform will use mobile OTP-based authentication.

After authentication, users will be redirected to the appropriate dashboard based on their role.

Roles:

- RETAILER
- SALESMAN
- ORDER_DESK

Authentication workflow:

1. User enters their registered mobile number.
2. Backend generates an OTP.
3. OTP is sent through a mocked SMS service during development.
4. User enters the OTP.
5. Backend validates the OTP.
6. Backend generates access and refresh tokens.
7. User is redirected to the appropriate dashboard.

Security requirements:

- OTP expiry.
- OTP attempt limits.
- Secure token handling.
- Password-free authentication.
- Role-based API authorization.
- Server-side permission validation.

For the demo, OTP delivery can be mocked, but authentication and authorization should work.

## MODULE 2: Product Catalogue

The product catalogue is the main interface for retailers.

Each product should display:

- Product image.
- Product name.
- SKU code.
- Brand.
- Category.
- Packaging information.
- Unit type.
- Retailer-specific dealer price.
- GST inclusion/exclusion information.
- Available stock.
- Active promotional scheme.
- Quantity selector.
- Add-to-cart action.

Sample products:

Product 1:
- SKU: SKU-BS-075
- Name: Glucose biscuit 75 g
- Packaging: 96 pieces per case
- Dealer Price: ₹8.10
- Stock: 340 cases
- Scheme: Buy 10 cases, Get 1 Free.

Product 2:
- SKU: SKU-DT-1KG
- Name: Detergent powder 1 kg
- Packaging: 20 pieces per case
- Dealer Price: ₹101.50
- Stock: 85 cases
- Scheme: 3% discount on 5 or more cases.

Product 3:
- SKU: SKU-TE-250
- Name: Tea leaf 250 g
- Packaging: 40 pieces per case
- Dealer Price: ₹118.00
- Stock: 0 cases
- Scheme: No active scheme.

The catalogue must be optimized for low-end Android phones and slow 3G connections.

Important UI requirements:

- Fast loading.
- Minimal layout.
- Large touch targets.
- Clear product prices.
- Product search.
- Category filters.
- Stock availability indicators.
- Scheme badges.
- Responsive design.

Retailers must only see prices applicable to their accounts.

## MODULE 3: Shopping Cart and Order Placement

Retailers can add multiple products to a cart.

The cart should display:

- Product name.
- SKU.
- Ordered quantity.
- Unit price.
- Scheme benefits.
- Free quantity.
- Discount.
- GST.
- Total amount.

The cart must recalculate whenever quantities change.

Order placement workflow:

1. Retailer selects products.
2. Retailer enters quantities.
3. Backend validates stock.
4. Backend checks active schemes.
5. Backend calculates discounts and free goods.
6. Backend checks retailer credit limit.
7. System generates an order summary.
8. Retailer confirms the order.
9. Backend creates the order.
10. Order is submitted to the order desk.

An order should not be silently modified by the AI or frontend.

The backend is the final authority for prices, schemes, stock, and order totals.

## MODULE 4: AI-Powered Order Capture

This is one of the most important features of SupplySetu.

The objective is to convert natural-language messages into structured order data.

Retailers frequently send messages such as:

"bhaiya 5 peti biscuit chhota, 2 peti washing powder 1 kilo, chai patti 250 wala 1 peti"

Manually interpreting such messages takes time and creates mistakes.

SupplySetu uses an LLM-based AI service to understand the message and identify the corresponding products from the distributor's SKU catalogue.

### AI Workflow

Step 1: Retailer enters or pastes a natural-language message.

Step 2: Frontend sends the message to the backend AI order capture endpoint.

Step 3: Backend retrieves the relevant product catalogue and retailer order history.

Step 4: AI identifies product names, packaging information, and requested quantities.

Step 5: AI returns structured JSON.

Step 6: Backend validates the returned SKU codes against the database.

Step 7: Backend checks units, product availability, and retailer-specific prices.

Step 8: Frontend displays a review screen.

Step 9: Retailer edits or confirms the generated order.

Step 10: Only after confirmation is an actual order created.

### Expected AI Output

For the sample message:

{
  "items": [
    {
      "sku": "SKU-BS-075",
      "productName": "Glucose biscuit 75 g",
      "quantity": 5,
      "unit": "CASE",
      "confidence": 0.98,
      "alternatives": []
    },
    {
      "sku": "SKU-DT-1KG",
      "productName": "Detergent powder 1 kg",
      "quantity": 2,
      "unit": "CASE",
      "confidence": 0.96,
      "alternatives": []
    },
    {
      "sku": "SKU-TE-250",
      "productName": "Tea leaf 250 g",
      "quantity": 1,
      "unit": "CASE",
      "confidence": 0.95,
      "alternatives": []
    }
  ]
}

This is an illustrative response. The actual AI output must be validated before use.

### AI Features

1. Natural-language understanding.
2. Product-to-SKU mapping.
3. Quantity extraction.
4. Packaging and unit identification.
5. Confidence score generation.
6. Alternative product suggestions.
7. Detection of ambiguous product descriptions.
8. Contextual matching using retailer purchase history.

### Important AI Safety Rules

- AI must never invent a SKU.
- AI must never invent a price.
- AI must never assume an unclear unit.
- AI must not automatically place an order.
- AI must not claim that an unavailable product is available.
- Low-confidence matches must require manual confirmation.
- Out-of-stock products must be clearly flagged.
- Original retailer messages must remain visible during review.

If the AI is uncertain, it should request clarification instead of guessing.

### Human-in-the-Loop System

Every AI-generated order must pass through human confirmation.

The review interface should show:

- Original message.
- Detected product.
- Matched SKU.
- Quantity.
- Unit.
- Confidence score.
- Alternative SKU suggestions.
- Stock availability.
- Editable quantity.

When the order desk corrects an AI-generated mapping, the correction can be saved as a retailer-specific product alias.

For example:

Retailer uses "chhota biscuit" for SKU-BS-075.

The system can store this as a retailer-specific alias for future matching.

## MODULE 5: Promotional Scheme Engine

The scheme engine is a deterministic backend business-logic module.

AI must not calculate or apply promotional discounts.

The backend must calculate schemes using predefined rules stored in the database.

### Supported Schemes

1. Buy X Get Y Free.
2. Percentage discount on a minimum quantity.
3. Fixed discount.
4. Quantity slab discount.

### Example 1: Buy 10 Get 1 Free

Product:
Glucose biscuit 75 g.

Scheme:
Buy 10 cases and receive 1 free case.

Retailer orders 10 cases.

Calculation:

- Paid quantity = 10.
- Free quantity = 1.
- Total dispatch quantity = 11.
- Amount charged = 10 × ₹8.10 = ₹81.00.

### Example 2: Slab Discount

Product:
Detergent powder 1 kg.

Scheme:
3% discount for 5 or more cases.

Retailer orders 6 cases.

Calculation:

Base amount:

6 × ₹101.50 = ₹609.00.

Discount:

₹609 × 3% = ₹18.27.

Final amount:

₹609 - ₹18.27 = ₹590.73.

### Scheme Engine Responsibilities

- Fetch active schemes.
- Check scheme validity.
- Verify minimum quantities.
- Calculate free goods.
- Calculate discounts.
- Handle scheme expiry.
- Avoid applying the same scheme twice.
- Return a detailed calculation breakdown.

All scheme calculations must be performed server-side.

The system must clearly distinguish between paid quantity and free quantity.

## MODULE 6: Order Management Dashboard

The order desk is the central operational interface.

It displays all retailer orders in one place.

Dashboard information:

- Total orders.
- Pending orders.
- Approved orders.
- Rejected orders.
- Orders on credit hold.
- Total order value.
- Orders requiring manual review.

Order statuses:

- DRAFT
- PENDING_REVIEW
- CREDIT_HOLD
- APPROVED
- REJECTED
- EXPORTED
- CANCELLED

Order management workflow:

1. New orders appear in the dashboard.
2. Order desk opens an order.
3. The system displays retailer details.
4. The system displays product lines and calculations.
5. The system validates stock and credit restrictions.
6. Manager approves or rejects the order.
7. Approved orders become eligible for Tally export.

Rejection must require a reason.

Important: An order should not be approved merely because AI extracted its contents successfully.

## MODULE 7: Retailer Credit Management

Each retailer has a credit limit.

Example:

Retailer credit limit: ₹50,000.

Current outstanding: ₹40,000.

New order value: ₹15,000.

Projected outstanding:

₹40,000 + ₹15,000 = ₹55,000.

Since the projected outstanding exceeds the credit limit, the system must place the order on CREDIT_HOLD.

The order desk can review and resolve the hold.

Credit calculations must be deterministic and backend-controlled.

## MODULE 8: Inventory Management

The distributor can manage product stock.

Each product contains:

- SKU.
- Product name.
- Brand.
- Category.
- Packaging.
- Current stock.
- Reserved stock.
- Available stock.
- Dealer price.
- GST configuration.

Available stock:

Available Stock = Current Stock - Reserved Stock.

The backend must validate stock before accepting or approving orders.

Stock must not become negative.

For the initial demo, inventory can be seeded from sample data and managed through an admin interface.

## MODULE 9: Tally-Compatible CSV Export

The application must provide a CSV export for approved orders.

The export should contain:

- Order ID.
- Order date.
- Retailer name.
- Retailer code.
- SKU.
- Product name.
- Quantity.
- Free quantity.
- Rate.
- Discount.
- GST.
- Taxable amount.
- Final amount.

Only approved orders should be exported.

The export must have a consistent format that can be mapped to the client's Tally import process.

The first version should provide a downloadable CSV file rather than attempting direct integration with Tally.

Exported orders must be marked as EXPORTED to prevent accidental duplicate exports.

# 6. APPLICATION SCREENS

The application will contain approximately eight primary screens.

## Screen 1: Authentication

Purpose:
Allow retailers, salesmen, and order desk users to log in.

Elements:
- Mobile number input.
- OTP input.
- Continue button.
- Authentication status.

## Screen 2: Retailer Product Catalogue

Purpose:
Display available products and personalized pricing.

Elements:
- Search bar.
- Category filters.
- Product cards.
- Product images.
- Product prices.
- Stock availability.
- Promotional scheme information.
- Quantity selector.
- Add-to-cart button.

## Screen 3: Cart and Checkout

Purpose:
Review and submit an order.

Elements:
- Selected products.
- Quantities.
- Paid quantities.
- Free quantities.
- Discount breakdown.
- GST breakdown.
- Total amount.
- Credit information.
- Confirm order button.

## Screen 4: AI Order Capture

Purpose:
Convert natural-language messages into structured orders.

Elements:
- Message input.
- Generate order button.
- AI processing state.
- Original message.
- Product matches.
- Confidence levels.
- Alternative products.
- Unit clarification.
- Stock warnings.
- Confirm order button.

## Screen 5: My Orders

Purpose:
Allow retailers to track their previous orders.

Elements:
- Order ID.
- Order date.
- Order amount.
- Order status.
- Product summary.
- Order details.

## Screen 6: Order Desk

Purpose:
Allow office employees to process incoming orders.

Elements:
- Order summary cards.
- Order table.
- Search and filters.
- Pending review.
- Credit holds.
- Approve button.
- Reject button.
- Order detail view.

## Screen 7: Retailer, Inventory and Scheme Management

Purpose:
Provide administrative control over business data.

Elements:
- Retailer list.
- Retailer-specific prices.
- Credit limits.
- Product inventory.
- Stock updates.
- Scheme creation.
- Scheme expiry dates.
- Scheme activation and deactivation.

## Screen 8: Analytics and Tally Export

Purpose:
Provide operational insights and accounting exports.

Elements:
- Total orders.
- Total order value.
- Approved orders.
- Pending orders.
- Rejected orders.
- Retailers inactive for 14 days.
- CSV export.
- Export history.

# 7. TECHNOLOGY STACK

The application will use a modern full-stack JavaScript/TypeScript architecture.

## Frontend

**React.js + TypeScript + Vite**

Responsibilities:

- Build the retailer interface.
- Build the order desk.
- Manage application state.
- Communicate with backend APIs.
- Display AI-generated suggestions.
- Manage cart calculations for previews.
- Provide responsive layouts.

**Tailwind CSS**

Used for:
- Styling.
- Responsive design.
- Layouts.
- Spacing.
- Typography.
- Consistent design system.

**shadcn/ui**

Used for:
- Dialogs.
- Tables.
- Forms.
- Dropdown menus.
- Toast notifications.
- Tabs.
- Cards.

**Zustand**

Used for:
- Authentication state.
- Cart state.
- Current retailer context.
- UI preferences.

**TanStack Query**

Used for:
- API requests.
- Server-state caching.
- Loading and error handling.
- Query invalidation.

**Dexie.js + IndexedDB**

Used for:
- Offline order storage.
- Pending synchronization queue.
- Local order drafts.
- Retry information.

## Backend

**Node.js + Express.js + TypeScript**

Responsibilities:

- Authentication.
- Authorization.
- Retailer management.
- Product management.
- Inventory.
- Pricing.
- Scheme engine.
- Cart validation.
- Order creation.
- AI integration.
- Order approval.
- Credit checks.
- CSV exports.
- Offline synchronization.

**Prisma ORM**

Used for:
- Database models.
- Queries.
- Relationships.
- Migrations.
- Type-safe database access.

**PostgreSQL**

Stores:
- Users.
- Retailers.
- Salesmen.
- Products.
- SKUs.
- Prices.
- Schemes.
- Orders.
- Order items.
- Inventory.
- Credit records.
- AI aliases.
- Audit logs.

**Zod**

Used for:
- Request validation.
- API input validation.
- AI response validation.
- Order data validation.

## AI Integration

Use either the Gemini API or OpenAI API.

AI responsibilities:

- Understand natural-language retailer messages.
- Identify products.
- Match product descriptions with SKUs.
- Extract quantities.
- Identify ambiguous units.
- Return structured JSON.
- Suggest alternative product matches.

The AI provider should be accessed through a dedicated backend service so that the provider can be changed without rewriting the order workflow.

## Deployment

Frontend:
Vercel.

Backend:
Render.

Database:
Neon PostgreSQL or Supabase PostgreSQL.

Environment variables must be stored securely in deployment settings.

Never expose API keys in frontend code.

# 8. SYSTEM ARCHITECTURE

The application follows a modular monolithic architecture.

The architecture consists of:

1. Frontend application.
2. Backend REST API.
3. Authentication and authorization layer.
4. Business logic services.
5. AI integration service.
6. PostgreSQL database.
7. Offline synchronization layer.
8. External system adapters.

### Architecture Flow

Retailer / Salesman / Order Desk

↓

React Progressive Web Application

↓

Express REST API

↓

Authentication and Authorization Middleware

↓

Business Logic Services

- Product Service.
- Pricing Service.
- Scheme Service.
- Inventory Service.
- Order Service.
- Credit Service.
- AI Order Capture Service.
- Export Service.
- Sync Service.

↓

Prisma ORM

↓

PostgreSQL Database

The AI service communicates with an external LLM provider through the backend.

All final business decisions remain in backend services.

# 9. DATABASE DESIGN

The database should be relational and normalized.

Recommended entities:

## User

- id
- name
- phone
- role
- isActive
- createdAt
- updatedAt

## Retailer

- id
- userId
- retailerCode
- shopName
- address
- pincode
- creditLimit
- outstandingAmount
- assignedSalesmanId
- createdAt

## Salesman

- id
- userId
- employeeCode
- createdAt

## Product

- id
- sku
- name
- description
- brand
- category
- packaging
- unitsPerCase
- imageUrl
- gstRate
- isActive

## RetailerPrice

- id
- retailerId
- productId
- dealerPrice
- gstInclusive
- effectiveFrom
- effectiveTo

## Inventory

- id
- productId
- currentStock
- reservedStock
- updatedAt

## Scheme

- id
- name
- schemeType
- productId
- minimumQuantity
- freeQuantity
- discountPercentage
- fixedDiscount
- startDate
- endDate
- isActive

## Order

- id
- orderNumber
- retailerId
- createdBy
- source
- status
- subtotal
- discount
- gstAmount
- totalAmount
- createdAt
- updatedAt

## OrderItem

- id
- orderId
- productId
- sku
- quantity
- freeQuantity
- unitPrice
- discount
- gstAmount
- finalAmount

## AIOrderCapture

- id
- retailerId
- originalMessage
- extractedData
- status
- createdAt

## ProductAlias

- id
- retailerId
- productId
- alias
- createdAt

## OfflineSyncLog

- id
- deviceId
- idempotencyKey
- localOrderId
- serverOrderId
- syncStatus
- syncedAt

## OrderAuditLog

- id
- orderId
- actorId
- action
- previousStatus
- newStatus
- reason
- createdAt

Additional tables can be introduced for credit transactions, stock movements, export batches, salesman assignments, and scheme applicability as implementation expands.

Database rules:

- Use UUID primary keys.
- Use unique SKU constraints.
- Use unique order numbers.
- Use decimal types for monetary amounts.
- Use database transactions for order creation.
- Use foreign keys.
- Store timestamps consistently.
- Use appropriate indexes for frequently queried columns.

# 10. BACKEND API DESIGN

All APIs should follow a consistent REST structure.

Base URL:

/api/v1

## Authentication

POST /auth/send-otp

POST /auth/verify-otp

POST /auth/refresh

POST /auth/logout

## Products

GET /products

GET /products/:id

GET /products/search

GET /products/stock

## Retailers

GET /retailers

GET /retailers/:id

GET /retailers/:id/prices

GET /retailers/:id/orders

GET /retailers/:id/credit

## Cart and Orders

POST /orders/preview

POST /orders

GET /orders

GET /orders/:id

PATCH /orders/:id/cancel

## AI Order Capture

POST /ai/order-capture

POST /ai/order-capture/:id/confirm

POST /ai/order-capture/:id/corrections

## Order Desk

GET /admin/orders

PATCH /admin/orders/:id/approve

PATCH /admin/orders/:id/reject

GET /admin/orders/pending

GET /admin/orders/credit-hold

## Inventory

GET /admin/inventory

PATCH /admin/inventory/:id

## Schemes

GET /schemes

POST /admin/schemes

PATCH /admin/schemes/:id

DELETE /admin/schemes/:id

## Tally Export

POST /admin/exports/tally

GET /admin/exports

GET /admin/exports/:id/download

## Offline Synchronization

POST /sync/orders

GET /sync/status

These endpoints are the proposed API contract. Exact request and response schemas must be defined and validated during implementation.

# 11. OFFLINE-FIRST SALESMAN MODE

The client requires salesmen to create orders even when there is no internet connectivity.

The application should implement a basic offline-first workflow.

### Offline Workflow

1. Salesman opens the application while connected.
2. Required product catalogue and assigned retailer data are cached.
3. Salesman loses network connectivity.
4. Salesman selects a retailer.
5. Salesman creates an order.
6. Order is saved locally in IndexedDB.
7. Order status becomes PENDING_SYNC.
8. When connectivity returns, the application submits pending orders to the backend.
9. Backend validates the order.
10. Backend acknowledges successful synchronization.
11. Local order is marked SYNCED.

### Important Technical Details

- Use IndexedDB through Dexie.
- Use unique idempotency keys.
- Never rely only on frontend connectivity checks.
- Retry failed requests.
- Preserve original local timestamps.
- Record server receipt timestamps separately.
- Prevent duplicate orders.
- Revalidate prices, stock, and schemes on the server.

An offline order is a pending submission, not a guaranteed reservation of stock or a final approved order.

If pricing or stock changes before synchronization, the application should show the difference and request confirmation where necessary.

# 12. UI/UX DESIGN SYSTEM

The client strongly prefers minimal, professional, clean interfaces.

The design should prioritize speed, clarity, and usability.

## Design Principles

1. Minimal interface.
2. White space.
3. Clear typography.
4. Restrained colour palette.
5. Large touch targets.
6. Clear visual hierarchy.
7. Fast navigation.
8. Mobile-first responsive design.
9. No unnecessary animations.
10. No decorative elements without purpose.

## Suggested Colour Palette

Primary: Deep Navy Blue.

Secondary: Slate Grey.

Accent: Teal or Emerald.

Background: Soft Off-White.

Success: Green.

Warning: Amber.

Error: Red.

## Typography

Use Inter or Geist.

Typography should be consistent across headings, body text, tables, and product cards.

## Retailer Experience

Retailers order between customers.

Therefore:

- Product names must be readable.
- Prices must be prominent.
- Stock must be immediately visible.
- Scheme benefits must be understandable.
- Cart actions must require minimal interaction.
- Checkout must be straightforward.

## Order Desk Experience

The order desk should prioritize operational clarity.

- Compact but readable tables.
- Clear status indicators.
- Fast filters.
- Search by retailer or order number.
- Clear approval and rejection actions.
- Detailed order breakdown.

The interface should not overload the user with unnecessary information.

# 13. SECURITY AND DATA PROTECTION

The application must implement basic production-quality security practices.

Requirements:

- Secure authentication.
- Role-based authorization.
- Server-side ownership checks.
- Input validation.
- Rate limiting.
- CORS configuration.
- Secure HTTP headers.
- Protection against unauthorized data access.
- Environment-based secret management.
- Audit logging.
- Database constraints.
- Safe error handling.

Retailer-specific pricing and credit information must never be exposed to other retailers.

The AI provider must receive only the data needed for order interpretation.

API keys must never be included in frontend bundles.

# 14. IMPLEMENTATION ROADMAP

The project will be developed in seven days.

## PHASE 1: Project Initialization and Architecture

Day 1.

Tasks:

- Create frontend project using React, TypeScript, and Vite.
- Create backend project using Node.js, Express, and TypeScript.
- Configure Tailwind CSS.
- Configure PostgreSQL.
- Configure Prisma.
- Create database schema.
- Add seed data.
- Implement authentication.
- Implement role-based authorization.
- Create basic layouts.

Expected outcome:

A working application foundation with database connectivity and authenticated user roles.

## PHASE 2: Product Catalogue and Retailer Management

Day 2.

Tasks:

- Implement product APIs.
- Implement retailer APIs.
- Implement personalized pricing.
- Implement product search.
- Build product catalogue UI.
- Build product cards.
- Display stock.
- Display active schemes.
- Implement cart state.

Expected outcome:

Retailers can log in and browse their product catalogue.

## PHASE 3: Cart and Scheme Engine

Day 3.

Tasks:

- Implement cart functionality.
- Implement scheme database models.
- Build Buy X Get Y Free logic.
- Build percentage discount logic.
- Calculate GST.
- Validate inventory.
- Implement credit checks.
- Create order preview endpoint.
- Test calculation edge cases.

Expected outcome:

A working cart with accurate backend-generated pricing and promotional benefits.

## PHASE 4: AI Order Capture

Day 4.

Tasks:

- Configure AI API.
- Create AI order capture service.
- Design structured prompts.
- Fetch relevant product catalogue.
- Match natural-language descriptions to SKUs.
- Extract quantities and units.
- Validate AI output using Zod.
- Display confidence and alternatives.
- Build human confirmation interface.

Expected outcome:

Retailers can convert natural-language messages into editable order suggestions.

## PHASE 5: Order Desk and Order Lifecycle

Day 5.

Tasks:

- Build order management APIs.
- Build order desk dashboard.
- Display incoming orders.
- Implement order approval.
- Implement rejection.
- Implement credit holds.
- Implement order history.
- Implement audit logs.

Expected outcome:

The office team can manage the complete order approval workflow.

## PHASE 6: Offline Mode and Tally Export

Day 6.

Tasks:

- Configure Dexie and IndexedDB.
- Cache catalogue information.
- Create offline order queue.
- Implement synchronization.
- Implement idempotency protection.
- Build CSV export.
- Implement export history.
- Test duplicate submission scenarios.

Expected outcome:

Salesmen can create offline orders and the order desk can export approved orders.

## PHASE 7: Testing, Deployment and Final Polish

Day 7.

Tasks:

- Test authentication.
- Test authorization.
- Test order calculations.
- Test promotional schemes.
- Test AI extraction.
- Test stock validation.
- Test credit holds.
- Test offline synchronization.
- Test CSV exports.
- Fix bugs.
- Improve mobile responsiveness.
- Deploy frontend.
- Deploy backend.
- Configure production database.
- Prepare demonstration data.
- Write README documentation.

Expected outcome:

A deployed and demonstrable end-to-end application.

# 15. TESTING STRATEGY

Testing should cover the complete business workflow.

## Authentication Tests

- Valid OTP.
- Invalid OTP.
- Expired OTP.
- Unauthorized access.
- Incorrect role access.

## Catalogue Tests

- Product search.
- Stock availability.
- Retailer-specific pricing.
- Inactive product handling.

## Scheme Tests

- Buy 10 Get 1 Free.
- Quantity below minimum.
- Quantity exactly at minimum.
- Quantity above minimum.
- Expired schemes.
- Multiple scheme applicability.

## AI Tests

- Correct product identification.
- Incorrect product identification.
- Ambiguous product name.
- Missing quantity.
- Unclear packaging.
- Unknown SKU.
- Out-of-stock product.
- Malformed AI response.

## Order Tests

- Successful order creation.
- Insufficient stock.
- Credit limit exceeded.
- Duplicate submission.
- Order approval.
- Order rejection.
- Invalid order status transition.

## Offline Tests

- Order created without network.
- Pending order retained locally.
- Successful synchronization.
- Duplicate synchronization request.
- Failed synchronization and retry.
- Price changed before synchronization.

## Export Tests

- Only approved orders exported.
- Correct quantities.
- Correct prices.
- Correct discounts.
- Correct GST.
- No accidental duplicate export.

# 16. SAMPLE END-TO-END USER JOURNEY

This is the main demonstration scenario for SupplySetu.

### Step 1: Retailer Login

A retailer opens SupplySetu and logs in using their mobile OTP.

The system identifies the retailer and loads their personalized account.

### Step 2: Product Catalogue

The retailer sees:

- Glucose biscuit: ₹8.10.
- Detergent powder: ₹101.50.
- Tea leaf: ₹118.00.

The retailer can also see stock and applicable schemes.

### Step 3: AI Order Capture

Instead of manually searching for products, the retailer pastes:

"bhaiya 5 peti biscuit chhota, 2 peti washing powder 1 kilo, chai patti 250 wala 1 peti"

### Step 4: AI Processing

The AI identifies three product descriptions and maps them to the appropriate SKUs.

The backend validates the returned information.

### Step 5: Order Review

The retailer sees the extracted products and quantities.

The tea leaf is flagged because its stock is zero.

The retailer can edit the quantities or remove the unavailable product.

### Step 6: Scheme Calculation

The retailer adds 10 cases of glucose biscuits.

The system applies Buy 10 Get 1 Free.

The retailer adds 6 cases of detergent.

The system applies the 3% discount.

### Step 7: Order Confirmation

The retailer reviews the complete order summary and confirms.

The backend revalidates stock, prices, schemes, and credit limits.

### Step 8: Order Desk

The order appears in the office dashboard.

The manager reviews the order and approves it.

### Step 9: Tally Export

The approved order becomes eligible for CSV export.

The office downloads the Tally-compatible file.

This completes the primary business workflow.

# 17. EXTERNAL INTEGRATIONS AND MOCKING

The first version should avoid spending time on complex third-party integrations.

The following systems can be mocked:

- OTP delivery.
- SMS notifications.
- WhatsApp messages.
- Tally integration.
- Payment systems.
- External inventory systems.

However, the internal application workflows must work.

For example:

- OTP verification must actually validate an OTP.
- Order creation must actually save to PostgreSQL.
- AI extraction must actually call an AI model.
- Scheme calculations must execute real backend logic.
- Approval must update order status.
- CSV export must generate an actual downloadable file.

Mocking external delivery is different from mocking the entire feature.

# 18. PROJECT SCOPE AND PRIORITIES

## P0: Essential Features

These must be completed.

- Authentication and role-based access.
- Product catalogue.
- Retailer-specific pricing.
- Stock visibility.
- Cart.
- Order placement.
- Scheme engine.
- AI text order capture.
- Human confirmation.
- Order desk.
- Order approval and rejection.
- Credit holds.
- Tally-compatible CSV export.

## P1: Important Additional Features

Implement if the essential workflow is stable.

- Offline salesman order creation.
- Order synchronization.
- Retailer order history.
- Retailer management.
- Inventory management.
- Dashboard analytics.
- Inactive retailer detection.

## P2: Future Enhancements

These are not required for the first demonstration.

- WhatsApp Business API.
- Photo-based order extraction.
- Hindi voice-note transcription.
- Advanced sales forecasting.
- Automated stock replenishment.
- Advanced retailer recommendations.
- Direct Tally integration.
- Delivery tracking.
- Payment gateway integration.

# 19. DEVELOPMENT PRINCIPLES

The following principles must be followed throughout implementation.

1. Use TypeScript across frontend and backend.
2. Follow modular architecture.
3. Keep business logic out of React components.
4. Keep database queries out of route handlers.
5. Use service-layer architecture.
6. Validate all incoming requests.
7. Perform all critical calculations on the backend.
8. Use database transactions for order operations.
9. Never trust AI-generated product IDs or prices.
10. Implement role-based authorization on every protected endpoint.
11. Keep reusable UI components.
12. Use meaningful naming conventions.
13. Maintain a consistent API response structure.
14. Add loading, empty, success, and error states.
15. Write tests for important business logic.
16. Keep secrets in environment variables.
17. Optimize for low-end mobile devices.
18. Do not over-engineer the seven-day implementation.

# 20. FINAL PROJECT VISION

SupplySetu is not simply an e-commerce application.

It is an intelligent B2B distribution platform that digitizes the complete ordering interaction between retailers and distributors.

It combines:

- B2B commerce.
- AI-powered natural-language order understanding.
- Product catalogue management.
- Retailer-specific pricing.
- Automated promotional schemes.
- Inventory validation.
- Credit management.
- Order processing.
- Offline order synchronization.
- Accounting export.

The primary value of SupplySetu is that retailers can continue ordering in their familiar conversational style while the distributor receives structured, validated, and manageable orders.

The AI handles unstructured language.

The backend handles business rules.

The database maintains consistent business records.

The order desk retains final control over order approval.

The result is a practical, scalable, and intelligent distribution management solution.

**Product Name:** SupplySetu

**Tagline:** From WhatsApp Orders to Intelligent Distribution.

**Core Value Proposition:** Turn unstructured retailer orders into accurate, structured, and actionable business orders through AI-powered automation.

**Development Goal:** Deliver a polished, functional, end-to-end MVP within seven days using modern full-stack technologies and AI-assisted development.