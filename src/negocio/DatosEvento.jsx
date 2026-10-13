import { useEffect, useRef, useState } from "react";
import { API_URL } from "../api/site";
import { cargarFuentes } from "./fuentes";
import "./negocio.css";

// Formulario de datos del evento: /datos/<token>. Cuando un cliente firma,
// Sivú le manda este enlace y él mismo llena nombres, fecha, lugar, detalles
// y sube fotos, música y su lista de invitados. Se guarda solo mientras
// escribe (puede volver después) y al darle «Enviar» le llega el aviso al
// equipo. Todo cae en su evento del panel (Producción → Datos del cliente).

const base = (token) => `${API_URL}/api/public/datos/${encodeURIComponent(token)}`;

// Ejemplos según el tipo de evento, para que sepa qué escribir.
const EJEMPLOS = {
  boda: { nombres: "Ej. Camila Herrera & Andrés Rivas", frase: "Ej. Nos casamos y queremos celebrarlo contigo", padres: "Ej. Padres de la novia: ... · Padres del novio: ..." },
  xv: { nombres: "Ej. Valentina Gómez", frase: "Ej. Mis XV años", padres: "Ej. Mis padres: ... · Padrinos: ..." },
  baby_shower: { nombres: "Ej. Baby shower de Laura · bebé Emma", frase: "Ej. Ya viene Emma", padres: "Ej. Papás: ..." },
  cumpleanos: { nombres: "Ej. Andrea Morales", frase: "Ej. ¡Celebremos mis 30!", padres: "" },
  bautizo: { nombres: "Ej. Matías Pérez", frase: "Ej. Mi bautizo", padres: "Ej. Mis padres: ... · Padrinos: ..." },
  corporativo: { nombres: "Ej. Cena de fin de año · Empresa S.A.S.", frase: "Ej. Celebremos juntos este año", padres: "" },
  otro: { nombres: "Ej. Nombre de quien celebra o del evento", frase: "", padres: "" },
};

const SECCIONES = [
  {
    titulo: "Quién celebra",
    campos: [
      ["nombres", "Nombre(s) como deben aparecer"],
      ["frase", "Frase o texto de bienvenida", { opcional: true }],
      ["padres", "Padres o padrinos", { opcional: true, area: true }],
    ],
  },
  {
    titulo: "Cuándo y dónde",
    campos: [
      ["fecha", "Fecha", { tipo: "date" }],
      ["hora", "Hora", { tipo: "time" }],
      ["lugar", "Lugar", { ejemplo: "Ej. Hacienda San Gabriel" }],
      ["direccion", "Dirección", { ejemplo: "Ej. Km 4 vía La Calera" }],
      ["mapa", "Enlace de Google Maps", { opcional: true, ejemplo: "Pega aquí el enlace de la ubicación", ayuda: "En Google Maps: busca el lugar → Compartir → Copiar enlace." }],
      ["lugar_recepcion", "Lugar de la recepción (si es en otro sitio)", { opcional: true }],
      ["direccion_recepcion", "Dirección de la recepción", { opcional: true }],
      ["hora_recepcion", "Hora de la recepción", { opcional: true, tipo: "time" }],
    ],
  },
  {
    titulo: "Detalles para los invitados",
    campos: [
      ["vestimenta", "Vestimenta", { opcional: true, ejemplo: "Ej. Formal · el blanco reservado para la novia" }],
      ["regalos", "Regalos o lluvia de sobres", { opcional: true, area: true, ejemplo: "Ej. Lluvia de sobres · o datos de la mesa de regalos" }],
      ["limite_confirmacion", "Fecha límite para confirmar asistencia", { opcional: true, tipo: "date" }],
      ["telefono_avisos", "WhatsApp donde quieres recibir las confirmaciones", { opcional: true, ejemplo: "Ej. 300 123 4567" }],
    ],
  },
  {
    titulo: "Tu estilo",
    campos: [
      ["estilo", "Estilo, colores e ideas", { opcional: true, area: true, ejemplo: "Ej. Elegante, tonos verde salvia y dorado, con flores. Me gusta la plantilla Valle." }],
      ["cancion", "Canción de fondo", { opcional: true, ejemplo: "Nombre de la canción o enlace de YouTube", ayuda: "También puedes subir el archivo de audio más abajo." }],
    ],
  },
];

function leerArchivo(file) {
  return new Promise((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(r.result);
    r.onerror = mal;
    r.readAsDataURL(file);
  });
}

// Las fotos del celular pesan mucho: se achican a 2000 px antes de subir.
async function achicarFoto(file) {
  try {
    const bmp = await createImageBitmap(file);
    const escala = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * escala);
    canvas.height = Math.round(bmp.height * escala);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return { datos: canvas.toDataURL("image/jpeg", 0.86), nombre: file.name.replace(/\.\w+$/, "") + ".jpg" };
  } catch {
    // El navegador no sabe abrirla (p. ej. HEIC fuera de Safari): va tal cual.
    return { datos: await leerArchivo(file), nombre: file.name };
  }
}

