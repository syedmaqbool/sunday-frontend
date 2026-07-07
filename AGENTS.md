## Query Conventions

All TanStack Query cache keys in this repo must follow these rules:

- Each query module owns its cache keys and exports the factory for that domain.
- Each query module also owns its TanStack Query mutation hooks. `useMutation` hooks must live in the owning `<domain>.query.ts` file, not in pages, components, or unrelated hooks.
- Cache key factories such as `<module>QueryKey` and query option builders such as `get<Module>Options` must live in `src/queries/<module>.query.ts`, not in `src/hooks` or UI files. Hooks may only wrap or re-export query modules.
- Query and mutation hooks must return the raw service response directly. `queryFn` and `mutationFn` may await the service call, but they must not extract `response.data`, filter arrays, map records, or otherwise transform the payload.
- Every factory must expose `all()`.
- Every fetch key must use an explicit leaf segment. Do not fetch directly on `all()`.
- Every leaf must compose from `all()`.
- Collections should use a `list` leaf, for example `['domain', 'resource', 'list', params]`.
- Detail-style keys should use a stable explicit leaf, for example `['domain', 'resource', 'detail', id]`.
- `invalidateQueries` must use exported key factories, never raw array literals.
- Cross-domain invalidation must import the other module's key factory instead of retyping its key.
- When broad invalidation is needed, invalidate with the owning factory's `all()` or another exported prefix key. Do not hardcode prefixes inline.

## Service Conventions

- Service functions must return the raw server response directly from the HTTP client chain. Do not extract `response.data`, reshape payloads, or map records inside `src/services`.
- When mock API data is needed, do not inline mock objects or arrays inside pages or components. Create a mock service and a corresponding query module that follow the same service/query structure as real APIs, then consume that query from the UI.

## Type Conventions

- Module-specific types must live in `src/types/<module>.type.ts`. Do not define domain API/types inline in pages, components, query files, or service files when they belong to a module type file.

## Form Conventions

- For all form-related work in this repo, always use `react-hook-form`, `@hookform/resolvers/zod`, and `zod`.

## UI/Data Boundary

- All data extraction, filtering, mapping, formatting, and view-specific reshaping must happen in the consuming component, page, or UI hook layer.
