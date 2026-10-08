import { useMemo, useRef, useState } from "react";
import "./lazos.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer, enlaceCalendario,
} from "../comun";
import fondo from "./arte/fondo.webp";
import mono from "./arte/mono.webp";
import rosas from "./arte/rosas.webp";
import rosa from "./arte/rosa.webp";
import tiara from "./arte/tiara.webp";

// Diseño «Moños y perlas»: rosa palo estilo coquette con lazos de satén,
// perlas y rosas pintados en estilo semi-realista (ni foto de producto, que
// el cliente sintió fuera de lugar, ni vector plano; esa versión vive aparte
// como «Coquette»). Lo que se dibuja en CSS (caja, festón, perlas) lleva el
// mismo volumen suave para que todo parezca de la misma mano. La portada es
// una caja de regalo: al tocar el moño la tapa se levanta y sale la tarjeta.
// Colores del tema: principal = rosa satén, claro = rosa palo, sello =
// champaña, mármol = rosa muy claro.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;0,6..96,600;1,6..96,500&family=Jost:wght@400;500;600&family=Ballet:opsz@16..72&display=swap";

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
const Icono = {
  calendario: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>,
  reloj: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>,
  vestido: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9.5 3h5l-1 5 5 13h-13l5-13z" /><path d="M10.5 8h3" /></svg>,
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  regalo: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="3.5" y="9" width="17" height="11" rx="1.5" /><path d="M2.5 9h19M12 9v11M12 9c-2.5 0-5-1-5-3s2.5-2 5 3c2.5-5 5-5 5-3s-2.5 3-5 3" /></svg>,
  musica: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>,
  pausa: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>,
};

function Arte({ src, className }) {
  return <img src={src} alt="" aria-hidden="true" className={className} />;
}

// Hilo corto de perlas dibujado con CSS (separadores de los títulos).
function Perlitas({ className = "" }) {
  return <span className={`lz-perlitas ${className}`} aria-hidden="true" />;
}

// Perlas a lo largo de un trazo: cuatro pasadas del mismo punteado (sombra,
// cuerpo, reflejo y brillo) corridas un poco entre sí; así cada perla queda
// iluminada desde arriba a la izquierda sin dibujarlas una por una.
function HiloPerlas({ d, paso = 2, grosor = 10, ...resto }) {
  const base = { d, pathLength: 100, fill: "none", strokeDasharray: `0 ${paso}`, strokeLinecap: "round", ...resto };
  const g = grosor;
  return (
    <g>
      <path {...base} stroke="rgb(120 50 75 / .3)" strokeWidth={g * 1.08} transform={`translate(${g * 0.1} ${g * 0.2})`} />
      <path {...base} stroke="#E9D4D0" strokeWidth={g} />
      <path {...base} stroke="#FBF3F0" strokeWidth={g * 0.72} transform={`translate(${-g * 0.1} ${-g * 0.1})`} />
      <path {...base} stroke="#FFFFFF" strokeWidth={g * 0.3} transform={`translate(${-g * 0.24} ${-g * 0.26})`} />
    </g>
  );
}

function MarcoPerlas() {
  return (
    <svg className="lz-camafeo-perlas" viewBox="0 0 240 320" aria-hidden="true">
      <HiloPerlas d="M120 8 A 112 152 0 1 1 119.9 8 Z" paso={1.8} grosor={11} />
    </svg>
  );
}

// Collar de perlas que cuelga de lado a lado, con tres perlas grandes al centro.
function Collar() {
  return (
    <svg className="lz-collar" viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden="true">
      <HiloPerlas d="M-10 8 Q 200 92 410 8" paso={2} grosor={9} />
      {[[184, 47, 7], [200, 51, 9], [216, 47, 7]].map(([x, y, r]) => (
        <g key={x}>
          <circle cx={x + 1} cy={y + 2.5} r={r + 0.6} fill="rgb(120 50 75 / .28)" />
          <circle cx={x} cy={y + 1} r={r} fill="#E9D4D0" />
          <circle cx={x - r * 0.12} cy={y + 1 - r * 0.12} r={r * 0.74} fill="#FBF3F0" />
          <circle cx={x - r * 0.36} cy={y + 1 - r * 0.38} r={r * 0.3} fill="#fff" />
        </g>
      ))}
    </svg>
  );
}

