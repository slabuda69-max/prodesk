/**
 * Core LTS - app.js
 * Main entry point. Bootstraps the appCtx, Admin Scaffold, Theme, and Feature Modules.
 */
import { ModuleRegistry } from './registry.js';

class DashboardOS {
    constructor() {
        this.events = new EventBus();
        this.storage = new StorageWrapper();
        this.theme = new ThemeManager(this.events, this.storage);
        
        // Expose TRD §6 Core-provided ctx
        this.appCtx = {
            events: this.events,
            storage: this.storage,
            theme: this.theme,
            slots: this.getStableSlots()
        };

        this.registry = new ModuleRegistry(this.appCtx);
        this.appCtx.registry = this.registry; // Expose registry to modules dynamically
        this.admin = new AdminScaffold(this.appCtx, this.registry);
    }

    getStableSlots() {
        // Must match IDs in index.html exactly without caching so dynamic removal/adds don't break
        return {
            get header() { return document.getElementById('slot-header'); },
            get topbar() { return document.getElementById('slot-topbar'); },
            get quickbar() { return document.getElementById('slot-quickbar'); },
            get main() { return document.getElementById('slot-main'); },
            get favorites() { return document.getElementById('slot-favorites'); },
            get widgets() { return document.getElementById('slot-widgets'); },
            get overlays() { return document.getElementById('slot-overlays'); },
            get admin() { return document.getElementById('slot-admin'); }
        };
    }

    async boot() {
        this.setupErrorHandling();
        this.admin.init();

        // Sequence: Load modules based on configuration
        const modulesToLoad = [
            '../modules/themes/classic/theme.module.js',
            '../modules/themes/dark/theme.module.js',
            '../modules/themes/light/theme.module.js',
            '../modules/themes/win95/theme.module.js',
            '../modules/themes/win11/theme.module.js',
            '../modules/themes/mac_classic/theme.module.js',
            '../modules/themes/mac_modern/theme.module.js',
            // feature modules:
            '../modules/favorites/favorites.module.js',
            '../modules/widgets/widgets.module.js',
            '../modules/quicksearch/search.module.js',
            '../modules/quicklinks/quicklinks.module.js',
            '../modules/chat/chat.module.js',
            '../modules/weather/weather.module.js',
            // community widget plugins:
            '../modules/widgets.sysmon/sysmon.module.js',
            '../modules/widgets.timer/timer.module.js',
            '../modules/widgets.daily/daily.module.js'
        ];

        // Inject Greeting and subscribe to dynamic Context updates (M10.8)
        this._renderGreeting();
        this.events.on('context:weather_update', (ctx) => this._renderGreeting(ctx));

        const savedGlobal = this.storage.read('core.settings', 'data') || {};
        const disabledModules = savedGlobal.disabledModules || [];

        for (const path of modulesToLoad) {
            // Prevent loading if user explicitly disabled this feature
            if (disabledModules.some(disabledPath => path.includes(disabledPath))) {
                continue;
            }
            try {
                // Ignore load errors for missing modules in M1
                await this.registry.loadModule(path).catch(e => {
                    console.log(`[Boot] Skipping module ${path} (not created yet).`);
                });
            } catch (e) { /* handled in registry */ }
        }

        // Auto-mount all loaded feature modules 
        const loaded = this.registry.getAllModules();
        for (const mod of loaded) {
            if (mod.meta.kind === 'feature' && typeof mod.mount === 'function') {
                try {
                    await mod.mount(this.appCtx);
                } catch (e) {
                    this.events.emit('core:error', { source: `Mount ${mod.meta.name}`, message: e.message });
                }
            }
        }

        // Notify subsystems that all initial modules are in registry
        this.events.emit('os:boot_complete', this.registry);
    }

