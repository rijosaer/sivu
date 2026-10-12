import { useEffect, useMemo, useRef, useState } from "react";
import "./valle.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer, enlaceCalendario,
} from "../comun";
import noche from "./arte/noche.webp";
import rama from "./arte/rama.webp";
import esquina from "./arte/esquina.webp";
import hacienda from "./arte/hacienda.webp";

// Diseño «Valle de luna»: acuarela azul noche, crema y oro, pensado para boda.
// La invitación se va armando sola: al abrirla sube el papel sobre el valle y
// se escriben los nombres; después, cada bloque se dibuja cuando llega a la
// pantalla (filetes dorados que se trazan, letras que aparecen, la hacienda que
// pasa de boceto a color, el itinerario que se conecta paso a paso). Un hilo
// dorado baja por los costados al ritmo del scroll.
// Colores del tema: principal = azul noche, claro = azul empolvado, oscuro =
// azul profundo, papel = crema, sello = oro.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&family=Pinyon+Script&display=swap";

// Número pseudoaleatorio estable entre 0 y 1 (mismas estrellas en cada carga).
const azar = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
const ESTRELLAS = Array.from({ length: 22 }, (_, i) => ({
  x: azar(i + 1) * 100, y: azar(i + 51) * 34, t: 1 + azar(i + 91) * 1.6, d: -azar(i + 131) * 4,
}));
// Luces del pueblo junto al lago (en % de la pintura).
const LUCES = Array.from({ length: 14 }, (_, i) => ({
  x: 4 + azar(i + 201) * 30, y: 70 + azar(i + 251) * 3.5, d: -azar(i + 301) * 3,
}));

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round" };
const T = (props) => <path className="va-trazo" pathLength="1" {...props} />;
const Icono = {
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  calendario: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>,
  musica: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>,
  pausa: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>,
  regalo: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="3.5" y="9" width="17" height="11.5" rx="1" /><path d="M2.5 9h19v-3h-19zM12 6v14.5M12 6c-1.5-3.5-6-3.5-5 0M12 6c1.5-3.5 6-3.5 5 0" /></svg>,
};

// Íconos del itinerario: se dibujan con trazos que se van pintando. El que
// toca se elige por palabras del título; si no reconoce ninguna, un corazón.
const DIBUJOS = {
  anillos: <><circle className="va-trazo" pathLength="1" cx="21" cy="27" r="7" /><circle className="va-trazo" pathLength="1" cx="29" cy="27" r="7" /><T d="M18 16l3-3h4l3 3-5 4z" /></>,
  copas: <><T d="M15.5 17.5l5.8-1.6 1.4 9.6c.3 2.3-1.3 3.6-3.1 3.4l2 7.4m-4.5 1.2l4.5-1.2" /><T d="M34.5 17.5l-5.8-1.6-1.4 9.6c-.3 2.3 1.3 3.6 3.1 3.4l-2 7.4m4.5 1.2l-4.5-1.2" /><T d="M25 9v3.5M21.5 10.5l1.4 2.4M28.5 10.5l-1.4 2.4" /></>,
  cena: <><T d="M13 31a12 12 0 0 1 24 0z" /><T d="M10.5 33.5h29" /><circle className="va-trazo" pathLength="1" cx="25" cy="17" r="1.8" /></>,
  fiesta: <><T d="M24 9v6" /><circle className="va-trazo" pathLength="1" cx="24" cy="25" r="10" /><ellipse className="va-trazo" pathLength="1" cx="24" cy="25" rx="4.5" ry="10" /><T d="M14 25h20M15.5 20h17M15.5 30h17" /><T d="M36 10v6M33 13h6" /></>,
  puerta: <><T d="M16 37V20a9 9 0 0 1 18 0v17" /><T d="M12 37h26" /><T d="M25 11v26" /></>,
  palabras: <><T d="M20 12h10v13a5 5 0 0 1-10 0z" /><T d="M16 24a9 9 0 0 0 18 0M25 33v5M20 38h10" /></>,
  pastel: <><T d="M13 37h24M15 37V29h20v8M18 29v-6h14v6" /><T d="M25 23v-4" /><T d="M25 15c-1.5 1.5-1.5 3 0 4 1.5-1 1.5-2.5 0-4z" /></>,
  foto: <><T d="M12 18h6l2-3h10l2 3h6v17H12z" /><circle className="va-trazo" pathLength="1" cx="25" cy="26" r="5.5" /></>,
  musica: <><T d="M20 33V15l14-3v18" /><circle className="va-trazo" pathLength="1" cx="17" cy="33" r="3" /><circle className="va-trazo" pathLength="1" cx="31" cy="30" r="3" /></>,
  corazon: <T d="M25 35s-11-7-11-14a6 6 0 0 1 11-3 6 6 0 0 1 11 3c0 7-11 14-11 14z" />,
};
const CLAVES_ICONO = [
  [/ceremon|misa|iglesia|boda|acta|votos|civil|religios/i, "anillos"],
  [/c[oó]ctel|brindis|aperitiv|champ|bienvenida/i, "copas"],
  [/cena|comida|banquete|almuerzo|mesa|buffet/i, "cena"],
  [/fiesta|baile|after|rumba|dj|celebraci/i, "fiesta"],
  [/recepci|llegada|entrada|ingreso|puertas/i, "puerta"],
  [/palabras|discurso|brindis de|mensaje/i, "palabras"],
  [/pastel|torta|postre|dulce/i, "pastel"],
  [/foto|sesi[oó]n/i, "foto"],
  [/vals|m[uú]sica|serenata|mariachi|banda/i, "musica"],
];
const iconoDe = (titulo = "") => DIBUJOS[(CLAVES_ICONO.find(([re]) => re.test(titulo)) || [])[1] || "corazon"];

