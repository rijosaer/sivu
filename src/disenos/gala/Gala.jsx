import { useLayoutEffect, useMemo, useRef, useState } from "react";
import "./gala.css";
import RSVP from "../../components/RSVP";
import {
  ZONA, partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer, enlaceCalendario, alTocarPortada } from "../comun";
import { Mapa } from "./arte";

// Diseño «Gala»: editorial nocturna en negro y lima neón, llevado desde la
// maqueta corporativa de la landing (public/modelos/corporativo.html). Pensado
// para eventos corporativos: «Nombre del evento» es el título y «Empresa u
// organizador» va arriba. Colores desde el tema: papel = fondo, tinta = texto,
// principal = acento neón, claro = acento al pasar, oscuro = tarjetas,
// mármol = superficies elevadas, sello = texto apagado.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Manrope:wght@400;500;600;700&family=Unbounded:wght@500;600;800&display=swap";

const Icono = {
  flecha: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  calendario: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4M12 13v4M10 15h4" /></svg>,
  pin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
};

// "8:00 pm", "20:00", "9:15 p. m." → minutos desde la medianoche.
function minutosDe(hora) {
  const m = String(hora || "").toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(a|p)?/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  if (m[3] === "p" && h < 12) h += 12;
  if (m[3] === "a" && h === 12) h = 0;
  return h * 60 + min;
}

// Índice del punto del programa que está ocurriendo ahora (solo el día del evento).
function puntoActual(cronograma, fecha) {
  if (!fecha || !cronograma.length) return -1;
  const hoy = (d) => d.toLocaleDateString("en-CA", { timeZone: ZONA });
  const ahora = new Date();
  if (hoy(ahora) !== hoy(fecha)) return -1;
  const [h, m] = ahora.toLocaleTimeString("en-GB", { timeZone: ZONA, hour: "2-digit", minute: "2-digit" }).split(":");
  const mins = Number(h) * 60 + Number(m);
  const inicios = cronograma.map((c) => minutosDe(c.hora));
  let actual = -1;
  inicios.forEach((ini, i) => { if (ini != null && mins >= ini) actual = i; });
  return actual;
}

// Parte el título en dos renglones parejos ("Fin de año" → "Fin" / "de año").
// La palabra más larga del título manda el tamaño: «LANZAMIENTO» no cabía y se
// partía en «LANZAMIENT / O».
function letrasMax(texto) {
  return Math.max(6, ...String(texto || "").trim().split(/\s+/).map((p) => p.length));
}

function renglones(texto) {
  const palabras = String(texto || "").trim().split(/\s+/).filter(Boolean);
  if (palabras.length < 2) return palabras;
  let mejor = 1;
  let dif = Infinity;
  for (let i = 1; i < palabras.length; i++) {
    const d = Math.abs(palabras.slice(0, i).join(" ").length - palabras.slice(i).join(" ").length);
    if (d < dif) { dif = d; mejor = i; }
  }
  return [palabras.slice(0, mejor).join(" "), palabras.slice(mejor).join(" ")];
}

// El título se mide en pantalla y se achica hasta caber en la tarjeta: con una
// palabra larga («LANZAMIENTO») la letra ancha de Gala se salía y cortaba la «O».
function useTituloQueCabe(texto) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // Dónde termina de verdad cada renglón contra el borde interior de la tarjeta
    // (scrollWidth no lo detecta: cada renglón es un bloque del ancho del título).
    function cabe() {
      const caja = el.closest(".gt-main") || el.parentElement;
      const borde = caja.getBoundingClientRect().right - parseFloat(getComputedStyle(caja).paddingRight || 0);
      return [...el.querySelectorAll(".line")].every((linea) => {
        const r = document.createRange();
        r.selectNodeContents(linea);
        return r.getBoundingClientRect().right <= borde + 0.5;
      });
    }
    function ajustar() {
      el.style.fontSize = "";
      let tam = parseFloat(getComputedStyle(el).fontSize);
      while (!cabe() && tam > 18) {
        tam -= 1;
        el.style.fontSize = `${tam}px`;
      }
    }
    ajustar();
    // La letra de Gala llega después (useFuentes la pide al montar) y es más
    // ancha que la de respaldo: se vuelve a medir cada vez que termina de cargar una.
    document.fonts?.ready.then(ajustar);
    document.fonts?.addEventListener?.("loadingdone", ajustar);
    addEventListener("resize", ajustar);
    return () => {
      document.fonts?.removeEventListener?.("loadingdone", ajustar);
      removeEventListener("resize", ajustar);
    };
  }, [texto]);
  return ref;
}

