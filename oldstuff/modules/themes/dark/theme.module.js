
export default {
  meta: { name:'ui.theme.dark', version:'1.0.0', kind:'theme', label:'Dark' },
  mount(ctx){
    this.styleEl = document.createElement('style');
    this.styleEl.setAttribute('data-theme-module', this.meta.name);
    this.styleEl.textContent = `
      :root{
        --bg:#0b0e12; --bg-elev:#12161d; --bg-elev-2:#181e27; --card:#121922;
        --text:#e6ebf1; --muted:#9aa3ad; --accent:#6fb1ff; --ok:#7bd389; --warn:#f4bf4f; --danger:#ff6b6b;
        --shadow:0 10px 28px rgba(0,0,0,.4);
        --radius:14px; --radius-sm:10px; --gap:14px;
        --tile:#151c27; --tile-border:#22303f; --tile-hover:#243247;
        --admin-band:#141b26; --admin-band-border:#27364a; --admin-card:#0f151c;
      }
      body{ color:var(--text); background: radial-gradient(1200px 700px at 0% 0%, #121b2a 0%, transparent 60%), radial-gradient(1200px 700px at 100% 0%, #152136 0%, transparent 60%), var(--bg); background-attachment:fixed; }
      #slot-header{ background:var(--bg-elev); border-bottom:1px solid var(--tile-border); box-shadow: var(--shadow); }
      .logo{ background: linear-gradient(135deg, var(--accent), #a6d6ff); color:#fff; }
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
