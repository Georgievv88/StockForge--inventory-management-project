# StockForge

Inventory management with React, Express, and MongoDB.

## Local setup

1. Run `npm install` in `backend` and `frontend`.
2. Configure `backend/.env` with `MONGO_URL` (include your database name), a random `JWT_SECRET` of at least 32 characters, and optionally `FRONTEND_URL=http://localhost:5173` and `PORT=5000`. Do not commit secrets.
3. Start the backend with `npm run dev` and the frontend with `npm run dev` in their respective directories. Restart the backend after changing `.env`.
4. To create the first administrator, set `ADMIN_NAME` and `ADMIN_EMAIL` in the backend environment and run `node scripts/createAdmin.js` from `backend`. Enter a password of at least 12 characters (at most 72 UTF-8 bytes). The script refuses to create another initial admin if one already exists.
5. Sign in. Existing users without an `isActive` field default to active when loaded; explicitly inactive users cannot sign in.

The frontend defaults to `http://localhost:5000/api`; set `VITE_API_URL` in `frontend/.env` to change it. `FRONTEND_URL` must match the frontend origin exactly. Production cookies require HTTPS. Inventory writes, invitation acceptance, and team access updates use MongoDB transactions, so use Atlas or a replica set. Stock changes and their history commit together. A standalone MongoDB server does not support these workflows.

## Access and invitations

- Signed-out visitors cannot read or change inventory.
- Staff can view the dashboard and reports, add/edit products, adjust stock, and update their own profile/password.
- Administrators also delete products, invite teammates, revoke pending invitations, and change other users' roles and active status from Settings. They cannot deactivate or demote themselves.
- Share invitation links manually; the app does not send email. Links expire after 48 hours and can be used once. The invited email and role come from the server record, not from registration input.
- Sessions use an HTTP-only cookie with an eight-hour lifetime. Logout clears the browser cookie. Password changes and admin access changes invalidate existing sessions using a per-user token version. Login attempts are limited per IP in the API process; use a shared limiter store if deploying multiple replicas.

## Review checklist

1. Visit `/products` while signed out: expect a redirect to login. Direct API access should return 401.
2. Sign in as admin, reload the page, and verify the session remains available.
3. Create an invitation, open its link in a private window, register, and sign in as staff. Add a product and use Edit to change its details and quantity. Deletion and invitations remain unavailable (403 for direct requests).
4. As admin, add/edit/delete a temporary product. Duplicate SKUs and invalid values should return errors without leaving the UI stuck.
5. Sign out and confirm protected pages are inaccessible. Used invitation links must fail on a second registration.

Run `npm test` in `backend` for isolated API regression tests (database model calls are mocked; no real records are changed). Run `npm run lint` and `npm run build` in `frontend`.

## Completed workflows

- **Stock Movements:** stock in, stock out, or an exact physical count with a required reason. History includes product/SKU snapshots, actor, date, and before/after quantities; it remains available after product deletion. History supports search, type filters, and pagination.
- **Reports:** inventory units, cost value, retail value, potential margin, category breakdown, low/out-of-stock products, and inventory/low-stock CSV exports. Values are in MKD. There is no sales ledger, so potential margin is not realized revenue or profit.
- **Settings:** profile name, current-password-verified password changes, admin team roles/activation, invitation creation, and pending invitation revocation.
- **Usability:** responsive navigation, visible errors and loading/empty states, session expiration handling, and a 404 page.

Existing inventory is not migrated or reset. Historical movements are not fabricated: the audit trail starts when this version records a change. Product creation records opening stock; product-editor quantity changes and deletion also record movements. Quantities must be nonnegative whole numbers. Removals cannot exceed available stock. Edits require `expectedVersion` (the product's `__v`) and return 409 on stale data; refresh the page to load the latest product before trying again.

## Additional review steps

6. As staff, open Stock Movements, receive units, remove units, and enter a physical count. Verify history, product quantity, and report totals agree. Try removing more units than are available: it must fail.
7. Open the same product in two tabs. Save a change in one, then try saving the older form: it must show a conflict instead of overwriting new data.
8. Export both reports and check the CSV values. Text beginning with formula characters is escaped for spreadsheet safety.
9. Change your profile name. Change your password with your current password; sign in again using the new one.
10. As admin, invite a teammate, revoke an unused invitation, change a teammate's role, and deactivate/reactivate their account. Access changes end that user's existing sessions.

## Browser smoke test

`backend/scripts/browserSmoke.cjs` serves the built frontend on port 5178 and an isolated API with in-memory model fixtures. It exercises real browser navigation and API handlers without connecting to MongoDB. It covers staff create/edit/stock, report CSV downloads, profile updates, admin invitation/revocation/access controls, protected routes, and mobile width. Screenshots are written to ignored `artifacts/`.

Install Playwright separately (`npm install --no-save playwright` and `npx playwright install chromium` in backend), or set `PLAYWRIGHT_MODULE` to an existing Playwright module directory. Build the frontend, then run `node scripts/browserSmoke.cjs` from backend. No test credentials or fixtures are used by the normal server.

The automated API and browser suites use isolated model fixtures. They do not verify live Atlas transaction behavior, deployment networking, or email delivery. Invitations are intentionally shared manually. Use the review steps above against your configured database before deploying.


## Appearance

Settings ? Appearance ? Night mode switches the entire site between dark forest and warm light palettes. Dark is the initial default. The preference is stored in this browser, survives reloads, and synchronizes across tabs; it is not an account-wide setting. The landing-page preview is illustrative sample data, not a live inventory summary.
