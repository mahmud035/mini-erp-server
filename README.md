# Mini ERP — Inventory & Sales Management API

![Node](https://img.shields.io/badge/Node-%3E%3D24%20%3C25-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209-47A248?logo=mongodb&logoColor=white)
![Zod](https://img.shields.io/badge/Validation-Zod%20v4-3E67B1)
![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-010101?logo=socket.io&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

A backend for a small retail business to manage **inventory, customers, and sales** — built as a
full-stack developer assessment submission. The brief asked for a "mini" ERP; the scope here is
deliberately honest about that, but the parts that _are_ built are built to a production standard:
**DB-driven authorization**, **ACID-safe transactional sales**, **real-time inventory alerts**, and
a **generic, reusable query layer** — not a CRUD toy.

Every architectural claim below is backed by code in this repo — nothing here is aspirational.

---

## Table of Contents

1. [Live Demo & Credentials](#live-demo--credentials)
2. [Tech Stack](#tech-stack)
3. [Engineering Highlights](#engineering-highlights)
4. [Project Structure](#project-structure)
5. [Authorization Model](#authorization-model)
6. [API Reference](#api-reference)
7. [API Documentation (Postman)](#api-documentation-postman)
8. [Real-Time Events](#real-time-events-socketio)
9. [Response Envelope & Error Handling](#response-envelope--error-handling)
10. [Getting Started](#getting-started)
11. [Environment Variables](#environment-variables)
12. [NPM Scripts](#npm-scripts)
13. [Deployment Notes](#deployment-notes)
14. [Scope, Trade-offs & Known Issues](#scope-trade-offs--known-issues)
15. [License](#license)

---

## Live Demo & Credentials

|                  |                                              |
| ---------------- | -------------------------------------------- |
| **API base URL** | `https://mini-erp-server.up.railway.app/api` |
| **Health check** | `GET /api/health`                            |
| **Frontend app** | `https://mini-erp-client-app.vercel.app`     |
| **Client repo**  | `github.com/mahmud035/mini-erp-client`       |

All three roles are seeded on the live database so you can evaluate permission boundaries directly
— log in as each one and compare what's visible/editable.

| Role     | Email               | Password       |
| -------- | ------------------- | -------------- |
| Admin    | `admin@erp.test`    | `Password123!` |
| Manager  | `manager@erp.test`  | `Password123!` |
| Employee | `employee@erp.test` | `Password123!` |

> These are seed credentials for a demo/assessment environment only — see [`users.data.ts`](src/seed/users.data.ts).
> Nothing sensitive is exposed; passwords are bcrypt-hashed at rest regardless.

---

## Tech Stack

| Layer      | Choice                                                               |
| ---------- | -------------------------------------------------------------------- |
| Runtime    | Node.js `>=24 <25` (pinned in `engines`)                             |
| Framework  | Express 5, TypeScript (strict mode, CommonJS)                        |
| Database   | MongoDB Atlas + Mongoose 9                                           |
| Validation | Zod v4, enforced via a shared `validateRequest` middleware           |
| Auth       | JWT (access + refresh) in HTTP-only cookies, bcrypt password hashing |
| Media      | Cloudinary (buffered upload — no temp files on disk)                 |
| Real-time  | Socket.io 4, permission-gated rooms                                  |
| Tooling    | ESLint (flat config) + Prettier, `tsc --noEmit` as a CI gate         |
| Hosting    | Railway (API), MongoDB Atlas (data), Cloudinary (media)              |

---

## Engineering Highlights

The six items below are the actual differentiators of this build — each maps to a specific file so
you can go straight to the source.

### 1. Authorization is 100% DB-driven — zero hardcoded roles

There is exactly **one** authorization guard in the entire codebase:
[`requirePermission('resource:action')`](src/middleware/requirePermission.ts). It does not know the
words "admin", "manager", or "employee" — it checks a `Set<string>` of permission names resolved
fresh from the database on every request.

```
Request → authenticate (JWT → user)
        → resolveUserFromToken: User.findById().populate(role → permissions)
        → req.user.permissions = ['product:read', 'sale:create', ...]
        → requirePermission('product:update') checks membership
        → 403 if absent, next() if present
```

Because permissions are resolved per-request (not baked into the JWT), **editing a Role's
permissions in the database takes effect on the user's very next request — no re-login, no
redeploy.** The 19-entry permission catalog ([`permissions.data.ts`](src/seed/permissions.data.ts))
and the three seeded roles ([`roles.data.ts`](src/seed/roles.data.ts)) are the single source of
truth; even the `admin` role's "all permissions" are assigned **explicitly by name**, not via a
`*` wildcard shortcut — so the full grant set is always auditable.

### 2. Sales are transactional and race-safe

A sale touches multiple products' stock at once, and two concurrent sales can legally race for the
same last unit. [`sale.service.ts`](src/modules/sale/sale.service.ts) handles this with a Mongoose
session plus a **guarded atomic decrement per line item**:

```js
Product.findOneAndUpdate(
  { _id: item.product, isActive: true, stockQuantity: { $gte: item.quantity } },
  { $inc: { stockQuantity: -item.quantity } },
  { session, returnDocument: 'after' },
);
```

If the guard condition fails (insufficient stock, or the product went inactive between check and
write), `findOneAndUpdate` returns `null`, an error is thrown, and **the entire transaction rolls
back** — no partial sale, no phantom stock decrement on one line while another fails. `unitPrice`
is snapshotted onto the sale line at the moment of sale (so a later price change never rewrites
history), and `grandTotal` is always computed server-side — the client's numbers are never trusted.

### 3. One generic QueryBuilder, reused everywhere

[`QueryBuilder`](src/utils/QueryBuilder.ts) is a chainable wrapper around a Mongoose `Query` that
implements search / filter / sort / field-projection / pagination **once**, generically:

```ts
new QueryBuilder(Product.find(), req.query)
  .search(['name', 'sku', 'category'])
  .filter()
  .sort()
  .fields()
  .paginate();
```

Products, customers, and sales all list through the exact same class — zero duplicated pagination
logic across modules, and every list endpoint automatically gets `?searchTerm=`, `?sort=`,
`?fields=`, `?page=`, `?limit=` support for free.

### 4. Defense in depth on every input

Every mutating route is validated by a Zod schema **before** it reaches business logic
(`validateRequest` in [`middleware/validateRequest.ts`](src/middleware/validateRequest.ts)). Schemas
use `z.strictObject` so an unknown key (e.g. a client trying to sneak `isSystem: true` into a role,
or `unitPrice` into a sale line) is rejected with `400`, not silently dropped. Mongoose schema-level
constraints (`required`, `min`, `unique`, `match`) provide a second layer underneath.

### 5. Real-time inventory alerts, permission-gated

After a sale commits, any product that drops below the low-stock threshold triggers a
`low-stock-alert` Socket.io event — but only sockets belonging to users holding `product:update`
ever join the `inventory` room in the first place ([`socket/index.ts`](src/socket/index.ts)).
The emit is wrapped so a socket failure can **never** roll back or delay the sale that triggered it.

Because the deployed frontend and API live on different origins, a same-site cookie can't ride a
WebSocket handshake — so login/refresh return the access token in the response body _in addition
to_ the httpOnly cookie, the client holds it in memory only, and
[`socketAuth.ts`](src/socket/socketAuth.ts) accepts **either** the handshake token or the cookie
through the same `resolveUserFromToken` helper the HTTP layer uses — one auth resolution path, two
transports.

### 6. Media lifecycle has no orphan/leak paths

Product images upload straight from an in-memory buffer to Cloudinary — no temp files
([`utils/cloudinary.ts`](src/utils/cloudinary.ts)). The product's Mongo `_id` is generated up front
so the Cloudinary `public_id` is deterministic (`personal/mini-erp/products/{productId}`); if the
DB insert then fails (e.g. duplicate SKU), the just-uploaded asset is deleted before the error
propagates — no orphaned media on a failed create. On replace, the same `public_id` is
overwritten with `invalidate: true` so the URL never changes and the CDN cache is purged. On
delete, the DB document is removed **first**, then the Cloudinary asset is destroyed
best-effort — media cleanup never blocks or fails the API response.

---

## Project Structure

Strict feature-driven architecture — every domain module has exactly the same six files, so
navigating any feature you haven't seen before is predictable:

```
src/
├── app.ts                     # Express app: CORS, cookies, health check, routers, error handler
├── server.ts                  # Bootstrap: connect DB → attach Socket.io → listen → graceful shutdown
├── config/                    # Env validation (Zod), DB connection, Cloudinary SDK config
├── middleware/
│   ├── authenticate.ts        # Reads JWT cookie → attaches req.user
│   ├── requirePermission.ts   # THE single authorization guard
│   ├── validateRequest.ts     # Zod-schema request validation
│   ├── upload.ts              # Multer (in-memory, 5MB cap, image-only)
│   ├── globalErrorHandler.ts  # Normalizes every error type to one envelope
│   └── notFound.ts
├── modules/
│   ├── auth/                  # login / logout / refresh / me
│   ├── permission/            # read-only catalog
│   ├── role/                  # RBAC role CRUD (system roles protected)
│   ├── user/                  # user CRUD + role assignment
│   ├── product/               # inventory CRUD + Cloudinary image pipeline
│   ├── customer/              # customer CRUD
│   ├── sale/                  # transactional sale creation + immutable ledger
│   └── dashboard/             # aggregate stats
│       ├── *.route.ts         #   → router + validateRequest only
│       ├── *.controller.ts    #   → thin HTTP layer, NEVER touches the DB
│       ├── *.service.ts       #   → all business logic + all DB access
│       ├── *.validation.ts    #   → Zod schemas
│       ├── *.model.ts         #   → Mongoose schema
│       └── *.interface.ts     #   → TS types
├── seed/                      # Idempotent permission/role/user/demo-data seeding
├── socket/                    # Socket.io server, handshake auth, typed events
├── utils/                     # AppError, catchAsync, sendResponse, QueryBuilder, JWT, cookies, Cloudinary
└── routes/index.ts            # Mounts every feature router under /api
```

**Discipline enforced across every module:** routes define endpoints only; controllers never touch
the database; services own all logic; every function in a `*.controller.ts`/`*.service.ts` carries
a JSDoc comment explaining its contract.

---

## Authorization Model

19 atomic permissions (`resource:action`), three seeded system roles:

| Permission                       | Admin | Manager | Employee |
| -------------------------------- | :---: | :-----: | :------: |
| `product:read`                   |  ✅   |   ✅    |    ✅    |
| `product:create`                 |  ✅   |   ✅    |    ❌    |
| `product:update`                 |  ✅   |   ✅    |    ❌    |
| `product:delete`                 |  ✅   |   ✅    |    ❌    |
| `customer:read`                  |  ✅   |   ✅    |    ✅    |
| `customer:create`                |  ✅   |   ✅    |    ❌    |
| `customer:update`                |  ✅   |   ✅    |    ❌    |
| `customer:delete`                |  ✅   |   ❌    |    ❌    |
| `sale:read`                      |  ✅   |   ✅    |    ❌    |
| `sale:create`                    |  ✅   |   ✅    |    ✅    |
| `dashboard:read`                 |  ✅   |   ✅    |    ✅    |
| `user:read/create/update/delete` |  ✅   |   ❌    |    ❌    |
| `role:read/create/update/delete` |  ✅   |   ❌    |    ❌    |

Notable, deliberate calls:

- **Employee gets `customer:read`** (not just `sale:create`) because the sale-creation UI needs a
  customer picker — read access is a genuine dependency, not an oversight.
- **`customer:delete` is admin-only** even though create/update are shared with Manager — deleting
  a customer record has a different risk profile than editing one.
- **System roles (`admin`/`manager`/`employee`) cannot be deleted** via the API (`isSystem: true`),
  but their **permission sets can still be edited** — so the RBAC system stays dynamic
  rather than hardcoding three fixed personas.

---

## API Reference

All routes are prefixed with `/api`. 🔒 = requires a valid access-token cookie
(`authenticate`); the permission listed is checked by `requirePermission` after that.

### Auth — `/auth`

| Method | Path       | Auth                          | Description                                                                                                  |
| ------ | ---------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| POST   | `/login`   | Public                        | Validates credentials, sets `accessToken` + `refreshToken` httpOnly cookies, returns `{ user, accessToken }` |
| POST   | `/logout`  | 🔒                            | Clears both auth cookies                                                                                     |
| POST   | `/refresh` | Public (needs refresh cookie) | Mints a new access token, returns `{ accessToken }`                                                          |
| GET    | `/me`      | 🔒                            | Returns the current authenticated user                                                                       |

### Permissions — `/permissions`

| Method | Path | Permission  | Description                                    |
| ------ | ---- | ----------- | ---------------------------------------------- |
| GET    | `/`  | `role:read` | Full permission catalog (for role-editing UIs) |

### Roles — `/roles`

| Method | Path   | Permission    | Description                                      |
| ------ | ------ | ------------- | ------------------------------------------------ |
| GET    | `/`    | `role:read`   | List all roles with populated permissions        |
| GET    | `/:id` | `role:read`   | One role                                         |
| POST   | `/`    | `role:create` | Create a non-system role                         |
| PATCH  | `/:id` | `role:update` | Update name (non-system only) and/or permissions |
| DELETE | `/:id` | `role:delete` | Delete a non-system role (403 on system roles)   |

### Users — `/users`

| Method | Path   | Permission    | Description                          |
| ------ | ------ | ------------- | ------------------------------------ |
| GET    | `/`    | `user:read`   | List all users                       |
| GET    | `/:id` | `user:read`   | One user                             |
| POST   | `/`    | `user:create` | Create a user with a role assignment |
| PATCH  | `/:id` | `user:update` | Update name / role / `isActive`      |
| DELETE | `/:id` | `user:delete` | Delete a user                        |

### Products — `/products`

| Method | Path   | Permission       | Description                                                                  |
| ------ | ------ | ---------------- | ---------------------------------------------------------------------------- |
| GET    | `/`    | `product:read`   | Paginated, searchable list (`searchTerm`, `page`, `limit`, `sort`, `fields`) |
| GET    | `/:id` | `product:read`   | One product                                                                  |
| POST   | `/`    | `product:create` | Create — `multipart/form-data`, image **required**                           |
| PATCH  | `/:id` | `product:update` | Update — `multipart/form-data`, image optional (replaces in place)           |
| DELETE | `/:id` | `product:delete` | Delete product + best-effort Cloudinary cleanup                              |

### Customers — `/customers`

| Method | Path   | Permission        | Description                |
| ------ | ------ | ----------------- | -------------------------- |
| GET    | `/`    | `customer:read`   | Paginated, searchable list |
| GET    | `/:id` | `customer:read`   | One customer               |
| POST   | `/`    | `customer:create` | Create                     |
| PATCH  | `/:id` | `customer:update` | Update                     |
| DELETE | `/:id` | `customer:delete` | Delete                     |

### Sales — `/sales` (create + read only — immutable ledger, no edit/delete)

| Method | Path   | Permission    | Description                                                                                            |
| ------ | ------ | ------------- | ------------------------------------------------------------------------------------------------------ |
| POST   | `/`    | `sale:create` | `{ customer, items: [{ product, quantity }] }` → transactional stock decrement, server-computed totals |
| GET    | `/`    | `sale:read`   | Paginated list, newest first, populated                                                                |
| GET    | `/:id` | `sale:read`   | One sale, populated                                                                                    |

### Dashboard — `/dashboard`

| Method | Path | Permission       | Description                                                         |
| ------ | ---- | ---------------- | ------------------------------------------------------------------- |
| GET    | `/`  | `dashboard:read` | `{ totalProducts, totalCustomers, totalSales, lowStockProducts[] }` |

### Health

| Method | Path      | Auth   | Description                              |
| ------ | --------- | ------ | ---------------------------------------- |
| GET    | `/health` | Public | `{ uptime, timestamp }` — liveness probe |

---

## API Documentation (Postman)

A complete, self-running Postman collection lives in [`postman/`](postman/) — 45 requests
across 11 folders covering every route above, plus a dedicated RBAC negative-test folder
that actually logs in as each role and asserts the permission boundaries in the table above
are enforced (not just documented).

| File                                                     | Purpose                                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`postman/POSTMAN_GUIDE.md`](postman/POSTMAN_GUIDE.md)   | Import steps, recommended run order, permission matrix, troubleshooting |
| `postman/Mini-ERP-API.postman_collection.json`           | The collection itself                                                   |
| `postman/Mini-ERP-Live-Railway.postman_environment.json` | Points at the live deployment — import and run, zero local setup        |
| `postman/Mini-ERP-Local.postman_environment.json`        | Points at `http://localhost:5000/api` for a local checkout              |

Request scripts auto-capture every id needed downstream (roles, permissions, demo
products/customers/sales) into environment variables, and auth cookies are handled entirely
by Postman's cookie jar — nothing to copy-paste manually to exercise the whole API end to end.

---

## Real-Time Events (Socket.io)

| Event             | Direction       | Payload                                                    | Trigger                                                                                                                         |
| ----------------- | --------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `low-stock-alert` | Server → Client | `{ products: [{ id, name, sku, stockQuantity }], saleId }` | Emitted to the `inventory` room right after a sale commits, for every product that fell below the low-stock threshold (5 units) |

**Connecting:** authenticate the handshake with `{ auth: { token: accessToken } }` (the in-memory
token from login/refresh) — the same cookie also works for same-site clients. Only sockets whose
resolved permissions include `product:update` are joined to the `inventory` room; everyone else
connects successfully but receives no inventory events.

---

## Response Envelope & Error Handling

Every response — success or failure — has exactly this shape:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Products retrieved",
  "data": {
    "items": [],
    "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
  }
}
```

A single [`globalErrorHandler`](src/middleware/globalErrorHandler.ts) normalizes every error source
into that same envelope:

| Source                           | Status       | Example message                                  |
| -------------------------------- | ------------ | ------------------------------------------------ |
| Zod validation failure           | 400          | `Validation failed`                              |
| Mongoose `ValidationError`       | 400          | Field-level messages joined                      |
| Mongoose `CastError`             | 400          | `Invalid <path>: <value>`                        |
| Duplicate key (`E11000`)         | 409          | `Duplicate value for field: sku`                 |
| Expired JWT                      | 401          | `Token expired`                                  |
| Invalid JWT                      | 401          | `Invalid token`                                  |
| Multer error (size/type)         | 400          | e.g. `File too large`                            |
| `AppError` (thrown deliberately) | as specified | e.g. `Insufficient stock or unavailable product` |
| Anything unexpected              | 500          | `Internal server error`                          |

In non-production environments, `data` also carries the stack trace / Zod issue list for debugging;
in production it is always `null` — no internals leak to a client.

---

## Getting Started

### Prerequisites

- Node.js `>=24 <25` (pinned in `package.json#engines`)
- A MongoDB **replica-set** connection (any MongoDB Atlas cluster, including the free M0 tier,
  qualifies — Atlas clusters are always replica sets). A standalone `mongod` will **not** work,
  because sale creation uses `session.withTransaction`.
- A Cloudinary account (free tier is enough) for product image storage

### Install & run locally

```bash
git clone https://github.com/mahmud035/mini-erp-server.git
cd mini-erp-server
npm install

cp .env.example .env
# fill in DATABASE_URL, JWT secrets, and CLOUDINARY_* (see table below)

npm run seed   # idempotent — permissions, roles, 3 dev users, demo customers & products
npm run dev    # starts on PORT (default 5000) with hot reload
```

Once seeded, log in with any of the [seeded credentials](#live-demo--credentials) above against
`http://localhost:5000/api/auth/login`.

### Production build

```bash
npm run build   # tsc → dist/
npm start       # node dist/server.js
```

---

## Environment Variables

All variables are validated at boot via a Zod schema in [`config/index.ts`](src/config/index.ts) —
a missing or malformed value fails startup immediately with a clear message, rather than surfacing
as an obscure runtime error later.

| Variable                | Required | Default       | Notes                                                                  |
| ----------------------- | :------: | ------------- | ---------------------------------------------------------------------- |
| `NODE_ENV`              |    No    | `development` | `production` enables `Secure` + `SameSite=None` cookies                |
| `PORT`                  |    No    | `5000`        |                                                                        |
| `DATABASE_URL`          | **Yes**  | —             | MongoDB connection string (replica set)                                |
| `CORS_ORIGIN`           | **Yes**  | —             | Exact frontend origin allowed with credentials                         |
| `BCRYPT_SALT_ROUNDS`    |    No    | `12`          |                                                                        |
| `JWT_ACCESS_SECRET`     | **Yes**  | —             | Long random string                                                     |
| `JWT_REFRESH_SECRET`    | **Yes**  | —             | Long random string, distinct from the access secret                    |
| `JWT_ACCESS_EXPIRES`    |    No    | `15m`         | Must use the same unit vocabulary as cookie `maxAge` (`s`/`m`/`h`/`d`) |
| `JWT_REFRESH_EXPIRES`   |    No    | `7d`          |                                                                        |
| `CLOUDINARY_CLOUD_NAME` | **Yes**  | —             |                                                                        |
| `CLOUDINARY_API_KEY`    | **Yes**  | —             |                                                                        |
| `CLOUDINARY_API_SECRET` | **Yes**  | —             |                                                                        |

---

## NPM Scripts

| Script      | Command                   | Purpose                                                               |
| ----------- | ------------------------- | --------------------------------------------------------------------- |
| `dev`       | `tsx watch src/server.ts` | Local dev server with hot reload                                      |
| `build`     | `tsc`                     | Compile to `dist/` — must be clean before every deploy                |
| `start`     | `node dist/server.js`     | Run the compiled server (production)                                  |
| `typecheck` | `tsc --noEmit`            | Type-check without emitting — CI gate                                 |
| `lint`      | `eslint .`                | ESLint (flat config, Prettier-compatible)                             |
| `seed`      | `tsx src/seed/seed.ts`    | Idempotent: permissions → roles → dev users → demo customers/products |

---

## Deployment Notes

Deployed on **Railway**, behind its TLS-terminating proxy, with the frontend on **Vercel** — two
different registrable domains. A few decisions exist specifically because of that split:

- `app.set('trust proxy', 1)` — required so Express sees the real protocol behind Railway's proxy;
  without it, `Secure` cookies silently never get set.
- `NODE_ENV=production` is what flips cookies to `SameSite=None; Secure`, which is mandatory for a
  cross-site cookie to survive at all in modern browsers.
- CORS is configured with `credentials: true` and an **exact** `CORS_ORIGIN` (never `*`, which is
  incompatible with credentialed requests).
- The frontend proxies `/api/*` to this service so the browser only ever talks to its own origin —
  making the auth cookie first-party from the browser's perspective. That proxy lives in the
  frontend repo; this backend only needs to trust the one exact origin it's told about.
- Socket.io cannot ride that same proxy (WebSockets don't rewrite across origins the same way), so
  the client connects to this API's socket endpoint **directly**, authenticated via the in-memory
  access token instead of the cookie.

---

## Scope, Trade-offs & Known Issues

Built under a fixed deadline — these are documented on purpose rather than silently left for
someone to discover:

- **`id` vs `_id` inconsistency.** `auth`/`user` responses are serialized through
  `toUserResponse` (exposing `id`), while `product`, `customer`, and `sale` currently return the
  raw Mongoose document (`_id`). Flagged, not fixed, given the timebox — the fix is a one-line
  serializer per module exposing `id` the same way `user` does.
- **No dynamic-RBAC admin UI.** The role/permission management API (`/roles`, `/permissions`,
  `/users`) is complete and fully authorized — there just isn't a dedicated frontend screen for it
  in this build. It's fully exercisable via the API or a tool like Postman/Insomnia.
- **No automated test suite.** Correctness during development was verified with manual,
  curl-driven acceptance gates per batch and two disposable Node scripts (not shipped —
  intentionally `.gitignore`d local tooling) that round-tripped the Cloudinary image pipeline and
  the end-to-end socket low-stock flow against a running local server. A Vitest/Jest suite is the
  natural next step, not a gap in the design.
- **No rate limiting.** Acceptable for an assessment/demo deployment; would add `express-rate-limit`
  (or similar) at the edge before any production traffic.
- **Sales are immutable by design**, not by omission — no `PATCH`/`DELETE` on `/sales`. A sale is a
  ledger entry; correcting one should be a new, reversing sale, not a mutation of history.

---

## License

MIT © Mahmud — see [`package.json`](package.json).
