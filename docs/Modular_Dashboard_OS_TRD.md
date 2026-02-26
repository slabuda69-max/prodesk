# Technical Requirements Document (TRD)

**Project:** Modular Dashboard OS (Core LTS + Modules)  
**Status:** Baseline v1.0 (Greenfield)  
**Owner:** Product / Systems Engineering  
**Date:** 25 Feb 2026

---

## 1. Executive Summary

Build a minimal, stable **Core LTS** that loads **self-contained modules** (themes + features) at runtime. The core provides stable DOM slots, admin scaffold, theme token plumbing, storage, and a module registry. All functionality and visuals live in modules. Updates ship as **module-only diffs** (no core changes). Future phases add a **Packaging Website** that will allow a community built module store  and **Visual Theme Builder** users can add their custom themes to the community module store.  Store will include Users, Descriptions, Labels, Rankings, etc.  all the normal things in a store.

## 2. Goals & Non-Goals

**Goals**

- Stable **Core LTS** with near-zero churn.
- Runtime **module registry/loader** with lifecycle hooks.
- **Admin scaffold** that aggregates module admin sections into tabs.
- **Themes** as CSS token packs (no JS behavior).
- **Feature modules** MVP: Favorites and Widgets.
- Local storage persistence; namespaced keys.
- Serve over HTTP (no `file://`).
- Future: Packaging Website; Visual Theme Builder.

**Non-Goals (v1)**

- No server-side APIs, databases, or auth.
- No framework required to run (static files + HTTP server).
- No polyfills beyond ES2019 needs.

## 3. Constraints & Conventions

- **ASCII-only** code and strings.
- **No optional chaining** (`?.`) or nullish coalescing (`??`) in shipped JS.
- CSS **token-first**: themes define tokens; features consume tokens; core/base.css is structural only.
- **CSS-safe IDs** for admin/DOM (letters, numbers, `_`, `-`). **No dots** in IDs.
- Minimal diffs practice: module-level updates; no core swaps.
- LocalStorage keys namespaced: `mod:<kind>.<shortname>:data`.

## 4. High-Level Architecture

Static SPA served over HTTP. Core bootstraps registry, loads modules via dynamic `import()`, initializes admin, applies a theme, and mounts feature modules.

**Directory (target structure):**

```
/index.html
/core/
  app.js          # appCtx, admin scaffold, theme plumbing, storage wrapper
  registry.js     # dynamic module loader (ESM), lifecycle orchestration
  base.css        # structure/layout only
/modules/
  themes/
    classic/theme.module.js
    dark/theme.module.js
    light/theme.module.js
  favorites/favorites.module.js
  widgets/widgets.module.js
```

## 5. Stable DOM Slots (Core LTS Contract)

These **must not** change without a major version:

```html
<div id="slot-header"></div>
<div id="slot-topbar"></div>
<div id="slot-quickbar"></div>
<div id="slot-main">
  <div id="slot-favorites"></div>
  <div id="slot-widgets"></div>
</div>
<div id="slot-overlays"></div>
<div id="slot-admin"></div>
```

## 6. Module API (v1.1)

Each module exports **default**:

```js
export default {
  meta: {
    name: 'mod.feature.widgets',   // unique
    label: 'Widgets',
    version: '1.0.0',
    kind: 'feature'                // 'feature' | 'theme'
  },
  async init(ctx) {},              // optional pre-mount
  async mount(ctx) {},             // render into slot(s)
  async unmount(ctx) {},           // teardown
  adminSections(ctx) {             // themes may return []
    return [{
      tab: 'Widgets',
      id: 'widgets_manage',        // CSS-safe id; no dots
      title: 'Manage Widgets',
      hint: 'Configure widgets; reorder with Up/Down.',
      render(el, ctx) {}
    }];
  }
}
```

**Core-provided ctx:**

- `ctx.events` — pub/sub: `on`, `off`, `emit`.
- `ctx.storage` — namespaced helpers: `read(ns,key)`, `write(ns,key,val)`, `remove(ns,key)`.
- `ctx.theme` — read tokens, subscribe to changes.
- `ctx.slots` — access stable slot elements.

