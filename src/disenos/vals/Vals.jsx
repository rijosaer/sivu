import { useMemo, useRef, useState } from "react";
import "./vals.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer,
} from "../comun";
import {
  VrTelon, VrSalon, VrRosas, VrQuince, VrTiara, VrZapatillas, VrCapital, VrEsquina, VrFilete,
  VrBorla, VrCordonLapiz, VrRelojPie, VrCajita,
} from "./arte";

// Diseño «Vals lila» (XV años): cuento de hadas fino en lila y plata, rosas
// de lavanda y blancas y un salón con candelabro. Todo el arte es SVG (arte.jsx).
// - Entrada: un telón de terciopelo lila con pliegues, cenefa y borlas de
//   plata cubre la pantalla; al centro una cartela bordada con el nombre y,
//   colgando de ella, el carnet de baile del invitado («Este vals es para…»,
//   con sus pases como piezas ya reservadas a lápiz). Al lado cuelga una
//   borla de plata: al jalarla, las dos mitades se recogen hacia los lados y
//   aparece el salón con la quinceañera de espaldas, de vestido lila.
// - Cuerpo: un «libro de cuento». Cada sección es una página de papel marfil
//   con orla, letra capital ornamentada en plata, viñeta de rosas y folio; las
//   páginas entran girando sobre el lomo. La cuenta regresiva es un reloj de
//   pie con un índice de lo que falta; el cierre, el carnet de baile cerrado
//   con «Fin»; la música, una cajita de música; la confirmación, una página.
// Colores del tema: principal (gold) = lila, claro = lila claro, oscuro =
// lila profundo, papel = fondo, mármol = tarjetas, sello = plata.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Karla:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Norican&family=Prata&display=swap";

// Piezas del carnet de baile: una línea ya reservada por cada pase.
const PIEZAS = ["Vals", "Pasillo", "Bambuco", "Mazurca", "Polca", "Contradanza", "Danza", "Bolero", "Merengue", "Cumbia"];

const ROMANOS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI"];

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
const Icono = {
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  musica: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>,
  pausa: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>,
  sobre: <svg viewBox="0 0 48 36" {...trazo} strokeWidth="1.3" aria-hidden="true"><rect x="3" y="5" width="42" height="28" rx="2" /><path d="M3 7l21 15L45 7" /><path d="M3 33l15-13M45 33L30 20" /><circle cx="24" cy="22" r="3.4" fill="currentColor" /></svg>,
  whatsapp: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-1 .8c-1-.5-1.8-1.3-2.3-2.3l.8-1-1-2z" /></svg>,
};

// Solo deja pasar mapas incrustados de Google Maps.
function urlDelMapa(valor) {
  if (!valor) return "";
  const texto = String(valor).trim();
  const conSrc = texto.match(/src\s*=\s*["']([^"']+)["']/i);
  const url = conSrc ? conSrc[1] : texto;
  return /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(url) ? url : "";
}

// Separa el título en letra capital + resto («¿Preguntas?» → P + reguntas?).
function partirTitulo(titulo) {
  const m = titulo.match(/\p{L}/u);
  if (!m) return { letra: "", resto: titulo };
  return { letra: m[0].toUpperCase(), resto: titulo.slice(m.index + 1).replace(/^\s/, " ") };
}

// Una página del libro: orla, capítulo, capital iluminada, viñeta y folio.
function Pagina({ n, titulo, id, vineta = "ramo", children }) {
  const { letra, resto } = partirTitulo(titulo);
  return (
    <section className="vr-pagina" aria-labelledby={id} data-reveal style={{ "--lado": n % 2 ? 1 : -1 }}>
      <article className="vr-hoja">
        <VrEsquina className="vr-esq vr-esq-1" />
        <VrEsquina className="vr-esq vr-esq-2" />
        <VrEsquina className="vr-esq vr-esq-3" />
        <VrEsquina className="vr-esq vr-esq-4" />
        <VrRosas className={`vr-vineta vr-vineta-${vineta}`} variante={vineta === "ramo" ? "ramo" : "rama"} />
        <h2 className="vr-titulo" id={id} aria-label={titulo}>
          {letra && <VrCapital letra={letra} className="vr-capital" />}
          <span aria-hidden="true">{resto}</span>
        </h2>
        <p className="vr-capitulo" aria-hidden="true">capítulo {ROMANOS[n] || n}</p>
        <div className="vr-contenido">{children}</div>
        <p className="vr-folio" aria-hidden="true"><VrFilete className="vr-folio-filete" /><span>{n}</span></p>
      </article>
    </section>
  );
}

