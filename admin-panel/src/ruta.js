import { useEffect, useState } from "react";

// Direcciones del panel: cada pantalla tiene la suya, así al recargar se
// queda donde estaba, el botón «atrás» del celular funciona y se puede
// guardar o compartir el enlace a un cliente o a un evento.
//
//   /hoy · /clientes · /clientes/25 · /eventos · /produccion · /mensajes
//   /configuracion · /configuracion/pagos
//   /evento/12/invitados · /evento/12/contenido ...
//
// No usa librería: el panel solo necesita leer la ruta y cambiarla.

const oyentes = new Set();

export function ir(ruta, { reemplazar = false } = {}) {
  if (ruta === window.location.pathname) return;
  window.history[reemplazar ? "replaceState" : "pushState"]({}, "", ruta);
  oyentes.forEach((fn) => fn(ruta));
  if (!reemplazar) window.scrollTo({ top: 0 });
}

const tramos = (ruta) => ruta.split("/").filter(Boolean).map(decodeURIComponent);

export function useRuta() {
  const [ruta, setRuta] = useState(window.location.pathname);
  useEffect(() => {
    const cambiar = () => setRuta(window.location.pathname);
    oyentes.add(cambiar);
    window.addEventListener("popstate", cambiar);
    return () => {
      oyentes.delete(cambiar);
      window.removeEventListener("popstate", cambiar);
    };
  }, []);
  return tramos(ruta);
}
