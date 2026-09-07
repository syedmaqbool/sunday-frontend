# 0002 — Show buyer manual-verification states

Title: Show buyer manual-verification states
Type: AFK
Triage label: ready
Status: ready-for-agent
User stories covered: A buyer can understand the review status of a manual payment, see rejection feedback, resubmit proof, or cancel before approval.

## What to build

Extend buyer order confirmation and order-history views to render manual verification state from the API rather than inferring it from PayFast payment polling. Support pending/submitted, approved, rejected, resubmission-requested, cancelled, and expired outcomes.

For rejected or resubmission-requested orders, provide a resubmission dialog using the same required sender fields and screenshot flow. For active unapproved orders, provide cancellation with confirmation and refresh the order state after the mutation. Preserve historical PayFast confirmation behavior where needed for legacy orders, but do not poll or offer PayFast retry for manual submissions.

Keep API response shapes raw through services/query modules and compute display labels, masking, and formatting in the consuming UI. Use exported query key factories for invalidation.

## Acceptance criteria

- [x] Order confirmation shows a clear manual-verification status and the order expiry/review deadline when available.
- [x] Pending, approved, rejected, resubmission-requested, cancelled, and expired states have distinct user-facing messaging.
- [x] Rejection/resubmission reasons are shown without exposing private proof URLs or full account data.
- [x] Resubmission is available only when the backend says it is allowed and reuses the required sender fields plus screenshot upload validation.
- [x] Resubmission does not create a second order and refreshes the same order's latest submission state.
- [x] Cancellation is available only when allowed, confirms intent, invalidates the owning order query, and updates cart/listing state according to the API response.
- [x] Manual submissions do not trigger PayFast polling or PayFast retry controls.
- [x] Existing legacy PayFast order confirmation/callback handling is not broken.
- [x] Tests cover each state, rejection reason, resubmission, cancellation, loading, conflict, and error behavior.

## Blocked by

- Backend 0051 — Support manual-payment cancellation and resubmission
- Backend 0053 — Notify manual-payment verification events
- Frontend 0001 — Replace PayFast checkout with manual-payment dialog
