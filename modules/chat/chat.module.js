/**
 * Feature: AI Chat Overlay (Multi-API)
 * A slide-out drawer for AI Chat interactions.
 * Supports OpenAI, Anthropic, Gemini, and Copilot.
 */

export default {
    meta: {
        name: 'mod.feature.chat',
        label: 'AI Chat',
        version: '2.0.0',
        kind: 'feature',
        description: 'Multi-API AI Chat interface (GPT, Claude, Gemini, Copilot).'
    },

    data: {
        activeProvider: 'openai',
        keys: {
            openai: '',
            anthropic: '',
            gemini: '',
            copilot: ''
        },
        history: []
    },

    async init(ctx) {
        const saved = ctx.storage.read('mod.feature.chat', 'data');
        if (saved) {
            this.data = { ...this.data, ...saved };
        }
        
        if (this.data.history.length === 0) {
            this.data.history = [
                { role: 'ai', text: 'Hello! I am your Multi-API assistant. Please configure your API key in the Admin panel (Alt+A) -> AI Chat.' }
            ];
            this._save(ctx);
        }
    },

    _save(ctx) {
        ctx.storage.write('mod.feature.chat', 'data', this.data);
    },

    adminSections(ctx) {
        return [{
            tab: 'AI Chat',
            targetTab: 'System',
            icon: '💬',
            id: 'feature_chat_manage',
            title: 'AI Provider Settings',
            hint: 'Configure API keys for your preferred LLMs.',
            render: (el) => this._renderAdminContent(el, ctx)
        }];
    },

    _renderAdminContent(el, ctx) {
        el.innerHTML = `
            <style>
                .c-input { padding: 8px; border: 1px solid var(--ui-border); border-radius: 6px; background: var(--ui-surface); color: var(--ui-text); width: 100%; box-sizing: border-box; margin-bottom: 12px; font-family: monospace; }
                .c-select { padding: 8px; border: 1px solid var(--ui-border); border-radius: 6px; background: var(--ui-surface); color: var(--ui-text); width: 100%; box-sizing: border-box; margin-bottom: 16px; font-weight: bold; }
                .c-btn { padding: 6px 12px; cursor: pointer; border: 1px solid var(--ui-accent); border-radius: 4px; background: var(--ui-accent); color: white; font-weight: bold; }
                .c-label { display:block; font-size:0.85em; margin-bottom:4px; font-weight: bold; color: var(--ui-muted); }
            </style>
            <details style="background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: var(--ui-radius); box-shadow: var(--ui-elev);" open>
                <summary style="padding: 16px; font-weight: bold; cursor: pointer; outline: none; background: var(--ui-surface-2); border-radius: var(--ui-radius); border-bottom: 1px solid var(--ui-border); display: flex; align-items: center;">
                    <span>💬 AI Provider Settings</span>
                    <span title="Configure API keys for your preferred LLMs." style="margin-left:auto; cursor:help; opacity:0.6; font-weight:normal;">ℹ️</span>
                </summary>
                <div style="padding: 16px;">
                    <label class="c-label">Active Provider</label>
                <select id="chat-provider" class="c-select">
                    <option value="openai">OpenAI (GPT-4o)</option>
                    <option value="anthropic">Anthropic (Claude 3.5)</option>
                    <option value="gemini">Google (Gemini 1.5)</option>
                    <option value="copilot">Microsoft (Copilot/Azure)</option>
                </select>

                <hr style="border:0; border-top:1px dashed var(--ui-border); margin: 16px 0;">

                <label class="c-label">OpenAI API Key</label>
                <input type="password" id="chat-key-openai" class="c-input" placeholder="sk-...">

                <label class="c-label">Anthropic API Key</label>
                <input type="password" id="chat-key-anthropic" class="c-input" placeholder="sk-ant-...">

                <label class="c-label">Google Gemini API Key</label>
                <input type="password" id="chat-key-gemini" class="c-input" placeholder="AIza...">

                <label class="c-label">Copilot / Azure Endpoint Key</label>
                <input type="password" id="chat-key-copilot" class="c-input" placeholder="Provider Key...">

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 16px;">
                    <button id="chat-clear-history" style="background:transparent; border:1px solid #ff4444; color:#ff4444; padding:6px 12px; border-radius:4px; cursor:pointer;">Clear Chat History</button>
                    <button id="chat-save-keys" class="c-btn">Save Configurations</button>
                    </div>
                </div>
            </details>
        `;

        el.querySelector('#chat-provider').value = this.data.activeProvider;
        el.querySelector('#chat-key-openai').value = this.data.keys.openai || '';
        el.querySelector('#chat-key-anthropic').value = this.data.keys.anthropic || '';
        el.querySelector('#chat-key-gemini').value = this.data.keys.gemini || '';
        el.querySelector('#chat-key-copilot').value = this.data.keys.copilot || '';

        el.querySelector('#chat-save-keys').onclick = () => {
            this.data.activeProvider = el.querySelector('#chat-provider').value;
            this.data.keys.openai = el.querySelector('#chat-key-openai').value.trim();
            this.data.keys.anthropic = el.querySelector('#chat-key-anthropic').value.trim();
            this.data.keys.gemini = el.querySelector('#chat-key-gemini').value.trim();
            this.data.keys.copilot = el.querySelector('#chat-key-copilot').value.trim();
            this._save(ctx);
            
            const btn = el.querySelector('#chat-save-keys');
            btn.textContent = 'Saved!';
            setTimeout(() => btn.textContent = 'Save Configurations', 2000);
        };

        el.querySelector('#chat-clear-history').onclick = () => {
            if (confirm('Clear entire chat history?')) {
                this.data.history = [{ role: 'ai', text: 'Chat history cleared. How can I help you?' }];
                this._save(ctx);
                if (this.msgList) this.renderMessages();
            }
        };
    },

    async mount(ctx) {
        if (ctx.slots.header) {
            const btn = document.createElement('button');
            btn.id = 'chat-toggle-btn';
            btn.textContent = '💬 Chat';
            btn.style.background = 'linear-gradient(180deg, var(--ui-surface), var(--ui-surface-2))';
            btn.style.color = 'var(--ui-text)';
            btn.style.border = '1px solid var(--ui-border)';
            btn.style.padding = '10px 14px';
            btn.style.borderRadius = '12px';
            btn.style.cursor = 'pointer';
            btn.style.marginLeft = '10px';
            btn.style.fontWeight = 'bold';
            
            btn.onmouseenter = () => btn.style.filter = 'brightness(1.1)';
            btn.onmouseleave = () => btn.style.filter = 'none';

            btn.onclick = () => this.toggleOverlay(true);
            
            ctx.slots.header.appendChild(btn);
        }

        this.overlay = document.createElement('div');
        this.overlay.style.position = 'fixed';
        this.overlay.style.inset = '0';
        this.overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
        this.overlay.style.backdropFilter = 'blur(5px)';
        this.overlay.style.zIndex = '50';
        this.overlay.style.display = 'none';

        const drawer = document.createElement('div');
        drawer.style.position = 'absolute';
        drawer.style.left = '0';
        drawer.style.top = '0';
        drawer.style.height = '100%';
        drawer.style.width = 'min(720px, 95vw)';
        drawer.style.backgroundColor = 'var(--ui-surface)';
        drawer.style.borderRight = '1px solid var(--ui-border)';
        drawer.style.boxShadow = 'var(--ui-elev)';
        drawer.style.display = 'flex';
        drawer.style.flexDirection = 'column';
        drawer.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
        drawer.style.transform = 'translateX(-100%)';

        const header = document.createElement('header');
        header.style.padding = '16px 20px';
        header.style.borderBottom = '1px solid var(--ui-border)';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.background = 'var(--ui-surface-2)';
        
        // Use standard concatenation to avoid template literal escaping issues
        header.innerHTML = 
            '<div><b style="font-size:1.2em;">AI Chat</b> <span id="chat-active-badge" style="font-size:0.8em; color:var(--ui-muted); background:var(--ui-surface); padding:2px 8px; border-radius:10px; border:1px solid var(--ui-border); margin-left:8px;"></span></div>' +
            '<button id="chat-close-btn" style="background:transparent; border:none; color:var(--ui-text); cursor:pointer; font-size:1.5em; line-height:1;">&times;</button>';

        this.msgList = document.createElement('div');
        this.msgList.style.flex = '1';
        this.msgList.style.padding = '20px';
        this.msgList.style.overflowY = 'auto';
        this.msgList.style.display = 'flex';
        this.msgList.style.flexDirection = 'column';
        this.msgList.style.gap = '16px';

        const inputArea = document.createElement('div');
        inputArea.style.padding = '16px 20px';
        inputArea.style.borderTop = '1px solid var(--ui-border)';
        inputArea.style.display = 'flex';
        inputArea.style.gap = '10px';
        inputArea.style.background = 'var(--ui-surface-2)';

        const input = document.createElement('textarea');
        input.placeholder = 'Ask anything... (Shift+Enter for newline)';
        input.style.flex = '1';
        input.style.minHeight = '48px';
        input.style.maxHeight = '200px';
        input.style.resize = 'vertical';
        input.style.background = 'var(--ui-surface)';
        input.style.color = 'var(--ui-text)';
        input.style.border = '1px solid var(--ui-border)';
        input.style.borderRadius = '12px';
        input.style.padding = '12px 16px';
        input.style.fontFamily = 'inherit';
        input.style.outline = 'none';

        const sendBtn = document.createElement('button');
        sendBtn.textContent = 'Send';
        sendBtn.style.background = 'var(--ui-accent)';
        sendBtn.style.color = 'white';
        sendBtn.style.border = 'none';
        sendBtn.style.borderRadius = '10px';
        sendBtn.style.padding = '0 20px';
        sendBtn.style.cursor = 'pointer';
        sendBtn.style.fontWeight = 'bold';

        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) this.toggleOverlay(false);
        };
        header.querySelector('#chat-close-btn').onclick = () => this.toggleOverlay(false);

        const handleSend = async () => {
            const val = input.value.trim();
            if (!val) return;
            
            this.data.history.push({ role: 'user', text: val });
            this._save(ctx);
            input.value = '';
            this.renderMessages();

            // Setup loading state
            this.data.history.push({ role: 'ai', text: '...', loading: true });
            this.renderMessages();

            try {
                const reply = await this._callLLM(val);
                this.data.history.pop(); // remove loading
                this.data.history.push({ role: 'ai', text: reply });
            } catch (err) {
                this.data.history.pop();
                this.data.history.push({ role: 'ai', text: "Error: " + err.message, error: true });
            }
            
            this._save(ctx);
            this.renderMessages();
        };

        sendBtn.onclick = handleSend;
        input.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        };

        inputArea.appendChild(input);
        inputArea.appendChild(sendBtn);
        
        drawer.appendChild(header);
        drawer.appendChild(this.msgList);
        drawer.appendChild(inputArea);
        this.overlay.appendChild(drawer);
        this.drawer = drawer; 
        this.headerBadge = header.querySelector('#chat-active-badge');

        document.body.appendChild(this.overlay);
        this.renderMessages();
    },

    async _callLLM(prompt) {
        const provider = this.data.activeProvider;
        const key = this.data.keys[provider];
        
        if (!key) {
            throw new Error(`No API key configured for ${provider.toUpperCase()}. Please add it in Admin settings.`);
        }

        // Extremely simplified fetch wrappers for MVP demonstration.
        // In a strict production system, system prompts and chat history context would be injected here.
        if (provider === 'openai') {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            if (!res.ok) throw new Error(res.statusText);
            const json = await res.json();
            return json.choices[0].message.content;

        } else if (provider === 'anthropic') {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20240620',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            if (!res.ok) throw new Error(res.statusText);
            const json = await res.json();
            return json.content[0].text;

        } else if (provider === 'gemini') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            if (!res.ok) throw new Error(res.statusText);
            const json = await res.json();
            return json.candidates[0].content.parts[0].text;

        } else if (provider === 'copilot') {
            // Placeholder for generic Azure/Copilot proxy endpoint as it requires complex tenant auth generally
            throw new Error('Copilot native browser fetch requires a proxy server to handle authentication. Feature coming soon.');
        }

        throw new Error('Unknown provider');
    },

    renderMessages() {
        if (!this.msgList) return;
        this.msgList.innerHTML = '';
        
        if (this.headerBadge) {
            this.headerBadge.textContent = "Using: " + this.data.activeProvider.toUpperCase();
        }
        
        this.data.history.forEach(msg => {
            const bubbleWrap = document.createElement('div');
            bubbleWrap.style.display = 'flex';
            bubbleWrap.style.flexDirection = 'column';
            bubbleWrap.style.alignItems = msg.role === 'user' ? 'flex-end' : 'flex-start';

            const bubble = document.createElement('div');
            bubble.style.maxWidth = '85%';
            bubble.style.padding = '12px 16px';
            bubble.style.borderRadius = '14px';
            bubble.style.lineHeight = '1.5';
            bubble.style.whiteSpace = 'pre-wrap'; // support multi-line text
            
            if (msg.role === 'user') {
                bubble.style.background = 'var(--ui-accent)';
                bubble.style.color = 'white';
                bubble.style.borderBottomRightRadius = '4px'; 
            } else {
                bubble.style.background = 'var(--ui-surface-2)';
                bubble.style.color = 'var(--ui-text)';
                bubble.style.border = '1px solid var(--ui-border)';
                bubble.style.borderBottomLeftRadius = '4px';
                if (msg.error) bubble.style.color = '#ff4444';
                if (msg.loading) bubble.style.opacity = '0.5';
            }

            bubble.textContent = msg.text;
            bubbleWrap.appendChild(bubble);
            this.msgList.appendChild(bubbleWrap);
        });

        setTimeout(() => {
            this.msgList.scrollTop = this.msgList.scrollHeight;
        }, 10);
    },

    toggleOverlay(show) {
        if (!this.overlay || !this.drawer) return;
        if (show) {
            this.overlay.style.display = 'block';
            requestAnimationFrame(() => {
                this.drawer.style.transform = 'translateX(0)';
            });
        } else {
            this.drawer.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                this.overlay.style.display = 'none';
            }, 300);
        }
    },

    async unmount(ctx) {
        if (this.overlay) {
            this.overlay.remove();
        }
        const btn = document.getElementById('chat-toggle-btn');
        if (btn) btn.remove();
    }
}
