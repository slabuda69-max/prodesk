/**
 * Feature: Quick Links
 * Renders the topbar quick-access buttons (YouTube, Amazon, etc.) 
 * horizontally in #slot-topbar.
 */

export default {
    meta: {
        name: 'mod.feature.quicklinks',
        label: 'Quick Links',
        version: '1.0.0',
        kind: 'feature',
        description: 'Horizontal bar of circular shortcut icons at the top of the dashboard.'
    },

    data: {
        links: []
    },

    async init(ctx) {
        const saved = ctx.storage.read('mod.feature.quicklinks', 'data');
        if (saved && Array.isArray(saved.links)) {
            this.data.links = saved.links;
        } else {
            // Default seed data matching startpage05.html
            this.data.links = [
                { id: 'q-1', title: 'YouTube', url: 'https://www.youtube.com', bg: '#FF0000', ico: '▶' },
                { id: 'q-2', title: 'Amazon', url: 'https://www.amazon.com', bg: '#FF9900', ico: 'a' },
                { id: 'q-3', title: 'Google', url: 'https://www.google.com', bg: '#4285F4', ico: 'G' },
                { id: 'q-4', title: 'Spotify', url: 'https://open.spotify.com', bg: '#1DB954', ico: '🎧' }
            ];
            this._save(ctx);
        }
        
        ctx.events.on('quicklinks:refresh', () => this.mount(ctx));
    },

    _save(ctx) {
        ctx.storage.write('mod.feature.quicklinks', 'data', this.data.links);
    },

    async mount(ctx) {
        const slot = ctx.slots.topbar;
        if (!slot) return;
        slot.style.display = 'flex';
        slot.style.gap = '8px';
        slot.style.flexWrap = 'wrap';
        slot.innerHTML = '';

        this.data.links.forEach(link => {
            const btn = document.createElement('a');
            btn.href = link.url;
            btn.target = '_blank';
            btn.title = link.title;
            btn.style.display = 'inline-flex';
            btn.style.alignItems = 'center';
            btn.style.gap = '8px';
            btn.style.backgroundColor = 'var(--ui-surface-2)';
            btn.style.border = '1px solid var(--ui-border)';
            btn.style.color = 'var(--ui-text)';
            btn.style.borderRadius = '999px';
            btn.style.padding = '6px 12px 6px 6px';
            btn.style.textDecoration = 'none';
            btn.style.boxShadow = 'var(--ui-elev)';
            btn.style.transition = 'filter 0.1s linear';
            
            btn.onmouseenter = () => btn.style.filter = 'brightness(1.1)';
            btn.onmouseleave = () => btn.style.filter = 'none';

            const ico = document.createElement('span');
            ico.style.width = '24px';
            ico.style.height = '24px';
            ico.style.borderRadius = '50%';
            ico.style.display = 'grid';
            ico.style.placeItems = 'center';
            ico.style.fontWeight = '800';
            ico.style.fontSize = '12px';
            ico.style.color = '#fff';
            ico.style.backgroundColor = link.bg || '#4aa3ff';
            ico.textContent = link.ico;

            const label = document.createElement('span');
            label.style.fontSize = '13px';
            label.style.fontWeight = '500';
            label.textContent = link.title;

            btn.appendChild(ico);
            btn.appendChild(label);
            slot.appendChild(btn);
        });
    },

    async unmount(ctx) {
        if (ctx.slots.topbar) {
            ctx.slots.topbar.innerHTML = '';
        }
    },

    adminSections(ctx) {
        return [{
            tab: 'Quick Links',
            icon: '🔗',
            id: 'feature_quicklinks_manage',
            title: 'Manage Topbar Icons',
            hint: 'Add round shortcut icons to the top of your dashboard.',
            render: (el) => this._renderAdminContent(el, ctx)
        }];
    },

// Fixed Template literal error by not nesting raw backticks in el.innerHTML
    _renderAdminContent(el, ctx) {
        el.innerHTML = `
            <style>
                .q-card { background: var(--ui-surface-2); border: 1px solid var(--ui-border); padding: 12px; margin-bottom: 8px; border-radius: var(--ui-radius); display:flex; justify-content:space-between; align-items:center; }
                .q-btn { padding: 4px 8px; cursor: pointer; border: 1px solid var(--ui-border); border-radius: 4px; background: var(--ui-surface); color: var(--ui-text); }
                .q-btn:hover { background: var(--ui-surface-2); }
                .q-btn-primary { background: var(--ui-accent); color: white; border-color: var(--ui-accent); }
                .q-btn-danger { color: #ff4444; border-color: #ff4444; }
                .q-input { padding: 8px; border: 1px solid var(--ui-border); border-radius: 6px; background: var(--ui-surface); color: var(--ui-text); width: 100%; box-sizing: border-box; }
            </style>
            
            <details style="background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius); margin-bottom: 16px;" open>
                <summary style="padding: 16px; font-weight: bold; cursor: pointer; outline: none; background: var(--ui-surface-2); border-radius: var(--ui-radius); border-bottom: 1px solid var(--ui-border);">🔗 Add Quick Link</summary>
                <div style="padding: 16px;">
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <div style="flex: 2;">
                        <input type="text" id="ql-title" class="q-input" placeholder="Title (e.g. Netflix)">
                    </div>
                    <div style="flex: 3;">
                        <input type="url" id="ql-url" class="q-input" placeholder="URL">
                    </div>
                </div>
                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <input type="text" id="ql-ico" class="q-input" placeholder="Icon Text (e.g. N)" maxlength="2">
                    </div>
                    <div style="flex: 1; display:flex; align-items:center; gap: 8px;">
                        <span style="font-size:0.85em;">Color:</span>
                        <input type="color" id="ql-color" value="#e50914" style="height:35px; width:50px; background:none; border:none; cursor:pointer;">
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end;">
                    <button id="ql-btn-add" class="q-btn q-btn-primary">Add Quick Link</button>
                </div>
                </div>
            </details>

            <div id="ql-list-container"></div>
        `;

        el.querySelector('#ql-btn-add').onclick = () => {
            const title = el.querySelector('#ql-title').value.trim();
            const url = el.querySelector('#ql-url').value.trim();
            const ico = el.querySelector('#ql-ico').value.trim();
            const bg = el.querySelector('#ql-color').value;

            if (!title || !url || !ico) { alert('Title, URL, and an Icon character are required.'); return; }
            
            let safeUrl = url;
            if (!/^https?:\/\//i.test(safeUrl)) safeUrl = 'https://' + safeUrl;

            this.data.links.push({
                id: 'ql-' + Date.now(),
                title, url: safeUrl, ico: ico.substring(0, 2), bg
            });

            this._save(ctx);
            ctx.events.emit('quicklinks:refresh');
            this._renderAdminContent(el, ctx);
        };

        const list = el.querySelector('#ql-list-container');
        this.data.links.forEach((l, idx) => {
            const row = document.createElement('div');
            row.className = 'q-card';
            
            // Using standard string concatenation instead of nested template literals
            // to avoid parsers choking on backslash-escaped backticks.
            row.innerHTML = 
                '<div style="display:flex; align-items:center; gap: 10px;">' +
                    '<div style="width:24px; height:24px; border-radius:50%; background:' + l.bg + '; color:white; display:grid; place-items:center; font-weight:bold; font-size:12px;">' + l.ico + '</div>' +
                    '<div>' +
                        '<div style="font-weight:bold;">' + l.title + '</div>' +
                        '<div style="font-size:0.8em; color:var(--ui-muted);">' + l.url + '</div>' +
                    '</div>' +
                '</div>';

            const controls = document.createElement('div');
            controls.style.display = 'flex';
            controls.style.gap = '4px';

            if (idx > 0) {
                const btnUp = document.createElement('button');
                btnUp.className = 'q-btn';
                btnUp.innerHTML = '&#9650;';
                btnUp.onclick = () => {
                    const temp = this.data.links[idx - 1];
                    this.data.links[idx - 1] = l;
                    this.data.links[idx] = temp;
                    this._save(ctx);
                    ctx.events.emit('quicklinks:refresh');
                    this._renderAdminContent(el, ctx);
                };
                controls.appendChild(btnUp);
            }

            if (idx < this.data.links.length - 1) {
                const btnDn = document.createElement('button');
                btnDn.className = 'q-btn';
                btnDn.innerHTML = '&#9660;';
                btnDn.onclick = () => {
                    const temp = this.data.links[idx + 1];
                    this.data.links[idx + 1] = l;
                    this.data.links[idx] = temp;
                    this._save(ctx);
                    ctx.events.emit('quicklinks:refresh');
                    this._renderAdminContent(el, ctx);
                };
                controls.appendChild(btnDn);
            }

            const btnDel = document.createElement('button');
            btnDel.className = 'q-btn q-btn-danger';
            btnDel.innerHTML = '&times;';
            btnDel.onclick = () => {
                this.data.links.splice(idx, 1);
                this._save(ctx);
                ctx.events.emit('quicklinks:refresh');
                this._renderAdminContent(el, ctx);
            };
            controls.appendChild(btnDel);

            row.appendChild(controls);
            list.appendChild(row);
        });
    }
}
