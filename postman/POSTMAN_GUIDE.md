# Mini ERP API — Postman Testing Guide

A complete, self-running Postman test suite for the Mini ERP backend. Import three files,
pick an environment, click **Run** — every request script auto-captures the IDs the next
request needs, so there is no manual copy-pasting of tokens or object IDs at any point.

---

## What's included

| File | What it is |
|---|---|
| `Mini-ERP-API.postman_collection.json` | The full collection — 45 requests across 11 folders, covering every route in the API plus a dedicated RBAC negative-test suite |
| `Mini-ERP-Live-Railway.postman_environment.json` | Points at the live, deployed API — **zero setup required**, just import and go |
| `Mini-ERP-Local.postman_environment.json` | Points at `http://localhost:5000/api` for testing your own local checkout |
| `POSTMAN_GUIDE.md` | This file |

---

## Quick Start (2 minutes, zero local setup)

1. Open Postman → **Import** → drag in all three JSON files (or import them one at a time).
2. Top-right environment dropdown → select **"Mini ERP - Live (Railway)"**.
3. Open the collection → run `00 - Health` → expect `200` with an uptime/timestamp payload.
4. Run `01 - Auth → Login as Admin`.
5. From here, everything else is fair game — see [Recommended Run Order](#recommended-run-order) below to exercise the whole API in one pass, or jump straight to whatever folder interests you.

Prefer to test your own local server instead of the live one? Select the **"Mini ERP - Local"**
environment instead, and make sure the server is running with `npm run dev` (see the main
repo README for local setup — you'll need a MongoDB Atlas connection string, since sale
creation uses multi-document transactions that require a replica set).

---

## How the auto-chaining works

You will never need to manually copy an `_id` out of one response and paste it into another
request. Every request that creates or looks up a real record has a **Tests** tab script that
reads the response and writes the relevant id into an **Environment variable** — visible
live in the environment editor as you go. For example:

- `02 - Permissions → Get Permission Catalog` writes `permId_product_read`,
  `permId_sale_create`, etc. (one per permission, 19 total) — used immediately afterward by
  `03 - Roles → Create Demo Role`.
- `05 - Products → Create Demo Product` writes `productId` — used by every subsequent
  Products request, and cleaned up by `Delete Demo Product` at the end of that folder.
- `07 - Sales` starts by looking up two **seeded** records (`STAND-DESK-03` and customer
  "Aisha Rahman") rather than depending on anything created earlier, so that folder works
  even if you skip straight to it.

Because these are Environment variables (not Collection variables), the **Local** and **Live**
environments each keep their own independent set — testing against one never pollutes the
other.

Auth works the same way: login responses arrive with `Set-Cookie: accessToken=...; HttpOnly`
and `Set-Cookie: refreshToken=...; HttpOnly`. Postman's cookie jar stores these against the
active environment's domain automatically and resends them on every following request — there
is no Bearer token to paste into a header. (The access token is *also* returned in the JSON
body as `accessToken`, purely because the real frontend needs it for authenticating a
cross-site WebSocket handshake — for REST testing in Postman you can ignore it entirely.)

---

## Recommended Run Order

The folders are numbered in the order they're designed to run — either manually, top to
bottom, or via **Collection Runner** (▶ next to the collection name → select all folders →
Run). A full run takes under a minute and exercises the entire API surface, including
negative/permission-boundary cases:

| # | Folder | What it proves |
|---|---|---|
| 00 | Health | API is reachable |
| 01 | Auth | Login, session cookie, `/me`, token refresh |
| 02 | Permissions | Full 19-entry catalog; captures ids for role-building |
| 03 | Roles | Full role CRUD; **system roles can have permissions edited but not be renamed/deleted** (both asserted, not just claimed) |
| 04 | Users | Full user CRUD; password never returned in any response |
| 05 | Products | Full CRUD incl. **required image on create**, **optional image-replace on update**, duplicate-SKU → 409 |
| 06 | Customers | Full CRUD |
| 07 | Sales | **The differentiator** — transactional sale against seeded stock, server-computed totals, insufficient-stock → 409 with **zero side effects** |
| 08 | Dashboard | Aggregate counts + live low-stock list |
| 09 | RBAC Boundary Tests | Logs in as Employee then Manager and **proves each denied action actually 403s** — this is the dynamic-RBAC claim, made executable |
| 10 | Cleanup | Logout |

Every request that expects a specific outcome has a **Tests** assertion attached — after a run,
Postman's Test Results panel gives you a pass/fail summary for the whole suite at a glance,
not just raw response bodies to eyeball.

---

## Testing role boundaries manually

Folder `09` automates the three most illustrative denial cases, but you can probe the full
permission matrix yourself at any time — just re-run the relevant `Login as <Role>` request
(in `01` or `09`) to switch identity, then hit any endpoint:

| Permission | Admin | Manager | Employee |
|---|:---:|:---:|:---:|
| `product:read` | ✅ | ✅ | ✅ |
| `product:create / update / delete` | ✅ | ✅ | ❌ |
| `customer:read` | ✅ | ✅ | ✅ |
| `customer:create / update` | ✅ | ✅ | ❌ |
| `customer:delete` | ✅ | ❌ | ❌ |
| `sale:create` | ✅ | ✅ | ✅ |
| `sale:read` | ✅ | ✅ | ❌ |
| `dashboard:read` | ✅ | ✅ | ✅ |
| `user:*` / `role:*` | ✅ | ❌ | ❌ |

A denied request always comes back `403` with `{ success: false, message: "You do not have
permission to perform this action" }` — never a silent empty result or a misleading `404`.

---

## Notes on specific requests

- **Product create/update use `multipart/form-data`.** Postman will show the `image` field
  as a file picker — attach any small `.jpg`/`.png` before sending. Create requires it (400
  without one); update does not.
- **`Update Demo Product (Price Only)`** intentionally sends plain JSON (not multipart) with
  no image field, to demonstrate that an image-only-optional update genuinely leaves the
  existing image untouched.
- **The `Insufficient Stock` sale request is expected to fail (409).** That's the test. Rerun
  `Get Product by ID` on `productId_standingDesk` afterward if you want to confirm stock
  truly didn't move — the guarded transaction leaves zero side effects on a rejected sale.
- **Real-time low-stock alerts are not testable from Postman.** The `low-stock-alert`
  Socket.io event fires after the happy-path sale in folder `07`, but observing it requires
  a Socket.io client (the deployed frontend, or a small script) — plain HTTP requests can't
  subscribe to it. This is called out explicitly rather than glossed over.
- **Access tokens expire after 15 minutes.** If you leave the collection idle mid-session and
  start seeing unexpected `401`s, just re-run `01 - Auth → Refresh Access Token`, or simply
  log in again.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Every request 404s immediately | Wrong environment selected, or `baseUrl` edited by mistake | Re-select the intended environment; confirm `baseUrl` matches the table at the top of this guide |
| `401 Authentication required` on a request that should work | Session cookie missing/expired | Re-run the relevant `Login as <Role>` request |
| `403` on a request you expected to succeed | You're logged in as the wrong role | Check `currentRole` in the active environment's variables, or just re-login as the role you need |
| `Create Demo Product` returns `400 Product image is required` | No file attached to the `image` form field | Open the request body tab and attach any image file |
| Re-running `Create Demo User`/`Create Demo Product` fails with `409` | The demo record from a previous run wasn't cleaned up (e.g. you stopped mid-folder) | Manually run the folder's own `Delete Demo *` request first, or just change the email/SKU in the body for this run |
| Testing against **Local** and transactions fail oddly | A standalone `mongod` doesn't support multi-document transactions | Point `DATABASE_URL` at a MongoDB Atlas cluster (even the free M0 tier — it's always a replica set) |

---

## License

MIT — same as the parent repository.
