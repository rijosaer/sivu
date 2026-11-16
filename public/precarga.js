// Pide los datos de la invitación mientras se descarga el programa del sitio.
// Sin esto, la petición salía recién cuando el JavaScript principal terminaba
// de bajar y ejecutarse: en un 4G regular eran ~0,6 s de pantalla vacía.
// Además pide de una vez la foto de portada, que es lo primero que se ve.
//
// Es un script clásico y pequeño (la CSP solo admite scripts del propio
// dominio, no en línea). src/api/site.js toma estas respuestas si la dirección
// coincide exactamente; si no coincide o algo falla aquí, el sitio las pide
// como siempre, así que esto nunca puede romper la carga.
(function () {
  try {
    var meta = document.querySelector('meta[name="sivu-api"]');
    var api = meta && meta.content;
    if (!api || api.indexOf("http") !== 0) return;
    var tramos = location.pathname.split("/").filter(Boolean);
    // Solo invitaciones (heysivu.com/<slug>). La raíz es la landing y las
    // rutas de dos tramos son plantillas, cotizaciones, etc.
    if (tramos.length !== 1) return;
    var q = new URLSearchParams(location.search);
    if (q.get("editor") || q.get("anuncio") || q.get("servidores")) return;
    var base = api + "/api/public/invitaciones/" + encodeURIComponent(decodeURIComponent(tramos[0]));
    var params = new URLSearchParams();
    var codigo = q.get("i") || "";
    var vista = q.get("vista") || "";
    if (codigo) params.set("i", codigo);
    if (vista) params.set("vista", vista);
    var qs = params.toString();
    var urlSitio = base + "/site" + (qs ? "?" + qs : "");
    var guardadas = (window.__sivuPrecarga = {});
    var sitio = fetch(urlSitio);
    sitio.catch(function () {});
    guardadas[urlSitio] = sitio;
    if (codigo) {
      var urlInvitado = base + "/invitado/" + encodeURIComponent(codigo);
      var invitado = fetch(urlInvitado);
      invitado.catch(function () {});
      guardadas[urlInvitado] = invitado;
    }
    // La foto de portada: se lee de una copia de la respuesta para no gastar
    // la original, que la usa el sitio.
    sitio
      .then(function (r) { return r.ok ? r.clone().json() : null; })
      .then(function (d) {
        var secciones = (d && d.secciones) || [];
        for (var i = 0; i < secciones.length; i++) {
          var foto = secciones[i].tipo === "welcome" && secciones[i].contenido && secciones[i].contenido.fotoPortada;
          if (foto) {
            var img = new Image();
            img.decoding = "async";
            img.src = foto.charAt(0) === "/" ? api + foto : foto;
            return;
          }
        }
      })
      .catch(function () {});
  } catch (e) {
    // Nada: el sitio pedirá los datos por su cuenta.
  }
})();