// Texto partido en letras o palabras para que aparezcan de a una; el texto
// entero queda para lectores de pantalla.
function Letras({ texto, retraso = 0, paso = 45 }) {
  if (!texto) return null;
  return (
    <>
      <span className="va-sr">{texto}</span>
      {[...texto].map((c, i) => (
        <span key={i} className="va-l" aria-hidden="true" style={{ "--d": `${retraso + i * paso}ms` }}>{c === " " ? " " : c}</span>
      ))}
    </>
  );
}
function Palabras({ texto, retraso = 0, paso = 60 }) {
  if (!texto) return null;
  return (
    <>
      <span className="va-sr">{texto}</span>
      {texto.split(/\s+/).map((p, i) => (
        <span key={i} className="va-p" aria-hidden="true" style={{ "--d": `${retraso + i * paso}ms` }}>{p} </span>
      ))}
    </>
  );
}

function Arte({ src, className }) {
  return <img src={src} alt="" aria-hidden="true" className={className} decoding="async" />;
}

// Filete con un adorno al centro que se traza solo.
function Filete({ adorno = "rombo", retraso = 0 }) {
  return (
    <span className="va-filete" aria-hidden="true" style={{ "--d": `${retraso}ms` }}>
      <i />
      {adorno === "anillos" ? (
        <svg viewBox="0 0 40 20"><circle className="va-trazo" pathLength="1" cx="15" cy="10" r="6.5" /><circle className="va-trazo" pathLength="1" cx="25" cy="10" r="6.5" /></svg>
      ) : (
        <svg viewBox="0 0 20 20"><T d="M10 3l5 7-5 7-5-7z" /></svg>
      )}
      <i />
    </span>
  );
}

function Titulo({ children, id }) {
  return (
    <h2 className="va-titulo" id={id}>
      <i aria-hidden="true" /><span>{children}</span><i aria-hidden="true" />
    </h2>
  );
}

