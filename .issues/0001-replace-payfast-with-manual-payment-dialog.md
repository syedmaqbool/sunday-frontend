# 0001 — Replace PayFast checkout with manual-payment dialog

Title: Replace PayFast checkout with manual-payment dialog
Type: AFK
Triage label: ready
Status: completed
User stories covered: A buyer completes checkout by seeing the store's payment account, entering sender details, and uploading transaction proof instead of being redirected to PayFast.

## What to build

Replace the current Place Order → PayFast form submission with a manual-payment dialog. Keep the existing shipping, discount, coupon, authentication, and server-total behavior. After the checkout form is valid, open a dialog that loads read-only recipient payment instructions and collects the required sender account title/name, sender account number, and transaction screenshot.

Upload the screenshot through the backend upload contract, then submit the checkout order with the returned proof file ID and sender fields. The order must not be created when the dialog is cancelled or incomplete. On successful creation, clear the cart and navigate to the order confirmation page showing that payment is pending manual verification.

Follow the repository's form/query conventions: use `react-hook-form`, Zod, and the resolver; keep raw API responses in services/query hooks; keep cache keys and mutations in their owning query modules; put module types in `src/types` and tests under the root `tests` directory.

## Acceptance criteria

- [x] Place Order opens the manual-payment dialog after shipping-form validation and does not submit to PayFast.
- [x] The dialog displays the configured recipient account title, account number, and bank/wallet label as read-only instructions.
- [x] Sender account title/name, sender account number, and screenshot are all required and validated before submission.
- [x] Screenshot upload shows progress/loading/error state, accepts only the backend-supported image types, and passes the returned file ID to order creation.
- [x] Dialog cancellation or validation failure creates no order and leaves the cart unchanged.
- [x] Double submission is prevented while upload/order creation is in progress.
- [x] Successful submission clears the cart and navigates to the created order confirmation; failed submission preserves entered values where safe and shows the server error.
- [x] Existing shipping address, discount, coupon, authentication, and server-calculated total behavior remains intact.
- [x] PayFast payment fields, hidden-form submission, and gateway URLs are not used by this new flow.
- [x] Checkout, validation, upload/error, and successful-submission tests are added under `tests` and pass with the existing test suite.

## Blocked by

- Backend 0049 — Add payment instructions and protected proof files
- Backend 0050 — Create orders with manual payment proof
