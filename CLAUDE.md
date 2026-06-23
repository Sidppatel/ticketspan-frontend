# Code829 Frontend

## Tech Stack

- **React 19** + **TypeScript** (strict)
- **Vite** (dev server + build)
- **Ant Design v6** (`antd`) — sole UI component library across all apps
- **Tailwind CSS** — utility layer for layout/spacing alongside antd
- **Zustand** for auth state
- **Axios** for HTTP (interceptors in `packages/shared/src/lib/axios.ts`)

## Monorepo Structure (pnpm workspaces)

```
code829-frontend/
├── apps/
│   ├── public/         # Public event listing & booking portal (:5173)
│   ├── admin/          # Admin dashboard & event management (:5174)
│   ├── staff/          # Staff check-in portal (:5175)
│   └── developer/      # Developer API management (:5176)
├── packages/
│   ├── shared/         # Auth, types, API clients, hooks, Zustand stores, axios setup
│   └── ui/             # Internal design-system primitives (navbar, footer, buttons) — pure React + CSS, no antd/shadcn
├── tools/
│   ├── cf-worker/      # Cloudflare Workers entrypoint (prod hosting)
│   └── eslint-rules/   # Custom ESLint rules (incl. no-business-calc-in-jsx)
└── tests/              # Playwright E2E (`playwright.config.ts` at root)
```

Workspace globs in `pnpm-workspace.yaml`: `packages/*`, `apps/*`. Each app/package has its own `package.json` and is referenced via `@code829/<name>`.

## Build & Run

```bash
pnpm install               # Install workspace deps
pnpm -r build              # Build all apps + packages
pnpm build:public          # Build a single app
pnpm dev:public            # Run one app in dev mode
pnpm lint                  # Lint all workspaces (custom ESLint rules fire here)
pnpm test:e2e              # Run Playwright tests (run `test:e2e:install` once first)
pnpm preview:public        # Preview a built app
```

The boot scripts at the monorepo root (`..\start.ps1`) start all four apps in separate terminals. Use `pnpm dev:<app>` directly when you only need one.

## Calculation Rule (architectural)

**No business calculations in React.** All totals, sums, percentages, capacities, and aggregates come from the backend as pre-computed values.

Forbidden in `.tsx` files: arithmetic (`+`, `-`, `*`, `/`, `%`, `.reduce()`) on identifiers whose name ends in `Cents`, `Count`, `Capacity`, `Seats`, `Total`, `Subtotal`, `Fee`, `Rate`, `Percent`, or `Quantity`.

Examples of violations:
- `const total = priceCents * seats;` — ask backend for a quote
- `items.reduce((sum, i) => sum + i.priceCents, 0)` — extend the quote response
- `Math.round((sold / max) * 100)` — backend should return `fillRatePct`

**Allowed:**
- Display formatting: `centsToUSD(value)`, date formatting — these are rendering, not calculation.
- Dollar→cents conversion at form input boundary before the API call: `Math.round(dollars * 100)` — this is input sanitization, not business math.
- Display-only countdowns: `Math.floor(secondsLeft / 60)` for UI timers.

**When adding a new aggregate:**
- Extend the relevant quote endpoint (`POST /bookings/quote`) with new fields.
- Or add a backend stats endpoint (e.g., `GET /admin/events/{id}/stats`) backed by a view/SP.
- Never shortcut by doing the math in the component.

**Authoritative pricing pattern:** `packages/shared/src/hooks/usePurchaseQuote.ts` calls `POST /purchases/quote` and returns `PublicQuote` (`displayTotalCents`, `formattedDisplayTotal`, `seatsIncluded`) — used on browse/cart/capacity/select-table panels where guests see a single rolled-in display number. For the checkout step (where tax appears), `packages/shared/src/hooks/useCheckoutQuote.ts` calls `POST /purchases/checkout-quote` and returns `CheckoutQuote` (`displayTotalCents`, `taxCents`, `grandTotalCents`, `formattedDisplayTotal`, `formattedTax`, `formattedGrandTotal`). Both hooks are backed by VMs that re-fetch whenever selection changes. Mirror this split for any new priced flow.

**PR checklist:** reviewer confirms no new arithmetic on `*Cents`/`*Count`/`*Capacity`/etc. in `.tsx` files, except the narrow allowed exceptions above.

**ESLint rule `event-platform/no-business-calc-in-jsx`** in `tools/eslint-rules/` enforces this on every `pnpm lint` at **Error** severity — new offenses fail lint. Fires on `+` `-` `*` `/` `%` and `.reduce()` when the operand identifier or member-access name ends in a business-domain suffix. `Math.round` / `Math.floor` / `Math.min` / `Math.max` / `Math.abs` are escape hatches (use for input rounding or display timers). Form-boundary conversions: use `centsToDollars(cents)` and `dollarsToCents(dollars)` from `@code829/shared/utils/currency` so the single arithmetic lives in a `.ts` file (not subject to this rule). Per-line escape hatch: `// eslint-disable-next-line event-platform/no-business-calc-in-jsx -- <reason>`.

## Hosting & Deploy

- **Production** runs on **Cloudflare Workers** via `tools/cf-worker/`. Built static assets are uploaded; the worker serves them and proxies API calls.
- `wrangler` is in `devDependencies` — use `pnpm wrangler ...` for deploy/inspect commands.
- The four apps are deployed as separate workers (one per subdomain).

## Required Skills

To work on the frontend you need fluency in:

- **TypeScript (strict mode)** — generics, discriminated unions, `as const`, proper narrowing
- **React 19** — hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useTransition`), Suspense boundaries, server/client component model awareness
- **Vite 8** — config, plugins, env vars (`import.meta.env`), HMR boundaries
- **Ant Design v6** — forms (Form/Form.Item), tables (Table/ProTable patterns), Modal/Drawer/message, theme tokens via ConfigProvider
- **Tailwind CSS** — utility-first styling for layout/spacing; theming via CSS variables
- **Zustand** — store creation, selectors, persist middleware (used for auth state in `packages/shared`)
- **Axios** — interceptors, auth token injection (see `packages/shared/src/lib/axios.ts`)
- **pnpm workspaces** — `--filter`, workspace protocol (`workspace:*`), recursive scripts (`-r`)
- **ESLint flat config** (`eslint.config.js`) + writing custom rules when extending `tools/eslint-rules/`
- **Playwright** — page object pattern, fixtures, parallel execution
- **Cloudflare Workers / wrangler** — `wrangler.toml`, KV bindings, asset uploads (only when touching `tools/cf-worker/`)
- **JWT + magic-link auth flows** — token storage, refresh, logout

Domain-specific knowledge that compounds: the no-business-calc rule above (always think "ask the backend"), the `usePurchaseQuote` pattern, role-gated routing per-app, optimistic UI vs. server-confirmed state.

See [../SKILLS.md](../SKILLS.md) for the full list of project-specific (non-generic) frontend skills.

## Application Map (graphify) — required workflow

The dependency map for this repo lives in `graphify-out/` (and a monorepo-wide one at `..\graphify-out\`). Index: [../APPLICATION_MAP.md](../APPLICATION_MAP.md).

**Before changes:**
- Read the wiki pages for files you'll touch (`graphify-out/wiki/<Name>.md`).
- Note god nodes in `GRAPH_REPORT.md` — they have non-obvious downstream consumers (e.g., anything imported across `apps/*`).
- Use `graphify explain "<NodeName>"` or `graphify query "<question>"` for targeted lookups.

**After every commit:**
- `graphify update .` (run automatically by post-commit hook if installed via `graphify hook install`).
- The map being out of sync = unfinished change.
