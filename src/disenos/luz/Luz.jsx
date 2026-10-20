import { useMemo, useRef, useState } from "react";
import "./luz.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer,
} from "../comun";
import {
  LbVela, LbLlama, LbOlivo, LbPaloma, LbPila, LbCinta, LbVotiva, LbChispa, LbCerilla, LbConcha, LbCampana,
} from "./arte";

// Diseño «Luz de bautizo»: sereno, puro y luminoso. Marfil, oro suave,
// olivo y flores blancas bajo una luz cálida.
// - Entrada «la vela que se enciende»: la pantalla está en penumbra suave
//   (marfil apagado, no negro) con una vela bautismal alta, con cinta y
//   ramito de olivo. Al tocar la mecha aparece la llama, que titila, y un
//   halo de luz cálida se abre desde ella hasta iluminar toda la pantalla y
//   revelar el nombre del bebé. El invitado va escrito en la cinta de raso
//   que envuelve la vela (como un recordatorio de bautizo) y sus pases son
//   velitas votivas encendidas. El llamado a tocar es una cerilla con chispas
//   que se enciende al tocar.
// - Cuerpo «arcos de capilla»: cada sección vive en una ventana de medio
//   punto con filete dorado fino y alféizar. El título va en un nicho con una
//   cruz de luz. Al aparecer, la sombra de la ventana baja y la luz entra
//   desde la clave del arco. La cuenta regresiva son cuatro velas votivas y
//   el cierre, una concha bautismal que deja caer una gota en la luz.
// Colores del tema: principal = oro suave, claro = oro pálido, oscuro = oro
// viejo, papel = marfil, mármol = blanco de las ventanas, sello = olivo.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Nunito:wght@400;600;700&family=Satisfy&display=swap";

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
const Icono = {
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  regalo: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="3.5" y="9" width="17" height="11.5" rx="1.5" /><path d="M2.5 9h19M12 9v11.5M12 9c-1.5-3.5-6-4.5-6-1.8C6 8.8 9 9 12 9zm0 0c1.5-3.5 6-4.5 6-1.8C18 8.8 15 9 12 9z" /></svg>,
  whatsapp: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-1.9-1-.9.8a4 4 0 0 1-2.3-2.3l.8-.9-1-1.9z" /></svg>,
};

// Cruz de luz: dos haces finos que brillan en la clave del nicho.
function CruzDeLuz({ className = "" }) {
  return <span className={`lb-cruz ${className}`} aria-hidden="true"><i /></span>;
}

// Ventana de capilla: arco de medio punto con filete dorado y alféizar. El
// título vive en un nicho con una cruz de luz en su clave; el texto de apoyo
// va debajo, en cursiva. Al aparecer, la sombra (lb-velo) baja y la luz entra.
function Arco({ id, ante, anteArriba, titulo, paloma, pieza, angosto, children }) {
  return (
    <section className={`lb-seccion ${angosto ? "lb-angosto" : ""}`} aria-labelledby={id} data-reveal>
      <div className="lb-ventana">
        <span className="lb-luz" aria-hidden="true" />
        <span className="lb-rayos" aria-hidden="true" />
        <div className="lb-dentro">
          {pieza}
          <header className="lb-nicho">
            <CruzDeLuz />
            {paloma && <LbPaloma className="lb-paloma-titulo" ramita />}
            {ante && anteArriba && <p className="lb-ante">{ante}</p>}
            <h2 className="lb-h2" id={id}>{titulo}</h2>
            {ante && !anteArriba && <p className="lb-ante">{ante}</p>}
          </header>
          {children}
        </div>
        <span className="lb-velo" aria-hidden="true" />
      </div>
      <span className="lb-alfeizar" aria-hidden="true" />
    </section>
  );
}

function urlDelMapa(valor) {
  if (!valor) return "";
  const texto = String(valor).trim();
  const conSrc = texto.match(/src\s*=\s*["']([^"']+)["']/i);
  const url = conSrc ? conSrc[1] : texto;
  return /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(url) ? url : "";
}

