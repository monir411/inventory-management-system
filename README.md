# Dealer ERP System

Dealer ERP is currently a backend-connected admin workspace for managing master data, inventory movements, sales, due balances, and payment collection.

The repository contains:

- a NestJS REST API in `backend/`
- a Next.js admin frontend in `frontend/`

The codebase already supports a real end-to-end operational flow:

1. create companies
2. create products under a company
3. create routes
4. create shops under a route
5. add opening stock, stock-in, and adjustments
6. create sales
7. reduce stock automatically through `SALE_OUT` movements
8. track dues and receive follow-up payments

It is not yet a full dealer-scoped ERP. The current implementation behaves more like a central admin workspace than a dealer-level, route-restricted system.

## Current Project Status

| Area | Current status |
| --- | --- |
| Backend API | Implemented for health, companies, products, routes, shops, stock, and sales |
| Frontend admin UI | Implemented for dashboard, companies, products, routes, shops, stock, and sales workflows |
| Inventory workflow | Implemented through stock movements and computed stock summaries |
| Sales workflow | Implemented with multi-item sales, due handling, and payment collection |
| Demo seed data | Implemented through `backend/src/database/seed.ts` |
| Authentication / user roles | Not implemented |
| Dealer-level isolation / route ownership rules | Not implemented |
| Purchase / supplier / GRN workflow | Not implemented |
| Return workflow | Not implemented as a usable flow |
| Migration-based schema history | Not implemented |

## Implemented Backend Modules

### Health

- `GET /api` root API info endpoint
- `GET /api/health` health check

### Companies

- create, list, get, update, and delete companies
- company code uniqueness validation
- delete blocked if products still exist under the company

### Products

- create, list, get, update, and delete products
- company-wise filtering and text search
- SKU uniqueness scoped to company
- delete blocked if stock movements exist for the product

### Routes

- create, list, get, update, and deactivate routes
- unique route name validation
- list shops under a route

### Shops

- create, list, get, update, and deactivate shops
- route-wise filtering and text search
- shop totals in listing: order count and total due
- shop must belong to an active route
- shop name must be unique within a route

### Stock

- create opening stock entries
- create stock-in entries
- create adjustment entries
- list stock movements with company, product, type, date, and text filters
- current stock summary
- low-stock summary
- zero-stock summary
- inventory investment summary API

Current stock is calculated from stock movements. `SALE_OUT` quantities are subtracted during summary calculation.

### Sales

- create multi-item sales
- validate company, route, shop, and product relationships
- validate available stock before saving
- auto-generate invoice numbers when not supplied
- save initial payment at sale creation
- create `SALE_OUT` stock movements automatically
- list sales with filters and pagination
- sale detail view payload with items and payments
- receive later payments against an existing sale
- sales summaries for today sales, today profit, monthly totals, route-wise sales, company-wise sales, route-wise due, shop-wise due, company-wise due, due overview, and shop due details

## Implemented Frontend Pages and Modules

### Dashboard

- `/`
- overall business snapshot
- company and product counts
- low-stock and zero-stock counts
- today sales, today profit, monthly sales, and due metrics
- route-wise and company-wise sales snapshots
- quick links into major workflows

### Companies

- `/companies`
- create and edit company records
- list company details and active status

### Products

- `/products`
- company-filtered product workspace
- create and edit products
- pricing, unit, active status, and current stock visibility for the selected company

### All Products

- `/products/all`
- combined product list across all companies
- current stock shown beside each product

### Routes

- `/routes`
- create and edit routes
- maintain route name, area, and active state

### Shops

- `/shops`
- create and edit shops under routes
- filter by route
- view shop owner, route, total orders, total due, and active state

### Stock Workspace

- `/stock`
- merged stock and movement workspace
- company/product/type/date/text filters
- current stock summary
- low-stock panel
- zero-stock panel
- movement history with pagination
- popup actions for opening stock, stock-in, and adjustment
- deep-link support through query params such as `view=movements` and `view=alerts`

### Legacy Stock Movements Route

- `/stock/movements`
- redirects into the merged `/stock` workspace

### Sales Workspace

