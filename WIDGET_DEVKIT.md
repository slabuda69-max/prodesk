# ProDashboard Widget devKit

Welcome! ProDashboard supports a fully dynamic, client-side plugin ecosystem. You can build self-contained widgets using pure HTML, CSS, and JS, and drop them into the OS.

The OS provides an agnostic layout grid and theme engine. Your widget's only job is to return a raw DOM node.

## Core Concepts

1. **Isolation**: A widget must be fully contained within its own module file (e.g. `mywidget.module.js`).
2. **The Registry**: Widgets are automatically discovered by the ProDashboard `ModuleRegistry` if they export a `meta` object with `kind: 'widget'`.
3. **Themed Variables**: Widgets should use global CSS variables (like `var(--ui-surface)`) instead of hardcoded colors, ensuring instant Light/Dark mode compatibility. 
4. **Dynamic Scaling**: Widgets can be placed into 1x1, 1x2, 2x1, or 2x2 grid slots by the user. You must use CSS `clamp()`, flexible grids, and `min-height: 0` to ensure your content scales mathematically to fit constraints without overflowing.

---

## 🚀 Creating Your First Widget

### 1. File Structure
Create a new folder and file for your widget, for example:
`/modules/widgets.hello/hello.module.js`

### 2. The Plugin Skeleton
Every widget must export an object containing `meta` data and a `renderWidget` function.

```javascript
export default {
    // 1. Describe your module to the OS Registry
    meta: {
        name: 'mod.widget.hello',     // Unique internal ID
        label: 'Hello World Widget',  // Human-readable name
        version: '1.0.0',
        author: 'Your Name',          // Displayed in the Widget Store gallery
        category: 'Productivity',     // Used for Gallery filtering/badges
        kind: 'widget',               // CRITICAL: Tells the OS this is a Dashboard Widget
        description: 'A simple demo widget.'
    },

    // 2. Optional: Define default local state/data
    data: {
        clickCount: 0
    },

    // 3. Optional: Lifecycle hook called when the OS boots up
    async init(ctx) {
        // Load any saved preferences for this widget
        const saved = ctx.storage.read(this.meta.name, 'data');
        if (saved) {
            this.data = { ...this.data, ...saved };
        }
    },

    // Helper to save state
    _save(ctx) {
        ctx.storage.write(this.meta.name, 'data', this.data);
    },

    // 4. THE CORE REQUIREMENT: Return a DOM element
    // ctx: Global App Context (has ctx.storage, ctx.theme, etc)
    // config: The instance config (e.g., config.id, config.colSpan, config.rowSpan)
    renderWidget(ctx, config) {
        // Create the root container for your widget
        const body = document.createElement('div');
        
        // CSS Best Practice: Use global UI variables for background/text colors
        body.style.background = 'var(--ui-surface-2)';
        body.style.color = 'var(--ui-text)';
        
        // CSS Best Practice: Use clamp() for padding/gaps so it scales on a 1x1 grid
        body.style.padding = 'clamp(8px, 1vw, 16px)';
        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        body.style.justifyContent = 'center';
        body.style.alignItems = 'center';
        
        // CRITICAL: Force the widget to consume the exact height of its grid slot
        body.style.height = '100%'; 
        body.style.overflow = 'hidden';

        // Set Inner HTML
        body.innerHTML = \`
            <h3 style="margin: 0; font-size: clamp(1em, 2vw, 1.5em);">👋 Hello!</h3>
            <p style="color: var(--ui-muted); font-size: clamp(0.7em, 1.5vw, 0.9em);">
                Clicks: <span id="click-count">\${this.data.clickCount}</span>
            </p>
            <button id="btn-click" style="
                margin-top: 8px;
                padding: 6px 12px;
                background: var(--ui-accent);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            ">Click Me!</button>
        \`;

        // Attach event listeners
        body.querySelector('#btn-click').onclick = () => {
            this.data.clickCount++;
            this._save(ctx);
            body.querySelector('#click-count').textContent = this.data.clickCount;
        };

        // Return the DOM element to the layout engine
        return body;
    },

    // 5. Optional: Inject an Admin Panel UI into the OS
    adminSections(ctx) {
        return [{
            tab: 'Hello Widget',
            icon: '👋',
            id: 'feature_hello_manage',
            title: 'Hello Widget Settings',
            hint: 'Configure preferences for the Hello widget.',
            render: (el) => {
                el.innerHTML = \`
                    <details style="background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius); box-shadow: var(--ui-elev); overflow: hidden;" open>
                        <summary style="padding: 16px; font-weight: bold; cursor: pointer; outline: none; background: var(--ui-surface-2); border-bottom: 1px solid var(--ui-border); display: flex; align-items: center;">
                            ⚙️ Reset Widget
                        </summary>
                        <div style="padding: 16px;">
                            <button id="btn-reset" style="padding: 8px 16px; background: #ff4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Reset Click Counter
                            </button>
                        </div>
                    </details>
                \`;

                el.querySelector('#btn-reset').onclick = () => {
                    this.data.clickCount = 0;
                    this._save(ctx);
                    alert("Counter reset!");
                };
            }
        }];
    }
};
```

### 3. Registering the Plugin
Currently, modules must be manually added to the OS Bootloader array.
Open `core/app.js`, locate `this.modulesToLoad`, and add your plugin path:

```javascript
this.modulesToLoad = [
    // ... core modules ...
    './modules/widgets.sysmon/sysmon.module.js',
    './modules/widgets.hello/hello.module.js' // <- Your plugin!
];
```

*Note: In the future, we plan to implement automatic filesystem/remote scanning to bypass manual registration.*

---

## 🎨 Design System Cheat Sheet

When styling your widget, ALWAYS use these CSS variables to inherit the OS theme:

| Variable | Usage |
|----------|-------|
| `var(--ui-bg)` | The deep app background (rarely used in widgets). |
| `var(--ui-surface)` | The primary card/widget background color. |
| `var(--ui-surface-2)` | A slightly lighter/brighter secondary background (good for headers/accents). |
| `var(--ui-border)` | Outlines, borders, and dividers. |
| `var(--ui-text)` | Primary body text color. |
| `var(--ui-muted)` | Disabled, placeholder, or secondary/subtitle text. |
| `var(--ui-accent)` | The user's chosen primary color (use for buttons, active states, progress bars). |

## 🏷️ Standard Categories

When defining your widget's `meta.category`, please use one of the standard categories so they group nicely in the Store UI:

- **Time** (Clocks, Timers, Calendars)
- **Environment** (Weather, Maps, World Clocks)
- **System** (Monitors, Hardware, OS Stats)
- **Utility** (Calculators, Notes, Tools)
- **Media** (Music, iFrames, News)
- **Productivity** (Tasks, Kanban, Focus)
- **Finance** (Stocks, Crypto)
- **Other** (If none of the above fit)

## 📐 Responsive Math Cheat Sheet

To prevent your widget from overflowing on small 1x1 grids, or looking empty on large 2x2 grids, follow the "Sysmon Rule":
1. **Never use fixed heights or margins/paddings.** 
2. Use `padding: clamp(4px, 1vw, 8px)` instead of `padding: 16px`.
3. Use `font-size: clamp(0.7em, 2vw, 1.2em)` instead of `font-size: 16px`.
4. If using `display: grid` internally, apply `min-height: 0` to your columns/rows so they understand they are allowed to shrink infinitely below their content's natural baseline.
