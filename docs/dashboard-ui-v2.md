# Dashboard look, version 2

Employees found the small grey text on the dashboards hard to read (it was `#555555` on near-black, about
2.5:1 contrast, set in 8–11 px type). Version 2 fixes that **for the dashboards only**: the stylist and manager
screens, the billing screens, and the whole admin area. Sign-in and the customer check-in screens are unchanged.

## What changed
Only the text. The colours of the backgrounds, cards, borders, the green/red amounts and the white current tab are
exactly as before.
- **Grey text** is lighter, in the same neutral grey: labels `#ababab` (about 8.7:1 contrast) instead of `#555555`
  (about 2.7:1). Every grey is now at least 4.8:1. The light theme was tightened the same way.
- **Type sizes**: nothing smaller than 11 px; the small capital labels are 12 px, slightly bolder, with less
  letter-spacing so they stay readable.
- **Navigation**: clearer labels, and a small bar in the normal text colour over the current tab.

All of it lives in `src/dashboard-v2.css`, scoped to `<html data-ui="v2">`. `src/index.css` is untouched.

## Going back to the original look
In `index.html` change

    <meta name="cave-dashboard-ui" content="v2" />

to `content="classic"` and rebuild/redeploy. Nothing else needs to change.
(A copy of the original stylesheet is kept in `docs/ui-backup/index.classic.css`.)
To remove version 2 entirely, delete `src/dashboard-v2.css` and its import in `src/main.tsx`.
