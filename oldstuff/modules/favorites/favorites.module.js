
export default {
  meta: { name:'feature.favorites', version:'1.0.0', kind:'feature', label:'Favorites' },

  init(ctx){
    // Seed defaults once
    const def = {
      groups: [
        { id: crypto.randomUUID(), name: 'Ungrouped' },
        { id: crypto.randomUUID(), name: 'Work' },
        { id: crypto.randomUUID(), name: 'Personal' }
      ],
      links: [
        { id: crypto.randomUUID(), title:'Outlook', url:'https://outlook.office.com', badge:'Mail', color:'#4aa3ff', groupName:'Ungrouped' },
        { id: crypto.randomUUID(), title:'Teams',   url:'https://teams.microsoft.com',  badge:'Chat', color:'#7b83eb', groupName:'Ungrouped' },
      ],
      openInNewTab: true
    };
    const has = ctx.storage.modGet(this.meta.name, 'data', null);
    if(!has) ctx.storage.modSet(this.meta.name, 'data', def);
  },

  mount(ctx){
    // Inject module CSS (theme-friendly, uses tokens)
    this.styleEl = document.createElement('style');
    this.styleEl.setAttribute('data-module-style', this.meta.name);
    this.styleEl.textContent = `
      .fav-wrap{ background: var(--card, transparent); border:1px solid var(--tile-border, #0002); border-radius: var(--radius, 12px); padding: 16px; box-shadow: var(--shadow, none); }
      .fav-wrap h2{ margin:0 0 10px; font-size:16px; font-weight:700; color:var(--muted, #555); display:flex; align-items:center; justify-content:space-between; }
      .fav-group{ margin-top:12px; border-top:1px dashed var(--tile-border, #0002); padding-top:10px; }
      .fav-ghead{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; color:var(--muted, #666); }
      .fav-tiles{ display:grid; gap:12px; grid-template-columns: repeat( auto-fit, minmax(160px, 1fr) ); }
      .fav-tile{ display:flex; gap:10px; align-items:center; padding:12px 14px; border-radius:12px; border:1px solid var(--tile-border, #0002); background:var(--tile, #f7f9fc); text-decoration:none; color:var(--text, #111); }
      .fav-tile:hover{ background: var(--tile-hover, #eef3fb); }
      .fav-ico{ width:32px; height:32px; border-radius:9px; display:grid; place-items:center; font-weight:700; }
      .fav-meta small{ display:block; color:var(--muted, #666); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .tiny{ font-size:12px; opacity:.75; }
    `;
    document.head.appendChild(this.styleEl);

    // Render into favorites slot
    this.host = ctx.slots.favorites;
    this.host.innerHTML = '';
    const box = document.createElement('div'); box.className = 'fav-wrap';
    box.innerHTML = `<h2>Favorites <span class="tiny">Manage in Admin → Links & Groups</span></h2><div class="fav-body"></div>`;
    this.host.appendChild(box);
    this.body = box.querySelector('.fav-body');

    this.renderTiles(ctx);
  },

  unmount(ctx){
    if(this.host) this.host.innerHTML = '';
    this.styleEl?.remove();
  },

  adminSections(ctx){
    const self = this;
    return [
      {
        tab:'links', id:'fav-links', title:'Favorites - Links', hint:'Add, edit, delete; reorder with ↑/↓',
        render(el){ self.renderAdminLinks(el, ctx); }
      },
      {
        tab:'groups', id:'fav-groups', title:'Favorites - Groups', hint:'Add, rename, delete (Ungrouped is special)',
        render(el){ self.renderAdminGroups(el, ctx); }
      }
    ];
  },

  // ----- Rendering helpers -----
  getData(ctx){ return ctx.storage.modGet(this.meta.name, 'data', {groups:[],links:[],openInNewTab:true}); },
  setData(ctx, data){ ctx.storage.modSet(this.meta.name, 'data', data); },

  groupMapByName(groups){ const m=new Map(); groups.forEach(g=> m.set(g.name, g)); return m; },

  sanitizeUrl(u){
    if(!u) return '';
    let s=String(u).trim(); const sl=s.toLowerCase(); if(sl.startsWith('http://')||sl.startsWith('https://')) return s;
    while(s.startsWith('/')) s=s.slice(1);
    return 'https://' + s;
  },

  renderTiles(ctx){
  const data = this.getData(ctx);
  const gmap = this.groupMapByName(data.groups);

  // Build group -> links map, keep data.groups order
  const groupsOrdered = data.groups.map(g => g.name);
  const bucket = new Map();
  groupsOrdered.forEach(n => bucket.set(n, []));
  data.links.forEach(l => {
    const k = gmap.has(l.groupName) ? l.groupName : 'Ungrouped';
    if (!bucket.has(k)) bucket.set(k, []);
    bucket.get(k).push(l);
  });

  const frag = document.createDocumentFragment();

  for (const gname of bucket.keys()) {
    const links = bucket.get(gname) || [];

    const sec = document.createElement('div');
    sec.className = 'fav-group';
    sec.innerHTML =
      '<div class="fav-ghead">' +
        '<div class="gname"><b>' + this.escape(gname) + '</b></div>' +
        '<div class="tiny">' + String(links.length) + ' link(s)</div>' +
      '</div>' +
      '<div class="fav-tiles"></div>';

    const tiles = sec.querySelector('.fav-tiles');

    links.forEach(l => {
      const a = document.createElement('a');
      a.className = 'fav-tile';
      a.href = this.sanitizeUrl(l.url);
      if (this.getData(ctx).openInNewTab) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      const color = l.color || '#4aa3ff';
      const host = this.displayHost(l.url);

      // ASCII-only badge prefix to avoid Unicode dots
      var badgeText = '';
      if (l.badge && String(l.badge).trim().length) {
        badgeText = ' - ' + this.escape(l.badge);
      }

      // Safe first letter (no optional chaining)
      const rawTitle = (l.title || '').toString();
      const trimmed = rawTitle.trim();
      const firstChar = trimmed ? trimmed.charAt(0).toUpperCase() : '*';

      a.innerHTML =
        '<div class="fav-ico" style="background:' + this.hexWithAlpha(color, 0.15) + '; color:' + color + '">' +
          this.escape(firstChar) +
        '</div>' +
        '<div class="fav-meta">' +
          '<div>' + this.escape(rawTitle) + '</div>' +
          '<small>' + this.escape(host) + badgeText + '</small>' +
        '</div>';

      tiles.appendChild(a);
    });

    frag.appendChild(sec);
  }

  this.body.innerHTML = '';
  this.body.appendChild(frag);
}
,
  // ----- Admin: Links -----
  renderAdminLinks(el, ctx){
    const data = this.getData(ctx);
    const groups = data.groups.map(g=>g.name);
    el.innerHTML = `
      <div class="field"><label>Title</label><input id="favAddTitle" placeholder="e.g., Jira" /></div>
      <div class="field"><label>URL</label><input id="favAddUrl" placeholder="https://..." /></div>
      <div class="field"><label>Badge (optional)</label><input id="favAddBadge" placeholder="e.g., Work" /></div>
      <div class="field"><label>Color (optional)</label><input id="favAddColor" value="#4aa3ff" /></div>
      <div class="field"><label>Group</label><select id="favAddGroup"></select></div>
      <div class="field"><button id="favAddBtn">Add Link</button></div>
      <div class="acc" style="margin-top:10px"><div class="acc-h"><div><b>Link List</b></div><div class="tiny">Edit/Delete; reorder with ↑/↓</div></div><div class="acc-b"><div id="favList"></div></div></div>
    `;
    const grpSel = el.querySelector('#favAddGroup');
    grpSel.innerHTML = groups.map(g=>`<option>${this.escape(g)}</option>`).join('');

    el.querySelector('#favAddBtn').onclick = ()=>{
      const t = el.querySelector('#favAddTitle').value.trim();
      const u = el.querySelector('#favAddUrl').value.trim();
      const b = el.querySelector('#favAddBadge').value.trim();
      const c = el.querySelector('#favAddColor').value.trim() || '#4aa3ff';
      const g = grpSel.value || 'Ungrouped';
      if(!t || !u) return alert('Title and URL are required.');
      data.links.push({ id: crypto.randomUUID(), title:t, url:u, badge:b, color:c, groupName:g });
      this.setData(ctx, data); this.renderTiles(ctx); this.renderAdminLinks(el, ctx);
    };

    const list = el.querySelector('#favList'); list.innerHTML='';
    data.links.forEach((l, idx)=>{
      const row = document.createElement('div');
      row.style.display='grid'; row.style.gridTemplateColumns='1fr auto auto auto'; row.style.gap='8px'; row.style.alignItems='center'; row.style.padding='6px 0';
      row.innerHTML = `
        <div>
          <div><b>${this.escape(l.title)}</b></div>
          <div class="tiny">${this.escape(l.url)} ${l.badge? ' • '+this.escape(l.badge):''} • <i>${this.escape(l.groupName)}</i></div>
        </div>
        <div><button data-up>↑</button></div>
        <div><button data-edit>Edit</button></div>
        <div><button data-del style="color:#c33">Delete</button></div>`;
      row.querySelector('[data-up]').onclick = ()=>{
        if(idx>0){ const tmp=data.links[idx-1]; data.links[idx-1]=data.links[idx]; data.links[idx]=tmp; this.setData(ctx,data); this.renderTiles(ctx); this.renderAdminLinks(el,ctx); }
      };
      row.querySelector('[data-edit]').onclick = ()=>{
        const nt = prompt('Title', l.title); if(nt===null) return;
        const nu = prompt('URL', l.url); if(nu===null) return;
        const nb = prompt('Badge (optional)', l.badge||''); if(nb===null) return;
        const nc = prompt('Color hex', l.color||'#4aa3ff'); if(nc===null) return;
        const pick = prompt('Group (type exact):'+groups.join(', '), l.groupName||'Ungrouped');
        l.title = nt.trim(); l.url = nu.trim(); l.badge = nb.trim(); l.color = nc.trim(); l.groupName = groups.includes(pick)? pick : 'Ungrouped';
        this.setData(ctx, data); this.renderTiles(ctx); this.renderAdminLinks(el, ctx);
      };
      row.querySelector('[data-del]').onclick = ()=>{
        if(confirm('Delete this link?')){ data.links.splice(idx,1); this.setData(ctx,data); this.renderTiles(ctx); this.renderAdminLinks(el,ctx); }
      };
      list.appendChild(row);
    });
  },

  // ----- Admin: Groups -----
  renderAdminGroups(el, ctx){
    const data = this.getData(ctx);
    el.innerHTML = `
      <div class="field"><label>New Group Name</label><input id="favGrpName" placeholder="e.g., Army" /></div>
      <div class="field"><button id="favGrpAdd">Add Group</button></div>
      <div class="acc" style="margin-top:10px"><div class="acc-h"><div><b>Group List</b></div><div class="tiny">Rename/Delete; Ungrouped cannot be removed</div></div><div class="acc-b"><div id="grpList"></div></div></div>
    `;
    el.querySelector('#favGrpAdd').onclick = ()=>{
      const name = el.querySelector('#favGrpName').value.trim(); if(!name) return;
      if(data.groups.find(g=>g.name===name)) return alert('Group exists.');
      data.groups.push({ id: crypto.randomUUID(), name });
      this.setData(ctx, data); this.renderTiles(ctx); this.renderAdminGroups(el, ctx);
    };

    const list = el.querySelector('#grpList'); list.innerHTML='';
    data.groups.forEach((g, idx)=>{
      const row = document.createElement('div');
      row.style.display='grid'; row.style.gridTemplateColumns='1fr auto auto'; row.style.gap='8px'; row.style.alignItems='center'; row.style.padding='6px 0';
      row.innerHTML = `
        <div><b>${this.escape(g.name)}</b></div>
        <div><button data-rename>Rename</button></div>
        <div><button data-del style="color:#c33">Delete</button></div>`;
      row.querySelector('[data-rename]').onclick = ()=>{
        if(g.name==='Ungrouped') return alert('Ungrouped cannot be renamed.');
        const nn = prompt('New name', g.name); if(nn===null) return; const trimmed = nn.trim(); if(!trimmed) return;
        if(data.groups.find(x=>x.name===trimmed)) return alert('A group with that name exists.');
        // Move any links that used old name
        data.links.forEach(l=>{ if(l.groupName===g.name) l.groupName = trimmed; });
        g.name = trimmed; this.setData(ctx, data); this.renderTiles(ctx); this.renderAdminGroups(el, ctx);
      };
      row.querySelector('[data-del]').onclick = ()=>{
        if(g.name==='Ungrouped') return alert('Ungrouped cannot be deleted.');
        if(!confirm(`Delete group "${g.name}"? Links move to Ungrouped.`)) return;
        data.links.forEach(l=>{ if(l.groupName===g.name) l.groupName='Ungrouped'; });
        data.groups.splice(idx,1); this.setData(ctx, data); this.renderTiles(ctx); this.renderAdminGroups(el, ctx);
      };
      list.appendChild(row);
    });
  },

  // ----- Utils -----
  escape(s){ return String(s||''); },
  hexWithAlpha(hex, a){ try{ const n=(hex||'').replace('#',''); const r=parseInt(n.length===3? n[0]+n[0] : n.slice(0,2),16); const g=parseInt(n.length===3? n[1]+n[1] : n.slice(2,4),16); const b=parseInt(n.length===3? n[2]+n[2] : n.slice(4,6),16); return `rgba(${r},${g},${b},${a})`; }catch{ return 'rgba(74,163,255,.15)'; } },
  displayHost(u){ try{ return new URL(this.sanitizeUrl(u)).host; }catch{ return (String(u||'').replace(/^https?:\/\//,'').split('/')[0]); } }
};
