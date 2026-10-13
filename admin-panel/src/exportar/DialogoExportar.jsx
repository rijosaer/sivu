import { useEffect, useMemo, useState } from "react";
import {
  FORMATOS,
  OPCIONES_INICIALES,
  construirDocumento,
  imprimirDocumento,
} from "./documento";

// Elegir cómo se ve el PDF y verlo mientras se elige. La previa es el mismo
// HTML que se manda a imprimir, metido en un iframe: no es una aproximación,
// es el documento.
//
// Las preferencias se recuerdan en el navegador porque esto se usa varias
// veces seguidas (una lista para el catering, otra para la recepción) y volver
// a marcar las mismas casillas cada vez es lo que hace que una herramienta
// canse.
const GUARDADO = "exportar-pdf-opciones";

function leerGuardadas() {
  try {
    const x = JSON.parse(localStorage.getItem(GUARDADO) || "{}");
    return { ...OPCIONES_INICIALES, ...x };
  } catch {
    return { ...OPCIONES_INICIALES };
  }
}

function Casilla({ marcada, onCambio, children, deshabilitada }) {
  return (
    <label
      className={`flex items-center gap-2 text-xs py-1 ${
        deshabilitada ? "opacity-40" : "cursor-pointer text-ink-suave hover:text-ink"
      }`}
    >
      <input
        type="checkbox"
        checked={marcada}
        disabled={deshabilitada}
        onChange={(e) => onCambio(e.target.checked)}
      />
      {children}
    </label>
  );
}

export default function DialogoExportar({ datos, onCerrar }) {
  const [opciones, setOpciones] = useState(leerGuardadas);
  const [zoom, setZoom] = useState(0.55);

  useEffect(() => {
    localStorage.setItem(GUARDADO, JSON.stringify(opciones));
  }, [opciones]);

  // Cerrar con Esc, como cualquier diálogo.
  useEffect(() => {
    const alTeclear = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  const html = useMemo(
    () => construirDocumento({ ...datos, opciones }),
    [datos, opciones]
  );

  const cambiar = (campo, valor) => setOpciones((prev) => ({ ...prev, [campo]: valor }));
  const esResumen = opciones.formato === "resumen";
  const formatoActual = FORMATOS.find((f) => f.key === opciones.formato);

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-stretch sm:items-center justify-center p-0 sm:p-6"
      onClick={onCerrar}
    >
      <div
        className="bg-white w-full max-w-5xl rounded-none sm:rounded-xl shadow-flotante flex flex-col max-h-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Exportar a PDF"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-borde">
          <div>
            <h3 className="bloque-titulo">Exportar a PDF</h3>
            <p className="ayuda">Se ve así al imprimir. Elige «Guardar como PDF» en el diálogo.</p>
          </div>
          <button onClick={onCerrar} className="boton-secundario" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="flex-1 min-h-0 grid md:grid-cols-[16rem_minmax(0,1fr)]">
          {/* ---------- Controles ---------- */}
          <div className="border-b md:border-b-0 md:border-r border-borde p-4 overflow-y-auto">
            <span className="etiqueta">Formato</span>
            <div className="space-y-1.5 mb-4">
              {FORMATOS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => cambiar("formato", f.key)}
                  aria-pressed={opciones.formato === f.key}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    opciones.formato === f.key
                      ? "border-ink bg-ink text-white"
                      : "border-borde-fuerte hover:border-[#D6C3A7]"
                  }`}
                >
                  <span className="block text-xs font-medium">{f.label}</span>
                </button>
              ))}
            </div>
            <p className="ayuda mb-4">{formatoActual?.para}</p>

            <span className="etiqueta">Qué incluir</span>
            <div className="mb-4">
              <Casilla marcada={opciones.portada} onCambio={(v) => cambiar("portada", v)}>
                Portada con sus nombres
              </Casilla>
              <Casilla
                marcada={opciones.codigo}
                onCambio={(v) => cambiar("codigo", v)}
                deshabilitada={esResumen}
              >
                Código de cada invitación
              </Casilla>
              <Casilla
                marcada={opciones.restriccion}
                onCambio={(v) => cambiar("restriccion", v)}
                deshabilitada={esResumen || !datos.preguntas?.restriccion}
              >
                Restricción alimentaria
              </Casilla>
              <Casilla
                marcada={opciones.observaciones}
                onCambio={(v) => cambiar("observaciones", v)}
                deshabilitada={esResumen || opciones.formato === "tarjetas" || !datos.preguntas?.observaciones}
              >
                Observaciones
              </Casilla>
              <Casilla marcada={opciones.color} onCambio={(v) => cambiar("color", v)}>
                Color (con los tonos de tu invitación)
              </Casilla>
            </div>

            <label className="block mb-4">
              <span className="etiqueta">Nota para quien lo reciba</span>
              <textarea
                value={opciones.notas}
                onChange={(e) => cambiar("notas", e.target.value)}
                rows={2}
                placeholder="Ej. Confirmado hasta el 14 de agosto."
                className="campo resize-y"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="etiqueta">Tamaño</span>
                <select
                  value={opciones.tamano}
                  onChange={(e) => cambiar("tamano", e.target.value)}
                  className="campo"
                >
                  <option value="letter">Carta</option>
                  <option value="a4">A4</option>
                </select>
              </label>
              <label>
                <span className="etiqueta">Hoja</span>
                <select
                  value={opciones.orientacion}
                  onChange={(e) => cambiar("orientacion", e.target.value)}
                  className="campo"
                >
                  <option value="portrait">Vertical</option>
                  <option value="landscape">Horizontal</option>
                </select>
              </label>
            </div>
          </div>

          {/* ---------- Vista previa ---------- */}
          <div className="min-h-0 flex flex-col bg-[#eceae6]">
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-borde bg-white">
              <span className="ayuda">Vista previa</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom((z) => Math.max(0.3, Math.round((z - 0.1) * 10) / 10))}
                  className="boton-secundario w-8 px-0"
                  aria-label="Alejar"
                >
                  −
                </button>
                <span className="text-[11px] text-ink-tenue w-10 text-center tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(1, Math.round((z + 0.1) * 10) / 10))}
                  className="boton-secundario w-8 px-0"
                  aria-label="Acercar"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-3">
              {/* El iframe se dibuja a tamaño real y se encoge con transform:
                  así el texto se ve con las proporciones exactas del papel. */}
              <div
                style={{
                  width: `${100 / zoom}%`,
                  height: `${100 / zoom}%`,
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                }}
              >
                <iframe
                  title="Vista previa del PDF"
                  srcDoc={html}
                  className="w-full h-full border-0 bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-borde">
          <button onClick={onCerrar} className="boton-secundario">
            Cancelar
          </button>
          <button
            onClick={() => {
              if (!imprimirDocumento(html)) {
                alert("El navegador bloqueó la ventana. Permite las ventanas emergentes y reintenta.");
              }
            }}
            className="boton-primario"
          >
            Imprimir o guardar como PDF
          </button>
        </div>
      </div>
    </div>
  );
}
