# Mini ERP — Backend (Server)

Assessment build: Inventory & Sales Management API. Honest scope — a _mini_ ERP.
Correctness and clean architecture over feature count. Every claim must survive "show me".

## Stack (pinned)

Node 24 · Express 5 · TypeScript (strict) · MongoDB + Mongoose · Zod v4
JWT in HTTP-only cookies (jsonwebtoken + bcrypt) · Multer + Cloudinary · Socket.io

## Commands

- `npm run build` → tsc build, MUST be clean
- `npm run typecheck` → `tsc --noEmit`, MUST be clean
- `npm run lint` → ESLint, MUST be clean
- `npm run dev` → local dev server
- `npm run seed` → seed permissions, roles, and one user PER role

## Architecture (strict — feature-driven)

Every feature is a folder with EXACTLY this module pattern:
_.route.ts // router + validateRequest only
_.controller.ts // controller object — NEVER touches the DB
_.service.ts // all business logic + all DB access
_.validation.ts // Zod schemas
_.model.ts // Mongoose schema
_.interface.ts // TS types

- Routes define endpoints only. Controllers never touch the DB. Services own all logic.
- Zod validates ALL inputs via a `validateRequest` middleware.
- Response envelope on EVERY response: { statusCode, success, message, data }.
- Exports: `featureService = {}`, `featureController = {}`, `featureValidation = {}`.
- JSDoc above every function in _.controller.ts and _.service.ts.
- Shared code (not features): middleware/, utils/ (QueryBuilder, catchAsync,
  sendResponse, AppError), config/, socket/, seed/.

## Domain invariants (DO NOT violate — these are the grade)

1. AUTHORIZATION is DB-driven. ONE guard everywhere: `requirePermission('resource:action')`.
   NEVER hardcode role names (no `authorize('admin','manager')` anywhere).
   Permissions live in a seeded Permission catalog; Role.permissions holds refs to them;
   auth resolves user → role → permissions into a Set for the check.
2. Admin is seeded with ALL permissions explicitly. No `*` wildcard shortcut.
3. System roles (admin/manager/employee) cannot be DELETED via API (isSystem flag),
   but their permissions CAN be edited.
4. `customer:read` is granted to Employee (they need the customer dropdown to create a sale).
   customer create/update = admin+manager; customer:delete = admin only.
5. A SALE is TRANSACTIONAL. Use a Mongoose session. Per line-item, do a GUARDED atomic
   decrement: updateOne({ \_id, stockQuantity: { $gte: qty } }, { $inc: { stockQuantity: -qty } }).
   If modifiedCount === 0 → abort the WHOLE transaction (no partial sale).
6. Snapshot `unitPrice` onto each sale item at sale time. NEVER read price live from Product
   at read-time — past sales must not shift when a product price later changes.
7. grandTotal is computed server-side. Never trust a client-sent total.
8. After a sale commits, emit a low-stock alert (Socket.io) for any product now < 5.

## Working agreement (enforced)

- Work proceeds in GATED BATCHES. Do only the batch you are given. STOP at its gate.
  Do NOT start the next batch. Do NOT scaffold ahead.
- Only make changes directly requested. Do NOT add features, endpoints, or refactor
  beyond the batch scope. No gold-plating.
- Use Plan Mode: propose the file/module structure and wait for approval before writing code.
- After each step, output: ✅ `what was completed`.
- STOP and ask before anything destructive (deleting files, force operations, schema drops).
- Surgical edits only. Never regenerate unchanged code.
- If a request conflicts with these rules, push back and explain — do not silently comply.
