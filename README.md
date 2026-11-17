# Sunday Frontend

React web app for the Sunday fashion marketplace (storefront, seller tools, and admin). It talks to the `sunday-backend` API.

## Stack

- React 18, TypeScript, Vite (via Vite+ `vp`)
- Tailwind CSS and shadcn/ui (Radix)
- TanStack Query for server state, `ky` as the HTTP client
- `react-hook-form` with `zod` for forms
- Vitest and Testing Library for tests

## Prerequisites

| Tool       | Version                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| Node.js    | 22.22.1 or newer in the 22.x line, 24.11.0 or newer in the 24.x line, or 26.0.0 or newer |
| Git        | 2.32.0 or newer (pre-commit checks)                                           |
| npm / pnpm | Either one                                                                    |
| Backend    | The `sunday-backend` repository running locally (see its README)              |

## Quick start

1. Clone both repositories side by side:

   ```text
   sunday/
   ├── sunday-backend/
   └── sunday-frontend/
   ```

2. Set up and start the backend first. Follow `sunday-backend/README.md`: install, create `.env`, run `migrate:latest` and `seed:run`, then `start:dev`. It listens on `http://localhost:3000`.

3. Install and start the frontend:

   ```sh
   npm install      # or: pnpm install
   npm run dev      # or: pnpm dev
   ```

4. Open the URL printed in the terminal. Vite's default is `http://localhost:5173`.

5. Make sure the backend `.env` has `WEB_APP_BASE_URL` set to that URL. Email links (verification, password reset) point there.

### Log in with demo data

If you ran `npm run seed:run` in the backend, these accounts exist, all with the password `12345678`:

| Role   | Email                 |
| ------ | --------------------- |
| Admin  | `smaq.shah@gmail.com` |
| Buyer  | `buyer@example.com`   |
| Seller | `seller@example.com`  |

## Environment

| Variable            | Purpose                       | Default if unset        |
| ------------------- | ----------------------------- | ----------------------- |
| `VITE_API_BASE_URL` | Base URL of the backend API   | `http://localhost:3000` |

The committed `.env` points at the staging API (`https://api-staging.sndymarket.com`). To develop against your local backend, create a `.env.local` file, which is gitignored and overrides `.env`:

```sh
VITE_API_BASE_URL=http://localhost:3000
```

Do not edit the committed `.env` for local needs. Restart `npm run dev` after changing any `VITE_` variable.

## Scripts

Use `npm run <script>` or `pnpm <script>`. `package.json` is the source of truth.

| Script                           | Purpose                                                     |
| -------------------------------- | ----------------------------------------------------------- |
| `dev`                            | Start the dev server                                        |
| `build`                          | Production build to `dist/`                                 |
| `build:dev`                      | Build in development mode                                   |
| `preview`                        | Serve the production build locally                          |
| `check` / `check:fix`            | Lint, format, and type-check (with or without auto-fix)     |
| `test`                           | Run the test suite once                                     |
| `test:watch`                     | Run tests in watch mode                                     |
| `test:focused`                   | Run only tests related to changed files                     |
| `typegen`                        | Regenerate API types from `api-documentation.json`          |
| `staged`                         | Auto-fix staged files (also runs on pre-commit)             |

## Before you open a PR

```sh
npm run check
npm test
```

The pre-commit hook runs the staged-file checks for you.

## API types

Types in `src/types/generated-api` are generated from the backend's OpenAPI document. Do not edit them by hand. When the backend API changes:

1. Start the backend.
2. Download `http://localhost:3000/api/documentation/json` and save it as `api-documentation.json` in this repository's root.
3. Run `npm run typegen`.

## Project structure

```text
src/
  components/   Reusable UI components (shadcn/ui lives here)
  contexts/     React contexts
  hooks/        Custom hooks (wrap query modules; never define keys here)
  lib/          Pure helpers and constants
  pages/        Route-level pages
  queries/      TanStack Query modules: cache keys, options, mutations per domain
  services/     HTTP calls via ky. Return the raw server response
  types/        <module>.type.ts files and generated API types
  AppRoutes.tsx Route table
tests/          Tests, mirroring src/ (setup in tests/setup.ts)
public/         Static assets
docs/agents/    Contributor conventions
```

## Conventions

The full rules are in [AGENTS.md](AGENTS.md). The ones you will hit first:

- Services return the raw server response. Queries and mutations return it unchanged. Reshape data only in the component, page, or UI hook that uses it.
- Each `src/queries/<domain>.query.ts` owns its cache-key factory (with `all()` and explicit leaves such as `list` and `detail`) and its `useMutation` hooks. Invalidate with exported key factories, never inline arrays.
- Use API response types as returned. Do not write mapper or adapter functions.
- Forms use `react-hook-form`, `@hookform/resolvers/zod`, and `zod`.
- Tests live in the root `tests/` directory, not in `src/`.

## Troubleshooting

- **Requests go to staging instead of local**: add `.env.local` as described above and restart the dev server.
- **Network or CORS errors**: confirm the backend is running and `VITE_API_BASE_URL` matches its address. The backend allows all origins.
- **Port 5173 is busy**: Vite picks the next free port. Update `WEB_APP_BASE_URL` in the backend `.env` to match.
- **`vp` or hook errors after install**: check your Node and Git versions against the prerequisites, then re-run `npm install` so the `prepare` script installs the hooks.
