# Issue tracker: Local Markdown

Issues and specs for this repo live as Markdown files in `.scratch/`.

## Conventions

- Use one feature directory per effort: `.scratch/<feature-slug>/`.
- Store a feature spec at `.scratch/<feature-slug>/spec.md` when one is needed.
- Store each implementation ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order. Keep one ticket per file.
- Put the triage role in a `Status:` line near the top of each ticket. Use `docs/agents/triage-labels.md` for the role names.
- Append comments and conversation history under a `## Comments` heading at the end of the ticket.
- When a dependency lives in a sibling repo, put its workspace-relative ticket path and title in `Blocked by`. Resolve that reference from the shared `sunday` workspace root.

## Publishing tickets

Create a ticket file under `.scratch/<feature-slug>/issues/`, creating the directory when needed.

## Fetching tickets

Read the referenced Markdown file. The user will normally provide its path or number.

## Wayfinding operations

- Store a wayfinding map at `.scratch/<effort>/map.md` with Notes, Decisions-so-far, and Fog sections.
- Store each child at `.scratch/<effort>/issues/NN-<slug>.md`. Add a `Type:` line with `research`, `prototype`, `grilling`, or `task`, and a `Status:` line with `claimed` or `resolved`.
- Write blockers as `Blocked by: NN, NN`. A child is unblocked when every listed ticket is resolved.
- Find the frontier by scanning for open, unblocked, unclaimed tickets, in number order.
- Claim a ticket by setting `Status: claimed` before work begins.
- Resolve a ticket by adding an `## Answer`, setting `Status: resolved`, and adding a gist and link to Decisions-so-far in the map.
