import { useEffect, useMemo, useRef, useState } from "react";
import "./celebracion.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer,
} from "../comun";
import flores from "./arte/flores.webp";

// Diseño «Celebración dorada»: crema con luces desenfocadas, filetes de oro y
// flores blancas en las esquinas. Nace de una tarjeta impresa de cumpleaños
// para varias personas a la vez («¡Celebramos tres vidas maravillosas!»):
// - La primera pantalla ES la tarjeta: foto del grupo que se funde con el
//   papel, título en letra de pincel dorada y una columna por festejado con
//   su nombre y la edad que cumple en números de oro.
// - Los festejados vienen de welcome.festejados ([{ nombre, edad }]); si no
//   hay, se usan los nombres 1 y 2 sin edad.
// - Debajo de la tarjeta va lo digital: la cuenta regresiva y los detalles
//   opcionales. Lo que ya dice la tarjeta (lugar, cómo llegar, confirmación)
//   no se repite abajo.
// Colores del tema: principal = oro, claro = oro pálido, oscuro = oro viejo,
// papel = crema, sello = rosa de los nombres.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Libre+Baskerville:wght@400;700&family=Playfair+Display:wght@600;700&display=swap";

// Palabras con las que suele empezar el nombre de un lugar: van en su propio
// renglón, como en la tarjeta («Restaurante / El Gran Víctor»).
const TIPO_LUGAR = /^(Restaurante|Salón|Salon|Hacienda|Finca|Club|Hotel|Casa|Centro|Iglesia|Parroquia|Quinta)\s+(.+)$/i;

const Icono = {
  pin: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 46S8 29.5 8 18a16 16 0 0 1 32 0c0 11.5-16 28-16 28z" fill="currentColor" />
      <circle cx="24" cy="18" r="6" fill="#FFF8EC" />
    </svg>
  ),
  telefono: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
    </svg>
  ),
  copiar: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  ),
  musica: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" />
    </svg>
  ),
  pausa: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M9 6v12M15 6v12" />
    </svg>
  ),
};

// Filete con volutas a los lados y un corazón en el centro.
function Filete({ className = "" }) {
  return (
    <svg className={`cd-filete ${className}`} viewBox="0 0 320 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M146 12H40c-8 0-12-6-7-9s9 1 6 5" />
        <path d="M174 12h106c8 0 12-6 7-9s-9 1-6 5" />
        <path d="M100 12c-14 0-20 6-30 6M220 12c14 0 20 6 30 6" opacity=".55" />
      </g>
      <path d="M160 20c-6-4.5-10-7.6-10-11.3a4.6 4.6 0 0 1 8.3-2.7L160 8l1.7-2a4.6 4.6 0 0 1 8.3 2.7c0 3.7-4 6.8-10 11.3z" fill="currentColor" />
    </svg>
  );
}

