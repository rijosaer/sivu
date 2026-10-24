import { useEffect, useMemo, useRef, useState } from "react";
import "./jardin.css";
import RSVP from "../../components/RSVP";
import {
  Castillo, Corbata, Vestido, CalendarioCheck, Sobre, Pin, CheckCirculo, Corazon, Play, Pausa,
} from "./iconos";
import follaje from "./arte/follaje.webp";
import princesa from "./arte/princesa.webp";
import rama from "./arte/rama.webp";
import castillo from "./arte/castillo.webp";
import nenufar from "./arte/nenufar.webp";
import fondo from "./arte/fondo.webp";
import esquina from "./arte/esquina.webp";
import sobreInterior from "./arte/sobre-interior.webp";
import sobreBolsillo from "./arte/sobre-bolsillo.webp";
import sobreSolapa from "./arte/sobre-solapa.webp";
import sobreSolapaDorso from "./arte/sobre-solapa-dorso.webp";
import mariposa from "./arte/mariposa.webp";
import ramito from "./arte/ramito.webp";
import tiara from "./arte/tiara.webp";
import mancha from "./arte/mancha.webp";

// Diseño "Jardín encantado": acuarela verde con princesa, pensado para XV años
// pero válido para cualquier evento. Lee las mismas secciones del panel que el
// diseño clásico (welcome, informacion_boda, vestimenta, sobres, historia,
// info_importante, faq, musica); solo cambia cómo se presentan. Las
// ilustraciones son acuarelas con fondo transparente (el blanco del papel se
// convirtió en alfa), así que se posan sobre el fondo verde sin recuadros.

const ZONA = "America/Bogota";

function partesFecha(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const f = (o) => new Intl.DateTimeFormat("es-CO", { timeZone: ZONA, ...o }).format(d);
  return {
    fecha: d,
    dia: f({ day: "numeric" }),
    semana: f({ weekday: "long" }),
    mes: f({ month: "long" }),
    anio: f({ year: "numeric" }),
    hora: f({ hour: "numeric", minute: "2-digit", hour12: true })
      .replace(/\s?a\.?\s?m\.?/i, " A.M.")
      .replace(/\s?p\.?\s?m\.?/i, " P.M."),
  };
}

