
(function(){
  function leafImg(size=260){
    return `<svg width="${size}" height="${size}" viewBox="0 0 128 128" aria-hidden="true"><use href="#placeholder-leaf"/></svg>`;
  }
  async function fetchProduct(id){
    if(window.CONFIG.DEMO){
      return window.MONO_DEMO.products.find(p=> String(p.id)===String(id));
    }
    return await window.http.get(`/productos/${id}/`);
  }

  function renderRelated(prod, mount){
    const list = (window.CONFIG.DEMO? window.MONO_DEMO.products : [])
      .filter(p=> p.id!==prod.id && (p.categoria===prod.categoria || p.marca===prod.marca)).slice(0,8);
    if(!list.length) return;
    const sec = document.createElement("div");
    sec.className="section";
    sec.innerHTML = `<h2>Relacionados</h2><div class="carousel"><div class="strip"></div><button class="nav left">‹</button><button class="nav right">›</button></div>`;
    const strip = sec.querySelector(".strip");
    list.forEach(p=>{
      const card = document.createElement("div");
      card.className="card";
      card.innerHTML = `
        <div class="thumb">${p.image_url? `<img src="${p.image_url}" />` : leafImg(120)}</div>
        <div class="body">
          <a href="#/producto?id=${p.id}"><b>${p.nombre}</b></a>
          <div class="price">$${(p.precio||0).toFixed(2)}</div>
        </div>`;
      strip.appendChild(card);
    });
    mount.appendChild(sec);
    const stripEl = sec.querySelector(".strip");
    sec.querySelector(".left").onclick = ()=> stripEl.scrollBy({left:-300, behavior:"smooth"});
    sec.querySelector(".right").onclick = ()=> stripEl.scrollBy({left:300, behavior:"smooth"});
  }

  async function producto(params){
    const {id} = params;
    const wrap = document.querySelector('[data-view="producto"]');
    if(!id){ wrap.innerHTML = `<div class="card" style="padding:12px">Falta id de producto.</div>`; return; }
    const p = await fetchProduct(id);
    if(!p){ wrap.innerHTML = `<div class="card" style="padding:12px">Producto no encontrado.</div>`; return; }

    wrap.innerHTML = `
      <div class="product">
        <div class="gallery">
          <div class="main" id="g-main">${p.image_url? `<img src="${p.image_url}"/>` : leafImg(300)}</div>
          <div class="thumbs" id="g-thumbs"></div>
        </div>
        <div class="buybox">
          <h2 style="margin:0 0 6px">${p.nombre||p.name}</h2>
          <div class="price" style="font-size:1.6rem">$${(p.precio||p.price||0).toFixed(2)}</div>
          <div class="small">Disponibilidad: ${(p.stock||0)>0? 'En stock' : 'Agotado'}</div>
          <div style="display:flex; gap:8px; align-items:center; margin:10px 0">
            <label>Cantidad</label>
            <div class="qty">
              <button id="qminus">-</button>
              <span id="qval">1</span>
              <button id="qplus">+</button>
            </div>
          </div>
          <div style="display:flex; gap:8px; margin:10px 0">
            <button class="btn" id="add">Agregar 🛒</button>
            <button class="btn alt" id="buy">Comprar ahora</button>
          </div>
          <hr style="border-color:rgba(255,255,255,.08)">
          <table class="table">
            ${(p.thc||p.cbd)? `<tr><th>THC/CBD</th><td>${p.thc||0}% / ${p.cbd||0}%</td></tr>`:""}
            ${p.strain? `<tr><th>Strain</th><td>${p.strain}</td></tr>`:""}
            ${p.marca? `<tr><th>Marca</th><td>${p.marca}</td></tr>`:""}
            ${p.categoria? `<tr><th>Categoría</th><td>${p.categoria}</td></tr>`:""}
          </table>
        </div>
      </div>
      <div class="card" style="padding:12px; margin-top:12px">
        <h3>Descripción</h3>
        <p class="small">${p.descripcion||"Sin descripción."}</p>
      </div>
      <div id="rel"></div>
    `;
    // thumbs (just duplicates if only one)
    const thumbs = $("#g-thumbs", wrap);
    const urls = [p.image_url].filter(Boolean);
    if(!urls.length) urls.push(null,null,null);
    urls.forEach(u=>{
      const img = document.createElement("img");
      if(u) img.src = u; else img.outerHTML = `<img src="data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 128 128%22><use href=%22#placeholder-leaf%22/></svg>')}" />`
      img.onclick = ()=> $("#g-main", wrap).innerHTML = u? `<img src="${u}"/>`: leafImg(300);
      thumbs.appendChild(img);
    });

    let qty=1;
    $("#qminus", wrap).onclick = ()=>{ qty=Math.max(1, qty-1); $("#qval", wrap).textContent=qty; };
    $("#qplus", wrap).onclick = ()=>{ qty=Math.min(p.stock||99, qty+1); $("#qval", wrap).textContent=qty; };
    $("#add", wrap).onclick = ()=>{ window.carrito.add({id:p.id, nombre:p.nombre||p.name, price:p.precio||p.price||0, qty, image_url:p.image_url, stock:p.stock||99}); window.updateCartCount(); window.toast("Agregado al carrito"); };
    $("#buy", wrap).onclick = ()=>{ window.carrito.add({id:p.id, nombre:p.nombre||p.name, price:p.precio||p.price||0, qty, image_url:p.image_url, stock:p.stock||99}); location.hash="#/checkout"; };

    renderRelated(p, $("#rel", wrap));
  }

  window.pages = window.pages || {};
  window.pages.producto = producto;
})();