// Cuenta de 0 a la edad la primera vez que la tarjeta aparece.
function Edad({ valor, activa }) {
  const meta = parseInt(valor, 10);
  const [n, setN] = useState(Number.isFinite(meta) ? 0 : valor);
  useEffect(() => {
    if (!Number.isFinite(meta)) { setN(valor); return; }
    if (!activa || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(meta); return; }
    let cuadro;
    const inicio = performance.now();
    const dura = 1400;
    const paso = (t) => {
      const p = Math.min(1, (t - inicio) / dura);
      setN(Math.round(meta * (1 - Math.pow(1 - p, 3))));
      if (p < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [meta, valor, activa]);
  return <span className="cd-edad" aria-hidden="true">{n}</span>;
}

function Lugar({ nombre }) {
  const m = (nombre || "").match(TIPO_LUGAR);
  if (!m) return <b className="cd-donde-nombre">{nombre}</b>;
  return <><span className="cd-donde-tipo">{m[1]}</span><b className="cd-donde-nombre">{m[2]}</b></>;
}

export default function Celebracion({ site, contenidoDe, invitacion, onEnviarRSVP }) {
  useFuentes(FUENTES);
  const [rsvpAbierto, setRsvpAbierto] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [lista, setLista] = useState(false);
  const audioRef = useRef(null);
  const raiz = useAparecer(true, "[data-reveal]", "is-in");

  useEffect(() => {
    const t = requestAnimationFrame(() => setLista(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const welcome = contenidoDe("welcome");
  const info = contenidoDe("informacion_boda");
  const vestimenta = contenidoDe("vestimenta");
  const sobres = contenidoDe("sobres");
  const regalos = contenidoDe("regalos");
  const importante = contenidoDe("info_importante");
  const faq = contenidoDe("faq");
  const musica = contenidoDe("musica");
  const activo = (tipo) => site.secciones.some((s) => s.tipo === tipo && s.activo !== false);

  const partes = useMemo(() => partesFecha(info.fecha), [info.fecha]);
  const cuenta = useCuentaRegresiva(partes?.fecha);
  const limite = limiteLegible(info.fechaLimiteConfirmacion || site.fechaLimiteConfirmacion);
  const pases = pasesDe(invitacion);
  const festejados = (welcome.festejados || []).filter((f) => f && f.nombre);
  const personas = festejados.length
    ? festejados
    : [welcome.novioEl, welcome.novioElla].filter(Boolean).map((nombre) => ({ nombre, edad: "" }));
  const audioSrc = site.audioUrl || musica.src;
  const foto = (site.fotosSubidas || [])[0];
  const telefono = (info.telefonoConfirmar || "").trim();
  const digitos = telefono.replace(/\D/g, "");
  const puntos = (importante.items || []).filter(Boolean);
  const preguntas = (faq.items || []).filter((f) => f && f.p);
  const cronograma = info.cronogramaModo === "detallado" ? info.cronograma || [] : [];
  const regalo = (activo("sobres") && sobres.texto) || (activo("regalos") && (regalos.texto || regalos.datosTransferencia));

  function alternarMusica() {
    const a = audioRef.current;
    if (!a) return;
    if (sonando) { a.pause(); setSonando(false); }
    else a.play().then(() => setSonando(true)).catch(() => {});
  }
  async function copiar(texto, mensaje) {
    try {
      await navigator.clipboard.writeText(texto);
      setAviso(mensaje);
    } catch {
      setAviso("No se pudo copiar");
    }
    setTimeout(() => setAviso(""), 2200);
  }

  // El botón de la tarjeta confirma por la invitación personal; sin código,
  // lleva al teléfono que puso el anfitrión (WhatsApp).
  const confirmar = invitacion
    ? { grande: "Confirmar asistencia", onClick: () => setRsvpAbierto(true) }
    : digitos
      ? { texto: "Favor confirmar al", grande: telefono, href: `https://wa.me/${digitos.length === 10 ? `57${digitos}` : digitos}` }
      : null;

  return (
    <div className={`cd ${lista ? "cd-lista" : ""}`} ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop />}
      {audioSrc && (
        <button className="cd-musica" type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label="Música de fondo">
          {sonando ? Icono.pausa : Icono.musica}
          <span>{sonando ? "Pausar" : "Música"}</span>
        </button>
      )}

      <span className="cd-luces" aria-hidden="true" />
      {/* Degradado de oro que usan los íconos rellenos de la tarjeta. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <linearGradient id="cd-oro" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E6C77E" />
          <stop offset=".5" stopColor="#B8862E" />
          <stop offset="1" stopColor="#8A5E1C" />
        </linearGradient>
      </svg>

      <article className="cd-tarjeta" aria-labelledby="cd-titulo">
        <span className="cd-marco" aria-hidden="true"><i /><i /><i /><i /></span>
        <img src={flores} alt="" aria-hidden="true" className="cd-flores cd-flores-arriba" />
        <img src={flores} alt="" aria-hidden="true" className="cd-flores cd-flores-abajo" />

        {/* A quién se invitó: lo primero que se lee al abrir el enlace. */}
        {invitacion?.nombre && (
          <div className="cd-invitado cd-paso" style={{ "--i": 0 }}>
            <span className="cd-invitado-k">Invitación especial para</span>
            <p className="cd-invitado-nombre">{invitacion.nombre}</p>
            {pases > 0 && (
              <span className="cd-invitado-pases">
                {pases} {pases === 1 ? "pase reservado" : "pases reservados"}
              </span>
            )}
          </div>
        )}

        {foto ? (
          <figure className="cd-foto cd-paso" style={{ "--i": 0 }}>
            <img src={foto} alt={`Foto de ${personas.map((p) => p.nombre).join(", ")}`} />
          </figure>
        ) : (
          <div className="cd-sin-foto" aria-hidden="true" />
        )}

        <h1 className="cd-titulo cd-paso" id="cd-titulo" style={{ "--i": 1 }}>
          {welcome.bienvenidaTexto || "¡Celebramos!"}
        </h1>
        <Filete className="cd-paso" />

        {welcome.fraseIntro && <p className="cd-intro cd-paso" style={{ "--i": 2 }}>{welcome.fraseIntro}</p>}

        <ul className={`cd-festejados cd-n${Math.min(personas.length, 4)}`}>
          {personas.map((p, i) => (
            <li key={i} className="cd-paso" style={{ "--i": 3 + i }}>
              <span className={`cd-nombre ${i % 2 ? "cd-nombre-verde" : ""}`}>{p.nombre}</span>
              {p.edad !== "" && p.edad != null && (
                <span className="cd-anillo">
                  <Edad valor={p.edad} activa={lista} />
                  <span className="cd-anos">años</span>
                  <span className="sr-only">{p.nombre} cumple {p.edad} años</span>
                </span>
              )}
            </li>
          ))}
        </ul>

        {(partes || info.lugar) && (
          <div className="cd-datos cd-paso" style={{ "--i": 3 + personas.length }}>
            {partes && (
              <div className="cd-cuando">
                <p className="cd-fecha">
                  <span className="cd-fecha-lado">{partes.semana}</span>
                  <span className="cd-fecha-dia">{partes.dia}</span>
                  <span className="cd-fecha-lado">{partes.hora}</span>
                </p>
                <p className="cd-fecha-mes">{partes.mes} · {partes.anio}</p>
              </div>
            )}
            {info.lugar && (
              <div className="cd-donde">
                <span className="cd-icono">{Icono.pin}</span>
                <Lugar nombre={info.lugar} />
                {info.direccion && <span className="cd-donde-ciudad">{info.direccion}</span>}
                {info.mapsUrl && (
                  <a className="cd-mapa" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">Cómo llegar</a>
                )}
              </div>
            )}
          </div>
        )}

        <Filete className="cd-filete-chico" />

        {confirmar && (
          confirmar.href ? (
            <a className="cd-confirmar cd-paso" style={{ "--i": 4 + personas.length }} href={confirmar.href} target="_blank" rel="noopener noreferrer">
              <span className="cd-confirmar-icono">{Icono.telefono}</span>
              <span>{confirmar.texto}<b>{confirmar.grande}</b></span>
            </a>
          ) : (
            <button className="cd-confirmar cd-confirmar-unico cd-paso" style={{ "--i": 4 + personas.length }} type="button" onClick={confirmar.onClick}>
              <span className="cd-confirmar-icono">{Icono.telefono}</span>
              <span>{confirmar.texto}<b>{confirmar.grande}</b></span>
            </button>
          )
        )}
        {confirmar && limite && <p className="cd-limite">Confirma antes del <b>{limite}</b></p>}
      </article>

      <main className="cd-cuerpo">
        {partes && (
          <section className="cd-seccion" aria-labelledby="cd-cuenta" data-reveal>
            <h2 className="cd-h2" id="cd-cuenta">Faltan</h2>
            {cuenta ? (
              <div className="cd-cuenta" role="timer" aria-labelledby="cd-cuenta">
                {[["dias", "días"], ["horas", "horas"], ["min", "min"], ["seg", "seg"]].map(([k, l]) => (
                  <div key={k}><span className="n">{cuenta[k]}</span><span className="l">{l}</span></div>
                ))}
              </div>
            ) : (
              <p className="cd-texto">¡Llegó el gran día!</p>
            )}
          </section>
        )}

        {cronograma.length > 0 && (
          <section className="cd-seccion" aria-labelledby="cd-programa" data-reveal>
            <h2 className="cd-h2" id="cd-programa">{info.tituloItinerario || "Programa"}</h2>
            <ol className="cd-programa">
              {cronograma.map((c, i) => <li key={i}><span>{c.hora}</span><b>{c.titulo}</b></li>)}
            </ol>
          </section>
        )}

        {activo("vestimenta") && vestimenta.titulo && (
          <section className="cd-seccion" aria-labelledby="cd-vestimenta" data-reveal>
            <h2 className="cd-h2" id="cd-vestimenta">Vestimenta</h2>
            <p className="cd-texto"><b>{vestimenta.titulo}</b>{vestimenta.nota && <><br />{vestimenta.nota}</>}</p>
          </section>
        )}

        {regalo && (
          <section className="cd-seccion" aria-labelledby="cd-regalo" data-reveal>
            <h2 className="cd-h2" id="cd-regalo">Un detalle</h2>
            <p className="cd-texto">{(activo("sobres") && sobres.texto) || regalos.texto || "Tu compañía es el mejor regalo."}</p>
            {activo("regalos") && regalos.datosTransferencia && (
              <div className="cd-transferir">
                <span>{regalos.datosTransferencia}</span>
                <button className="cd-btn cd-btn-linea" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>{Icono.copiar} Copiar</button>
              </div>
            )}
          </section>
        )}

        {activo("info_importante") && (puntos.length > 0 || importante.nota) && (
          <section className="cd-seccion" aria-labelledby="cd-info" data-reveal>
            <h2 className="cd-h2" id="cd-info">Ten en cuenta</h2>
            {importante.nota && <p className="cd-texto">{importante.nota}</p>}
            {puntos.length > 0 && <ul className="cd-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
          </section>
        )}

        {activo("faq") && preguntas.length > 0 && (
          <section className="cd-seccion" aria-labelledby="cd-faq" data-reveal>
            <h2 className="cd-h2" id="cd-faq">Preguntas</h2>
            <div className="cd-faq">
              {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary><p>{f.r}</p></details>)}
            </div>
          </section>
        )}

        <footer className="cd-final" data-reveal>
          <Filete />
          <p className="cd-te-esperamos">¡Te esperamos!</p>
        </footer>
      </main>

      <div className={`cd-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="cd-modal" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="cd-modal-caja">
            <button type="button" className="cd-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">×</button>
            <RSVP
              invitacion={invitacion}
              fechaLimite={info.fechaLimiteConfirmacion || site.fechaLimiteConfirmacion}
              opciones={{
                mostrarRestriccion: info.mostrarRestriccion !== false,
                mostrarObservaciones: info.mostrarObservaciones !== false,
              }}
              onSubmit={onEnviarRSVP}
            />
          </div>
        </div>
      )}
    </div>
  );
}