const PLANTILLA_LISTA = "﻿Nombre;Teléfono;Personas\r\nFamilia Gómez;3001234567;4\r\nLaura Pérez;3109876543;1\r\n";

export default function DatosEvento({ token }) {
  const [info, setInfo] = useState(null);
  const [datos, setDatos] = useState({});
  const [archivos, setArchivos] = useState([]);
  const [error, setError] = useState("");
  const [estado, setEstado] = useState(""); // guardando | guardado | error
  const [subiendo, setSubiendo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const temporizador = useRef(null);

  useEffect(() => {
    cargarFuentes();
    document.title = "Datos de tu evento · Sivú";
    fetch(base(token))
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "No se pudo cargar");
        setInfo(d);
        setDatos(d.datos || {});
        setArchivos(d.archivos || []);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  async function guardar(valores, final = false) {
    setEstado("guardando");
    const r = await fetch(base(token), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ datos: valores, final }),
    });
    if (!r.ok) {
      setEstado("error");
      throw new Error("No se pudo guardar");
    }
    setEstado("guardado");
  }

  function cambiar(k, v) {
    const nuevos = { ...datos, [k]: v };
    setDatos(nuevos);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => guardar(nuevos).catch(() => {}), 1200);
  }

  async function subir(tipo, files) {
    for (const file of [...files]) {
      setSubiendo(`Subiendo ${file.name}...`);
      try {
        const { datos: d, nombre } =
          tipo === "foto" ? await achicarFoto(file) : { datos: await leerArchivo(file), nombre: file.name };
        const r = await fetch(`${base(token)}/archivos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo, nombre, datos: d }),
        });
        const res = await r.json();
        if (!r.ok) throw new Error(res.error || "No se pudo subir");
        setArchivos((prev) => [...prev, res]);
      } catch (e) {
        alert(`${file.name}: ${e.message}`);
      }
    }
    setSubiendo("");
  }

  async function quitar(a) {
    await fetch(`${base(token)}/archivos/${a.id}`, { method: "DELETE" });
    setArchivos((prev) => prev.filter((x) => x.id !== a.id));
  }

  async function enviar() {
    if (!datos.nombres?.trim() || !datos.fecha) {
      alert("Por favor escribe al menos los nombres y la fecha del evento.");
      return;
    }
    clearTimeout(temporizador.current);
    setEnviando(true);
    try {
      await guardar(datos, true);
      setEnviado(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      alert("No se pudo enviar. Revisa tu conexión e inténtalo otra vez.");
    } finally {
      setEnviando(false);
    }
  }

  if (error) {
    return (
      <div className="sv" style={{ display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
        <div>
          <div className="sv-logo" style={{ color: "var(--vino-osc)" }}>Sivú</div>
          <p style={{ marginTop: 12, color: "var(--suave)" }}>{error}</p>
        </div>
      </div>
    );
  }
  if (!info) return <div className="sv" />;

  const ej = EJEMPLOS[info.tipo_evento] || EJEMPLOS.otro;
  const de = (tipo) => archivos.filter((a) => a.tipo === tipo);
  const ListaArchivos = ({ tipo }) =>
    de(tipo).length > 0 && (
      <div className="sv-archivos">
        {de(tipo).map((a) => (
          <div key={a.id} className="sv-archivo">
            <span>{{ foto: "🖼", audio: "🎵", lista: "📋", otro: "📎" }[a.tipo]}</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nombre}</span>
            <button onClick={() => quitar(a)}>Quitar</button>
          </div>
        ))}
      </div>
    );

  return (
    <div className="sv">
      <header className="sv-cabecera">
        <div className="sv-cont">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div className="sv-eyebrow">Datos de tu evento</div>
              <h1 className="sv-titulo">
                Hagamos <i>tu invitación</i>
              </h1>
              <p className="sv-sub">{info.nombre}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="sv-logo">Sivú</div>
              <div className="sv-de">de Nova</div>
            </div>
          </div>
        </div>
      </header>

      <main className="sv-cuerpo">
        {enviado || info.enviado ? (
          <div className="sv-aviso sv-aviso-ok" style={{ marginBottom: 14 }}>
            <b>{enviado ? "¡Recibimos tus datos! 💌" : "Ya nos enviaste tus datos."}</b> Arrancamos con el diseño y te escribimos por
            WhatsApp. Si necesitas cambiar o agregar algo, hazlo aquí mismo y vuelve a darle «Enviar».
          </div>
        ) : (
          <div className="sv-aviso sv-aviso-oro" style={{ marginBottom: 14 }}>
            Llena lo que tengas: <b>se guarda solo</b> y puedes volver a este enlace cuando quieras. Al terminar, dale «Enviar».
          </div>
        )}

        {SECCIONES.map((s) => (
          <section key={s.titulo} className="sv-tarjeta">
            <h2 className="sv-seccion-titulo">{s.titulo}</h2>
            <div className="sv-grid sv-grid-2" style={{ marginTop: 14 }}>
              {s.campos.map(([k, label, op = {}]) => {
                const placeholder = op.ejemplo || ej[k] || "";
                if (k === "padres" && !ej.padres && info.tipo_evento !== "otro") return null;
                return (
                  <label key={k} style={op.area || k === "nombres" || k === "mapa" ? { gridColumn: "1 / -1" } : undefined}>
                    <span className="sv-label">
                      {label}
                      {op.opcional && <span style={{ color: "var(--suave)", fontWeight: 400 }}> (opcional)</span>}
                    </span>
                    {op.area ? (
                      <textarea className="sv-campo" value={datos[k] || ""} placeholder={placeholder} onChange={(e) => cambiar(k, e.target.value)} />
                    ) : (
                      <input
                        className="sv-campo"
                        type={op.tipo || "text"}
                        value={datos[k] || ""}
                        placeholder={placeholder}
                        onChange={(e) => cambiar(k, e.target.value)}
                      />
                    )}
                    {op.ayuda && <span className="sv-ayuda">{op.ayuda}</span>}
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        <section className="sv-tarjeta">
          <h2 className="sv-seccion-titulo">Fotos, música y lista</h2>
          <div className="sv-grid" style={{ marginTop: 14 }}>
            <div>
              <span className="sv-label">Fotos para la invitación (opcional)</span>
              <label className="sv-subir">
                🖼 Elegir fotos
                <input type="file" accept="image/*" multiple hidden onChange={(e) => subir("foto", e.target.files)} />
              </label>
              <span className="sv-ayuda">Las que quieras en la galería o en la portada. Hasta 40.</span>
              <ListaArchivos tipo="foto" />
            </div>
            <div>
              <span className="sv-label">Música (opcional)</span>
              <label className="sv-subir">
                🎵 Subir canción (mp3)
                <input type="file" accept="audio/*" hidden onChange={(e) => subir("audio", e.target.files)} />
              </label>
              <span className="sv-ayuda">Máximo 10 MB. Si no la tienes, escribe arriba el nombre o el enlace.</span>
              <ListaArchivos tipo="audio" />
            </div>
            <div>
              <span className="sv-label">Lista de invitados (opcional)</span>
              <label className="sv-subir">
                📋 Subir lista (Excel, CSV o PDF)
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/pdf"
                  hidden
                  onChange={(e) => subir("lista", e.target.files)}
                />
              </label>
              <span className="sv-ayuda">
                Ideal en Excel con tres columnas: <b>Nombre</b>, <b>Teléfono</b> y <b>Personas</b> (cuántos van con esa invitación).{" "}
                <a
                  href={URL.createObjectURL(new Blob([PLANTILLA_LISTA], { type: "text/csv" }))}
                  download="lista-invitados-sivu.csv"
                  style={{ color: "var(--vino)", fontWeight: 600 }}
                >
                  Descargar plantilla
                </a>
              </span>
              <ListaArchivos tipo="lista" />
            </div>
            {subiendo && <p className="sv-guardado">{subiendo}</p>}
          </div>
        </section>

        <section className="sv-tarjeta">
          <label>
            <span className="sv-label">¿Algo más que debamos saber? (opcional)</span>
            <textarea
              className="sv-campo"
              value={datos.notas || ""}
              placeholder="Cualquier detalle, petición o idea"
              onChange={(e) => cambiar("notas", e.target.value)}
            />
          </label>
        </section>

        <div className="sv-botones" style={{ alignItems: "center" }}>
          <button className="sv-btn sv-btn-oro" onClick={enviar} disabled={enviando || Boolean(subiendo)}>
            {enviando ? "Enviando..." : enviado || info.enviado ? "Enviar cambios" : "Enviar mis datos"}
          </button>
          <a
            className="sv-btn sv-btn-borde"
            href={`https://wa.me/${info.whatsapp}?text=${encodeURIComponent(`¡Hola Sivú! Tengo una pregunta sobre los datos de mi evento (${info.nombre}).`)}`}
            target="_blank"
            rel="noreferrer"
          >
            Tengo una duda
          </a>
          <span className="sv-guardado">
            {estado === "guardando" ? "Guardando..." : estado === "guardado" ? "Guardado ✓" : estado === "error" ? "No se pudo guardar" : ""}
          </span>
        </div>

        <p className="sv-pie">Sivú · Invitaciones digitales · de NOVA Optimiza</p>
      </main>
    </div>
  );
}
