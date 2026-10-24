import { useMemo, useRef, useState } from "react";
import "./ensueno.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer, enlaceCalendario, alTocarPortada } from "../comun";
import { Defs } from "./arte";
import fondo from "./arte/fondo.webp";
import guirnalda from "./arte/guirnalda.webp";
import ramo from "./arte/ramo.webp";
import ramito from "./arte/ramito.webp";
import mariposa from "./arte/mariposa.webp";
import palacio from "./arte/palacio.webp";
import nubes from "./arte/nubes.webp";
import sobreInterior from "./arte/sobre-interior.webp";
import sobreBolsillo from "./arte/sobre-bolsillo.webp";
import sobreSolapa from "./arte/sobre-solapa.webp";
import sobreSolapaDorso from "./arte/sobre-solapa-dorso.webp";
import sobreCerrado from "./arte/sobre-cerrado.webp";

// Diseño «Ensueño»: acuarela menta y durazno con un palacio entre nubes. Nació
// de la maqueta de XV de la landing y se rehízo con acuarelas pintadas (las
// ilustraciones vectoriales de la maqueta se veían planas). Lee las mismas
// secciones del panel que los demás diseños; los colores salen del tema
// (principal = menta oscuro, claro = menta, sello = durazno oscuro, mármol =
// durazno claro).

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Nunito+Sans:wght@400;600;700&family=Pinyon+Script&display=swap";

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
const Icono = {
  calendario: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>,
  reloj: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>,
  vestido: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9.5 3h5l-1 5 5 13h-13l5-13z" /><path d="M10.5 8h3" /></svg>,
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  musica: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>,
  pausa: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>,
};

function Arte({ src, className }) {
  return <img src={src} alt="" aria-hidden="true" className={className} />;
}

function Ornamento() {
  return <svg className="ornament" aria-hidden="true"><use href="#ornament" /></svg>;
}

function Encabezado({ antetitulo, titulo, guion, id }) {
  return (
    <div className="section-head od-stack">
      {antetitulo && <p className="eyebrow">{antetitulo}</p>}
      <h2 id={id}>
        {titulo} {guion && <span className="script">{guion}</span>}
      </h2>
      <Ornamento />
    </div>
  );
}

function Portada({ welcome, invitacion, monograma, onAbrir }) {
  const [abriendo, setAbriendo] = useState(false);
  const pases = pasesDe(invitacion);
  function abrir() {
    if (abriendo) return;
    setAbriendo(true);
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(onAbrir, reducido ? 300 : 2700);
  }
  return (
    <section className={`en-portada ${abriendo ? "en-abriendo" : ""}`} aria-labelledby="gate-title" onClick={alTocarPortada(abrir)}>
      <Arte src={ramo} className="en-ramo en-ramo-sup" />
      <Arte src={ramo} className="en-ramo en-ramo-inf" />
      <div className="en-portada-in">
        <svg className="crest" aria-hidden="true"><use href="#crest" /></svg>
        <p className="eyebrow">{welcome.bienvenidaTexto || "Mis XV años"}</p>
        <h1 className="en-portada-nombre" id="gate-title">{welcome.novioEl}</h1>
        {invitacion?.nombre && <p className="en-para">Para: <b>{invitacion.nombre}</b></p>}
        <button type="button" className="en-sobre" onClick={abrir} aria-label="Abrir la invitación">
          <span className="en-sobre-sombra" />
          <img src={sobreInterior} alt="" className="en-sobre-interior" />
          <span className="en-sobre-carta">
            <svg className="crest-mini" aria-hidden="true"><use href="#crest" /></svg>
            <span className="en-carta-nombre">{(welcome.novioEl || "").split(" ")[0]}</span>
          </span>
          <img src={sobreBolsillo} alt="" className="en-sobre-bolsillo" />
          <span className="en-sobre-solapa">
            <img src={sobreSolapa} alt="" className="en-solapa-cara" />
            <img src={sobreSolapaDorso} alt="" className="en-solapa-cara en-solapa-dorso" />
          </span>
          <span className="en-sello"><span>{monograma}</span></span>
        </button>
        <p className="en-toca">Toca el sello para abrir tu invitación</p>
        {pases > 0 && (
          <p className="en-pases">
            Hemos reservado <b>{pases}</b> {pases === 1 ? "pase en tu honor" : "pases en tu honor"}
          </p>
        )}
      </div>
    </section>
  );
}