    _renderGreeting(weatherCtx = null) {
        const headerSlot = this.appCtx.slots.header;
        if (!headerSlot) return;

        let greetingEl = document.getElementById('core-os-greeting');
        if (!greetingEl) {
            greetingEl = document.createElement('div');
            greetingEl.id = 'core-os-greeting';
            greetingEl.style.marginRight = 'auto'; // push others to right
            greetingEl.style.color = 'var(--ui-text)';
            greetingEl.style.fontSize = '1.3rem';
            greetingEl.style.fontWeight = 'bold';
            headerSlot.style.display = 'flex';
            headerSlot.style.alignItems = 'center';
            // Prepend so it appears on the far left
            headerSlot.insertBefore(greetingEl, headerSlot.firstChild);
        }

        const savedGlobal = this.storage.read('core.settings', 'data') || {};
        const userName = savedGlobal.userName || 'Buda';
        
        let hour = new Date().getHours();
        let city = '';
        let code = -1;

        // M10.8: Sync OS Time to Target Weather Timezone
        if (weatherCtx && weatherCtx.utc_offset_seconds !== undefined) {
            const nowUTC = new Date();
            const targetDate = new Date(nowUTC.getTime() + (nowUTC.getTimezoneOffset() * 60000) + (weatherCtx.utc_offset_seconds * 1000));
            hour = targetDate.getHours();
            city = weatherCtx.city || '';
            code = weatherCtx.code !== undefined ? weatherCtx.code : -1;
        }

        let timeSalutation = 'Good evening';
        if (hour >= 5 && hour < 12) timeSalutation = 'Good morning';
        else if (hour >= 12 && hour < 17) timeSalutation = 'Good afternoon';

        // M10.8 Dynamic Contextual Greetings
        if (city && code !== -1) {
            if (code >= 71 && code <= 77) {
                greetingEl.textContent = `${timeSalutation} ${userName}, stay warm in snowy ${city}!`;
            } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) {
                greetingEl.textContent = `${timeSalutation} ${userName}, don't forget an umbrella in ${city}!`;
            } else if (hour >= 5 && hour < 12) {
                greetingEl.textContent = `${timeSalutation} ${userName}, how does waking up in ${city} feel?`;
            } else if (hour >= 18 || hour < 5) {
                greetingEl.textContent = `${timeSalutation} ${userName}, enjoy the bright lights of ${city}!`;
            } else {
                greetingEl.textContent = `${timeSalutation} ${userName}, hope you are having a great day in ${city}!`;
            }
        } else {
            // Capitalize fallback salutation
            let fallBackSalutation = timeSalutation.charAt(0).toUpperCase() + timeSalutation.slice(1);
            greetingEl.textContent = `${fallBackSalutation}, ${userName}.`;
        }
    }

    setupErrorHandling() {
        this.events.on('core:error', (err) => {
            const banner = document.createElement('div');
            banner.className = 'core-error-banner';
            banner.textContent = `[Error | ${err.source}] ${err.message}`;
            
            const overlays = this.appCtx.slots.overlays;
            if (overlays) {
                overlays.appendChild(banner);
                setTimeout(() => banner.remove(), 5000); // Auto dismiss after 5s
            }
        });
    }
}

/** Simple pub/sub */
class EventBus {
    constructor() {
        this.listeners = {};
    }
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(cb => {
            try { cb(data); } catch (e) { console.error(`Event ${event} callback crashed:`, e); }
        });
    }
}

/** Namespaced localStorage wrapper */
class StorageWrapper {
    read(ns, key) {
        try {
            const val = localStorage.getItem(`${ns}:${key}`);
            return val ? JSON.parse(val) : null;
        } catch (e) {
            console.error('Storage read error', e);
            return null;
        }
    }
    write(ns, key, val) {
        try {
            localStorage.setItem(`${ns}:${key}`, JSON.stringify(val));
        } catch (e) {
            console.error('Storage write error', e);
        }
    }
    remove(ns, key) {
        localStorage.removeItem(`${ns}:${key}`);
    }
}

/** Theme plumbing */
class ThemeManager {
    constructor(events, storage) {
        this.events = events;
        this.storage = storage;
        this.currentThemeName = null;
        this.availableThemes = []; // Populated by registry after boot
        this.dynamicBg = this.storage.read('ui.theme', 'dynamicBg') || false;
        this.lastWeather = null;
        
        // Listen for OS boot complete to setup themes
        this.events.on('os:boot_complete', (registry) => {
            this.availableThemes = registry.getAllModules().filter(m => m.meta.kind === 'theme');
            this.init();
        });

        // Listen for weather updates (M10 context bg)
        this.events.on('context:weather_update', (data) => {
            this.lastWeather = data;
            this.applyContext();
        });
    }

