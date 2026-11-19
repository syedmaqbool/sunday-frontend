# Review rules

Judgement rules for reviewing a diff. `npm run check:conventions` already enforces the mechanical AGENTS.md rules (type location, service `.data` access, test location, unused exports) on changed files, so do not repeat them here.

## Query and hook layers

- Query option builders hold keys, the query function, and static options only. Polling decisions, filtering, and derived state belong in the consuming page or UI hook.
- A hook that calls `useQuery` with a `refetchInterval` computed from data is the UI layer. A query module that does the same is not.

## Busy and loading state

- Reset busy or loading state in `finally`, so an error handler that throws cannot leave it stuck.

## Date windows

- Compare campaign and payment windows at the same boundary as the backend. Check the repository for `<` versus `<=` before writing the comparison.

## Duplication

- Move a sequence into a hook or helper once two or more call sites repeat it. Leave a single-use helper where it is.
- Repeated test setup moves into a helper. Repeated fixtures move into a shared builder.

## Naming

- Name a value for what it holds. A charge record ID is not a transaction ID, and a local variable should not reuse the other's name.

## Contract fields

- Check field names and enum unions against the generated API type and the backend route schema, not against the ticket text.
- A string literal that matches a backend enum value needs a named constant in its module, so a typo fails to compile or is easy to find.

## Tests

- Test titles state the behaviour and the condition, for example "re-checks a payable purchase within 5 seconds".
- A new behaviour gets a test that fails before the change. Record in the ticket if the test passed first, and why.
