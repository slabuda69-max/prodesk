# Pro-Dash - Modular Dashboard OS

A minimal, stable Core LTS dashboard that loads self-contained modules (themes + features) at runtime.

## Milestone M0 Dev Instructions

This application is strictly a static SPA that resolves modules dynamically. It **must** be served over HTTP due to CORS and ES module restrictions (it will fail to load modules if opened via `file://`).

### Running Locally

You can use any static HTTP server. If you have Python 3 installed, you can simply run:

```bash
# From the root of the project folder
python -m http.server 8080
```

Then open your browser to [http://localhost:8080](http://localhost:8080).

*For live reloading during development, you could also use something like `npx serve` or `npx live-server`.*

---

*See [ROADMAP.md](./docs/ROADMAP.md) and [Modular_Dashboard_OS_TRD.md](./docs/Modular_Dashboard_OS_TRD.md) for architectural details.*
