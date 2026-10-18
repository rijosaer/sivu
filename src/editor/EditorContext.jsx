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

// Paneles que pueden incrustar el sitio en modo editor. Se pueden sumar más
// (p. ej. un panel de pruebas) con VITE_PANEL_ORIGINS, separados por coma.
const ORIGENES_PANEL = [
  "https://panel.heysivu.com",
  ...(import.meta.env.DEV ? ["http://localhost:5174"] : []),
  ...String(import.meta.env.VITE_PANEL_ORIGINS || "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean),
];

// Origen de la página que incrusta este iframe, si es un panel conocido.
function origenDelPanel() {
  if (window.parent === window) return null;
  let origen = window.location.ancestorOrigins?.[0] || "";
  if (!origen && document.referrer) {
    try {
      origen = new URL(document.referrer).origin;
    } catch {
      origen = "";
    }
  }
  return ORIGENES_PANEL.includes(origen) ? origen : null;
}

// Solo se aceptan órdenes de la ventana que incrusta el sitio y solo si es el
// panel: una página cualquiera que incruste la invitación no puede mover nada.
export function mensajeDelPanel(e) {
  return e.source === window.parent && window.parent !== window && ORIGENES_PANEL.includes(e.origin);
}

function avisarAlPanel(mensaje) {
  const origen = origenDelPanel();
  if (!origen) return;
  window.parent.postMessage({ fuente: FUENTE, ...mensaje }, origen);
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
      if (!mensajeDelPanel(e)) return;
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
