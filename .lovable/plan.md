# Split My Listings into Approved / Pending tabs

Add two tabs to `/my-listings`:
- **Approved** — listings with `status = 'approved'`.
- **Pending** — everything else (`pending`, `rejected`, `needs_revision`).

## Changes (`src/pages/MyListings.tsx`)

- Import `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/ui/tabs`.
- Derive two arrays from the existing `listings` query:
  - `approvedListings = listings.filter(l => l.status === 'approved')`
  - `pendingListings = listings.filter(l => l.status !== 'approved')`
- Replace the single list block with a `<Tabs defaultValue="approved">` containing:
  - Trigger labels show counts: `Approved (n)` and `Pending (n)`.
  - Each `TabsContent` renders the same card UI currently used (image, title, status badge, price, feedback, Edit / Resubmit / Delete buttons).
  - Each tab shows its own empty state if its filtered array is empty (e.g. "No approved listings yet" / "Nothing pending review").
- Header count text stays as total `listings.length`.
- Loading + global empty state (no listings at all) remain unchanged.
- Keep delete + resubmit mutations exactly as they are.

No DB or other file changes.
