// modules/widgets/widgets.module.js
// Feature: Widgets (notes, calendar, iframe)
// Contract: Module API v1. ASCII-only. Token-friendly CSS. No optional chaining.

const NS = 'mod:feature.widgets';
const DATA_KEY = NS + ':data';
const STYLE_ID = NS + ':style';

function escapeHtml(s){
  return String(s || '').replace(/[&<>"']/g, function(m){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
  });
}

function uid(){
  return 'w' + Math.random().toString(36).slice(2, 10);
}

function readStore(){
  try{
    const raw = localStorage.getItem(DATA_KEY);
    if(!raw){ return { widgets: [] }; }
    const obj = JSON.parse(raw);
    if(!obj || !Array.isArray(obj.widgets)){ return { widgets: [] }; }
    return obj;
  }catch(e){
    console.warn('[widgets] readStore error', e);
    return { widgets: [] };
  }
}

function writeStore(data){
  try{
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }catch(e){
    console.warn('[widgets] writeStore error', e);
  }
}

function ensureStyle(){
  if(document.getElementById(STYLE_ID)){ return; }
  const css = [
    '#widgets-module-root{display:block;}',
    '#widgets-module-root .widgets-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:var(--ui-gap,12px);}',
    '#widgets-module-root .widget-card{background:var(--ui-surface,#ffffff);color:var(--ui-text,#222);border:1px solid var(--ui-border,#dddddd);border-radius:var(--ui-radius,8px);box-shadow:var(--ui-elev,0 1px 2px rgba(0,0,0,0.06));display:flex;flex-direction:column;min-height:120px;}',
    '#widgets-module-root .widget-head{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid var(--ui-border,#e1e1e1);font-weight:600;}',
    '#widgets-module-root .widget-title{margin:0;font-size:14px;line-height:1.2;}',
    '#widgets-module-root .widget-body{padding:10px;}',
    '#widgets-module-root .widget-note{width:100%;min-height:160px;resize:vertical;background:var(--ui-field-bg,#fff);color:var(--ui-text,#222);border:1px solid var(--ui-border,#cccccc);border-radius:6px;padding:8px;box-sizing:border-box;}',
    '#widgets-module-root .widget-iframe{width:100%;border:1px solid var(--ui-border,#cccccc);border-radius:6px;background:var(--ui-surface,#fff);}',

    /* Admin styles (scoped by admin renderer container id) */
    '#widgets-admin{padding:8px;}',
    '#widgets-admin .row{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px dashed var(--ui-border,#e2e2e2);}',
    '#widgets-admin .row:last-child{border-bottom:none;}',
    '#widgets-admin .col{display:flex;flex-direction:column;min-width:120px;}',
    '#widgets-admin label{font-size:12px;color:var(--ui-muted,#555);margin-bottom:4px;}',
    '#widgets-admin input[type="text"], #widgets-admin input[type="url"], #widgets-admin input[type="number"], #widgets-admin select, #widgets-admin textarea{border:1px solid var(--ui-border,#ccc);border-radius:6px;padding:6px 8px;background:var(--ui-field-bg,#fff);color:var(--ui-text,#222);min-width:220px;}',
    '#widgets-admin textarea{min-height:80px;resize:vertical;}',
    '#widgets-admin .actions{display:flex;gap:6px;align-items:center;margin-top:18px;}',
    '#widgets-admin button{background:var(--ui-accent,#2060ff);color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer;}',
    '#widgets-admin button.secondary{background:var(--ui-muted-bg,#f2f2f2);color:var(--ui-text,#222);}',
    '#widgets-admin .list{margin-top:14px;}',
    '#widgets-admin .hint{font-size:12px;color:var(--ui-muted,#666);margin-top:6px;}'
  ].join('\n');
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

function byId(id){ return document.getElementById(id); }

function mountToSlot(root){
  const slot = document.getElementById('slot-widgets') || document.getElementById('slot-main') || document.body;
  slot.appendChild(root);
}

function renderMain(state){
  ensureStyle();
  const prev = document.getElementById('widgets-module-root');
  if(prev && prev.parentNode){ prev.parentNode.removeChild(prev); }

  const data = state.data;
  const root = document.createElement('section');
  root.id = 'widgets-module-root';
  root.setAttribute('data-module', 'feature.widgets');

  const grid = document.createElement('div');
  grid.className = 'widgets-grid';

  function clampHeight(h){
    var n = parseInt(h, 10);
    if(isNaN(n) || n < 120) n = 300;
    if(n > 2000) n = 2000;
    return n;
  }

  for(var i=0;i<data.widgets.length;i++){
    var w = data.widgets[i];
    var card = document.createElement('article');
    card.className = 'widget-card';

    var head = document.createElement('div');
    head.className = 'widget-head';
    var title = document.createElement('h3');
    title.className = 'widget-title';
    title.textContent = w.title || (w.type.charAt(0).toUpperCase() + w.type.slice(1));
    head.appendChild(title);

    var body = document.createElement('div');
    body.className = 'widget-body';

    if(w.type === 'notes'){
      var ta = document.createElement('textarea');
      ta.className = 'widget-note';
      ta.value = String(w.text || '');
      ta.addEventListener('input', function(evt){
        // save per widget id
        var id = w.id;
        for(var j=0;j<data.widgets.length;j++){
          if(data.widgets[j].id === id){
            data.widgets[j].text = evt.target.value;
            break;
          }
        }
        writeStore(data);
      });
      body.appendChild(ta);
    } else if(w.type === 'calendar' || w.type === 'iframe'){
      var url = String(w.url || '');
      var h = clampHeight(w.height);
      var iframe = document.createElement('iframe');
      iframe.className = 'widget-iframe';
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('referrerpolicy', 'no-referrer');
      iframe.setAttribute('allowfullscreen', '');
      iframe.style.height = String(h) + 'px';
      // Security note: some sites block embedding via X-Frame-Options.
      // This will simply show a blank frame in that case.
      try{ iframe.src = url; }catch(e){ iframe.srcdoc = '<p>Invalid URL</p>'; }

      var openWrap = document.createElement('div');
      openWrap.className = 'hint';
      var a = document.createElement('a');
      a.href = url || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Open in new tab';
      openWrap.appendChild(a);

      body.appendChild(iframe);
      body.appendChild(openWrap);
    } else {
      var p = document.createElement('p');
      p.textContent = 'Unknown widget type: ' + String(w.type);
      body.appendChild(p);
    }

    card.appendChild(head);
    card.appendChild(body);
    grid.appendChild(card);
  }

  root.appendChild(grid);
  mountToSlot(root);
}

function renderAdmin(el, state, rerenderMain){
  ensureStyle();
  el.innerHTML = '';

  var wrap = document.createElement('div');
  wrap.id = 'widgets-admin';

  var title = document.createElement('h3');
  title.textContent = 'Widgets';
  wrap.appendChild(title);

  var hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = 'Add notes, calendar, or iframe widgets. Reorder to arrange display. Data is stored locally in your browser.';
  wrap.appendChild(hint);

  // Add form
  var addRow = document.createElement('div');
  addRow.className = 'row';

  var colT = document.createElement('div'); colT.className = 'col';
  var lblT = document.createElement('label'); lblT.textContent = 'Type';
  var selT = document.createElement('select');
  ;['notes','calendar','iframe'].forEach(function(t){ var o = document.createElement('option'); o.value=t; o.textContent=t; selT.appendChild(o); });
  colT.appendChild(lblT); colT.appendChild(selT);

  var colTitle = document.createElement('div'); colTitle.className = 'col';
  var lblTitle = document.createElement('label'); lblTitle.textContent = 'Title';
  var inpTitle = document.createElement('input'); inpTitle.type = 'text'; inpTitle.placeholder = 'My Widget';
  colTitle.appendChild(lblTitle); colTitle.appendChild(inpTitle);

  var colURL = document.createElement('div'); colURL.className = 'col';
  var lblURL = document.createElement('label'); lblURL.textContent = 'URL (for calendar or iframe)';
  var inpURL = document.createElement('input'); inpURL.type = 'url'; inpURL.placeholder = 'https://...';
  colURL.appendChild(lblURL); colURL.appendChild(inpURL);

  var colH = document.createElement('div'); colH.className = 'col';
  var lblH = document.createElement('label'); lblH.textContent = 'Height px (for calendar or iframe)';
  var inpH = document.createElement('input'); inpH.type = 'number'; inpH.min = '120'; inpH.max = '2000'; inpH.placeholder = '300';
  colH.appendChild(lblH); colH.appendChild(inpH);

  var colTxt = document.createElement('div'); colTxt.className = 'col';
  var lblTxt = document.createElement('label'); lblTxt.textContent = 'Initial note text (for notes)';
  var taTxt = document.createElement('textarea');
  colTxt.appendChild(lblTxt); colTxt.appendChild(taTxt);

  var actions = document.createElement('div'); actions.className = 'actions';
  var btnAdd = document.createElement('button'); btnAdd.textContent = 'Add Widget';
  actions.appendChild(btnAdd);

  addRow.appendChild(colT);
  addRow.appendChild(colTitle);
  addRow.appendChild(colURL);
  addRow.appendChild(colH);
  addRow.appendChild(colTxt);
  addRow.appendChild(actions);

  wrap.appendChild(addRow);

  function visibleForType(){
    var t = selT.value;
    colURL.style.display = (t === 'calendar' || t === 'iframe') ? 'flex' : 'none';
    colH.style.display = (t === 'calendar' || t === 'iframe') ? 'flex' : 'none';
    colTxt.style.display = (t === 'notes') ? 'flex' : 'none';
  }
  selT.addEventListener('change', visibleForType);
  visibleForType();

  btnAdd.addEventListener('click', function(){
    var t = selT.value;
    var record = {
      id: uid(),
      type: t,
      title: String(inpTitle.value || '').trim() || (t.charAt(0).toUpperCase() + t.slice(1)),
      url: '',
      height: 300,
      text: ''
    };
    if(t === 'notes'){
      record.text = String(taTxt.value || '');
    } else {
      record.url = String(inpURL.value || '');
      var h = parseInt(inpH.value, 10);
      if(!isNaN(h)) record.height = h;
    }
    state.data.widgets.push(record);
    writeStore(state.data);
    renderList();
    rerenderMain();
  });

  var list = document.createElement('div');
  list.className = 'list';
  wrap.appendChild(list);

  function renderList(){
    list.innerHTML = '';
    var arr = state.data.widgets;
    for(var i=0;i<arr.length;i++){
      (function(idx){
        var w = arr[idx];
        var row = document.createElement('div'); row.className = 'row';

        var col1 = document.createElement('div'); col1.className = 'col';
        var l1 = document.createElement('label'); l1.textContent = 'Type';
        var sel = document.createElement('select');
        ;['notes','calendar','iframe'].forEach(function(t){ var o=document.createElement('option'); o.value=t; o.textContent=t; if(w.type===t){o.selected=true;} sel.appendChild(o); });
        col1.appendChild(l1); col1.appendChild(sel);

        var col2 = document.createElement('div'); col2.className = 'col';
        var l2 = document.createElement('label'); l2.textContent = 'Title';
        var ti = document.createElement('input'); ti.type = 'text'; ti.value = String(w.title || '');
        col2.appendChild(l2); col2.appendChild(ti);

        var col3 = document.createElement('div'); col3.className = 'col';
        var l3 = document.createElement('label'); l3.textContent = 'URL (calendar or iframe)';
        var ui = document.createElement('input'); ui.type = 'url'; ui.value = String(w.url || '');
        col3.appendChild(l3); col3.appendChild(ui);

        var col4 = document.createElement('div'); col4.className = 'col';
        var l4 = document.createElement('label'); l4.textContent = 'Height px';
        var hi = document.createElement('input'); hi.type = 'number'; hi.min = '120'; hi.max = '2000'; hi.value = String(w.height || 300);
        col4.appendChild(l4); col4.appendChild(hi);

        var col5 = document.createElement('div'); col5.className = 'col';
        var l5 = document.createElement('label'); l5.textContent = 'Note text (for notes)';
        var ta = document.createElement('textarea'); ta.value = String(w.text || '');
        col5.appendChild(l5); col5.appendChild(ta);

        function updateVisibility(){
          var t = sel.value;
          col3.style.display = (t === 'calendar' || t === 'iframe') ? 'flex' : 'none';
          col4.style.display = (t === 'calendar' || t === 'iframe') ? 'flex' : 'none';
          col5.style.display = (t === 'notes') ? 'flex' : 'none';
        }
        updateVisibility();
        sel.addEventListener('change', updateVisibility);

        var acts = document.createElement('div'); acts.className = 'actions';
        var bSave = document.createElement('button'); bSave.textContent = 'Save';
        var bUp = document.createElement('button'); bUp.textContent = 'Up'; bUp.className = 'secondary';
        var bDown = document.createElement('button'); bDown.textContent = 'Down'; bDown.className = 'secondary';
        var bDel = document.createElement('button'); bDel.textContent = 'Delete'; bDel.className = 'secondary';

        bSave.addEventListener('click', function(){
          var t = sel.value;
          var rec = arr[idx];
          rec.type = t;
          rec.title = String(ti.value || '').trim() || (t.charAt(0).toUpperCase() + t.slice(1));
          if(t === 'notes'){
            rec.text = String(ta.value || '');
            rec.url = '';
          }else{
            rec.url = String(ui.value || '');
            var h = parseInt(hi.value, 10);
            if(!isNaN(h)) rec.height = h; else rec.height = 300;
          }
          writeStore(state.data);
          rerenderMain();
        });

        bUp.addEventListener('click', function(){
          if(idx <= 0) return;
          var tmp = arr[idx-1];
          arr[idx-1] = arr[idx];
          arr[idx] = tmp;
          writeStore(state.data);
          renderList();
          rerenderMain();
        });

        bDown.addEventListener('click', function(){
          if(idx >= arr.length - 1) return;
          var tmp = arr[idx+1];
          arr[idx+1] = arr[idx];
          arr[idx] = tmp;
          writeStore(state.data);
          renderList();
          rerenderMain();
        });

        bDel.addEventListener('click', function(){
          var id = arr[idx].id;
          arr.splice(idx, 1);
          writeStore(state.data);
          renderList();
          rerenderMain();
        });

        acts.appendChild(bSave);
        acts.appendChild(bUp);
        acts.appendChild(bDown);
        acts.appendChild(bDel);

        row.appendChild(col1);
        row.appendChild(col2);
        row.appendChild(col3);
        row.appendChild(col4);
        row.appendChild(col5);
        row.appendChild(acts);

        list.appendChild(row);
      })(i);
    }
  }

  renderList();
  el.appendChild(wrap);
}

// ===== Widgets module (export region) =====
var widgetsModule = {
  meta: { name: 'mod.feature.widgets', version: '1.0.0', kind: 'feature', label: 'Widgets' },
  async init(ctx){
    // no-op; load existing data
    this._state = { data: readStore() };
  },
  async mount(ctx){
    if(!this._state){ this._state = { data: readStore() }; }
    var state = this._state;
    renderMain(state);
  },
  async unmount(ctx){
    var root = document.getElementById('widgets-module-root');
    if(root && root.parentNode){ root.parentNode.removeChild(root); }
  },
  adminSections(ctx){
    var self = this;
    return [{
      tab: 'Widgets',
      id: 'widgets_manage', // CSS-safe id; avoids querySelector('#widgets.manage') pitfall
      title: 'Manage Widgets',
      hint: 'Create notes, calendar, and iframe widgets. Use Up/Down to reorder.',
      render: function(el, ctx){
        try{
          // Ensure state exists even if admin collected sections before init()
          if(!self._state || !self._state.data){
            try { self._state = { data: readStore() }; }
            catch(e){ console.warn('[widgets] readStore fallback error', e); self._state = { data: { widgets: [] } }; }
          }
          function rerender(){ renderMain(self._state); }
          renderAdmin(el, self._state, rerender);
        }catch(e){
          console.error('[widgets] Admin render failed:', e);
          if(el){
            el.innerHTML = '<div style="color:#b00;font:13px/1.4 system-ui,Segoe UI,Arial">Widgets admin failed to render. See console.</div>';
          }
        }
      }
    }];
  }
};

export { widgetsModule };