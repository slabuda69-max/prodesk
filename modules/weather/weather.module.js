/**
 * Feature: Live Weather
 * Renders a small weather pill in #slot-topbar and 
 * a detailed forecast drawer when clicked.
 * Uses Open-Meteo API (Free, no keys).
 */

export default {
    meta: {
        name: 'mod.feature.weather',
        label: 'Live Weather',
        version: '1.0.0',
        kind: 'feature',
        description: 'Live weather pill and forecast drawer.'
    },

    data: {
        city: 'New York',
        lat: 40.7128,
        lon: -74.0060,
        unit: 'fahrenheit', // or 'celsius'
        lastFetch: 0,
        cache: null
    },

    async init(ctx) {
        const saved = ctx.storage.read('mod.feature.weather', 'data');
        if (saved) {
            this.data = { ...this.data, ...saved };
        }
        
        ctx.events.on('weather:refresh', () => this.fetchWeather(ctx, true));
    },

    _save(ctx) {
        ctx.storage.write('mod.feature.weather', 'data', this.data);
    },

    adminSections(ctx) {
        return [{
            tab: 'Weather',
            targetTab: 'System',
            icon: '☁️',
            id: 'feature_weather_manage',
            title: 'Weather Settings',
            hint: 'Set your location for accurate live forecasts.',
            render: (el) => this._renderAdminContent(el, ctx)
        }];
    },

    _renderAdminContent(el, ctx) {
        el.innerHTML = `
            <style>
                .w-input { padding: 8px; border: 1px solid var(--ui-border); border-radius: 6px; background: var(--ui-surface); color: var(--ui-text); width: 100%; box-sizing: border-box; margin-bottom: 12px; }
                .w-select { padding: 8px; border: 1px solid var(--ui-border); border-radius: 6px; background: var(--ui-surface); color: var(--ui-text); width: 100%; box-sizing: border-box; margin-bottom: 16px; }
                .w-btn { padding: 6px 12px; cursor: pointer; border: 1px solid var(--ui-accent); border-radius: 4px; background: var(--ui-accent); color: white; font-weight: bold; width: 100%; }
                .w-label { display:block; font-size:0.85em; margin-bottom:4px; font-weight: bold; color: var(--ui-muted); }
            </style>
            
            <details style="background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius); box-shadow: var(--ui-elev);" open>
                <summary style="padding: 16px; font-weight: bold; cursor: pointer; outline: none; background: var(--ui-surface-2); border-radius: var(--ui-radius); border-bottom: 1px solid var(--ui-border); display: flex; align-items: center;">
                    <span>☁️ Weather Configuration</span>
                    <span title="Set your location for accurate live forecasts. We will automatically resolve coordinates for you." style="margin-left:auto; cursor:help; opacity:0.6; font-weight:normal;">ℹ️</span>
                </summary>
                <div style="padding: 16px;">
                    <label class="w-label">Search City / Location</label>
                    <input type="text" id="w-city" class="w-input" placeholder="e.g. London, New York, Tokyo">
                    <small style="color:var(--ui-muted); display:block; margin-top:-8px; margin-bottom:16px;" id="w-geo-hint"></small>

                    <label class="w-label">Temperature Unit</label>
                    <select id="w-unit" class="w-select">
                        <option value="fahrenheit">Fahrenheit (°F)</option>
                        <option value="celsius">Celsius (°C)</option>
                    </select>

                    <button id="w-save" class="w-btn">Save Weather Settings</button>
                </div>
            </details>
        `;

        el.querySelector('#w-city').value = this.data.city;
        el.querySelector('#w-unit').value = this.data.unit;

        el.querySelector('#w-save').onclick = async () => {
            const cityInput = el.querySelector('#w-city').value.trim();
            const btn = el.querySelector('#w-save');
            const hint = el.querySelector('#w-geo-hint');

            if (!cityInput) {
                alert('Please enter a city name.');
                return;
            }

            btn.textContent = 'Locating...';
            btn.style.opacity = '0.7';
            btn.disabled = true;

            try {
                // Auto-Geocode Phase (handle comma-separated states/countries)
                const parts = cityInput.split(',').map(s => s.trim());
                const searchCity = parts[0];
                const searchRegion = parts.length > 1 ? parts[1].toLowerCase() : null;

                const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=10&language=en&format=json`;
                const gRes = await fetch(geoUrl);
                const gData = await gRes.json();

                if (!gData.results || gData.results.length === 0) {
                    hint.style.color = '#ff4444';
                    hint.textContent = 'Could not locate that city. Please try another name.';
                    btn.textContent = 'Save Weather Settings';
                    btn.style.opacity = '1';
                    btn.disabled = false;
                    return;
                }

                // Try to find the matching region if specified
                let location = gData.results[0];
                if (searchRegion) {
                    const match = gData.results.find(r => 
                        (r.admin1 && r.admin1.toLowerCase().includes(searchRegion)) || 
                        (r.country && r.country.toLowerCase().includes(searchRegion)) ||
                        (r.admin2 && r.admin2.toLowerCase().includes(searchRegion)) // county fallback
                    );
                    if (match) location = match;
                }
                
                this.data.city = `${location.name}${location.admin1 ? ', ' + location.admin1 : ''}`;
                this.data.lat = location.latitude;
                this.data.lon = location.longitude;
                this.data.unit = el.querySelector('#w-unit').value;
                this.data.cache = null; // force clear cache on save
                this._save(ctx);
                
                hint.style.color = 'var(--ui-accent)';
                hint.textContent = `Found: ${this.data.city} (Lat: ${this.data.lat.toFixed(2)}, Lon: ${this.data.lon.toFixed(2)})`;
                
                btn.textContent = 'Saved!';
                setTimeout(() => {
                    btn.textContent = 'Save Weather Settings';
                    hint.style.color = 'var(--ui-muted)';
                }, 3000);
                
                // Set input back to cleanly formatted name
                el.querySelector('#w-city').value = this.data.city;
                
                ctx.events.emit('weather:refresh');

            } catch (err) {
                hint.style.color = '#ff4444';
                hint.textContent = 'Network error while searching for city.';
                console.error("Geocoding failed:", err);
            } finally {
                btn.style.opacity = '1';
                btn.disabled = false;
            }
        };
    },

    async mount(ctx) {
        const slot = ctx.slots.topbar;
        if (!slot) return;
        
        // 1. Inject Weather Container into Topbar
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '8px';
        container.style.marginLeft = 'auto'; // push to right before search

        this.timePill = document.createElement('div');
        this.timePill.id = 'weather-time-pill';
        this.timePill.style.background = 'var(--ui-surface-2)';
        this.timePill.style.color = 'var(--ui-text)';
        this.timePill.style.padding = '6px 14px';
        this.timePill.style.borderRadius = '999px';
        this.timePill.style.fontSize = '14px';
        this.timePill.style.fontWeight = 'bold';
        this.timePill.style.border = '1px solid var(--ui-border)';
        this.timePill.style.boxShadow = 'var(--ui-elev)';
        this.timePill.style.display = 'none'; // hidden until fetched

        this.pill = document.createElement('div');
        this.pill.id = 'weather-pill';
        this.pill.title = 'Click for forecast';
        this.pill.style.display = 'flex';
        this.pill.style.alignItems = 'center';
        this.pill.style.gap = '8px';
        this.pill.style.background = 'var(--ui-surface-2)';
        this.pill.style.color = 'var(--ui-text)';
        this.pill.style.border = '1px solid var(--ui-border)';
        this.pill.style.padding = '6px 14px';
        this.pill.style.borderRadius = '999px';
        this.pill.style.cursor = 'pointer';
        this.pill.style.fontWeight = 'bold';
        this.pill.style.fontSize = '14px';
        this.pill.style.boxShadow = 'var(--ui-elev)';
        
        this.pill.onmouseenter = () => this.pill.style.filter = 'brightness(1.1)';
        this.pill.onmouseleave = () => this.pill.style.filter = 'none';
        
        this.pill.innerHTML = `<span style="opacity:0.5;">Loading weather...</span>`;
        
        container.appendChild(this.timePill);
        container.appendChild(this.pill);
        slot.appendChild(container);

        // 2. Setup the Overlay Drawer in Body
        this.overlay = document.createElement('div');
        this.overlay.style.position = 'fixed';
        this.overlay.style.inset = '0';
        this.overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
        this.overlay.style.backdropFilter = 'blur(5px)';
        this.overlay.style.zIndex = '50';
        this.overlay.style.display = 'none';

        const drawer = document.createElement('div');
        drawer.style.position = 'absolute';
        drawer.style.right = '0';
        drawer.style.top = '0';
        drawer.style.height = '100%';
        drawer.style.width = 'min(400px, 90vw)';
        drawer.style.backgroundColor = 'var(--ui-surface)';
        drawer.style.borderLeft = '1px solid var(--ui-border)';
        drawer.style.boxShadow = '-5px 0 25px rgba(0,0,0,0.2)';
        drawer.style.display = 'flex';
        drawer.style.flexDirection = 'column';
        drawer.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
        drawer.style.transform = 'translateX(100%)';

        const header = document.createElement('header');
        header.style.padding = '20px';
        header.style.borderBottom = '1px solid var(--ui-border)';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.background = 'var(--ui-surface-2)';
        
        // Save reference to the title container so we can update it later
        this.drawerHeaderTitle = document.createElement('div');
        this.drawerHeaderTitle.innerHTML = '<b style="font-size:1.2em;">' + this.data.city + '</b> <div style="font-size:0.8em; color:var(--ui-muted);">7-Day Forecast</div>';

        const closeBtn = document.createElement('button');
        closeBtn.id = 'weather-close-btn';
        closeBtn.style.cssText = 'background:transparent; border:none; color:var(--ui-text); cursor:pointer; font-size:1.5em; line-height:1;';
        closeBtn.innerHTML = '&times;';

        header.appendChild(this.drawerHeaderTitle);
        header.appendChild(closeBtn);

        this.forecastList = document.createElement('div');
        this.forecastList.style.flex = '1';
        this.forecastList.style.padding = '20px';
        this.forecastList.style.overflowY = 'auto';
        this.forecastList.style.display = 'flex';
        this.forecastList.style.flexDirection = 'column';
        this.forecastList.style.gap = '12px';

        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) this.toggleOverlay(false);
        };
        header.querySelector('#weather-close-btn').onclick = () => this.toggleOverlay(false);
        this.pill.onclick = () => this.toggleOverlay(true);

        drawer.appendChild(header);
        drawer.appendChild(this.forecastList);
        this.overlay.appendChild(drawer);
        this.drawer = drawer; 
        
        document.body.appendChild(this.overlay);

        // Fetch data
        this.fetchWeather(ctx);

        // Auto-refresh every 30 mins
        if (this._pollingInterval) clearInterval(this._pollingInterval);
        this._pollingInterval = setInterval(() => {
            this.fetchWeather(ctx, true);
        }, 30 * 60 * 1000);
    },

    async fetchWeather(ctx, force = false) {
        if (!this.pill) return;
        
        const now = Date.now();
        // Cache for 30 mins to avoid api spam
        if (!force && this.data.cache && now - this.data.lastFetch < 30 * 60 * 1000) {
            this.renderWeather(this.data.cache);
            return;
        }

        try {
            this.pill.innerHTML = '<span>⏳ Fetching...</span>';
            
            const tmpCode = this.data.unit === 'fahrenheit' ? 'temperature_unit=fahrenheit' : '';
            // Added daily=sunrise,sunset & timezone for M10.5 Dusk engine
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.data.lat}&longitude=${this.data.lon}&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&${tmpCode}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            
            this.data.cache = data;
            this.data.lastFetch = now;
            this._save(ctx);
            
            this.renderWeather(data);

            // Emit live weather context so the OS ThemeManager can paint dynamic backgrounds (M10, M10.5)
            if (data && data.current) {
                // Determine Golden Hour/Twilight by checking if current local time is within 60 mins of today's Sunrise or Sunset
                let isDusk = false;
                if (data.daily && data.daily.sunrise && data.daily.sunset) {
                    const nowLocal = new Date();
                    const r = new Date(data.daily.sunrise[0]);
                    const s = new Date(data.daily.sunset[0]);
                    
                    const minToRise = Math.abs(nowLocal - r) / 60000;
                    const minToSet = Math.abs(nowLocal - s) / 60000;
                    if (minToRise <= 60 || minToSet <= 60) {
                        isDusk = true;
                    }
                }

                // If the user selected Celsius, we need to convert it to Fahrenheit for the ThemeManager's standardized freezing check (<= 32)
                let fTemp = data.current.temperature_2m;
                if (this.data.unit === 'celsius') {
                    fTemp = (fTemp * 9/5) + 32;
                }

                ctx.events.emit('context:weather_update', {
                    code: data.current.weather_code,
                    isDay: data.current.is_day, // 1 if day, 0 if night
                    isDusk: isDusk,
                    temp: fTemp,
                    city: this.data.city,
                    utc_offset_seconds: data.utc_offset_seconds || 0
                });
            }

        } catch (e) {
            this.pill.innerHTML = '<span style="color:#ff4444;">⚠️ Weather Error</span>';
        }
    },

    getWeatherIcon(code) {
        // Open-Meteo WMO Codes mapping
        if (code === 0) return '☀️'; // Clear
        if (code === 1 || code === 2) return '⛅'; // Partly cloudy
        if (code === 3) return '☁️'; // Overcast
        if (code >= 45 && code <= 48) return '🌫️'; // Fog
        if (code >= 51 && code <= 67) return '🌧️'; // Drizzle / Rain
        if (code >= 71 && code <= 77) return '❄️'; // Snow
        if (code >= 80 && code <= 82) return '🌧️'; // Showers
        if (code >= 95) return '🌩️'; // Thunderstorm
        return '🌡️'; // Unknown
    },

    renderWeather(data) {
        if (!data || !data.current || !this.pill) return;
        
        const curTemp = Math.round(data.current.temperature_2m);
        const curCode = data.current.weather_code;
        const sym = this.data.unit === 'fahrenheit' ? '°F' : '°C';
        const icon = this.getWeatherIcon(curCode);

        // Update Pill
        this.pill.innerHTML = 
            '<span style="font-size:1.2em;">' + icon + '</span>' +
            '<span>' + curTemp + sym + '</span>';

        // Update Time Pill
        if (this.timePill) {
            this.timePill.style.display = 'block';
            if (this.timeInterval) clearInterval(this.timeInterval);
            const updateTime = () => {
                const nowUTC = new Date();
                let targetDate = nowUTC;
                if (data.utc_offset_seconds !== undefined) {
                    targetDate = new Date(nowUTC.getTime() + (nowUTC.getTimezoneOffset() * 60000) + (data.utc_offset_seconds * 1000));
                }
                this.timePill.textContent = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            };
            updateTime();
            this.timeInterval = setInterval(updateTime, 1000);
        }

        // Update Drawer
        if (!this.forecastList) return;
        this.forecastList.innerHTML = '';
        
        // Fix: Dynamically update the Drawer Header title so it doesn't get stuck (M10 Polish)
        if (this.drawerHeaderTitle) {
            this.drawerHeaderTitle.innerHTML = '<b style="font-size:1.2em;">' + this.data.city + '</b> <div style="font-size:0.8em; color:var(--ui-muted);">7-Day Forecast</div>';
        }

        const todayBanner = document.createElement('div');
        todayBanner.style.background = 'var(--ui-accent)';
        todayBanner.style.color = 'white';
        todayBanner.style.padding = '24px';
        todayBanner.style.borderRadius = '16px';
        todayBanner.style.display = 'flex';
        todayBanner.style.flexDirection = 'column';
        todayBanner.style.alignItems = 'center';
        todayBanner.style.marginBottom = '16px';
        todayBanner.innerHTML = 
            '<div style="font-size:3em; margin-bottom:8px;">' + icon + '</div>' +
            '<div style="font-size:2.5em; font-weight:bold; line-height:1;">' + curTemp + sym + '</div>' +
            '<div style="opacity:0.8; margin-top:8px;">Current Temperature in ' + this.data.city + '</div>';
            
        this.forecastList.appendChild(todayBanner);

        // Daily list
        const daily = data.daily;
        if (daily && daily.time) {
            for (let i = 0; i < daily.time.length; i++) {
                const dateRaw = new Date(daily.time[i]);
                const dayName = dateRaw.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                
                const dIcon = this.getWeatherIcon(daily.weather_code[i]);
                const max = Math.round(daily.temperature_2m_max[i]);
                const min = Math.round(daily.temperature_2m_min[i]);

                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.background = 'var(--ui-surface-2)';
                row.style.border = '1px solid var(--ui-border)';
                row.style.padding = '12px 16px';
                row.style.borderRadius = '10px';
                
                row.innerHTML = 
                    '<div style="font-weight:bold; width:100px;">' + (i === 0 ? 'Today' : dayName) + '</div>' +
                    '<div style="font-size:1.5em;">' + dIcon + '</div>' +
                    '<div style="display:flex; gap:12px; font-weight:bold;">' +
                        '<span style="color:var(--ui-muted);">' + min + '°</span>' +
                        '<span>' + max + '°</span>' +
                    '</div>';

                this.forecastList.appendChild(row);
            }
        }
    },

    toggleOverlay(show) {
        if (!this.overlay || !this.drawer) return;
        if (show) {
            this.overlay.style.display = 'block';
            requestAnimationFrame(() => {
                this.drawer.style.transform = 'translateX(0)';
            });
        } else {
            this.drawer.style.transform = 'translateX(100%)';
            setTimeout(() => {
                this.overlay.style.display = 'none';
            }, 300);
        }
    },

    async unmount(ctx) {
        if (this._pollingInterval) clearInterval(this._pollingInterval);
        if (this.overlay) this.overlay.remove();
        if (this.pill) this.pill.remove();
    }
}
