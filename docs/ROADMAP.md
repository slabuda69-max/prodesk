# Modular Dashboard OS — Roadmap & Traceability (v1 → v2)

## Milestone M0 — Project Setup

- Initialize repo, add TRD, .cursorrules, ROADMAP.md.
- Add **HTTP dev instructions** (python http.server).
- Create blank scaffolding files and stable slots in index.html (no functionality yet).

**Exit Criteria**

- Page serves over HTTP with all stable slots present.

---

## Milestone M1 — Core LTS

- Implement **registry.js** (dynamic import via new URL).
- Implement **app.js**: appCtx (events, storage, theme), Admin scaffold, theme switching skeleton, auto-mount features.
- Implement **base.css** structural styles only.

**Exit Criteria**

- Page loads without errors.
- Admin opens (gear/Alt+A) and shows placeholder when no sections exist.

**Traceability**

- TRD §5, §6, §7, §10.

---

## Milestone M2 — Themes

- Implement **classic**, **dark**, **light** themes.
- Admin → Appearance lists installed themes; Apply swaps tokens live.

**Exit Criteria**

- Tokens applied live; no JS behavior inside themes.

**Traceability**

- TRD §8, §10.

---

## Milestone M3 — Feature: Favorites

- /modules/favorites/favorites.module.js with CRUD (links/groups), protect "Ungrouped".
- Storage key: `mod:feature.favorites:data`.

**Exit Criteria**

- Add/edit/delete/reorder works; persists across reload.

**Traceability**

- TRD §9 (Favorites), §3 (constraints), §5 (slots).

---

## Milestone M4 — Feature: Widgets

- /modules/widgets/widgets.module.js with grid render in #slot-widgets.
- Types: notes (autosave), calendar (URL), iframe (URL + height).
- Admin CRUD + reorder (Up/Down). Iframe CSP/XFO message + external link.
- Storage key: `mod:feature.widgets:data`.

**Exit Criteria**

- All widget flows work; blocked iframes show message.

**Traceability**

- TRD §9 (Widgets), §10 (errors), §13 (security).

---

## Milestone M5 — Hardening & Polish

- Inline error banners on admin render failures.
- Optional debug flag (`localStorage["os.debug"]=true`).
- Smoke test checklist doc.
- README: "How to add a new module".

**Exit Criteria**

- Full manual test pass on Chromium/Firefox latest.

**Traceability**

- TRD §10, §15, §17.

---

## Milestone M6 — Packaging Website (v2)

- Select modules/themes; output ZIP with core + modules + prefilled index.html.
- Optional single-file rollup later.

**Exit Criteria**

- Exported ZIP runs locally over HTTP with chosen modules.

**Traceability**

- TRD §18.

---

## Milestone M7 — Visual Theme Builder (v2.2) 

- GUI for palette/radius/spacing/typography; export theme.module.js.
- Optional community gallery.

**Exit Criteria**

- Exported theme loads and is selectable in Admin → Appearance.

**Traceability**

- TRD §19.

---

## Requirements → Deliverables → Tests (Traceability Matrix)

| Requirement (TRD §)      | Deliverable                   | Verification / Test                                        |
| ------------------------ | ----------------------------- | ---------------------------------------------------------- |
| §5 Stable Slots          | index.html with required IDs  | DOM contains all slots; visual smoke passes                |
| §6 Module API v1.1       | Module templates + comments   | Sample module loads; `adminSections()` shape correct       |
| §7 Core Responsibilities | core/app.js, core/registry.js | Load without errors; Admin opens; auto-mount works         |
| §8 Themes Tokens         | 3 theme modules               | Token values applied live; zero JS behavior                |
| §9 Favorites             | favorites.module.js           | CRUD + reorder + persist                                   |
| §9 Widgets               | widgets.module.js             | Notes autosave; calendar/iframe embed + height; CSP notice |
| §10 Error Handling       | Admin inline error banner     | Forced throw shows visible message                         |
| §13 Security (iframes)   | Iframe sandbox/referrerpolicy | Headers verified; blocked frames show message              |
| §17 Update Policy        | Changelogs + minimal diffs    | PRs demonstrate module-only patches                        |
| §18 Packaging Site       | Exporter SPA                  | ZIP runs clean over HTTP                                   |
