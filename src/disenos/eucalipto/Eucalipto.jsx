import { useEffect, useMemo, useRef, useState } from "react";
import "./eucalipto.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer, alTocarPortada } from "../comun";
import {
  EuRama, EuTallo, EuRamito, EuAnillos, EuCopas, EuSobre, EuOjal, EuHilo,
  EuVara, EuHojita, EuCinta, EuNudo, EuCintaIniciales, EuHojaBoton, EuGuirnalda,
} from "./arte";

// Diseño «Eucalipto»: boda de jardín romántica y fresca. Rosas blancas,
// peonías, gipsofila y eucalipto azul plata sobre papel gris perla.
// - Entrada «cortina de flores»: dos grandes ramas cubren la pantalla, atadas
//   por una cinta de lino con nudo. De una vara de eucalipto cuelga, meciéndose,
//   la etiqueta con los nombres; a su lado, la etiquetita del invitado con su
//   nombre a mano y una hoja por cada lugar. «Tira de la cinta»: el nudo se
//   desata, la cinta se corre y las ramas se abren a los lados.
// - Cuerpo: un tallo de eucalipto baja por el centro de la página y cada
//   sección cuelga de él como una etiqueta de papel de algodón con borde
//   rasgado, ojal de metal e hilo fino anudado al tallo. Las etiquetas se
//   inclinan un poco, alternando, y se mecen al entrar en pantalla.
// Colores del tema: principal = azul eucalipto, claro = plata pálida,
// oscuro = azul pizarra, papel = gris perla, mármol = blanco algodón,
// sello = champaña (lino, hilo y metal). Todo el color de marca sale del tema.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Allura&family=Gilda+Display&family=Mulish:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap";

// Solo se aceptan embeds de Google Maps (mismo criterio que InformacionBoda).
function urlDelMapa(valor) {
  if (!valor) return "";
  const texto = String(valor).trim();
  const conSrc = texto.match(/src\s*=\s*["']([^"']+)["']/i);
  const url = conSrc ? conSrc[1] : texto;
  return /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(url) ? url : "";
}