- `/sales`
- filterable sales list
- 10-row server-side pagination
- today/monthly/due summary cards
- route-wise sales summary
- company-wise sales summary
- route-wise due summary
- shop-wise due summary
- company-wise due summary
- links into sale detail and shop due ledger pages

### Create Sale

- `/sales/create`
- create multi-item sales
- full-paid or due sale flow
- company, route, and shop selection
- advanced product search and matching
- live totals, profit, and due calculation
- optional invoice number entry
- save-and-continue workflow for repeated order entry

### Sale Details

- `/sales/[id]`
- sale header information
- sale items table
- payment history
- receive due payments against a single sale

### Shop Due Ledger

- `/sales/shops/[id]`
- shop-level due summary
- outstanding due sales for that shop
- inline payment collection for each due sale
- shop payment history across sales

### Frontend Work Present but Not Routed

- `frontend/components/stock/stock-investment-page.tsx` exists
- backend also exposes `GET /api/stock/summary/investment`
- there is currently no `app/stock/investment/page.tsx` route and no sidebar link for it

## Current Business Flow In The Code

The implemented business flow is:

1. maintain company master data
2. maintain products under each company
3. maintain route master data
4. maintain shops under routes
5. record inventory through opening stock, stock-in, and adjustments
6. create a sale using one company, one route, and optionally one shop
7. validate stock and active status before saving
8. create sale items, an optional initial payment, and matching `SALE_OUT` stock movements
9. review sales summaries and due summaries
10. collect later payments from either the sale details page or the shop due ledger page

Important implemented rules:

- inactive company, product, route, or shop cannot be used in the active operational flows where validated
- a selected shop must belong to the selected route during sale creation
- due sales require a shop
- paid amount cannot exceed the sale total
- due payment cannot exceed the remaining due

## Important Current Limitations and Missing Modules

- no authentication, authorization, or user-role system
- no dealer, salesman, employee, or user ownership model
- no purchase, supplier, or goods-receipt flow
- no warehouse, van, or route-level stock allocation
- no return workflow exposed in backend or frontend, even though `RETURN_IN` exists in the stock movement type enum and UI filter labels
- no reporting/export/print module
- no accounting or ledger module beyond sale due tracking
- no migration files; database lifecycle relies on TypeORM synchronization scripts
- automated test coverage is minimal; the visible e2e test only covers the health endpoint
- `JWT_SECRET` is required by env validation, but there is no implemented auth module using it

## Mismatch With Dealer-Level Route-Based ERP Rules

Based on the current data model and UI flow, the main gaps against a dealer-level, route-based ERP are:

- routes are global master data; they are not assigned to a dealer, user, salesman, or company
- shops belong to routes, but not to a dealer or company account structure
- stock is tracked by `company + product`, not by dealer, route, warehouse, vehicle, or delivery load
- any active company can currently be sold on any active route; there is no company-to-route assignment rule
- the frontend is a shared admin workspace, not a dealer-scoped portal with route-based access control
- there is no approval, dispatch, route loading, route closing, or settlement workflow

So while the app already uses routes and shops operationally, it does not yet enforce dealer-scoped route ownership or route-level inventory rules.

## Project Structure Overview

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

## Setup and Run

The current setup instructions below match the existing package scripts and environment files.

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
- health: `http://localhost:3001/api/health`

Useful database scripts:

```powershell
npm run db:init
npm run db:seed
npm run db:reset
```

What they do:

- `db:init`: synchronizes schema without loading demo data
- `db:seed`: synchronizes schema if needed and loads demo companies, products, routes, shops, stock movements, sales, and payments
- `db:reset`: drops and recreates the schema without demo data

### Frontend

```powershell
cd frontend
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Default frontend URL:

- `http://localhost:3000`

### Environment Files

Backend example:

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://username:password@ep-example.us-east-2.aws.neon.tech/dealer_erp?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:3000
DB_SYNCHRONIZE=false
DB_DROP_SCHEMA=false
```

Frontend example:

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
npm run db:seed
npm run db:reset
```

### Frontend

```powershell
npm run dev
npm run build
npm run lint
```

## Additional Notes

- `PROJECT_STATUS.md` contains a deeper audit-style breakdown of the current codebase
- there is an existing uncommitted change in `frontend/next-env.d.ts` that is unrelated to this documentation update
