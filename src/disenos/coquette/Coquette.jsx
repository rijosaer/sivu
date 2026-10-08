import { useMemo, useRef, useState } from "react";
import "./coquette.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer, enlaceCalendario,
} from "../comun";
import { Lazo, Corazon, Tiara, MarcoPerlas, Collar, Guirnalda } from "./arte";

// Diseño «Coquette»: rosa palo ilustrado en vector
// (moños, perlas, tiara y corazones con un mismo trazo). Es la hermana
// ilustrada de «Moños y perlas», que usa arte pintado semi-realista. La portada es una caja de regalo: al tocar
// el moño la tapa se levanta y sale la tarjeta. Los colores salen del tema
// (principal = rosa satén, claro = rosa palo, sello = champaña, mármol = rosa
// muy claro).

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Quicksand:wght@400;500;600;700&family=Dancing+Script:wght@600;700&display=swap";

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

// Hilo de perlas dibujado con CSS (para bordes y separadores finos).
function Perlitas({ className = "" }) {
  return <span className={`cq-perlitas ${className}`} aria-hidden="true" />;
}

function Encabezado({ antetitulo, titulo, guion, id }) {
  return (
    <div className="cq-cabeza">
      {antetitulo && <p className="cq-ante">{antetitulo}</p>}
      <h2 id={id}>
        {titulo} {guion && <span className="cq-guion">{guion}</span>}
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
    <section className={`cq-portada ${abriendo ? "cq-abriendo" : ""}`} aria-labelledby="cq-portada-titulo">
      <Guirnalda className="cq-portada-guirnalda" />
      <Corazon className="cq-flota cq-flota-1" />
      <Corazon className="cq-flota cq-flota-2" />
      <Corazon className="cq-flota cq-flota-3" />
      <div className="cq-portada-in">
        <p className="cq-ante">{welcome.bienvenidaTexto || "Mis XV años"}</p>
        <h1 className="cq-portada-nombre" id="cq-portada-titulo">{welcome.novioEl}</h1>
        {invitacion?.nombre && <p className="cq-para">Para: <b>{invitacion.nombre}</b></p>}

        <button type="button" className="cq-caja" onClick={abrir} aria-label="Abrir la invitación">
          <span className="cq-caja-sombra" />
          <span className="cq-caja-cuerpo"><span className="cq-cinta-v" /></span>
          <span className="cq-carta">
            <span className="cq-carta-xv">XV</span>
            <span className="cq-carta-nombre">{primerNombre}</span>
          </span>
          <span className="cq-caja-frente"><span className="cq-cinta-v" /></span>
          <span className="cq-tapa">
            <span className="cq-cinta-v" />
            <Lazo className="cq-tapa-mono" />
          </span>
        </button>

        <p className="cq-toca">Toca el moño para abrir tu regalo</p>
        {pases > 0 && (
          <p className="cq-pases">
            Hemos reservado <b>{pases}</b> {pases === 1 ? "pase en tu honor" : "pases en tu honor"}
          </p>
        )}
      </div>
    </section>
  );
}

