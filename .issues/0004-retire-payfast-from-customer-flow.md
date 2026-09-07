# 0004 — Retire PayFast from the customer flow

Title: Retire PayFast from the customer flow
Type: AFK
Triage label: ready
Status: ready-for-agent
User stories covered: New customers never encounter PayFast screens or retry controls, while historical PayFast orders remain understandable and compatible.

## What to build

Remove PayFast success/cancel/polling/retry behavior from the new manual-payment checkout and order-confirmation experience. Keep any route/components required to render historical PayFast orders safely, but make them unreachable from newly created manual orders and avoid showing gateway controls for manual verification states.

Update frontend API types, services, query options, and UI branches to match the backend's manual-payment response contract. Do not map server payloads into duplicate domain models; derive display state at the consuming component boundary.

## Acceptance criteria

- [x] New manual orders do not navigate to PayFast success/cancel routes or submit hidden gateway forms.
- [x] Manual orders do not poll for gateway payment status and do not show PayFast retry controls.
- [x] Existing historical PayFast order callbacks/routes remain safe and render their historical result when applicable.
- [x] Obsolete new-flow PayFast assumptions are removed from checkout and order confirmation types/queries without deleting compatibility code needed by legacy orders.
- [x] Cart clearing and order-confirmation navigation follow the manual submission contract.
- [x] Tests prove manual and legacy PayFast branches are selected correctly and no gateway request is made for manual orders.
- [x] The frontend test suite and type check pass.

## Blocked by

- Backend 0054 — Retire PayFast from new checkout
- Frontend 0001 — Replace PayFast checkout with manual-payment dialog