// Ramita de laurel simétrica, hojas del centro hacia afuera.
function Laurel() {
  const hojas = [];
  for (const lado of [-1, 1]) {
    for (let k = 0; k < 5; k++) {
      const x = 60 + lado * (10 + k * 10), y = 15 - k * 0.3, dx = lado * 8;
      hojas.push(`M${x} ${y} q${dx * 0.2} -7 ${dx} -7 q${-dx * 0.2} 6 ${-dx} 7z`);
      hojas.push(`M${x - lado * 4} ${y + 0.6} q${dx * 0.2} 7 ${dx} 7 q${-dx * 0.2} -6 ${-dx} -7z`);
    }
  }
  return (
    <svg className="va-laurel" viewBox="0 0 120 30" aria-hidden="true">
      <T d="M60 16 Q34 12 8 17" /><T d="M60 16 Q86 12 112 17" />
      {hojas.map((d, i) => <T key={i} d={d} style={{ "--d": `${400 + (i % 10) * 70}ms` }} />)}
    </svg>
  );
}

// El valle de noche con estrellas que titilan y las luces del pueblo en el lago.
function Valle({ src, className = "" }) {
  return (
    <div className={`va-valle ${className}`} aria-hidden="true">
      <img src={src} alt="" className="va-noche" />
      {ESTRELLAS.map((e, i) => (
        <i key={i} className="va-estrella" style={{ left: `${e.x}%`, top: `${e.y}%`, "--t": `${e.t}px`, "--d": `${e.d}s` }} />
      ))}
      {LUCES.map((l, i) => (
        <i key={i} className="va-luz" style={{ left: `${l.x}%`, top: `${l.y}%`, "--d": `${l.d}s` }} />
      ))}
    </div>
  );
}

function Portada({ arte, welcome, nombres, invitacion, onAbrir }) {
  const [abriendo, setAbriendo] = useState(false);
  const pases = pasesDe(invitacion);
  const iniciales = nombres.map((n) => n.trim().charAt(0).toUpperCase());
  function abrir() {
    if (abriendo) return;
    setAbriendo(true);
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(onAbrir, reducido ? 200 : 1100);
  }
  return (
    <section className={`va-portada ${abriendo ? "va-abriendo" : ""}`} aria-labelledby="va-portada-titulo">
      <Valle src={arte.noche} />
      <Arte src={arte.rama} className="va-portada-rama va-portada-rama-izq" />
      <Arte src={arte.rama} className="va-portada-rama va-portada-rama-der" />
      <div className="va-portada-texto">
        <p className="va-mayus va-claro">{welcome.bienvenidaTexto || "Nos casamos"}</p>
        <h1 className="va-portada-nombres" id="va-portada-titulo">
          {nombres[0]}
          {nombres[1] && <><span className="va-y"> &amp; </span>{nombres[1]}</>}
        </h1>
        {invitacion?.nombre && <p className="va-para">Para <b>{invitacion.nombre}</b></p>}
        <button type="button" className="va-sello" onClick={abrir} aria-label="Abrir la invitación">
          <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" /><circle cx="50" cy="50" r="40" /></svg>
          <span>{iniciales.join(" & ") || "♥"}</span>
        </button>
        <p className="va-toca">Toca el sello para abrir</p>
        {pases > 0 && (
          <p className="va-pases"><b>{pases}</b> {pases === 1 ? "pase reservado en tu honor" : "pases reservados en tu honor"}</p>
        )}
      </div>
    </section>
  );
}

