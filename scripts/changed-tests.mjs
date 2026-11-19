#!/usr/bin/env node
// Runs the tests related to .ts/.tsx files changed against a base ref.
// Usage: npm run test:changed [-- <base-ref>]   (default base: HEAD, i.e. uncommitted work)
// Unlike `test:focused` with no arguments, this always reports what it ran or why it ran nothing.
import { spawnSync, execFileSync } from 'node:child_process';

const base = process.argv[2] ?? 'HEAD';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' })
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

const tracked = git(['diff', '--name-only', '--diff-filter=ACMR', base]);
const untracked = git(['ls-files', '--others', '--exclude-standard']);
const changed = [...new Set([...tracked, ...untracked])].filter(file => /\.(ts|tsx)$/.test(file));

if (changed.length === 0) {
  console.log(`No changed .ts/.tsx files against ${base}; no related tests to run.`);
  process.exit(0);
}

console.log(`Running related tests for ${changed.length} changed file(s) against ${base}.`);
const result = spawnSync('npm', ['run', 'test:focused', '--', ...changed], {
  stdio: 'inherit',
  shell: true,
});
process.exit(result.status ?? 1);
