# Multi-ticket feature workflow

Use this workflow when a feature has numbered tickets with dependencies.

## Before dispatch

1. Fix the feature branch's starting commit and read the feature spec, remaining tickets, and dependency state.
2. Run `npm run test` and `npm run check` at that commit before implementation. Record the commit, each command's result, failing test names and files, and check diagnostics. Compare later failures with these baselines and follow the user's stop or continue rule; report baseline failures instead of treating them as passing. Wait for both commands to finish before dispatching workers or starting worktree dependency installation.
3. In each new worktree, install dependencies with `npm ci`, which runs the package `prepare` script. If dependencies already exist, run `npm run prepare`. After `npm ci` or `npm run prepare`, confirm `.vite-hooks/pre-commit` exists and `git config core.hooksPath` points to `.vite-hooks/_` before committing. The local pre-commit hook runs `check:fix` and tests related to staged files.
4. For a UI port, record the reference repository and commit, exact source paths, Sunday target paths, and adaptations for Sunday routes, API responses, or access control. Include this map in worker prompts and the completion report.

## Delegating tickets and reviews

- Give each ticket worker a self-contained brief with the ticket ID, acceptance criteria, spec, base commit, relevant repository guidance, public test seam, and reference map when applicable.
- Start workers and reviewers in a fresh context when the tool supports it. Include the required context explicitly. The coordinator owns queue position and prior ticket status.
- Ask a worker to report its ticket ID, result, commit, checks, and blockers. Ask each reviewer to report its assigned review axis and findings. Keep each report scoped to that assignment.
- Review a fixed diff and provide the reviewer with the diff, commit list, applicable standards, originating spec, and feature-wide workflow requirements that affect the diff, including required package version bumps. Spec reviewers must treat documented workflow requirements as in scope and reserve scope-creep findings for changes required by neither the ticket nor the workflow.

## Commit scope

Each ticket's initial implementation commit contains its implementation and tests
plus one package patch-version bump. The Vite+ pre-commit hook runs `check:fix`
and related tests for staged files, then `bump:patch`, and stages `package.json`
and `package-lock.json`.

For review amendments, set `SKIP_PACKAGE_VERSION_BUMP=1` for the
`git commit --amend` command. The hook still runs `check:fix` and related tests
while retaining the existing version bump.
