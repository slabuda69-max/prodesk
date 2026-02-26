
// Core App: creates appCtx, storage, events, admin scaffold, theme switching
import { createRegistry } from './registry.js';

export async function boot(options){
  const { load = [], defaultTheme = 'ui.theme.classic' } = options || {};

  const slots = {
    header: document.getElementById('slot-header'),
    topbar: document.getElementById('slot-topbar'),
    quickbar: document.getElementById('slot-quickbar'),
    main: document.getElementById('slot-main'),
    favorites: document.getElementById('slot-favorites'),
    widgets: document.getElementById('slot-widgets'),
    overlays: document.getElementById('slot-overlays'),
    admin: document.getElementById('slot-admin'),
  };

  const STORAGE_ROOT = 'dash.core.v1';
  const storage = {
    get(key, fallback){
      try{ const v = localStorage.getItem(`${STORAGE_ROOT}:${key}`); return v? JSON.parse(v) : fallback; }catch{ return fallback; }
    },
    set(key, value){ localStorage.setItem(`${STORAGE_ROOT}:${key}`, JSON.stringify(value)); },
    modGet(mod, key, fallback){ return storage.get(`mod:${mod}:${key}`, fallback); },
    modSet(mod, key, value){ storage.set(`mod:${mod}:${key}`, value); },
  };

  // Simple event bus
  const listeners = new Map(); // name -> Set
  const events = {
    on(name, fn){ if(!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); return ()=>events.off(name, fn); },
    off(name, fn){ const s=listeners.get(name); if(s) s.delete(fn); },
    emit(name, payload){ const s=listeners.get(name); if(!s) return; for(const fn of Array.from(s)) try{ fn(payload); }catch(e){ console.error('listener error', e); } },
  };

  // Admin scaffold (overlay with tabs)
  const admin = buildAdmin(slots.admin);

  // Toast/notify
  function notify(msg, kind='info'){ const wrap = document.createElement('div'); wrap.className='toast show'; wrap.innerHTML=`<div class="box">${escapeHtml(msg)}</div>`; document.body.appendChild(wrap); setTimeout(()=>wrap.remove(), 2500); }

  const appCtx = {
    version: 'Core-LTS-1',
    slots, storage, events,
    ui: {
      addAdminSections(sections){ admin.addSections(sections); },
      applyTheme: async (themeName)=> await applyTheme(themeName),
      notify
    },
    registry: null,
  };

  const registry = createRegistry(appCtx);
  appCtx.registry = registry;

  // Preload configured modules
  for(const url of load){ await registry.load(url); }

  // Theme handling
  let activeTheme = storage.get('activeTheme', defaultTheme);
  async function applyTheme(name){
    if(activeTheme === name) return;
    const prev = activeTheme; activeTheme = name;
    storage.set('activeTheme', activeTheme);
    // unmount previous theme if loaded
    if(prev && registry.get(prev)) await registry.unmount(prev);
    // ensure theme is loaded
    if(!registry.get(name)){
      console.warn('Theme not preloaded:', name);
      // In a later phase, we could dynamically import from a gallery map.
    }
    await registry.mount(name);
    notify(`Theme applied: ${name}`);
    events.emit('theme:changed', { name });
    admin.refreshAppearanceList();
  }

  // Mount default theme
  if(registry.get(activeTheme)) await registry.mount(activeTheme); else if(registry.get(defaultTheme)) await registry.mount(defaultTheme);

  // Wire Admin button and hotkey
  const btnAdmin = document.getElementById('btnAdmin');
  if(btnAdmin) btnAdmin.onclick = ()=> admin.toggle(true);
  document.addEventListener('keydown', (e)=>{ if(e.altKey && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase()==='a'){ e.preventDefault(); admin.toggle(true); } });

  // Build core Admin tabs (including Appearance)
  admin.setTabs([
    { id:'links', label:'Links' },
    { id:'groups', label:'Groups' },
    { id:'widgets', label:'Widgets' },
    { id:'settings', label:'Settings' },
    { id:'backup', label:'Backup' },
    { id:'appearance', label:'Appearance' },
  ]);

  // Core-provided Appearance content (lists installed themes)
  admin.onRenderTab('appearance', el=>{
    const themes = registry.list().filter(m=> m.meta?.kind === 'theme');
    el.innerHTML = '';
    const act = storage.get('activeTheme', activeTheme);
    const list = document.createElement('div');
    list.innerHTML = `<div class="acc"><div class="acc-h"><div><b>Installed Themes</b></div></div><div class="acc-b"></div></div>`;
    const body = list.querySelector('.acc-b');
    themes.forEach(t=>{
      const row = document.createElement('div');
      row.style.display='flex'; row.style.alignItems='center'; row.style.justifyContent='space-between'; row.style.padding='6px 0';
      row.innerHTML = `<div><b>${escapeHtml(t.meta.label||t.meta.name)}</b><div class="tiny" style="opacity:.7">${escapeHtml(t.meta.name)} v${escapeHtml(t.meta.version||'')}</div></div>`+
        `<div><button data-apply>Apply</button> <span class="tiny" style="margin-left:8px; opacity:.8;">${t.meta.name===act?'Active':''}</span></div>`;
      row.querySelector('[data-apply]').onclick = ()=> applyTheme(t.meta.name);
      body.appendChild(row);
    });
    el.appendChild(list);
  });


// Auto‑mount all loaded feature modules (non‑themes)
for (const m of registry.list()) {
  if (m.meta && m.meta.kind === 'feature') {
    await registry.mount(m.meta.name);
  }
}


  admin.render();
}

