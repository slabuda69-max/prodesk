/**
 * Feature: Widgets (Enhanced Premium Version)
 * Renders an adjustable grid of cards in #slot-widgets.
 * Supports custom sizes (1x1, 2x2, etc) and premium widget types (Clock, Weather, Notes, iFrame).
 */

export default {
    meta: {
        name: 'mod.feature.widgets',
        label: 'Widgets',
        version: '1.1.0',
        kind: 'feature',
        description: 'Premium dashboard cards, live clocks, and dynamic embeds.'
    },

    data: {
        widgets: []
    },

    async init(ctx) {
        const saved = ctx.storage.read('mod.feature.widgets', 'data');
        if (saved && Array.isArray(saved.widgets)) {
            this.data = saved;
        }

        // Default getting started widgets if empty
        if (!saved || this.data.widgets.length === 0) {
            this.data.widgets = [
                {
                    id: 'w-clock-' + Date.now(),
                    type: 'clock',
                    title: 'Local Time',
                    colSpan: 1,
                    rowSpan: 1
                },
                {
                    id: 'w-weather-' + Date.now(),
                    type: 'weather',
                    title: 'Weather Status',
                    colSpan: 1,
                    rowSpan: 1
                },
                {
                    id: 'w-notes-' + Date.now(),
                    type: 'notes',
                    title: 'Welcome Notes',
                    content: 'Welcome to your premium dashboard.\\n\\nPress Alt+A to customize these widgets, change the layout size, or switch themes.',
                    colSpan: 2,
                    rowSpan: 2
                }
            ];
            this._save(ctx);
        }

        ctx.events.on('widgets:refresh', () => this.mount(ctx));
    },

    _save(ctx) {
        ctx.storage.write('mod.feature.widgets', 'data', this.data);
    },

    async mount(ctx) {
        const slot = ctx.slots.widgets;
        if (!slot) return;
        slot.innerHTML = '';

        if (this.data.widgets.length === 0) {
            slot.innerHTML = `<div style="color:var(--ui-muted); grid-column: 1 / -1; text-align:center; padding: 40px; font-size: 1.2rem; font-weight: 300;">Your dashboard is empty. Add widgets via <kbd>Alt+A</kbd> settings.</div>`;
            return;
        }

        // Setup clock interval tracker so we can clean up if re-mounted
        if (this._clockInterval) clearInterval(this._clockInterval);
        const clockElements = [];

        this.data.widgets.forEach(w => {
            const card = document.createElement('div');
            
            // Premium Card Styling
            card.style.backgroundColor = 'var(--ui-surface)';
            card.style.border = '1px solid var(--ui-border)';
            card.style.borderRadius = 'var(--ui-radius)';
            card.style.boxShadow = 'var(--ui-elev)';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.overflow = 'hidden';
            card.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
            
            // Grid Spanning Logic
            const col = Number(w.colSpan) || 1;
            const row = Number(w.rowSpan) || 1;
            card.style.gridColumn = `span ${col}`;
            card.style.gridRow = `span ${row}`;

            // Hover effects for premium feel
            card.onmouseenter = () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = 'calc(var(--ui-elev) + 0 8px 16px rgba(0,0,0,0.1))'; };
            card.onmouseleave = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'var(--ui-elev)'; };

            // Widget Header (Hidden on visual widgets like Clock/Weather depending on preference, but kept for consistency)
            const header = document.createElement('div');
            header.style.padding = '10px 16px';
            header.style.backgroundColor = 'var(--ui-surface-2)';
            header.style.borderBottom = '1px solid var(--ui-border)';
            header.style.fontWeight = '600';
            header.style.fontSize = '0.85em';
            header.style.textTransform = 'uppercase';
            header.style.letterSpacing = '0.5px';
            header.style.color = 'var(--ui-muted)';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.flexShrink = '0';
            header.textContent = w.title || 'Widget';
            card.appendChild(header);

            // Widget Content Body
            const body = document.createElement('div');
            body.style.flex = '1';
            body.style.display = 'flex';
            body.style.flexDirection = 'column';
            body.style.position = 'relative';
            body.style.overflow = 'hidden';

            if (w.type === 'notes') {
                const ta = document.createElement('textarea');
                ta.value = w.content || '';
                ta.style.flex = '1';
                ta.style.width = '100%';
                ta.style.border = 'none';
                ta.style.resize = 'none';
                ta.style.padding = '16px';
                ta.style.backgroundColor = 'transparent';
                ta.style.color = 'var(--ui-text)';
                ta.style.fontFamily = 'inherit';
                ta.style.fontSize = '1.05rem';
                ta.style.lineHeight = '1.5';
                ta.style.outline = 'none';
                
                let timeout;
                ta.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        w.content = ta.value;
                        this._save(ctx);
                        header.style.color = 'var(--ui-accent)';
                        setTimeout(() => header.style.color = 'var(--ui-muted)', 500);
                    }, 500);
                });
                body.appendChild(ta);

                // Add Export Button to Header
                const exportBtn = document.createElement('button');
                exportBtn.textContent = '💾 TXT';
                exportBtn.title = 'Export to TXT';
                exportBtn.style.background = 'transparent';
                exportBtn.style.border = '1px solid var(--ui-border)';
                exportBtn.style.color = 'var(--ui-muted)';
                exportBtn.style.borderRadius = '4px';
                exportBtn.style.cursor = 'pointer';
                exportBtn.style.fontSize = '0.85em';
                exportBtn.style.padding = '2px 6px';
                exportBtn.style.marginLeft = '8px';
                
                exportBtn.onmouseenter = () => { exportBtn.style.color = 'var(--ui-text)'; exportBtn.style.borderColor = 'var(--ui-text)'; };
                exportBtn.onmouseleave = () => { exportBtn.style.color = 'var(--ui-muted)'; exportBtn.style.borderColor = 'var(--ui-border)'; };

                exportBtn.onclick = () => {
                    const blob = new Blob([ta.value], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = (w.title || 'notes').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_' + Date.now() + '.txt';
                    a.click();
                    URL.revokeObjectURL(url);
                };
                header.appendChild(exportBtn);

            } else if (w.type === 'clock') {
                body.style.justifyContent = 'center';
                body.style.alignItems = 'center';
                body.style.background = 'linear-gradient(135deg, var(--ui-surface) 0%, var(--ui-surface-2) 100%)';
                
                const timeStr = document.createElement('div');
                timeStr.style.fontSize = '2.5rem';
                timeStr.style.fontWeight = '300';
                timeStr.style.letterSpacing = '-1px';
                timeStr.style.color = 'var(--ui-text)';
                
                const dateStr = document.createElement('div');
                dateStr.style.fontSize = '0.9rem';
                dateStr.style.color = 'var(--ui-muted)';
                dateStr.style.marginTop = '4px';
                dateStr.style.textTransform = 'uppercase';
                
                body.appendChild(timeStr);
                body.appendChild(dateStr);
                clockElements.push({ t: timeStr, d: dateStr });

            } else if (w.type === 'weather') {
                body.style.justifyContent = 'center';
                body.style.alignItems = 'center';
                header.style.display = 'none'; // immersive

                const mainWeather = ctx.storage.read('mod.feature.weather', 'data') || { city: 'Unknown', unit: 'fahrenheit', lat: 40.7128, lon: -74.0060 };
                const wCity = mainWeather.city;

                // Premium weather gradient + dynamic background based on city
                body.style.background = `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url("https://picsum.photos/seed/${encodeURIComponent(wCity + ' weather')}/600/400")`;
                body.style.backgroundSize = 'cover';
                body.style.backgroundPosition = 'center';
                body.style.color = 'white';
                body.style.textShadow = '0 2px 6px rgba(0,0,0,0.8)';
                
                const wIconStr = document.createElement('div');
                wIconStr.style.fontSize = '3.5rem';
                wIconStr.style.lineHeight = '1.2';
                wIconStr.innerHTML = '⛅';

                const wTempStr = document.createElement('div');
                wTempStr.style.fontSize = '2.5rem';
                wTempStr.style.fontWeight = 'bold';
                wTempStr.innerHTML = '--°';

                const wDescStr = document.createElement('div');
                wDescStr.style.fontSize = '0.9rem';
                wDescStr.style.opacity = '0.9';
                wDescStr.style.marginTop = '4px';
                wDescStr.innerHTML = 'Loading・' + wCity;

                body.appendChild(wIconStr);
                body.appendChild(wTempStr);
                body.appendChild(wDescStr);

                // Fetch real-time localized weather via Open-Meteo
                if (mainWeather.lat !== undefined && mainWeather.lon !== undefined) {
                    const unit = mainWeather.unit || 'fahrenheit';
                    const tmpCode = unit === 'fahrenheit' ? 'temperature_unit=fahrenheit' : '';
                    const sym = unit === 'fahrenheit' ? '°F' : '°C';
                    const url = `https://api.open-meteo.com/v1/forecast?latitude=${mainWeather.lat}&longitude=${mainWeather.lon}&current=temperature_2m,weather_code&timezone=auto&${tmpCode}`;
                    
                    fetch(url).then(r => r.json()).then(data => {
                        if(data && data.current) {
                            const curTemp = Math.round(data.current.temperature_2m);
                            const curCode = data.current.weather_code;
                            let icon = '🌡️';
                            let desc = 'Clear';
                            if (curCode === 0) { icon = '☀️'; desc = 'Clear'; }
                            else if (curCode === 1 || curCode === 2) { icon = '⛅'; desc = 'Partly Cloudy'; }
                            else if (curCode === 3) { icon = '☁️'; desc = 'Overcast'; }
                            else if (curCode >= 45 && curCode <= 48) { icon = '🌫️'; desc = 'Fog'; }
                            else if (curCode >= 51 && curCode <= 67) { icon = '🌧️'; desc = 'Rain'; }
                            else if (curCode >= 80 && curCode <= 82) { icon = '🌧️'; desc = 'Showers'; }
                            else if (curCode >= 95) { icon = '🌩️'; desc = 'Thunderstorm'; }
                            
                            wIconStr.innerHTML = icon;
                            wTempStr.innerHTML = curTemp + sym;
                            wDescStr.innerHTML = desc + '・' + wCity;
                        }
                    }).catch(e => {
                        wDescStr.innerHTML = 'Error loading weather API.';
                        console.error('Weather widget fetch error', e);
                    });
                }

            } else if (w.type === 'iframe' || w.type === 'calendar') {
                const iframe = document.createElement('iframe');
                iframe.src = w.url;
                iframe.style.flex = '1';
                iframe.style.width = '100%';
                iframe.style.border = 'none';
                iframe.sandbox = "allow-scripts allow-same-origin allow-popups allow-forms";
                iframe.referrerPolicy = "no-referrer";

                if (w.type === 'calendar') {
                    // Startpage05 style calendar: completely flush iframe, no header.
                    header.style.display = 'none';
                    body.style.padding = '0';
                    iframe.style.borderRadius = 'var(--ui-radius)';
                    // Force calendar to take up full available height
                    iframe.style.height = '100%';
                    iframe.style.minHeight = '300px'; 
                }

                body.appendChild(iframe);
                
                // Allow opening iframe source directly if not calendar
                if (w.type !== 'calendar') {
                    const extLink = document.createElement('a');
                    extLink.href = w.url;
                    extLink.target = '_blank';
                    extLink.innerHTML = '↗️';
                    extLink.style.textDecoration = 'none';
                    extLink.style.fontSize = '0.9em';
                    extLink.title = 'Open external';
                    header.appendChild(extLink);
                }
            } else if (w.type === 'destination') {
                body.style.justifyContent = 'center';
                body.style.alignItems = 'center';
                body.style.background = `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url("https://picsum.photos/seed/${encodeURIComponent(w.city || w.title)}/600/400")`;
                body.style.backgroundSize = 'cover';
                body.style.backgroundPosition = 'center';
                body.style.color = 'white';
                body.style.textShadow = '0 2px 6px rgba(0,0,0,0.9)';
                header.style.display = 'none'; // immersive

                const timeStr = document.createElement('div');
                timeStr.style.fontSize = '3.5rem';
                timeStr.style.fontWeight = 'bold';
                timeStr.style.letterSpacing = '-2px';
                timeStr.style.lineHeight = '1.1';
                
                const cityStr = document.createElement('div');
                cityStr.style.fontSize = '1.2rem';
                cityStr.style.fontWeight = '600';
                cityStr.style.marginTop = '4px';
                cityStr.textContent = w.city || w.title;

                const weatherStr = document.createElement('div');
                weatherStr.style.fontSize = '1.1rem';
                weatherStr.style.marginTop = '8px';
                weatherStr.style.color = 'rgba(255,255,255,0.9)';
                weatherStr.innerHTML = '<span style="opacity:0.6;">Fetching Weather...</span>';
                
                body.appendChild(timeStr);
                body.appendChild(cityStr);
                body.appendChild(weatherStr);

                clockElements.push({ t: timeStr, timezone: w.timezone });

                // Fetch real-time localized weather via Open-Meteo
                if (w.lat !== undefined && w.lon !== undefined) {
                    // Try to grab global unit preference, default Fahrenheit
                    let unit = 'fahrenheit';
                    const mainWeather = ctx.storage.read('mod.feature.weather', 'data');
                    if (mainWeather && mainWeather.unit) unit = mainWeather.unit;
                    
                    const tmpCode = unit === 'fahrenheit' ? 'temperature_unit=fahrenheit' : '';
                    const sym = unit === 'fahrenheit' ? '°F' : '°C';
                    const url = `https://api.open-meteo.com/v1/forecast?latitude=${w.lat}&longitude=${w.lon}&current=temperature_2m,weather_code&timezone=auto&${tmpCode}`;
                    
                    fetch(url).then(r => r.json()).then(data => {
                        if(data && data.current) {
                            const curTemp = Math.round(data.current.temperature_2m);
                            const curCode = data.current.weather_code;
                            let icon = '🌡️';
                            if (curCode === 0) icon = '☀️'; 
                            else if (curCode === 1 || curCode === 2) icon = '⛅'; 
                            else if (curCode === 3) icon = '☁️'; 
                            else if (curCode >= 45 && curCode <= 48) icon = '🌫️'; 
                            else if (curCode >= 51 && curCode <= 67) icon = '🌧️'; 
                            else if (curCode >= 80 && curCode <= 82) icon = '🌧️'; 
                            else if (curCode >= 95) icon = '🌩️';
                            weatherStr.innerHTML = `<span style="font-size:1.2em; vertical-align:middle;">${icon}</span> ${curTemp}${sym}`;
                        }
                    }).catch(e => weatherStr.innerHTML = '⚠️ Offline');
                }
            } else {
                // TRUE PLUGIN ARCHITECTURE: If not a legacy hardcoded type, query Registry.
                // It asks the OS for ANY module that matches this widget's type.
                const plugin = ctx.registry ? ctx.registry.getAllModules().find(m => m.meta && m.meta.kind === 'widget' && m.meta.name === w.type) : null;
                if (plugin && typeof plugin.renderWidget === 'function') {
                    // Hide Header for seamless plugin takeover
                    header.style.display = 'none';
                    body.style.padding = '0'; // Let the plugin handle its own padding 
                    try {
                        const pluginDom = plugin.renderWidget(ctx, w);
                        if (pluginDom) body.appendChild(pluginDom);
                    } catch(err) {
                        body.innerHTML = `<div style="padding:16px; color:#ff4444;">Plugin Engine Crash: ${err.message}</div>`;
                    }
                } else {
                    body.innerHTML = `<div style="padding:16px; color:var(--ui-muted);">Widget type '${w.type}' not installed.</div>`;
                }
            }

            card.appendChild(body);
            slot.appendChild(card);
        });

        // Start Clock Engine
        if (clockElements.length > 0) {
            const updateClocks = () => {
                const now = new Date();
                const defaultT = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const defaultD = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
                
                clockElements.forEach(el => {
                    if (el.timezone) {
                        try {
                            el.t.textContent = now.toLocaleTimeString('en-US', { timeZone: el.timezone, hour: '2-digit', minute: '2-digit' });
                        } catch(e) { el.t.textContent = defaultT; }
                    } else {
                        el.t.textContent = defaultT;
                        if (el.d) el.d.textContent = defaultD;
                    }
                });
            };
            updateClocks();
            this._clockInterval = setInterval(updateClocks, 1000);
        }
    },

    async unmount(ctx) {
        if (this._clockInterval) clearInterval(this._clockInterval);
        if (ctx.slots.widgets) ctx.slots.widgets.innerHTML = '';
    },

    adminSections(ctx) {
        return [{
            tab: 'Widgets (Layout)',
            icon: '🎛️',
            id: 'feature_widgets_manage',
            title: 'Dashboard Grid & Widgets',
            hint: 'Design your grid. Set Columns/Rows to expand widgets across the dashboard.',
            render: (el) => {
                this._renderAdminContent(el, ctx);
            }
        }];
    },

    _renderAdminContent(el, ctx) {
        // Collect all available widget types dynamically
        const coreWidgets = [
            { id: 'notes', icon: '📝', label: 'Notes File', author: 'ProDashboard', category: 'Utility', desc: 'A sleek autosaving notepad.' },
            { id: 'clock', icon: '🕰️', label: 'Live Clock', author: 'ProDashboard', category: 'Time', desc: 'Local time display.' },
            { id: 'weather', icon: '⛅', label: 'Weather', author: 'ProDashboard', category: 'Environment', desc: 'Current conditions forecast.' },
            { id: 'calendar', icon: '📅', label: 'Calendar Embed', author: 'ProDashboard', category: 'Utility', desc: 'iFrame web calendar.' },
            { id: 'iframe', icon: '🌐', label: 'Website iFrame', author: 'ProDashboard', category: 'Media', desc: 'Embed any web URL.' },
            { id: 'destination', icon: '✈️', label: 'Destination Clock', author: 'ProDashboard', category: 'Time', desc: 'World time + Weather.' }
        ];

        let pluginWidgets = [];
        if (ctx.registry) {
            const externalWidgets = ctx.registry.getAllModules().filter(m => m.meta && m.meta.kind === 'widget');
            pluginWidgets = externalWidgets.map(w => ({
                id: w.meta.name,
                icon: w.meta.icon || ((w.meta.label && w.meta.label.includes('Monitor')) ? '💻' : '📦'),
                label: w.meta.label || 'Unknown Plugin',
                author: w.meta.author || 'Community Dev',
                category: w.meta.category || 'Other',
                desc: w.meta.description || 'Community Widget'
            }));
        }

        const allWidgets = [...coreWidgets, ...pluginWidgets];

        el.innerHTML = 
            '<style>' +
                '.w-card { background: var(--ui-surface-2); border: 1px solid var(--ui-border); padding: 16px; margin-bottom: 12px; border-radius: var(--ui-radius); display:flex; flex-direction: column; gap: 8px; }' +
                '.w-btn { padding: 6px 12px; font-weight: 500; cursor: pointer; border: 1px solid var(--ui-border); border-radius: 6px; background: var(--ui-surface); color: var(--ui-text); }' +
                '.w-btn:hover { background: var(--ui-surface-2); filter: brightness(0.95); }' +
                '.w-btn-primary { background: var(--ui-accent); color: white; border-color: var(--ui-accent); }' +
                '.w-btn-danger { color: #ff4444; border-color: #ff4444; }' +
                '.w-input, .w-select { padding: 10px; border: 1px solid var(--ui-border); border-radius: 6px; background: var(--ui-surface); color: var(--ui-text); width: 100%; box-sizing: border-box; }' +
                '.grid-opts { display: flex; gap: 8px; align-items: center; background: var(--ui-surface); padding: 8px; border-radius: 4px; border: 1px solid var(--ui-border); }' +
                '.store-grid { display: flex; overflow-x: auto; gap: 12px; margin-bottom: 24px; padding-bottom: 12px; scrollbar-width: thin; scrollbar-color: var(--ui-border) transparent; }' +
                '.store-grid::-webkit-scrollbar { height: 8px; }' +
                '.store-grid::-webkit-scrollbar-track { background: transparent; }' +
                '.store-grid::-webkit-scrollbar-thumb { background-color: var(--ui-border); border-radius: 10px; }' +
                '.store-item { flex: 0 0 calc(25% - 9px); min-width: 160px; max-width: 220px; background: var(--ui-surface); border: 2px solid var(--ui-border); border-radius: var(--ui-radius); padding: 16px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; box-shadow: var(--ui-elev); position: relative; }' +
                '.store-item:hover { border-color: var(--ui-muted); transform: translateY(-2px); }' +
                '.store-item.selected { border-color: var(--ui-accent); background: rgba(0, 255, 204, 0.05); }' + 
                '.store-icon { font-size: 2em; margin-bottom: 4px; }' +
                '.store-category { position: absolute; top: 8px; right: 8px; font-size: 0.6em; background: var(--ui-surface-2); padding: 2px 6px; border-radius: 4px; color: var(--ui-muted); border: 1px solid var(--ui-border); text-transform: uppercase; letter-spacing: 0.5px; }' +
                '.store-label { font-weight: bold; font-size: 0.9em; margin-bottom: 2px; line-height: 1.2; }' +
                '.store-author { font-size: 0.65em; font-weight: 600; color: var(--ui-accent); text-transform: uppercase; letter-spacing: 0.5px; }' +
                '.store-desc { font-size: 0.75em; color: var(--ui-muted); }' +
            '</style>' +
            
            '<details style="background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius); margin-bottom: 24px; box-shadow: var(--ui-elev); overflow: hidden;" open>' +
                '<summary id="w-add-summary-title" style="padding: 16px; font-weight: bold; cursor: pointer; outline: none; background: var(--ui-surface-2); border-bottom: 1px solid var(--ui-border); display: flex; align-items: center;">🎛️ Add New Widget</summary>' +
                '<div style="padding: 16px;">' +
                
                '<input type="hidden" id="w-edit-id">' +
                '<input type="hidden" id="w-new-type" value="">' + 
                
                '<div style="margin-bottom: 16px;">' +
                    '<input type="text" id="w-store-search" class="w-input" placeholder="🔍 Search widgets by name, category, or author...">' +
                '</div>' +

                '<div class="store-grid" id="w-store-gallery">' +
                    allWidgets.map(w => `
                        <div class="store-item" data-type="${w.id}" data-search="${w.label.toLowerCase()} ${w.author.toLowerCase()} ${w.category.toLowerCase()} ${w.desc.toLowerCase()}">
                            <div class="store-category">${w.category}</div>
                            <div class="store-icon">${w.icon}</div>
                            <div class="store-label">${w.label}</div>
                            <div class="store-author">by ${w.author}</div>
                            <div class="store-desc">${w.desc}</div>
                        </div>
                    `).join('') +
                '</div>' +
                
                '<div id="w-config-panel" style="display: none; border-top: 1px dashed var(--ui-border); padding-top: 20px; margin-top: 8px;">' +
                    '<div style="margin-bottom: 16px;">' +
                        '<label style="display:block; font-size:0.85em; margin-bottom:6px; color: var(--ui-muted); font-weight: bold;">Give it a Title</label>' +
                        '<input type="text" id="w-new-title" class="w-input" placeholder="e.g. My Notes / Main Clock">' +
                    '</div>' +
                    
                    '<div id="w-url-container" style="display:none; margin-bottom: 16px;">' +
                        '<label style="display:block; font-size:0.85em; margin-bottom:6px; color: var(--ui-muted); font-weight: bold;">Embed URL</label>' +
                        '<input type="url" id="w-new-url" class="w-input" placeholder="https://...">' +
                    '</div>' +
    
                    '<div id="w-city-container" style="display:none; margin-bottom: 16px;">' +
                        '<label style="display:block; font-size:0.85em; margin-bottom:6px; color: var(--ui-muted); font-weight: bold;">City / Location</label>' +
                        '<input type="text" id="w-new-city" class="w-input" placeholder="e.g. Orlando, FL">' +
                        '<small style="color:var(--ui-muted); font-size:0.8em; margin-top:4px; display:block;" id="w-city-hint">We will auto-locate this city to resolve coordinates and timezone.</small>' +
                    '</div>' +
    
                    '<div id="w-plugin-config" style="display:none; margin-bottom: 16px; padding: 12px; border: 1px dashed var(--ui-border); border-radius: 8px; background: rgba(0,0,0,0.05);"></div>' +
    
                    '<div class="grid-opts">' +
                        '<label style="font-size:0.9em; font-weight:bold; color:var(--ui-muted);">Dashboard Grid Size:</label>' +
                        '<span style="font-size:0.8em; margin-left: auto;">Columns:</span>' +
                        '<select id="w-new-col" class="w-select" style="width: 70px; padding: 4px;"><option>1</option><option>2</option><option>3</option><option>4</option></select>' +
                        '<span style="font-size:0.8em;">Rows:</span>' +
                        '<select id="w-new-row" class="w-select" style="width: 70px; padding: 4px;"><option>1</option><option>2</option><option>3</option><option>4</option></select>' +
                    '</div>' +
    
                    '<div style="display:flex; justify-content:flex-end; gap:8px; margin-top: 16px;">' +
                        '<button id="w-btn-cancel" class="w-btn" style="display:none;">Cancel Edit</button>' +
                        '<button id="w-btn-add" class="w-btn w-btn-primary">Add to Dashboard</button>' +
                    '</div>' +
                '</div>' + 
                
                '</div>' +
            '</details>' +
            
            '<h3 style="margin-bottom: 12px; color: var(--ui-text);">Current Layout</h3>' +
            '<div id="w-list-container"></div>';

        const typeInput = el.querySelector('#w-new-type');
        const configPanel = el.querySelector('#w-config-panel');
        const urlContainer = el.querySelector('#w-url-container');
        const cityContainer = el.querySelector('#w-city-container');
        const pluginConfigContainer = el.querySelector('#w-plugin-config');
        const storeItems = el.querySelectorAll('.store-item');
        const searchInput = el.querySelector('#w-store-search');
        
        // Handle Search Filtering
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                storeItems.forEach(item => {
                    if (item.dataset.search.includes(query)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
        
        // Handle Gallery Selection
        const selectWidgetType = (typeId, isEditMode = false) => {
            // Update hidden input
            typeInput.value = typeId;
            
            // Update UI styling
            storeItems.forEach(item => {
                if (item.dataset.type === typeId) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
            
            // Reveal Config Panel
            configPanel.style.display = 'block';
            
            // Toggle specific fields based on type
            urlContainer.style.display = (typeId === 'iframe' || typeId === 'calendar') ? 'block' : 'none';
            cityContainer.style.display = typeId === 'destination' ? 'block' : 'none';
            
            // Handle Custom Plugin Configurators dynamically
            pluginConfigContainer.style.display = 'none';
            pluginConfigContainer.innerHTML = '';
            
            if (ctx.registry) {
                const plugin = ctx.registry.getAllModules().find(m => m.meta && m.meta.name === typeId);
                if (plugin && typeof plugin.configurator === 'function') {
                    // Try to find the existing config if we are in Edit Mode
                    const editId = el.querySelector('#w-edit-id').value;
                    let existingConfig = {};
                    if (editId) {
                        const existingWidget = this.data.widgets.find(w => w.id === editId);
                        if (existingWidget && existingWidget.config) {
                            existingConfig = existingWidget.config;
                        }
                    }
                    
                    try {
                        pluginConfigContainer.innerHTML = plugin.configurator(ctx, existingConfig);
                        pluginConfigContainer.style.display = 'block';
                        if (typeof plugin.onConfigMount === 'function') {
                            plugin.onConfigMount(el, ctx, existingConfig);
                        }
                    } catch (e) {
                        console.error("Plugin configurator crash:", e);
                    }
                }
            }
            
            // Auto-scroll to config panel if not actively editing
            if (!isEditMode) {
                configPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        };

        // Attach click listeners to cards
        storeItems.forEach(item => {
            item.onclick = () => {
                selectWidgetType(item.dataset.type);
                // Pre-fill default title if empty
                const titleInput = el.querySelector('#w-new-title');
                if (!titleInput.value || allWidgets.some(w => w.label === titleInput.value)) {
                    const widgetMeta = allWidgets.find(w => w.id === item.dataset.type);
                    if (widgetMeta) titleInput.value = widgetMeta.label;
                }
            };
        });

        el.querySelector('#w-btn-cancel').onclick = () => {
            this._renderAdminContent(el, ctx);
        };

        // Add or Edit Submission
        el.querySelector('#w-btn-add').onclick = async () => {
            const idInput = el.querySelector('#w-edit-id').value;
            const title = el.querySelector('#w-new-title').value.trim();
            const type = typeInput.value;
            let url = el.querySelector('#w-new-url').value.trim();
            const cityInput = el.querySelector('#w-new-city').value.trim();
            const colSpan = el.querySelector('#w-new-col').value;
            const rowSpan = el.querySelector('#w-new-row').value;

            if (!title) { alert('Title is required.'); return; }
            if (type === 'iframe' || type === 'calendar') {
                if (!url) { alert('URL is required for embeds.'); return; }
                if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
            }

            // Extract custom plugin configuration before saving if this plugin uses one
            let customConfig = undefined;
            if (ctx.registry) {
                const plugin = ctx.registry.getAllModules().find(m => m.meta && m.meta.name === type);
                if (plugin && typeof plugin.extractConfig === 'function') {
                    try {
                        customConfig = plugin.extractConfig(el.querySelector('#w-plugin-config'));
                    } catch (e) {
                        console.error("Failed to extract plugin configuration:", e);
                    }
                }
            }

            let lat = 0, lon = 0, timezone = 'America/New_York', resolvedCity = '';

            if (type === 'destination') {
                if (!cityInput) { alert('Location is required for Destination widgets.'); return; }
                const btn = el.querySelector('#w-btn-add');
                const hint = el.querySelector('#w-city-hint');
                btn.textContent = 'Locating...';
                btn.disabled = true;

                try {
                    const parts = cityInput.split(',').map(s => s.trim());
                    const searchCity = parts[0];
                    const searchRegion = parts.length > 1 ? parts[1].toLowerCase() : null;

                    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=10&language=en&format=json`;
                    const gRes = await fetch(geoUrl);
                    const gData = await gRes.json();

                    if (!gData.results || gData.results.length === 0) {
                        hint.style.color = '#ff4444';
                        hint.textContent = 'Could not locate that city. Please try another name.';
                        btn.textContent = idInput ? 'Save Changes' : 'Add to Grid';
                        btn.disabled = false;
                        return;
                    }

                    let location = gData.results[0];
                    if (searchRegion) {
                        const match = gData.results.find(r => 
                            (r.admin1 && r.admin1.toLowerCase().includes(searchRegion)) || 
                            (r.country && r.country.toLowerCase().includes(searchRegion)) ||
                            (r.admin2 && r.admin2.toLowerCase().includes(searchRegion))
                        );
                        if (match) location = match;
                    }
                    
                    resolvedCity = `${location.name}${location.admin1 ? ', ' + location.admin1 : ''}`;
                    lat = location.latitude;
                    lon = location.longitude;
                    timezone = location.timezone || 'America/New_York';
                } catch (err) {
                    hint.style.color = '#ff4444';
                    hint.textContent = 'Network error while searching for city.';
                    btn.textContent = idInput ? 'Save Changes' : 'Add to Grid';
                    btn.disabled = false;
                    return;
                }
            }

            if (idInput) {
                // EDIT Existing
                const widget = this.data.widgets.find(w => w.id === idInput);
                if (widget) {
                    widget.title = title;
                    widget.type = type;
                    widget.colSpan = colSpan;
                    widget.rowSpan = rowSpan;
                    if (type === 'iframe' || type === 'calendar') widget.url = url;
                    if (type === 'destination') {
                        widget.city = resolvedCity;
                        widget.lat = lat;
                        widget.lon = lon;
                        widget.timezone = timezone;
                    }
                    if (customConfig !== undefined) {
                        widget.config = customConfig;
                    }
                }
            } else {
                // ADD New
                this.data.widgets.push({
                    id: 'w-' + Date.now(),
                    title,
                    type,
                    colSpan,
                    rowSpan,
                    url: type === 'iframe' || type === 'calendar' ? url : undefined,
                    city: type === 'destination' ? resolvedCity : undefined,
                    lat: type === 'destination' ? lat : undefined,
                    lon: type === 'destination' ? lon : undefined,
                    timezone: type === 'destination' ? timezone : undefined,
                    config: customConfig,
                    content: ''
                });
            }

            this._save(ctx);
            ctx.events.emit('widgets:refresh');
            this._renderAdminContent(el, ctx);
        };

        // List existing
        const list = el.querySelector('#w-list-container');
        if (this.data.widgets.length === 0) {
            list.innerHTML = '<div style="color:var(--ui-muted); text-align:center; padding: 20px;">No widgets.</div>';
        }

        this.data.widgets.forEach((w, idx) => {
            const row = document.createElement('div');
            row.className = 'w-card';
            
            let configDetails = '';
            if (w.config && w.config.feedType) {
                configDetails = ` (${w.config.feedType.toUpperCase()})`;
            }

            row.innerHTML = 
                '<div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--ui-border); padding-bottom: 12px; margin-bottom: 12px;">' +
                    '<div style="min-width: 0; display:flex; flex-direction:column; gap:6px;">' + 
                        '<div style="font-weight: bold; font-size: 1.25em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="' + w.title + '">' + w.title + '</div>' +
                        '<div style="font-size: 0.85em; color: var(--ui-accent); font-weight: 600; text-transform: uppercase;">' + w.type + configDetails + (w.url ? ' &middot; ' + w.url : '') + (w.city ? ' &middot; ' + w.city : '') + '</div>' +
                    '</div>' +
                    '<div style="font-size: 1.1em; font-family: monospace; font-weight: 900; opacity: 0.8;">' + (w.colSpan || 1) + 'C &times; ' + (w.rowSpan || 1) + 'R</div>' +
                '</div>' +
                '<div style="display: flex; justify-content: flex-end; gap: 8px;">' +
                    '<button class="w-btn btn-edit">Edit Settings</button>' +
                    (idx > 0 ? '<button class="w-btn btn-up" title="Move Up">&#9650;</button>' : '') +
                    (idx < this.data.widgets.length - 1 ? '<button class="w-btn btn-dn" title="Move Down">&#9660;</button>' : '') +
                    '<button class="w-btn w-btn-danger btn-del" style="margin-left: 8px;">Remove</button>' +
                '</div>';

            row.querySelector('.btn-edit').onclick = () => {
                // Update UI state to Edit Mode
                el.querySelector('#w-add-summary-title').innerHTML = '✏️ Edit Widget';
                el.querySelector('#w-btn-cancel').style.display = 'block';
                const addBtn = el.querySelector('#w-btn-add');
                addBtn.textContent = 'Save Changes';
                addBtn.classList.add('w-btn-primary');
                el.querySelector('details').open = true;

                // Populate Fields
                el.querySelector('#w-edit-id').value = w.id;
                el.querySelector('#w-new-title').value = w.title || '';
                el.querySelector('#w-new-url').value = w.url || '';
                el.querySelector('#w-new-city').value = w.city || '';
                el.querySelector('#w-new-col').value = w.colSpan || 1;
                el.querySelector('#w-new-row').value = w.rowSpan || 1;
                
                // Select type in the gallery and reveal exact config fields
                selectWidgetType(w.type || 'notes', true);
                
                // Scroll down smoothly to the edit form specifically
                setTimeout(() => {
                    const configPanelBox = el.querySelector('#w-config-panel');
                    if (configPanelBox) {
                        configPanelBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 50);
            };

            if(idx > 0) row.querySelector('.btn-up').onclick = () => {
                const temp = this.data.widgets[idx - 1];
                this.data.widgets[idx - 1] = w;
                this.data.widgets[idx] = temp;
                this._save(ctx);
                ctx.events.emit('widgets:refresh');
                this._renderAdminContent(el, ctx);
            };

            if(idx < this.data.widgets.length - 1) row.querySelector('.btn-dn').onclick = () => {
                const temp = this.data.widgets[idx + 1];
                this.data.widgets[idx + 1] = w;
                this.data.widgets[idx] = temp;
                this._save(ctx);
                ctx.events.emit('widgets:refresh');
                this._renderAdminContent(el, ctx);
            };

            row.querySelector('.btn-del').onclick = () => {
                if(confirm('Delete widget "' + w.title + '"?')) {
                    this.data.widgets.splice(idx, 1);
                    this._save(ctx);
                    ctx.events.emit('widgets:refresh');
                    this._renderAdminContent(el, ctx);
                }
            };

            list.appendChild(row);
        });
    }
}
