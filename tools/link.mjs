#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Jet Williams
//
// npm run link            → write a fresh one-time login link to .lab/login-link.txt (mode 0600). Never printed.
// npm run link -- --revoke → log out every device and cancel pending links.
// Set LAB_PUBLIC_URL in .env to the address your phone uses (e.g. your private tailnet URL).
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAuth } from '../lib/auth.mjs';
import { loadEnvFile, writeLoginLink } from '../lab/server.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await loadEnvFile(join(ROOT, '.env'));
const auth = createAuth({ stateFile: join(ROOT, '.lab', 'auth.json') });
if (process.argv.includes('--revoke')) {
  auth.revokeAll();
  console.log('All sessions and pending links revoked.');
} else {
  const base = process.env.LAB_PUBLIC_URL || `http://127.0.0.1:${process.env.LAB_PORT || 8787}`;
  const file = await writeLoginLink({ root: ROOT, auth, baseUrl: base });
  console.log(`One-time login link written to ${relative(ROOT, file)}`);
  console.log('Open it once on your phone (it dies on first use or after 24 h). Send it to yourself over a private channel only.');
}
