# Aura Full-Stack Commerce

Arabic RTL commerce prototype converted to a runnable full-stack application.

## Prototype analysis

### System Overview

Aura is a multi-store beauty and lifestyle marketplace with a customer storefront and an admin management portal. The supplied HTML files are self-contained React prototypes rendered through CDN scripts; no separate CSS/JS source or ERD file exists in the workspace despite the attachment reference.

### User Features

- Browse home content, categories, and products.
- Add products to a persistent cart and change quantities.
- Toggle product favorites.
- Register, log in, inspect profile, and log out.
- Create orders from the cart.

### Admin Features

- Dashboard summary and recent orders.
- Product, category, and store listings.
- Search and status filtering for products/orders.
- Favorite-product analytics view.
- CRUD endpoints for products, categories, and stores.
- Role-protected admin API and routes.

### Database Entities

`User`, `Store`, `Category`, `Product`, `Favorite`, `CartItem`, `Order`, `OrderItem`.

### Database Relations

Users own cart items, favorites, and orders. Stores own products. Categories contain products. Orders contain order items, and each order item snapshots the product name and unit price. Foreign keys and indexes are defined in `prisma/schema.prisma`.

### Required APIs

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/products`, `POST/PATCH/DELETE /api/products/:id`
- `GET /api/categories`, `POST/PATCH/DELETE /api/categories/:id`
- `GET /api/stores`, `POST/PATCH/DELETE /api/stores/:id`
- `GET /api/cart`, `POST /api/cart/items`, `PATCH/DELETE /api/cart/items/:productId`
- `GET /api/favorites`, `POST/DELETE /api/favorites/:productId`
- `GET /api/orders`, `POST /api/orders`, `PATCH /api/orders/:id/status`
- `GET /api/admin/dashboard`

### ERD Issues

**ERD Issue:** No `ERD.md` or `ERD.png` exists in the actual workspace; only the HTML prototypes and design bundles are present.

**Proposed Fix:** Infer the smallest normalized model from the visible UI and document the assumption here. Order items preserve product snapshots so historical orders remain stable.

**Reason:** Blocking on a missing ERD would leave the repository non-runnable. The schema is intentionally conservative and can be reconciled with the original ERD later without changing the API shape.

## Run

1. Create a PostgreSQL database and copy `.env.example` to `.env`.
2. `npm install`
3. `npm run db:migrate`
4. `npm run db:seed`
5. `npm run dev`
6. Open `http://localhost:8080`.

Development credentials from the seed: `admin@aura.local` / `Admin123!`.
