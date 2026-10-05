# CAVE Saloon · Frontend

React 19 + Vite + Tailwind CSS v4 PWA-style tablet app for the CAVE salon network.
Three experiences share one codebase: **stylist / customer check-in**, **manager** and **admin**.

## Run it

```bash
pnpm install            # or: corepack pnpm install
cp .env.example .env.local
pnpm dev                # http://localhost:5173
```

The backend (`../BACKEND`) must be running on `http://localhost:3000`.
In development Vite proxies `/api` to it, so there is nothing to configure for CORS.

| Command          | What it does                      |
| ---------------- | --------------------------------- |
| `pnpm dev`       | Dev server with hot reload        |
| `pnpm typecheck` | `tsc --noEmit`                    |
| `pnpm build`     | Typecheck + production build      |
| `pnpm preview`   | Serve the production build        |

### Environment

| Variable            | Default                 | Purpose                                                     |
| ------------------- | ----------------------- | ----------------------------------------------------------- |
| `VITE_API_BASE_URL` | `/api`                  | API base incl. `/api`. Set to the deployed URL for prod.    |
| `VITE_PROXY_TARGET` | `http://localhost:3000` | Where the dev server proxies `/api`.                        |

For a production build served from a different origin, set `VITE_API_BASE_URL`
(e.g. `https://api.example.com/api`) and put that frontend origin in the backend's `CORS_ORIGIN`.

## Sample data

```bash
cd ../BACKEND
npm run db:seed:sample     # idempotent; adds the "CAVE Karkala" branch, staff, menu, sessions, expenses
```

| Who     | PIN                                         |
| ------- | ------------------------------------------- |
| Stylist | `1234`                                      |
| Manager | `4321`                                      |
| Admin   | `202600` (Manager screen → "Admin login")   |

## Structure

```
src/
  main.tsx, App.tsx          entry + providers (Auth → BranchData → router)
  app/AppRouter.tsx          screen flow / navigation state
  config/env.ts              API base URL
  context/
    AuthContext.tsx          PIN login, token (memory only), sign-out on 401
    BranchDataContext.tsx    today's stylists, sessions, menu, expenses (polls every 30 s)
  lib/
    api/                     typed backend client (http, auth, staff, admin)
    mappers.ts               API shapes → UI types
    format.ts                money / time / duration formatting
  types/                     UI types (index.ts) and backend shapes (api.ts)
  hooks/useAsyncData.ts      load + loading/error state for admin views
  components/
    ui/                      one file per reusable primitive (Button, Dialog, …) + index
    layout/                  StylistNav, ManagerNav
  screens/
    auth/ customer/ stylist/ manager/
    admin/                   shell + views/ + components/ + hooks/
  constants/checklist.ts     daily checklist (local only)
  assets/images/             design reference images
```

## How the screens map to the API

Every screen reads and writes the backend; nothing is mocked.

| Screen                                      | Endpoint(s)                                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| PIN entry (stylist / manager)               | `POST /auth/branch/login`                                                           |
| PIN entry (admin)                           | `POST /admin/auth/login`, `GET /admin/auth/me`                                      |
| Loyalty                                     | `GET /staff/customers/lookup`                                                       |
| Start session                               | `POST /staff/sessions` → `POST /staff/sessions/:id/start-service`                   |
| Dashboards, sessions, payouts, cash         | `GET /staff/today`, `GET /staff/menu` (refreshed after every change)                |
| Close & bill / manager Edit / Delete        | `POST /staff/sessions/:id/close`, `PATCH …/:id`, `DELETE …/:id`                     |
| Stylist stats (Today / Week / Month)        | `GET /staff/stats?period=`                                                          |
| Morning opening / Cash closing              | `PUT /staff/day/opening`, `POST /staff/day/close`                                   |
| Commission "Mark paid" (payout ledger)      | `POST /staff/payouts`                                                               |
| Daily checklist                             | `GET /staff/checklist`, `PUT /staff/checklist/:taskId`                              |
| Manager expenses                            | `POST /staff/expenses`                                                              |
| Admin → Overview (incl. custom date range), Branch detail, Sessions, Customers, Retention, Employees, Commission, Monthly | `GET /admin/reports/*` |
| Admin → Branches, Staff, Menu pricing, Expenses | `/admin/branches`, `/admin/staff`, `/admin/services`, `/admin/transactions`     |
| Admin → Salary payment                      | `POST /admin/salary-payments`                                                       |
| Admin → Settings (checklist, PINs)          | `/admin/checklist`, `/admin/branches/:id/role-pins/:role`, `PATCH /admin/auth/pin`  |
| Admin → Products / billing catalogue        | `/admin/products` (CRUD), `GET /staff/products` (active only)                       |
| Settings → viewing branch / admin PINs      | `GET /admin/branches/:id/role-pins/values`, `GET /admin/auth/pin`                   |
| Staff / branch / product photos             | `POST /admin/uploads/image` (stored in Supabase Storage bucket `cave-media`)        |

## Installing as an app (PWA)

The frontend is an installable PWA: `public/manifest.webmanifest`, `public/sw.js` and the icons in `public/icons/`.
Open it over HTTPS (or localhost) in Chrome/Edge and use **Install app** on the sign-in screen, or on iOS Safari
use Share → Add to Home Screen. The service worker only caches the app shell, never API data, and is registered
in production builds only (`pnpm build && pnpm preview` to try it). On tablets the staff app keeps its phone
layout in a centred column; the admin area uses the full width.

## Data freshness

Screens show their last result instantly when you come back to them and refresh quietly in the background
(`hooks/useAsyncData.ts`). Everything also re-checks the server every 30 s while the app is visible and when it
returns to the foreground; the admin header has a manual refresh button.

## Notes on how numbers are defined

- **Revenue** = what customers paid minus tips (services + products, after discount). Tips are tracked separately.
- **Net in hand** = revenue + tips − expenses − advances − commission paid − tip withdrawals.
- **Cash / GPay collected** = session totals by the bill's payment mode (a bill has one mode, so a tip's mode follows it).
- **Commission** follows the staff member's model: flat %, or the slab reached by month-to-date revenue. The
  "daily target" model has no percentage configured in the backend, so it accrues nothing.
- Business days roll over at midnight **IST**.
- **PINs are viewable** in Admin → Settings: login still checks the bcrypt hash, but an AES-GCM encrypted copy is kept (key: `PIN_VAULT_KEY`, falling back to `JWT_SECRET`). PINs set before this existed show "Set a new PIN to view it here" until saved once more.
- **Phone numbers** everywhere are 10-digit Indian mobiles starting 6-9 (a pasted +91 is stripped).
- Customers are tracked by phone number; walk-ins without one don't appear in the customer directory or retention.
