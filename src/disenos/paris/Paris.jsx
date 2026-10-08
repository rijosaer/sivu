import { useMemo, useRef, useState } from "react";
import "./paris.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer, enlaceCalendario,
} from "../comun";
import atardecer from "./arte/atardecer.webp";
import bici from "./arte/bici.webp";
import macarons from "./arte/macarons.webp";

// Diseño «París rosé»: rosa empolvado, oro rosa y crema, con arte pintado
// semi-realista. Se aparta de las demás plantillas a propósito:
// - Entrada «Enciende París»: la pantalla es un atardecer sobre los techos de
//   París; al tocarla la Torre Eiffel centellea como cada noche y el cielo
//   pasa a rosa nocturno (las demás usan sobre, boleto o caja de regalo).
// - Cuerpo: los datos son postales con estampilla y matasellos, el programa
//   es una carta de bistró con puntos guía, la historia una carta escrita a
//   mano y cada sección lleva una etiqueta en francés (Le Jour, Le Lieu…).
// Colores del tema: principal = oro rosa, claro = rosa empolvado, oscuro =
// rosa antiguo, papel = crema rosada, sello = dorado.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600&family=Marcellus&family=Parisienne&display=swap";

// Dónde está la torre dentro de la pintura del atardecer (en % de la imagen):
// las luces que centellean se reparten dentro de ese triángulo.
const TORRE = { x: 44.8, arriba: 13, abajo: 66, ancho: 28 };
// Número pseudoaleatorio estable entre 0 y 1 (mismas luces en cada carga).
const azar = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
const LUCES = Array.from({ length: 110 }, (_, i) => {
  // Más luces abajo, donde la torre es ancha; el ancho sigue su silueta.
  const alto = Math.sqrt(azar(i + 1));
  const mitad = (TORRE.ancho / 2) * alto * (0.15 + 0.85 * alto);
  return {
    x: TORRE.x + (azar(i + 101) * 2 - 1) * mitad,
    y: TORRE.arriba + alto * (TORRE.abajo - TORRE.arriba),
    retraso: Math.round(azar(i + 201) * 1400),
    tam: 2 + Math.round(azar(i + 301) * 2),
  };
});

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" };
const Icono = {
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  calendario: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>,
  torre: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 2v3M10.5 5h3l1 6h-5zM9.5 11h5l1.5 5h-8zM8 16h8l2.5 6h-3a3.5 3.5 0 0 0-7 0h-3z" /></svg>,
  vestido: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9.5 3h5l-1 5 5 13h-13l5-13z" /><path d="M10.5 8h3" /></svg>,
  musica: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>,
  pausa: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>,
};

function Arte({ src, className }) {
  return <img src={src} alt="" aria-hidden="true" className={className} />;
}

// Encabezado: etiqueta en francés y título en español, con un filete dorado.
function Encabezado({ frances, titulo, id }) {
  return (
    <div className="pr-cabeza">
      <p className="pr-frances">{frances}</p>
      <h2 id={id}>{titulo}</h2>
      <span className="pr-filete" aria-hidden="true"><i /></span>
    </div>
  );
}

// Postal: papel crema, estampilla perforada con la torre y un matasellos.
function Postal({ inclinacion, children }) {
  return (
    <div className="pr-postal" style={{ "--inclina": `${inclinacion}deg` }}>
      <span className="pr-estampilla" aria-hidden="true">{Icono.torre}</span>
      <svg className="pr-matasellos" viewBox="0 0 120 50" aria-hidden="true">
        <circle cx="25" cy="25" r="20" />
        <circle cx="25" cy="25" r="15" />
        <path d="M50 14c10-5 20 5 30 0s20 5 30 0M50 25c10-5 20 5 30 0s20 5 30 0M50 36c10-5 20 5 30 0s20 5 30 0" />
      </svg>
      <div className="pr-postal-texto">{children}</div>
    </div>
  );
}

function Portada({ welcome, invitacion, onAbrir }) {
  const [encendida, setEncendida] = useState(false);
  const pases = pasesDe(invitacion);
  function encender() {
    if (encendida) return;
    setEncendida(true);
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(onAbrir, reducido ? 300 : 3000);
  }
  return (
    <section className={`pr-portada ${encendida ? "pr-encendida" : ""}`} aria-labelledby="pr-portada-titulo">
      <div className="pr-lienzo" aria-hidden="true">
        <img src={atardecer} alt="" className="pr-pintura" />
        <span className="pr-noche" />
        <span className="pr-luces">
          {LUCES.map((l, i) => (
            <i key={i} style={{ left: `${l.x}%`, top: `${l.y}%`, "--retraso": `${l.retraso}ms`, "--tam": `${l.tam}px` }} />
          ))}
        </span>
      </div>
      <div className="pr-portada-arriba">
        <p className="pr-frances">Une soirée à Paris</p>
        <p className="pr-etiqueta">{welcome.bienvenidaTexto || "Mis XV años"}</p>
        <h1 className="pr-portada-nombre" id="pr-portada-titulo">{welcome.novioEl}</h1>
        {invitacion?.nombre && <p className="pr-para">Para <b>{invitacion.nombre}</b></p>}
      </div>
      <div className="pr-portada-abajo">
        <button type="button" className="pr-encender" onClick={encender} aria-label="Encender la Torre Eiffel y abrir la invitación">
          {Icono.torre}
          <span>Toca para encender París</span>
        </button>
        {pases > 0 && (
          <p className="pr-pases"><b>{pases}</b> {pases === 1 ? "pase reservado en tu honor" : "pases reservados en tu honor"}</p>
        )}
      </div>
      {/* Toda la pintura también enciende la torre al tocarla. */}
      <button type="button" className="pr-toque" onClick={encender} tabIndex={-1} aria-hidden="true" />
    </section>
  );
}

