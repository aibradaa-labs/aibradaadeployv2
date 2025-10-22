# Changelog — AI Bradaa PWA (Architect Edition)

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added (c1-c6 — Full Audit & PWA Implementation)

#### c1: Icons & Manifest (2025-10-02)
- **Original SVG icon** `/icons/ai-bradaa.svg` (cyberpunk neon aesthetic, 256x256)
- **PNG exports**: 1024, 512, 192, 180 (Apple), 64, 32px
- **Enhanced manifest.json**: Full icon suite, description, categories, lang:en-MY
- **Favicon links**: SVG + PNG fallbacks, Apple touch icon
- **Rationale**: Fix icon 404s, enable iOS install, meet PWA installability criteria

#### c2: AI API Fix + Telemetry (2025-10-02)
- **CRITICAL FIX**: API key moved from URL query to `x-goog-api-key` header
- **Stable endpoint**: `gemini-1.5-flash` (replaced preview `2.0-flash`)
- **Retry logic**: Exponential backoff (500ms → 4s) for 429/5xx errors, max 4 attempts
- **localStorage guards**: `StorageUtil.safeGet/Set/Remove` to prevent Safari private mode crashes
- **Enhanced telemetry**: Log status, statusText, raw JSON on errors; show detailed UI error messages
- **JSDoc**: Added to `callAIAgent`, `renderAppendicesList`, `renderToolkitConsole`
- **Rationale**: Eliminate console errors, fix API 400s, improve debugging, security hardening

#### c3: Toolkit Personalization (2025-10-02)
- **11 tool configs** in `TOOLKIT_UI`: badges (emoji), CTAs, prefills, 3 tips each
- **"Use sample" button**: Pastes prefill into textarea
- **Tool-specific placeholders**: E.g., "Deal Assassin" → "RTX 4060 laptop under RM5500"
- **Rendered UX**: Badge header, tips list, CTA button (e.g., "Hunt Deal", "Spec Rig")
- **Rationale**: Differentiate tools, guide users with examples, improve onboarding

#### c4: Appendices Deep Cards + localStorage (2025-10-02)
- **Progressive disclosure**: `<details>` with spec table (CPU, GPU, RAM, Storage, Display)
- **Compare checkbox**: Adds to radar chart (max 3), syncs with Versus section chips
- **Save for later**: Persists to `localStorage.saves` (array of models)
- **Price alert**: Input + "Save" button → stores `{model, target, created}` in `localStorage.alerts`
- **External links**: Shopee, Price Source, TikTok with emojis
- **Responsive badges**: Platform (CUDA/NPU/Mac), Score, Value rating
- **Rationale**: Actionable UX, reduce friction in comparison flow, leverage browser storage

#### c5: Feature-Flag Readability + Behavioral UX (2025-10-02)
- **Enhanced UI toggle**: Fixed button (top-right) → "Text: Normal | Large"
- **Feature flag CSS**: `html[data-enhanced-ui="1"]` → clamp font sizes, centered h1/h2
- **Persistence**: `localStorage.ui_enhanced` → survives refresh
- **Fallback data badge**: Adds "(Data: fallback)" to header when using embedded data
- **Auto-enable on mobile**: Large text on Netlify + ≤640px width
- **Rationale**: Accessibility, user choice, no silent pixel shifts, mobile-friendly defaults

#### c6: Netlify Config & PWA Expansion (2025-10-02)
- **netlify.toml**: Changed `publish = "."` (single-file app), removed duplicate CSP, added cache headers
- **Service Worker**: Enhanced `OFFLINE_URLS` (icons, data, manifest), network-first strategy, skip Gemini API
- **Netlify detection**: `detectNetlify()` checks `x-nf-request-id` header
- **Conditional SW registration**: Only on Netlify + HTTPS, skips localhost
- **GitHub Actions**: `.github/workflows/netlify-deploy.yml` with secret checks
- **Rationale**: Deploy-ready, PWA gated by environment, CI/CD automation

---

## Security Fixes

### Critical
- **API Key Exposure**: Moved from URL to header (prevents leakage in logs/analytics)
- **XSS Risk**: Sanitized `innerHTML` usage (AI responses are trusted, but templates guarded)
- **localStorage Crash**: Wrapped in try/catch (Safari private mode compatibility)

### High
- **Retry Logic**: Prevents cascading failures on rate limits
- **CSP Compliance**: Single source in `<meta>`, no duplicates
- **Telemetry**: Exposes server errors for debugging (not user PII)

---

## UX Improvements

### Toolkit
- Each tool now has unique badge, CTA, placeholder, prefill, and 3 contextual tips
- "Use sample" link auto-fills textarea with example query

### Appendices
- Cards show badges (Platform, Score, Value)
- Spec table in collapsible section
- Compare checkbox → live radar update
- Save/alert actions → localStorage persistence
- External links (Shopee, TikTok, Price Source) with emojis

### Readability
- Feature-flagged "Large" text mode (default OFF)
- Centered headings when enabled
- Persists across sessions

---

## Performance

- **Service Worker**: Precaches critical assets (index, manifest, icons, data)
- **Cache headers**: Icons immutable (1y), manifest 1d, SW revalidate
- **Network-first**: Fresh data when online, fallback to cache offline

---

## Deployment

- **Netlify-ready**: `publish = "."`, SPA redirects, security headers
- **GitHub Actions**: Auto-deploy on push to `main` (if secrets configured)
- **PWA gated**: SW only registers on Netlify + HTTPS

---

## Breaking Changes
None. All changes are additive or behind feature flags.

---

## Migration Notes
- **localStorage keys**: `GEMINI_API_KEY`, `saves`, `alerts`, `ui_enhanced`
- **Netlify secrets** (optional): `NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN`

---

## Known Issues
- **Console.log**: One validation log remains (line 523: "✅ Fallback data validation complete")
- **Chart.js CDN**: Blocks render (acceptable tradeoff for simplicity in v1)
- **No DOMPurify**: AI responses use `innerHTML` (trusted source, but add library in v2)

---

## Contributors
- **Lead Auditor & Implementer**: AI Bradaa Team
- **Mentor Framework**: 10 Lenses (Carmack, Bet-David, van Rossum, Ravikant, Musk, Fernandes, Perkins, Cuban, Godin, Beck)

---

## Version History
- **v15.2 (Architect Edition)**: Current release (2025-10-02)
- **v15.1**: Previous baseline (before audit)

---

*For detailed audit findings, see `AUDIT-REPORT.md`*  
*For quality scorecard, see `MENTOR_SCORECARD.md`*  
*For deployment guide, see `README-RUNBOOK.md`*
