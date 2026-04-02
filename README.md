# Dealer ERP System

Dealer ERP is a backend-connected admin workspace for managing company master data, products, stock, routes, shops, sales, and due payments.

This repository currently contains:

- a NestJS REST API in [`backend/`](c:/Users/alvin%20monir/Desktop/deler%20erp%20system/backend)
- a Next.js admin frontend in [`frontend/`](c:/Users/alvin%20monir/Desktop/deler%20erp%20system/frontend)

For the full audited implementation breakdown, see [`PROJECT_STATUS.md`](c:/Users/alvin%20monir/Desktop/deler%20erp%20system/PROJECT_STATUS.md).

## Overview

Based on the current codebase, the app supports:

- company management
- product management
- route and shop management
- stock movement entry and stock summaries
- sales creation with multiple items
- due tracking
- due payment collection
- sales summaries and filtered sales views

The current implementation is an operational admin tool. Authentication, purchases, returns, reports/export, and migrations are not clearly implemented in this repository.

## Tech Stack

### Backend

- NestJS 11
- TypeScript
- TypeORM
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

## Implemented Backend Modules

- `Companies`
  - create, list, update, delete with uniqueness checks on company code
- `Products`
  - create, list, update, delete with company-level SKU uniqueness
- `Stock`
  - opening stock, stock-in, adjustment, movement history, current/low/zero stock summaries
- `Routes`
  - create, list, update, deactivate, list shops under route
- `Shops`
  - create, list, update, deactivate, route-linked shop management
- `Sales`
  - create sale, list sales, sale details, summaries, due overview, receive payment

## Implemented Frontend Pages

- `/`
  - dashboard with company/product/stock summary cards
- `/companies`
  - company list and create/edit form
- `/products`
  - company-wise product management with stock column
- `/products/all`
  - cross-company product list with total counter and zero-stock highlighting
- `/stock`
  - stock summary, low stock, zero stock, movement history, and stock entry forms
- `/routes`
  - route list and create/edit form
- `/shops`
  - shop list with route filter and create/edit form
- `/sales`
  - filtered sales list, due filter, search, and summary cards/tables
- `/sales/create`
  - multi-item sale creation with live totals and due validation
- `/sales/[id]`
  - sale details, payment history, and receive-due-payment form

## Implemented API Surface

Only controller-defined endpoints currently in code:

- `GET /api`
- `GET /api/health`
- `POST /api/companies`
- `GET /api/companies`
- `GET /api/companies/:id`
- `PATCH /api/companies/:id`
- `DELETE /api/companies/:id`
- `POST /api/products`
- `GET /api/products`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/stock/opening`
- `POST /api/stock/in`
- `POST /api/stock/adjustment`
- `GET /api/stock/movements`
- `GET /api/stock/summary/current`
- `GET /api/stock/summary/low-stock`
- `GET /api/stock/summary/zero-stock`
- `POST /api/routes`
- `GET /api/routes`
- `GET /api/routes/:id`
- `GET /api/routes/:id/shops`
- `PATCH /api/routes/:id`
- `PATCH /api/routes/:id/deactivate`
- `POST /api/shops`
- `GET /api/shops`
- `GET /api/shops/:id`
- `GET /api/shops/route/:routeId`
- `PATCH /api/shops/:id`
- `PATCH /api/shops/:id/deactivate`
- `POST /api/sales`
- `GET /api/sales`
- `GET /api/sales/summary/today-sales`
- `GET /api/sales/summary/today-profit`
- `GET /api/sales/summary/monthly`
- `GET /api/sales/summary/route-wise`
- `GET /api/sales/summary/company-wise`
- `GET /api/sales/summary/due-overview`
- `GET /api/sales/:id`
- `POST /api/sales/:id/payments`

## Business Rules Confirmed In Code

- company code must be unique
- product SKU must be unique within a company
- stock is derived from stock movements
- `SALE_OUT` stock movement reduces stock
- stock movement product must belong to the submitted company
- inactive company/product cannot be used for stock movement
- route name must be unique
- shop name must be unique within a route
- shop cannot be created or moved under an inactive route
- sale company, route, shop, and products are validated
- inactive company/route/shop/product cannot be used in sales
- sale checks available stock before saving
- due sale requires shop
- paid amount cannot exceed sale total
- invoice number is unique when provided
- invoice number is auto-generated when blank
- due payment cannot exceed current due amount

## Seed / Demo Data

No confirmed demo-data or seed-data script exists.

What is implemented:

- `npm run db:init`
  - creates/synchronizes schema without demo data
- `npm run db:reset`
  - drops and recreates schema without demo data

## Local Setup

### Backend

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

### Frontend

```powershell
cd frontend
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Default frontend URL:

- `http://localhost:3000`

## Environment Variables

### Backend

From [`backend/.env.example`](c:/Users/alvin%20monir/Desktop/deler%20erp%20system/backend/.env.example):

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

From [`frontend/.env.local.example`](c:/Users/alvin%20monir/Desktop/deler%20erp%20system/frontend/.env.local.example):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Current Status

### Implemented

- backend and frontend both run locally
- core CRUD for companies, products, routes, and shops
- stock movement workflow
- stock summary workflow
- sales creation
- due tracking
- due payment collection
- sales summary dashboards

### Partial / Not Clearly Implemented

- route deactivation exists in backend, but dedicated frontend action is partial
- shop deactivation exists in backend, but dedicated frontend action is partial
- company delete and product delete exist in backend, but current frontend does not expose them
- authentication is not clearly implemented
- returns are not implemented
- reports/export are not implemented
- migration-based schema management is not implemented

## Manual Testing Checklist

- [ ] create a company
- [ ] create a route
- [ ] create a shop under that route
- [ ] create a product under a company
- [ ] add opening stock
- [ ] add stock-in
- [ ] add adjustment
- [ ] verify current stock, low stock, and zero stock views
- [ ] create a fully paid sale
- [ ] create a due sale with a shop selected
- [ ] verify insufficient stock blocks invalid sale
- [ ] open the sale details page
- [ ] receive a due payment
- [ ] verify paid amount, due amount, and payment history update

## Documentation

- [`PROJECT_STATUS.md`](c:/Users/alvin%20monir/Desktop/deler%20erp%20system/PROJECT_STATUS.md)
  - full audited project status
  - controller-detected endpoints
  - entity breakdown
  - frontend/API integration notes
  - known issues and practical testing checklist
