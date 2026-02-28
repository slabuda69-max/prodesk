/**
 * Feature Widget: System Resource Monitor
 * A standalone OS Plugin that streams local hardware telemetry.
 * Proves the Community Ecosystem Plugin architecture.
 */

export default {
    meta: {
        name: 'mod.widget.sysmon',
        label: 'System Resource Monitor',
        version: '1.0.0',
        author: 'The Buda',
        category: 'System',
        kind: 'widget',
        description: 'Live hardware tracking. Zero server required.'
    },

    data: {
        isDesktop: false
    },

    async init(ctx) {
        const saved = ctx.storage.read(this.meta.name, 'data');
        if (saved) {
            this.data = { ...this.data, ...saved };
        }
    },

    _save(ctx) {
        ctx.storage.write(this.meta.name, 'data', this.data);
    },

    adminSections(ctx) {
        return [{
            tab: 'System Monitor',
            targetTab: 'ModuleSettings',
            icon: '📟',
            id: 'feature_sysmon_manage',
            title: 'Sysmon Preferences',
            hint: 'Configure the System Monitor dashboard widget.',
            render: (el) => this._renderAdminContent(el, ctx)
        }];
    },

    _renderAdminContent(el, ctx) {
        el.innerHTML = `
            <style>
                .w-select { padding: 8px; border: 1px solid var(--ui-border); border-radius: 6px; background: var(--ui-surface); color: var(--ui-text); width: 100%; box-sizing: border-box; margin-bottom: 16px; }
                .w-btn { padding: 6px 12px; cursor: pointer; border: 1px solid var(--ui-accent); border-radius: 4px; background: var(--ui-accent); color: white; font-weight: bold; width: 100%; }
                .w-label { display:block; font-size:0.85em; margin-bottom:4px; font-weight: bold; color: var(--ui-muted); }
            </style>
            
            <details style="background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius); box-shadow: var(--ui-elev); overflow: hidden;" open>
                <summary style="padding: 16px; font-weight: bold; cursor: pointer; outline: none; background: var(--ui-surface-2); border-bottom: 1px solid var(--ui-border); display: flex; align-items: center;">
                    <span>⚙️ Workspace Type</span>
                    <span title="Configure the System Monitor dashboard widget." style="margin-left:auto; cursor:help; opacity:0.6; font-weight:normal;">ℹ️</span>
                </summary>
                <div style="padding: 16px;">
                    <label class="w-label">Device Type</label>
                    <select id="sysmon-type" class="w-select">
                        <option value="laptop">Laptop (Show Battery Stats)</option>
                        <option value="desktop">Desktop PC (Hide Power Gauges)</option>
                    </select>

                    <button id="sysmon-save" class="w-btn">Save Preferences</button>
                    <small style="color:var(--ui-muted); display:block; margin-top:12px; text-align:center;">Note: Changes require refreshing the dashboard widgets.</small>
                </div>
            </details>
        `;

        const select = el.querySelector('#sysmon-type');
        select.value = this.data.isDesktop ? 'desktop' : 'laptop';

        el.querySelector('#sysmon-save').onclick = () => {
            this.data.isDesktop = select.value === 'desktop';
            this._save(ctx);
            const btn = el.querySelector('#sysmon-save');
            btn.textContent = 'Saved!';
            setTimeout(() => btn.textContent = 'Save Preferences', 2000);
        };
    },

    // A widget must expose `renderWidget` which the Host Grid Engine will invoke.
    renderWidget(ctx, config) {
        // Return a raw DOM node containing the entire widget.
        const body = document.createElement('div');
        body.style.background = 'var(--ui-surface-2)';
        body.style.color = 'var(--ui-text)';
        body.style.padding = 'clamp(4px, 1vw, 8px)';
        body.style.display = 'grid';
        body.style.gridTemplateRows = this.data.isDesktop ? 'min-content 1fr' : 'min-content 1fr min-content';
        body.style.gap = 'clamp(4px, 1vw, 8px)';
        body.style.height = '100%'; 
        body.style.overflow = 'hidden';
        
        // Native Hardware Detection
        const cores = navigator.hardwareConcurrency || '?';
        const ram = navigator.deviceMemory || '?';
        let osStr = 'Unknown OS';
        if(navigator.userAgent.indexOf("Win") != -1) osStr = "Windows";
        if(navigator.userAgent.indexOf("Mac") != -1) osStr = "macOS";
        if(navigator.userAgent.indexOf("Linux") != -1) osStr = "Linux";
        
        // Ensure perfect unique scoping
        const uId = config.id || 'w-' + Math.random().toString(36).substr(2, 9);
        const batContainerId = 'bat-' + uId;
        
        body.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:bold; font-size:clamp(0.65em, 3vw, 1em);">💻 ${osStr}</span>
                <span style="font-size:clamp(0.5em, 2vw, 0.7em); color:var(--ui-accent); display:flex; align-items:center; gap:4px;">
                    <span style="display:inline-block; width:6px; height:6px; background:#00ffcc; border-radius:50%; box-shadow:0 0 6px #00ffcc; animation: pulse 2s infinite;"></span> Live 
                </span>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:clamp(4px, 1vw, 8px); min-height: 0;">
                <div style="background:var(--ui-surface); border-radius:8px; border:1px solid var(--ui-border); text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center; padding: 2px; min-height: 0;">
                    <div style="font-size:clamp(0.8em, 2vw, 1.5em); margin-bottom:2px; line-height:1;">⚙️</div>
                    <div style="font-size:clamp(0.7em, 1.5vw, 1.1em); font-weight:bold; line-height:1;">${cores}</div>
                    <div style="font-size:clamp(0.5em, 1vw, 0.65em); color:var(--ui-muted); text-transform:uppercase; margin-top:2px;">Cores</div>
                </div>
                
                <div style="background:var(--ui-surface); border-radius:8px; border:1px solid var(--ui-border); text-align:center; display:flex; flex-direction:column; justify-content:center; align-items:center; padding: 2px; min-height: 0;">
                    <div style="font-size:clamp(0.8em, 2vw, 1.5em); margin-bottom:2px; line-height:1;">🧠</div>
                    <div style="font-size:clamp(0.7em, 1.5vw, 1.1em); font-weight:bold; line-height:1;">${ram} GB</div>
                    <div style="font-size:clamp(0.5em, 1vw, 0.65em); color:var(--ui-muted); text-transform:uppercase; margin-top:2px;">Ram</div>
                </div>
            </div>
            
            ${this.data.isDesktop ? '' : `
            <div style="background:var(--ui-surface); padding:4px 6px; border-radius:8px; border:1px solid var(--ui-border); display:flex; flex-direction:column; justify-content:center; min-height: 0;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:clamp(0.55em, 2vw, 0.8em);">
                    <span style="font-weight:bold;">🔋 Power</span>
                    <span id="${batContainerId}-pct" style="color:var(--ui-muted);">...</span>
                </div>
                <div style="width:100%; height:4px; background:var(--ui-border); border-radius:2px; overflow:hidden;">
                    <div id="${batContainerId}-bar" style="width:0%; height:100%; background:var(--ui-accent); transition: width 0.3s ease;"></div>
                </div>
            </div>
            `}
        `;

        // Battery Polling
        if (!this.data.isDesktop) {
            if ('getBattery' in navigator) {
                navigator.getBattery().then(bat => {
                    const updateBat = () => {
                        const pctEl = body.querySelector('#' + batContainerId + '-pct');
                        const barEl = body.querySelector('#' + batContainerId + '-bar');
                        if(!pctEl || !barEl) return;
                        
                        const level = Math.round(bat.level * 100);
                        pctEl.textContent = `${level}% ` + (bat.charging ? '⚡' : '');
                        barEl.style.width = `${level}%`;
                        
                        if(bat.charging) {
                            barEl.style.background = '#00ffaa';
                        } else if (level < 20) {
                            barEl.style.background = '#ff4444';
                        } else {
                            barEl.style.background = 'var(--ui-accent)';
                        }
                    };
                    updateBat();
                    bat.addEventListener('levelchange', updateBat);
                    bat.addEventListener('chargingchange', updateBat);
                    
                    // Mount a cleanup observer so battery listeners die if the widget is deleted from grid
                    const observer = new MutationObserver((mutations) => {
                        if (!document.body.contains(body)) {
                            bat.removeEventListener('levelchange', updateBat);
                            bat.removeEventListener('chargingchange', updateBat);
                            observer.disconnect();
                        }
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                });
            } else {
                const pctEl = body.querySelector('#' + batContainerId + '-pct');
                if(pctEl) pctEl.innerHTML = '<span style="color:#ffcc00">API Unsupported</span>';
            }
        }

        return body;
    }
}
