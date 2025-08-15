
(function(){
  async function createOrder(payload){
    if(window.CONFIG.DEMO){
      return {id: Math.floor(Math.random()*1e6), total: payload.total};
    }
    return await window.http.post("/ordenes/", {body:payload});
  }
  async function createPayment(payload){
    if(window.CONFIG.DEMO){
      // 10% chance to fail to demo errors
      if(Math.random()<0.1) throw new Error("HTTP 402: Pago rechazado (modo demo)");
      return {status:"pagado"};
    }
    return await window.http.post("/pagos/", {body:payload});
  }

  async function checkout(){
    const wrap = document.querySelector('[data-view="checkout"]');
    const items = window.carrito.getItems();
    if(!items.length){ wrap.innerHTML = `<div class="card" style="padding:12px">No hay items en el carrito.</div>`; return; }
    const total = window.carrito.getTotal();

    wrap.innerHTML = `
      <div class="card" style="padding:12px">
        <h3>Checkout</h3>
        <div style="display:grid; gap:12px; grid-template-columns:1fr">
          <div>
            <label class="small">Nombre</label>
            <input class="input" id="name" placeholder="Nombre completo">
          </div>
          <div>
            <label class="small">Email</label>
            <input class="input" id="email" placeholder="email@dominio.com">
          </div>
          <div>
            <label class="small">Dirección</label>
            <textarea class="input" id="addr" rows="3" placeholder="Calle, número, colonia, ciudad"></textarea>
          </div>
          <div>
            <label class="small">Método de pago</label>
            <select class="input" id="pay">
              <option value="tarjeta">Tarjeta</option>
              <option value="oxxo">OXXO</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
          <div class="card" style="padding:12px">
            <b>Resumen</b>
            <div class="small">${items.map(it=> `${it.qty} × ${it.nombre} — $${(it.qty*it.price).toFixed(2)}`).join("<br>")}</div>
            <div class="total" style="margin-top:8px">Total: $${total.toFixed(2)}</div>
          </div>
          <button class="btn" id="confirm">Confirmar compra</button>
          <div id="msg" class="small"></div>
        </div>
      </div>
    `;
    $("#confirm", wrap).onclick = async ()=>{
      $("#confirm", wrap).disabled = true;
      $("#msg", wrap).textContent = "Procesando orden...";
      const payload = {
        items: items.map(it=> ({producto: it.id, qty: it.qty, price: it.price})),
        total,
        customer: { nombre: $("#name",wrap).value, email: $("#email",wrap).value, direccion: $("#addr",wrap).value }
      };
      try{
        const orden = await createOrder(payload);
        $("#msg", wrap).textContent = "Procesando pago...";
        await createPayment({orden: orden.id, metodo: $("#pay",wrap).value, total});
        window.carrito.clear(); window.updateCartCount();
        $("#msg", wrap).innerHTML = `<b>¡Orden confirmada!</b> #${orden.id}. Gracias por tu compra.`;
      }catch(e){
        $("#msg", wrap).textContent = "Error: " + e.message;
        $("#confirm", wrap).disabled = false;
      }
    };
  }

  window.pages = window.pages || {};
  window.pages.checkout = checkout;
})();