// Borde rasgado (deckle) de la etiqueta: un polígono con esquinas de arriba
// cortadas y fibras irregulares de 0 a 2,6 px en todo el contorno.
function azar(semilla) {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
function bordeRasgado(semilla) {
  const r = azar(semilla);
  const j = () => (r() * 2.6).toFixed(1);
  const C = 30;
  const pts = [];
  const tramo = (n, f) => { for (let k = 0; k < n; k++) pts.push(f(k / n)); };
  tramo(26, (f) => `calc(${C}px + (100% - ${2 * C}px) * ${f.toFixed(3)}) ${j()}px`);
  tramo(6, (f) => `calc(100% - ${(C * (1 - f)).toFixed(1)}px - ${j()}px) ${(C * f).toFixed(1)}px`);
  tramo(48, (f) => `calc(100% - ${j()}px) calc(${C}px + (100% - ${C}px) * ${f.toFixed(3)})`);
  tramo(30, (f) => `calc(100% * ${(1 - f).toFixed(3)}) calc(100% - ${j()}px)`);
  tramo(48, (f) => `${j()}px calc(100% - (100% - ${C}px) * ${f.toFixed(3)})`);
  tramo(6, (f) => `calc(${(C * f).toFixed(1)}px + ${j()}px) calc(${C}px - ${(C * f).toFixed(1)}px)`);
  return `polygon(${pts.join(", ")})`;
}
const BORDES = [bordeRasgado(17), bordeRasgado(29), bordeRasgado(43)];

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
const Icono = {
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  musica: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>,
  pausa: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>,
  abajo: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>,
};

// Etiqueta colgada del tallo: hilo anudado, ojal y papel de algodón rasgado.
function Etiqueta({ i, id, titulo, arte, className = "", children }) {
  return (
    <section
      className={`eu-colgante ${className}`}
      style={{ "--incl": `${i % 2 ? 1.6 : -1.6}deg` }}
      aria-labelledby={id}
      data-reveal
    >
      <EuHilo className="eu-hilo" />
      <EuOjal className="eu-ojal" />
      <div className="eu-sombra">
        <div className="eu-papel" style={{ clipPath: BORDES[i % BORDES.length] }}>
          {arte}
          <h2 className="eu-h2" id={id}><EuHojita className="eu-h2-hoja" /><span>{titulo}</span></h2>
          {children}
        </div>
      </div>
    </section>
  );
}

// Lugares reservados: una hojita de eucalipto por cada uno, que brotan
// contadas, y el número escrito.
function Lugares({ n, className = "" }) {
  if (!n) return null;
  return (
    <p className={`eu-lugares ${className}`}>
      <span className="eu-lugares-hojas" aria-hidden="true">
        {Array.from({ length: Math.min(n, 10) }, (_, k) => (
          <EuHojita key={k} className="eu-hojita" style={{ "--k": k, "--g": `${(k % 2 ? 1 : -1) * (14 + (k % 3) * 6)}deg` }} />
        ))}
      </span>
      <span>{n} {n === 1 ? "lugar" : "lugares"} para ti</span>
    </p>
  );
}

function Muestra({ nombre, color, colores, tachado }) {
  const lista = (Array.isArray(colores) ? colores : [color]).filter(Boolean);
  const fondo = lista.length > 1 ? `linear-gradient(135deg, ${lista.join(", ")})` : lista[0];
  return (
    <li className={tachado ? "eu-tachado" : ""}>
      <span className="eu-muestra" style={{ background: fondo }} />
      {nombre && <span>{nombre}</span>}
    </li>
  );
}

export default function Eucalipto({ site, contenidoDe, invitacion, onEnviarRSVP, enEditor }) {
  useFuentes(FUENTES);
  // cerrada → abriendo (las ramas se corren) → abierta. En el panel se salta.
  const [fase, setFase] = useState(enEditor ? "abierta" : "cerrada");
  const [rsvpAbierto, setRsvpAbierto] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [tramos, setTramos] = useState(18);
  const audioRef = useRef(null);
  const colgantesRef = useRef(null);
  const abierta = fase !== "cerrada";
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
  const pases = pasesDe(invitacion);
  const nombres = [welcome.novioElla, welcome.novioEl].filter(Boolean);
  const iniciales = nombres.map((n) => n.trim()[0]).join("&");
  const audioSrc = site.audioUrl || musica.src;
  const telefono = (info.telefonoConfirmar || "").trim();
  const digitos = telefono.replace(/\D/g, "");
  const cronograma = info.cronogramaModo === "detallado" ? (info.cronograma || []).filter((c) => c && c.titulo) : [];
  const mensajePrograma = info.cronogramaModo === "mensaje" ? info.cronogramaMensaje : "";
  const mapa = urlDelMapa(info.mapaEmbed);
  const lugar = [info.lugar, info.direccion].filter(Boolean).join(", ");
  const padresElla = [welcome.padreEllaPadre, welcome.padreEllaMadre].filter(Boolean);
  const padresEl = [welcome.padreElPadre, welcome.padreElMadre].filter(Boolean);
  const grupos = (padrinos.grupos || []).filter((g) => g && (g.personas || []).some(Boolean));
  const permitidos = (vestimenta.permitidos || []).filter(Boolean);
  const evitar = (vestimenta.evitar || []).filter(Boolean);
  const fotos = [...(site.fotosSubidas || []), ...(activo("fotos") ? fotosSec.urls || [] : [])].filter(Boolean);
  const enlaces = (regalos.enlaces || []).filter((e) => e?.url);
  const puntos = (importante.items || []).filter(Boolean);
  const preguntas = (faq.items || []).filter((f) => f && f.p);

  // El tallo se arma con tramos apilados: tantos como mida la columna.
  useEffect(() => {
    const el = colgantesRef.current;
    if (!el || !("ResizeObserver" in window)) return;
    const ro = new ResizeObserver(([e]) => setTramos(Math.ceil(e.contentRect.height / 360) + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [abierta]);

  // La música arranca con el toque que abre la invitación, nunca sola.
  function abrir() {
    if (fase !== "cerrada") return;
    setFase("abriendo");
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => setFase("abierta"), reducido ? 0 : 2500);
    audioRef.current?.play().then(() => setSonando(true)).catch(() => {});
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

  // Etiquetas en orden; solo las que tienen contenido. El índice alterna la
  // inclinación y el borde rasgado.
  const etiquetas = [
    (padresElla.length > 0 || padresEl.length > 0) && {
      id: "eu-padres", titulo: welcome.padresTexto || "Nuestros padres",
      cuerpo: (
        <div className="eu-padres">
          {padresElla.length > 0 && (
            <div><span className="eu-k">{welcome.novioElla ? `Padres de ${welcome.novioElla.split(" ")[0]}` : "Padres de la novia"}</span>{padresElla.map((n) => <p key={n} className="eu-nombre">{n}</p>)}</div>
          )}
          {padresEl.length > 0 && (
            <div><span className="eu-k">{welcome.novioEl ? `Padres de ${welcome.novioEl.split(" ")[0]}` : "Padres del novio"}</span>{padresEl.map((n) => <p key={n} className="eu-nombre">{n}</p>)}</div>
          )}
        </div>
      ),
    },
    (partes || lugar) && {
      id: "eu-lugar", titulo: info.tituloSeccion || "Cuándo y dónde",
      arte: <EuAnillos className="eu-arte eu-arte-anillos" />,
      cuerpo: (
        <>
          {partes && (
            <div className="eu-fecha">
              <span className="eu-fecha-lado">{partes.semana}</span>
              <span className="eu-fecha-dia">{partes.dia}</span>
              <span className="eu-fecha-lado">{partes.hora}</span>
              <span className="eu-fecha-mes">{partes.mes} · {partes.anio}</span>
            </div>
          )}
          {info.lugar && <p className="eu-lugar">{info.lugar}</p>}
          {info.direccion && <p className="eu-texto">{info.direccion}</p>}
          {mapa && <iframe className="eu-mapa" src={mapa} title={`Mapa de ${info.lugar || "el lugar"}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />}
          {lugar && (
            <div className="eu-botones">
              {info.mapsUrl && <a className="eu-btn" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>}
              <button className="eu-btn eu-btn-linea" type="button" onClick={() => copiar(lugar, "Dirección copiada")}>{Icono.copiar} Copiar</button>
            </div>
          )}
        </>
      ),
    },
    (cronograma.length > 0 || mensajePrograma) && {
      id: "eu-programa", titulo: info.tituloItinerario || "Itinerario",
      arte: <EuCopas className="eu-arte eu-arte-copas" />,
      cuerpo: cronograma.length > 0 ? (
        <ol className="eu-programa">
          {cronograma.map((c, k) => <li key={k}><span className="eu-hora">{c.hora}</span><span className="eu-que">{c.titulo}</span></li>)}
        </ol>
      ) : <p className="eu-texto">{mensajePrograma}</p>,
    },
    activo("vestimenta") && (vestimenta.titulo || permitidos.length > 0 || evitar.length > 0) && {
      id: "eu-vestimenta", titulo: vestimenta.titulo || "Vestimenta",
      cuerpo: (
        <>
          {vestimenta.nota && <p className="eu-texto">{vestimenta.nota}</p>}
          {permitidos.length > 0 && (
            <div className="eu-paleta"><span className="eu-k">Sugerimos</span><ul>{permitidos.map((c, k) => <Muestra key={k} {...c} />)}</ul></div>
          )}
          {evitar.length > 0 && (
            <div className="eu-paleta"><span className="eu-k">Evitar</span><ul>{evitar.map((c, k) => <Muestra key={k} {...c} tachado />)}</ul></div>
          )}
        </>
      ),
    },
    activo("padrinos") && grupos.length > 0 && {
      id: "eu-padrinos", titulo: padrinos.titulo || "Padrinos",
      cuerpo: (
        <div className="eu-grupos">
          {grupos.map((g, k) => (
            <div key={k}>
              {g.etiqueta && <span className="eu-k">{g.etiqueta}</span>}
              <p className="eu-nombre">{g.personas.filter(Boolean).join(" & ")}</p>
            </div>
          ))}
        </div>
      ),
    },
    activo("historia") && historia.texto && {
      id: "eu-historia", titulo: historia.titulo || "Nuestra historia",
      cuerpo: (
        <div className="eu-historia">
          <p>{historia.texto}</p>
          {nombres.length > 0 && <p className="eu-firma">{nombres.map((n) => n.split(" ")[0]).join(" & ")}</p>}
        </div>
      ),
    },
    fotos.length > 0 && {
      id: "eu-fotos", titulo: fotosSec.titulo || "Nosotros",
      cuerpo: (
        <div className="eu-fotos">
          {fotos.slice(0, 4).map((f, k) => <img key={f} src={f} alt={`Foto ${k + 1} de ${nombres.join(" y ")}`} loading="lazy" />)}
        </div>
      ),
    },
    activo("sobres") && sobres.texto && {
      id: "eu-sobres", titulo: "Lluvia de sobres",
      arte: (
        <div className="eu-lluvia" aria-hidden="true">
          <EuSobre className="s1" /><EuSobre className="s2" /><EuSobre className="s3" />
        </div>
      ),
      cuerpo: <p className="eu-texto">{sobres.texto}</p>,
    },
    activo("regalos") && (regalos.texto || enlaces.length > 0 || regalos.datosTransferencia) && {
      id: "eu-regalos", titulo: regalos.titulo || "Mesa de regalos",
      cuerpo: (
        <>
          {regalos.texto && <p className="eu-texto">{regalos.texto}</p>}
          {enlaces.length > 0 && (
            <div className="eu-botones">
              {enlaces.map((e, k) => <a key={k} className="eu-btn eu-btn-linea" href={e.url} target="_blank" rel="noopener noreferrer">{e.tienda || e.nombre || "Ver lista"}</a>)}
            </div>
          )}
          {regalos.datosTransferencia && (
            <div className="eu-transferir">
              <div><span className="eu-k">Datos para transferir</span><span className="eu-dato">{regalos.datosTransferencia}</span></div>
              <button className="eu-btn eu-btn-linea" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>{Icono.copiar} Copiar</button>
            </div>
          )}
        </>
      ),
    },
    activo("info_importante") && (puntos.length > 0 || importante.nota) && {
      id: "eu-info", titulo: "Información importante",
      cuerpo: (
        <>
          {puntos.length > 0 && <ul className="eu-lista">{puntos.map((t, k) => <li key={k}>{t}</li>)}</ul>}
          {importante.nota && <p className="eu-texto eu-nota">{importante.nota}</p>}
        </>
      ),
    },
    activo("faq") && preguntas.length > 0 && {
      id: "eu-faq", titulo: "Preguntas frecuentes",
      cuerpo: (
        <div className="eu-faq">
          {preguntas.map((f, k) => <details key={k}><summary>{f.p}</summary><p>{f.r}</p></details>)}
        </div>
      ),
    },
    confirmar && {
      id: "eu-confirmar", titulo: "Confirma tu asistencia", className: "eu-rsvp",
      arte: <EuCintaIniciales iniciales={iniciales} className="eu-arte eu-arte-cinta" />,
      cuerpo: (
        <>
          <Lugares n={pases} className="eu-lugares-rsvp" />
          {confirmar.href ? (
            <a className="eu-btn eu-btn-grande" href={confirmar.href} target="_blank" rel="noopener noreferrer">
              {confirmar.texto} <b>{confirmar.grande}</b>
            </a>
          ) : (
            <button className="eu-btn eu-btn-grande" type="button" onClick={confirmar.onClick}>{confirmar.grande}</button>
          )}
          {limite && <p className="eu-limite">Confirma antes del <b>{limite}</b></p>}
        </>
      ),
    },
  ].filter(Boolean);

  return (
    <div className={`eu eu-${fase}`} ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop preload="none" />}
      {audioSrc && abierta && (
        <button className="eu-musica" type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label={sonando ? "Pausar música" : "Reproducir música"}>
          <EuHojaBoton className="eu-musica-hoja" />
          <span className="eu-musica-icono">{sonando ? Icono.pausa : Icono.musica}</span>
        </button>
      )}

      {/* Portada: la cortina de flores. Las mismas dos ramas tapan la pantalla
          al llegar y, al tocar, se corren a los bordes de la portada. */}
      <header className="eu-portada" aria-labelledby="eu-titulo">
        <div className="eu-marco" aria-hidden="true">
          <div className="eu-rama eu-rama-izq"><EuRama /></div>
          <div className="eu-rama eu-rama-der"><EuRama /></div>
        </div>

        {fase !== "abierta" && (
          <div className="eu-entrada" aria-hidden={fase !== "cerrada"} onClick={alTocarPortada(abrir)}>
            <div className="eu-colgador">
              <EuVara className="eu-vara" />
              <div className="eu-tag eu-tag-novios">
                <EuHilo className="eu-hilo" />
                <EuOjal className="eu-ojal" />
                <div className="eu-sombra">
                  <div className="eu-papel" style={{ clipPath: BORDES[0] }}>
                    <p className="eu-tag-ante">{welcome.bienvenidaTexto || "Nos casamos"}</p>
                    <p className="eu-tag-nombres">
                      {nombres[0]}{nombres[1] && <><span className="eu-y">&amp;</span>{nombres[1]}</>}
                    </p>
                    {partes && <p className="eu-tag-fecha">{partes.diaDos} · {partes.mesNum} · {partes.anio}</p>}
                  </div>
                </div>
              </div>
              {invitacion?.nombre && (
                <div className="eu-tag eu-tag-invitado">
                  <span className="eu-tag-hilo" />
                  <EuOjal className="eu-ojal" />
                  <div className="eu-sombra">
                    <div className="eu-papel" style={{ clipPath: BORDES[1] }}>
                      <p className="eu-para">para</p>
                      <p className="eu-invitado">{invitacion.nombre}</p>
                      <Lugares n={pases} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button type="button" className="eu-cinta" onClick={abrir} disabled={fase !== "cerrada"} aria-label="Toca la cinta para abrir la invitación">
              <span className="eu-cinta-banda eu-cinta-izq"><EuCinta /></span>
              <span className="eu-cinta-banda eu-cinta-der"><EuCinta espejo /></span>
              <EuNudo className="eu-nudo" />
              <span className="eu-cinta-texto">Toca la cinta</span>
            </button>
          </div>
        )}

        {abierta && (
          <div className="eu-portada-texto">
            {welcome.bienvenidaTexto && <p className="eu-ante">{welcome.bienvenidaTexto}</p>}
            <h1 className="eu-nombres" id="eu-titulo">
              {nombres[0]}
              {nombres[1] && <><span className="eu-y">&amp;</span>{nombres[1]}</>}
            </h1>
            {welcome.fraseIntro && <p className="eu-frase">{welcome.fraseIntro}</p>}
            {partes && (
              <p className="eu-portada-fecha">
                <span>{partes.diaDos} · {partes.mesNum} · {partes.anio}</span>
                <small>{partes.semana}, {partes.hora}</small>
              </p>
            )}
            <span className="eu-desliza" aria-hidden="true">{Icono.abajo}</span>
          </div>
        )}
      </header>

      {abierta && (
        <main className="eu-cuerpo">
          {partes && (
            <section className="eu-cuenta" aria-labelledby="eu-cuenta-t" data-reveal style={{ "--incl": "0deg" }}>
              <h2 className="eu-h2" id="eu-cuenta-t"><EuHojita className="eu-h2-hoja" /><span>{cuenta ? "Faltan" : "¡Llegó el gran día!"}</span></h2>
              {cuenta && (
                <div className="eu-guirnalda" role="timer" aria-labelledby="eu-cuenta-t">
                  <EuGuirnalda className="eu-guirnalda-hilo" />
                  {[["dias", "días"], ["horas", "horas"], ["min", "minutos"], ["seg", "segundos"]].map(([k, l], j) => (
                    <div
                      key={k}
                      className="eu-mini"
                      style={{
                        "--x": `${(EuGuirnalda.nudos[j][0] / 360) * 100}%`,
                        "--y": EuGuirnalda.nudos[j][1],
                        "--largo": `${[14, 6, 20, 10][j]}px`,
                        "--d": `${-j * 0.9}s`,
                      }}
                    >
                      <span className="eu-mini-hilo" />
                      <div className="eu-mini-papel">
                        <span className="n">{String(cuenta[k]).padStart(2, "0")}</span>
                        <span className="l">{l}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          <div className="eu-colgantes" ref={colgantesRef}>
            <div className="eu-tallo" aria-hidden="true">
              {Array.from({ length: tramos }, (_, k) => <EuTallo key={k} espejo={k % 2 === 1} />)}
            </div>
            {etiquetas.map((e, k) => (
              <Etiqueta key={e.id} i={k} id={e.id} titulo={e.titulo} arte={e.arte} className={e.className}>
                {e.cuerpo}
              </Etiqueta>
            ))}
          </div>
          <footer className="eu-final" data-reveal style={{ "--incl": "1.2deg" }}>
            <EuRamito className="eu-ramito-final" />
            <p className="eu-te-esperamos">¡Los esperamos!</p>
            {nombres.length > 0 && <p className="eu-texto">Con cariño, {nombres.map((n) => n.split(" ")[0]).join(" & ")}</p>}
          </footer>
        </main>
      )}

      <div className={`eu-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="eu-modal" role="dialog" aria-modal="true" aria-label="Confirmar asistencia" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="eu-modal-caja" style={{ clipPath: BORDES[2] }}>
            <button type="button" className="eu-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar"><span aria-hidden="true">×</span></button>
            <EuCintaIniciales iniciales={iniciales} className="eu-modal-cinta" />
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
