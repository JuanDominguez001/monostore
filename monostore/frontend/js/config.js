// Config central + persistencia
(function () {
  const LS = (k, v) => v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v);
  const cfg = {
    BASE_URL: LS("MONO_BASE_URL") || "http://127.0.0.1:8000/api",
    ACCESS:   LS("MONO_ACCESS")   || "",
    REFRESH:  LS("MONO_REFRESH")  || "",
    DEMO:     (LS("MONO_DEMO")||"0") === "1"
  };
  window.CONFIG = cfg;
})();