export default function Paris({ site, contenidoDe, invitacion, enEditor, onEnviarRSVP }) {
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
    <div className="pr" ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop />}
      {audioSrc && abierta && (
        <button className="pr-musica" type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label="Música de fondo">
          {sonando ? Icono.pausa : Icono.musica}
          <span>{sonando ? "Pausar" : "Música"}</span>
        </button>
      )}

      {!abierta && <Portada welcome={welcome} invitacion={invitacion} onAbrir={abrir} />}

      {abierta && (
        <main className="pr-cuerpo" aria-labelledby="pr-titulo">
          <header className="pr-hero">
            <Arte src={bici} className="pr-bici" />
            <p className="pr-frances">Une soirée à Paris</p>
            <p className="pr-etiqueta">{welcome.bienvenidaTexto || "Mis XV años"}</p>
            <h1 className="pr-nombre" id="pr-titulo">
              {nombres[0]}
              {nombres[1] && <><br /><span className="pr-y">&amp;</span> {nombres[1]}</>}
            </h1>
            {welcome.fraseIntro && <p className="pr-frase">{welcome.fraseIntro}</p>}
            {partes && (
              <p className="pr-fecha">
                <span className="pr-fecha-sem">{partes.semana}</span>
                <span className="pr-fecha-dia">{partes.dia} · {partes.mes} · {partes.anio}</span>
              </p>
            )}
            {foto && (
              <figure className="pr-foto"><img src={foto} alt={`Foto de ${nombres[0] || "la quinceañera"}`} /></figure>
            )}
          </header>

          {partes && (
            <section className="pr-seccion" aria-labelledby="pr-cuenta" data-reveal>
              <Encabezado frances="Le compte à rebours" titulo="Faltan" id="pr-cuenta" />
              {cuenta ? (
                <div className="pr-letrero" role="timer" aria-labelledby="pr-cuenta">
                  {[["dias", "días"], ["horas", "horas"], ["min", "minutos"], ["seg", "segundos"]].map(([k, l]) => (
                    <div key={k}><span className="n">{cuenta[k]}</span><span className="l">{l}</span></div>
                  ))}
                </div>
              ) : (
                <p className="pr-llego">¡Llegó el gran día!</p>
              )}
            </section>
          )}

          <section className="pr-seccion" aria-labelledby="pr-postales" data-reveal>
            <Encabezado frances="Le jour & le lieu" titulo="Cuándo y dónde" id="pr-postales" />
            <div className="pr-postales">
              {partes && (
                <Postal inclinacion={-1.4}>
                  <span className="k">Le jour</span>
                  <span className="v">{partes.semana} {partes.dia} de {partes.mes}</span>
                  <span className="pr-ayuda">a las {partes.hora}</span>
                  {calendario && <a className="pr-enlace" href={calendario} target="_blank" rel="noopener noreferrer">{Icono.calendario} Agregar al calendario</a>}
                </Postal>
              )}
              {lugar && (
                <Postal inclinacion={1.2}>
                  <span className="k">Le lieu</span>
                  <span className="v">{info.lugar || info.direccion}</span>
                  {info.lugar && info.direccion && <span className="pr-ayuda">{info.direccion}</span>}
                  <span className="pr-botones">
                    {info.mapsUrl && <a className="pr-btn pr-btn-linea" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>}
                    <button className="pr-btn pr-btn-linea" type="button" onClick={() => copiar(lugar, "Dirección copiada")}>{Icono.copiar} Copiar</button>
                  </span>
                </Postal>
              )}
              {activo("vestimenta") && vestimenta.titulo && (
                <Postal inclinacion={-0.8}>
                  <span className="k">La tenue</span>
                  <span className="v">{vestimenta.titulo}</span>
                  {vestimenta.nota && <span className="pr-ayuda">{vestimenta.nota}</span>}
                </Postal>
              )}
            </div>
          </section>

          {cronograma.length > 0 && (
            <section className="pr-seccion" aria-labelledby="pr-menu" data-reveal>
              <div className="pr-carta">
                <p className="pr-frances">{info.tituloItinerario || "Le programme"}</p>
                <h2 id="pr-menu" className="pr-carta-titulo">Menu de la soirée</h2>
                <span className="pr-filete" aria-hidden="true"><i /></span>
                <ol className="pr-carta-lista">
                  {cronograma.map((c, i) => (
                    <li key={i}><span className="pr-carta-que">{c.titulo}</span><span className="pr-puntos" aria-hidden="true" /><span className="pr-carta-hora">{c.hora}</span></li>
                  ))}
                </ol>
              </div>
            </section>
          )}

          {(padres || grupos.length > 0) && (
            <section className="pr-seccion pr-familia" aria-labelledby="pr-familia" data-reveal>
              <Encabezado frances="Avec la bénédiction de" titulo={welcome.padresTexto || "Con la bendición de mis padres"} id="pr-familia" />
              {padres && <p className="pr-quien">{padres}</p>}
              {grupos.map((g, i) => (
                <div key={i} className="pr-grupo">
                  <span className="k">{g.etiqueta}</span>
                  <p className="pr-quien">{g.personas.filter(Boolean).join(" y ")}</p>
                </div>
              ))}
            </section>
          )}

          {activo("historia") && historia.texto && (
            <section className="pr-seccion" aria-labelledby="pr-historia" data-reveal>
              <Encabezado frances="Une lettre" titulo={historia.titulo || "Mi historia"} id="pr-historia" />
              <div className="pr-carta-mano">
                <p>{historia.texto}</p>
                {nombres[0] && <p className="pr-firma">{nombres[0].split(" ")[0]}</p>}
              </div>
            </section>
          )}

          {((activo("sobres") && sobres.texto) || (activo("regalos") && (regalos.texto || regalos.datosTransferencia))) && (
            <section className="pr-seccion" aria-labelledby="pr-regalo" data-reveal>
              <Encabezado frances="Le cadeau" titulo="Mi deseo" id="pr-regalo" />
              <div className="pr-regalo">
                <Arte src={macarons} className="pr-macarons" />
                <p className="pr-lead">{(activo("sobres") && sobres.texto) || regalos.texto || "Tu presencia es mi mejor regalo; si deseas tener un detalle conmigo, aquí te dejo cómo."}</p>
                {activo("regalos") && regalos.datosTransferencia && (
                  <div className="pr-transferir">
                    <div><span className="k">Datos para transferir</span><span className="v">{regalos.datosTransferencia}</span></div>
                    <button className="pr-btn pr-btn-linea" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>{Icono.copiar} Copiar</button>
                  </div>
                )}
              </div>
            </section>
          )}

          {activo("info_importante") && (puntos.length > 0 || importante.nota) && (
            <section className="pr-seccion" aria-labelledby="pr-info" data-reveal>
              <Encabezado frances="À noter" titulo="Ten en cuenta" id="pr-info" />
              <div className="pr-marco">
                {importante.nota && <p className="pr-ayuda">{importante.nota}</p>}
                {puntos.length > 0 && <ul className="pr-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
              </div>
            </section>
          )}

          {activo("faq") && preguntas.length > 0 && (
            <section className="pr-seccion" aria-labelledby="pr-faq" data-reveal>
              <Encabezado frances="Questions" titulo="Preguntas frecuentes" id="pr-faq" />
              <div className="pr-marco pr-faq">
                {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary><p>{f.r}</p></details>)}
              </div>
            </section>
          )}

          {invitacion && (
            <section className="pr-seccion pr-rsvp" aria-labelledby="pr-confirmar" data-reveal>
              <p className="pr-frances">R.S.V.P.</p>
              <h2 id="pr-confirmar">Répondez, s'il vous plaît</h2>
              <p className="pr-traduccion">Confírmame tu asistencia</p>
              <span className="pr-filete" aria-hidden="true"><i /></span>
              <p className="pr-ayuda">{limite ? <>Tienes hasta el <b>{limite}</b>.</> : "Te espero."}</p>
              <button className="pr-btn pr-btn-oro" type="button" onClick={() => setRsvpAbierto(true)}>Confirmar asistencia</button>
            </section>
          )}

          <footer className="pr-final">
            {/* La torre al atardecer vista desde una ventana en arco: retoma la entrada. */}
            <div className="pr-ventana" aria-hidden="true"><img src={atardecer} alt="" /></div>
            <p className="pr-frances">À bientôt</p>
            <p className="pr-te-espero">{esXV ? "¡Te espero!" : "¡Te esperamos!"}</p>
            {nombres.length > 0 && <p className="pr-ayuda">Con cariño, {nombres.join(" & ")}</p>}
          </footer>
        </main>
      )}

      <div className={`pr-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="pr-modal" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="pr-modal-caja">
            <button type="button" className="pr-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">×</button>
            <p className="pr-modal-rsvp">R.S.V.P.</p>
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