// Hilo dorado que baja por los costados del cuerpo al ritmo del scroll.
function useHilo(abierta) {
  const ref = useRef(null);
  useEffect(() => {
    const cuerpo = ref.current;
    if (!abierta || !cuerpo) return;
    const svg = cuerpo.querySelector(".va-hilo");
    const caminos = svg.querySelectorAll(".va-hilo-linea");
    const capas = svg.querySelectorAll(".va-hilo-capa");
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onda = (x0, fase, h) => {
      let d = `M${x0} 0`;
      for (let y = 0; y < h; y += 180) {
        const y1 = Math.min(h, y + 180);
        d += ` Q${(x0 + 12 * Math.sin(y / 240 + fase)).toFixed(1)} ${y + 90} ${(x0 + 6 * Math.sin(y1 / 240 + fase)).toFixed(1)} ${y1}`;
      }
      return d;
    };
    const medir = () => {
      const w = cuerpo.offsetWidth, h = cuerpo.offsetHeight;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      const izq = onda(16, 0, h), der = onda(w - 16, 2, h);
      caminos[0].setAttribute("d", izq);
      caminos[1].setAttribute("d", der);
      // Las capas de papel de los costados, como los pliegues del boceto.
      capas[0].setAttribute("d", `${izq} L0 ${h} L0 0 Z`);
      capas[1].setAttribute("d", `${der} L${w} ${h} L${w} 0 Z`);
    };
    let cuadro = 0;
    const avanzar = () => {
      cuadro = 0;
      const r = cuerpo.getBoundingClientRect();
      const p = reducido ? 1 : Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / r.height));
      caminos.forEach((c) => (c.style.strokeDashoffset = String(1 - p)));
    };
    const pedir = () => { if (!cuadro) cuadro = requestAnimationFrame(avanzar); };
    const ro = new ResizeObserver(() => { medir(); pedir(); });
    ro.observe(cuerpo);
    addEventListener("scroll", pedir, { passive: true });
    return () => { ro.disconnect(); removeEventListener("scroll", pedir); cancelAnimationFrame(cuadro); };
  }, [abierta]);
  return ref;
}

