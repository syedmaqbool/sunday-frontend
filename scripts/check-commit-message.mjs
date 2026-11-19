#!/usr/bin/env node
// commit-msg hook: rejects a Co-Authored-By trailer, which AGENTS.md forbids.
// Usage: node scripts/check-commit-message.mjs <path-to-commit-message-file>
import { readFileSync } from 'node:fs';

const messagePath = process.argv[2];
if (!messagePath) {
  console.error('check-commit-message: missing commit message file path.');
  process.exit(1);
}

const message = readFileSync(messagePath, 'utf8');
if (/^Co-Authored-By:/im.test(message)) {
  console.error(
    'Commit message has a Co-Authored-By trailer. AGENTS.md forbids it. Remove the trailer and commit again.',
  );
  process.exit(1);
}
