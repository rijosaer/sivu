import { useEffect, useState } from "react";
import { api, urlMedia } from "../api";
import { archivoADataUrl, pesoLegible } from "../archivos";

const MAX_MB = 8;

// Música de fondo: se sube el archivo directamente, sin tener que buscar un
// enlace externo. Solo hay una canción; subir otra reemplaza la anterior.
export default function GestorAudio() {
  const [audio, setAudio] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    const lista = await api.medios("audio");
    setAudio(lista[0] || null);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function subir(archivo) {
    if (!archivo) return;
    setError("");
    if (!archivo.type.startsWith("audio/")) {
      return setError("Ese archivo no es de audio. Sirve MP3, M4A, OGG o WAV.");
    }
    if (archivo.size > MAX_MB * 1024 * 1024) {
      return setError(
        `El archivo pesa ${pesoLegible(archivo.size)} y el máximo son ${MAX_MB} MB. ` +
          "Un MP3 de buena calidad de 3 o 4 minutos suele pesar menos de 5 MB."
      );
    }
    setSubiendo(true);
    try {
      await api.subirMedio("audio", archivo.name, await archivoADataUrl(archivo));
      await cargar();
    } catch (e) {
      setError(e.message || "No se pudo subir el audio");
    }
    setSubiendo(false);
  }

  async function quitar() {
    if (!confirm("¿Quitar la música de fondo?")) return;
    await api.borrarMedio(audio.id);
    setAudio(null);
  }

  return (
    <div className="border border-marca/30 rounded-lg p-4 mb-5 bg-marca-suave/60">
      <p className="text-sm font-medium mb-1">Música de fondo</p>
      <p className="ayuda mb-3">
        Sube el instrumental desde tu computador. Máximo {MAX_MB} MB. Los invitados lo activan
        con el botón ♪ que aparece abajo a la derecha de la invitación.
      </p>

      {cargando ? (
        <p className="ayuda">Cargando...</p>
      ) : audio ? (
        <div className="mb-3">
          <audio controls src={urlMedia(audio.url)} className="w-full max-w-sm" />
          <p className="ayuda mt-1">
            {audio.nombre || "audio"} · {pesoLegible(Number(audio.bytes))}
            <button onClick={quitar} className="ml-3 text-red-700 underline">
              Quitar
            </button>
          </p>
        </div>
      ) : (
        <p className="ayuda mb-3">No hay música subida.</p>
      )}

      <label className="boton-primario cursor-pointer">
        {subiendo ? "Subiendo..." : audio ? "Reemplazar audio" : "Subir audio"}
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            subir(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
    </div>
  );
}
