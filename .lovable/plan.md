# Add IBAN to Bank Details

Extend the existing payout details (currently: account holder, bank name, account number) to also collect **IBAN** and optional **SWIFT/BIC**, and show/manage them from the user profile.

## Database

Add two columns to `public.profiles`:
- `bank_iban` (text, nullable)
- `bank_swift` (text, nullable)

No backfill needed — existing rows stay null.

## BankDetailsModal changes (`src/components/BankDetailsModal.tsx`)

- Add two new fields to the form: **IBAN** (required) and **SWIFT/BIC** (optional).
- Extend zod schema:
  - `bank_iban`: trimmed, uppercased, spaces stripped, 15–34 chars, regex `^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$`.
  - `bank_swift`: optional; if provided, 8 or 11 chars, regex `^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$`.
- Keep `bank_account_number` required (some local payouts still need it).
- Save all five fields to `profiles` on submit.

## Profile UI (`src/pages/UserProfile.tsx`)

Add a **Payout details** card visible only to the logged-in owner (own profile view), in the same area as other personal info (Settings tab or near phone/DOB):

- Shows: Account holder, Bank name, Account number (masked, e.g. `••••1234`), IBAN (masked, e.g. `NL•• •••• •••• 1234`), SWIFT.
- Empty state: "No payout details on file" with an **Add payout details** button that opens `BankDetailsModal`.
- When details exist: an **Edit** button opens the same modal pre-filled with current values.

Modal updates needed to support edit mode:
- Accept optional `initialValues` prop and seed `form` state from it.
- Title/description swap to "Edit payout details" when editing.

## Files to change

- New migration: add `bank_iban` and `bank_swift` to `profiles`.
- `src/components/BankDetailsModal.tsx` — new fields, validation, optional `initialValues` prop, edit-mode copy.
- `src/pages/UserProfile.tsx` — fetch bank fields for own profile, render Payout details card, wire Add/Edit modal.
- `src/integrations/supabase/types.ts` — auto-regenerated.

## Out of scope

- No changes to `CreateListing` flow (it keeps using the same modal; will now also collect IBAN at first listing).
- No verification/validation against real bank registries — format validation only.
