import { useState } from "react";
import { api } from "../api.js";

const ETIQUETAS = {
  en_cola: "En cola",
  procesando: "Generando",
  completada: "Lista",
  fallida: "Falló",
  cancelada: "Cancelada",
};

export default function TarjetaGeneracion({ g, nombrePreset, alCambiar, alBorrar }) {
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");

  const accion = async (fn) => {
    setOcupado(true);
    setAviso("");
    try {
      await fn();
    } catch (e) {
      setAviso(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const cancelar = () =>
    accion(async () => {
      await api(`/v1/generaciones/${g.id}/cancelar`, { metodo: "POST" });
      alCambiar?.();
    });
  const borrar = () =>
    accion(async () => {
      if (!window.confirm("¿Borrar este video? No se puede deshacer.")) return;
      await api(`/v1/generaciones/${g.id}`, { metodo: "DELETE" });
      alBorrar?.(g.id);
    });

  const [w, h] = (g.parametros?.aspecto || "16:9").split(":");
  const enCurso = g.estado === "en_cola" || g.estado === "procesando";

  return (
    <article className="overflow-hidden rounded-2xl border border-borde bg-panel">
      <div className="relative bg-black" style={{ aspectRatio: `${w} / ${h}` }}>
        {g.estado === "completada" ? (
          <video src={g.video_url} poster={g.imagen_url || undefined} className="h-full w-full object-contain" autoPlay loop muted playsInline controls />
        ) : (
          <>
            {g.imagen_url && <img src={g.imagen_url} alt="" className="h-full w-full object-cover opacity-30" />}
            <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm">
              {enCurso ? (
                <div className="w-2/3">
                  <p className="mb-2 text-white">{g.estado === "en_cola" ? "Esperando turno…" : "Generando video…"}</p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-borde">
                    <div
                      className={`h-full rounded-full bg-acento transition-all ${g.progreso == null ? "w-1/3 animate-pulse" : ""}`}
                      style={g.progreso != null ? { width: `${Math.max(4, g.progreso * 100)}%` } : undefined}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-red-300">{g.error || ETIQUETAS[g.estado]}</p>
              )}
            </div>
          </>
        )}
      </div>
      <div className="space-y-2 p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{nombrePreset || g.preset}</span>
          <span
            className={`rounded-md px-2 py-0.5 text-xs ${
              g.estado === "completada"
                ? "bg-acento/15 text-acento"
                : enCurso
                  ? "bg-borde text-white"
                  : "bg-red-500/15 text-red-300"
            }`}
          >
            {ETIQUETAS[g.estado]}
          </span>
        </div>
        {g.prompt && <p className="line-clamp-2 text-tenue">{g.prompt}</p>}
        <p className="text-xs text-tenue">
          {g.parametros?.escenas && `${g.parametros.escenas.length} escenas · `}
          {g.parametros?.duracion}s · {g.parametros?.resolucion} · {g.parametros?.aspecto} · {g.costo} cr
        </p>
        {aviso && <p className="text-xs text-red-300">{aviso}</p>}
        <div className="flex gap-2 pt-1">
          {g.estado === "completada" && (
            <a href={g.video_url} download className="boton-suave flex-1 py-1.5 text-xs">
              Descargar
            </a>
          )}
          {g.estado === "en_cola" && (
            <button onClick={cancelar} disabled={ocupado} className="boton-suave flex-1 py-1.5 text-xs">
              Cancelar
            </button>
          )}
          {!enCurso && alBorrar && (
            <button onClick={borrar} disabled={ocupado} className="boton-suave py-1.5 text-xs text-tenue">
              Borrar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