function Portada({ welcome, partes, invitacion, onAbrir }) {
  const [abriendo, setAbriendo] = useState(false);
  const pases = pasesDe(invitacion);
  const titulo = useTituloQueCabe(welcome.novioEl);
  function abrir() {
    if (abriendo) return;
    setAbriendo(true);
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(onAbrir, reducido ? 100 : 420);
  }
  return (
    <section className={`view ga-portada ${abriendo ? "is-opening" : ""}`} aria-labelledby="gate-title" onClick={alTocarPortada(abrir)}>
      <div className="gate od-stack">
        <p className="eyebrow gate-kicker">{invitacion?.nombre ? `${invitacion.nombre}, tienes una invitación` : "Tienes una invitación"}</p>
        <div className="gticket">
          <div className="gt-main od-stack">
            <div className="gt-top od-row">
              <span className="ph">{welcome.novioElla || welcome.bienvenidaTexto || "Te invitamos"}</span>
              {partes && <span className="od-nowrap">{partes.anio}</span>}
            </div>
            <h1 className="gt-title" id="gate-title" ref={titulo} style={{ "--letras": letrasMax(welcome.novioEl) }}>
              {renglones(welcome.novioEl).map((r, i) => <span key={i} className="line">{r}</span>)}
            </h1>
            {welcome.bienvenidaTexto && welcome.novioElla && <p className="gt-sub serif">{welcome.bienvenidaTexto}</p>}
            {partes && (
              <div className="gt-meta od-grid">
                <div className="od-stat"><span className="k">Fecha</span><span className="v od-nowrap">{partes.diaDos}.{partes.mesNum}.{partes.anioCorto}</span></div>
                <div className="od-stat"><span className="k">Hora</span><span className="v od-nowrap">{partes.hora24} h</span></div>
              </div>
            )}
          </div>
          <div className="perf" aria-hidden="true"><span /></div>
          <div className="gt-stub od-stack">
            <button className="btn btn-ink" type="button" onClick={abrir}>Abrir invitación {Icono.flecha}</button>
            <p className="hint">
              {pases > 1 ? `${pases} pases reservados · personales e intransferibles` : "Pase personal e intransferible"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Gala({ site, contenidoDe, invitacion, enEditor, onEnviarRSVP }) {
  useFuentes(FUENTES);
  const [abierta, setAbierta] = useState(enEditor);
  const [rsvpAbierto, setRsvpAbierto] = useState(false);
  const [aviso, setAviso] = useState("");
  const raiz = useAparecer(abierta, "[data-reveal]", "is-in");

  const welcome = contenidoDe("welcome");
  const info = contenidoDe("informacion_boda");
  const vestimenta = contenidoDe("vestimenta");
  const historia = contenidoDe("historia");
  const importante = contenidoDe("info_importante");
  const faq = contenidoDe("faq");
  const activo = (tipo) => site.secciones.some((s) => s.tipo === tipo && s.activo !== false);

  const partes = useMemo(() => partesFecha(info.fecha), [info.fecha]);
  const cuenta = useCuentaRegresiva(partes?.fecha);
  const limite = limiteLegible(info.fechaLimiteConfirmacion || site.fechaLimiteConfirmacion);
  const cronograma = info.cronogramaModo === "detallado" ? info.cronograma || [] : [];
  const ahora = puntoActual(cronograma, partes?.fecha);
  const puntos = (importante.items || []).filter(Boolean);
  const preguntas = (faq.items || []).filter((f) => f && f.p);
  const lugar = [info.lugar, info.direccion].filter(Boolean).join(", ");
  const dress = activo("vestimenta") ? vestimenta.titulo : "";
  const fechaCorta = partes ? `${partes.diaDos}.${partes.mesNum}.${partes.anioCorto}` : "";
  const cinta = [welcome.bienvenidaTexto, welcome.novioEl, fechaCorta, dress].filter(Boolean).join(" ✦ ") + " ✦";
  const calendario = enlaceCalendario({ titulo: welcome.novioEl, fecha: partes?.fecha, lugar });

  // Numeración de secciones como en la maqueta: 01 · Detalles, 02 · Programa…
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  function abrir() {
    setAbierta(true);
    window.scrollTo(0, 0);
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
    <div className="ga" ref={raiz}>
      {!abierta && <Portada welcome={welcome} partes={partes} invitacion={invitacion} onAbrir={abrir} />}

      {abierta && (
        <section className="view ga-invitacion" aria-labelledby="invite-title">
          <header className="hero od-stack">
            <div className="hero-top od-row">
              <p className="host od-fill"><span className="ph">{welcome.novioElla || welcome.bienvenidaTexto}</span></p>
              <span className="tag od-fixed"><span className="live" aria-hidden="true" />Invitación</span>
            </div>
            {partes && <p className="mega" aria-hidden="true">{partes.diaDos}<span className="dot">.</span>{partes.mesNum}</p>}
            <h1 className="hero-title od-stack" id="invite-title">
              {welcome.bienvenidaTexto && welcome.novioElla && <span className="a">{welcome.bienvenidaTexto}</span>}
              <span className={welcome.novioElla ? "b serif" : "a"}>{welcome.novioEl}</span>
            </h1>
            <div className="hero-meta od-stack">
              {partes && <p><strong className="ga-cap">{partes.semana} {partes.dia} de {partes.mes}, {partes.anio}</strong> · <span className="od-nowrap">{partes.hora24} h</span></p>}
              {lugar && <p><span className="ph">{lugar}</span></p>}
            </div>
            {welcome.fraseIntro && <p className="ga-frase">{welcome.fraseIntro}</p>}
            {partes && (
              <div className="od-stack" style={{ "--od-gap": "var(--s3)" }}>
                <p className="eyebrow" id="cd-label">{cuenta ? "Faltan" : "Es hoy"}</p>
                {cuenta && (
                  <div className="countdown od-grid" role="timer" aria-labelledby="cd-label">
                    <div className="od-stat"><span className="n">{cuenta.dias}</span><span className="l">Días</span></div>
                    <div className="od-stat"><span className="n">{cuenta.horas}</span><span className="l">Horas</span></div>
                    <div className="od-stat"><span className="n">{cuenta.min}</span><span className="l">Min</span></div>
                    <div className="od-stat"><span className="n">{cuenta.seg}</span><span className="l">Seg</span></div>
                  </div>
                )}
              </div>
            )}
          </header>

          <div className="marquee" aria-hidden="true">
            <div className="marquee-track"><span>{cinta}</span><span>{cinta}</span></div>
          </div>

          <section className="section" aria-labelledby="ticket-title" data-reveal>
            <div className="section-head od-stack">
              <p className="eyebrow">{num()} · Detalles</p>
              <h2 className="h2" id="ticket-title">Tu lugar <span className="serif">en el evento</span></h2>
            </div>
            <div className="ticket">
              <div className="t-main">
                <div className="t-grid od-grid">
                  {partes && <div className="od-stat"><span className="k">Fecha</span><span className="v od-nowrap ga-cap">{partes.semanaCorta} {partes.dia} {partes.mesCorto}</span></div>}
                  {partes && <div className="od-stat"><span className="k">Hora</span><span className="v od-nowrap">{partes.hora24} h</span></div>}
                  {dress && <div className="od-stat"><span className="k">Dress code</span><span className="v">{dress}</span></div>}
                  {info.overline && <div className="od-stat"><span className="k">Formato</span><span className="v">{info.overline}</span></div>}
                  {lugar && <div className="od-stat wide"><span className="k">Lugar</span><span className="v">{info.lugar || info.direccion}</span></div>}
                </div>
                {activo("vestimenta") && vestimenta.nota && <p className="ga-nota">{vestimenta.nota}</p>}
              </div>
              <div className="perf" aria-hidden="true"><span /></div>
              <div className="t-stub od-stack">
                {invitacion && <button className="btn btn-primary" type="button" onClick={() => setRsvpAbierto(true)}>Confirmar asistencia</button>}
                {calendario && <a className="btn btn-secondary" href={calendario} target="_blank" rel="noopener noreferrer">{Icono.calendario} Agregar al calendario</a>}
              </div>
            </div>
          </section>

          {cronograma.length > 0 && (
            <section className="section" aria-labelledby="agenda-title" data-reveal>
              <div className="section-head od-stack">
                <p className="eyebrow">{num()} · {info.tituloItinerario || "Programa"}</p>
                <h2 className="h2" id="agenda-title">El evento, <span className="serif">hora por hora</span></h2>
              </div>
              <ol className="timeline">
                {cronograma.map((c, i) => (
                  <li key={i} className={`od-row-top ${i === ahora ? "is-now" : ""}`}>
                    <span className="node od-fixed" aria-hidden="true" />
                    <div className="body od-field od-fill">
                      <time className="od-nowrap">{c.hora}</time>
                      <span className="title">{c.titulo}</span>
                      {c.detalle && <span className="desc">{c.detalle}</span>}
                      <span className="tag now-tag"><span className="live" aria-hidden="true" />Ahora</span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {lugar && (
            <section className="section" aria-labelledby="map-title" data-reveal>
              <div className="section-head od-stack">
                <p className="eyebrow">{num()} · Ubicación</p>
                <h2 className="h2" id="map-title">Cómo <span className="serif">llegar</span></h2>
              </div>
              <div className="map-card">
                <Mapa />
                <div className="map-body od-stack">
                  <div className="od-field">
                    <span className="venue">{info.lugar}</span>
                    {info.direccion && <span className="helper">{info.direccion}</span>}
                  </div>
                  <div className="pair od-grid">
                    {info.mapsUrl ? (
                      <a className="btn btn-secondary" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>
                    ) : <span />}
                    <button className="btn btn-secondary" type="button" onClick={() => copiar(lugar, "Dirección copiada")}>{Icono.copiar} Copiar</button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activo("historia") && historia.texto && (
            <section className="section" aria-labelledby="hist-title" data-reveal>
              <div className="section-head od-stack">
                <p className="eyebrow">{num()} · {historia.titulo || "Sobre el evento"}</p>
                <h2 className="h2" id="hist-title">Lo que <span className="serif">celebramos</span></h2>
              </div>
              <p className="ga-parrafo">{historia.texto}</p>
            </section>
          )}

          {activo("info_importante") && (puntos.length > 0 || importante.nota) && (
            <section className="section" aria-labelledby="info-title" data-reveal>
              <div className="section-head od-stack">
                <p className="eyebrow">{num()} · Ten en cuenta</p>
                <h2 className="h2" id="info-title">Información <span className="serif">importante</span></h2>
              </div>
              <div className="ga-caja">
                {importante.nota && <p className="ga-parrafo">{importante.nota}</p>}
                {puntos.length > 0 && <ul className="ga-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
              </div>
            </section>
          )}

          {activo("faq") && preguntas.length > 0 && (
            <section className="section" aria-labelledby="faq-title" data-reveal>
              <div className="section-head od-stack">
                <p className="eyebrow">{num()} · Dudas</p>
                <h2 className="h2" id="faq-title">Preguntas <span className="serif">frecuentes</span></h2>
              </div>
              <div className="ga-caja ga-faq">
                {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary><p>{f.r}</p></details>)}
              </div>
            </section>
          )}

          {invitacion && (
            <section className="closing od-stack" aria-labelledby="closing-title" data-reveal>
              <p className="eyebrow">{num()} · RSVP</p>
              <h2 className="big" id="closing-title">¿Vienes? <span className="serif">Te guardamos lugar.</span></h2>
              <p className="muted">{limite ? <>Confirma tu asistencia antes del <b>{limite}</b>.</> : "Confirma tu asistencia."}</p>
              <button className="btn btn-primary" type="button" onClick={() => setRsvpAbierto(true)}>Confirmar asistencia</button>
            </section>
          )}

          {(welcome.novioElla || welcome.bienvenidaTexto) && (
            <p className="footer">Organiza: {welcome.novioElla || welcome.bienvenidaTexto}</p>
          )}
        </section>
      )}

      <div className={`toast ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="ga-modal" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="ga-modal-caja">
            <button type="button" className="ga-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">×</button>
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
