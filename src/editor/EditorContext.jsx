import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Modo editor: solo se activa con ?editor=1, que es como el panel de
// administración incrusta el sitio para colocar las decoraciones arrastrando.
//
// El sitio nunca escribe en la base: solo avisa al panel la posición nueva y
// es el panel, ya autenticado, quien la guarda. Por eso los mensajes que
// llegan de afuera solo pueden mover cosas en esta pestaña, no persistir nada.
export const FUENTE = "invitacion-editor";

const vacio = {
  activo: false,
  seleccionadaId: null,
  seleccionar: () => {},
  moverEnVivo: () => {},
  confirmarMovimiento: () => {},
};

const EditorContext = createContext(vacio);

export function editorActivo() {
  return new URLSearchParams(window.location.search).get("editor") === "1";
}

// Con ?portada=1 el editor muestra la portada en vez del cuerpo. El panel
// cambia este parámetro al elegir la zona "Portada", para poder decorar
// también esa pantalla, que normalmente se salta dentro del editor.
export function editandoPortada() {
  return new URLSearchParams(window.location.search).get("portada") === "1";
}

function avisarAlPanel(mensaje) {
  if (window.parent === window) return;
  // targetOrigin abierto a propósito: el panel puede estar en cualquier
  // dominio y aquí solo viajan coordenadas, nada sensible.
  window.parent.postMessage({ fuente: FUENTE, ...mensaje }, "*");
}

export function EditorProvider({ activo, ubicaciones, onCambioLocal, onRecargar, children }) {
  const [seleccionadaId, setSeleccionadaId] = useState(null);

  const seleccionar = useCallback((id) => {
    setSeleccionadaId(id);
    avisarAlPanel({ tipo: "seleccionar", id });
  }, []);

  const moverEnVivo = useCallback(
    (id, x, y) => onCambioLocal?.(id, { x, y }),
    [onCambioLocal]
  );

  const confirmarMovimiento = useCallback(
    (id) => {
      const u = ubicaciones.find((v) => v.id === id);
      if (u) avisarAlPanel({ tipo: "mover", id, x: u.x, y: u.y });
    },
    [ubicaciones]
  );

  // Órdenes que llegan del panel: ajustes de tamaño/rotación/opacidad,
  // selección desde la lista, o recargar tras crear/borrar algo.
  useEffect(() => {
    if (!activo) return;
    function alRecibir(e) {
      const d = e.data;
      if (!d || d.fuente !== FUENTE) return;
      if (d.tipo === "aplicar" && d.id) onCambioLocal?.(d.id, d.cambios || {});
      else if (d.tipo === "seleccionar") setSeleccionadaId(d.id ?? null);
      else if (d.tipo === "recargar") onRecargar?.();
    }
    window.addEventListener("message", alRecibir);
    return () => window.removeEventListener("message", alRecibir);
  }, [activo, onCambioLocal, onRecargar]);

  // Avisar al panel que el sitio ya cargó y puede empezar a mandar órdenes.
  useEffect(() => {
    if (activo) avisarAlPanel({ tipo: "listo" });
  }, [activo]);

  const valor = useMemo(
    () =>
      activo
        ? { activo: true, seleccionadaId, seleccionar, moverEnVivo, confirmarMovimiento }
        : vacio,
    [activo, seleccionadaId, seleccionar, moverEnVivo, confirmarMovimiento]
  );

  return <EditorContext.Provider value={valor}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  return useContext(EditorContext);
}