// Carnet de baile del invitado: cuelga de un cordón de plata con su lapicito.
// Cada pase es una pieza ya reservada a lápiz.
function Carnet({ invitacion, className = "" }) {
  const n = Math.max(pasesDe(invitacion), 1);
  const lineas = PIEZAS.slice(0, Math.min(n, PIEZAS.length));
  return (
    <div className={`vr-carnet ${className}`}>
      <VrCordonLapiz className="vr-carnet-cordon" />
      <div className="vr-carnet-tarjeta">
        <p className="vr-carnet-para">Este vals es para…</p>
        <p className="vr-carnet-nombre">{invitacion.nombre}</p>
        <ol className="vr-carnet-lineas" aria-label={`${n} ${n === 1 ? "pase reservado" : "pases reservados"}`}>
          {lineas.map((pieza, i) => (
            <li key={pieza} style={{ "--i": i }}>
              <span className="vr-carnet-n">{i + 1}.</span>
              <span className="vr-carnet-pieza">{pieza}</span>
              <span className="vr-carnet-puntos" aria-hidden="true" />
              <span className="vr-carnet-firma">reservado</span>
            </li>
          ))}
        </ol>
        <p className="vr-carnet-pie">{n === 1 ? "Un lugar a tu nombre" : `${n} lugares a tu nombre`}</p>
      </div>
    </div>
  );
}

// Borla de plata que se jala (también se puede arrastrar hacia abajo).
function Jalar({ abierto, onAbrir }) {
  const [jalando, setJalando] = useState(false);
  const [tiro, setTiro] = useState(0);
  const inicio = useRef(null);
  function jalar() {
    if (abierto || jalando) return;
    setJalando(true);
    setTiro(0);
    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setTimeout(onAbrir, quieto ? 0 : 560);
  }
  return (
    <>
      <div className={`vr-jalar ${jalando ? "is-jalando" : ""} ${tiro ? "is-arrastre" : ""}`} style={{ "--tiro": `${tiro}px` }}>
        <span className="vr-jalar-cordon" aria-hidden="true" />
        <button
          type="button" className="vr-jalar-borla" onClick={jalar} tabIndex={abierto ? -1 : 0}
          aria-label="Jala la borla para abrir el telón"
          onPointerDown={(e) => { inicio.current = e.clientY; }}
          onPointerMove={(e) => { if (inicio.current != null) setTiro(Math.max(0, Math.min(70, e.clientY - inicio.current))); }}
          onPointerUp={() => { inicio.current = null; }}
          onPointerCancel={() => { inicio.current = null; setTiro(0); }}
        >
          <VrBorla className="vr-jalar-svg" />
        </button>
      </div>
      <p className="vr-jalar-texto" aria-hidden="true">jala la borla<svg viewBox="0 0 40 24"><path d="M2 18 C 14 20 26 16 34 6 M27 6 H34 V13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></p>
      {!abierto && <button type="button" className="vr-toque" onClick={jalar} tabIndex={-1} aria-hidden="true" />}
    </>
  );
}

