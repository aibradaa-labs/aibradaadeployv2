# Risk Log

- PWA dual-path risk — Mitigation: prefer /pwa in link + CI check.
- Secrets leakage — Mitigation: secrets_scan; rotate on incident.
- CLS spikes — Mitigation: vitals observers; deck-only changes.
- Link rot after moves — Mitigation: link_check + LH.
- Accessibility regressions — Mitigation: axe smoke test.
- Proxy routing — Mitigation: direct fallback on localhost.
- Performance budget — Mitigation: LH gate; content-visibility; reduced ornaments.
