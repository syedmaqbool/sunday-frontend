# Analytics Page Redesign

Rebuild `src/pages/admin/Analytics.tsx` to match the reference dashboard layout: KPI strip on top, paired chart cards in 2-column grids, a highlight stat card, and a styled leads table. Same data sources as today (orders, listings, profiles, complaints, offers) — only presentation changes.

## Layout

```text
┌─ Header: "Analytics Overview" + Export Report button ─────────────┐
│                                                                    │
├─ KPI strip (5 cards) ─────────────────────────────────────────────┤
│ Revenue | Orders | Sales Vol | Refund Rate (red ring) | Conv Rate │
│                                                                    │
├─ Order Volume (bar chart) ───────┬─ Sales Volume (% bars) ────────┤
│ Dim chips: Loc/Cat/Price/Age/Size│ Dim chips                      │
│                                                                    │
├─ Refunds (donut + legend) ───────┬─ Conversion Funnel ────────────┤
│ Dim chips                         │ Engaged → Accepted → Purchased │
│                                                                    │
├─ Avg Offers tiles (4 stat boxes) ──────────┬─ Price Variation ────┤
│ Dim chips                                   │ Big % delta (amber)  │
│                                                                    │
├─ Marketing Leads table ───────────────────────────────────────────┤
│ Avatar · Name · WhatsApp · Location · Orders · Offers · Status    │
└────────────────────────────────────────────────────────────────────┘
```

## Components & visuals

- **KPI cards** — icon chip, label, big value, +/-% delta with up/down arrow. Refund Rate card gets a subtle red ring to mirror the reference.
- **Dim chips** — pill-style toggle group inline in each card header (`Location / Category / Price Range / Age / Size`), so each chart is independently sliceable.
- **Order Volume** — Recharts `BarChart`, rounded bars, one bar highlighted in primary, others muted.
- **Sales Volume** — horizontal progress bars per bucket showing revenue share %.
- **Refunds** — Recharts donut (`PieChart` with `innerRadius`) + legend column with counts.
- **Funnel** — three stacked stages (Engaged · Offer Accepted · Purchased) for the top dim bucket; each stage = colored circle icon + label + count + thin progress bar.
- **Avg Offers tiles** — 4 stat tiles showing the avg offers value and dim bucket label (matches mockup's "3.2 / 1.8 / 5.7 / 2.4" tiles).
- **Price Variation** — amber-tinted card with large % delta (red if negative), R amount and sample count beneath.
- **Marketing Leads** — table with avatar initials chip, monospace phone, status pill (Qualified / Hot Lead / Nurturing / At Risk derived from order/offer counts), search input + Download CSV.

## Data mapping (unchanged tables)

- Revenue / Orders / Sales Vol → `orders` (sum total, count, sum item qty).
- Refund Rate → refunded `complaints` ÷ orders.
- Conv Rate → accepted `offers` ÷ all offers.
- Funnel: Engaged = unique buyer-listing pairs with an offer; Accepted = same with `status='accepted'`; Purchased = unique buyer-listing pairs in orders.
- Avg offers before order: per buyer-listing pair, count offers up to order date, average per dim bucket.
- Price variation: avg of `(accepted_amount − listing.price) / listing.price`.
- Lead status: ≥3 orders → Qualified, ≥1 order → Hot Lead, ≥1 offer → Nurturing, else At Risk.

## Notes

- Uses existing semantic tokens (`primary`, `muted`, `border`, `destructive`); accent tones (emerald/amber/rose/sky) are scoped to status pills and the price-variation card only — consistent with the warm editorial palette.
- All five dims (location, category, price range, age, size) remain selectable on each chart via the chip group.
- CSV exports preserved (per chart and for leads).
- No schema/route changes; only `src/pages/admin/Analytics.tsx` is rewritten.