function Encabezado({ antetitulo, titulo, guion, id }) {
  return (
    <div className="lz-cabeza">
      {antetitulo && <p className="lz-ante">{antetitulo}</p>}
      <h2 id={id}>
        {titulo} {guion && <span className="lz-guion">{guion}</span>}
      </h2>
      <Perlitas />
    </div>
  );
}

function Portada({ welcome, invitacion, onAbrir }) {
  const [abriendo, setAbriendo] = useState(false);
  const pases = pasesDe(invitacion);
  const primerNombre = (welcome.novioEl || "").split(" ")[0];
  function abrir() {
    if (abriendo) return;
    setAbriendo(true);
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(onAbrir, reducido ? 300 : 2600);
  }
  return (
    <section className={`lz-portada ${abriendo ? "lz-abriendo" : ""}`} aria-labelledby="lz-portada-titulo">
      <Arte src={rosas} className="lz-portada-rosas lz-portada-rosas-sup" />
      <Arte src={rosas} className="lz-portada-rosas lz-portada-rosas-inf" />
      <div className="lz-portada-in">
        <p className="lz-ante">{welcome.bienvenidaTexto || "Mis XV años"}</p>
        <h1 className="lz-portada-nombre" id="lz-portada-titulo">{welcome.novioEl}</h1>
        {invitacion?.nombre && <p className="lz-para">Para: <b>{invitacion.nombre}</b></p>}

        <button type="button" className="lz-caja" onClick={abrir} aria-label="Abrir la invitación">
          <span className="lz-caja-sombra" />
          <span className="lz-caja-cuerpo"><span className="lz-cinta-v" /></span>
          <span className="lz-carta">
            <span className="lz-carta-xv">XV</span>
            <span className="lz-carta-nombre">{primerNombre}</span>
          </span>
          <span className="lz-caja-frente"><span className="lz-cinta-v" /></span>
          <span className="lz-tapa">
            <span className="lz-cinta-v" />
            <img src={mono} alt="" className="lz-tapa-mono" />
          </span>
        </button>

        <p className="lz-toca">Toca el moño para abrir tu regalo</p>
        {pases > 0 && (
          <p className="lz-pases">
            Hemos reservado <b>{pases}</b> {pases === 1 ? "pase en tu honor" : "pases en tu honor"}
          </p>
        )}
      </div>
    </section>
  );
}

