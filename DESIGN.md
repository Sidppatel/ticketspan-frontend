# EntryVine "Box Office" Design System

**The single source of truth** for UI/UX, themes, shadcn components, and animation across the EntryVine event platform. If a styling decision isn't here, it isn't a standard. Tokens live in `src/index.css` — this document mirrors and explains them.

Peer set we measure against: **Ticketleap, Eventbrite, TickPick, Vivid Seats**. The job: make browsing and booking effortless on a phone, and make the organizer console legible on a desktop.

---

## 1. Philosophy

Warm, premium, **friendly** ticketing — not a cold dashboard. Every screen answers the four zero-friction questions instantly:

1. **What's interactive?** — clear hover/active states, one consistent affordance per control.
2. **What happens next?** — explicit button labels (`Buy tickets`, not `Submit`), loading skeletons.
3. **Where am I?** — active nav indicator (marigold), breadcrumbs, page titles.
4. **Did it work?** — immediate toast / animation feedback on every action.

**Mobile-first.** Design for 375px, then enhance to 1440px. Desktop is the mobile flow widened, never a desktop layout shrunk. Some dense organizer tables legitimately don't fit a phone — that's fine; they get horizontal scroll or a card fallback, not a broken grid.

---

## 2. Color tokens (light-only)

All color flows through CSS variables in `src/index.css`. **Never hardcode hex in components** — use the Tailwind token utilities (`bg-primary`, `text-foreground`, `border-border`, …).

| Token | Hex | Use |
| --- | --- | --- |
| `--background` | `#FBF6F0` | warm porcelain page canvas (60%) |
| `--foreground` | `#241522` | plum ink — headlines + primary text |
| `--card` / `--popover` | `#FFFFFF` | clean surfaces for depth on the warm canvas (30%) |
| `--muted` / `--accent` | `#F4ECE3` | soft warm panels, hover highlights |
| `--muted-foreground` | `#6B5A66` | plum-gray body, labels, metadata |
| `--primary` | `#A4123F` | **cranberry — the only CTA fill** (Buy tickets, Register, Pay) |
| `--primary-foreground` | `#FFF7F2` | text on cranberry |
| `--secondary` | `#F0E6DB` | warm-sand secondary buttons / badges |
| `--marigold` | `#F5A524` | **signature voltage** — prices, urgency, ticket perforation, active nav |
| `--marigold-foreground` | `#5A3B00` | readable dark-gold text on a marigold tint |
| `--success` | `#2F7D5B` | confirmed / purchased |
| `--warning` | `#C9871F` | limited availability |
| `--destructive` | `#B3261E` | errors, payment failures |
| `--border` / `--input` | `#E7D9CB` | warm hairlines |
| `--ring` | `#A4123F` | focus ring = brand cranberry |

`--amber` is kept as a back-compat alias of the marigold family (existing components use `text-amber-foreground`, `bg-amber/15`). New code should prefer `marigold`.

### Don'ts

- **No pure black** (`#000`) for ink — plum `#241522` is warmer and premium.
- **No blue links.** Inline links are cranberry (`text-text-link`). Blue breaks the warm ecosystem.
- **Marigold is rationed.** It appears only at the ticket perforation, prices, urgency badges, and the active nav indicator. Cranberry is the only *action* color. Spend boldness in one place.
- No second accent. If a screen needs "another color," it needs better hierarchy instead.

---

## 3. Typography

| Role | Family | Where |
| --- | --- | --- |
| Display | **Bricolage Grotesque** (`font-display`, var `--brand-font-display`) | `h1`–`h3`, prices, big numbers — the marquee voice |
| Body / UI | **Inter** (`font-sans`) | paragraphs, labels, buttons, inputs |
| Mono | **JetBrains Mono** (`font-mono`) | ticket codes, booking IDs, seat labels — reads as a serial number |

Headings already get `font-display`, `letter-spacing: -0.01em` from the base `h1,h2,h3` rule. Scale: page title `text-2xl md:text-3xl font-bold`, section `text-lg font-semibold`, body `text-sm`/`text-base`, meta `text-xs text-muted-foreground`. Prices use `font-display` + `text-marigold` (or marigold-foreground on tint).

---

## 4. Responsive rules (375 → 1440)

| Element | Mobile (375–768) | Desktop (768+) |
| --- | --- | --- |
| Layout | single-column stack, 16px margins | up to 12-col, max-width ~1280px, 24px gutters |
| Inputs | full-width, **≥48px** tall | inline multi-column, ~720px form wrapper |
| Nav | bottom tab bar (public) / hamburger `Sheet` | sticky top header |
| Overlays | bottom `Drawer` (vaul) | centered `Dialog` |
| Primary action | sticky bottom action bar (`Buy tickets`) | inline button / sidebar booking block |
| Data tables | card list or horizontal scroll | full table with pagination |

