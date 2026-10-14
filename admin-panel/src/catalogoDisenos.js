import { useEffect, useState } from "react";
import { api } from "./api";
import { DISENOS } from "./tiposEvento";

// Diseños para elegir al crear un evento o en sus Ajustes: los del catálogo
// (panel → Diseños), con sus nombres y variantes. Si no carga, la lista fija.
let cache = null;

export function useCatalogoDisenos() {
  const [lista, setLista] = useState(cache || DISENOS.map((d) => ({ key: d.key, nombre: d.nombre })));
  useEffect(() => {
    if (cache) return;
    api.crm
      .disenos()
      .then((ds) => {
        cache = ds.map((d) => ({ key: d.id, nombre: d.variante ? `${d.nombre} (variante)` : `${d.nombre} (${d.descripcion})` }));
        setLista(cache);
      })
      .catch(() => {});
  }, []);
  return lista;
}

export const olvidarCatalogo = () => {
  cache = null;
};
