# 0003 — Add admin manual-payment review UI

Title: Add admin manual-payment review UI
Type: AFK
Triage label: ready
Status: completed
User stories covered: An authorized admin can find pending manual payments, inspect proof, and approve or request correction without leaving the existing orders workflow.

## What to build

Extend the existing admin orders page with a manual-verification filter/status indicator and a review dialog. The dialog must show the order and buyer context, masked sender account data in list/detail summaries, the full sender details only where authorized, the protected screenshot preview, submitted time, expiry, and prior review information.

Add explicit approve, reject-with-reason, and request-resubmission actions. Disable actions while a mutation is pending, display server errors, show success feedback, and invalidate the owning admin order/detail queries after a committed action. Respect the existing admin access-control patterns and the backend `ORDERS_UPDATE` permission.

## Acceptance criteria

- [x] Admins can filter or identify orders with actionable manual payment submissions.
- [x] The review dialog loads current backend data and does not rely on a stale list row for approval decisions.
- [x] Proof preview uses the protected proof-access contract and handles loading, denied, missing, and failed-preview states safely.
- [x] Sender account number is masked in list views and displayed fully only in the authorized review context.
- [x] Approve, reject-with-reason, and request-resubmission actions require the appropriate input and show pending/success/error states.
- [x] Staff without `ORDERS_UPDATE` cannot perform review mutations; existing admin/read access behavior remains intact.
- [x] Successful actions invalidate exported admin order query keys and update the review list without a full-page reload.
- [x] Notifications and order status links remain compatible with the existing admin notification bell.
- [x] Tests cover filtering, permissions, proof preview, each action, validation, conflict responses, and query invalidation.

## Blocked by

- Backend 0052 — Add admin manual-payment review and approval
- Backend 0053 — Notify manual-payment verification events