    applyContext() {
        const header = document.getElementById('slot-header');
        const topbar = document.getElementById('slot-topbar');
        if (!header || !topbar) return;

        if (!this.dynamicBg) {
            // Revert any dynamic styles so standard Theme CSS takes over
            header.style.background = '';
            header.style.color = '';
            header.style.textShadow = '';
            header.style.borderBottom = '';
            
            topbar.style.background = '';
            topbar.style.color = '';
            topbar.style.textShadow = '';
            topbar.style.borderBottom = '';
            return;
        }

        if (!this.lastWeather) return; // Wait for data

        const { code, isDay, isDusk, temp, utc_offset_seconds = 0 } = this.lastWeather;
        let bg = '';
        
        // M10.6 Sun Tracking Math
        // M10.8 Sync OS Background Time to Target Location Timezone instead of physical laptop time
        const nowUTC = new Date();
        const targetDate = new Date(nowUTC.getTime() + (nowUTC.getTimezoneOffset() * 60000) + (utc_offset_seconds * 1000));
        
        const percentElapsed = ((targetDate.getHours() + (targetDate.getMinutes() / 60)) / 24) * 100;
        const sunX = Math.max(0, Math.min(100, percentElapsed)).toFixed(1); // e.g. "60.4"
        const sunOrigin = `${sunX}% 0%`; // "60.4% 0%" (Moves from left to right along the very top edge)

        // M10 Context Mapper: Drastically Higher Contrast Gradients
        // Edge Case Fix: If Open-Meteo returns "Overcast (3)" or "Rain (61)" but it is literally freezing, force a Snow/Icy background!
        const isFreezing = temp <= 32;

        if (code === 0 && !isFreezing) { // Clear
            if (isDusk) bg = `radial-gradient(circle at ${sunOrigin}, #ff7e5f 0%, #feb47b 40%, #ff6b6b 100%)`; // Radiant Sunrise/Sunset
            else bg = isDay ? `radial-gradient(circle at ${sunOrigin}, #00c6ff 0%, #0072ff 60%, #0044cc 100%)` : `linear-gradient(to bottom, #000000, #1a365d)`; // Moonlit Night (Dark to Light)
        } else if ((code === 1 || code === 2) && !isFreezing) { // Partly Cloudy
            if (isDusk) bg = `radial-gradient(ellipse at ${sunOrigin}, #ff4e50 0%, #f9d423 70%, #f9d52366 100%)`; // Fiery Dusk Clouds
            else bg = isDay ? `radial-gradient(circle at ${sunOrigin}, #4facfe 0%, #00f2fe 50%, #00c6ff 100%)` : `linear-gradient(to bottom, #000000, #0f2027, #2b4c7e)`;
        } else if (code >= 71 && code <= 77 || isFreezing) { // Snow or Literal Freezing Weather
            bg = isDay ? 'linear-gradient(to bottom, #e0eafc, #cbdff0)' : 'linear-gradient(to bottom, #000000, #112233)';
        } else if (code === 3 || (code >= 45 && code <= 48)) { // Overcast/Fog
            if (isDusk) bg = 'linear-gradient(to bottom, #cba36d, #4a4947)'; // Foggy Dusk
            else bg = isDay ? 'linear-gradient(to bottom, #9ea8af, #cbd5db)' : 'linear-gradient(to bottom, #0a1118, #303f54)';
        } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) { // Rain
            if (isDusk) bg = 'linear-gradient(to bottom, #6a3093, #a044ff)'; // Purple Rain Sunset
            else bg = isDay ? 'linear-gradient(to bottom, #2b5876, #4e4376)' : 'linear-gradient(to bottom, #020024, #1b264a)';
        } else if (code >= 95) { // Thunderstorm
            if (isDusk) bg = 'linear-gradient(to bottom, #2c0e37, #b83e4a)'; // Bruised Storm Sunset
            else bg = isDay ? 'linear-gradient(to bottom, #11263d, #3c4b69)' : 'linear-gradient(to bottom, #000000, #1b0a2b, #000000)';
        } else { // Fallback
            bg = isDay ? `radial-gradient(circle at ${sunOrigin}, #00c6ff 0%, #0072ff 100%)` : `linear-gradient(to bottom, #091a2f, #000000)`;
        }

