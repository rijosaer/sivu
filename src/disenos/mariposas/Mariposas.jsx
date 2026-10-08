import { useMemo, useRef, useState } from "react";
import "./mariposas.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer, enlaceCalendario,
} from "../comun";
import fondo from "./arte/fondo.webp";
import alas from "./arte/alas.webp";
import mariposa1 from "./arte/mariposa-1.webp";
import mariposa2 from "./arte/mariposa-2.webp";
import mariposa3 from "./arte/mariposa-3.webp";

// Diseño «Mariposas y brillo»: fucsia con destellos plateados, arte pintado
// semi-realista con tornasol. Se aparta a propósito de las demás plantillas:
// - Entrada: una mariposa gigante ocupa la pantalla; al tocarla sus alas se
//   abren como dos puertas y sale una bandada de mariposas (las demás usan
//   sobre, boleto o caja de regalo).
// - Cuerpo: en vez de tarjetas apiladas, una «ruta de vuelo» punteada baja
//   serpenteando y cada parada (fecha, lugar, programa…) es una mariposa.
// - Títulos alineados a la izquierda con una estela de brillo, paneles de
//   vidrio esmerilado sobre el fucsia y cifras grandes con escarcha.
// Colores del tema: principal = fucsia, claro = rosa, oscuro = fucsia
// profundo, papel = ciruela de fondo, texto = blanco rosado, mármol y sello
// = platas.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@400;500;600;700&family=Yellowtail&display=swap";

const MARIPOSAS = [mariposa1, mariposa2, mariposa3];

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
const Icono = {
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  calendario: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>,
  musica: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>,
  pausa: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>,
};

function Arte({ src, className, style }) {
  return <img src={src} alt="" aria-hidden="true" className={className} style={style} />;
}

// Trío de mariposas en vuelo (arriba del nombre y en el cierre).
function Trio({ className = "" }) {
  return (
    <div className={`mp-trio ${className}`} aria-hidden="true">
      <img src={mariposa3} alt="" className="mp-trio-1" />
      <img src={mariposa1} alt="" className="mp-trio-2" />
      <img src={mariposa2} alt="" className="mp-trio-3" />
    </div>
  );
}

// Título alineado a la izquierda: etiqueta pequeña, palabra en cursiva y una
// estela de brillo que corre hacia la derecha.
function Titulo({ etiqueta, texto, id }) {
  return (
    <div className="mp-titulo">
      {etiqueta && <p className="mp-etiqueta">{etiqueta}</p>}
      <h2 id={id}>{texto}</h2>
      <span className="mp-estela" aria-hidden="true" />
    </div>
  );
}

// Bandada que sale al abrir: cada mariposa vuela hacia un lado distinto.
const BANDADA = Array.from({ length: 12 }, (_, i) => {
  const ang = (i / 12) * Math.PI * 2 + 0.3;
  return { x: Math.cos(ang) * 70, y: Math.sin(ang) * 80 - 20, giro: (i % 2 ? 1 : -1) * (20 + i * 7), tam: 44 + (i % 4) * 14, retraso: (i % 5) * 70 };
});

function Portada({ welcome, invitacion, onAbrir }) {
  const [abriendo, setAbriendo] = useState(false);
  const pases = pasesDe(invitacion);
  function abrir() {
    if (abriendo) return;
    setAbriendo(true);
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(onAbrir, reducido ? 300 : 2400);
  }
  return (
    <section className={`mp-portada ${abriendo ? "mp-abriendo" : ""}`} aria-labelledby="mp-portada-titulo">
      <div className="mp-portada-arriba">
        <p className="mp-etiqueta">{welcome.bienvenidaTexto || "Mis XV años"}</p>
        <h1 className="mp-portada-nombre" id="mp-portada-titulo">{welcome.novioEl}</h1>
        {invitacion?.nombre && <p className="mp-para">Para <b>{invitacion.nombre}</b></p>}
      </div>

      <button type="button" className="mp-gigante" onClick={abrir} aria-label="Abrir la invitación">
        <span className="mp-ala mp-ala-izq"><img src={alas} alt="" /></span>
        <span className="mp-ala mp-ala-der"><img src={alas} alt="" /></span>
        <span className="mp-bandada" aria-hidden="true">
          {BANDADA.map((b, i) => (
            <img
              key={i}
              src={MARIPOSAS[i % 3]}
              alt=""
              style={{ "--x": `${b.x}vw`, "--y": `${b.y}vh`, "--giro": `${b.giro}deg`, "--tam": `${b.tam}px`, "--retraso": `${b.retraso}ms` }}
            />
          ))}
        </span>
      </button>

      <div className="mp-portada-abajo">
        <p className="mp-toca">Toca la mariposa para abrir</p>
        {pases > 0 && (
          <p className="mp-pases">
            <b>{pases}</b> {pases === 1 ? "pase reservado en tu honor" : "pases reservados en tu honor"}
          </p>
        )}
      </div>
    </section>
  );
}