function Portada({ welcome, partes, invitacion, encendida, instantanea, onEncender }) {
  const raiz = useRef(null);
  const llama = useRef(null);
  const pases = pasesDe(invitacion);

  // La luz se abre desde la llama: se mide dónde quedó para centrar el halo.
  function encender() {
    if (encendida) return;
    const caja = raiz.current?.getBoundingClientRect();
    const f = llama.current?.getBoundingClientRect();
    if (caja && f) {
      raiz.current.style.setProperty("--lb-x", `${f.left + f.width / 2 - caja.left}px`);
      raiz.current.style.setProperty("--lb-y", `${f.top + f.height * 0.7 - caja.top}px`);
    }
    onEncender();
  }

  return (
    <section
      ref={raiz}
      className={`lb-portada ${encendida ? "lb-encendida" : ""} ${instantanea ? "lb-instantanea" : ""}`}
      aria-labelledby="lb-portada-nombre"
    >
      <span className="lb-penumbra" aria-hidden="true" />
      <span className="lb-calidez" aria-hidden="true" />

      <div className="lb-escena">
        <LbOlivo className="lb-escena-olivo lb-escena-olivo-1" />
        <LbOlivo className="lb-escena-olivo lb-escena-olivo-2" />
        <div className="lb-vela-caja">
          <LbVela className="lb-vela" />
          <span className="lb-halo" aria-hidden="true" />
          <span className="lb-llama-sitio" ref={llama}>
            <LbLlama className="lb-llama" />
          </span>
          {/* La cinta de raso que envuelve la vela lleva el nombre del invitado. */}
          <div className="lb-cinta-sitio">
            <LbCinta className="lb-cinta" texto={invitacion?.nombre || welcome.bienvenidaTexto || "Mi bautizo"} />
            {invitacion?.nombre && <p className="lb-oculto">Invitación para {invitacion.nombre}</p>}
          </div>
          <button
            type="button"
            className="lb-mecha"
            onClick={encender}
            disabled={encendida}
            aria-label="Encender la vela y abrir la invitación"
          >
            <LbChispa className="lb-chispa" />
          </button>
        </div>
      </div>

      {pases > 0 && (
        <div className="lb-votivas">
          <div className="lb-votivas-fila" aria-hidden="true">
            {Array.from({ length: Math.min(pases, 6) }, (_, i) => (
              <LbVotiva key={i} className="lb-votivita" style={{ "--i": i }} />
            ))}
          </div>
          <p className="lb-votivas-texto">{pases} {pases === 1 ? "lugar para ti" : "lugares para ti"}</p>
        </div>
      )}

      <div className="lb-portada-abajo">
        <button type="button" className="lb-pista" onClick={encender} tabIndex={encendida ? -1 : 0} aria-hidden={encendida}>
          <LbCerilla className="lb-cerilla" />
          <span>Toca la mecha</span>
        </button>
        <div className="lb-revelado">
          <p className="lb-revelado-ante">{welcome.bienvenidaTexto || "Mi bautizo"}</p>
          <h1 className="lb-nombre" id="lb-portada-nombre">{[welcome.novioEl, welcome.novioElla].filter(Boolean).join(" & ")}</h1>
          {partes && (
            <p className="lb-revelado-fecha">
              <span>{partes.semana}</span>
              <b>{partes.dia} de {partes.mes}</b>
              <span>{partes.anio}</span>
            </p>
          )}
        </div>
      </div>
      <p className="lb-desliza" aria-hidden="true">
        Desliza
        <svg viewBox="0 0 24 24" {...trazo}><path d="M6 9l6 6 6-6" /></svg>
      </p>
    </section>
  );
}

