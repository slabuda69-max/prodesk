
export default {
  meta: { name:'ui.theme.light', version:'1.0.0', kind:'theme', label:'Light' },
  mount(ctx){
    this.styleEl = document.createElement('style');
    this.styleEl.setAttribute('data-theme-module', this.meta.name);
    this.styleEl.textContent = `
      :root{
        --bg:#f3f6fb; --bg-elev:#ffffff; --bg-elev-2:#f2f5fa; --card:#ffffff;
        --text:#131722; --muted:#5c6470; --accent:#4aa3ff; --ok:#3cab59; --warn:#d59e2f; --danger:#d9534f;
        --shadow:0 10px 25px rgba(0,0,0,.10);
        --radius:14px; --radius-sm:10px; --gap:14px;
        --tile:#f7f9fc; --tile-border:#e6ebf3; --tile-hover:#eef3fb;
        --admin-band:#eef3fb; --admin-band-border:#dee6f2; --admin-card:#ffffff;
      }
      body{ color:var(--text); background: var(--bg); }
      #slot-header{ background:var(--bg-elev); border-bottom:1px solid var(--tile-border); box-shadow: var(--shadow); }
      .logo{ background: linear-gradient(135deg, var(--accent), #9ad3ff); color:#fff; }
      .actions button{ background: linear-gradient(180deg, var(--bg-elev), var(--bg-elev-2)); color:var(--text); border:1px solid var(--tile-border); border-radius:12px; }
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
