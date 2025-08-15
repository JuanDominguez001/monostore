
(function(){
  function starHTML(rating){
    const full = Math.round(rating||0);
    return "★★★★★".slice(0,full).replace(/./g,'<span class="star">★</span>') + "★★★★★".slice(full).replace(/./g,'<span class="star" style="opacity:.25">★</span>');
  }
  function strainLabel(strain){
    if(!strain) return "";
    const s = String(strain).toUpperCase();
    const cls = s==="INDICA"?"indica": s==="SATIVA"?"sativa":"hybrid";
    return `<span class="label strain ${cls}">${s}</span>`;
  }
  function leafImg(size=140){
    return `<svg width="${size}" height="${size}" viewBox="0 0 128 128" aria-hidden="true"><use href="#placeholder-leaf"/></svg>`;
  }

  async function cargarProductos(state){
    state.loading = true;
    try{
      if(window.CONFIG.DEMO){
        let items = [...window.MONO_DEMO.products];
        const q = state.search?.toLowerCase();
        if(q) items = items.filter(p=> (p.nombre||"").toLowerCase().includes(q));
        if(state.categoria) items = items.filter(p=> p.categoria===state.categoria);
        if(state.marca) items = items.filter(p=> p.marca===state.marca);
        if(state.min_price) items = items.filter(p=> p.precio>=Number(state.min_price));
        if(state.max_price) items = items.filter(p=> p.precio<=Number(state.max_price));
        if(state.orden==="price_asc") items.sort((a,b)=>a.precio-b.precio);
        if(state.orden==="price_desc") items.sort((a,b)=>b.precio-a.precio);
        if(state.orden==="popularity") items.sort((a,b)=> (b.rating||0)-(a.rating||0));
        const pageSize = 12, start = (state.page-1)*pageSize;
        const pageItems = items.slice(start, start+pageSize);
        return {results: pageItems, count: items.length};
      }else{
        const res = await window.http.get("/productos/", {query:{
          search: state.search, categoria: state.categoria, marca: state.marca,
          min_price: state.min_price, max_price: state.max_price, orden: state.orden,
          page: state.page
        }});
        // Normalize
        if(Array.isArray(res)) return {results:res, count:res.length};
        return res;
      }
    }finally{
      state.loading = false;
    }
  }

  function renderGrid(list, mount){
    mount.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "grid";
    list.forEach(p=>{
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="thumb">${p.image_url? `<img src="${p.image_url}" alt="">` : leafImg(120)}</div>
        <div class="body">
          <a class="name" href="#/producto?id=${p.id}"><b>${p.nombre||p.name}</b></a>
          <div class="rating" aria-label="rating">${starHTML(p.rating||3.5)}</div>
          <div class="price">$${(p.precio||p.price||0).toFixed(2)}</div>
          <div class="badges">
            ${(p.stock||0)>0? `<span class="label stock">Stock: ${p.stock}</span>` : `<span class="label oos">Agotado</span>`}
            ${strainLabel(p.strain||p.variedad)}
          </div>
          <div style="margin-top:8px;display:flex;gap:8px">
            <button class="btn add">Agregar 🛒</button>
            <button class="btn alt buy">Comprar ahora</button>
          </div>
        </div>`;
      card.querySelector(".add").onclick = ()=>{
        window.carrito.add({id:p.id, nombre:p.nombre||p.name, price:p.precio||p.price||0, image_url:p.image_url, stock:p.stock||99});
        window.updateCartCount(); window.toast("Agregado al carrito");
      };
      card.querySelector(".buy").onclick = ()=>{
        window.carrito.add({id:p.id, nombre:p.nombre||p.name, price:p.precio||p.price||0, image_url:p.image_url, stock:p.stock||99});
        location.hash = "#/checkout";
      };
      grid.appendChild(card);
    });
    mount.appendChild(grid);
  }

  async function catalogo(params){
    const wrap = document.querySelector('[data-view="catalogo"]');
    wrap.innerHTML = `
      <div class="card" style="padding:12px;margin-bottom:12px">
        <div style="display:grid; gap:8px; grid-template-columns: repeat(2,1fr)">
          <input class="input" id="f-search" placeholder="Buscar..." value="${params.search||""}"/>
          <select id="f-orden" class="input">
            <option value="">Orden</option>
            <option value="price_asc">Precio ↑</option>
            <option value="price_desc">Precio ↓</option>
            <option value="popularity">Popularidad</option>
          </select>
          <input class="input" id="f-categoria" placeholder="Categoría" value="${params.categoria||""}"/>
          <input class="input" id="f-marca" placeholder="Marca" value="${params.marca||""}"/>
          <input class="input" id="f-min" placeholder="Precio min" type="number" value="${params.min_price||""}"/>
          <input class="input" id="f-max" placeholder="Precio max" type="number" value="${params.max_price||""}"/>
        </div>
        <div style="display:flex; gap:8px; margin-top:10px">
          <button class="btn" id="btn-aplicar">Aplicar filtros</button>
          <button class="btn alt" id="btn-limpiar">Limpiar</button>
        </div>
      </div>
      <div id="grid-mount"></div>
      <div style="display:flex; gap:8px; justify-content:center; margin:14px 0">
        <button class="btn alt" id="prev">‹</button>
        <span id="pageinfo" class="small"></span>
        <button class="btn alt" id="next">›</button>
      </div>
    `;
    const state = {
      search: params.search||"", categoria: params.categoria||"", marca: params.marca||"",
      min_price: params.min_price||"", max_price: params.max_price||"", orden: params.orden||"",
      page: Number(params.page||1), loading:false
    };
    async function load(){
      const res = await cargarProductos(state);
      const results = res.results || [];
      renderGrid(results, $("#grid-mount"));
      const total = res.count || results.length, pageSize = 12;
      const pages = Math.max(1, Math.ceil(total/pageSize));
      $("#pageinfo").textContent = `Página ${state.page} de ${pages}`;
      $("#prev").disabled = state.page<=1;
      $("#next").disabled = state.page>=pages;
    }
    $("#btn-aplicar").onclick = ()=>{
      const q = {
        search: $("#f-search").value.trim(),
        categoria: $("#f-categoria").value.trim(),
        marca: $("#f-marca").value.trim(),
        min_price: $("#f-min").value.trim(),
        max_price: $("#f-max").value.trim(),
        orden: $("#f-orden").value
      };
      const usp = new URLSearchParams(q);
      location.hash = "#/catalogo?"+usp.toString();
    };
    $("#btn-limpiar").onclick = ()=> location.hash = "#/catalogo";
    $("#prev").onclick = ()=>{ state.page = Math.max(1, state.page-1); params.page = state.page; load(); }
    $("#next").onclick = ()=>{ state.page = state.page+1; params.page = state.page; load(); }
    await load();
  }

  window.pages = window.pages || {};
  window.pages.catalogo = catalogo;
})();