export default function Luz({ site, contenidoDe, invitacion, onEnviarRSVP, enEditor }) {
  useFuentes(FUENTES);
  // En el panel la vela ya está encendida para poder ver y editar.
  const [encendida, setEncendida] = useState(Boolean(enEditor));
  const [rsvpAbierto, setRsvpAbierto] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [aviso, setAviso] = useState("");
  const audioRef = useRef(null);
  const raiz = useAparecer(encendida, "[data-reveal]", "is-in");

  const welcome = contenidoDe("welcome");
  const info = contenidoDe("informacion_boda");
  const vestimenta = contenidoDe("vestimenta");
  const padrinos = contenidoDe("padrinos");
  const historia = contenidoDe("historia");
  const fotosSec = contenidoDe("fotos");
  const regalos = contenidoDe("regalos");
  const sobres = contenidoDe("sobres");
  const importante = contenidoDe("info_importante");
  const faq = contenidoDe("faq");
  const musica = contenidoDe("musica");
  const activo = (tipo) => site.secciones.some((s) => s.tipo === tipo && s.activo !== false);

  const partes = useMemo(() => partesFecha(info.fecha), [info.fecha]);
  const cuenta = useCuentaRegresiva(partes?.fecha);
  const limite = limiteLegible(info.fechaLimiteConfirmacion || site.fechaLimiteConfirmacion);
  const nombres = [welcome.novioEl, welcome.novioElla].filter(Boolean);
  const audioSrc = site.audioUrl || musica.src;
  const telefono = (info.telefonoConfirmar || "").trim();
  const digitos = telefono.replace(/\D/g, "");
  const cronograma = info.cronogramaModo === "detallado" ? (info.cronograma || []).filter((c) => c && (c.hora || c.titulo)) : [];
  const mensajePrograma = info.cronogramaModo === "mensaje" ? (info.cronogramaMensaje || "").trim() : "";
  const padres = [welcome.padreElPadre, welcome.padreElMadre].filter(Boolean);
  const padresElla = [welcome.padreEllaPadre, welcome.padreEllaMadre].filter(Boolean);
  const grupos = (padrinos.grupos || []).filter((g) => g && (g.personas || []).some(Boolean));
  const permitidos = (vestimenta.permitidos || []).filter((p) => p && (p.nombre || (p.colores || []).length));
  const evitar = (vestimenta.evitar || []).filter((e) => e && (e.nombre || e.color));
  const fotos = [...(site.fotosSubidas || []), ...(activo("fotos") ? fotosSec.urls || [] : [])].filter(Boolean);
  const enlaces = (regalos.enlaces || []).filter((e) => e?.url);
  const puntos = (importante.items || []).filter(Boolean);
  const preguntas = (faq.items || []).filter((f) => f && f.p);
  const mapa = urlDelMapa(info.mapaEmbed);
  const hayRegalo = (activo("sobres") && sobres.texto) || (activo("regalos") && (regalos.texto || enlaces.length > 0 || regalos.datosTransferencia));
  const hayBienvenida = welcome.fraseIntro || padres.length > 0 || padresElla.length > 0 || welcome.versiculo;

  function encender() {
    setEncendida(true);
    // El toque que enciende la vela es el gesto que deja arrancar la música.
    if (audioRef.current && !enEditor) audioRef.current.play().then(() => setSonando(true)).catch(() => {});
  }
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

  // Con invitación personal se confirma por el formulario; sin código, por
  // WhatsApp al teléfono de la familia; si no hay ninguno, no hay botón.
  const confirmar = invitacion
    ? { grande: "Confirmar asistencia", onClick: () => setRsvpAbierto(true) }
    : digitos
      ? { texto: "Favor confirmar al", grande: telefono, href: `https://wa.me/${digitos.length === 10 ? `57${digitos}` : digitos}` }
      : null;

  return (
    <div className="lb" ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop />}
      {audioSrc && encendida && (
        <button className={`lb-musica ${sonando ? "lb-sonando" : ""}`} type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label={sonando ? "Pausar música" : "Reproducir música"}>
          <LbCampana className="lb-campana" />
        </button>
      )}

      <Portada
        welcome={welcome}
        partes={partes}
        invitacion={invitacion}
        encendida={encendida}
        instantanea={Boolean(enEditor)}
        onEncender={encender}
      />

      {encendida && (
        <main className="lb-cuerpo">
          {hayBienvenida && (
            <Arco id="lb-bienvenida" ante={welcome.padresTexto || "Hijo de"} anteArriba titulo={padres.join(" y ") || nombres.join(" & ")} paloma>
              {padresElla.length > 0 && <p className="lb-padres-2">y {padresElla.join(" y ")}</p>}
              {welcome.fraseIntro && <p className="lb-texto">{welcome.fraseIntro}</p>}
              {welcome.versiculo && (
                <blockquote className="lb-versiculo">
                  <p>«{welcome.versiculo}»</p>
                  {welcome.versiculoCita && <cite>{welcome.versiculoCita}</cite>}
                </blockquote>
              )}
            </Arco>
          )}

          {partes && (
            <Arco id="lb-cuenta" ante={`${partes.semana} ${partes.dia} de ${partes.mes}`} titulo={cuenta ? "Faltan" : "¡Llegó el gran día!"} angosto>
              {cuenta && (
                <div className="lb-cuenta" role="timer" aria-labelledby="lb-cuenta">
                  {[["dias", "días"], ["horas", "horas"], ["min", "min"], ["seg", "seg"]].map(([k, l], i) => (
                    <div key={k} className="lb-cuenta-vela" style={{ "--i": i }}>
                      <span className="lb-cuenta-vaso">
                        <LbVotiva className="lb-cuenta-votiva" />
                        <span className={`n ${String(cuenta[k]).length > 2 ? "n-largo" : ""}`}>{cuenta[k]}</span>
                      </span>
                      <span className="l">{l}</span>
                    </div>
                  ))}
                </div>
              )}
            </Arco>
          )}

          {(info.lugar || info.direccion) && (
            <Arco id="lb-ceremonia" ante={info.overline || "La ceremonia"} titulo={info.lugar || "¿Dónde?"} pieza={<LbPila className="lb-pila" />}>
              {partes && (
                <p className="lb-cuando">
                  <span>{partes.semana}</span>
                  <b>{partes.dia} · {partes.mesCorto} · {partes.anio}</b>
                  <span>{partes.hora}</span>
                </p>
              )}
              {info.lugar && info.direccion && <p className="lb-texto">{info.direccion}</p>}
              {mapa && (
                <div className="lb-mapa">
                  <iframe src={mapa} title={`Mapa de ${info.lugar || "la ceremonia"}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              )}
              {info.mapsUrl && (
                <a className="lb-btn lb-btn-linea" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>
              )}
            </Arco>
          )}

          {(cronograma.length > 0 || mensajePrograma) && (
            <Arco id="lb-programa" ante="Para ese día" titulo={info.tituloItinerario || "El programa"}>
              {cronograma.length > 0 ? (
                <ol className="lb-programa">
                  {cronograma.map((c, i) => (
                    <li key={i}>
                      <span className="lb-programa-hora">{c.hora}</span>
                      <span className="lb-programa-punto" aria-hidden="true" />
                      <span className="lb-programa-que">{c.titulo}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="lb-texto">{mensajePrograma}</p>
              )}
            </Arco>
          )}

          {activo("padrinos") && grupos.length > 0 && (
            <Arco id="lb-padrinos" ante="Me acompañan en la fe" titulo={padrinos.titulo || "Mis padrinos"} paloma angosto>
              {grupos.map((g, i) => (
                <div key={i} className="lb-grupo">
                  {g.etiqueta && <p className="lb-etiqueta">{g.etiqueta}</p>}
                  {g.personas.filter(Boolean).map((p, j) => <p key={j} className="lb-persona">{p}</p>)}
                </div>
              ))}
            </Arco>
          )}

          {activo("vestimenta") && (vestimenta.titulo || vestimenta.nota || permitidos.length > 0) && (
            <Arco id="lb-vestimenta" ante="Vestimenta" titulo={vestimenta.titulo || "Código de vestimenta"}>
              {vestimenta.nota && <p className="lb-texto">{vestimenta.nota}</p>}
              {permitidos.length > 0 && (
                <ul className="lb-colores" aria-label="Colores sugeridos">
                  {permitidos.map((p, i) => (
                    <li key={i}>
                      <span className="lb-muestras">
                        {(p.colores || []).slice(0, 3).map((c, j) => <i key={j} style={{ background: c }} />)}
                      </span>
                      {p.nombre && <span>{p.nombre}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {evitar.length > 0 && (
                <p className="lb-evitar">
                  Evitar:{" "}
                  {evitar.map((e, i) => (
                    <span key={i}>{e.color && <i style={{ background: e.color }} />}{e.nombre}</span>
                  ))}
                </p>
              )}
            </Arco>
          )}

          {activo("historia") && historia.texto && (
            <Arco id="lb-historia" ante="Un pequeño milagro" titulo={historia.titulo || "Mi historia"}>
              <p className="lb-carta">{historia.texto}</p>
              {nombres[0] && <p className="lb-firma">{nombres[0].split(" ")[0]}</p>}
            </Arco>
          )}

          {fotos.length > 0 && (
            <Arco id="lb-fotos" ante={fotosSec.subtitulo || "Recuerdos"} titulo={fotosSec.titulo || "Momentos"} paloma>
              <div className={`lb-fotos ${fotos.length === 1 ? "lb-fotos-una" : ""}`}>
                {fotos.slice(0, 6).map((f, i) => (
                  <figure key={i}><img src={f} alt={`Foto ${i + 1} de ${nombres[0] || "la familia"}`} loading="lazy" /></figure>
                ))}
              </div>
            </Arco>
          )}

          {hayRegalo && (
            <Arco id="lb-regalos" ante="Con cariño" titulo={(activo("regalos") && regalos.titulo) || "Un detalle"}>
              {activo("regalos") && regalos.texto && <p className="lb-texto">{regalos.texto}</p>}
              {activo("sobres") && sobres.texto && <p className="lb-texto">{sobres.texto}</p>}
              {activo("regalos") && enlaces.length > 0 && (
                <div className="lb-botones">
                  {enlaces.map((e, i) => (
                    <a key={i} className="lb-btn lb-btn-linea" href={e.url} target="_blank" rel="noopener noreferrer">{Icono.regalo} {e.tienda || e.nombre || "Ver lista"}</a>
                  ))}
                </div>
              )}
              {activo("regalos") && regalos.datosTransferencia && (
                <div className="lb-transferir">
                  <p className="lb-etiqueta">Datos para transferir</p>
                  <p className="lb-dato">{regalos.datosTransferencia}</p>
                  <button className="lb-btn lb-btn-linea" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>{Icono.copiar} Copiar</button>
                </div>
              )}
            </Arco>
          )}

          {activo("info_importante") && (puntos.length > 0 || importante.nota) && (
            <Arco id="lb-importante" ante="Para tener en cuenta" titulo="Información importante">
              {importante.nota && <p className="lb-texto">{importante.nota}</p>}
              {puntos.length > 0 && <ul className="lb-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
            </Arco>
          )}

          {activo("faq") && preguntas.length > 0 && (
            <Arco id="lb-faq" ante="Dudas" titulo="Preguntas frecuentes">
              <div className="lb-faq">
                {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary>{f.r && <p>{f.r}</p>}</details>)}
              </div>
            </Arco>
          )}

          {confirmar && (
            <Arco id="lb-confirmar" ante="Te esperamos" titulo="Confirma tu asistencia" paloma angosto>
              {invitacion?.nombre && <p className="lb-texto">Hemos reservado un lugar para <b>{invitacion.nombre}</b>.</p>}
              {confirmar.href ? (
                <a className="lb-btn lb-btn-oro" href={confirmar.href} target="_blank" rel="noopener noreferrer">
                  {Icono.whatsapp} <span>{confirmar.texto} <b>{confirmar.grande}</b></span>
                </a>
              ) : (
                <button className="lb-btn lb-btn-oro" type="button" onClick={confirmar.onClick}>{confirmar.grande}</button>
              )}
              {limite && <p className="lb-limite">Confirma antes del <b>{limite}</b></p>}
            </Arco>
          )}

          <footer className="lb-final" data-reveal>
            <LbConcha className="lb-concha" />
            <p className="lb-final-gracias">¡Te esperamos!</p>
            {nombres.length > 0 && <p className="lb-texto lb-final-firma">Con amor, la familia de {nombres.join(" & ")}</p>}
          </footer>
        </main>
      )}

      <div className={`lb-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="lb-modal" role="dialog" aria-modal="true" aria-label="Confirmar asistencia" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="lb-modal-caja">
            <button type="button" className="lb-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">
              <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
            </button>
            <div className="lb-modal-arco">
              <CruzDeLuz className="lb-modal-cruz" />
              <LbPaloma className="lb-modal-paloma" ramita />
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
        </div>
      )}
    </div>
  );
}
