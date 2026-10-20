import { useMemo, useRef, useState } from "react";
import "./dulce.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer,
} from "../comun";
import {
  DlPastel, DlHumo, DlSoplido, DlTemporizador, DlMacarons, DlCopas, DlTarta, DlCajita,
  DlCajaCierre, DlBatidor, DlToldo, DlEtiqueta, DlCordon, DlMacaronSuelto,
} from "./arte";

// Diseño «Dulce 30»: cumpleaños de adultos con aire de pastelería de
// caramelo y vainilla: pastel de crema con caramelo chorreado, frutos rojos,
// hojillas de oro, macarons surtidos y mármol.
// - Entrada «Sopla las velas»: el pastel de tres pisos sobre su pedestal,
//   con las velas encendidas, la edad como topper dorado y, si hay invitado,
//   su nombre escrito con manga en una placa de chocolate blanco con las
//   porciones reservadas. El llamado es un soplido dibujado (remolinos de
//   aire): al tocarlo la ráfaga vuela al pastel, las llamas se apagan, sube
//   el humo y la invitación se abre.
// - Cuerpo «vitrina de pastelería»: bajo un toldo caramelo y crema, cada
//   sección es una repisa de vitrina con su postre y una etiqueta de precio
//   escrita a mano que se columpia al aparecer. La cuenta regresiva es un
//   temporizador de horno; el cierre, una caja de pastelería que se tapa y
//   se ata con cordel; la música, un batidor; el RSVP, una caja de pastelería.
// Colores del tema: principal = caramelo, claro = vainilla, oscuro = caramelo
// tostado, papel = fondo vainilla, mármol = crema de tarjetas, sello = frutos.
// El oro, el mármol y los frutos rojos son color del material y van fijos.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Italiana&family=Montserrat:wght@400;500;600&family=Yesteryear&display=swap";

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
const Icono = {
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  sobre: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3.5 7l8.5 6.5L20.5 7" /></svg>,
  regalo: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="1.5" /><path d="M3 7h18v3H3zM12 7v13M12 7C10 3 6.5 4 7.5 6.2 8.2 7.5 12 7 12 7zM12 7c2-4 5.5-3 4.5-.8C15.8 7.5 12 7 12 7z" /></svg>,
  whatsapp: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.3-1.4-1.9-1-1 .8c-1-.4-1.9-1.3-2.3-2.3l.8-1-1-1.9z" /></svg>,
  musica: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>,
  pausa: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>,
};

// Solo se acepta un mapa embebido de Google (src de un iframe o la URL).
function urlDelMapa(valor) {
  if (!valor) return "";
  const texto = String(valor).trim();
  const conSrc = texto.match(/src\s*=\s*["']([^"']+)["']/i);
  const enlace = conSrc ? conSrc[1] : texto;
  return /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(enlace) ? enlace : "";
}

// Repisa de vitrina: arriba el exhibidor de cristal con el postre sobre un
// estante de mármol y la etiqueta escrita a mano; abajo, la tarjeta blanca
// con el contenido. Las repisas alternan el lado de la etiqueta.
function Repisa({ n, id, titulo, postre, children, className = "" }) {
  const lado = n % 2 ? "dl-izq" : "dl-der";
  return (
    <section className={`dl-repisa ${lado} ${className}`} aria-labelledby={id} data-reveal>
      <div className="dl-vitrina">
        <div className="dl-exhibidor">
          <div className="dl-postre">{postre}</div>
          <span className="dl-estante" aria-hidden="true" />
          <span className="dl-cristal" aria-hidden="true" />
          <div className="dl-etiqueta">
            <DlCordon className="dl-cordon" />
            <DlEtiqueta className="dl-etiqueta-fondo" />
            <span className="dl-ojal" aria-hidden="true" />
            <span className="dl-numero">N.º {String(n).padStart(2, "0")}</span>
            <h2 id={id}>{titulo}</h2>
          </div>
        </div>
        <div className="dl-contenido">{children}</div>
      </div>
    </section>
  );
}

