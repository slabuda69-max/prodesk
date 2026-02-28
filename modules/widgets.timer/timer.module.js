/**
 * Feature Widget: Timer & Stopwatch
 * A unified clock utility providing standard counting tools.
 * Supports a global Analog / Digital visual style preference.
 */

export default {
    meta: {
        name: 'mod.widget.timer',
        label: 'Timer & Stopwatch',
        version: '1.0.0',
        author: 'The Buda',
        category: 'Time',
        kind: 'widget',
        description: 'Track time accurately with Analog and Digital faces.'
    },

    data: {
        clockStyle: 'digital', // 'digital' or 'analog'
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

    // Each time the widget is added to the DOM, this runs.
    renderWidget(ctx, config) {
        const body = document.createElement('div');
        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        body.style.width = '100%';
        body.style.height = '100%';
        body.style.background = 'var(--ui-surface-2)';
        body.style.color = 'var(--ui-text)';
        body.style.overflow = 'hidden';

        // Timer instance state (since this is instantiated per card)
        let mode = 'stopwatch'; // 'stopwatch' or 'timer'
        let isRunning = false;
        let elapsedMs = 0;
        let timerTargetMs = 5 * 60 * 1000; // 5 mins default
        let lastTick = 0;
        let animFrame;

        // UI Building
        body.innerHTML = `
            <style>
                .t-header { display: flex; border-bottom: 1px solid var(--ui-border); }
                .t-tab { flex: 1; text-align: center; padding: 8px; cursor: pointer; font-size: 0.8em; font-weight: bold; color: var(--ui-muted); background: var(--ui-surface); border-bottom: 2px solid transparent; }
                .t-tab.active { color: var(--ui-accent); border-bottom-color: var(--ui-accent); background: var(--ui-surface-2); }
                
                .t-face-container { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 4px; container-type: size; }
                
                /* Digital Layout */
                .t-digital { font-size: clamp(1.8em, 15cqw, 3.5em); font-variant-numeric: tabular-nums; font-family: monospace; font-weight: bold; letter-spacing: -1px; margin-bottom: 6px; text-shadow: 0 0 10px rgba(0, 255, 204, 0.2); }
                
                /* Analog Layout */
                .t-analog { display: none; width: clamp(40px, min(100px, 40cqh), 200px); height: clamp(40px, min(100px, 40cqh), 200px); border-radius: 50%; border: 3px solid var(--ui-accent); position: relative; background: var(--ui-surface); box-shadow: inset 0 0 20px rgba(0,0,0,0.5), 0 0 15px rgba(0,255,204,0.1); margin-bottom: 8px; flex-shrink: 0; }
                .t-analog::after { content: ''; position: absolute; left: 50%; top: 50%; width: 8px; height: 8px; border-radius: 50%; background: var(--ui-text); transform: translate(-50%, -50%); z-index: 10; }
                .t-hand-sec { position: absolute; left: 50%; bottom: 50%; width: 2px; height: 45%; background: var(--ui-accent); transform-origin: bottom center; transform: translateX(-50%) rotate(0deg); transition: transform 0.05s linear; z-index: 5; }
                .t-hand-min { position: absolute; left: 50%; bottom: 50%; width: 3px; height: 35%; background: var(--ui-text); transform-origin: bottom center; transform: translateX(-50%) rotate(0deg); border-radius: 1.5px; z-index: 4; }
                
                .t-controls { display: flex; gap: 8px; z-index: 20; }
                .t-btn { padding: 4px 12px; border-radius: 20px; border: none; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 0.75em; }
                .t-btn-start { background: var(--ui-accent); color: white; }
                .t-btn-start:hover { filter: brightness(1.2); box-shadow: 0 0 10px var(--ui-accent); }
                .t-btn-reset { background: var(--ui-surface); color: var(--ui-text); border: 1px solid var(--ui-border); }
                .t-btn-reset:hover { background: var(--ui-surface-2); }
                
                .t-timer-inputs { display: none; gap: 5px; margin-bottom: 6px; z-index: 20; }
                .t-input { width: 45px; background: var(--ui-surface); border: 1px solid var(--ui-border); color: var(--ui-text); font-size: 1.1em; text-align: center; border-radius: 6px; padding: 2px; }
            </style>
            
            <div class="t-header">
                <div class="t-tab active" data-mode="stopwatch">Stopwatch</div>
                <div class="t-tab" data-mode="timer">Timer</div>
            </div>
            
            <div class="t-face-container">
                <!-- Analog Face -->
                <div class="t-analog">
                    <!-- generated ticks go here -->
                    <div class="t-hand-min"></div>
                    <div class="t-hand-sec"></div>
                </div>
                
                <!-- Digital Face -->
                <div class="t-digital">00:00.00</div>
                
                <!-- Timer Input Mode -->
                <div class="t-timer-inputs">
                    <input type="number" class="t-input t-min" min="0" max="99" value="05"> <span style="font-weight:bold; margin-top:6px;">:</span>
                    <input type="number" class="t-input t-sec" min="0" max="59" value="00">
                </div>
                
                <!-- Controls -->
                <div class="t-controls">
                    <button class="t-btn t-btn-start">Start</button>
                    <button class="t-btn t-btn-reset">Reset</button>
                </div>
            </div>
        `;

        const tabs = body.querySelectorAll('.t-tab');
        const dFace = body.querySelector('.t-digital');
        const aFace = body.querySelector('.t-analog');
        
        // Inject 12 Hash Marks for the Analog Clock Face
        for (let i = 0; i < 12; i++) {
            const tick = document.createElement('div');
            tick.style.position = 'absolute';
            tick.style.left = '50%';
            tick.style.top = '50%';
            tick.style.width = i % 3 === 0 ? '4px' : '2px'; // Thicker marks for 12, 3, 6, 9
            tick.style.height = i % 3 === 0 ? '12px' : '8px';
            tick.style.background = 'var(--ui-muted)';
            tick.style.transformOrigin = 'center center';
            // Translate up to the rim (subtract half height to sit inside border) then rotate
            tick.style.transform = `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-40px)`;
            tick.style.opacity = '0.5';
            
            // For smaller containers need dynamic translating based on cqh/perc, so lets build it into a 100% boundary container
            tick.style.top = '0';
            tick.style.height = '100%';
            tick.style.width = i % 3 === 0 ? '4px' : '2px';
            tick.style.background = 'transparent'; // invisible container wrapper
            tick.style.transform = `translateX(-50%) rotate(${i * 30}deg)`;
            
            // The actual hash mark sits at the top of the wrapper
            const hash = document.createElement('div');
            hash.style.width = '100%';
            hash.style.height = i % 3 === 0 ? '15%' : '8%';
            hash.style.background = i % 3 === 0 ? 'var(--ui-text)' : 'var(--ui-muted)';
            hash.style.borderRadius = '2px';
            hash.style.opacity = '0.7';
            
            tick.appendChild(hash);
            aFace.appendChild(tick);
        }

        const handSec = body.querySelector('.t-hand-sec');
        const handMin = body.querySelector('.t-hand-min');
        const btnStart = body.querySelector('.t-btn-start');
        const btnReset = body.querySelector('.t-btn-reset');
        const timerInputs = body.querySelector('.t-timer-inputs');
        const inMin = body.querySelector('.t-min');
        const inSec = body.querySelector('.t-sec');

        // Apply Global Style Settings
        if (this.data.clockStyle === 'analog') {
            aFace.style.display = 'block';
            dFace.style.display = 'none';
        } else {
            aFace.style.display = 'none';
            dFace.style.display = 'block';
        }

        const formatTime = (ms) => {
            const totalSec = Math.floor(ms / 1000);
            const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
            const s = (totalSec % 60).toString().padStart(2, '0');
            const msPart = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
            return `${m}:${s}.${msPart}`;
        };

        const updateClockFaces = (timeMs) => {
            // Update Digital
            dFace.textContent = formatTime(timeMs);
            
            // Update Analog
            const totalSec = timeMs / 1000;
            const secDeg = (totalSec % 60) * 6; // 360 / 60
            const minDeg = (totalSec / 60) * 6;
            
            handSec.style.transform = `translateX(-50%) rotate(${secDeg}deg)`;
            handMin.style.transform = `translateX(-50%) rotate(${minDeg}deg)`;
        };

        const tick = (now) => {
            if (!isRunning) return;
            const delta = now - lastTick;
            lastTick = now;

            if (mode === 'stopwatch') {
                elapsedMs += delta;
                updateClockFaces(elapsedMs);
            } else {
                elapsedMs -= delta;
                if (elapsedMs <= 0) {
                    elapsedMs = 0;
                    isRunning = false;
                    btnStart.textContent = 'Start';
                    btnStart.style.background = 'var(--ui-accent)';
                    updateClockFaces(0);
                    
                    // ALARM!
                    dFace.style.color = '#ff4444';
                    dFace.style.textShadow = '0 0 20px rgba(255, 0, 0, 0.8)';
                    aFace.style.borderColor = '#ff4444';
                    aFace.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.5), 0 0 20px rgba(255,0,0,0.5)';
                } else {
                    updateClockFaces(elapsedMs);
                }
            }

            animFrame = requestAnimationFrame(tick);
        };

        const toggleMode = (newMode) => {
            mode = newMode;
            isRunning = false;
            cancelAnimationFrame(animFrame);
            btnStart.textContent = 'Start';
            btnStart.style.background = 'var(--ui-accent)';
            
            // clear alarm state
            dFace.style.color = 'var(--ui-text)';
            dFace.style.textShadow = '0 0 10px rgba(0, 255, 204, 0.2)';
            aFace.style.borderColor = 'var(--ui-accent)';
            aFace.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.5), 0 0 15px rgba(0,255,204,0.1)';

            tabs.forEach(t => t.classList.remove('active'));
            body.querySelector(`.t-tab[data-mode="${mode}"]`).classList.add('active');

            if (mode === 'stopwatch') {
                elapsedMs = 0;
                timerInputs.style.display = 'none';
                if (this.data.clockStyle === 'digital') dFace.style.display = 'block';
                updateClockFaces(elapsedMs);
            } else {
                timerInputs.style.display = 'flex';
                dFace.style.display = 'none'; // hide digital while setting timer
                
                const m = parseInt(inMin.value) || 0;
                const s = parseInt(inSec.value) || 0;
                timerTargetMs = (m * 60 + s) * 1000;
                elapsedMs = timerTargetMs;
                updateClockFaces(elapsedMs);
            }
        };

        tabs.forEach(t => {
            t.onclick = () => {
                if (t.dataset.mode !== mode) toggleMode(t.dataset.mode);
            };
        });

        // Sync Timer Inputs to logic
        const updateTimerTarget = () => {
            const m = parseInt(inMin.value) || 0;
            const s = parseInt(inSec.value) || 0;
            timerTargetMs = (m * 60 + s) * 1000;
            elapsedMs = timerTargetMs;
            updateClockFaces(elapsedMs);
        };
        inMin.onchange = updateTimerTarget;
        inSec.onchange = updateTimerTarget;

        btnStart.onclick = () => {
            // clear alarm state on start
            dFace.style.color = 'var(--ui-text)';
            dFace.style.textShadow = '0 0 10px rgba(0, 255, 204, 0.2)';
            aFace.style.borderColor = 'var(--ui-accent)';
            aFace.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.5), 0 0 15px rgba(0,255,204,0.1)';

            if (isRunning) {
                isRunning = false;
                cancelAnimationFrame(animFrame);
                btnStart.textContent = 'Resume';
                btnStart.style.background = 'var(--ui-accent)';
            } else {
                if (mode === 'timer' && elapsedMs <= 0) {
                    updateTimerTarget(); // reset back to inputs
                }
                
                isRunning = true;
                lastTick = performance.now();
                animFrame = requestAnimationFrame(tick);
                btnStart.textContent = 'Pause';
                btnStart.style.background = '#ffaa00'; // warning color for pause
                
                if (mode === 'timer') {
                    timerInputs.style.display = 'none';
                    if(this.data.clockStyle === 'digital') dFace.style.display = 'block';
                }
            }
        };

        btnReset.onclick = () => {
            isRunning = false;
            cancelAnimationFrame(animFrame);
            btnStart.textContent = 'Start';
            btnStart.style.background = 'var(--ui-accent)';
            
            // clear alarm state
            dFace.style.color = 'var(--ui-text)';
            dFace.style.textShadow = '0 0 10px rgba(0, 255, 204, 0.2)';
            aFace.style.borderColor = 'var(--ui-accent)';
            aFace.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.5), 0 0 15px rgba(0,255,204,0.1)';

            if (mode === 'stopwatch') {
                elapsedMs = 0;
                updateClockFaces(elapsedMs);
            } else {
                timerInputs.style.display = 'flex';
                dFace.style.display = 'none';
                updateTimerTarget();
            }
        };

        // Initialize state
        updateClockFaces(0);

        return body;
    },

    // Global Widget Preferences accessible via OS Settings panel
    adminSections(ctx) {
        return [{
            tab: 'Timer Widget',
            targetTab: 'ModuleSettings',
            icon: '⏱️',
            id: 'feature_timer_manage',
            title: 'Timer & Stopwatch Settings',
            hint: 'Configure global settings for all Timer widgets.',
            render: (el) => {
                el.innerHTML = `
                    <details style="background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius); box-shadow: var(--ui-elev); overflow: hidden;" open>
                        <summary style="padding: 16px; font-weight: bold; cursor: pointer; outline: none; background: var(--ui-surface-2); border-bottom: 1px solid var(--ui-border); display: flex; align-items: center;">
                            <span>⏱️ Timer Appearance</span>
                            <span title="Configure global settings for all Timer widgets." style="margin-left:auto; cursor:help; opacity:0.6; font-weight:normal;">ℹ️</span>
                        </summary>
                        <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                            <label style="font-size: 0.85em; font-weight: bold; color: var(--ui-muted);">Clock Face Style</label>
                            <select id="w-timer-style" style="padding: 10px; border: 1px solid var(--ui-border); border-radius: 6px; background: var(--ui-surface); color: var(--ui-text); width: 100%;">
                                <option value="digital">Digital (Modern Numbers)</option>
                                <option value="analog">Analog (Classic Watch Face)</option>
                            </select>
                            
                            <button id="btn-save-timer" style="margin-top: 8px; padding: 8px 16px; background: var(--ui-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                                Save Global Preference
                            </button>
                            <small style="color:var(--ui-muted);">Note: Saving will require re-rendering existing timer widgets on the dashboard.</small>
                        </div>
                    </details>
                `;

                el.querySelector('#w-timer-style').value = this.data.clockStyle;

                el.querySelector('#btn-save-timer').onclick = () => {
                    this.data.clockStyle = el.querySelector('#w-timer-style').value;
                    this._save(ctx);
                    
                    // Trigger a master widget refresh to reboot instances
                    ctx.events.emit('widgets:refresh');
                    
                    alert("Timer style updated successfully!");
                };
            }
        }];
    }
};
