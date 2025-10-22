#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
const cmd = process.platform === 'win32' ? 'node.exe' : 'node';
const r = spawnSync(cmd, ['scripts/migrate_to_target_tree.mjs','--rollback'], { stdio: 'inherit' });
process.exit(r.status || 0);
