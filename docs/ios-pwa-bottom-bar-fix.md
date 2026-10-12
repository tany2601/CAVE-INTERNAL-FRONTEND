# iOS home-screen app: bottom bar / page shifted up

Fix for installed PWAs (Add to Home Screen) on **iOS 18.x** where a strip the colour of the page
background appears under the app and the content is cut about one status-bar height (≈62px on an
iPhone 16 Pro) above the bottom edge. Android and normal Safari tabs are not affected.

## Symptom

Measured on an iPhone 16 Pro (iOS 18.7.1) in the installed app:

| value | result |
| --- | --- |
| `window.innerHeight` / `100dvh` | **812** |
| `screen.height` / `100vh` / `100lvh` | **874** |
| `env(safe-area-inset-top)` / `-bottom` | 62px / 34px |

The page is laid out and painted only in the top 812px. No CSS height trick fixes it: `100lvh`,
`env()` insets, `position: fixed; inset: 0`, negative `bottom`, flipping `display` to force a
re-layout, scroll/resize nudges and re-applying the viewport meta were all tried without success.

## Cause

`viewport-fit=cover` combined with `apple-mobile-web-app-status-bar-style: black-translucent`
makes iOS shift and clip the whole page up by the status-bar height. It was found by temporarily
re-applying the viewport meta **without** `viewport-fit=cover`: for that moment the app painted edge
to edge.

## Fix

1. **Viewport meta without `viewport-fit=cover`** (`index.html`):

   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
   ```

2. **Opaque status bar** (`index.html`):

   ```html
   <meta name="apple-mobile-web-app-capable" content="yes" />
   <meta name="apple-mobile-web-app-status-bar-style" content="black" />
   ```

   The page now starts below the status bar. The bar's colour is the page background at launch and
   stays the same for the whole session.

3. **Supply the home-indicator padding yourself.** Without `viewport-fit=cover`,
   `env(safe-area-inset-bottom)` is `0`, so the bottom nav and bottom buttons would sit under the
   home indicator. Use a CSS variable everywhere you used `env(safe-area-inset-bottom)`
   (`src/index.css`):

   ```css
   :root {
     --sab: env(safe-area-inset-bottom, 0px);
   }
   .bottom-nav { padding-bottom: var(--sab); }
   .pb-nav     { padding-bottom: calc(5rem + var(--sab)); }
   /* bottom buttons: pb-[max(1.5rem,var(--sab))] */
   ```

   and override it for installed iOS apps (`src/main.tsx`):

   ```ts
   const ios =
     /iPhone|iPad|iPod/.test(navigator.userAgent) ||
     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
   const standalone =
     window.matchMedia('(display-mode: standalone)').matches ||
     (navigator as Navigator & { standalone?: boolean }).standalone === true
   if (ios && standalone) {
     const long = Math.max(screen.width, screen.height)
     const tablet = Math.min(screen.width, screen.height) >= 700
     document.documentElement.style.setProperty(
       '--sab',
       tablet ? '20px' : long >= 812 ? '34px' : '0px',
     )
   }
   ```

   34px = iPhones with a home indicator, 20px = iPads, 0 = iPhones with a home button.

4. **Shrink the top padding.** The status bar already reserves its own space, so a large safe-area
   top padding looks too low (`--page-top` in `src/index.css`, now `max(1.25rem, …)`).

5. **Re-add the app to the Home Screen** after changing the status-bar meta: iOS reads it at install
   time, and old installs keep the old behaviour.

## Notes

- Top status-bar colour: matches the page background at launch. This app launches on the (always
  dark) sign-in screen, so the bar is dark; the light theme only applies to the dashboards.
- Edge-to-edge under the status bar (translucent) and a full-height bottom could not be had at the
  same time on iOS 18; a native wrapper (e.g. Capacitor) is the way to get both.
- To diagnose a similar problem, temporarily print `innerWidth/innerHeight`, `screen.*`,
  `100vh/100dvh/100lvh` and the safe-area insets on screen; the 812 vs 874 mismatch makes the
  cause obvious.
