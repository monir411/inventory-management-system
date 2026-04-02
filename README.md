# Dealer ERP System

Dealer ERP is a backend-connected admin workspace for managing companies, products, stock, routes, shops, sales, due balances, and payment collection.

This repository contains:

- a NestJS REST API in `backend/`
- a Next.js admin frontend in `frontend/`

For a deeper audit-style breakdown of the codebase, see `PROJECT_STATUS.md`.

## Current Product Snapshot

The project currently works as an operations-first ERP/admin tool with these active workflows:

- company management
- product management
- route and shop management
- stock movement recording
- live stock summary, low-stock, and zero-stock monitoring
- sales creation with multiple items
- due sales tracking
- due payment collection
- sales summary and due summary dashboards

It does not currently implement a full auth system, purchase flow, return workflow, export/reporting suite, or migration-based schema history.

The backend now also includes a repeatable demo seed script so the UI can be populated quickly after a reset.

## Recent Frontend Work

The frontend has been pushed well beyond basic CRUD and now includes:

- a merged stock workspace where current stock, low stock, zero stock, and movement history all live on `/stock`
- a legacy `/stock/movements` route that redirects into the merged stock workspace
- premium stock UI with a command-center hero, upgraded filter cockpit, polished summary cards, richer desktop/mobile stock views, and better empty states
- stock quick-action popups for `Add Opening Stock`, `Add Stock In`, and `Add Adjustment`
- smart stock keyword matching that can auto-select the strongest company and product match
- sales list server-side pagination with 10 rows per page
- a smarter Create Sale flow with advanced product search, global product matching, company/product auto-selection, and live totals
- sale detail and shop due detail views for receiving and reviewing payments

## Tech Stack

### Backend

- NestJS 11
- TypeScript
- TypeORM 0.3
- PostgreSQL
- class-validator
- class-transformer
- Joi

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4

## Project Structure

```text
.
|-- backend/
|   |-- src/
|   |   |-- common/
|   |   |-- config/
|   |   |-- database/
|   |   |-- health/
|   |   `-- modules/
|   |       |-- companies/
|   |       |-- products/
|   |       |-- routes/
|   |       |-- sales/
|   |       |-- shops/
|   |       `-- stock/
|   |-- .env
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- app/
|   |   |-- companies/
|   |   |-- products/
|   |   |   `-- all/
|   |   |-- routes/
|   |   |-- sales/
|   |   |   |-- create/
|   |   |   |-- shops/
|   |   |   `-- [id]/
|   |   |-- shops/
|   |   `-- stock/
|   |-- components/
|   |-- lib/
|   |-- types/
|   |-- .env.local.example
|   `-- package.json
|-- PROJECT_STATUS.md
`-- README.md
```

## Frontend Pages

### Dashboard

- `/`
- summary cards for companies, products, sales, profit, and quick links into the main workflows

### Companies

- `/companies`
- create, edit, view, and search companies

### Products

- `/products`
- company-wise product management
- `/products/all`
- cross-company product list with stock-aware visibility

### Routes and Shops

- `/routes`
- route management
- `/shops`
- shop management with route linking

### Stock Workspace

- `/stock`
- merged stock and movement workspace
- current stock summary
- low stock products
- zero stock products
- movement history
- company/product/type/date filters
- premium filter cockpit and premium stock summary UI
- popup-based stock actions for opening stock, stock-in, and adjustment

### Sales

- `/sales`
- sales summary dashboard
- paginated sales list
- route-wise, company-wise, shop-wise, and due summaries
- `/sales/create`
- multi-item sale creation with advanced product search and live calculations
- `/sales/[id]`
- sale details and due payment collection
- `/sales/shops/[id]`
- shop-level due details and payment history

## Backend Modules

### Companies

- create, list, fetch, update, and delete companies
- enforces unique company code

### Products

- create, list, fetch, update, and delete products
- supports company-level filtering and search
- enforces SKU uniqueness within a company

### Routes

- create, list, fetch, update, and deactivate routes
- list shops under a route

### Shops

- create, list, fetch, update, and deactivate shops
- supports route-linked filtering

### Stock

- add opening stock
- add stock-in
- add adjustment
- list stock movements
- calculate current stock summary
- calculate low-stock products
- calculate zero-stock products

### Sales

- create multi-item sales
- list sales with filters and pagination
- fetch sale details
- sales summaries by date, route, company, and due
- receive sale payments

## Key Business Rules Already Implemented

- company code must be unique
- product SKU must be unique inside a company
- stock is derived from stock movements
- stock movement product must belong to the submitted company
- inactive company or product cannot be used for stock movement
- route name must be unique
- shop name must be unique within a route
- inactive route cannot receive new or moved shops
- sales validate company, route, shop, and products
- inactive company, route, shop, or product cannot be used in sales
- sale creation checks available stock before saving
- due sale requires a shop
- paid amount cannot exceed sale total
- invoice number is unique when manually supplied
- invoice number is auto-generated when left blank
- due payment cannot exceed current due amount

## Local Setup

### 1. Backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run db:init
npm run start:dev
```

