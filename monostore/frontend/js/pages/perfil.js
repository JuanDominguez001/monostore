
(function(){
  async function fetchPerfil(){
    if(window.CONFIG.DEMO){
      return {username:"demo", email:"demo@monostore.com", nombre:"Usuario Demo"};
    }
    return await window.http.get("/perfil/");
  }
  async function fetchOrders(){
    if(window.CONFIG.DEMO){
      return [{id: 5001, total: 1249.90, fecha:"2025-08-15", estatus:"ENVIADO"}];
    }
    const res = await window.http.get("/ordenes/", {query:{mine:1}});
    return Array.isArray(res)? res : (res?.results||[]);
  }

  async function perfil(){
    const wrap = document.querySelector('[data-view="perfil"]');
    try{
      const [me, orders] = await Promise.all([fetchPerfil(), fetchOrders()]);
      localStorage.setItem("MONO_USER_EMAIL", me.email||"");
      wrap.innerHTML = `
        <div class="card" style="padding:12px">
          <h3>Mi perfil</h3>
          <div class="small">Usuario: ${me.username||me.nombre}</div>
          <div class="small">Email: ${me.email||"-"}</div>
          <div style="display:flex; gap:8px; margin-top:10px">
            <button class="btn" id="orders">Mis pedidos</button>
            <button class="btn alt" id="logout">Cerrar sesión</button>
          </div>
        </div>
        <div class="card" style="padding:12px; margin-top:12px">
          <h3>Pedidos</h3>
          <div id="olist" class="small"></div>
        </div>`;
      $("#orders", wrap).onclick = ()=> renderOrders(orders);
      $("#logout", wrap).onclick = ()=>{ window.auth.logout(); location.href="login.html"; };
      renderOrders(orders);
    }catch(e){
      wrap.innerHTML = `<div class="card" style="padding:12px">Error al cargar perfil: ${e.message}</div>`;
    }
  }

  function renderOrders(orders){
    const list = $("#olist");
    if(!orders.length){ list.textContent = "No hay pedidos." ; return; }
    list.innerHTML = orders.map(o=> `#${o.id} — $${(o.total||0).toFixed?o.total.toFixed(2):o.total} — ${o.estatus||"PAGADO"} — ${o.fecha||""}`).join("<br>");
  }

  window.pages = window.pages || {};
  window.pages.perfil = perfil;
})();
