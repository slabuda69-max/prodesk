/**
 * Feature: Quick Search
 * Renders the Google/Bing search bar into #slot-header.
 * Replicates the startpage05.html search behavior.
 */

export default {
    meta: {
        name: 'mod.feature.search',
        label: 'Quick Search',
        version: '1.0.0',
        kind: 'feature',
        description: 'Universal web search bar in the header.'
    },

    data: {
        engine: 'https://www.google.com/search?q=%s'
    },

    async init(ctx) {
        const saved = ctx.storage.read('mod.feature.search', 'data');
        if (saved && saved.engine) {
            this.data.engine = saved.engine;
        }
    },

    _save(ctx) {
        ctx.storage.write('mod.feature.search', 'data', this.data);
    },

    async mount(ctx) {
        const slot = ctx.slots.header;
        if (!slot) return;
        
        // We inject it into the header, alongside the title (if we want one)
        // Ensure the slot displays properly
        slot.style.display = 'flex';
        
        // Create the search container matching startpage05 style loosely
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.gap = '10px';
        container.style.flex = '1';
        container.style.maxWidth = '600px';
        container.style.marginLeft = 'auto'; // push to right

        const select = document.createElement('select');
        select.style.background = 'var(--ui-surface-2)';
        select.style.color = 'var(--ui-text)';
        select.style.border = '1px solid var(--ui-border)';
        select.style.padding = '8px 12px';
        select.style.borderRadius = 'var(--ui-radius)';
        select.style.outline = 'none';
        
        const engines = [
            { name: 'Google', url: 'https://www.google.com/search?q=%s' },
            { name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
            { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' }
        ];

        engines.forEach(eng => {
            const opt = document.createElement('option');
            opt.value = eng.url;
            opt.textContent = eng.name;
            if (this.data.engine === eng.url) opt.selected = true;
            select.appendChild(opt);
        });

        select.addEventListener('change', () => {
            this.data.engine = select.value;
            this._save(ctx);
        });

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search the web... (Press Enter)';
        input.style.flex = '1';
        input.style.background = 'var(--ui-surface-2)';
        input.style.color = 'var(--ui-text)';
        input.style.border = '1px solid var(--ui-border)';
        input.style.padding = '8px 16px';
        input.style.borderRadius = 'var(--ui-radius)';
        input.style.outline = 'none';

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = input.value.trim();
                if (val) {
                    const target = this.data.engine.replace('%s', encodeURIComponent(val));
                    window.location.href = target;
                }
            }
        });

        container.appendChild(select);
        container.appendChild(input);
        
        // Don't overwrite existing header content, append to it
        slot.appendChild(container);
    },

    async unmount(ctx) {
        if (ctx.slots.header) {
            // Only remove our search bar, not other header items if they exist
            // For MVP we just clear
            ctx.slots.header.innerHTML = '';
        }
    }
}