        const applySafeBg = (el) => {
            // Apply the background without the heavy dark tint that destroyed contrast
            el.style.background = bg;

            // FIX M10.10: Compress the gradient transition into the top 150px of the screen.
            // This violently forces the gradient math to complete inside the visible topbar so it isn't an invisible shift.
            el.style.backgroundAttachment = 'fixed';
            el.style.backgroundSize = '100% 150px';
            el.style.backgroundRepeat = 'no-repeat';

            // Force text to be white but use a strong double shadow to pop off both light AND dark backgrounds
            el.style.color = '#ffffff'; 
            el.style.textShadow = '0 1px 3px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)';
            // Also force any nested text/links in this specific DOM branch to inherit
            const allLinks = el.querySelectorAll('*');
            allLinks.forEach(child => {
                if(child.style) {
                    child.style.color = '#ffffff';
                    child.style.textShadow = '0 1px 3px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)';
                }
            });
            el.style.borderBottom = 'none';
        };

        applySafeBg(header);
        applySafeBg(topbar);
    }

    init() {
        const saved = this.storage.read('ui.theme', 'current');
        if (saved && this.availableThemes.find(t => t.meta.name === saved)) {
            this.apply(saved);
        } else {
            // Default to classic
            this.apply('mod.theme.classic');
        }
    }

    apply(themeName) {
        const theme = this.availableThemes.find(t => t.meta.name === themeName);
        if (!theme) return;

        // Apply CSS variables to root document
        const root = document.documentElement;
        if (theme.tokens) {
            Object.entries(theme.tokens).forEach(([key, value]) => {
                root.style.setProperty(key, value);
            });
        }

        this.currentThemeName = themeName;
        this.storage.write('ui.theme', 'current', themeName);
        this.events.emit('theme:changed', { themeName });
    }

    // Expose Admin section for the framework to pick up
    getAdminSection() {
        return {
            tab: 'Appearance',
            icon: '🎨',
            id: 'os_appearance',
            title: 'Appearance & Themes',
            hint: 'Select a theme to instantly change the OS look.',
            render: (el) => {
                el.innerHTML = '';
                
                // M10 Dynamic Context Toggle
                const toggleCard = document.createElement('div');
                toggleCard.style.padding = 'var(--ui-gap)';
                toggleCard.style.backgroundColor = 'var(--ui-surface-2)';
                toggleCard.style.border = '1px solid var(--ui-accent)';
                toggleCard.style.borderRadius = 'var(--ui-radius)';
                toggleCard.style.marginBottom = 'calc(var(--ui-gap) * 2)';
                
                toggleCard.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong>☁️ Contextual Weather Background</strong>
                            <div style="color:var(--ui-muted); font-size: 0.85em; margin-top: 4px;">The Top Bar dynamically reflects live outside weather & time independently of the active theme below.</div>
                        </div>
                        <input type="checkbox" id="t-dynamic-bg" ${this.dynamicBg ? 'checked' : ''} style="transform: scale(1.5); cursor:pointer;">
                    </div>
                `;
                el.appendChild(toggleCard);

                const cb = el.querySelector('#t-dynamic-bg');
                cb.onchange = (e) => {
                    this.dynamicBg = e.target.checked;
                    this.storage.write('ui.theme', 'dynamicBg', this.dynamicBg);
                    this.applyContext();
                };

                const title = document.createElement('h3');
                title.textContent = 'OS Theme Installer';
                title.style.marginBottom = '12px';
                title.style.color = 'var(--ui-text)';
                el.appendChild(title);

                const container = document.createElement('div');
                container.style.display = 'grid';
                container.style.gap = 'var(--ui-gap)';

                this.availableThemes.forEach(theme => {
                    const btn = document.createElement('button');
                    btn.style.padding = 'var(--ui-gap)';
                    btn.style.textAlign = 'left';
                    btn.style.backgroundColor = 'var(--ui-surface-2)';
                    btn.style.border = `1px solid ${this.currentThemeName === theme.meta.name ? 'var(--ui-accent)' : 'var(--ui-border)'}`;
                    btn.style.borderRadius = 'var(--ui-radius)';
                    btn.style.color = 'var(--ui-text)';
                    btn.style.cursor = 'pointer';

                    btn.innerHTML = `
                        <strong>${theme.meta.label}</strong>
                        <div style="color:var(--ui-muted); font-size: 0.9em; margin-top: 4px;">${theme.meta.description || ''}</div>
                    `;

                    btn.onclick = () => {
                        this.apply(theme.meta.name);
                        // Re-render to update the visual "selected" border
                        this.getAdminSection().render(el); 
                    };

                    container.appendChild(btn);
                });

                el.appendChild(container);
            }
        };
    }
}

/** Admin Framework Skeleton */
class AdminScaffold {
    constructor(ctx, registry) {
        this.ctx = ctx;
        this.registry = registry;
        this.isOpen = false;
        this.activeTabId = null;
    }

    init() {
        this.buildChrome();
        
        // Listen for Alt+A
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        const savedGlobal = this.ctx.storage.read('core.settings', 'data');
        const hasPasscode = savedGlobal && savedGlobal.passcode && savedGlobal.passcode.trim().length > 0;

        if (!this.isOpen && hasPasscode) {
            const entry = prompt('Admin Passcode required:');
            if (entry !== savedGlobal.passcode) {
                alert('Incorrect passcode.');
                return; // Abort opening
            }
        }

        this.isOpen = !this.isOpen;
        const panel = this.ctx.slots.admin;
        if (panel) {
            this.isOpen ? panel.classList.add('is-open') : panel.classList.remove('is-open');
            if (this.isOpen) {
                this._buildTabs();
            }
        }
    }
    buildChrome() {
        const adminSlot = this.ctx.slots.admin;
        if (!adminSlot) return;

        adminSlot.innerHTML = `
            <div class="admin-header">
                <h2>OS Settings</h2>
                <button class="admin-close-btn" aria-label="Close Settings">&times;</button>
            </div>
            <div class="admin-tabs" id="admin-tabs-container"></div>
            <div class="admin-content" id="admin-content-container">
                <div class="admin-empty-state">No settings available.</div>
            </div>
        `;

        adminSlot.querySelector('.admin-close-btn').addEventListener('click', () => this.toggle());
    }

    _buildTabs() {
        const tabsContainer = document.querySelector('#admin-tabs-container');
        const contentContainer = document.querySelector('#admin-content-container');
        if (!tabsContainer || !contentContainer) return;

        const allSections = [];
        
        // Buckets for routed tabs
        const routedToSystem = [];
        const routedToModules = [];
        
        // 1. Load Module Admin Sections and Route Them
        for (const mod of this.registry.getAllModules()) {
            if (typeof mod.adminSections === 'function') {
                const secs = mod.adminSections(this.ctx);
                if (Array.isArray(secs)) {
                    secs.forEach(sec => {
                        if (sec.targetTab === 'System') routedToSystem.push(sec);
                        else if (sec.targetTab === 'ModuleSettings') routedToModules.push(sec);
                        else allSections.push(sec); // Top-level standalone tab
                    });
                }
            }
        }

        // 2. Inject Core System/Backup Tab (with routed children)
        // Must be prepended so it is first
        allSections.unshift({
            tab: 'System',
            icon: '⚙️',
            id: 'core_settings_manage',
            title: 'Global System Settings',
            hint: 'Manage dashboard settings, passcodes, and backups.',
            render: (el) => this._renderSystemTab(el, routedToSystem)
        });

        // 3. Inject Module Settings Tab (if any plugins registered to it)
        if (routedToModules.length > 0) {
            allSections.push({
                tab: 'Module Settings',
                icon: '🧩',
                id: 'core_plugins_manage',
                title: 'Community Module Settings',
                hint: 'Specific configuration options injected by 3rd-party modules and community plugins.',
                render: (el) => {
                    el.innerHTML = '<div style="display:flex; flex-direction:column; gap:16px;"></div>';
                    const container = el.firstChild;
                    routedToModules.forEach(sec => {
                        const wrapper = document.createElement('div');
                        if (sec.render) sec.render(wrapper, this.ctx);
                        container.appendChild(wrapper);
                    });
                }
            });
        }

        // 4. Inject core App sections (like Appearance)
        allSections.push(this.ctx.theme.getAdminSection());

        if (allSections.length === 0) {
            tabsContainer.innerHTML = '';
            contentContainer.innerHTML = '<div class="admin-empty-state">No admin sections registered.</div>';
            return;
        }

        tabsContainer.innerHTML = '';
        allSections.forEach((sec, idx) => {
            const btn = document.createElement('button');
            btn.className = 'admin-tab ' + (idx === 0 ? 'active' : '');
            btn.innerHTML = '<span style="font-size: 1.4em;">' + (sec.icon || '📦') + '</span>';
            btn.title = sec.tab;
            btn.dataset.id = sec.id;
            
            btn.onclick = () => {
                this.renderPane(sec);
            };
            tabsContainer.appendChild(btn);

            // Select first tab by default
            if (idx === 0 && !this.activeTabId) {
                this.activeTabId = sec.id;
                setTimeout(() => this.renderPane(sec), 0);
            }
        });
    }

    _renderSystemTab(el, injectedSections = []) {
        const savedGlobal = this.ctx.storage.read('core.settings', 'data') || { passcode: '', userName: 'Buda', disabledModules: [] };

        el.innerHTML = `
            <style>
                .sys-block { background: var(--ui-surface); border: 1px solid var(--ui-border); margin-bottom: 20px; border-radius: var(--ui-radius); overflow: hidden; box-shadow: var(--ui-elev); }
                .sys-block summary { font-weight: bold; cursor: pointer; padding: 16px; outline: none; display: flex; align-items: center; user-select: none; background: var(--ui-surface-2); border-bottom: 1px solid var(--ui-border); }
                .sys-block summary:hover { filter: brightness(1.1); }
                .sys-block summary::-webkit-details-marker { display:none; }
                .sys-block-content { padding: 16px; }
                .sys-input { padding: 8px; border: 1px solid var(--ui-border); border-radius: 6px; background: var(--ui-surface); color: var(--ui-text); box-sizing: border-box; }
                .sys-btn { padding: 8px 16px; cursor: pointer; border: 1px solid var(--ui-border); border-radius: 6px; background: var(--ui-surface); color: var(--ui-text); font-weight: bold; }
                .sys-btn:hover { background: var(--ui-surface-2); }
                .sys-btn-primary { background: var(--ui-accent); color: white; border-color: var(--ui-accent); }
                .mod-toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--ui-border); }
                .mod-toggle-row:last-child { border-bottom: none; }
            </style>
            
            <details class="sys-block" open>
                <summary>
                    <span>👤 Personalization</span>
                    <span title="Set the name displayed in the top-left greeting." style="margin-left:auto; cursor:help; opacity:0.6; font-weight:normal;">ℹ️</span>
                </summary>
                <div class="sys-block-content">
                    <div style="display:flex; gap:10px; align-items:center;">
                        <input type="text" id="sys-name" class="sys-input" placeholder="Your Name" value="${savedGlobal.userName || 'Buda'}">
                        <button id="sys-save-name" class="sys-btn sys-btn-primary">Save</button>
                    </div>
                </div>
            </details>

            <details class="sys-block">
                <summary>
                    <span>⚡ Module Manager</span>
                    <span title="Permanently disable features to improve performance or declutter your dashboard. Requires a page reload." style="margin-left:auto; cursor:help; opacity:0.6; font-weight:normal;">ℹ️</span>
                </summary>
                <div class="sys-block-content" id="sys-modules-list">
                    <!-- Toggles injected here -->
                </div>
            </details>

            <details class="sys-block">
                <summary>
                    <span>🔒 Security</span>
                    <span title="Require a passcode to open this Admin panel." style="margin-left:auto; cursor:help; opacity:0.6; font-weight:normal;">ℹ️</span>
                </summary>
                <div class="sys-block-content">
                    <div style="display:flex; gap:10px; align-items:center;">
                        <input type="password" id="sys-pass" class="sys-input" placeholder="Leave blank to disable" value="${savedGlobal.passcode || ''}">
                        <button id="sys-save-pass" class="sys-btn sys-btn-primary">Save</button>
                    </div>
                </div>
            </details>

            <details class="sys-block">
                <summary>
                    <span>💾 Backup & Restore</span>
                    <span title="Export your entire dashboard configuration to a JSON file, or restore from a previous backup." style="margin-left:auto; cursor:help; opacity:0.6; font-weight:normal;">ℹ️</span>
                </summary>
                <div class="sys-block-content">
                    <div style="display:flex; gap:16px; margin-top:0px;">
                        <button id="sys-export" class="sys-btn" style="flex:1;">📤 Export</button>
                        <div style="flex:1;">
                            <input type="file" id="sys-import-file" accept=".json" style="display:none;">
                            <button id="sys-import-btn" class="sys-btn" style="width:100%;">📥 Import</button>
                        </div>
                    </div>
                    <div id="sys-import-msg" style="margin-top:10px; font-size:0.9em; color:#ff4444;"></div>
                </div>
            </details>
        `;

        // Safely append injected plugins to the DOM, preserving core OS events above
        if (injectedSections.length > 0) {
            const spacer = document.createElement('hr');
            spacer.style.border = '0';
            spacer.style.borderTop = '1px dashed var(--ui-border)';
            spacer.style.margin = '20px 0';
            el.appendChild(spacer);
            
            injectedSections.forEach(sec => {
                const wrapper = document.createElement('div');
                wrapper.style.marginBottom = '20px'; // Matching .sys-block margin
                if (sec.render) sec.render(wrapper, this.ctx);
                el.appendChild(wrapper);
            });
        }

        // Build Module Manager
        const modContainer = el.querySelector('#sys-modules-list');
        const availableFeatures = [
            { name: 'Favorites Sidebar', id: 'favorites.module.js' },
            { name: 'Widgets Grid', id: 'widgets.module.js' },
            { name: 'Universal Search', id: 'search.module.js' },
            { name: 'Quick Links Icons', id: 'quicklinks.module.js' },
            { name: 'AI Chat Drawer', id: 'chat.module.js' },
            { name: 'Weather Pill', id: 'weather.module.js' }
        ];

        availableFeatures.forEach(feat => {
            const isDisabled = (savedGlobal.disabledModules || []).includes(feat.id);
            const row = document.createElement('div');
            row.className = 'mod-toggle-row';
            row.innerHTML = `
                <span>${feat.name}</span>
                <label style="cursor:pointer;">
                    <input type="checkbox" class="mod-checkbox" data-id="${feat.id}" ${!isDisabled ? 'checked' : ''}> Enabled
                </label>
            `;
            modContainer.appendChild(row);
        });

        const modSaveBtn = document.createElement('button');
        modSaveBtn.className = 'sys-btn sys-btn-primary';
        modSaveBtn.style.marginTop = '12px';
        modSaveBtn.textContent = 'Save Module States (Reloads Page)';
        modContainer.appendChild(modSaveBtn);

        modSaveBtn.onclick = () => {
            const checkboxes = modContainer.querySelectorAll('.mod-checkbox');
            const disabled = [];
            checkboxes.forEach(cb => {
                if (!cb.checked) disabled.push(cb.dataset.id);
            });
            savedGlobal.disabledModules = disabled;
            this.ctx.storage.write('core.settings', 'data', savedGlobal);
            window.location.reload();
        };

        // Save Name Logic
        el.querySelector('#sys-save-name').onclick = () => {
            savedGlobal.userName = el.querySelector('#sys-name').value.trim() || 'User';
            this.ctx.storage.write('core.settings', 'data', savedGlobal);
            const btn = el.querySelector('#sys-save-name');
            btn.textContent = 'Saved!';
            setTimeout(() => btn.textContent = 'Save Name', 2000);
            
            // Instantly trigger re-render of greeting via global OS access
            if (window.os) window.os._renderGreeting();
        };

        // Passcode Logic
        el.querySelector('#sys-save-pass').onclick = () => {
            savedGlobal.passcode = el.querySelector('#sys-pass').value.trim();
            this.ctx.storage.write('core.settings', 'data', savedGlobal);
            const btn = el.querySelector('#sys-save-pass');
            btn.textContent = 'Saved!';
            setTimeout(() => btn.textContent = 'Save Passcode', 2000);
        };

        // Export Logic
        el.querySelector('#sys-export').onclick = () => {
            const dump = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('prodesk:')) {
                    dump[key] = localStorage.getItem(key);
                }
            }
            const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prodesk-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };

        // Import Logic
        const fileInput = el.querySelector('#sys-import-file');
        el.querySelector('#sys-import-btn').onclick = () => fileInput.click();
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (confirm('Warning: This will overwrite ALL current settings and widgets. Proceed?')) {
                        // Clear existing prodesk keys
                        const keysToRemove = [];
                        for (let i = 0; i < localStorage.length; i++) {
                            const k = localStorage.key(i);
                            if (k.startsWith('prodesk:')) keysToRemove.push(k);
                        }
                        keysToRemove.forEach(k => localStorage.removeItem(k));
                        
                        // Inject new keys
                        for (const [k, v] of Object.entries(data)) {
                            if (k.startsWith('prodesk:')) {
                                localStorage.setItem(k, v);
                            }
                        }
                        alert('Restore successful! The dashboard will now reload.');
                        window.location.reload();
                    }
                } catch (err) {
                    el.querySelector('#sys-import-msg').textContent = 'Invalid backup file format.';
                }
            };
            reader.readAsText(file);
        };

        // Factory Reset
        const dangerZone = document.createElement('details');
        dangerZone.className = 'sys-block';
        dangerZone.style.borderColor = '#ff444433';
        dangerZone.innerHTML = `
            <summary style="color:#ff4444; padding: 16px; font-weight: bold; cursor: pointer; outline: none; background: var(--ui-surface-2); border-bottom: 1px solid var(--ui-border); display: flex; align-items: center; user-select: none;">
                <span>⚠️ Danger Zone</span>
                <span title="Hard reset the entire dashboard. This cannot be undone." style="margin-left:auto; cursor:help; opacity:0.6; font-weight:normal; color: var(--ui-text);">ℹ️</span>
            </summary>
            <div class="sys-block-content" style="padding: 16px;">
                <button id="sys-factory-reset" class="sys-btn" style="color:#ff4444; border-color:#ff4444;">Wipe All Data & Reset</button>
            </div>
        `;
        el.appendChild(dangerZone);

        dangerZone.querySelector('#sys-factory-reset').onclick = () => {
            if (prompt('Type "RESET" to confirm wiping all data:') === 'RESET') {
                localStorage.clear();
                window.location.reload();
            }
        };
    }
    renderPane(section) {
        const contentContainer = document.getElementById('admin-content-container');
        if (!contentContainer) return;

        // Reset visual state of tabs
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.admin-tab[data-id="${section.id}"]`);
        if (activeTab) activeTab.classList.add('active');

        this.activeTabId = section.id;

        contentContainer.innerHTML = '';
        const header = document.createElement('div');
        header.className = 'admin-pane-header';
        header.innerHTML = `
            <h3 style="display:flex; align-items:center; margin-bottom: 0;">
                <span>${section.title}</span>
                ${section.hint ? `<span title="${section.hint}" style="margin-left:8px; cursor:help; opacity:0.6; font-weight:normal; font-size:0.8em;">ℹ️</span>` : ''}
            </h3>
        `;
        
        const workspace = document.createElement('div');
        workspace.className = 'admin-pane-workspace';
        
        contentContainer.appendChild(header);
        contentContainer.appendChild(workspace);

        try {
            section.render(workspace);
            
            // Globally track <details> element states so they stay open/closed across sessions
            const panelsState = this.ctx.storage.read('core.admin', 'panelsState') || {};
            const detailsElements = workspace.querySelectorAll('details');
            
            detailsElements.forEach((det, idx) => {
                const summary = det.querySelector('summary');
                const title = summary ? summary.textContent.trim() : `panel-${idx}`;
                const key = `${section.id}-${title}`;
                
                if (panelsState[key] !== undefined) {
                    if (panelsState[key]) det.setAttribute('open', '');
                    else det.removeAttribute('open');
                }
                
                det.addEventListener('toggle', () => {
                    const currentStates = this.ctx.storage.read('core.admin', 'panelsState') || {};
                    currentStates[key] = det.open;
                    this.ctx.storage.write('core.admin', 'panelsState', currentStates);
                });
            });
            
        } catch (e) {
            workspace.innerHTML = `<div style="color:red">Error rendering section: ${e.message}</div>`;
            this.ctx.events.emit('core:error', { source: 'Admin Render', message: e.message });
        }
    }
}

// Bootstrap
window.os = new DashboardOS();
window.os.boot();
