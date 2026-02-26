
export default {
  meta: { name:'ui.theme.classic', version:'1.0.0', kind:'theme', label:'Classic' },
  mount(ctx){
    this.styleEl = document.createElement('style');
    this.styleEl.setAttribute('data-theme-module', this.meta.name);
    this.styleEl.textContent = `
      :root{
        --bg:#0f1216; --bg-elev:#171b21; --bg-elev-2:#1e242c; --card:#18202a;
        --text:#eef2f7; --muted:#9aa3ad; --accent:#4aa3ff; --ok:#7bd389; --warn:#f4bf4f; --danger:#ff6b6b;
        --shadow:0 10px 30px rgba(0,0,0,.35);
        --radius:14px; --radius-sm:10px; --gap:14px;
        --tile:#1b232e; --tile-border:#242e3b; --tile-hover:#263345;
        --admin-band:#1a2230; --admin-band-border:#2a3445; --admin-card:#141a22;
      }
      body{ color:var(--text); background: radial-gradient(1200px 700px at 0% 0%, #152032 0%, transparent 60%), radial-gradient(1200px 700px at 100% 0%, #1a2538 0%, transparent 60%), var(--bg); background-attachment:fixed; }
      #slot-header{ background:var(--bg-elev); border-bottom:1px solid var(--tile-border); box-shadow: var(--shadow); }
      .logo{ background: linear-gradient(135deg, var(--accent), #9ad3ff); color:#fff; }
      .actions button{ background: linear-gradient(180deg, var(--bg-elev), var(--bg-elev-2)); color:var(--text); border:1px solid var(--tile-border); border-radius:12px; }
      #slot-topbar, #slot-quickbar { color: var(--muted); }
      #slot-main{ }
      /* Admin */
      .admin-overlay .admin-panel{ background: var(--bg-elev); color: var(--text); border-left:1px solid var(--tile-border); box-shadow: var(--shadow); }
      .admin-panel header{ border-bottom:1px solid var(--tile-border); }
      .admin-tabs button{ background: var(--bg-elev-2); border:1px solid var(--tile-border); color:var(--text); }
      .admin-tabs button.active{ background: var(--accent); border-color: transparent; color:#fff; }
      .acc{ border:1px solid var(--admin-band-border); background: var(--admin-card); }
      .acc-h{ background: var(--admin-band); border-bottom:1px solid var(--admin-band-border); }
      .acc-b{ color: var(--text); }
      .toast .box{ background: var(--bg-elev); color:var(--text); border:1px solid var(--tile-border); box-shadow: var(--shadow); }
    `;
    document.head.appendChild(this.styleEl);
  },
  unmount(ctx){ this.styleEl?.remove(); }
};