export default function Coquette({ site, contenidoDe, invitacion, enEditor, onEnviarRSVP }) {
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
    <div className="cq" ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop />}
      {audioSrc && abierta && (
        <button className="cq-musica" type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label="Música de fondo">
          {sonando ? Icono.pausa : Icono.musica}
          <span>{sonando ? "Pausar" : "Música"}</span>
        </button>
      )}

      {!abierta && <Portada welcome={welcome} invitacion={invitacion} onAbrir={abrir} />}

      {abierta && (
        <main className="cq-cuerpo" aria-labelledby="cq-titulo">
          <header className="cq-hero">
            <div className="cq-feston" aria-hidden="true" />
            <Lazo className="cq-hero-mono" />
            <p className="cq-ante">{welcome.bienvenidaTexto || "Mis XV años"}</p>

            <div className="cq-camafeo">
              <div className="cq-camafeo-in">
                {foto ? (
                  <img src={foto} alt={`Foto de ${nombres[0] || "la quinceañera"}`} className="cq-camafeo-foto" />
                ) : (
                  <>
                    <Tiara className="cq-camafeo-tiara" />
                    <span className="cq-camafeo-xv" aria-hidden="true">XV</span>
                  </>
                )}
              </div>
              <MarcoPerlas />
              <Lazo className="cq-camafeo-lazo" />
              <Corazon className="cq-camafeo-corazon cq-camafeo-corazon-izq" />
              <Corazon className="cq-camafeo-corazon cq-camafeo-corazon-der" />
            </div>

            <h1 className="cq-nombre" id="cq-titulo">
              {nombres[0]}
              {nombres[1] && <><br /><span className="cq-y">&amp;</span> {nombres[1]}</>}
            </h1>
            {welcome.fraseIntro && <p className="cq-frase">{welcome.fraseIntro}</p>}
            {partes && (
              <div className="cq-fecha">
                <span className="cq-fecha-sem">{partes.semana}</span>
                <span className="cq-fecha-num">
                  <span>{partes.diaDos}</span><i aria-hidden="true">·</i><span>{partes.mesNum}</span><i aria-hidden="true">·</i><span>{partes.anio}</span>
                </span>
                <span className="cq-fecha-hora">{partes.dia} de {partes.mes} · {partes.hora}</span>
              </div>
            )}
          </header>

          <Collar />

          {partes && (
            <section className="cq-seccion" aria-labelledby="cq-cuenta" data-reveal>
              <Encabezado antetitulo="La cuenta regresiva" titulo="Faltan" guion="poquito" id="cq-cuenta" />
              {cuenta ? (
                <div className="cq-cuenta" role="timer" aria-labelledby="cq-cuenta">
                  {[["dias", "Días"], ["horas", "Horas"], ["min", "Min"], ["seg", "Seg"]].map(([k, l]) => (
                    <div key={k} className="cq-cuenta-caja"><span className="n">{cuenta[k]}</span><span className="l">{l}</span></div>
                  ))}
                </div>
              ) : (
                <p className="cq-llego">¡Llegó el gran día!</p>
              )}
            </section>
          )}

          <section className="cq-seccion" aria-labelledby="cq-detalles" data-reveal>
            <Encabezado antetitulo="La celebración" titulo="Una noche" guion="inolvidable" id="cq-detalles" />
            <div className="cq-datos">
              {partes && (
                <>
                  <div className="cq-dato"><span className="cq-ico">{Icono.calendario}</span><span className="k">Fecha</span><span className="v">{partes.semanaCorta} {partes.dia} de {partes.mes}</span></div>
                  <div className="cq-dato"><span className="cq-ico">{Icono.reloj}</span><span className="k">Hora</span><span className="v">{partes.hora}</span></div>
                </>
              )}
              {activo("vestimenta") && vestimenta.titulo && (
                <div className="cq-dato cq-ancho"><span className="cq-ico">{Icono.vestido}</span><span className="k">Dress code</span><span className="v">{vestimenta.titulo}</span></div>
              )}
              {lugar && (
                <div className="cq-dato cq-ancho"><span className="cq-ico">{Icono.pin}</span><span className="k">Lugar</span><span className="v">{info.lugar || info.direccion}</span></div>
              )}
            </div>
            {activo("vestimenta") && vestimenta.nota && <p className="cq-nota">{vestimenta.nota}</p>}

            {(padres || grupos.length > 0) && (
              <div className="cq-tarjeta-lazo cq-familia">
                <Lazo className="cq-lazo-tarjeta" />
                {padres && (
                  <div className="cq-quien"><span className="k">{welcome.padresTexto || "Con la bendición de mis padres"}</span><span className="who">{padres}</span></div>
                )}
                {grupos.map((g, i) => (
                  <div key={i} className="cq-quien">
                    {(padres || i > 0) && <Perlitas className="cq-perlitas-cortas" />}
                    <span className="k">{g.etiqueta}</span><span className="who">{g.personas.filter(Boolean).join(" y ")}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {cronograma.length > 0 && (
            <section className="cq-seccion" aria-labelledby="cq-programa" data-reveal>
              <Encabezado antetitulo={info.tituloItinerario || "El programa"} titulo="Momento a" guion="momento" id="cq-programa" />
              <ol className="cq-tarjeta cq-programa">
                {cronograma.map((c, i) => (
                  <li key={i}><span className="cq-hora">{c.hora}</span><span className="cq-perla" aria-hidden="true" /><span>{c.titulo}</span></li>
                ))}
              </ol>
            </section>
          )}

          {lugar && (
            <section className="cq-seccion" aria-labelledby="cq-lugar" data-reveal>
              <Encabezado antetitulo="Ubicación" titulo="Cómo" guion="llegar" id="cq-lugar" />
              <div className="cq-tarjeta cq-lugar">
                <span className="cq-ico cq-ico-grande">{Icono.pin}</span>
                <span className="v">{info.lugar}</span>
                {info.direccion && <span className="cq-ayuda">{info.direccion}</span>}
                <div className="cq-par">
                  {info.mapsUrl ? (
                    <a className="cq-btn cq-btn-2" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>
                  ) : <span />}
                  <button className="cq-btn cq-btn-2" type="button" onClick={() => copiar(lugar, "Dirección copiada")}>{Icono.copiar} Copiar</button>
                </div>
                {calendario && (
                  <a className="cq-btn cq-btn-3" href={calendario} target="_blank" rel="noopener noreferrer">{Icono.calendario} Agregar al calendario</a>
                )}
              </div>
            </section>
          )}

          {activo("historia") && historia.texto && (
            <section className="cq-seccion" aria-labelledby="cq-historia" data-reveal>
              <Encabezado antetitulo={historia.titulo || "Mi historia"} titulo="Quince años" guion="de sueños" id="cq-historia" />
              <div className="cq-tarjeta cq-texto"><p className="cq-lead">{historia.texto}</p></div>
            </section>
          )}

          {((activo("sobres") && sobres.texto) || (activo("regalos") && (regalos.texto || regalos.datosTransferencia))) && (
            <section className="cq-seccion" aria-labelledby="cq-regalo" data-reveal>
              <Encabezado antetitulo="Regalos" titulo="Mi" guion="deseo" id="cq-regalo" />
              <div className="cq-tarjeta cq-regalo">
                <span className="cq-ico cq-ico-grande">{Icono.regalo}</span>
                <p className="cq-lead">
                  {(activo("sobres") && sobres.texto) || regalos.texto || "Tu presencia es mi mejor regalo; si deseas tener un detalle conmigo, aquí te dejo cómo."}
                </p>
                {activo("regalos") && regalos.datosTransferencia && (
                  <div className="cq-transferir">
                    <div>
                      <span className="k">Datos para transferir</span>
                      <span className="v">{regalos.datosTransferencia}</span>
                    </div>
                    <button className="cq-btn cq-btn-2 cq-btn-chico" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>Copiar</button>
                  </div>
                )}
              </div>
            </section>
          )}

          {activo("info_importante") && (puntos.length > 0 || importante.nota) && (
            <section className="cq-seccion" aria-labelledby="cq-info" data-reveal>
              <Encabezado antetitulo="Ten en cuenta" titulo="Información" guion="importante" id="cq-info" />
              <div className="cq-tarjeta cq-texto">
                {importante.nota && <p className="cq-ayuda">{importante.nota}</p>}
                {puntos.length > 0 && <ul className="cq-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
              </div>
            </section>
          )}

          {activo("faq") && preguntas.length > 0 && (
            <section className="cq-seccion" aria-labelledby="cq-faq" data-reveal>
              <Encabezado antetitulo="Dudas" titulo="Preguntas" guion="frecuentes" id="cq-faq" />
              <div className="cq-tarjeta cq-faq">
                {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary><p>{f.r}</p></details>)}
              </div>
            </section>
          )}

          {invitacion && (
            <section className="cq-seccion" aria-labelledby="cq-confirmar" data-reveal>
              <div className="cq-tarjeta-lazo cq-cierre">
                <Lazo className="cq-lazo-tarjeta" />
                <p className="cq-ante">Confirmación</p>
                <h2 id="cq-confirmar">¿Me <span className="cq-guion">acompañas?</span></h2>
                <Perlitas />
                <p className="cq-ayuda">{limite ? <>Confirma tu asistencia antes del <b>{limite}</b>.</> : "Confirma tu asistencia."}</p>
                <button className="cq-btn cq-btn-1" type="button" onClick={() => setRsvpAbierto(true)}>Confirmar asistencia</button>
              </div>
            </section>
          )}

          <footer className="cq-final">
            <Lazo className="cq-final-lazo" />
            <p className="cq-te-espero">{esXV ? "¡Te espero!" : "¡Te esperamos!"}</p>
            {nombres.length > 0 && <p className="cq-ayuda">Con cariño, {nombres.join(" & ")}</p>}
          </footer>
        </main>
      )}

      <div className={`cq-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="cq-modal" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="cq-modal-caja">
            <button type="button" className="cq-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">×</button>
            <Lazo className="cq-modal-lazo" />
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