// `arte` y `variante` los usa Valle claro (ValleClaro.jsx): mismo diseño con
// acuarelas más luminosas y la clase .va-v-claro.
export default function ValleDeLuna({ site, contenidoDe, invitacion, enEditor, onEnviarRSVP, arte: arteVariante, variante }) {
  const arte = { noche, rama, esquina, hacienda, ...arteVariante };
  useFuentes(FUENTES);
  const [abierta, setAbierta] = useState(enEditor);
  const [rsvpAbierto, setRsvpAbierto] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [aviso, setAviso] = useState("");
  const audioRef = useRef(null);
  const raiz = useAparecer(abierta, "[data-arma]", "va-armado");
  const cuerpoRef = useHilo(abierta);

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
  const nombres = [welcome.novioEl, welcome.novioElla].filter(Boolean);
  const audioSrc = site.audioUrl || musica.src;
  const fotos = site.fotosSubidas || [];
  const cronograma = info.cronogramaModo === "detallado" ? (info.cronograma || []).filter((c) => c && (c.hora || c.titulo)) : [];
  const padresElla = [welcome.padreEllaPadre, welcome.padreEllaMadre].filter(Boolean);
  const padresEl = [welcome.padreElPadre, welcome.padreElMadre].filter(Boolean);
  const grupos = (padrinos.grupos || []).filter((g) => g && (g.personas || []).some(Boolean));
  const permitidos = (vestimenta.permitidos || []).filter(Boolean);
  const evitar = (vestimenta.evitar || []).filter(Boolean);
  const enlaces = (regalos.enlaces || []).filter((e) => e?.url);
  const puntos = (importante.items || []).filter(Boolean);
  const preguntas = (faq.items || []).filter((f) => f && f.p);
  const lugar = [info.lugar, info.direccion].filter(Boolean).join(", ");
  const calendario = enlaceCalendario({ titulo: `Boda ${nombres.join(" & ")}`.trim(), fecha: partes?.fecha, lugar });
  const hayRegalo = (activo("sobres") && sobres.texto) || (activo("regalos") && (regalos.texto || enlaces.length > 0 || regalos.datosTransferencia));

  function abrir() {
    setAbierta(true);
    window.scrollTo(0, 0);
    // Tocar el sello es el gesto del invitado que deja arrancar la música.
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
    <div className={`va ${variante ? `va-v-${variante}` : ""}`} ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop />}
      {audioSrc && abierta && (
        <button className="va-musica" type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label="Música de fondo">
          {sonando ? Icono.pausa : Icono.musica}
        </button>
      )}

      {!abierta && <Portada arte={arte} welcome={welcome} nombres={nombres} invitacion={invitacion} onAbrir={abrir} />}

      {abierta && (
        <main className="va-tarjeta">
          {/* ---- Arco con el valle y el papel que sube con los nombres ---- */}
          <header className="va-hero" aria-labelledby="va-titulo">
            <div className="va-arco">
              <Valle src={arte.noche} />
            </div>
            <Arte src={arte.rama} className="va-hero-rama va-hero-rama-izq" />
            <Arte src={arte.rama} className="va-hero-rama va-hero-rama-der" />
            <div className="va-papel">
              <svg className="va-papel-borde" viewBox="0 0 400 130" aria-hidden="true">
                {/* La cinta azul asoma por la derecha, sobre el filo del papel. */}
                <path className="va-cinta-fondo" d="M150 30 C215 40 300 84 400 14 L400 150 L150 150 Z" />
                <path className="va-papel-fondo" d="M0 72 C70 8 160 6 222 46 S344 104 400 50 L400 150 L0 150 Z" />
                <path className="va-trazo va-oro" pathLength="1" d="M0 72 C70 8 160 6 222 46 S344 104 400 50" />
                <path className="va-trazo va-oro va-oro-2" pathLength="1" d="M150 30 C215 40 300 84 400 14" />
              </svg>
              <div className="va-papel-cuerpo">
                <p className="va-mayus va-anuncio">{welcome.bienvenidaTexto || "Nos casamos"}</p>
                <h1 className="va-nombres" id="va-titulo">
                  <span className="va-nombre"><Letras texto={nombres[0]} retraso={900} paso={70} /></span>
                  {nombres[1] && (
                    <>
                      <span className="va-amp" aria-hidden="true"><i /><span>&amp;</span><i /></span>
                      <span className="va-sr"> y </span>
                      <span className="va-nombre"><Letras texto={nombres[1]} retraso={1500 + nombres[0].length * 70} paso={70} /></span>
                    </>
                  )}
                </h1>
                <Filete retraso={2300} />
                {welcome.fraseIntro && <p className="va-frase"><Palabras texto={welcome.fraseIntro} retraso={2600} paso={55} /></p>}
              </div>
            </div>
          </header>

          <div className="va-cuerpo" ref={cuerpoRef}>
            <svg className="va-hilo" aria-hidden="true">
              <path className="va-hilo-capa" /><path className="va-hilo-capa" />
              <path className="va-hilo-linea" pathLength="1" /><path className="va-hilo-linea" pathLength="1" />
            </svg>

            {/* Cinta que cruza en diagonal bajo los nombres, como en el boceto:
                papel arriba, cinta azul con filetes dorados y una capa clara. */}
            <div className="va-cruce" data-arma aria-hidden="true">
              <svg viewBox="0 0 400 230">
                <path className="va-cruce-claro" d="M0 -10 C10 52 78 88 156 110 C244 134 330 178 400 232 L400 252 C330 204 246 158 160 134 C84 112 14 76 0 14 Z" />
                <path className="va-cruce-cinta" d="M0 -40 C8 30 70 62 150 84 C240 108 330 150 400 200 L400 232 C330 178 244 134 156 110 C78 88 10 52 0 -10 Z" />
                <path className="va-trazo" pathLength="1" d="M0 -40 C8 30 70 62 150 84 C240 108 330 150 400 200" />
                <path className="va-trazo" pathLength="1" style={{ "--d": "250ms" }} d="M0 -10 C10 52 78 88 156 110 C244 134 330 178 400 232" />
                <path className="va-trazo va-oro-2" pathLength="1" style={{ "--d": "450ms" }} d="M0 14 C14 76 84 112 160 134 C246 158 330 204 400 252" />
              </svg>
            </div>

            {(padresElla.length > 0 || padresEl.length > 0) && (
              <section className="va-bloque va-padres" data-arma aria-label="Padres">
                <p className="va-texto va-entra">{welcome.padresTexto || "Con la bendición de nuestros padres"}</p>
                <div className="va-padres-fila">
                  {[padresEl, padresElla].filter((p) => p.length).map((p, i) => (
                    <div key={i} className="va-entra" style={{ "--d": `${300 + i * 200}ms` }}>
                      {p.map((n) => <p key={n} className="va-padre">{n}</p>)}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {partes && (
              <section className="va-bloque va-fecha" data-arma aria-label="Fecha">
                <Arte src={arte.rama} className="va-rama va-rama-der" />
                <p className="va-mayus va-entra va-abre">{partes.semana}</p>
                <div className="va-fecha-fila">
                  <span className="va-num va-entra" style={{ "--d": "250ms" }}>{partes.dia}</span>
                  <i className="va-vr" style={{ "--d": "350ms" }} />
                  <span className="va-mes va-entra" style={{ "--d": "450ms" }}>{partes.mes}<br />{partes.anio}</span>
                  <i className="va-vr" style={{ "--d": "550ms" }} />
                  <span className="va-hora va-entra" style={{ "--d": "650ms" }}>{partes.hora24}<small>hrs</small></span>
                </div>
                <Filete adorno="anillos" retraso={800} />
                {calendario && (
                  <a className="va-enlace va-entra" style={{ "--d": "1100ms" }} href={calendario} target="_blank" rel="noopener noreferrer">
                    {Icono.calendario} Agregar al calendario
                  </a>
                )}
              </section>
            )}

            {partes && (
              <section className="va-bloque va-cuenta" data-arma aria-labelledby="va-faltan">
                <p className="va-mayus va-entra" id="va-faltan">Faltan</p>
                {cuenta ? (
                  <div className="va-cuenta-fila" role="timer" aria-labelledby="va-faltan">
                    {[["dias", "días"], ["horas", "horas"], ["min", "min"], ["seg", "seg"]].map(([k, l], i) => (
                      <div key={k} className="va-entra" style={{ "--d": `${200 + i * 120}ms` }}>
                        <svg viewBox="0 0 60 60" aria-hidden="true"><circle className="va-trazo" pathLength="1" cx="30" cy="30" r="28" style={{ "--d": `${200 + i * 120}ms` }} /></svg>
                        <b>{cuenta[k]}</b><small>{l}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="va-llego va-entra">¡Llegó el gran día!</p>
                )}
              </section>
            )}

            {(info.lugar || info.direccion) && (
              <section className="va-bloque va-lugar" data-arma aria-labelledby="va-lugar">
                <div className="va-hacienda"><Arte src={arte.hacienda} /></div>
                {info.lugar && <h2 className="va-lugar-nombre" id="va-lugar"><Letras texto={info.lugar} retraso={1200} paso={28} /></h2>}
                {info.direccion && <p className="va-lugar-dir va-entra" style={{ "--d": "1600ms" }}>{info.direccion}</p>}
                <p className="va-botones va-entra" style={{ "--d": "1800ms" }}>
                  {info.mapsUrl && <a className="va-btn" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>}
                  {lugar && <button className="va-btn" type="button" onClick={() => copiar(lugar, "Dirección copiada")}>{Icono.copiar} Copiar</button>}
                </p>
              </section>
            )}

            {cronograma.length > 0 && (
              <section className="va-bloque va-itinerario" data-arma aria-labelledby="va-itinerario">
                <Titulo id="va-itinerario">{info.tituloItinerario || "Itinerario"}</Titulo>
                <ol className={`va-pasos ${cronograma.length > 4 ? "va-pasos-lista" : ""}`} style={{ "--n": cronograma.length }}>
                  {cronograma.map((c, i) => (
                    <li key={i} className="va-paso" style={{ "--d": `${400 + i * 380}ms` }}>
                      <svg viewBox="0 0 50 50" aria-hidden="true">
                        <circle className="va-trazo va-aro" pathLength="1" cx="25" cy="25" r="23" />
                        <g className="va-dibujo">{iconoDe(c.titulo)}</g>
                      </svg>
                      <span className="va-paso-texto"><b>{c.hora}</b><span>{c.titulo}</span></span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {info.cronogramaModo !== "detallado" && info.cronogramaMensaje && (
              <section className="va-bloque" data-arma>
                <Titulo>{info.tituloItinerario || "Itinerario"}</Titulo>
                <p className="va-texto va-entra">{info.cronogramaMensaje}</p>
              </section>
            )}

            {activo("vestimenta") && (vestimenta.titulo || permitidos.length > 0 || evitar.length > 0) && (
              <section className="va-bloque va-vestimenta" data-arma aria-labelledby="va-vestimenta">
                <Arte src={arte.rama} className="va-rama va-rama-izq" />
                <div className="va-pastilla">
                  <svg viewBox="0 0 250 96" aria-hidden="true"><rect className="va-trazo" pathLength="1" x="1" y="1" width="248" height="94" rx="47" /></svg>
                  <p className="va-mayus va-entra" id="va-vestimenta" style={{ "--d": "500ms" }}>Código de vestimenta</p>
                  {vestimenta.titulo && <p className="va-guion va-escribe" style={{ "--d": "800ms" }}>{vestimenta.titulo}</p>}
                </div>
                <Laurel />
                {vestimenta.nota && <p className="va-texto va-entra" style={{ "--d": "1300ms" }}>{vestimenta.nota}</p>}
                {(permitidos.length > 0 || evitar.length > 0) && (
                  <div className="va-colores va-entra" style={{ "--d": "1400ms" }}>
                    {permitidos.length > 0 && (
                      <div>
                        <p className="va-mayus va-chico">Colores sugeridos</p>
                        <ul>{permitidos.map((c, i) => <Muestra key={i} {...c} />)}</ul>
                      </div>
                    )}
                    {evitar.length > 0 && (
                      <div>
                        <p className="va-mayus va-chico">Por favor evita</p>
                        <ul>{evitar.map((c, i) => <Muestra key={i} {...c} tachado />)}</ul>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {activo("padrinos") && grupos.length > 0 && (
              <section className="va-bloque va-padrinos" data-arma aria-labelledby="va-padrinos">
                <Titulo id="va-padrinos">{padrinos.titulo || "Nuestros padrinos"}</Titulo>
                {grupos.map((g, i) => (
                  <div key={i} className="va-grupo va-entra" style={{ "--d": `${300 + i * 180}ms` }}>
                    {g.etiqueta && <p className="va-mayus va-chico">{g.etiqueta}</p>}
                    <p className="va-padre">{g.personas.filter(Boolean).join(" & ")}</p>
                  </div>
                ))}
              </section>
            )}

            {activo("historia") && historia.texto && (
              <section className="va-bloque va-historia" data-arma aria-labelledby="va-historia">
                <Titulo id="va-historia">{historia.titulo || "Nuestra historia"}</Titulo>
                <p className="va-texto va-entra" style={{ "--d": "300ms" }}>{historia.texto}</p>
                {fotos.length > 0 && (
                  <div className="va-fotos va-entra" style={{ "--d": "500ms" }}>
                    {fotos.slice(0, 3).map((f, i) => <img key={f} src={f} alt={`Foto ${i + 1} de ${nombres.join(" y ")}`} loading="lazy" />)}
                  </div>
                )}
              </section>
            )}

            {hayRegalo && (
              <section className="va-bloque va-regalo" data-arma aria-labelledby="va-regalo">
                <span className="va-regalo-ico va-entra">{Icono.regalo}</span>
                <Titulo id="va-regalo">{(activo("regalos") && regalos.titulo) || (activo("sobres") && sobres.texto ? "Lluvia de sobres" : "Mesa de regalos")}</Titulo>
                <p className="va-texto va-entra" style={{ "--d": "300ms" }}>{(activo("sobres") && sobres.texto) || regalos.texto}</p>
                {activo("regalos") && enlaces.length > 0 && (
                  <p className="va-botones va-entra" style={{ "--d": "500ms" }}>
                    {enlaces.map((e, i) => <a key={i} className="va-btn" href={e.url} target="_blank" rel="noopener noreferrer">{e.tienda || "Ver lista"}</a>)}
                  </p>
                )}
                {activo("regalos") && regalos.datosTransferencia && (
                  <div className="va-transferir va-entra" style={{ "--d": "600ms" }}>
                    <p>{regalos.datosTransferencia}</p>
                    <button className="va-btn" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>{Icono.copiar} Copiar</button>
                  </div>
                )}
              </section>
            )}

            {activo("info_importante") && (puntos.length > 0 || importante.nota) && (
              <section className="va-bloque" data-arma aria-labelledby="va-info">
                <Titulo id="va-info">Ten en cuenta</Titulo>
                <div className="va-marco va-entra" style={{ "--d": "300ms" }}>
                  {importante.nota && <p className="va-texto">{importante.nota}</p>}
                  {puntos.length > 0 && <ul className="va-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
                </div>
              </section>
            )}

            {activo("faq") && preguntas.length > 0 && (
              <section className="va-bloque" data-arma aria-labelledby="va-faq">
                <Titulo id="va-faq">Preguntas frecuentes</Titulo>
                <div className="va-marco va-faq va-entra" style={{ "--d": "300ms" }}>
                  {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary><p>{f.r}</p></details>)}
                </div>
              </section>
            )}

            {invitacion && (
              <section className="va-bloque va-confirma" data-arma aria-labelledby="va-confirma">
                <Arte src={arte.rama} className="va-rama va-rama-der" />
                <h2 className="va-mayus va-confirma-titulo" id="va-confirma"><Letras texto="Confirma tu asistencia" paso={30} /></h2>
                {limite && <p className="va-texto va-entra" style={{ "--d": "800ms" }}>Antes del {limite}</p>}
                <button className="va-btn va-btn-lleno va-entra" style={{ "--d": "1000ms" }} type="button" onClick={() => setRsvpAbierto(true)}>
                  Confirmar asistencia
                </button>
              </section>
            )}

            {welcome.versiculo && (
              <section className="va-bloque va-versiculo" data-arma aria-label="Versículo">
                <blockquote>
                  <p><Palabras texto={`“${welcome.versiculo.replace(/^[“"]|[”"]$/g, "")}”`} paso={70} /></p>
                  {welcome.versiculoCita && <cite className="va-entra" style={{ "--d": "1400ms" }}>{welcome.versiculoCita}</cite>}
                </blockquote>
              </section>
            )}

            <footer className="va-final" data-arma>
              <Arte src={arte.esquina} className="va-esquina va-esquina-izq" />
              <Arte src={arte.esquina} className="va-esquina va-esquina-der" />
              <p className="va-te-esperamos va-entra" style={{ "--d": "500ms" }}>¡Te esperamos!</p>
              <svg className="va-ola" viewBox="0 0 400 170" aria-hidden="true">
                <path className="va-ola-claro" d="M0 104 C110 98 240 48 400 0 L400 30 C250 74 120 120 0 128 Z" />
                <path className="va-ola-fondo" d="M0 128 C120 120 250 74 400 30 L400 170 L0 170 Z" />
                <path className="va-trazo" pathLength="1" d="M0 104 C110 98 240 48 400 0" style={{ "--d": "500ms" }} />
                <path className="va-trazo va-oro-2" pathLength="1" d="M0 128 C120 120 250 74 400 30" style={{ "--d": "700ms" }} />
              </svg>
              <div className="va-final-texto va-entra" style={{ "--d": "900ms" }}>
                <p className="va-monograma">
                  {nombres.map((n) => n.trim().charAt(0).toUpperCase()).join(" & ")}
                </p>
                {partes && <p className="va-final-fecha">{partes.diaDos} · {partes.mesNum} · {partes.anio}</p>}
              </div>
            </footer>
          </div>
        </main>
      )}

      <div className={`va-aviso ${aviso ? "va-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="va-modal" role="dialog" aria-modal="true" aria-label="Confirmar asistencia" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="va-modal-caja">
            <button type="button" className="va-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">×</button>
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

// Muestra de color del código de vestimenta: un color suelto o una gama.
function Muestra({ nombre, color, colores, tachado }) {
  const lista = (Array.isArray(colores) ? colores : [color]).filter(Boolean);
  const fondo = lista.length > 1 ? `linear-gradient(90deg, ${lista.join(", ")})` : lista[0];
  return (
    <li className={tachado ? "va-tachado" : ""}>
      <span className="va-muestra" style={{ background: fondo }} />
      {nombre && <span>{nombre}</span>}
    </li>
  );
}