function Escenario({ abierto, onAbrir, welcome, partes, invitacion }) {
  const nombre = welcome.novioEl || "";
  const antetitulo = welcome.bienvenidaTexto || "Mis XV años";
  return (
    <section className={`vr-escena ${abierto ? "is-abierto" : ""}`} aria-label={abierto ? "Portada" : "Abrir invitación"}>
      <VrSalon className="vr-salon" />
      <div className="vr-hero">
        <p className="vr-hero-ante">{antetitulo}</p>
        <h1 className="vr-hero-nombre">{nombre}</h1>
        {partes && (
          <p className="vr-hero-fecha">
            <span>{partes.semana}</span> {partes.dia} de {partes.mes} · {partes.anio}
          </p>
        )}
      </div>
      <VrQuince className="vr-quince" />
      <VrRosas className="vr-escena-rosas vr-escena-rosas-izq" />
      <VrRosas className="vr-escena-rosas vr-escena-rosas-der" />
      <p className="vr-desliza" aria-hidden="true">desliza y abre el cuento<span /></p>

      <div className="vr-telon vr-telon-izq" aria-hidden="true">
        <div className="vr-tela"><VrTelon lado="izq" className="vr-tela-svg" /></div>
      </div>
      <div className="vr-telon vr-telon-der" aria-hidden="true">
        <div className="vr-tela"><VrTelon lado="der" className="vr-tela-svg" /></div>
      </div>
      <VrTelon lado="amarre" className="vr-amarre vr-amarre-izq" />
      <VrTelon lado="amarre" className="vr-amarre vr-amarre-der" />
      <VrTelon lado="cenefa" className="vr-cenefa" />

      <div className="vr-cerrado" aria-hidden={abierto}>
        <div className="vr-cartela">
          <VrTiara className="vr-cartela-tiara" />
          <p className="vr-cartela-ante">{antetitulo}</p>
          <p className="vr-cartela-nombre">{nombre}</p>
          <VrFilete className="vr-cartela-filete" />
          {partes && <p className="vr-cartela-fecha">{partes.dia} de {partes.mes} · {partes.anio}</p>}
        </div>
        {invitacion?.nombre && <Carnet invitacion={invitacion} className="vr-carnet-telon" />}
      </div>
      <Jalar abierto={abierto} onAbrir={onAbrir} />
    </section>
  );
}

