(function () {
  async function tryToken({ username, password }) {
    return window.http.post("/token/", { body: { username, password } });
  }

  // Crea usuario si no existe, usando email como base del username
  async function ensureUserByEmail(email, password) {
    const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20) || "user";
    const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const username = `${base}_${suffix}`;
    await window.http.post("/registro/", { body: { username, email, password } });
    return username;
  }

  async function login(userOrEmail, password) {
    if (!userOrEmail || !password) throw new Error("Faltan credenciales.");
    // 1) Intento directo (sirve si escribes el username de Django)
    try {
      const tk = await tryToken({ username: userOrEmail, password });
      window.http.setTokens({ access: tk.access, refresh: tk.refresh });
      return true;
    } catch (_) { /* sigue */ }

    // 2) Si parece email: auto-registro y login inmediato
    if (userOrEmail.includes("@")) {
      try {
        const username = await ensureUserByEmail(userOrEmail, password);
        const tk = await tryToken({ username, password });
        window.http.setTokens({ access: tk.access, refresh: tk.refresh });
        // guardamos email para UI
        localStorage.setItem("MONO_USER_EMAIL", userOrEmail);
        return true;
      } catch (e) {
        throw new Error("No se pudo crear/iniciar sesión con ese email. Prueba con tu username real. Detalle: " + e.message);
      }
    }

    // 3) Si no es email y falló
    throw new Error("Usuario/contraseña inválidos. (Tip: usa tu *username* de Django o escribe tu email para crear cuenta).");
  }

  function logout() {
    window.http.setTokens({ access: "", refresh: "" });
    localStorage.removeItem("MONO_USER_EMAIL");
  }

  async function refresh() {
    const r = window.CONFIG.REFRESH;
    if (!r) return false;
    const res = await window.http.post("/token/refresh/", { body: { refresh: r } });
    window.http.setTokens({ access: res.access });
    return true;
    }

  window.auth = { login, logout, refresh };
})();