## 7. Core Responsibilities

- **appCtx** (events, storage, theme) creation.
- **Admin scaffold**: collect `adminSections()` after `init()`, build tabs/panes, lazy `render(el,ctx)` on selection, show inline error on exceptions, toggle with **Alt+A**.
- **Theme switching**: list themes (kind=`theme`), apply tokens, emit `theme:changed`.
- **Auto-mount feature modules** after load, in declared order.
- **Registry**: dynamic imports with `new URL(url, document.baseURI).href`, lifecycle orchestration, module map by `meta.name`.
- **Storage**: JSON safe, namespacing enforced.

## 8. Themes (Tokens-Only)

- Provide CSS variables: `--ui-surface`, `--ui-surface-2`, `--ui-border`, `--ui-text`, `--ui-muted`, `--ui-accent`, `--ui-radius`, `--ui-gap`, `--ui-elev`.
- No JS behavior beyond exposing/applying tokens.

## 9. Feature Modules (MVP)

**Favorites**

- Mount: `#slot-favorites`.
- Groups + links CRUD in Admin, “Ungrouped” protected.
- Storage: `mod:feature.favorites:data`.

**Widgets**

- Mount: `#slot-widgets` (CSS grid).
- Types: `notes` (textarea, autosave), `calendar` (embed URL), `iframe` (URL + height).
- Admin CRUD + reorder (Up/Down). Show message if iframe blocked by CSP/XFO; provide “Open in new tab”.
- Storage: `mod:feature.widgets:data`.
- Include optional Boss button
- Incluse Optional prank station

## 10. Error Handling & Observability

- Guard all dynamic imports and admin renders; surface **inline error banners** and `console.error` with stack.
- Optional debug flag: `localStorage["os.debug"]=true` to enable verbose logs.

## 11. Accessibility & i18n

- Basic ARIA where applicable; keyboard-accessible admin controls.
- Text and tokens separate; future localized strings (post-MVP).

## 12. Performance

- Lazy admin pane rendering; defer heavier modules post-paint if needed.
- No frameworks to minimize payload.

## 13. Security

- Static files only; no secrets.
- Iframes: use `sandbox`, `referrerpolicy`, `allowfullscreen`. Inform user if provider blocks embedding.
- No eval or remote code execution.

## 14. Environments & Tooling

- Runtime: any static HTTP server (`python -m http.server 8080`).
- Dev: Node optional for lint/tests; not required to run.

## 15. Test Strategy (MVP)

**Manual scenarios**

- Load over HTTP; no CORS/ESM errors.
- Admin toggles via gear or Alt+A.
- Theme switching updates tokens.
- Favorites CRUD + reorder; persists.
- Widgets CRUD + reorder; notes autosave; blocked iframe shows message.

## 16. Risks & Mitigations

- Silent admin failures → mandatory inline error banners.
- Path resolution issues → always `new URL(url, document.baseURI).href`.
- CSS selector pitfalls → enforce CSS-safe IDs; lint for dots in IDs.
- Iframe blocks → clear UI messaging + external link.

## 17. Versioning & Updates

- Core LTS v1 frozen after MVP; only critical fixes.
- Modules use semver; changelogs per module.
- Delivery as **module diffs**; avoid core changes.

## 18. Future: Packaging Website (v2)

- UI to choose modules; output ZIP with selected modules + prefilled `index.html`.
- Optional single-file rollup later.

## 19. Future: Visual Theme Builder (v2.2)

- GUI to adjust palette/typography/radius/spacing.
- Export `theme.module.js`; optional gallery.

## 20. Appendices

**A. Storage Keys**

- `mod:feature.favorites:data`
- `mod:feature.widgets:data`
- `ui.theme.current` (optional)

**B. Events**

- `theme:changed` → `{ themeName }`
- Module events prefixed: `favorites:*`, `widgets:*`.

**C. Coding Rules**

- ES2019 compatible; no `?.` or `??`.
- ASCII-only.
- Token-first CSS (no hardcoded colors in features).