export default function Lazos({ site, contenidoDe, invitacion, enEditor, onEnviarRSVP }) {
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
  const audioSrc = site.audioUrl || musica.src;
  const foto = (site.fotosSubidas || [])[0];
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
    <div className="lz" ref={raiz} style={{ "--lz-fondo": `url(${fondo})` }}>
      <div className="lz-brillos" aria-hidden="true" />
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop />}
      {audioSrc && abierta && (
        <button className="lz-musica" type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label="Música de fondo">
          {sonando ? Icono.pausa : Icono.musica}
          <span>{sonando ? "Pausar" : "Música"}</span>
        </button>
      )}

      {!abierta && <Portada welcome={welcome} invitacion={invitacion} onAbrir={abrir} />}

      {abierta && (
        <main className="lz-cuerpo" aria-labelledby="lz-titulo">
          <header className="lz-hero">
            <div className="lz-feston" aria-hidden="true" />
            <Arte src={mono} className="lz-hero-mono" />
            <p className="lz-ante">{welcome.bienvenidaTexto || "Mis XV años"}</p>

            <div className="lz-camafeo">
              <div className="lz-camafeo-in">
                {foto ? (
                  <img src={foto} alt={`Foto de ${nombres[0] || "la quinceañera"}`} className="lz-camafeo-foto" />
                ) : (
                  <>
                    <Arte src={tiara} className="lz-camafeo-tiara" />
                    <span className="lz-camafeo-xv" aria-hidden="true">XV</span>
                  </>
                )}
              </div>
              <MarcoPerlas />
              <Arte src={rosa} className="lz-camafeo-rosa lz-camafeo-rosa-izq" />
              <Arte src={rosa} className="lz-camafeo-rosa lz-camafeo-rosa-der" />
            </div>

            <h1 className="lz-nombre" id="lz-titulo">
              {nombres[0]}
              {nombres[1] && <><br /><span className="lz-y">&amp;</span> {nombres[1]}</>}
            </h1>
            {welcome.fraseIntro && <p className="lz-frase">{welcome.fraseIntro}</p>}
            {partes && (
              <div className="lz-fecha">
                <span className="lz-fecha-sem">{partes.semana}</span>
                <span className="lz-fecha-num">
                  <span>{partes.diaDos}</span><i aria-hidden="true">·</i><span>{partes.mesNum}</span><i aria-hidden="true">·</i><span>{partes.anio}</span>
                </span>
                <span className="lz-fecha-hora">{partes.dia} de {partes.mes} · {partes.hora}</span>
              </div>
            )}
          </header>

          <Collar />

          {partes && (
            <section className="lz-seccion" aria-labelledby="lz-cuenta" data-reveal>
              <Encabezado antetitulo="La cuenta regresiva" titulo="Faltan" guion="poquito" id="lz-cuenta" />
              {cuenta ? (
                <div className="lz-cuenta" role="timer" aria-labelledby="lz-cuenta">
                  {[["dias", "Días"], ["horas", "Horas"], ["min", "Min"], ["seg", "Seg"]].map(([k, l]) => (
                    <div key={k} className="lz-cuenta-caja"><span className="n">{cuenta[k]}</span><span className="l">{l}</span></div>
                  ))}
                </div>
              ) : (
                <p className="lz-llego">¡Llegó el gran día!</p>
              )}
            </section>
          )}

          <section className="lz-seccion" aria-labelledby="lz-detalles" data-reveal>
            <Encabezado antetitulo="La celebración" titulo="Una noche" guion="inolvidable" id="lz-detalles" />
            <div className="lz-datos">
              {partes && (
                <>
                  <div className="lz-dato"><span className="lz-ico">{Icono.calendario}</span><span className="k">Fecha</span><span className="v">{partes.semanaCorta} {partes.dia} de {partes.mes}</span></div>
                  <div className="lz-dato"><span className="lz-ico">{Icono.reloj}</span><span className="k">Hora</span><span className="v">{partes.hora}</span></div>
                </>
              )}
              {activo("vestimenta") && vestimenta.titulo && (
                <div className="lz-dato lz-ancho"><span className="lz-ico">{Icono.vestido}</span><span className="k">Dress code</span><span className="v">{vestimenta.titulo}</span></div>
              )}
              {lugar && (
                <div className="lz-dato lz-ancho"><span className="lz-ico">{Icono.pin}</span><span className="k">Lugar</span><span className="v">{info.lugar || info.direccion}</span></div>
              )}
            </div>
            {activo("vestimenta") && vestimenta.nota && <p className="lz-nota">{vestimenta.nota}</p>}

            {(padres || grupos.length > 0) && (
              <div className="lz-tarjeta-lazo lz-familia">
                <Arte src={mono} className="lz-lazo-tarjeta" />
                {padres && (
                  <div className="lz-quien"><span className="k">{welcome.padresTexto || "Con la bendición de mis padres"}</span><span className="who">{padres}</span></div>
                )}
                {grupos.map((g, i) => (
                  <div key={i} className="lz-quien">
                    {(padres || i > 0) && <Perlitas className="lz-perlitas-cortas" />}
                    <span className="k">{g.etiqueta}</span><span className="who">{g.personas.filter(Boolean).join(" y ")}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {cronograma.length > 0 && (
            <section className="lz-seccion" aria-labelledby="lz-programa" data-reveal>
              <Encabezado antetitulo={info.tituloItinerario || "El programa"} titulo="Momento a" guion="momento" id="lz-programa" />
              <ol className="lz-tarjeta lz-programa">
                {cronograma.map((c, i) => (
                  <li key={i}><span className="lz-hora">{c.hora}</span><span className="lz-perla" aria-hidden="true" /><span>{c.titulo}</span></li>
                ))}
              </ol>
            </section>
          )}

          {lugar && (
            <section className="lz-seccion" aria-labelledby="lz-lugar" data-reveal>
              <Encabezado antetitulo="Ubicación" titulo="Cómo" guion="llegar" id="lz-lugar" />
              <div className="lz-tarjeta lz-lugar">
                <span className="lz-ico lz-ico-grande">{Icono.pin}</span>
                <span className="v">{info.lugar}</span>
                {info.direccion && <span className="lz-ayuda">{info.direccion}</span>}
                <div className="lz-par">
                  {info.mapsUrl ? (
                    <a className="lz-btn lz-btn-2" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>
                  ) : <span />}
                  <button className="lz-btn lz-btn-2" type="button" onClick={() => copiar(lugar, "Dirección copiada")}>{Icono.copiar} Copiar</button>
                </div>
                {calendario && (
                  <a className="lz-btn lz-btn-3" href={calendario} target="_blank" rel="noopener noreferrer">{Icono.calendario} Agregar al calendario</a>
                )}
              </div>
            </section>
          )}

          {activo("historia") && historia.texto && (
            <section className="lz-seccion" aria-labelledby="lz-historia" data-reveal>
              <Encabezado antetitulo={historia.titulo || "Mi historia"} titulo="Quince años" guion="de sueños" id="lz-historia" />
              <div className="lz-tarjeta lz-texto"><p className="lz-lead">{historia.texto}</p></div>
            </section>
          )}

          {((activo("sobres") && sobres.texto) || (activo("regalos") && (regalos.texto || regalos.datosTransferencia))) && (
            <section className="lz-seccion" aria-labelledby="lz-regalo" data-reveal>
              <Encabezado antetitulo="Regalos" titulo="Mi" guion="deseo" id="lz-regalo" />
              <div className="lz-tarjeta lz-regalo">
                <span className="lz-ico lz-ico-grande">{Icono.regalo}</span>
                <p className="lz-lead">
                  {(activo("sobres") && sobres.texto) || regalos.texto || "Tu presencia es mi mejor regalo; si deseas tener un detalle conmigo, aquí te dejo cómo."}
                </p>
                {activo("regalos") && regalos.datosTransferencia && (
                  <div className="lz-transferir">
                    <div>
                      <span className="k">Datos para transferir</span>
                      <span className="v">{regalos.datosTransferencia}</span>
                    </div>
                    <button className="lz-btn lz-btn-2 lz-btn-chico" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>Copiar</button>
                  </div>
                )}
              </div>
            </section>
          )}

          {activo("info_importante") && (puntos.length > 0 || importante.nota) && (
            <section className="lz-seccion" aria-labelledby="lz-info" data-reveal>
              <Encabezado antetitulo="Ten en cuenta" titulo="Información" guion="importante" id="lz-info" />
              <div className="lz-tarjeta lz-texto">
                {importante.nota && <p className="lz-ayuda">{importante.nota}</p>}
                {puntos.length > 0 && <ul className="lz-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
              </div>
            </section>
          )}

          {activo("faq") && preguntas.length > 0 && (
            <section className="lz-seccion" aria-labelledby="lz-faq" data-reveal>
              <Encabezado antetitulo="Dudas" titulo="Preguntas" guion="frecuentes" id="lz-faq" />
              <div className="lz-tarjeta lz-faq">
                {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary><p>{f.r}</p></details>)}
              </div>
            </section>
          )}

          {invitacion && (
            <section className="lz-seccion" aria-labelledby="lz-confirmar" data-reveal>
              <div className="lz-tarjeta-lazo lz-cierre">
                <Arte src={mono} className="lz-lazo-tarjeta" />
                <p className="lz-ante">Confirmación</p>
                <h2 id="lz-confirmar">¿Me <span className="lz-guion">acompañas?</span></h2>
                <Perlitas />
                <p className="lz-ayuda">{limite ? <>Confirma tu asistencia antes del <b>{limite}</b>.</> : "Confirma tu asistencia."}</p>
                <button className="lz-btn lz-btn-1" type="button" onClick={() => setRsvpAbierto(true)}>Confirmar asistencia</button>
              </div>
            </section>
          )}

          <footer className="lz-final">
            <Arte src={rosas} className="lz-final-rosas" />
            <p className="lz-te-espero">{esXV ? "¡Te espero!" : "¡Te esperamos!"}</p>
            {nombres.length > 0 && <p className="lz-ayuda">Con cariño, {nombres.join(" & ")}</p>}
          </footer>
        </main>
      )}

      <div className={`lz-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="lz-modal" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="lz-modal-caja">
            <button type="button" className="lz-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">×</button>
            <Arte src={mono} className="lz-modal-lazo" />
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
