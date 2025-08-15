// Pequeño cliente HTTP con refresh automático de JWT
(function () {
  class Http {
    constructor() { this.base = window.CONFIG.BASE_URL; this.retrying = false; }
    setBase(url) { this.base = url.replace(/\/$/, ""); localStorage.setItem("MONO_BASE_URL", this.base); window.CONFIG.BASE_URL = this.base; }
    setTokens({ access, refresh }) {
      if (access) { localStorage.setItem("MONO_ACCESS", access); window.CONFIG.ACCESS = access; }
      if (refresh !== undefined) { localStorage.setItem("MONO_REFRESH", refresh || ""); window.CONFIG.REFRESH = refresh || ""; }
    }
    async req(path, { method = "GET", query, body, headers = {}, timeout = 15000, raw = false } = {}) {
      const url = new URL(this.base + path);
      if (query) Object.entries(query).forEach(([k, v]) => v!=null && url.searchParams.append(k, v));
      const h = { "Accept": "application/json", ...headers };
      if (!(body instanceof FormData) && method !== "GET" && body !== undefined) h["Content-Type"] = "application/json";
      if (window.CONFIG.ACCESS) h["Authorization"] = "Bearer " + window.CONFIG.ACCESS;

      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort("timeout"), timeout);

      let res;
      try {
        res = await fetch(url.toString(), { method, headers: h, body: (body instanceof FormData) ? body : (body!==undefined?JSON.stringify(body):undefined), signal: ctrl.signal });
      } finally { clearTimeout(t); }

      // auto-refresh en 401 (una vez)
      if (res.status === 401 && !this.retrying && window.CONFIG.REFRESH) {
        this.retrying = true;
        try {
          const r2 = await fetch(this.base + "/token/refresh/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: window.CONFIG.REFRESH })
          });
          if (r2.ok) {
            const j = await r2.json();
            this.setTokens({ access: j.access });
            return this.req(path, { method, query, body, headers, timeout, raw });
          }
        } finally { this.retrying = false; }
      }

      if (!res.ok) {
        let err = await res.text();
        try { err = JSON.parse(err); } catch {}
        throw new Error(`HTTP ${res.status}: ${typeof err === "string" ? err : JSON.stringify(err)}`);
      }
      return raw ? res : (res.headers.get("Content-Type")?.includes("application/json") ? res.json() : res.text());
    }
    get(path, opt) { return this.req(path, { ...opt, method: "GET" }); }
    post(path, opt) { return this.req(path, { ...opt, method: "POST" }); }
    put(path, opt) { return this.req(path, { ...opt, method: "PUT" }); }
    patch(path, opt) { return this.req(path, { ...opt, method: "PATCH" }); }
    del(path, opt) { return this.req(path, { ...opt, method: "DELETE" }); }
    async download(path, { query, filename = "download" } = {}) {
      const res = await this.req(path, { method: "GET", query, raw: true });
      const blob = await res.blob(); const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href);
    }
  }
  window.http = new Http();
})();
