# ROLLBACK — AI POD Unification v15.3

To revert to legacy UI and disable new features:

1. In `app/js/bradaa-flags.js`, set `AIPOD: false`.
2. Remove or ignore `sw.js` to disable PWA.
3. Remove new AI POD modules from `/app/js/aipod/` if needed.
4. Restore any legacy deck code if required.

No data loss or breaking changes expected. All new features are feature-flagged and can be disabled safely.