Rule of thumb: a `Dialog` on desktop becomes a bottom `Drawer` under 768px.

---

## 5. shadcn component standards

Primitives live in `src/shared/ui/` (new-york style, Radix + Tailwind, `cn` from `@/shared/lib/cn`). Available: `button` `card` `badge` `dialog` `sheet` `drawer` `popover` `select` `input` `textarea` `label` `field` `separator` `switch` `calendar` `date-time-picker` `tabs` `skeleton` `sonner`.

- **Button** (`button.tsx`) — variants `default` (cranberry CTA), `outline`, `ghost`, `destructive`; sizes `sm/default/lg/icon`. `default` size is 40px; use `lg` (48px) for primary mobile CTAs to hit the touch target.
- **Card** (`card.tsx`) — `<Card interactive>` adds hover lift (`-translate-y-1`) + marigold border. White surface on warm canvas.
- **Badge** (`badge.tsx`) — cranberry pill by default; override class for status (success/warning/marigold urgency).
- **Drawer** — bottom sheet for mobile booking summaries and actions.
- **Skeleton** — **always preferred over spinners** for async lists (events, tickets, dashboard). Mirror the real layout.
- **Sonner `<Toaster />`** — mount once at app root. Bottom-center on mobile, top-right on desktop; auto-dismiss ~4s. Action keeps its verb through the flow (`Publish` button → `Published` toast).
- **Tabs** — segmented views (e.g. organizer dashboard sections).
- **Dialog** — max-width ~640px, high-priority desktop choices; map to `Drawer` under 768px.

Map directly to token utilities. No inline color styles.

---

## 6. Signature: the ticket stub

The memorable device. A **marigold perforated tear line** with two notches bitten out at the ends, separating the "keep" stub from the event body — it encodes real structure (what you tear vs. what you keep), it's not decoration.

```tsx
<div className="overflow-hidden rounded-lg border border-border bg-card">
  <div className="p-4">{/* event info */}</div>
  <div className="entryvine-ticket-edge" style={{ ['--entryvine-notch' as string]: '#FBF6F0' }} />
  <div className="p-4 font-mono text-sm">{/* booking code, the stub */}</div>
</div>
```

`.entryvine-ticket-edge` (in `index.css`) draws the dashed marigold line + end notches. The notch fill defaults to the page canvas; set `--entryvine-notch` to the surface color when the edge sits inside a non-canvas element (e.g. `#ffffff` inside a white card). Use it on **event cards, the checkout order summary, and the My Bookings ticket.**

---

## 7. Animation & motion

GSAP (`gsap` + `@gsap/react`) is the motion engine. **All motion is gated on `prefers-reduced-motion`** — the `usePageEntrance` hook uses `gsap.matchMedia`, and the `index.css` keyframes are disabled in the reduced-motion block.

- **Page entrance** — `usePageEntrance()` (`src/shared/hooks/usePageEntrance.ts`): staggered fade-up of a page's children. Already wired into layouts via `ref={page} key={pathname}`.
- **List stagger** — event/ticket grids fade up with a small per-item delay (CSS `animationDelay` on `.entryvine-page`, or GSAP stagger).
- **Sticky buy-bar** — slides up on mount (`entryvine-slide-*` curve `cubic-bezier(0.32,0.72,0,1)`).
- **Urgency** — `.entryvine-urgent` (marigold pulse) **only** on "selling fast" / "limited" — never ambient.
- **Hover** — cards lift 1px + marigold border; buttons `active:scale-[0.97]`.

Keep it subtle and fast (200–500ms). No bouncing, no spinning. Extra motion reads as noise.

---

## 8. Ship checklist

- [ ] Touch targets ≥ **44px** on mobile (inputs/buttons).
- [ ] Text/background contrast meets **WCAG AA** (4.5:1).
- [ ] Async lists show **skeletons**, not spinners or blank space.
- [ ] Visible **focus ring** (`ring-2 ring-ring ring-offset-2`) on every focusable.
- [ ] Keyboard-navigable; `Dialog`/`Drawer` trap and restore focus (Radix/vaul default).
- [ ] No hardcoded hex; all color via tokens.
- [ ] Reduced-motion disables every animation.
- [ ] Empty states invite an action; errors say what broke and how to fix it, in the interface's voice.

---

## 9. Constraints (from repo `CLAUDE.md` / `RULES.md`)

- **No comments** in hand-written source — design rationale lives *here*, not in code.
- No business calc in `.tsx` (ESLint `no-business-calc-in-jsx`); prices/totals arrive pre-computed, components only display.
- Files ≤ 500–600 lines; `pnpm build` must be **0 warnings**; keep route trees code-split.