Default backend URLs:

- app: `http://localhost:3001`
- API: `http://localhost:3001/api`

### 2. Frontend

```powershell
cd frontend
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Default frontend URL:

- `http://localhost:3000`

## Database Lifecycle

This project currently uses TypeORM schema synchronization instead of migration files.

### Initialize schema

```powershell
cd backend
npm run db:init
```

What it does:

- synchronizes tables
- does not drop the schema
- does not load demo data

### Reset database

```powershell
cd backend
npm run db:reset
```

What it does:

- drops the existing schema
- recreates the schema
- leaves the database empty
- does not load demo data

### Seed demo data

```powershell
cd backend
npm run db:seed
```

What it does:

- synchronizes tables if needed
- creates demo companies, products, routes, and shops
- creates opening stock, stock-in, and adjustment entries
- creates demo sales, due balances, and follow-up payments
- is designed to populate `/stock`, `/sales`, `/sales/create`, and shop due pages with realistic sample data
- keeps existing records and adds any missing demo records when possible

## Environment Variables

### Backend

`backend/.env.example`

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://username:password@ep-example.us-east-2.aws.neon.tech/dealer_erp?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:3000

DB_SYNCHRONIZE=false
DB_DROP_SCHEMA=false
```

### Frontend

`frontend/.env.local.example`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Useful Scripts

### Backend

```powershell
npm run start:dev
npm run build
npm run lint
npm run test
npm run db:init
npm run db:reset
npm run db:seed
```

### Frontend

```powershell
npm run dev
npm run build
npm run lint
```

## API Overview

Base URL:

- `http://localhost:3001/api`

Main API groups:

- `/companies`
- `/products`
- `/routes`
- `/shops`
- `/stock`
- `/sales`
- `/health`

Notable stock endpoints:

- `POST /api/stock/opening`
- `POST /api/stock/in`
- `POST /api/stock/adjustment`
- `GET /api/stock/movements`
- `GET /api/stock/summary/current`
- `GET /api/stock/summary/low-stock`
- `GET /api/stock/summary/zero-stock`

Notable sales endpoints:

- `POST /api/sales`
- `GET /api/sales`
- `GET /api/sales/:id`
- `POST /api/sales/:id/payments`
- `GET /api/sales/summary/today-sales`
- `GET /api/sales/summary/today-profit`
- `GET /api/sales/summary/monthly`
- `GET /api/sales/summary/route-wise`
- `GET /api/sales/summary/company-wise`
- `GET /api/sales/summary/due-overview`

## Current Verification Status

The current codebase has recently been verified with:

- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `backend`: `npm run build`
- `backend`: `npm run db:reset`
- `backend`: `npm run db:seed`

## Known Gaps

These areas are still outside the confirmed current implementation:

- authentication and user roles
- purchase workflow
- return workflow
- CSV/export/reporting
- migration-driven schema history

## Manual Smoke Test

- run `npm run db:reset`
- run `npm run db:seed`
- create a company
- create a route
- create a shop
- create products under a company
- open `/stock`
- add opening stock from the popup
- add stock-in from the popup
- add an adjustment from the popup
- verify current stock, low stock, zero stock, and movement history
- create a full paid sale
- create a due sale
- open sale details and receive a payment
- open shop due details and verify due/payment history

## Additional Documentation

- `PROJECT_STATUS.md`
  - detailed audit of modules, entities, routes, and current project status