function Entrada({ nombre, edad, antetitulo, invitacion, alSoplar, onAbrir }) {
  const [soplando, setSoplando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const pases = pasesDe(invitacion);
  function soplar() {
    if (soplando) return;
    setSoplando(true);
    alSoplar();
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducido) { setTimeout(onAbrir, 350); return; }
    setTimeout(() => setSaliendo(true), 1900);
    setTimeout(onAbrir, 2500);
  }
  return (
    <section className={`dl-entrada ${soplando ? "dl-sopladas" : ""} ${saliendo ? "dl-saliendo" : ""}`} aria-labelledby="dl-entrada-nombre">
      <div className="dl-entrada-arriba">
        {antetitulo && <p className="dl-antetitulo">{antetitulo}</p>}
        <h1 className="dl-entrada-nombre" id="dl-entrada-nombre">{nombre}</h1>
      </div>

      <div className="dl-pastel-caja">
        <span className="dl-foco" aria-hidden="true" />
        <DlPastel className="dl-pastel" topper={Boolean(edad)} />
        <DlHumo className="dl-humo" />
        {edad && <span className="dl-topper" aria-label={`${edad} años`}>{edad}</span>}
        {invitacion?.nombre && (
          <div className={`dl-placa ${invitacion.nombre.length > 18 ? "dl-placa-larga" : ""}`}>
            <p className="dl-placa-nombre">{invitacion.nombre}</p>
            {pases > 0 && (
              <p className="dl-placa-pases">{pases === 1 ? "1 porción para ti" : `${pases} porciones para ti`}</p>
            )}
          </div>
        )}
      </div>

      <div className="dl-mostrador">
        <button type="button" className="dl-soplar" onClick={soplar} disabled={soplando}>
          <DlSoplido className="dl-soplido" />
          <span className="dl-soplar-texto">{soplando ? "¡Pide un deseo!" : "Sopla las velas"}</span>
        </button>
        <p className="dl-pista" aria-live="polite">{soplando ? "Abriendo tu invitación…" : "y abre tu invitación"}</p>
      </div>
    </section>
  );
}

