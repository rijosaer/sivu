import { useEffect, useState } from "react";
import { api, urlMedia } from "../api";
import { comprimirImagen } from "../archivos";

// La foto de la portada (la que abre la invitación, junto al sello). Antes era
// un campo de texto con «/api/public/medio/17»: para cambiarla había que
// adivinar el número, y un número equivocado (el de la música, por ejemplo)
// dejaba la portada rota. Ahora se elige tocando una de las fotos subidas o se
// sube una nueva aquí mismo.
const RUTA = /^\/api\/public\/medio\/(\d+)/;

export default function CampoFotoPortada({ valor, onChange }) {
  const [fotos, setFotos] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setFotos(await api.medios("foto"));
    } catch {
      setFotos([]);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const idActual = Number(String(valor || "").match(RUTA)?.[1]) || null;
  const externa = valor && !idActual ? valor : "";
  // Apunta a algo que no es una de las fotos de este evento (se borró, o es
  // otro tipo de archivo): la portada se está viendo rota.
  const rota = fotos && idActual && !fotos.some((f) => f.id === idActual);

  async function subir(archivo) {
    if (!archivo) return;
    setError("");
    if (!archivo.type.startsWith("image/")) return setError("Ese archivo no es una foto.");
    setSubiendo(true);
    try {
      const nueva = await api.subirMedio("foto", archivo.name, await comprimirImagen(archivo));
      await cargar();
      if (nueva?.id) onChange(`/api/public/medio/${nueva.id}`);
    } catch (e) {
      setError(e.message || "No se pudo subir la foto");
    }
    setSubiendo(false);
  }

  return (
    <div className="space-y-2">
      <p className="ayuda">
        Toca la foto que quieres en la portada (la pantalla del sello). Después pulsa «Publicar cambios».
      </p>
      {rota && (
        <p className="text-xs text-red-700">
          La portada actual apunta a un archivo que no es una de tus fotos, así que se ve vacía. Elige una foto.
        </p>
      )}
      {externa && <p className="ayuda break-all">Ahora usa una foto por enlace: {externa}</p>}

      {fotos === null ? (
        <p className="ayuda">Cargando fotos...</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {fotos.map((f) => {
            const elegida = f.id === idActual;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange(`/api/public/medio/${f.id}`)}
                aria-pressed={elegida}
                title={f.nombre || "Foto"}
                className={`relative w-20 h-28 rounded-lg overflow-hidden border-2 transition-colors ${
                  elegida ? "border-marca ring-2 ring-marca/30" : "border-transparent hover:border-borde-fuerte"
                }`}
              >
                <img src={urlMedia(f.url)} alt="" className="w-full h-full object-cover" loading="lazy" />
                {elegida && (
                  <span className="absolute bottom-1 left-1 right-1 text-[10px] font-medium bg-marca text-white rounded px-1 py-0.5">
                    En portada
                  </span>
                )}
              </button>
            );
          })}
          <label className="w-20 h-28 rounded-lg border-2 border-dashed border-borde-fuerte flex items-center justify-center text-center text-[11px] text-ink-suave cursor-pointer hover:text-ink px-1">
            {subiendo ? "Subiendo..." : "+ Subir foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={subiendo}
              onChange={(e) => {
                subir(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}

      {valor && (
        <button type="button" onClick={() => onChange("")} className="boton-texto text-xs">
          Quitar la foto (usar el dibujo del diseño)
        </button>
      )}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