export default function Vals({ site, contenidoDe, invitacion, onEnviarRSVP, enEditor }) {
  useFuentes(FUENTES);
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
  const limite = limiteLegible(info.fechaLimiteConfirmacion || site.fechaLimiteConfirmacion);
  const nombre = welcome.novioEl || "";
  const audioSrc = site.audioUrl || musica.src;
  const telefono = (info.telefonoConfirmar || "").trim();
  const digitos = telefono.replace(/\D/g, "");
  const cronograma = info.cronogramaModo === "detallado" ? (info.cronograma || []).filter((c) => c && (c.hora || c.titulo)) : [];
  const mensajePrograma = info.cronogramaModo === "mensaje" ? info.cronogramaMensaje : "";
  const padres = [welcome.padreElPadre, welcome.padreElMadre, welcome.padreEllaPadre, welcome.padreEllaMadre].filter(Boolean);
  const grupos = activo("padrinos") ? (padrinos.grupos || []).filter((g) => g && (g.personas || []).some(Boolean)) : [];
  const permitidos = (vestimenta.permitidos || []).filter((p) => p && (p.colores || []).length);
  const evitar = (vestimenta.evitar || []).filter((e) => e && e.color);
  const fotos = [...(site.fotosSubidas || []), ...(activo("fotos") ? fotosSec.urls || [] : [])].filter(Boolean);
  const enlaces = (regalos.enlaces || []).filter((e) => e?.url);
  const puntos = (importante.items || []).filter(Boolean);
  const preguntas = (faq.items || []).filter((f) => f && f.p);
  const mapa = urlDelMapa(info.mapaEmbed);
  const lugar = [info.lugar, info.direccion].filter(Boolean).join(", ");

  function abrir() {
    if (abierta) return;
    setAbierta(true);
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

  const confirmar = invitacion
    ? { grande: "Confirmar asistencia", onClick: () => setRsvpAbierto(true) }
    : digitos
      ? { texto: "Favor confirmar al", grande: telefono, href: `https://wa.me/${digitos.length === 10 ? `57${digitos}` : digitos}` }
      : null;

  // Las páginas se numeran según las que de verdad se muestran.
  const paginas = [];
  const agregar = (clave, titulo, contenido, vineta) => paginas.push({ clave, titulo, contenido, vineta });

  if (welcome.fraseIntro || partes) {
    agregar("inicio", "Una noche de cuento", (
      <>
        {welcome.fraseIntro && <p className="vr-lead">{welcome.fraseIntro}</p>}
        {partes && (
          <div className="vr-fecha">
            <span className="vr-fecha-lado">{partes.semana}</span>
            <span className="vr-fecha-dia">{partes.dia}</span>
            <span className="vr-fecha-lado">{partes.hora}</span>
            <span className="vr-fecha-mes">{partes.mes} · {partes.anio}</span>
          </div>
        )}
        {partes && (cuenta ? (
          <div className="vr-reloj" role="timer" aria-label={`Faltan ${cuenta.dias} días, ${cuenta.horas} horas y ${cuenta.min} minutos`}>
            <VrRelojPie className="vr-reloj-svg" horas={cuenta.horas} min={cuenta.min} seg={cuenta.seg} />
            <div className="vr-indice" aria-hidden="true">
              <p className="vr-indice-titulo">Lo que falta del cuento</p>
              <ol>
                {[["dias", "Días"], ["horas", "Horas"], ["min", "Minutos"], ["seg", "Segundos"]].map(([k, l]) => (
                  <li key={k}><span>{l}</span><i /><b>{String(cuenta[k]).padStart(k === "dias" ? 1 : 2, "0")}</b></li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          <p className="vr-llego">¡Llegó el gran día!</p>
        ))}
      </>
    ));
  }

  if (lugar) {
    agregar("lugar", info.tituloSeccion && !/informaci/i.test(info.tituloSeccion) ? info.tituloSeccion : "El lugar", (
      <>
        {info.lugar && <p className="vr-destacado">{info.lugar}</p>}
        {info.direccion && <p className="vr-texto">{info.direccion}</p>}
        {mapa && <iframe className="vr-mapa" src={mapa} title={`Mapa de ${info.lugar || "el lugar"}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}
        <div className="vr-botones">
          {info.mapsUrl && <a className="vr-btn" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>}
          <button className="vr-btn vr-btn-linea" type="button" onClick={() => copiar(lugar, "Dirección copiada")}>{Icono.copiar} Copiar dirección</button>
        </div>
      </>
    ), "rama");
  }

  if (cronograma.length > 0 || mensajePrograma) {
    agregar("programa", info.tituloItinerario || "El programa", cronograma.length > 0 ? (
      <ol className="vr-programa">
        {cronograma.map((c, i) => (
          <li key={i}><span className="vr-programa-hora">{c.hora}</span><span className="vr-puntos" aria-hidden="true" /><span className="vr-programa-que">{c.titulo}</span></li>
        ))}
      </ol>
    ) : <p className="vr-texto">{mensajePrograma}</p>);
  }

  if (padres.length > 0 || grupos.length > 0) {
    agregar("familia", padrinos.titulo || "Mi familia", (
      <>
        {padres.length > 0 && (
          <div className="vr-grupo">
            <span className="vr-etiqueta">{welcome.padresTexto || "Con la bendición de mis padres"}</span>
            <p className="vr-nombres-guion">{padres.join(" & ")}</p>
          </div>
        )}
        {grupos.map((g, i) => (
          <div className="vr-grupo" key={i}>
            {g.etiqueta && <span className="vr-etiqueta">{g.etiqueta}</span>}
            <p className="vr-destacado">{g.personas.filter(Boolean).join(" · ")}</p>
          </div>
        ))}
      </>
    ), "rama");
  }

  if (activo("vestimenta") && (vestimenta.titulo || vestimenta.nota || permitidos.length || evitar.length)) {
    agregar("vestimenta", "Vestimenta", (
      <>
        <VrZapatillas className="vr-zapatillas" />
        {vestimenta.titulo && <p className="vr-destacado vr-grande">{vestimenta.titulo}</p>}
        {vestimenta.nota && <p className="vr-nota">{vestimenta.nota}</p>}
        {permitidos.map((p, i) => (
          <div className="vr-paleta" key={i}>
            {p.nombre && <span className="vr-etiqueta">{p.nombre}</span>}
            <div className="vr-muestras">{p.colores.map((c, j) => <i key={j} style={{ background: c }} />)}</div>
          </div>
        ))}
        {evitar.length > 0 && (
          <div className="vr-paleta">
            <span className="vr-etiqueta">Evitar</span>
            <div className="vr-muestras">
              {evitar.map((e, j) => <span key={j} className="vr-evitar"><i style={{ background: e.color }} />{e.nombre}</span>)}
            </div>
          </div>
        )}
      </>
    ));
  }

  if (activo("historia") && historia.texto) {
    agregar("historia", historia.titulo || "Érase una vez", (
      <>
        <p className="vr-cuento">{historia.texto}</p>
        {nombre && <p className="vr-firma">{nombre.split(" ")[0]}</p>}
      </>
    ), "rama");
  }

  if (fotos.length > 0) {
    agregar("fotos", fotosSec.titulo || "Recuerdos", (
      <>
        {fotosSec.subtitulo && <p className="vr-texto">{fotosSec.subtitulo}</p>}
        <div className="vr-fotos">
          {fotos.slice(0, 6).map((f, i) => (
            <figure key={f + i} className="vr-foto"><img src={f} alt={`Recuerdo ${i + 1} de ${nombre || "la quinceañera"}`} loading="lazy" /></figure>
          ))}
        </div>
      </>
    ));
  }

  if (activo("regalos") && (regalos.texto || enlaces.length || regalos.datosTransferencia)) {
    agregar("regalos", regalos.titulo || "Mesa de regalos", (
      <>
        {regalos.texto && <p className="vr-texto">{regalos.texto}</p>}
        {enlaces.length > 0 && (
          <div className="vr-botones">
            {enlaces.map((e, i) => <a key={i} className="vr-btn vr-btn-linea" href={e.url} target="_blank" rel="noopener noreferrer">{e.tienda || "Ver lista"}</a>)}
          </div>
        )}
        {regalos.datosTransferencia && (
          <div className="vr-transferir">
            <span className="vr-etiqueta">Datos para transferir</span>
            <p>{regalos.datosTransferencia}</p>
            <button className="vr-btn vr-btn-linea" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>{Icono.copiar} Copiar</button>
          </div>
        )}
      </>
    ), "rama");
  }

  if (activo("sobres") && sobres.texto) {
    agregar("sobres", "Lluvia de sobres", (
      <>
        <span className="vr-sobre">{Icono.sobre}</span>
        <p className="vr-texto">{sobres.texto}</p>
      </>
    ));
  }

  if (activo("info_importante") && (puntos.length > 0 || importante.nota)) {
    agregar("info", "Ten en cuenta", (
      <>
        {puntos.length > 0 && <ul className="vr-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
        {importante.nota && <p className="vr-nota">{importante.nota}</p>}
      </>
    ), "rama");
  }

  if (activo("faq") && preguntas.length > 0) {
    agregar("faq", "Preguntas frecuentes", (
      <div className="vr-faq">
        {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary><p>{f.r}</p></details>)}
      </div>
    ));
  }

  if (activo("musica") && audioSrc) {
    agregar("musica", musica.titulo || "Mi vals", (
      <>
        <p className="vr-texto">Ponle música a la lectura: es la canción de mi vals.</p>
        <button className="vr-btn" type="button" aria-pressed={sonando} onClick={alternarMusica}>
          {sonando ? Icono.pausa : Icono.musica} {sonando ? "Pausar la música" : "Escuchar"}
        </button>
      </>
    ), "rama");
  }

  if (confirmar) {
    agregar("confirmar", "Confirma tu asistencia", (
      <>
        {invitacion?.nombre && <Carnet invitacion={invitacion} className="vr-carnet-pagina" />}
        {confirmar.href ? (
          <a className="vr-btn vr-btn-grande" href={confirmar.href} target="_blank" rel="noopener noreferrer">
            {Icono.whatsapp} <span>{confirmar.texto} <b>{confirmar.grande}</b></span>
          </a>
        ) : (
          <button className="vr-btn vr-btn-grande" type="button" onClick={confirmar.onClick}>{confirmar.grande}</button>
        )}
        {limite && <p className="vr-limite">Confirma antes del <b>{limite}</b></p>}
      </>
    ));
  }

  return (
    <div className="vr" ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop preload="none" />}
      {audioSrc && abierta && (
        <button className={`vr-musica ${sonando ? "is-sonando" : ""}`} type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label={sonando ? "Pausar la música" : "Reproducir la música"}>
          <VrCajita className="vr-musica-caja" />
        </button>
      )}

      <Escenario abierto={abierta} onAbrir={abrir} welcome={welcome} partes={partes} invitacion={invitacion} />

      {abierta && (
        <main className="vr-libro">
          {paginas.map((p, i) => (
            <Pagina key={p.clave} n={i + 1} titulo={p.titulo} id={`vr-${p.clave}`} vineta={p.vineta}>
              {p.contenido}
            </Pagina>
          ))}
          <footer className="vr-fin" data-reveal>
            <p className="vr-fin-texto">…y la noche apenas comienza.</p>
            <div className="vr-fin-carnet">
              <div className="vr-fin-interior" aria-hidden="true">
                {PIEZAS.slice(0, 4).map((p) => <span key={p}>{p}</span>)}
              </div>
              <div className="vr-fin-tapa">
                <div className="vr-fin-cara">
                  <VrEsquina className="vr-esq vr-esq-1" />
                  <VrEsquina className="vr-esq vr-esq-2" />
                  <VrEsquina className="vr-esq vr-esq-3" />
                  <VrEsquina className="vr-esq vr-esq-4" />
                  <span className="vr-fin-de">carnet de baile</span>
                  <p className="vr-fin-fin">Fin</p>
                  <VrFilete className="vr-fin-filete" />
                  {nombre && <p className="vr-fin-firma">{nombre}</p>}
                </div>
                <div className="vr-fin-dorso" aria-hidden="true" />
              </div>
              <VrCordonLapiz className="vr-fin-cordon" />
            </div>
            <p className="vr-fin-guion">¡Te espero!</p>
            <VrRosas className="vr-fin-rosas" />
          </footer>
        </main>
      )}

      <div className={`vr-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="vr-modal" role="dialog" aria-modal="true" aria-label="Confirmar asistencia" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="vr-modal-caja">
            <button type="button" className="vr-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar"><span aria-hidden="true">×</span></button>
            <VrEsquina className="vr-esq vr-esq-1" />
            <VrEsquina className="vr-esq vr-esq-4" />
            <p className="vr-modal-cabeza">una página para tu respuesta</p>
            <VrFilete className="vr-modal-filete" />
            <RSVP
              invitacion={invitacion}
              fechaLimite={info.fechaLimiteConfirmacion || site.fechaLimiteConfirmacion}
              opciones={{
                mostrarRestriccion: info.mostrarRestriccion !== false,
                mostrarObservaciones: info.mostrarObservaciones !== false,
              }}
              onSubmit={onEnviarRSVP}
            />
            <p className="vr-modal-folio" aria-hidden="true">{paginas.length + 1}</p>
          </div>
        </div>
      )}
    </div>
  );
}
