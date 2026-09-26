import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Lleva la cuenta de qué secciones tienen cambios escritos pero todavía sin
// publicar. Antes no había ninguna señal: se editaba un texto, se cambiaba de
// pestaña y no había forma de saber si eso había quedado guardado o no.
const Contexto = createContext({
  hayPendientes: false,
  seccionesPendientes: [],
  marcar: () => {},
});

export function PendientesProvider({ children }) {
  const [pendientes, setPendientes] = useState({});

  // marcar("Fotos de los novios", true) al editar, false al publicar.
  const marcar = useCallback((nombre, sinPublicar) => {
    setPendientes((prev) => {
      if (Boolean(prev[nombre]) === Boolean(sinPublicar)) return prev;
      const copia = { ...prev };
      if (sinPublicar) copia[nombre] = true;
      else delete copia[nombre];
      return copia;
    });
  }, []);

  const seccionesPendientes = useMemo(() => Object.keys(pendientes), [pendientes]);
  const hayPendientes = seccionesPendientes.length > 0;

  // Si se cierra la pestaña con algo a medias, el navegador pregunta antes.
  // El texto lo pone el navegador; no se puede personalizar.
  useEffect(() => {
    if (!hayPendientes) return;
    function alSalir(e) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", alSalir);
    return () => window.removeEventListener("beforeunload", alSalir);
  }, [hayPendientes]);

  const valor = useMemo(
    () => ({ hayPendientes, seccionesPendientes, marcar }),
    [hayPendientes, seccionesPendientes, marcar]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePendientes() {
  return useContext(Contexto);
}
