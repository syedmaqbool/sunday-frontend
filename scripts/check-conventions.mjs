#!/usr/bin/env node
// Mechanical AGENTS.md rules, checked on changed files only, so untouched legacy code never blocks.
// Usage:
//   node scripts/check-conventions.mjs            working tree vs HEAD (staged and unstaged)
//   node scripts/check-conventions.mjs --staged   staged files only (pre-commit)
//   node scripts/check-conventions.mjs --base <ref>  everything changed since <ref> (review)
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const args = process.argv.slice(2);
const staged = args.includes('--staged');
const baseIndex = args.indexOf('--base');
const base = baseIndex === -1 ? null : args[baseIndex + 1];

function git(gitArgs) {
  return execFileSync('git', gitArgs, { encoding: 'utf8' })
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

let changed;
if (staged) {
  changed = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
} else {
  const diffArgs = ['diff', '--name-only', '--diff-filter=ACMR', base ?? 'HEAD'];
  changed = [...new Set([...git(diffArgs), ...git(['ls-files', '--others', '--exclude-standard'])])];
}
changed = changed.map(file => file.split(sep).join('/')).filter(file => /\.(ts|tsx)$/.test(file));

// Every source and test file, used to find references for the unused-export rule.
function walk(directory, found = []) {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) walk(full, found);
    else if (/\.(ts|tsx)$/.test(entry)) found.push(full.split(sep).join('/'));
  }
  return found;
}
const referenceFiles = [...walk('src'), ...walk('tests')];
const referenceText = new Map(referenceFiles.map(file => [file, readFileSync(file, 'utf8')]));

const violations = [];
function report(file, line, message) {
  violations.push(`${file}:${line}  ${message}`);
}

for (const file of changed) {
  const isSource = file.startsWith('src/');
  const isGenerated = file.startsWith('src/types/generated-api/');
  const lines = isSource || file.startsWith('tests/') ? readFileSync(file, 'utf8').split('\n') : [];

  // Test files belong under tests/, mirroring src/.
  if (/^src\/.*\.(test|spec)\.(ts|tsx)$/.test(file)) {
    report(file, 1, 'test files belong under tests/, mirroring src/ (AGENTS.md, Test Conventions)');
  }

  lines.forEach((text, index) => {
    const lineNumber = index + 1;

    // Module types belong in src/types/<module>.type.ts, not in other source files.
    if (isSource && !file.startsWith('src/types/') && !isGenerated && /^export\s+(type|interface)\s+\w+/.test(text)) {
      report(file, lineNumber, 'exported type or interface belongs in src/types/<module>.type.ts (AGENTS.md, Type Conventions)');
    }

    // Services return the raw server response, so no .data extraction there.
    if (file.startsWith('src/services/') && /\.data\b/.test(text)) {
      report(file, lineNumber, 'services return the raw response; do not read .data (AGENTS.md, Service Conventions)');
    }
  });

  // Named exports with no reference outside their own file are dead exports.
  // Query modules must export their key factory (AGENTS.md, Query Conventions), so those are exempt.
  if (isSource && !isGenerated) {
    const exportPattern = /^export\s+(?:const|let|function|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/;
    lines.forEach((text, index) => {
      const match = exportPattern.exec(text);
      if (!match) return;
      const name = match[1];
      if (file.startsWith('src/queries/') && name.endsWith('QueryKey')) return;
      const usedElsewhere = referenceFiles.some(
        other => other !== file && new RegExp(`\\b${name}\\b`).test(referenceText.get(other)),
      );
      if (!usedElsewhere) {
        report(file, index + 1, `export "${name}" has no references outside this file; remove the export`);
      }
    });
  }
}

if (violations.length > 0) {
  console.error(`Convention check failed (${violations.length}):`);
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}
console.log(`Convention check passed for ${changed.length} changed .ts/.tsx file(s).`);
