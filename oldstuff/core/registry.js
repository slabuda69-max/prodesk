
// Module Registry — loads ESM modules and manages lifecycle
export function createRegistry(ctx){
  const mods = new Map(); // name -> module
  const mounted = new Set(); // names


async function load(url){
  // Resolve the module path relative to the page's base URI
  const resolved = new URL(url, document.baseURI).href;

  const modNS = await import(resolved);
  if(!modNS || !modNS.default) throw new Error(`Module ${url} has no default export`);
  const m = modNS.default;
  if(!m.meta || !m.meta.name) throw new Error(`Module ${url} missing meta.name`);
  if(mods.has(m.meta.name)) return mods.get(m.meta.name);
  m.__url = resolved;
  mods.set(m.meta.name, m);
  if(typeof m.init === 'function'){
    try{ await m.init(ctx); }catch(e){ console.warn(`Module ${m.meta.name} init failed`, e); }
  }
  return m;
}


  function get(name){ return mods.get(name); }
  function list(){ return Array.from(mods.values()); }

  async function mount(name){
    const m = mods.get(name);
    if(!m || typeof m.mount !== 'function') return;
    if(mounted.has(name)) return;
    try{ await m.mount(ctx); mounted.add(name); }
    catch(e){ console.warn(`Module ${name} mount failed`, e); }

    if(typeof m.adminSections === 'function'){
      try{ ctx.ui.addAdminSections(m.adminSections(ctx) || []); }
      catch(e){ console.warn(`Module ${name} adminSections failed`, e); }
    }
  }

  async function unmount(name){
    const m = mods.get(name);
    if(!m || !mounted.has(name)) return;
    if(typeof m.unmount === 'function'){
      try{ await m.unmount(ctx); }catch(e){ console.warn(`Module ${name} unmount failed`, e); }
    }
    mounted.delete(name);
  }

  return { load, get, list, mount, unmount };
}
