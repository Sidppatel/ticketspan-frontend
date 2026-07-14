# EntryVine Event Frontend

Single-page React app for the EntryVine multi-tenant event platform. Talks to `entryvine-event-backend` over **gRPC-Web** (the only transport for structured data). One app serves four portals (public / admin / staff / developer) selected by subdomain.

## Tech Stack

- **React 19** + **TypeScript** (strict)
- **Vite 8** (dev server + build)
- **Tailwind CSS v4** (`@tailwindcss/vite`) + shadcn-style primitives in `src/shared/ui/` (no antd)
- **Zustand** (+ persist) for auth state
- **react-router-dom v7** for routing
- **@protobuf-ts** for gRPC-Web clients generated from the backend `.proto` contracts
- **Axios** only for the `multipart/form-data` image upload endpoint

## Structure (feature-based, per RULES.md)

```
src/
  main.tsx, App.tsx          # App lazy-loads one portal route tree by subdomain
  app/                       # PublicRoutes / AdminRoutes / DeveloperRoutes / StaffRoutes + authRoutes
  shared/
    apiClient.ts             # ALL gRPC-Web clients + transport + auth interceptor (single source)
    session.ts               # callRpc() wrapper: refresh on UNAUTHENTICATED, route on PERMISSION_DENIED
    auth/                    # zustand store, useAuth, jwt decode
    roles.ts                 # Role constants 0/1/2/3/99 + guards
    subdomain.ts             # resolve portal + tenant slug from hostname (dev: ?portal / localStorage)
    upload.ts                # axios multipart -> POST /uploads/images
    theme/                   # ThemeContext + tenant branding (CSS vars)
    ui/                      # shadcn-style button/input/label/card
    components/              # ProtectedRoute, layouts, ImageUpload, status pages
    hooks/useAsync.ts
    lib/                     # cn(), format (centsToUSD, epoch)
    proto/                   # GENERATED gRPC stubs — do not edit, regen via `pnpm gen:proto`
  features/{auth,public,admin,developer,staff}/{pages,services,hooks}
```

## Build & Run

```bash
pnpm install
pnpm gen:proto     # regenerate src/shared/proto from ../entryvine-event-backend/protos
pnpm dev           # one server; switch portals locally via ?portal=admin|developer|staff or the dev nav switcher
pnpm build         # tsc -b && vite build (must be 0 warnings)
pnpm lint          # eslint flat config (custom no-business-calc rule fires here)
```

Env: `VITE_BACKEND_URL` (default `http://localhost:8000`), `VITE_GOOGLE_CLIENT_ID` (optional), `VITE_PORTAL` (dev portal default).

## Roles → Portal

| role | name | portal / access |
|---|---|---|
| 0 | Attendee | public: browse, book, my-bookings, profile |
| 1 | Admin | full admin dashboard + settings (invitations, financial) |
| 2 | Staff | check-in scanner |
| 3 | Sub-Tenant | admin minus tenant-settings (invitations/financial hidden) |
| 99 | Developer | global console; `tenants_id` null, bypasses tenant context |

Tenant + role + identity come from **JWT claims** (`tenants_id`, `role`, `tenant_slug`, `sub`); the backend `TenantResolutionMiddleware` enforces them. Developers skip tenant lookup.

## Hard rules (see ../RULES.md)

- **No comments** in any hand-written source. Generated `src/shared/proto/` stubs are exempt.
- **gRPC-Web is the only transport** for structured data. Axios only for `/uploads/images`.
- gRPC clients are instantiated **only** in `src/shared/apiClient.ts`, URL from `import.meta.env.VITE_BACKEND_URL`.
- **No business calculations in `.tsx`** — totals/cents/counts come pre-computed from the backend. The ESLint rule `event-platform/no-business-calc-in-jsx` (`tools/eslint-rules/`) enforces this at error. Currency/date math lives in `.ts` (`shared/lib/format.ts`); dollar↔cents conversion at the form boundary only.
- Files ≤ 500–600 lines. Self-documenting names, no magic numbers (roles in `shared/roles.ts`).
- Build must be **0 warnings** (chunk-size included — keep route trees code-split).

## gRPC service map

`apiClient.ts` exposes one client per backend service: auth, tenant, event, venue/performer/sponsor, tableBooking, booking/ticket/checkIn, dashboard, financial, staff, invitation, log, feedback, health. Add new RPCs to the `.proto` in the backend repo, then `pnpm gen:proto`.

## Known backend gaps (frontend is wired and waiting)

- ~~Tenant branding~~ — closed: `GetPublicTenantBranding(slug)` feeds `ThemeProvider`, which applies the tenant's seven brand colors + logo as CSS vars on the public portal; admins manage them at `/branding` (branding studio with presets, WCAG contrast checks, live preview).
- **Booking totals**: `QuoteCart` RPC provides server-computed totals/discounts (event page order summary uses it); reserve/create still send `0` cents and rely on server-side computation.
- **Fee visibility**: platform-fee figures are developer-only in reports (`GetMonthlyReport` zeroes gross/fees for non-developers). Admin sees per-ticket-type / per-table-type fees in config UIs only; admin metrics use `subtotal_cents` (their prices), never fee-inclusive totals.
