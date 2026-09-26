import { useCallback, useEffect, useState } from "react";
import { api, urlMedia } from "../api";
import { comprimirImagen } from "../archivos";

// Imagen de fondo de toda la invitación. Solo puede haber una: al subir otra,
// el servidor reemplaza la anterior.
export default function GestorFondo({ onCambio }) {
  const [fondo, setFondo] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    const medios = await api.medios("fondo");
    setFondo(medios[0] || null);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function subir(archivo) {
    if (!archivo) return;
    setOcupado(true);
    setError("");
    try {
      // Más resolución que una foto de la galería: se estira a pantalla
      // completa y un fondo pixelado se nota mucho más que una foto chica.
      const datos = await comprimirImagen(archivo, 2000, 0.85);
      await api.subirMedio("fondo", archivo.name, datos);
      await cargar();
      onCambio?.();
    } catch (e) {
      setError(e.message);
    }
    setOcupado(false);
  }

  async function quitar() {
    if (!confirm("¿Quitar la imagen de fondo? Vuelve el papel crema de siempre.")) return;
    await api.borrarMedio(fondo.id);
    await cargar();
    onCambio?.();
  }

  return (
    <div className="tarjeta p-4">
      <p className="text-sm font-medium mb-1">Fondo de la invitación</p>
      <p className="ayuda mb-3">
        Se ve detrás de todo, incluida la portada, y no se mueve al hacer scroll. Lo mejor es una
        imagen vertical de celular. Si no subes ninguna, se usa el papel crema.
      </p>

      <div className="h-40 border border-dashed border-borde flex items-center justify-center mb-3 bg-paper overflow-hidden">
        {fondo ? (
          <img src={urlMedia(fondo.url)} alt="Fondo actual" className="max-h-full object-contain" />
        ) : (
          <span className="ayuda">Papel crema (el de fábrica)</span>
        )}
      </div>

      {error && <p className="text-xs text-red-700 mb-2">{error}</p>}

      <div className="flex gap-3 items-center flex-wrap">
        <label className="boton-primario cursor-pointer">
          {ocupado ? "Subiendo..." : fondo ? "Cambiar fondo" : "Subir fondo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              subir(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </label>
        {fondo && (
          <button onClick={quitar} className="text-xs text-red-700 underline">
            Quitar
          </button>
        )}
      </div>
    </div>
  );
}
