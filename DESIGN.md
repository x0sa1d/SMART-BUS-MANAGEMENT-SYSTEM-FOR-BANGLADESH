# DESIGN.md — Bugos / Smart Bus Management

Grounding document for UI generation. Tokens match `src/app/globals.css`.
Do not invent a second palette.

## 1. Visual Theme & Atmosphere

Warm-cream travel desk. Forest green is the brand and the action.
Ticket orange is 10% — prices, tickets, and booking highlights only.
Tickets must not look like another dashboard.

- Mood: travel-focused, trustworthy, operational
- Density: medium (Taste DENSITY)
- Motion: low (Taste MOTION) — 180–350ms
- Boldness: medium (Taste BOLD)
- Balance: 70% cream/white · 20% forest green · 10% ticket orange

## 2. Color Palette & Roles

| Token | Hex | Role |
|---|---|---|
| Forest green | `#174D3A` | Header, footer, sidebar, primary CTA, selected seat |
| Warm cream | `#F7F3E9` | Page background, passenger UI |
| Ticket orange | `#F28C28` | Tickets, prices, booking highlights |
| Pure white | `#FFFFFF` | Cards, modals, inputs, available seats |
| Charcoal | `#292B26` | Headings |
| Body | `#62645E` | Body text |
| Muted | `#92938B` | Secondary text |
| Sand | `#E8E2D5` | Borders, dividers, disabled |
| Primary light | `#E5EFE9` | Selected filters, tinted rows |
| Success | `#27845B` | Available / confirmed |
| Warning | `#E9A23B` | Pending |
| Error | `#D94B45` | Cancelled / destructive |
| Information | `#3979B7` | Informational |
| Unavailable seat | `#D9D9D3` | Booked / blocked seats |
| Serial brown | `#5C3D1E` | Ticket serial numbers |

Dark mode may lighten forest green to `#2A7A5C` and orange to `#F5A24A`. Do not switch semantic roles.

## 3. Typography Rules

- UI sans: Inter (`--font-inter`)
- Mono: Geist Mono (ticket serials, IDs)
- Headings: 600–700, tracking `-0.02em`, line-height 1.15
- Body: 400–500, line-height 1.6
- Section labels: 11px, bold, uppercase, tracking `0.2em`, forest green
- Hero: 2.6rem mobile → 5–6xl desktop
- Card title: ~1.05–1.2rem semibold

## 4. Component Stylings

- Primary button: forest green, white text, radius 10px, min height 44–48px
- Ticket / price accent: orange, never as the default button
- Cards: 14px radius, 1px sand border, `shadow-soft`
- Header/footer: solid `#174D3A`, 3px orange hairline under header
- App sidebar: forest green; active item is white/15
- Search panel: white card, 4px forest→orange bar
- Inputs: 11px uppercase green labels, 48px height, white fill, green focus ring
- Icons: Lucide outline only. No emoji tiles.

## 5. Layout Principles

- Container + 16px page padding
- Search: 1 column mobile, 2 tablet, 5 desktop
- Results: filters collapse under a button below `lg`
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48
- Touch targets: 44×44px on mobile, never below 24×24px

## 6. Depth & Elevation

```
shadow-soft:    0 12px 30px -14px rgba(23,77,58,0.18)
shadow-soft-lg: 0 24px 48px -20px rgba(23,77,58,0.24)
```

Elevation is forest-tinted. Tickets may use orange-tinted shadow.

## 7. Do's and Don'ts

Do:
- Read this file before any UI change
- Keep green for brand/CTA and orange for tickets/prices
- Show a spinner on every pending async button
- Verify in the browser after visual work

Don't:
- Purple-to-blue gradient headlines
- Emoji icon tiles on features
- `user-scalable=no` or `maximum-scale=1`
- A second unrelated brand (Stripe purple, Linear violet)
- Paint tickets in dashboard green

## 8. Responsive Behavior

- Breakpoints: sm 640, md 768, lg 1024, xl 1280
- Header nav hides below `lg`; hamburger takes over
- Date ribbon is horizontal scroll
- Filters are a drawer/toggle on small screens

## 9. Agent Prompt Guide

Build like a Bangladesh intercity ticket desk on warm cream paper:
forest-green frame, orange ticket stamp, white surfaces.
If a mock looks like a generic SaaS landing page, it is wrong.