function buildAdmin(host){
  host.innerHTML = `
    <div class="admin-overlay" id="adminOv">
      <div class="admin-backdrop" id="adminBackdrop"></div>
      <div class="admin-panel">
        <header>
          <div><b>Admin</b> <span class="tiny" id="adminVersion" style="opacity:.65"></span></div>
          <div><button id="adminClose">Close</button></div>
        </header>
        <div class="admin-tabs" id="adminTabs"></div>
        <div class="admin-body" id="adminBody"></div>
      </div>
    </div>`;

  const ov = document.getElementById('adminOv');
  const tabsEl = document.getElementById('adminTabs');
  const bodyEl = document.getElementById('adminBody');
  const btnClose = document.getElementById('adminClose');
  const backdrop = document.getElementById('adminBackdrop');

  const state = { tabs: [], active: null, sections: {} };

  function setTabs(tabs){ state.tabs = tabs.slice(); renderTabs(); }
  function renderTabs(){
    tabsEl.innerHTML = '';
    state.tabs.forEach(t=>{
      const b = document.createElement('button'); b.textContent = t.label; b.className = (state.active===t.id?'active':''); b.onclick = ()=> openTab(t.id);
      b.setAttribute('data-tab', t.id);
      tabsEl.appendChild(b);
    });
    if(!state.active && state.tabs.length) openTab(state.tabs[0].id);
  }
  function openTab(id){ state.active = id; render(); }

  const renderHooks = new Map(); // tabId -> fn(el)
  function onRenderTab(tabId, fn){ renderHooks.set(tabId, fn); }

  function addSections(sections){
    sections.forEach(s=>{
      const tab = s.tab || 'settings';
      if(!state.sections[tab]) state.sections[tab] = [];
      // replace if id exists
      const arr = state.sections[tab];
      const i = arr.findIndex(x=>x.id===s.id);
      if(i>=0) arr[i] = s; else arr.push(s);
    });
    render();
  }

  function render(){
    document.getElementById('adminVersion').textContent = '';
    bodyEl.innerHTML = '';
    const tab = state.active;

    // Core tab renderer hook
    if(renderHooks.has(tab)){
      const el = document.createElement('div');
      renderHooks.get(tab)(el);
      bodyEl.appendChild(el);
    }

    // Module sections
    const secs = state.sections[tab] || [];
    secs.forEach(s=>{
      const acc = document.createElement('div'); acc.className='acc'; acc.setAttribute('data-acc', s.id);
      acc.innerHTML = `<div class="acc-h"><div><b>${escapeHtml(s.title||'')}</b></div><div class="tiny" style="opacity:.7">${escapeHtml(s.hint||'')}</div></div><div class="acc-b"></div>`;
      const body = acc.querySelector('.acc-b');
      try{ s.render(body, {}); }catch(e){ body.innerHTML = `<div class="tiny">Section failed: ${escapeHtml(e.message||e)}</div>`; }
      bodyEl.appendChild(acc);
    });
  }

  function toggle(open){ ov.classList.toggle('open', open!==false); }

  btnClose.onclick = ()=> toggle(false);
  backdrop.onclick = ()=> toggle(false);

  // Public API
  return { setTabs, onRenderTab, addSections, render, toggle, refreshAppearanceList(){ if(state.active==='appearance') render(); } };
}
function escapeHtml(s){
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  })[m]);
}
