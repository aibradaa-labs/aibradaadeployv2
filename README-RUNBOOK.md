# AI Bradaa PWA — Deployment & Operations Runbook

**Version**: 15.2 (Architect Edition)  
**Last Updated**: 2025-10-02  
**Maintainer**: AI Bradaa Team

---

## Table of Contents

1. [Quick Start (Local Dev)](#quick-start-local-dev)
2. [Set Gemini API Key](#set-gemini-api-key)
3. [Deploy to Netlify](#deploy-to-netlify)
4. [Enable PWA Features](#enable-pwa-features)
5. [Run Smoke Tests](#run-smoke-tests)
6. [Run Lighthouse Audit](#run-lighthouse-audit)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedure](#rollback-procedure)

---

## Quick Start (Local Dev)

### Prerequisites
- **Node.js**: v18+ (LTS recommended)
- **Git**: Latest version
- **Browser**: Chrome/Edge (for PWA testing)

### Steps

```bash
# 1. Clone repo
git clone <your-repo-url>
cd ai-bradaa-pwa-latest

# 2. Install dependencies
npm install

# 3. Serve locally
npm run serve
# Opens http://localhost:3000 (or configured port)

# 4. (Optional) Run linter
npm run lint
```

### What to Expect
- **Single-file app**: `index.html` contains all HTML/CSS/JS
- **No build step**: Direct file serving (v1 simplicity)
- **Service Worker**: Will NOT register on localhost (see PWA section)

---

## Set Gemini API Key

### Option 1: Dev Console (Recommended for Local)

1. Open app in browser
2. Open Dev Tools → Console (F12)
3. Run:
   ```javascript
   localStorage.setItem('GEMINI_API_KEY', 'YOUR_API_KEY_HERE');
   ```
4. Refresh page

### Option 2: window.GEMINI_API_KEY (Not Recommended)

Create a file `config.js` (gitignored):
```javascript
window.GEMINI_API_KEY = 'YOUR_KEY';
```
Include in `index.html` before main script:
```html
<script src="/config.js"></script>
```

### Get an API Key
1. Visit: https://makersuite.google.com/app/apikey
2. Create project → Enable Generative Language API
3. Copy key
4. **DO NOT commit to repo**

### Verify
- Click any Toolkit tool → "Run"
- Should see AI response (not "⚠️ AI is disabled")

---

## Deploy to Netlify

### Method 1: Netlify UI (Easiest)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy v15.2"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub → Authorize → Select repo

3. **Configure Build**:
   - **Build command**: (leave empty)
   - **Publish directory**: `.` (root)
   - Click "Deploy site"

4. **Set Environment Variables** (Optional):
   - Site settings → Environment variables
   - Add `GEMINI_API_KEY` (if using serverless functions)
   - **Note**: Client-side app uses `localStorage`, not env vars

5. **Custom Domain** (Optional):
   - Site settings → Domain management
   - Add custom domain (e.g., `bradaa.yourdomain.com`)

### Method 2: Netlify CLI

```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

### Method 3: GitHub Actions (Auto-Deploy)

**Prerequisites**: Set GitHub secrets

1. **Get Netlify credentials**:
   - Site ID: Netlify dashboard → Site settings → Site details → API ID
   - Auth token: User settings → Applications → Personal access tokens → New token

2. **Add to GitHub**:
   - Repo → Settings → Secrets and variables → Actions
   - Add `NETLIFY_SITE_ID`
   - Add `NETLIFY_AUTH_TOKEN`

3. **Push to trigger**:
   ```bash
   git push origin main
   ```
   - Workflow runs automatically (`.github/workflows/netlify-deploy.yml`)

### Verify Deployment

1. **Check URL**: Netlify provides `https://<random>.netlify.app`
2. **Check headers**:
   ```bash
   curl -I https://your-site.netlify.app
   ```
   - Should see `x-nf-request-id` header
   - Should see `X-Content-Type-Options: nosniff`

3. **Test PWA**:
   - Open in Chrome → Dev Tools → Application → Manifest
   - Should show "AI Bradaa" with icons

---

## Enable PWA Features

### Auto-Enable (Production)

PWA features (Service Worker, offline support, install prompt) auto-enable when:
1. ✅ Deployed to Netlify (`x-nf-request-id` header detected)
2. ✅ HTTPS enabled (Netlify default)

No manual steps needed!

### Verify PWA

1. **Service Worker**:
   - Chrome Dev Tools → Application → Service Workers
   - Should show "ai-bradaa-v2" active

2. **Manifest**:
   - Application → Manifest
   - Icons should load (32, 64, 192, 512, 1024px)

3. **Install Prompt**:
   - Chrome address bar → Install icon (⊕)
   - Desktop: Creates app shortcut
   - Mobile: Adds to home screen

4. **Offline Test**:
   - Dev Tools → Network → Offline checkbox
   - Refresh → App still loads (cached)

### Lighthouse PWA Score

Run audit (see section below). Target:
- **PWA**: ≥80
- **Installable**: ✅
- **Offline-ready**: ✅

---

## Inventory & Mentor Coverage Audit

### Generate reports

```bash
npm run audit:inventory
```

- Rebuilds `reports/audit/` with the latest inventory snapshot (size, import graph, duplicate clusters, dead-file candidates).
- Updates `reports/audit/mentor-coverage.json` and appends hashes to `reports/ci/determinism-hash.txt`.
- Produces timestamped Markdown/JSON artifacts under `reports/audit/` (append-only).

### Verify workspace (CI parity)

```bash
npm run audit:inventory:check
```

- Re-runs the audit engine without writing files.
- Fails if any tracked file differs from the latest committed snapshot (mirrors CI guardrail).
- Run this before pushing to ensure PRs pass the inventory drift gate.

---

## Run Smoke Tests

### Test 1: Build Check

```bash
npm run smoke:build
# Should exit 0 (no errors)
```

**What it tests**: File integrity, no syntax errors

### Test 2: AI Function (Manual)

1. Set API key (see above)
2. Navigate to **Matchmaker**
3. Select budget, use case, portability
4. Click "✨ Find My Match"
5. **Expected**: AI response in 2-10s
6. **Failure**: "⚠️ AI is disabled" or "❌ AI Error 400"

**Fixes**:
- Check API key in localStorage
- Check quota: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
- Check network tab for 429 (rate limit)

### Test 3: Appendices → Radar Integration

1. Navigate to **Appendices**
2. Expand any laptop card → "📋 Specs, Actions & Links"
3. Check "Compare (add to radar chart)"
4. Navigate to **Versus** (Head-to-Head)
5. **Expected**: Laptop appears in radar chart

**Failure**: Radar empty or doesn't update
**Fix**: Check console for errors in `attachAppendicesHandlers()`

### Test 4: localStorage Persistence

1. Navigate to **Appendices**
2. Expand card → Check "Save for later"
3. Set price alert → "Save"
4. **Refresh page**
5. **Expected**: Checkbox still checked, alert value persists

**Failure**: State resets
**Fix**: Check Safari private mode, or localStorage disabled

### Test 5: Netlify Detection

1. Deploy to Netlify (see above)
2. Open site in browser
3. Console should show: `✅ Service Worker registered: https://...`
4. **Local**: Should show `SW skipped (localhost or non-Netlify)`

---

## Run Lighthouse Audit

### Desktop

1. Chrome → Open deployed site
2. Dev Tools → Lighthouse tab
3. **Categories**: All
4. **Device**: Desktop
5. Click "Analyze page load"

**Target Scores** (Mentor Lenses ≥9.8 → Lighthouse ≥90):
- **Performance**: ≥80 (single-file, CDN-loaded Chart.js acceptable)
- **Accessibility**: ≥90
- **Best Practices**: ≥90
- **SEO**: ≥90
- **PWA**: ≥80

### Mobile

Repeat above with **Device**: Mobile (simulated)

### Save Report

1. Click "View report" → Top-right "⋮" menu → "Save as HTML"
2. Save to `/reports/lighthouse-<date>.html`
3. Commit to repo:
   ```bash
   mkdir -p reports
   mv ~/Downloads/lighthouse-*.html reports/
   git add reports/
   git commit -m "Add Lighthouse report"
   ```

### Fix Common Issues

| Issue | Score | Fix |
|-------|-------|-----|
| "Image elements do not have explicit width/height" | Performance | Add to `<img>` tags (not applicable, no images in v1) |
| "Background and foreground colors do not have sufficient contrast" | Accessibility | Already fixed: `#E6EDF3` on `#010409` = 11.4:1 |
| "Tap targets not sized appropriately" | Accessibility | Add `min-height: 48px` to buttons (future) |
| "Does not provide a valid apple-touch-icon" | PWA | Already fixed: `/icons/icon-180.png` |

---

## Troubleshooting

### AI Not Working

**Symptom**: "⚠️ AI is disabled" or "❌ AI Error 400"

**Checks**:
1. API key set?
   ```javascript
   localStorage.getItem('GEMINI_API_KEY')
   ```
2. Network tab → Request to `generativelanguage.googleapis.com`?
3. Response status 400 → Invalid model or quota exceeded
4. Response status 429 → Rate limit (retry logic should handle)

**Fix**:
- Set valid key
- Check Google Cloud console quotas
- Wait 1 min if rate-limited

### Service Worker Not Registering

**Symptom**: Console shows "SW skipped"

**Checks**:
1. Deployed to Netlify? (not localhost)
2. HTTPS? (Netlify auto-provides)
3. `x-nf-request-id` header present?
   ```bash
   curl -I https://your-site.netlify.app | grep x-nf
   ```

**Fix**:
- If localhost: Expected behavior (PWA gated)
- If Netlify + no header: Check Netlify deployment logs

### Icons Not Loading

**Symptom**: Broken icon images or install prompt missing

**Checks**:
1. Files exist?
   ```bash
   ls icons/
   # Should show: icon-32.png, icon-64.png, icon-192.png, etc.
   ```
2. Manifest valid?
   ```bash
   curl https://your-site.netlify.app/manifest.json
   ```

**Fix**:
- Re-run icon generation script (see commit c1 in CHANGELOG.md)
- Check Netlify deploy log for missing files

### Charts Not Visible

**Symptom**: Blank canvas or invisible axes

**Checks**:
1. Chart.js loaded?
   ```javascript
   window.Chart
   ```
2. Console errors about Chart.defaults?

**Fix**:
- Check CSP allows `https://cdn.jsdelivr.net`
- Verify `Chart.defaults.color = '#E6EDF3'` (line 808 in index.html)

---

## Rollback Procedure

### Netlify UI

1. Go to Netlify dashboard → Deploys
2. Find previous successful deploy
3. Click "⋮" menu → "Publish deploy"

### Git

```bash
# Find last good commit
git log --oneline

# Revert to commit
git revert <commit-hash>
git push origin main

# Or reset (destructive)
git reset --hard <commit-hash>
git push origin main --force
```

### Verify

1. Check deployed site
2. Run smoke tests
3. Check Lighthouse scores

---

## Maintenance

### Weekly
- [ ] Check Gemini API quota usage
- [ ] Review Netlify analytics (if enabled)

### Monthly
- [ ] Run Lighthouse audit → Compare to baseline
- [ ] Update dependencies: `npm outdated` → `npm update`

### Quarterly
- [ ] Review AUDIT-REPORT.md → Re-audit code
- [ ] Update fallback laptop data (`STATE.data.fallbackLaptops`)

---

## Support

- **Issues**: Create GitHub issue
- **Security**: Email (do not post API keys publicly)
- **Documentation**: See `AUDIT-REPORT.md`, `MENTOR_SCORECARD.md`, `CHANGELOG.md`

---

**End of Runbook**
