# Frontend → Backend RPC requests

RPCs the redesigned frontend is wired (or ready) for. Add to `entryvine-event-backend/protos`, then `pnpm gen:proto` here.

## 1. Public tenant resolution (blocker for anonymous browsing)
`TenantService.GetPublicTenantBySlug(slug) → { tenantsId, name, slug }`
Anonymous — middleware currently resolves tenant from JWT only; public browsing needs subdomain slug resolution server-side.

## 2. Tenant branding (unlocks tier-1 white-label)
`TenantService.GetTenantBranding(slug) → { primaryColor, accentColor, logoImageId, fontFamily, voltage }`
Anonymous. Frontend consumer already exists: `applyBranding()` in `src/shared/theme/branding.ts` sets `--brand`, `--voltage-accent`, `--font-body-stack`, `--voltage`. `voltage` is 0..1 (calm ↔ energetic), drives motion/type intensity.

## 3. Event card projection (kills client-side gaps on Discover)
Extend `ListEvents` response items (or add `ListPublicEventCards`) with:
- `from_price_cents` (min active tier price, server-computed)
- `availability` enum: `Available | Low | SoldOut`
- `venue_name`
Currently cards cannot show price/venue/availability honestly, so they show none.

## 4. Event updates feed (repeat-visit loop)
`EventService.ListEventUpdates(eventsId, sinceEpoch) → [{ kind: DateChanged|LineupAdded|TicketsReleased|Announcement, message, atEpoch }]`
Frontend ships an interim localStorage diff (`src/features/public/lib/eventMemory.ts` + `DeltaStrip`); this RPC replaces it with authoritative data and enables the tenant-home announcements rail.

## 5. Verify: quoteCart
`quoteCart` exists in `paymentService` and the event page relies on it for all totals. CLAUDE.md still says "no quote RPC" — update CLAUDE.md if the RPC is live, or prioritize it if it's a stub.