function limiteLegible(fecha) {
  if (!fecha) return null;
  const d = new Date(`${fecha}T00:00:00-05:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", timeZone: ZONA });
}

// Aparición suave de cada bloque al llegar a él.
function useAparecer(dep) {
  const ref = useRef(null);
  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    const els = raiz.querySelectorAll(".jd-ap");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("jd-visto"));
      return;
    }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("jd-visto"); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [dep]);
  return ref;
}

function useFuentes() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Cinzel:wght@400;500&display=swap";
    document.head.appendChild(link);
    return () => link.remove();
  }, []);
}

// Decoración: acuarela sin significado para lectores de pantalla.
function Arte({ src, className }) {
  return <img src={src} alt="" aria-hidden="true" className={className} />;
}

function Portada({ welcome, invitacion, onAbrir }) {
  const [abriendo, setAbriendo] = useState(false);
  const pases = invitacion
    ? invitacion.tipo === "cupos"
      ? (invitacion.cupos || 0) + 1
      : (invitacion.miembros || []).filter((m) => !m.es_acompanante).length || 1
    : 0;
  const inicial = (welcome.novioEl || "").trim().charAt(0).toUpperCase();
  function abrir() {
    if (abriendo) return;
    setAbriendo(true);
    // Secuencia: se rompe el sello, se abre la solapa, sale la tarjeta y la
    // portada se desvanece (ver .jd-abriendo en jardin.css).
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(onAbrir, reducido ? 300 : 2700);
  }
  return (
    <div className={`jd-portada ${abriendo ? "jd-abriendo" : ""}`} onClick={(e) => { if (!e.target.closest("button, a")) abrir(); }}>
      <Arte src={esquina} className="jd-esquina jd-esquina-sup" />
      <Arte src={esquina} className="jd-esquina jd-esquina-inf" />
      <div className="jd-portada-in">
        <p className="jd-mis">{welcome.bienvenidaTexto || "Mis XV"}</p>
        <h1 className="jd-script jd-portada-nombre">{welcome.novioEl}</h1>
        {invitacion?.nombre && <p className="jd-para">Para: <b>{invitacion.nombre}</b></p>}

        <button type="button" className="jd-sobre" onClick={abrir} aria-label="Abrir la invitación">
          <span className="jd-sobre-sombra" />
          <img src={sobreInterior} alt="" className="jd-sobre-interior" />
          <span className="jd-sobre-carta">
            <small>{welcome.bienvenidaTexto || "Mis XV"}</small>
            <span className="jd-script">{(welcome.novioEl || "").split(" ")[0]}</span>
          </span>
          <img src={sobreBolsillo} alt="" className="jd-sobre-bolsillo" />
          <span className="jd-sobre-solapa">
            <img src={sobreSolapa} alt="" className="jd-solapa-cara" />
            <img src={sobreSolapaDorso} alt="" className="jd-solapa-cara jd-solapa-dorso" />
          </span>
          <span className="jd-sello">
            <span className="jd-sello-letra">{inicial || <Corazon className="jd-sello-ico" />}</span>
          </span>
        </button>
        <p className="jd-toca">
          <svg className="jd-toca-flecha" viewBox="0 0 60 40" aria-hidden="true">
            <path d="M56 36C40 34 22 26 10 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 4" strokeLinecap="round" />
            <path d="M4 12l6-6 4 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Toca el sello para abrir tu invitación
        </p>

        {pases > 0 && (
          <div className="jd-pases">
            <p>Hemos reservado:</p>
            <div className="jd-pases-fila">
              {Array.from({ length: Math.min(pases, 8) }, (_, i) => (
                <span key={i} className="jd-pase">
                  <small>{i + 1}</small>
                  <Corazon className="jd-pase-ico" />
                </span>
              ))}
            </div>
            <p>{pases === 1 ? "Pase en tu honor" : "Pases en tu honor"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Musica({ audioRef, src, sonando, setSonando }) {
  if (!src) return null;
  function alternar() {
    const a = audioRef.current;
    if (!a) return;
    if (sonando) { a.pause(); setSonando(false); }
    else a.play().then(() => setSonando(true)).catch(() => {});
  }
  return (
    <div className="jd-musica">
      <Arte src={nenufar} className="jd-nenufar jd-nenufar-izq" />
      <button type="button" className="jd-play jd-ap" onClick={alternar} aria-label={sonando ? "Pausar música" : "Reproducir música"}>
        {sonando ? <Pausa className="jd-play-ico" /> : <Play className="jd-play-ico" />}
      </button>
      <Arte src={nenufar} className="jd-nenufar jd-nenufar-der" />
    </div>
  );
}

function Fecha({ partes }) {
  if (!partes) return null;
  return (
    <div className="jd-fecha jd-ap">
      <span className="jd-fecha-lado">{partes.semana}</span>
      <span className="jd-fecha-centro">
        <small>{partes.mes}</small>
        <b>{partes.dia}</b>
        <small>{partes.anio}</small>
      </span>
      <span className="jd-fecha-lado">{partes.hora}</span>
    </div>
  );
}

function CuentaRegresiva({ fecha }) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!fecha) return null;
  const resta = Math.max(0, fecha.getTime() - ahora);
  const s = Math.floor(resta / 1000);
  const datos = [
    [Math.floor(s / 86400), "días"],
    [Math.floor((s % 86400) / 3600), "horas"],
    [Math.floor((s % 3600) / 60), "min"],
    [s % 60, "seg"],
  ];
  return (
    <section className="jd-bloque jd-ap">
      <Arte src={mancha} className="jd-mancha" />
      <p className="jd-etiqueta">{resta ? "Faltan" : "¡Llegó el gran día!"}</p>
      {resta > 0 && (
        <div className="jd-cuenta">
          {datos.map(([n, t]) => (
            <span key={t}>
              <b>{String(n).padStart(2, "0")}</b>
              <small>{t}</small>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Jardin({ site, contenidoDe, invitacion, enEditor, onEnviarRSVP }) {
  useFuentes();
  const [abierta, setAbierta] = useState(enEditor);
  const [rsvpAbierto, setRsvpAbierto] = useState(false);
  const [sonando, setSonando] = useState(false);
  const audioRef = useRef(null);
  const raiz = useAparecer(abierta);

  const welcome = contenidoDe("welcome");
  const info = contenidoDe("informacion_boda");
  const vestimenta = contenidoDe("vestimenta");
  const sobres = contenidoDe("sobres");
  const historia = contenidoDe("historia");
  const importante = contenidoDe("info_importante");
  const faq = contenidoDe("faq");
  const musica = contenidoDe("musica");
  const activo = (tipo) => site.secciones.some((s) => s.tipo === tipo && s.activo !== false);

  const partes = useMemo(() => partesFecha(info.fecha), [info.fecha]);
  const limite = limiteLegible(info.fechaLimiteConfirmacion || site.fechaLimiteConfirmacion);
  const esXV = site.invitacion?.tipoEvento === "xv";
  const audioSrc = site.audioUrl || musica.src;
  const fotos = site.fotosSubidas || [];
  const cronograma = info.cronogramaModo === "detallado" ? info.cronograma || [] : [];
  const padres = [welcome.padreElPadre, welcome.padreElMadre].filter(Boolean);
  const puntos = (importante.items || []).filter(Boolean);
  const preguntas = (faq.items || []).filter((f) => f && f.p);

  function abrir() {
    setAbierta(true);
    window.scrollTo(0, 0);
    // Abrir el sobre es un toque del invitado: es el momento en que el
    // navegador deja arrancar la música.
    if (audioRef.current && !enEditor) audioRef.current.play().then(() => setSonando(true)).catch(() => {});
  }

  return (
    <div className="jd" ref={raiz} style={{ "--jd-fondo": `url(${fondo})` }}>
      <div className="jd-destellos" aria-hidden="true" />
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop />}

      {!abierta && <Portada welcome={welcome} invitacion={invitacion} onAbrir={abrir} />}

      {abierta && (
        <main className="jd-cuerpo">
          <Arte src={follaje} className="jd-follaje" />
          <Arte src={mariposa} className="jd-mariposa jd-mariposa-1" />
          <Arte src={tiara} className="jd-tiara" />
          <Musica audioRef={audioRef} src={audioSrc} sonando={sonando} setSonando={setSonando} />

          {welcome.fraseIntro && <p className="jd-frase jd-ap">{welcome.fraseIntro}</p>}

          <section className="jd-padres jd-con-princesa">
            <Arte src={mancha} className="jd-mancha jd-mancha-xv" />
            <Arte src={princesa} className="jd-princesa jd-princesa-izq" />
            <Arte src={mariposa} className="jd-mariposa jd-mariposa-2" />
            {padres.length > 0 && (
              <div className="jd-ap">
                <p className="jd-script jd-padre">{padres[0]}</p>
                {padres[1] && <><p className="jd-y">&amp;</p><p className="jd-script jd-padre">{padres[1]}</p></>}
              </div>
            )}
            {welcome.padresTexto && <p className="jd-texto jd-ap">{welcome.padresTexto}</p>}
            {esXV && <p className="jd-script jd-monograma jd-ap">XV</p>}
            {esXV && <p className="jd-texto jd-ap">De su adorada hija:</p>}
            <Arte src={rama} className="jd-rama jd-rama-der" />
          </section>

          <h2 className="jd-script jd-nombre jd-ap">{welcome.novioEl}</h2>
          {welcome.novioElla && <p className="jd-script jd-nombre-2 jd-ap">&amp; {welcome.novioElla}</p>}

          <Fecha partes={partes} />

          {(info.lugar || info.direccion) && (
            <section className="jd-lugar jd-ap">
              <Castillo className="jd-castillo-ico" />
              <div>
                {info.lugar && <p className="jd-lugar-nombre">{info.lugar}</p>}
                {info.direccion && <p className="jd-lugar-dir">{info.direccion}</p>}
              </div>
              <Castillo className="jd-castillo-ico" />
            </section>
          )}
          {info.mapsUrl && (
            <a className="jd-boton jd-ap" href={info.mapsUrl} target="_blank" rel="noreferrer">
              <Pin className="jd-boton-ico" /> Ver ubicación
            </a>
          )}

          <Arte src={ramito} className="jd-ramito" />
          <CuentaRegresiva fecha={partes?.fecha} />

          {cronograma.length > 0 && (
            <section className="jd-bloque jd-ap">
              <Arte src={mancha} className="jd-mancha jd-mancha-programa" />
              <Arte src={mariposa} className="jd-mariposa jd-mariposa-3" />
              <p className="jd-etiqueta">{info.tituloItinerario || "Programa"}</p>
              <ol className="jd-programa">
                {cronograma.map((c, i) => (
                  <li key={i}><span>{c.hora}</span><i /><span>{c.titulo}</span></li>
                ))}
              </ol>
            </section>
          )}

          {activo("historia") && historia.texto && (
            <section className="jd-bloque jd-historia jd-con-princesa">
              <Arte src={rama} className="jd-rama jd-rama-izq" />
              <p className="jd-etiqueta jd-ap">{historia.titulo || "Mi historia"}</p>
              <p className="jd-texto jd-ap">{historia.texto}</p>
              {fotos.length > 0 && (
                <div className="jd-fotos jd-ap">
                  {fotos.slice(0, 3).map((f, i) => <img key={f} src={f} alt="" className={`jd-foto jd-foto-${i}`} loading="lazy" />)}
                </div>
              )}
            </section>
          )}

          {activo("vestimenta") && (
            <section className="jd-bloque jd-vestimenta jd-con-princesa">
              <Arte src={mancha} className="jd-mancha" />
              <Arte src={princesa} className="jd-princesa jd-princesa-der" />
              <p className="jd-etiqueta jd-ap">Dress code:</p>
              <div className="jd-dress jd-ap"><Corbata className="jd-dress-ico" /><Vestido className="jd-dress-ico jd-vestido" /></div>
              {vestimenta.titulo && <p className="jd-script jd-dress-titulo jd-ap">{vestimenta.titulo}</p>}
              {(vestimenta.nota || vestimenta.evitar?.length > 0) && (
                <p className="jd-texto jd-ap">
                  {vestimenta.nota || `Amablemente, evitar: ${vestimenta.evitar.map((e) => e.nombre).join(", ")}.`}
                </p>
              )}
            </section>
          )}

          {invitacion && (
            <section className="jd-bloque jd-confirmar">
              <Arte src={mariposa} className="jd-mariposa jd-mariposa-4" />
              <CalendarioCheck className="jd-calendario jd-ap" />
              <p className="jd-texto jd-ap">
                {limite ? <>Por favor, confirma tu asistencia<br />antes del {limite}.</> : "Por favor, confirma tu asistencia."}
              </p>
              <button type="button" className="jd-boton jd-ap" onClick={() => setRsvpAbierto(true)}>
                <CheckCirculo className="jd-boton-ico" /> Confirmar
              </button>
              <Arte src={mariposa} className="jd-mariposa jd-mariposa-5" />
            </section>
          )}

          {activo("sobres") && sobres.texto && (
            <section className="jd-bloque jd-ap">
              <Arte src={mancha} className="jd-mancha" />
              <p className="jd-texto">{sobres.texto}</p>
              <Sobre className="jd-sobre-ico" />
              <p className="jd-etiqueta">Lluvia de sobres</p>
            </section>
          )}

          <Arte src={ramito} className="jd-ramito" />

          {activo("info_importante") && (puntos.length > 0 || importante.nota) && (
            <section className="jd-bloque jd-tarjeta jd-ap">
              <Arte src={esquina} className="jd-tarjeta-esquina" />
              <p className="jd-etiqueta">Información importante</p>
              {importante.nota && <p className="jd-texto">{importante.nota}</p>}
              {puntos.length > 0 && <ul className="jd-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
            </section>
          )}

          {activo("faq") && preguntas.length > 0 && (
            <section className="jd-bloque jd-ap">
              <Arte src={mariposa} className="jd-mariposa jd-mariposa-6" />
              <p className="jd-etiqueta">Preguntas frecuentes</p>
              <div className="jd-faq">
                {preguntas.map((f, i) => (
                  <details key={i}><summary>{f.p}</summary><p>{f.r}</p></details>
                ))}
              </div>
            </section>
          )}

          <footer className="jd-final">
            <p className="jd-script jd-te-esperamos jd-ap">¡Te esperamos!</p>
            <Arte src={castillo} className="jd-castillo" />
          </footer>
        </main>
      )}

      {rsvpAbierto && invitacion && (
        <div className="jd-modal" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="jd-modal-caja">
            <button type="button" className="jd-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">×</button>
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
