
(function(){
  async function fetchTax(){
    if(window.CONFIG.DEMO){
      return {categorias: window.MONO_DEMO.categorias, marcas: window.MONO_DEMO.marcas};
    }
    const [c,m] = await Promise.all([window.http.get("/categorias/"), window.http.get("/marcas/")]);
    const cats = (Array.isArray(c)?c:c?.results||[]).map(x=> x.nombre||x.name||x);
    const brands = (Array.isArray(m)?m:m?.results||[]).map(x=> x.nombre||x.name||x);
    return {categorias: cats, marcas: brands};
  }
  async function fetchProducts(){
    if(window.CONFIG.DEMO){
      return window.MONO_DEMO.products;
    }
    const res = await window.http.get("/productos/");
    return Array.isArray(res)? res : (res?.results||[]);
  }

  function input(label, id, val="", type="text"){
    return `<label class="small">${label}</label><input class="input" id="${id}" type="${type}" value="${val??""}">`;
  }

  function renderTable(list, tax, wrap){
    wrap.innerHTML = `
      <div class="card" style="padding:12px; overflow:auto">
        <div style="display:grid; gap:8px; grid-template-columns: repeat(2,1fr)">
          ${input("Nombre","n")}
          ${input("Precio","pr", "", "number")}
          ${input("Imagen URL","img")}
          ${input("Stock","st","", "number")}
          <div>
            <label class="small">Categoría</label>
            <select class="input" id="cat">${tax.categorias.map(c=> `<option value="${c}">${c}</option>`).join("")}</select>
          </div>
          <div>
            <label class="small">Marca</label>
            <select class="input" id="mar">${tax.marcas.map(m=> `<option value="${m}">${m}</option>`).join("")}</select>
          </div>
          ${input("Strain (INDICA|SATIVA|HYBRID)","str")}
          ${input("THC (%)","thc","", "number")}
          ${input("CBD (%)","cbd","", "number")}
          ${input("Weight options (coma)","wopt")}
          <div style="grid-column:1/-1">${input("Descripción","desc")}</div>
        </div>
        <div style="display:flex; gap:8px; margin-top:10px">
          <button class="btn" id="create">Crear</button>
          <button class="btn alt" id="reload">Recargar</button>
        </div>
        <div style="margin-top:12px; overflow:auto">
          <table class="table" style="width:100%">
            <thead><tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Cat</th><th>Marca</th><th></th></tr></thead>
            <tbody id="tb"></tbody>
          </table>
        </div>
      </div>`;
    const tb = $("#tb", wrap);
    list.forEach(p=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td>
        <td contenteditable="true" data-k="nombre">${p.nombre||p.name||""}</td>
        <td contenteditable="true" data-k="precio">${p.precio||p.price||0}</td>
        <td contenteditable="true" data-k="stock">${p.stock||0}</td>
        <td contenteditable="true" data-k="categoria">${p.categoria||""}</td>
        <td contenteditable="true" data-k="marca">${p.marca||""}</td>
        <td style="white-space:nowrap">
          <button class="btn alt save">Guardar</button>
          <button class="btn danger del">Eliminar</button>
        </td>`;
      $(".save", tr).onclick = async ()=>{
        const patch = {};
        $$("[data-k]", tr).forEach(td=> patch[td.getAttribute("data-k")] = td.textContent.trim());
        try{
          if(window.CONFIG.DEMO){
            const idx = window.MONO_DEMO.products.findIndex(x=> x.id===p.id);
            window.MONO_DEMO.products[idx] = {...window.MONO_DEMO.products[idx], ...patch};
            window.toast("Guardado (demo)");
          }else{
            await window.http.patch(`/productos/${p.id}/`, {body:patch});
            window.toast("Guardado");
          }
        }catch(e){ window.toast("Error: "+e.message); }
      };
      $(".del", tr).onclick = async ()=>{
        if(!confirm("¿Eliminar producto #"+p.id+"?")) return;
        try{
          if(window.CONFIG.DEMO){
            window.MONO_DEMO.products = window.MONO_DEMO.products.filter(x=> x.id!==p.id);
            tr.remove(); window.toast("Eliminado (demo)");
          }else{
            await window.http.del(`/productos/${p.id}/`);
            tr.remove(); window.toast("Eliminado");
          }
        }catch(e){ window.toast("Error: "+e.message); }
      };
      tb.appendChild(tr);
    });

    $("#create", wrap).onclick = async ()=>{
      const payload = {
        nombre: $("#n",wrap).value, precio: Number($("#pr",wrap).value||0),
        image_url: $("#img",wrap).value, stock: Number($("#st",wrap).value||0),
        categoria: $("#cat",wrap).value, marca: $("#mar",wrap).value,
        strain: $("#str",wrap).value, thc: Number($("#thc",wrap).value||0),
        cbd: Number($("#cbd",wrap).value||0),
        weight_options: $("#wopt",wrap).value, descripcion: $("#desc",wrap).value
      };
      try{
        if(window.CONFIG.DEMO){
          const id = Math.max(...window.MONO_DEMO.products.map(p=>p.id))+1;
          window.MONO_DEMO.products.push({id, ...payload});
          window.toast("Creado (demo)");
          window.pages.admin();
        }else{
          await window.http.post("/productos/", {body:payload});
          window.toast("Creado");
          window.pages.admin();
        }
      }catch(e){ window.toast("Error: "+e.message); }
    };
    $("#reload", wrap).onclick = ()=> window.pages.admin();
  }

  async function admin(){
    if(!window.isAdmin()){
      document.querySelector('[data-view="admin"]').innerHTML = `<div class="card" style="padding:12px">Solo administradores.</div>`;
      return;
    }
    const wrap = document.querySelector('[data-view="admin"]');
    const [tax, prods] = await Promise.all([fetchTax(), fetchProducts()]);
    renderTable(prods, tax, wrap);
  }

  window.pages = window.pages || {};
  window.pages.admin = admin;
})();
