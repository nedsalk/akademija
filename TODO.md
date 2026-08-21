# TODO

## Localized Routes (i18n URLs)

Add support for translated URLs without language prefix:

- `/login` (English) and `/prijava` (Bosnian) both work
- Decide: serve same content on both, or redirect one to other?
- Options to consider:
  - Register both paths to same handler
  - Route aliases/regex patterns
  - Translation helper function

## Core Web Vitals Monitoring

### CI/CD Regression Detection (Lighthouse CI)

1. Install `@lhci/cli` as dev dependency
2. Create `lighthouserc.js` with performance budgets
3. Add GitHub Actions workflow for Lighthouse CI
4. Use for catching performance regressions (relative changes), not absolute metrics

### Production RUM (Real User Monitoring)

1. Add `web-vitals` library to client-side code
2. Create `/api/vitals` endpoint to collect metrics
3. Track LCP, INP, CLS from real users
4. Consider Google Search Console / PageSpeed Insights for free dashboards

### Notes

- Lab data (Lighthouse) ≠ Field data (real users)
- INP requires real user interactions — can't be measured in lab
- Use Lighthouse CI for regression detection, RUM for actual performance measurement
