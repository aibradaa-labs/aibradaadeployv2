# Change Management Playbook (BM/EN)

As of: 2025-10-05 00:11 (Asia/Kuala_Lumpur)

## EN — Objectives
- Ensure safe, reversible, test-gated changes.
- Use feature flags and shims for risky paths; prefer additive first.
- Require green CI gates before removal of legacy paths.

## EN — Process
1. Propose: Open PR with plan, risks, rollback.
2. Stage-2: Add target tree, shims, import rewrites. Keep legacy.
3. Validate: Run CI (schema/policy/prompt/a11y/PWA/LH/secrets/license/TTL/link).
4. Remove: Commit B removes legacy after green checks.
5. Rollback: `git revert` merge if needed; scripts/rollback.mjs optional helper.

## BM — Objektif
- Perubahan selamat, boleh diundur, dan dilindungi ujian.
- Guna bendera ciri (feature flag) dan shim untuk risiko tinggi.
- Wajib CI hijau sebelum buang laluan legasi.

## BM — Proses
1. Cadang: Buka PR dengan pelan, risiko, dan pelan undur.
2. Peringkat-2: Tambah struktur sasaran, shim, kemaskini import. Legasi dikekalkan.
3. Sahkan: Jalan CI (skema/dasar/prompt/a11y/PWA/LH/rahsia/lesen/TTL/pautan).
4. Buang: Komit B buang legasi selepas semua hijau.
5. Undur: `git revert` merge jika perlu; `scripts/rollback.mjs` sebagai pembantu.
