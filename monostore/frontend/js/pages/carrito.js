
(function(){
  const CART_KEY = window.CONFIG.LS.cart;

  function read(){ try{ return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }catch{ return [] } }
  function write(items){ localStorage.setItem(CART_KEY, JSON.stringify(items)); }
  function add(item){
    const items = read();
    const idx = items.findIndex(it=> String(it.id)===String(item.id));
    if(idx>=0){ items[idx].qty = Math.min((items[idx].qty||1)+ (item.qty||1), item.stock||99); }
    else{ items.push({id:item.id, nombre:item.nombre, price:item.price, qty:item.qty||1, image_url:item.image_url, stock:item.stock||99}); }
    write(items);
  }
  function remove(id){
    write(read().filter(it=> String(it.id)!==String(id)));
  }
  function setQty(id, qty){
    const items = read();
    const it = items.find(i=> String(i.id)===String(id));
    if(it){ it.qty = Math.max(1, Math.min(qty, it.stock||99)); write(items); }
  }
  function clear(){ write([]); }
  function getItems(){ return read(); }
  function getTotal(){ return read().reduce((sum,it)=> sum + (Number(it.price)||0) * (Number(it.qty)||1), 0); }

  window.carrito = { add, remove, setQty, clear, getItems, getTotal };

  function renderCarrito(){
    const wrap = document.querySelector('[data-view="carrito"]');
    const items = getItems();
    if(!items.length){
      wrap.innerHTML = `<div class="card" style="padding:12px">Tu carrito está vacío.</div>`;
      return;
    }
    wrap.innerHTML = `
      <div class="card" style="padding:12px; overflow:auto">
        <table class="table cart" style="width:100%">
          <thead><tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr></thead>
          <tbody id="tbody"></tbody>
        </table>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px">
          <div class="total">Total: $<span id="gt">${getTotal().toFixed(2)}</span></div>
          <a class="btn" href="#/checkout">Ir a checkout</a>
        </div>
      </div>`;
    const tb = $("#tbody", wrap);
    items.forEach(it=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="display:flex; align-items:center; gap:8px">
          <div style="width:52px;height:52px; background:#0a1712; border-radius:8px; display:flex; align-items:center; justify-content:center">
            ${it.image_url? `<img src="${it.image_url}" style="width:100%; height:100%; object-fit:cover">` : `<svg width="40" height="40" viewBox="0 0 128 128"><use href="#placeholder-leaf"/></svg>`}
          </div>
          <a href="#/producto?id=${it.id}">${it.nombre}</a>
        </td>
        <td>$${Number(it.price).toFixed(2)}</td>
        <td>
          <div class="qty">
            <button class="dec">-</button>
            <span class="val">${it.qty}</span>
            <button class="inc">+</button>
          </div>
        </td>
        <td>$<span class="sub">${(it.qty*it.price).toFixed(2)}</span></td>
        <td><button class="btn danger del">Eliminar</button></td>`;
      $(".dec", tr).onclick = ()=>{ window.carrito.setQty(it.id, it.qty-1); renderCarrito(); window.updateCartCount(); };
      $(".inc", tr).onclick = ()=>{ window.carrito.setQty(it.id, it.qty+1); renderCarrito(); window.updateCartCount(); };
      $(".del", tr).onclick = ()=>{ window.carrito.remove(it.id); renderCarrito(); window.updateCartCount(); };
      tb.appendChild(tr);
    });
    $("#gt", wrap).textContent = getTotal().toFixed(2);
  }

  window.pages = window.pages || {};
  window.pages.carrito = function(){ renderCarrito(); };
})();