export default function Dulce({ site, contenidoDe, invitacion, onEnviarRSVP, enEditor }) {
  useFuentes(FUENTES);
  // En el panel la entrada se salta para poder ver y editar las secciones.
  const [abierta, setAbierta] = useState(Boolean(enEditor));
  const [rsvpAbierto, setRsvpAbierto] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [aviso, setAviso] = useState("");
  const audioRef = useRef(null);
  const raiz = useAparecer(abierta, "[data-reveal]", "is-in");

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
  const totalSeg = cuenta
    ? ((Number(cuenta.dias) * 24 + Number(cuenta.horas)) * 60 + Number(cuenta.min)) * 60 + Number(cuenta.seg)
    : 0;
  const limite = limiteLegible(info.fechaLimiteConfirmacion || site.fechaLimiteConfirmacion);

  const festejados = (welcome.festejados || []).filter((f) => f && f.nombre);
  const nombre = festejados.length
    ? festejados.map((f) => f.nombre).join(" & ")
    : [welcome.novioEl, welcome.novioElla].filter(Boolean).join(" & ");
  const primerNombre = (festejados[0]?.nombre || welcome.novioEl || "").split(" ")[0];
  const edad = String(festejados[0]?.edad ?? "").trim();
  const varios = festejados.length > 1 || Boolean(welcome.novioEl && welcome.novioElla);

  const audioSrc = site.audioUrl || musica.src;
  const telefono = (info.telefonoConfirmar || "").trim();
  const digitos = telefono.replace(/\D/g, "");
  const cronograma = info.cronogramaModo === "detallado" ? (info.cronograma || []).filter((c) => c && (c.hora || c.titulo)) : [];
  const mensajePrograma = info.cronogramaModo === "mensaje" ? (info.cronogramaMensaje || "").trim() : "";
  const mapa = urlDelMapa(info.mapaEmbed);
  const lugar = [info.lugar, info.direccion].filter(Boolean).join(", ");
  const permitidos = (vestimenta.permitidos || []).filter((p) => p && (p.nombre || (p.colores || []).length));
  const coloresVestir = permitidos.flatMap((p) => p.colores || []).filter(Boolean);
  const evitar = (vestimenta.evitar || []).filter((e) => e && (e.nombre || e.color));
  const padres = [welcome.padreElPadre, welcome.padreElMadre, welcome.padreEllaPadre, welcome.padreEllaMadre].filter(Boolean);
  const grupos = (padrinos.grupos || []).filter((g) => g && (g.personas || []).some(Boolean));
  const fotos = [...(site.fotosSubidas || []), ...(fotosSec.urls || [])].filter(Boolean);
  const enlacesRegalo = (regalos.enlaces || []).filter((e) => e && (e.url || typeof e === "string"));
  const hayRegalos = activo("regalos") && Boolean(regalos.texto || regalos.datosTransferencia || enlacesRegalo.length);
  const haySobres = activo("sobres") && Boolean(sobres.texto);
  const puntos = (importante.items || []).filter(Boolean);
  const preguntas = (faq.items || []).filter((f) => f && f.p);

  // La música arranca con el soplido (el toque del invitado), nunca sola.
  function iniciarMusica() {
    if (enEditor) return;
    audioRef.current?.play().then(() => setSonando(true)).catch(() => {});
  }
  function abrir() {
    setAbierta(true);
    window.scrollTo(0, 0);
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
  // WhatsApp al teléfono del anfitrión; si no hay ninguno, no hay botón.
  const confirmar = invitacion
    ? { grande: "Confirmar asistencia", onClick: () => setRsvpAbierto(true) }
    : digitos
      ? { texto: "Favor confirmar al", grande: telefono, href: `https://wa.me/${digitos.length === 10 ? `57${digitos}` : digitos}` }
      : null;

  // Numeración de las repisas en orden de aparición (N.º 01, 02…).
  let numero = 0;
  const sig = () => ++numero;

  return (
    <div className="dl" ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop preload="auto" />}
      {audioSrc && abierta && (
        <button className={`dl-musica ${sonando ? "dl-batiendo" : ""}`} type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label={sonando ? "Pausar música" : "Reproducir música"}>
          <DlBatidor className="dl-batidor" />
          <span className="dl-musica-marca" aria-hidden="true">{sonando ? Icono.pausa : Icono.musica}</span>
        </button>
      )}

      {!abierta && (
        <Entrada
          nombre={nombre}
          edad={edad}
          antetitulo={welcome.bienvenidaTexto}
          invitacion={invitacion}
          alSoplar={iniciarMusica}
          onAbrir={abrir}
        />
      )}

      {abierta && (
        <main className="dl-cuerpo" aria-labelledby="dl-titulo">
          <header className="dl-hero">
            <DlToldo className="dl-toldo" />
            <div className="dl-letrero">
              {welcome.bienvenidaTexto && <p className="dl-antetitulo">{welcome.bienvenidaTexto}</p>}
              <h1 className="dl-nombre" id="dl-titulo">{nombre}</h1>
              {edad && (
                <p className="dl-edad"><span aria-hidden="true" />{edad} años<span aria-hidden="true" /></p>
              )}
              {welcome.fraseIntro && <p className="dl-frase">{welcome.fraseIntro}</p>}
              {invitacion?.nombre && (
                <p className="dl-para">Tu porción ya está apartada, <b>{invitacion.nombre.split(" ")[0]}</b></p>
              )}
            </div>
          </header>

          {partes && (
            <Repisa n={sig()} id="dl-cuenta" titulo="Faltan" postre={<DlMacarons className="dl-arte" />}>
              {cuenta ? (
                <div className="dl-horno" role="timer" aria-labelledby="dl-cuenta"
                  aria-label={`${cuenta.dias} días, ${Number(cuenta.horas)} horas, ${Number(cuenta.min)} minutos`}>
                  <div className="dl-reloj">
                    <DlTemporizador className="dl-reloj-arte" giro={-totalSeg * 6} />
                    <div className="dl-reloj-centro" aria-hidden="true">
                      <span className="n">{cuenta.dias}</span>
                      <span className="l">{cuenta.dias === "1" ? "día" : "días"}</span>
                    </div>
                  </div>
                  <p className="dl-pantalla" aria-hidden="true">
                    <span><b>{cuenta.horas}</b><small>horas</small></span>
                    <i>:</i>
                    <span><b>{cuenta.min}</b><small>min</small></span>
                    <i>:</i>
                    <span><b>{cuenta.seg}</b><small>seg</small></span>
                  </p>
                </div>
              ) : (
                <p className="dl-llego">¡Llegó el gran día!</p>
              )}
            </Repisa>
          )}

          {(partes || lugar) && (
            <Repisa n={sig()} id="dl-celebracion" titulo={info.tituloSeccion || "La celebración"} postre={<DlTarta className="dl-arte" />}>
              {partes && (
                <div className="dl-fecha">
                  <span className="dl-fecha-sem">{partes.semana}</span>
                  <span className="dl-fecha-dia">{partes.dia}</span>
                  <span className="dl-fecha-mes">{partes.mes} · {partes.anio}</span>
                  <span className="dl-fecha-hora">{partes.hora}</span>
                </div>
              )}
              {lugar && (
                <div className="dl-lugar">
                  {info.lugar && <p className="dl-lugar-nombre">{info.lugar}</p>}
                  {info.direccion && <p className="dl-texto">{info.direccion}</p>}
                  <div className="dl-botones">
                    {info.mapsUrl && <a className="dl-btn" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>}
                    <button className="dl-btn dl-btn-linea" type="button" onClick={() => copiar(lugar, "Dirección copiada")}>{Icono.copiar} Copiar</button>
                  </div>
                  {mapa && (
                    <iframe className="dl-mapa" src={mapa} title={`Mapa de ${info.lugar || "la celebración"}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  )}
                </div>
              )}
            </Repisa>
          )}

          {(cronograma.length > 0 || mensajePrograma) && (
            <Repisa n={sig()} id="dl-programa" titulo={info.tituloItinerario || "El programa"} postre={<DlCopas className="dl-arte" />}>
              {cronograma.length > 0 ? (
                <ol className="dl-programa">
                  {cronograma.map((c, i) => (
                    <li key={i}>
                      <DlMacaronSuelto className="dl-vineta" tono={i} />
                      <span className="dl-hora">{c.hora}</span>
                      <span className="dl-que">{c.titulo}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="dl-texto">{mensajePrograma}</p>
              )}
            </Repisa>
          )}

          {activo("vestimenta") && (vestimenta.titulo || vestimenta.nota || permitidos.length > 0) && (
            <Repisa n={sig()} id="dl-vestimenta" titulo="Código de vestir" postre={<DlMacarons className="dl-arte" colores={coloresVestir} />}>
              {vestimenta.titulo && <p className="dl-destacado">{vestimenta.titulo}</p>}
              {vestimenta.nota && <p className="dl-texto">{vestimenta.nota}</p>}
              {permitidos.length > 0 && (
                <ul className="dl-paleta" aria-label="Colores sugeridos">
                  {permitidos.map((p, i) => (
                    <li key={i}>
                      <span className="dl-muestras">
                        {(p.colores || []).map((c, j) => <i key={j} style={{ background: c }} />)}
                      </span>
                      {p.nombre && <span className="dl-muestra-nombre">{p.nombre}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {evitar.length > 0 && (
                <p className="dl-evitar">
                  <span className="dl-k">Evitar</span>
                  {evitar.map((e, i) => (
                    <span key={i} className="dl-evitar-item">{e.color && <i style={{ background: e.color }} />}{e.nombre}</span>
                  ))}
                </p>
              )}
            </Repisa>
          )}

          {activo("padrinos") && (padres.length > 0 || grupos.length > 0) && (
            <Repisa n={sig()} id="dl-padrinos" titulo={padrinos.titulo || "Con cariño"} postre={<DlCopas className="dl-arte" />}>
              {padres.length > 0 && (
                <div className="dl-grupo">
                  {welcome.padresTexto && <span className="dl-k">{welcome.padresTexto}</span>}
                  <p className="dl-personas">{padres.join(" · ")}</p>
                </div>
              )}
              {grupos.map((g, i) => (
                <div key={i} className="dl-grupo">
                  {g.etiqueta && <span className="dl-k">{g.etiqueta}</span>}
                  <p className="dl-personas">{g.personas.filter(Boolean).join(" · ")}</p>
                </div>
              ))}
            </Repisa>
          )}

          {activo("historia") && historia.texto && (
            <Repisa n={sig()} id="dl-historia" titulo={historia.titulo || "Mi historia"} postre={<DlTarta className="dl-arte" />}>
              <p className="dl-carta">{historia.texto}</p>
              {primerNombre && <p className="dl-firma">{primerNombre}</p>}
            </Repisa>
          )}

          {activo("fotos") && fotos.length > 0 && (
            <Repisa n={sig()} id="dl-fotos" titulo={fotosSec.titulo || "Recuerdos"} postre={<DlMacarons className="dl-arte" />}>
              {fotosSec.subtitulo && <p className="dl-texto">{fotosSec.subtitulo}</p>}
              <div className={`dl-fotos dl-fotos-${Math.min(fotos.length, 3)}`}>
                {fotos.slice(0, 6).map((f, i) => (
                  <figure key={i}><img src={f} alt={`Foto ${i + 1} de ${nombre}`} loading="lazy" /></figure>
                ))}
              </div>
            </Repisa>
          )}

          {(hayRegalos || haySobres) && (
            <Repisa n={sig()} id="dl-regalos" titulo={hayRegalos ? regalos.titulo || "Regalos" : "Lluvia de sobres"} postre={<DlCajita className="dl-arte" />}>
              {hayRegalos && regalos.texto && <p className="dl-texto">{regalos.texto}</p>}
              {hayRegalos && enlacesRegalo.length > 0 && (
                <div className="dl-botones">
                  {enlacesRegalo.map((e, i) => {
                    const href = typeof e === "string" ? e : e.url;
                    const texto = typeof e === "string" ? "Ver lista" : e.tienda || e.nombre || "Ver lista";
                    return <a key={i} className="dl-btn dl-btn-linea" href={href} target="_blank" rel="noopener noreferrer">{Icono.regalo} {texto}</a>;
                  })}
                </div>
              )}
              {hayRegalos && regalos.datosTransferencia && (
                <div className="dl-transferir">
                  <span className="dl-k">Datos para transferir</span>
                  <p>{regalos.datosTransferencia}</p>
                  <button className="dl-btn dl-btn-linea" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>{Icono.copiar} Copiar</button>
                </div>
              )}
              {haySobres && (
                <div className="dl-sobres">
                  <span className="dl-sobres-icono">{Icono.sobre}</span>
                  {hayRegalos && <span className="dl-k">Lluvia de sobres</span>}
                  <p className="dl-texto">{sobres.texto}</p>
                </div>
              )}
            </Repisa>
          )}

          {activo("info_importante") && (puntos.length > 0 || importante.nota) && (
            <Repisa n={sig()} id="dl-info" titulo="Ten en cuenta" postre={<DlCopas className="dl-arte" />}>
              {puntos.length > 0 && <ul className="dl-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
              {importante.nota && <p className="dl-texto dl-nota">{importante.nota}</p>}
            </Repisa>
          )}

          {activo("faq") && preguntas.length > 0 && (
            <Repisa n={sig()} id="dl-faq" titulo="Preguntas" postre={<DlMacarons className="dl-arte" />}>
              <div className="dl-faq">
                {preguntas.map((f, i) => (
                  <details key={i}>
                    <summary>{f.p}</summary>
                    {f.r && <p>{f.r}</p>}
                  </details>
                ))}
              </div>
            </Repisa>
          )}

          {confirmar && (
            <Repisa n={sig()} id="dl-confirmar" titulo="Confirma" className="dl-repisa-rsvp" postre={<DlTarta className="dl-arte" />}>
              <p className="dl-destacado">Te guardo tu porción</p>
              <p className="dl-texto">{varios ? "Cuéntanos" : "Cuéntame"} si vienes para tenerlo todo listo.</p>
              {confirmar.href ? (
                <a className="dl-btn dl-btn-grande" href={confirmar.href} target="_blank" rel="noopener noreferrer">
                  {Icono.whatsapp} <span>{confirmar.texto} <b>{confirmar.grande}</b></span>
                </a>
              ) : (
                <button className="dl-btn dl-btn-grande" type="button" onClick={confirmar.onClick}>{confirmar.grande}</button>
              )}
              {limite && <p className="dl-limite">Confirma antes del <b>{limite}</b></p>}
            </Repisa>
          )}

          <footer className="dl-final" data-reveal>
            <DlCajaCierre className="dl-caja-cierre" sello={edad} />
            <p className="dl-te-espero">{varios ? "¡Los esperamos!" : "¡Te espero!"}</p>
            {nombre && <p className="dl-texto">Con cariño, {nombre}</p>}
          </footer>
        </main>
      )}

      <div className={`dl-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="dl-modal" role="dialog" aria-modal="true" aria-label="Confirmar asistencia" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="dl-modal-caja">
            <div className="dl-modal-tapa" aria-hidden="true">
              <span className="dl-modal-sello">{edad || "♥"}</span>
            </div>
            <button type="button" className="dl-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">
              <svg viewBox="0 0 24 24" {...trazo} strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <span className="dl-modal-cordel" aria-hidden="true" />
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
