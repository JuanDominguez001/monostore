
(function(){
  const $ = (sel, el=document)=> el.querySelector(sel);
  const $$ = (sel, el=document)=> Array.from(el.querySelectorAll(sel));
  window.$ = $; window.$$ = $$;

  // Basic toast & log
  let toastEl;
  function toast(msg, type="info"){
    if(!toastEl){ toastEl = document.createElement("div"); toastEl.className="toast"; document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.remove("hidden");
    setTimeout(()=> toastEl.classList.add("hidden"), 3000);
  }
  const reqlog = [];
  window.log = (entry)=>{
    try{
      reqlog.unshift({ts:new Date().toLocaleTimeString(), ...entry});
      const el = $("#reqlog pre");
      if(el) el.textContent = JSON.stringify(reqlog.slice(0,30), null, 2);
    }catch{}
  };
  window.toast = toast;

  // Demo dataset (fallback)
  const demoProducts = [
    {id:101, nombre:"Flor INDICA Purple Dream", categoria:"Flores", marca:"GreenMonk", precio:299, rating:4.6, stock:12, strain:"INDICA", thc:22, cbd:1, image_url:"", descripcion:"Relajante para la noche."},
    {id:102, nombre:"Flor SATIVA Lime Spark", categoria:"Flores", marca:"LeafKing", precio:259, rating:4.2, stock:20, strain:"SATIVA", thc:19, cbd:1, image_url:"", descripcion:"Energía y enfoque."},
    {id:103, nombre:"Cartucho HYBRID BlueMint 1g", categoria:"Extractos", marca:"CloudCrown", precio:499, rating:4.8, stock:8, strain:"HYBRID", thc:80, cbd:0.5, image_url:"", descripcion:"Suave y balanceado."},
    {id:104, nombre:"Grinder aluminio 4p", categoria:"Accesorios", marca:"ToolLeaf", precio:199, rating:4.5, stock:34, image_url:"", descripcion:"Durable y preciso."},
    {id:105, nombre:"Pipa vidrio curvada", categoria:"Accesorios", marca:"ToolLeaf", precio:149, rating:4.1, stock:15, image_url:"", descripcion:"Compacta y cómoda."},
    {id:106, nombre:"Bho Shatter 1g", categoria:"Extractos", marca:"CloudCrown", precio:699, rating:4.9, stock:5, strain:"HYBRID", thc:85, cbd:0.3, image_url:"", descripcion:"Alta potencia."},
    {id:107, nombre:"Flor HYBRID Blue Cookie", categoria:"Flores", marca:"GreenMonk", precio:289, rating:4.3, stock:18, strain:"HYBRID", thc:21, cbd:1.2, image_url:"", descripcion:"Dulce y herbal."},
    {id:108, nombre:"Papelillos King Size", categoria:"Accesorios", marca:"RollPro", precio:49, rating:4.0, stock:100, image_url:"", descripcion:"Quema lenta."}
  ];
  const demoCats = [...new Set(demoProducts.map(p=>p.categoria))];
  const demoBrands = [...new Set(demoProducts.map(p=>p.marca))];
  window.MONO_DEMO = { products: demoProducts, categorias: demoCats, marcas: demoBrands };

  // Simple router
  const routes = ["home","catalogo","producto","carrito","checkout","perfil","admin"];
  function parseHash(){
    const raw = location.hash.slice(2); // remove "#/"
    if(!raw) return {view:"home", params:{}};
    const [viewPart, queryPart] = raw.split("?");
    const view = routes.includes(viewPart) ? viewPart : "home";
    const params = Object.fromEntries(new URLSearchParams(queryPart||""));
    return {view, params};
  }

  // Admin check (basic heuristic)
  function isAdmin(){
    try{
      const email = window.USER?.email || localStorage.getItem("MONO_USER_EMAIL") || "";
      return email.endsWith("@monostore.com") || localStorage.getItem("MONO_ADMIN")==="1";
    }catch{ return false }
  }
  window.isAdmin = isAdmin;

  // API/auth chips
  function setChips({api, auth}){
    const apiEl = $("#chip-api"), authEl = $("#chip-auth");
    apiEl.textContent = "API: " + api;
    apiEl.className = "badge " + (api==="conectada"?"ok": api==="desconocida"?"warn":"err");
    authEl.textContent = "Auth: " + auth;
    authEl.className = "badge " + (auth==="conectado"?"ok": auth==="invitado"?"warn":"err");
  }

  // Autocomplete dropdown
  let acWrap;
  function showAutocomplete(list, onPick){
    if(!acWrap){
      acWrap = document.createElement("div");
      acWrap.className = "autocomplete";
      $(".searchbox form").appendChild(acWrap);
    }
    acWrap.innerHTML = "";
    list.slice(0,8).forEach(item=>{
      const div = document.createElement("div");
      div.className = "opt";
      div.textContent = item;
      div.onclick = ()=>{ onPick(item); acWrap.remove(); acWrap=null; };
      acWrap.appendChild(div);
    });
  }
  function closeAutocomplete(){
    if(acWrap){ acWrap.remove(); acWrap=null; }
  }

  // Search bar behaviors
  async function handleSearchInput(ev){
    const q = ev.target.value.trim();
    if(q.length<2){ closeAutocomplete(); return; }
    try{
      if(window.CONFIG.DEMO){
        const names = window.MONO_DEMO.products.filter(p=>p.nombre.toLowerCase().includes(q.toLowerCase())).map(p=>p.nombre);
        showAutocomplete(names, (pick)=>{ $("#q").value = pick; location.hash = `#/catalogo?search=${encodeURIComponent(pick)}`; });
        return;
      }
      const res = await window.http.get("/productos/", {query:{search:q}});
      const names = (Array.isArray(res)?res:res?.results||[]).map(p=>p.nombre||p.name).filter(Boolean);
      showAutocomplete(names, (pick)=>{ $("#q").value = pick; location.hash = `#/catalogo?search=${encodeURIComponent(pick)}`; });
    }catch{ /* ignore */ }
  }

  // Search submit
  function onSearchSubmit(ev){
    ev.preventDefault();
    const q = $("#q").value.trim();
    location.hash = `#/catalogo?search=${encodeURIComponent(q)}`;
    closeAutocomplete();
  }

  // Build header & static ui
  function buildHeader(){
    // cart count
    updateCartCount();
    // admin link visibility
    $("#nav-admin").classList.toggle("hidden", !isAdmin());
  }

  function updateCartCount(){
    const items = window.carrito.getItems();
    const count = items.reduce((a,b)=> a + Number(b.qty||0), 0);
    $("#cart-count").textContent = String(count);
  }
  window.updateCartCount = updateCartCount;

  // Load categories & brands for subnav chips
  async function loadTaxonomy(){
    const row = $(".subnav .row");
    row.innerHTML = "";
    let cats=[], marcas=[];
    try{
      if(window.CONFIG.DEMO){
        cats = window.MONO_DEMO.categorias;
        marcas = window.MONO_DEMO.marcas;
      }else{
        const [rc, rm] = await Promise.all([window.http.get("/categorias/"), window.http.get("/marcas/")]);
        cats = (Array.isArray(rc)?rc:rc?.results||[]).map(c=>c.nombre||c.name||c.titulo||c);
        marcas = (Array.isArray(rm)?rm:rm?.results||[]).map(m=>m.nombre||m.name||m.titulo||m);
      }
    }catch(e){
      cats = window.MONO_DEMO.categorias;
      marcas = window.MONO_DEMO.marcas;
    }
    // Render two groups
    const frag = document.createDocumentFragment();
    const title1 = document.createElement("span"); title1.className="chip"; title1.textContent="Categorías:"; frag.appendChild(title1);
    cats.forEach(c=>{
      const chip = document.createElement("span"); chip.className="chip"; chip.textContent=c;
      chip.onclick = ()=> location.hash = `#/catalogo?categoria=${encodeURIComponent(c)}`;
      frag.appendChild(chip);
    });
    const sep = document.createElement("span"); sep.style.flexBasis="100%"; frag.appendChild(sep);
    const title2 = document.createElement("span"); title2.className="chip"; title2.textContent="Marcas:"; frag.appendChild(title2);
    marcas.forEach(m=>{
      const chip = document.createElement("span"); chip.className="chip"; chip.textContent=m;
      chip.onclick = ()=> location.hash = `#/catalogo?marca=${encodeURIComponent(m)}`;
      frag.appendChild(chip);
    });
    row.appendChild(frag);
  }

  // Guard: redirect to login if not logged in
  function guard(){
    if(!window.CONFIG.ACCESS && !window.CONFIG.DEMO){
      location.href = "login.html";
    }
  }

  // Routing
  async function render(){
    const {view, params} = parseHash();
    // breadcrumbs
    const bc = $(".breadcrumbs");
    const crumbs = [{label:"Inicio", href:"#/home"}];
    if(view!=="home") crumbs.push({label:view[0].toUpperCase()+view.slice(1)});
    if(view==="producto" && params.id) crumbs.push({label:"Producto #"+params.id});
    bc.innerHTML = crumbs.map((c,i)=> i? `<span class="sep">›</span><a href="${c.href||'#'}">${c.label}</a>` : `<a href="${c.href||'#'}">${c.label}</a>`).join("");
    // show correct view
    $$("[data-view]").forEach(el=> el.classList.add("hidden"));
    const el = $(`[data-view="${view}"]`);
    if(el) el.classList.remove("hidden");
    // delegate to page scripts
    if(window.pages && typeof window.pages[view]==="function"){
      await window.pages[view](params);
    }
  }


  // API probe para chips (y solo activar DEMO si la API realmente no responde)
  async function probe(){
    const authState = (window.CONFIG.ACCESS ? "conectado" : "invitado");
    setChips({api:"desconocida", auth: authState});
    try{
      await window.http.get("/productos/", {query:{limit:1}});
      setChips({api:"conectada", auth: authState});
      window.CONFIG.DEMO = false;
    }catch(e){
      const msg = String(e.message||"");
      if (msg.includes("HTTP 401") || msg.includes("HTTP 403")) {
        // API está viva pero requiere token → NO al demo
        setChips({api:"conectada", auth: authState});
        window.CONFIG.DEMO = false;
      } else {
        setChips({api:"error", auth: authState});
        window.CONFIG.DEMO = true;        // demo solo cuando la API no responde en absoluto
        toast("API no disponible. Activando modo demo.");
      }
    }
  }


  // Global SVG defs (logo + placeholders)
  function injectSVGDefs(){
    const defs = document.createElementNS("http://www.w3.org/2000/svg","svg");
    defs.setAttribute("style","position:absolute;width:0;height:0;overflow:hidden");
    defs.innerHTML = `
    <symbol id="logo-mono" viewBox="0 0 128 128">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#22c55e"/>
          <stop offset="1" stop-color="#16a34a"/>
        </linearGradient>
      </defs>
      <!-- circular face -->
      <circle cx="64" cy="68" r="38" fill="url(#g1)"/>
      <!-- ears -->
      <circle cx="32" cy="68" r="12" fill="#1f6f3c"/>
      <circle cx="96" cy="68" r="12" fill="#1f6f3c"/>
      <!-- eyes -->
      <circle cx="52" cy="64" r="5" fill="#0a1410"/>
      <circle cx="76" cy="64" r="5" fill="#0a1410"/>
      <!-- mouth -->
      <path d="M48,82 Q64,94 80,82" stroke="#0a1410" stroke-width="4" fill="none" stroke-linecap="round"/>
      <!-- crown of leaves -->
      <path d="M64 20 C54 26 48 36 46 48 C52 42 60 40 64 40 C68 40 76 42 82 48 C80 36 74 26 64 20Z" fill="#22c55e" stroke="#128c42" stroke-width="2" stroke-linejoin="round"/>
      <path d="M64 14 C58 18 50 24 48 34 C52 30 60 28 64 28 C68 28 76 30 80 34 C78 24 70 18 64 14Z" fill="#1fb35a" stroke="#128c42" stroke-width="2" stroke-linejoin="round"/>
    </symbol>

    <symbol id="placeholder-leaf" viewBox="0 0 128 128">
      <path d="M64 8 C72 24 96 40 112 64 C92 68 76 80 64 96 C52 80 36 68 16 64 C32 40 56 24 64 8Z" fill="#105d35"/>
      <path d="M64 8 C60 24 60 44 64 96" stroke="#1ea65a" stroke-width="6" stroke-linecap="round"/>
    </symbol>`;
    document.body.appendChild(defs);
  }

  // Public helpers
  window.helpers = { setChips, buildHeader, updateCartCount, loadTaxonomy };

  // Init
  document.addEventListener("DOMContentLoaded", async ()=>{
    injectSVGDefs();
    guard();
    await probe();
    buildHeader();
    loadTaxonomy();

    // search input
    $("#q").addEventListener("input", handleSearchInput);
    $(".searchbox form").addEventListener("submit", onSearchSubmit);

    // Nav clicks
    $("#nav-home").onclick = ()=> location.hash="#/home";
    $("#nav-catalogo").onclick = ()=> location.hash="#/catalogo";
    $("#nav-carrito").onclick = ()=> location.hash="#/carrito";

    // Router
    window.addEventListener("hashchange", render);
    if(!location.hash) location.hash = "#/home";
    render();
  });

  // Expose minimal API
  window.$ = $; window.$$ = $$;
})();
