# Billing System

A full-stack **Billing, Point of Sale (POS), and Inventory Management System** built with **React**, **TypeScript**, **Express**, **Prisma**, and **PostgreSQL**.

## Features

- **Authentication & Role-Based Access Control (RBAC)**
  - Email/password authentication with `bcryptjs` and JWT tokens
  - Google OAuth sign-in (`@react-oauth/google` & `google-auth-library`)
  - Granular module permissions (`canView`, `canCreate`, `canEdit`, `canDelete`) across roles (`Admin`, `Manager`, `Cashier`)
- **Point of Sale (POS) & Invoicing**
  - Fast POS billing interface and full invoice management
  - GST calculation (Inclusive/Exclusive), HSN codes, item & invoice discounts
  - Multi-method payments (`cash`, `upi`, `card`), partial payments, and due tracking
  - Customer loyalty points earned and redeemed per invoice
- **Products & Inventory Tracking**
  - Product catalog with SKU, barcode, unit, cost price, selling price, and minimum stock levels
  - Bulk product import
  - Inventory movement history (`SALE`, `PURCHASE`, `ADJUSTMENT`)
  - Low-stock and system notifications
- **Customers, Suppliers & Purchases**
  - Customer directory, detail views, credit limits, and customer ledgers
  - Supplier management and purchase order workflows (`Pending`, `Received`, `Cancelled`)
- **Dashboard & Analytics**
  - Interactive charts (`Recharts`), summary metrics, and role-protected reports

---

## Tech Stack

### Frontend (`client/`)
- **React 19** + **TypeScript** + **Vite**
- **React Router DOM** for client-side routing & role-protected routes
- **Axios** with JWT request/response interceptors
- **Recharts** & **Lucide React** for data visualization and icons
- **@react-oauth/google** for Google Sign-In

### Backend (`server/`)
- **Node.js** + **Express 5** + **TypeScript**
- **Prisma ORM** (`@prisma/client` with `@prisma/adapter-pg`) + **PostgreSQL**
- **JWT** (`jsonwebtoken`), **bcryptjs**, **helmet**, **cors**, **morgan**

---

## Project Structure

```text
billing-system/
├── client/                 # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI & listing components
│   │   ├── contexts/       # AuthContext & ThemeContext
│   │   ├── layouts/        # MainLayout
│   │   ├── pages/          # Auth, Dashboard, POS, Billing, Products, Inventory, Customers, Suppliers, Purchases, Reports, Users
│   │   └── utils/          # Axios API client
│   └── package.json
├── server/                 # Express + Prisma backend
│   ├── prisma/
│   │   ├── schema.prisma   # PostgreSQL database schema
│   │   └── seed-rbac.ts    # RBAC roles & permissions seed script
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middlewares/    # JWT authenticate & RBAC authorize middleware
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Auth service
│   │   ├── utils/          # Prisma client setup
│   │   ├── app.ts          # Express app configuration
│   │   └── index.ts        # Server entry point
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **PostgreSQL** database

### 1. Clone the Repository

```bash
git clone https://github.com/PatelHeliHub/billing-system.git
cd billing-system
```

### 2. Setup the Backend (`server/`)

```bash
cd server
npm install
```

Create a `.env` file inside `server/`:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/billing_db"
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="24h"
GOOGLE_CLIENT_ID="your_google_oauth_client_id" # Optional (for Google Sign-In)
```

Push the Prisma schema, generate the client, and seed RBAC roles/permissions:

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed-rbac.ts
```

Start the backend development server:

```bash
npm run dev
```

The API server runs on `http://localhost:5000` by default (health check at `GET /health`).

### 3. Setup the Frontend (`client/`)

Open a new terminal in the project root:

```bash
cd client
npm install
```

*(Optional)* Create a `.env` file inside `client/` if you want to customize the API URL or enable Google OAuth:

```env
VITE_API_URL="http://localhost:5000/api"
VITE_GOOGLE_CLIENT_ID="your_google_oauth_client_id"
```

Start the frontend development server:

```bash
npm run dev
```

---

## Available Scripts

### Client (`client/`)
- `npm run dev` — Start the Vite development server
- `npm run build` — Type-check and build for production
- `npm run lint` — Run ESLint
- `npm run preview` — Preview the production build

### Server (`server/`)
- `npm run dev` — Start the Express server in watch mode via `tsx`

---

## API Endpoints Overview

| Endpoint | Access | Description |
| :--- | :--- | :--- |
| `GET /health` | Public | Server health check |
| `/api/auth` | Public | Login, register, and Google OAuth |
| `/api/invoices` | Authenticated | Invoice CRUD & payments |
| `/api/products` | Authenticated | Product management & bulk import |
| `/api/customers` | Authenticated | Customer records & ledgers |
| `/api/inventory` | Authenticated | Stock levels & inventory movements |
| `/api/notifications` | Authenticated | Low-stock & system notifications |
| `/api/suppliers` | Authenticated | Supplier management |
| `/api/purchases` | Authenticated | Purchase orders |
| `/api/reports` | Authorized (`reports`) | Business & sales reports |
| `/api/rbac` | Authorized | Roles, permissions & user management |