export default function Ensueno({ site, contenidoDe, invitacion, enEditor, onEnviarRSVP }) {
  useFuentes(FUENTES);
  const [abierta, setAbierta] = useState(enEditor);
  const [rsvpAbierto, setRsvpAbierto] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [aviso, setAviso] = useState("");
  const audioRef = useRef(null);
  const raiz = useAparecer(abierta, "[data-reveal]", "is-in");

  const welcome = contenidoDe("welcome");
  const info = contenidoDe("informacion_boda");
  const vestimenta = contenidoDe("vestimenta");
  const padrinos = contenidoDe("padrinos");
  const sobres = contenidoDe("sobres");
  const regalos = contenidoDe("regalos");
  const historia = contenidoDe("historia");
  const importante = contenidoDe("info_importante");
  const faq = contenidoDe("faq");
  const musica = contenidoDe("musica");
  const activo = (tipo) => site.secciones.some((s) => s.tipo === tipo && s.activo !== false);

  const partes = useMemo(() => partesFecha(info.fecha), [info.fecha]);
  const cuenta = useCuentaRegresiva(partes?.fecha);
  const limite = limiteLegible(info.fechaLimiteConfirmacion || site.fechaLimiteConfirmacion);
  const esXV = site.invitacion?.tipoEvento === "xv";
  const nombres = [welcome.novioEl, welcome.novioElla].filter(Boolean);
  const monograma = esXV ? "XV" : nombres.map((n) => n.trim().charAt(0).toUpperCase()).join("") || "♥";
  const audioSrc = site.audioUrl || musica.src;
  const cronograma = info.cronogramaModo === "detallado" ? info.cronograma || [] : [];
  const padres = [welcome.padreElPadre, welcome.padreElMadre].filter(Boolean).join(" y ");
  const grupos = (padrinos.grupos || []).filter((g) => g && (g.personas || []).some(Boolean) && !/padres/i.test(g.etiqueta || ""));
  const puntos = (importante.items || []).filter(Boolean);
  const preguntas = (faq.items || []).filter((f) => f && f.p);
  const lugar = [info.lugar, info.direccion].filter(Boolean).join(", ");
  const calendario = enlaceCalendario({
    titulo: `${welcome.bienvenidaTexto || ""} ${nombres.join(" & ")}`.trim(),
    fecha: partes?.fecha,
    lugar,
  });

  function abrir() {
    setAbierta(true);
    window.scrollTo(0, 0);
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

  return (
    <div className="en" ref={raiz} style={{ "--en-fondo": `url(${fondo})` }}>
      <Defs monograma={monograma} />
      <div className="en-destellos" aria-hidden="true" />
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop />}
      {audioSrc && abierta && (
        <button className="music-btn" type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label="Música de fondo">
          {sonando ? Icono.pausa : Icono.musica}
          <span>{sonando ? "Pausar" : "Música"}</span>
        </button>
      )}

      {!abierta && <Portada welcome={welcome} invitacion={invitacion} monograma={monograma} onAbrir={abrir} />}

      {abierta && (
        <main className="en-cuerpo" aria-labelledby="invite-title">
          <Arte src={guirnalda} className="en-guirnalda" />
          <Arte src={mariposa} className="en-mariposa en-mariposa-1" />

          <header className="hero od-stack">
            <svg className="crest" aria-hidden="true"><use href="#crest" /></svg>
            <p className="eyebrow">{welcome.bienvenidaTexto || "Mis XV años"}</p>
            <div className="stage">
              <div className="arch">
                <div className="arch-inner">
                  <img src={palacio} alt="Palacio entre nubes pintado en acuarela" className="en-palacio" />
                  <div className="petals" aria-hidden="true">
                    {["p1", "p2", "p3", "p4"].map((p) => <svg key={p} className={`petal ${p}`}><use href="#petal" /></svg>)}
                  </div>
                </div>
              </div>
              <Arte src={ramito} className="en-arco-flor en-arco-flor-izq" />
              <Arte src={ramito} className="en-arco-flor en-arco-flor-der" />
            </div>
            <h1 className="name" id="invite-title">
              {nombres[0]}
              {nombres[1] && <><br /><span className="en-y">&amp;</span> {nombres[1]}</>}
            </h1>
            <Ornamento />
            {welcome.fraseIntro && <p className="quote">{welcome.fraseIntro}</p>}
            {partes && (
              <div className="date-plate od-stack">
                <span className="wd">{partes.semana}</span>
                <span className="big od-nowrap">{partes.dia} de {partes.mes}</span>
                <span className="small"><span className="od-nowrap">{partes.anio}</span> · <span className="od-nowrap">{partes.hora}</span></span>
              </div>
            )}
          </header>

          {partes && (
            <section className="section" aria-labelledby="cd-title" data-reveal>
              <Encabezado antetitulo="La cuenta regresiva" titulo="Faltan" guion="poquito" id="cd-title" />
              {cuenta ? (
                <div className="countdown od-grid" role="timer" aria-labelledby="cd-title">
                  <div className="window od-stat"><span className="n">{cuenta.dias}</span><span className="l">Días</span></div>
                  <div className="window od-stat"><span className="n">{cuenta.horas}</span><span className="l">Horas</span></div>
                  <div className="window od-stat"><span className="n">{cuenta.min}</span><span className="l">Min</span></div>
                  <div className="window od-stat"><span className="n">{cuenta.seg}</span><span className="l">Seg</span></div>
                </div>
              ) : (
                <p className="countdown-done">¡Llegó el gran día!</p>
              )}
            </section>
          )}

          <section className="section" aria-labelledby="details-title" data-reveal>
            <Arte src={mariposa} className="en-mariposa en-mariposa-2" />
            <Encabezado antetitulo="La celebración" titulo="Una noche" guion="soñada" id="details-title" />
            <div className="vgrid od-grid">
              {partes && (
                <>
                  <div className="vcard od-stack"><span className="en-ico">{Icono.calendario}</span><span className="k">Fecha</span><span className="v od-nowrap">{partes.semanaCorta} {partes.dia} de {partes.mes}</span></div>
                  <div className="vcard od-stack"><span className="en-ico">{Icono.reloj}</span><span className="k">Hora</span><span className="v od-nowrap">{partes.hora}</span></div>
                </>
              )}
              {activo("vestimenta") && vestimenta.titulo && (
                <div className="vcard wide od-stack"><span className="en-ico">{Icono.vestido}</span><span className="k">Dress code</span><span className="v">{vestimenta.titulo}</span></div>
              )}
              {lugar && (
                <div className="vcard wide od-stack"><span className="en-ico">{Icono.pin}</span><span className="k">Lugar</span><span className="v">{info.lugar || info.direccion}</span></div>
              )}
            </div>
            {activo("vestimenta") && vestimenta.nota && <p className="en-nota">{vestimenta.nota}</p>}

            {(padres || grupos.length > 0) && (
              <div className="card arched family od-stack">
                <Arte src={ramito} className="en-familia-flor" />
                {padres && (
                  <div className="od-stat"><span className="k">{welcome.padresTexto || "Con la bendición de mis padres"}</span><span className="who">{padres}</span></div>
                )}
                {grupos.map((g, i) => (
                  <div key={i} className="od-stack en-grupo">
                    {(padres || i > 0) && <span className="amp" aria-hidden="true">&amp;</span>}
                    <div className="od-stat"><span className="k">{g.etiqueta}</span><span className="who">{g.personas.filter(Boolean).join(" y ")}</span></div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Arte src={ramito} className="en-separador" />

          {cronograma.length > 0 && (
            <section className="section" aria-labelledby="prog-title" data-reveal>
              <Encabezado antetitulo={info.tituloItinerario || "El programa"} titulo="Momento a" guion="momento" id="prog-title" />
              <ol className="card en-programa">
                {cronograma.map((c, i) => (
                  <li key={i}><span className="en-hora">{c.hora}</span><span className="en-punto" aria-hidden="true" /><span>{c.titulo}</span></li>
                ))}
              </ol>
            </section>
          )}

          {lugar && (
            <section className="section" aria-labelledby="map-title" data-reveal>
              <Encabezado antetitulo="Ubicación" titulo="Cómo" guion="llegar" id="map-title" />
              <div className="card en-lugar od-stack">
                <span className="en-ico en-ico-grande">{Icono.pin}</span>
                <div className="od-field">
                  <span className="v">{info.lugar}</span>
                  {info.direccion && <span className="helper">{info.direccion}</span>}
                </div>
                <div className="pair od-grid">
                  {info.mapsUrl ? (
                    <a className="btn btn-secondary" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>
                  ) : <span />}
                  <button className="btn btn-secondary" type="button" onClick={() => copiar(lugar, "Dirección copiada")}>{Icono.copiar} Copiar</button>
                </div>
                {calendario && (
                  <a className="btn btn-ghost" href={calendario} target="_blank" rel="noopener noreferrer">{Icono.calendario} Agregar al calendario</a>
                )}
              </div>
            </section>
          )}

          {activo("historia") && historia.texto && (
            <section className="section" aria-labelledby="hist-title" data-reveal>
              <Arte src={mariposa} className="en-mariposa en-mariposa-3" />
              <Encabezado antetitulo={historia.titulo || "Mi historia"} titulo="Un cuento" guion="hecho realidad" id="hist-title" />
              <div className="card en-texto"><p className="lead">{historia.texto}</p></div>
            </section>
          )}

          {((activo("sobres") && sobres.texto) || (activo("regalos") && (regalos.texto || regalos.datosTransferencia))) && (
            <section className="section" aria-labelledby="gift-title" data-reveal>
              <Encabezado antetitulo="Regalos" titulo="Mi" guion="deseo" id="gift-title" />
              <div className="card gift od-stack">
                <img src={sobreCerrado} alt="" aria-hidden="true" className="en-regalo-sobre" />
                <p className="lead">{(activo("sobres") && sobres.texto) || regalos.texto}</p>
                {activo("regalos") && regalos.datosTransferencia && (
                  <div className="gift-row od-row">
                    <div className="od-field od-fill">
                      <span className="k">Datos para transferir</span>
                      <span className="v">{regalos.datosTransferencia}</span>
                    </div>
                    <button className="btn btn-secondary od-fixed" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>Copiar</button>
                  </div>
                )}
              </div>
            </section>
          )}

          {activo("info_importante") && (puntos.length > 0 || importante.nota) && (
            <section className="section" aria-labelledby="info-title" data-reveal>
              <Encabezado antetitulo="Ten en cuenta" titulo="Información" guion="importante" id="info-title" />
              <div className="card en-texto">
                {importante.nota && <p className="muted">{importante.nota}</p>}
                {puntos.length > 0 && <ul className="en-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
              </div>
            </section>
          )}

          {activo("faq") && preguntas.length > 0 && (
            <section className="section" aria-labelledby="faq-title" data-reveal>
              <Encabezado antetitulo="Dudas" titulo="Preguntas" guion="frecuentes" id="faq-title" />
              <div className="card en-faq">
                {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary><p>{f.r}</p></details>)}
              </div>
            </section>
          )}

          {invitacion && (
            <section className="section" aria-labelledby="closing-title" data-reveal>
              <div className="card arched closing od-stack">
                <Arte src={ramito} className="en-familia-flor" />
                <p className="eyebrow">Confirmación</p>
                <h2 id="closing-title">¿Me <span className="script">acompañas?</span></h2>
                <Ornamento />
                <p className="muted">{limite ? <>Confirma tu asistencia antes del <b>{limite}</b>.</> : "Confirma tu asistencia."}</p>
                <button className="btn btn-primary" type="button" onClick={() => setRsvpAbierto(true)}>Confirmar asistencia</button>
              </div>
            </section>
          )}

          <footer className="en-final">
            <p className="en-te-espero">{esXV ? "¡Te espero!" : "¡Te esperamos!"}</p>
            {nombres.length > 0 && <p className="helper">Con cariño, {nombres.join(" & ")}</p>}
            <Arte src={nubes} className="en-nubes" />
          </footer>
        </main>
      )}

      <div className={`toast ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="en-modal" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="en-modal-caja">
            <button type="button" className="en-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">×</button>
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
