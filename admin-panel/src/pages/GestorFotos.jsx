import { useEffect, useState } from "react";
import { api, urlMedia } from "../api";
import { comprimirImagen, pesoLegible } from "../archivos";

// Fotos de los novios: se suben desde el computador o el celular, se
// reducen aquí antes de enviarlas, y aparecen en la galería del sitio
// antes que las fotos puestas por enlace externo.
export default function GestorFotos() {
  const [fotos, setFotos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(0);
  const [error, setError] = useState("");

  async function cargar() {
    setFotos(await api.medios("foto"));
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function subir(archivos) {
    const lista = [...archivos].filter((f) => f.type.startsWith("image/"));
    if (!lista.length) return;
    setError("");
    setSubiendo(lista.length);
    try {
      for (const archivo of lista) {
        const dataUrl = await comprimirImagen(archivo);
        await api.subirMedio("foto", archivo.name, dataUrl);
        setSubiendo((n) => n - 1);
      }
      await cargar();
    } catch (e) {
      setError(e.message || "No se pudo subir la foto");
    }
    setSubiendo(0);
  }

  async function borrar(id) {
    if (!confirm("¿Eliminar esta foto?")) return;
    await api.borrarMedio(id);
    cargar();
  }

  async function mover(i, delta) {
    const copia = [...fotos];
    const [x] = copia.splice(i, 1);
    copia.splice(i + delta, 0, x);
    setFotos(copia);
    await api.reordenarMedios(copia.map((f, j) => ({ id: f.id, orden: j + 1 })));
  }

  return (
    <div className="border border-borde rounded-xl p-4 mb-5 bg-lienzo">
      <p className="bloque-titulo mb-1">Fotos de los novios</p>
      <p className="ayuda mb-3">
        Súbelas desde tu celular o tu computador; puedes seleccionar varias a la vez. Se reducen
        solas para que la invitación cargue rápido con datos móviles.
      </p>

      {cargando ? (
        <p className="ayuda">Cargando fotos...</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
          {fotos.map((f, i) => (
            <div key={f.id} className="relative group border border-borde rounded-lg overflow-hidden">
              <img
                src={urlMedia(f.url)}
                alt={f.nombre || `Foto ${i + 1}`}
                className="w-full h-24 object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => mover(i, -1)}
                  disabled={i === 0}
                  className="text-paper text-xs px-2 py-1 disabled:opacity-30"
                  aria-label="Mover antes"
                >
                  ←
                </button>
                <button
                  onClick={() => borrar(f.id)}
                  className="text-paper text-xs px-2 py-1"
                  aria-label="Eliminar foto"
                >
                  ✕
                </button>
                <button
                  onClick={() => mover(i, 1)}
                  disabled={i === fotos.length - 1}
                  className="text-paper text-xs px-2 py-1 disabled:opacity-30"
                  aria-label="Mover después"
                >
                  →
                </button>
              </div>
              <span className="absolute top-0 left-0 bg-ink/60 text-paper text-[10px] px-1">
                {i + 1}
              </span>
            </div>
          ))}
          {!fotos.length && (
            <p className="col-span-full ayuda py-3">
              Todavía no has subido fotos. Las que se ven ahora en la invitación vienen de enlaces
              externos, en «Opciones avanzadas».
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <label className="boton-primario cursor-pointer">
          {subiendo ? `Subiendo (${subiendo})...` : "Subir fotos desde mi dispositivo"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              subir(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {fotos.length > 0 && (
          <span className="ayuda">
            {fotos.length} foto{fotos.length === 1 ? "" : "s"} ·{" "}
            {pesoLegible(fotos.reduce((t, f) => t + Number(f.bytes || 0), 0))}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
    </div>
  );
}
