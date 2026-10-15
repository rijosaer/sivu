import { useEffect, useState } from "react";
import { api, urlBase } from "../api.js";

function Codigo({ children }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // sin permiso de portapapeles: el texto sigue seleccionable
    }
  };
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl border border-borde bg-black p-4 text-xs leading-relaxed text-gray-200">
        <code>{children}</code>
      </pre>
      <button onClick={copiar} className="absolute right-2 top-2 rounded-md bg-panel px-2 py-1 text-xs text-tenue hover:text-white">
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

function Llaves() {
  const [llaves, setLlaves] = useState([]);
  const [nombre, setNombre] = useState("");
  const [nueva, setNueva] = useState(null);
  const [error, setError] = useState("");

  const cargar = () =>
    api("/api/llaves")
      .then((d) => setLlaves(d.llaves))
      .catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
  }, []);

  const crear = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setNueva(await api("/api/llaves", { metodo: "POST", cuerpo: { nombre } }));
      setNombre("");
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };
  const revocar = async (id) => {
    if (!window.confirm("¿Revocar esta llave? Las apps que la usen dejarán de funcionar.")) return;
    try {
      await api(`/api/llaves/${id}`, { metodo: "DELETE" });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="rounded-2xl border border-borde bg-panel p-5">
      <h2 className="text-lg font-semibold">Tus llaves</h2>
      <form onSubmit={crear} className="mt-4 flex gap-2">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre (p. ej. mi-app)" className="campo" />
        <button className="boton-acento whitespace-nowrap">Crear llave</button>
      </form>
      {nueva && (
        <div className="mt-4 rounded-xl border border-acento/50 bg-acento/5 p-3 text-sm">
          <p className="mb-2 font-medium text-acento">Copia tu llave ahora: no se volverá a mostrar.</p>
          <Codigo>{nueva.llave}</Codigo>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <ul className="mt-4 divide-y divide-borde text-sm">
        {llaves.map((l) => (
          <li key={l.id} className="flex items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{l.nombre}</p>
              <p className="text-xs text-tenue">
                {l.prefijo}… · {l.ultimo_uso ? `usada ${new Date(l.ultimo_uso).toLocaleString()}` : "sin usar"}
              </p>
            </div>
            <button onClick={() => revocar(l.id)} className="text-xs text-tenue hover:text-red-300">
              Revocar
            </button>
          </li>
        ))}
        {!llaves.length && <li className="py-2 text-tenue">Aún no tienes llaves.</li>}
      </ul>
    </section>
  );
}

const RUTAS = [
  ["GET", "/v1/presets", "Catálogo de presets y opciones (no requiere llave)"],
  ["GET", "/v1/cuenta", "Tu correo y créditos"],
  ["POST", "/v1/generaciones", "Crear un video (responde 202 y queda en cola)"],
  ["GET", "/v1/generaciones", "Listar (?limite=20&antes=<fecha ISO>)"],
  ["GET", "/v1/generaciones/:id", "Estado y URL del video"],
  ["POST", "/v1/generaciones/:id/cancelar", "Cancelar si sigue en cola (devuelve créditos)"],
  ["DELETE", "/v1/generaciones/:id", "Borrar una generación terminada"],
];

const CAMPOS = [
  ["preset", "id del preset (por defecto animar)"],
  ["prompt", "texto; obligatorio si no hay imagen"],
  ["imagen", "data URI base64 PNG/JPEG/WebP, máx. 10 MB; sin ella es texto a video"],
  ["aspecto", "16:9 · 9:16 · 1:1"],
  ["resolucion", "480p · 720p (cuesta el doble)"],
  ["semilla", "entero, para repetir un resultado"],
  ["negativo", "lo que no quieres ver"],
  ["pasos, guia", "avanzado: pasos de muestreo y cfg"],
  ["webhook_url", "URL que recibe un POST al terminar"],
];

export default function ApiDocs({ catalogo }) {
  const base = urlBase();
  const ids = catalogo.presets.map((p) => p.id).join(", ");
  const dur = catalogo.opciones?.duracion;
  const campos = [...CAMPOS];
  campos.splice(5, 0, ["duracion", dur ? `segundos, ${dur.min} a ${dur.max}` : "segundos"]);

  return (
    <div className="grid gap-8 py-8 lg:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-8">
        <header>
          <h1 className="text-2xl font-bold">API</h1>
          <p className="mt-2 text-tenue">
            Todo lo que hace la web está disponible por HTTP. Autentícate con{" "}
            <code className="text-white">Authorization: Bearer ws_…</code>. Las generaciones son asíncronas: creas el
            trabajo, y luego consultas su estado o recibes un webhook.
          </p>
        </header>

        <section>
          <h2 className="mb-3 text-lg font-semibold">1. Crear un video</h2>
          <Codigo>{`curl -X POST ${base}/v1/generaciones \\
  -H "Authorization: Bearer $WAN_STUDIO_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "preset": "crash-zoom",
    "prompt": "a skater jumps over a car",
    "imagen": "data:image/jpeg;base64,'"$(base64 -w0 foto.jpg)"'",
    "aspecto": "9:16",
    "resolucion": "480p",
    "duracion": 5
  }'`}</Codigo>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">2. Consultar hasta que esté lista</h2>
          <Codigo>{`curl ${base}/v1/generaciones/<id> -H "Authorization: Bearer $WAN_STUDIO_KEY"

# estado: en_cola → procesando → completada | fallida | cancelada
# Cuando está "completada", video_url apunta al MP4.`}</Codigo>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Desde JavaScript</h2>
          <Codigo>{`const r = await fetch("${base}/v1/generaciones", {
  method: "POST",
  headers: { Authorization: \`Bearer \${KEY}\`, "Content-Type": "application/json" },
  body: JSON.stringify({ preset: "orbita", prompt: "neon city", webhook_url: "https://tu-app.com/hook" }),
});
const { id } = await r.json();
// Tu webhook recibe { evento: "generacion.completada", generacion: { id, video_url, ... } }`}</Codigo>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Rutas</h2>
          <div className="overflow-x-auto rounded-xl border border-borde">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-borde">
                {RUTAS.map(([m, r, d]) => (
                  <tr key={m + r}>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-acento">{m}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{r}</td>
                    <td className="px-3 py-2 text-tenue">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Campos de POST /v1/generaciones</h2>
          <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[140px_1fr]">
            {campos.map(([c, d]) => (
              <div key={c} className="contents">
                <dt className="font-mono text-xs text-white">{c}</dt>
                <dd className="text-tenue">{d}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-tenue">
            Presets: <span className="text-white">{ids}</span>
          </p>
          <p className="mt-2 text-sm text-tenue">Costo: {catalogo.costo}. Si una generación falla, los créditos se devuelven.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Errores</h2>
          <p className="text-sm text-tenue">
            Siempre JSON con <code className="text-white">{`{ "error": "..." }`}</code>: 400 datos inválidos, 401 llave
            inválida, 402 créditos insuficientes, 404 no existe, 409 estado no permite la acción, 429 demasiadas
            peticiones o generaciones en curso.
          </p>
        </section>
      </div>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Llaves />
      </aside>
    </div>
  );
}