// Una parada de la ruta: la mariposa va del lado contrario cada vez, y entre
// parada y parada una curva punteada cruza de un lado al otro.
function Parada({ lado, mariposa, children }) {
  return (
    <div className={`mp-parada mp-${lado}`}>
      <Arte src={mariposa} className="mp-marca" />
      <div className="mp-vidrio">{children}</div>
    </div>
  );
}

function Vuelo({ de }) {
  // El marcador está centrado en el 9% (izquierda) o en el 91% (derecha).
  const [x1, x2] = de === "izq" ? [9, 91] : [91, 9];
  return (
    <svg className="mp-vuelo" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
      <path d={`M${x1} 0 C ${x1} 34, ${x2} 26, ${x2} 60`} />
    </svg>
  );
}

export default function Mariposas({ site, contenidoDe, invitacion, enEditor, onEnviarRSVP }) {
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

  // Paradas de la ruta de vuelo, en orden. Cada una es [clave, contenido].
  const paradas = [];
  if (partes) {
    paradas.push(["fecha", (
      <>
        <span className="k">Cuándo</span>
        <span className="v">{partes.semana} {partes.dia} de {partes.mes}</span>
        <span className="mp-ayuda">{partes.hora}</span>
        {calendario && <a className="mp-enlace" href={calendario} target="_blank" rel="noopener noreferrer">{Icono.calendario} Agregar al calendario</a>}
      </>
    )]);
  }
  if (lugar) {
    paradas.push(["lugar", (
      <>
        <span className="k">Dónde</span>
        <span className="v">{info.lugar || info.direccion}</span>
        {info.lugar && info.direccion && <span className="mp-ayuda">{info.direccion}</span>}
        <span className="mp-botones">
          {info.mapsUrl && <a className="mp-btn mp-btn-vidrio" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>}
          <button className="mp-btn mp-btn-vidrio" type="button" onClick={() => copiar(lugar, "Dirección copiada")}>{Icono.copiar} Copiar</button>
        </span>
      </>
    )]);
  }
  if (activo("vestimenta") && vestimenta.titulo) {
    paradas.push(["vestimenta", (
      <>
        <span className="k">Dress code</span>
        <span className="v">{vestimenta.titulo}</span>
        {vestimenta.nota && <span className="mp-ayuda">{vestimenta.nota}</span>}
      </>
    )]);
  }
  cronograma.forEach((c, i) => {
    paradas.push([`programa-${i}`, (
      <>
        <span className="mp-hora">{c.hora}</span>
        <span className="v">{c.titulo}</span>
      </>
    )]);
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
    <div className="mp" ref={raiz} style={{ "--mp-fondo": `url(${fondo})` }}>
      <div className="mp-cielo" aria-hidden="true" />
      <div className="mp-escarcha" aria-hidden="true" />
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop />}
      {audioSrc && abierta && (
        <button className="mp-musica" type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label="Música de fondo">
          {sonando ? Icono.pausa : Icono.musica}
          <span>{sonando ? "Pausar" : "Música"}</span>
        </button>
      )}

      {!abierta && <Portada welcome={welcome} invitacion={invitacion} onAbrir={abrir} />}

      {abierta && (
        <main className="mp-cuerpo" aria-labelledby="mp-titulo">
          <header className="mp-hero">
            <Trio className="mp-hero-trio" />
            {foto && (
              <figure className="mp-polaroid">
                <img src={foto} alt={`Foto de ${nombres[0] || "la quinceañera"}`} />
                <Arte src={mariposa2} className="mp-polaroid-mariposa" />
              </figure>
            )}
            <p className="mp-etiqueta">{welcome.bienvenidaTexto || "Mis XV años"}</p>
            <h1 className="mp-nombre" id="mp-titulo">
              {nombres[0]}
              {nombres[1] && <><br /><span className="mp-y">&amp;</span> {nombres[1]}</>}
            </h1>
            {welcome.fraseIntro && <p className="mp-frase">{welcome.fraseIntro}</p>}
            {partes && (
              <p className="mp-fecha">
                <span>{partes.dia}</span>
                <i aria-hidden="true" />
                <span>{partes.mes}</span>
                <i aria-hidden="true" />
                <span>{partes.anio}</span>
              </p>
            )}
          </header>

          {partes && (
            <section className="mp-seccion" aria-labelledby="mp-cuenta" data-reveal>
              <Titulo etiqueta="Cuenta regresiva" texto="Ya casi…" id="mp-cuenta" />
              {cuenta ? (
                <div className="mp-cuenta" role="timer" aria-labelledby="mp-cuenta">
                  {[["dias", "días"], ["horas", "horas"], ["min", "min"], ["seg", "seg"]].map(([k, l]) => (
                    <div key={k}><span className="n">{cuenta[k]}</span><span className="l">{l}</span></div>
                  ))}
                </div>
              ) : (
                <p className="mp-llego">¡Llegó el gran día!</p>
              )}
            </section>
          )}

          {paradas.length > 0 && (
            <section className="mp-seccion" aria-labelledby="mp-ruta-titulo" data-reveal>
              <Titulo etiqueta={info.tituloItinerario || "La celebración"} texto="Mi noche, paso a paso" id="mp-ruta-titulo" />
              <div className="mp-ruta">
                {paradas.map(([clave, contenido], i) => {
                  const lado = i % 2 === 0 ? "izq" : "der";
                  return (
                    <div key={clave}>
                      {i > 0 && <Vuelo de={i % 2 === 1 ? "izq" : "der"} />}
                      <Parada lado={lado} mariposa={MARIPOSAS[i % 3]}>{contenido}</Parada>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {(padres || grupos.length > 0) && (
            <section className="mp-seccion mp-familia" aria-labelledby="mp-familia" data-reveal>
              <Titulo etiqueta={welcome.padresTexto || "Con la bendición de"} texto="Mi familia" id="mp-familia" />
              <div className="mp-nombres-familia">
                {padres && (
                  <div><span className="k">Mis padres</span><span className="who">{padres}</span></div>
                )}
                {grupos.map((g, i) => (
                  <div key={i}><span className="k">{g.etiqueta}</span><span className="who">{g.personas.filter(Boolean).join(" y ")}</span></div>
                ))}
              </div>
            </section>
          )}

          {activo("historia") && historia.texto && (
            <section className="mp-seccion" aria-labelledby="mp-historia" data-reveal>
              <Titulo etiqueta={historia.titulo || "Mi historia"} texto="Quince alas" id="mp-historia" />
              <p className="mp-cita">{historia.texto}</p>
            </section>
          )}

          {((activo("sobres") && sobres.texto) || (activo("regalos") && (regalos.texto || regalos.datosTransferencia))) && (
            <section className="mp-seccion" aria-labelledby="mp-regalo" data-reveal>
              <Titulo etiqueta="Regalos" texto="Mi deseo" id="mp-regalo" />
              <div className="mp-vidrio mp-regalo">
                <p>{(activo("sobres") && sobres.texto) || regalos.texto || "Tu presencia es mi mejor regalo; si deseas tener un detalle conmigo, aquí te dejo cómo."}</p>
                {activo("regalos") && regalos.datosTransferencia && (
                  <div className="mp-transferir">
                    <div><span className="k">Datos para transferir</span><span className="v">{regalos.datosTransferencia}</span></div>
                    <button className="mp-btn mp-btn-vidrio" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>{Icono.copiar} Copiar</button>
                  </div>
                )}
              </div>
            </section>
          )}

          {activo("info_importante") && (puntos.length > 0 || importante.nota) && (
            <section className="mp-seccion" aria-labelledby="mp-info" data-reveal>
              <Titulo etiqueta="Ten en cuenta" texto="Importante" id="mp-info" />
              <div className="mp-vidrio">
                {importante.nota && <p className="mp-ayuda">{importante.nota}</p>}
                {puntos.length > 0 && <ul className="mp-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
              </div>
            </section>
          )}

          {activo("faq") && preguntas.length > 0 && (
            <section className="mp-seccion" aria-labelledby="mp-faq" data-reveal>
              <Titulo etiqueta="Dudas" texto="Preguntas" id="mp-faq" />
              <div className="mp-vidrio mp-faq">
                {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary><p>{f.r}</p></details>)}
              </div>
            </section>
          )}

          {invitacion && (
            <section className="mp-seccion mp-cierre" aria-labelledby="mp-confirmar" data-reveal>
              <Arte src={mariposa1} className="mp-cierre-mariposa mp-cierre-mariposa-1" />
              <Arte src={mariposa3} className="mp-cierre-mariposa mp-cierre-mariposa-2" />
              <p className="mp-etiqueta">Confirmación</p>
              <h2 id="mp-confirmar">¿Vuelas conmigo?</h2>
              <p className="mp-ayuda">{limite ? <>Confírmame antes del <b>{limite}</b>.</> : "Confírmame tu asistencia."}</p>
              <button className="mp-btn mp-btn-plata" type="button" onClick={() => setRsvpAbierto(true)}>Confirmar asistencia</button>
            </section>
          )}

          <footer className="mp-final">
            <Trio className="mp-final-trio" />
            <p className="mp-te-espero">{esXV ? "¡Te espero!" : "¡Te esperamos!"}</p>
            {nombres.length > 0 && <p className="mp-ayuda">Con cariño, {nombres.join(" & ")}</p>}
          </footer>
        </main>
      )}

      <div className={`mp-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="mp-modal" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="mp-modal-caja">
            <button type="button" className="mp-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">×</button>
            <Arte src={mariposa1} className="mp-modal-mariposa" />
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
