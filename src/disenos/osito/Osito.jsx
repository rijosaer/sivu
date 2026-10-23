import { useEffect, useMemo, useRef, useState } from "react";
import "./osito.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer,
} from "../comun";
import {
  OsOsito, OsNube, OsMovil, OsCubo, OsCoche, OsRopita, OsPampas, OsGlobo, OsSobre,
  OsMantita, OsPatita, OsTirador, OsSonajero, OsBotonCostura, OsParche,
} from "./arte";

// Diseño «Osito»: baby shower tierno, neutro y elegante. Fondo crema, osito
// de peluche beige, nubes, globos beige y salvia, pampas y eucalipto.
// - Entrada: un móvil de cuna de madera cuelga desde arriba con nubes de
//   fieltro, luna y estrellas; abajo, un mar de nubes. Al jalar el cordón
//   del móvil, el móvil gira suavemente y las nubes se apartan
//   hacia los lados, revelando al osito sentado y el nombre del bebé. Esa
//   escena queda como portada y el cuerpo sigue debajo. El llamado a tocar
//   es el cordón del móvil, que se jala; el invitado aparece bordado en una
//   mantita y sus pases son patitas de oso.
// - Cuerpo: «cubos de madera». Cada sección arranca con un cubo de juguete
//   pintado (vista 3/4) con el ícono de la sección en la cara frontal; el
//   cubo cae y se apila sobre una tarjeta suave y redondeada, con una leve
//   rotación. Al final, cubos con las letras del nombre.
// Colores del tema: principal = beige, claro = beige claro, oscuro = madera
// oscura, papel = crema, mármol = blanco de tarjetas, sello = salvia.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Quattrocento:wght@400;700&family=Sofia&display=swap";

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
const ic = (hijos) => <g {...trazo}>{hijos}</g>;
// Íconos de sección (caja de 24×24) para la cara frontal de los cubos.
const ICONO = {
  corazon: ic(<path d="M12 20 C 5 15 2.5 11.5 2.5 8 A 4.6 4.6 0 0 1 12 6 A 4.6 4.6 0 0 1 21.5 8 C 21.5 11.5 19 15 12 20 Z" />),
  reloj: ic(<><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2.5h6" /></>),
  casa: ic(<><path d="M3.5 11 L 12 4 L 20.5 11" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5h4v5" /></>),
  globo: ic(<><path d="M12 3 C 16.5 3 18.5 6.5 18.5 9.5 C 18.5 13.5 15 16 12 16 C 9 16 5.5 13.5 5.5 9.5 C 5.5 6.5 7.5 3 12 3 Z" /><path d="M11 16.5h2M12 17 C 10.5 19 13.5 20 12 22" /></>),
  ropita: ic(<path d="M9 3.5 C 10 5 14 5 15 3.5 L 19 5 L 21.5 9 L 18.5 10.5 L 17.5 9.5 V 16 C 17.5 18 15.5 19.5 13.5 19.5 V 21 H 10.5 V 19.5 C 8.5 19.5 6.5 18 6.5 16 V 9.5 L 5.5 10.5 L 2.5 9 L 5 5 Z" />),
  luna: ic(<path d="M15 3.5 A 8.5 8.5 0 1 0 20.5 15 A 7 7 0 0 1 15 3.5 Z" />),
  estrella: ic(<path d="M12 3 L 14.6 8.6 L 20.6 9.3 L 16.1 13.4 L 17.3 19.4 L 12 16.4 L 6.7 19.4 L 7.9 13.4 L 3.4 9.3 L 9.4 8.6 Z" />),
  camara: ic(<><rect x="3" y="7" width="18" height="13" rx="2.5" /><circle cx="12" cy="13.5" r="3.5" /><path d="M8.5 7 L 10 4.5h4L15.5 7" /></>),
  regalo: ic(<><rect x="3.5" y="9" width="17" height="11.5" rx="1.5" /><path d="M2.5 9h19M12 9v11.5M12 9 C 9 9 6.5 7.5 7.5 5.5 C 8.5 3.5 11 5.5 12 9 C 13 5.5 15.5 3.5 16.5 5.5 C 17.5 7.5 15 9 12 9" /></>),
  sobre: ic(<><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.5 6.5 L 12 13 L 20.5 6.5" /></>),
  info: ic(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.6v.1" /></>),
  pregunta: ic(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5 C 9.5 6.5 14.5 6.5 14.5 9.5 C 14.5 11.5 12 11.5 12 13.8M12 17v.1" /></>),
  nota: ic(<><path d="M9 18V5.5l10-2v12.5" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>),
  biberon: ic(<><path d="M10.5 7.5 C 10.5 4.5 11 2.8 12 2.8 C 13 2.8 13.5 4.5 13.5 7.5" /><path d="M8 7.5h8" /><path d="M8.8 7.5v11.2a2.3 2.3 0 0 0 2.3 2.3h1.8a2.3 2.3 0 0 0 2.3-2.3V7.5" /><path d="M8.8 12h2.4M8.8 15h2.4M8.8 18h2.4" /></>),
};
const UI = {
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  enlace: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>,
  musica: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 18V5.5l10-2v12.5" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></svg>,
  pausa: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>,
  abajo: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>,
  whatsapp: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" /><path d="M9 9.5c.3 2 2.3 4.2 5 5l1-1.4-1.8-1-.8.8c-1-.5-1.8-1.3-2.3-2.3l.8-.8-1-1.8z" /></svg>,
};

// Mar de nubes: capas a cada lado que se apartan al despertar el móvil.
const MAR = [
  { lado: "izq", x: -18, y: 0, w: 82, capa: 1 },
  { lado: "der", x: 34, y: 4, w: 84, capa: 1 },
  { lado: "izq", x: -6, y: 22, w: 74, capa: 2 },
  { lado: "der", x: 26, y: 26, w: 80, capa: 2 },
  { lado: "izq", x: -24, y: 44, w: 90, capa: 3 },
  { lado: "der", x: 30, y: 46, w: 92, capa: 3 },
  { lado: "izq", x: 4, y: 64, w: 86, capa: 4 },
  { lado: "der", x: 22, y: 68, w: 88, capa: 4 },
];

const TONOS = ["beige", "salvia", "claro"];
const GIROS = [-7, 5, -4, 8, -6, 4];

// Una sección: el cubo con su ícono cae y se apila sobre la tarjeta.
function Bloque({ n, icono, ante, titulo, id, children, className = "", tono: fijo }) {
  const tono = fijo || TONOS[n % TONOS.length];
  const lado = ["0px", "-86px", "86px"][n % 3];
  return (
    <section className={`os-bloque ${className}`} aria-labelledby={id} data-reveal>
      <div className="os-bloque-cubo" style={{ "--giro": `${GIROS[n % GIROS.length]}deg`, "--lado": lado }}>
        <OsCubo tono={tono}>{ICONO[icono]}</OsCubo>
      </div>
      <div className="os-tarjeta">
        {ante && <p className="os-ante">{ante}</p>}
        {titulo && <h2 className="os-h2" id={id}>{titulo}</h2>}
        {children}
      </div>
    </section>
  );
}

const texto = (n) => `${n} ${n === 1 ? "lugar" : "lugares"} para ti`;

// Huellas de osito, una por pase (hasta 8; con más, se escribe el número).
function Patitas({ n, className = "" }) {
  const visibles = Math.min(n, 8);
  return (
    <span className={`os-patitas ${className}`} aria-hidden="true">
      {Array.from({ length: visibles }, (_, i) => (
        <OsPatita key={i} className="os-patita" style={{ "--i": i, "--g": `${i % 2 ? 14 : -10}deg`, "--y": `${i % 2 ? -5 : 3}px` }} />
      ))}
    </span>
  );
}

function Entrada({ welcome, partes, invitacion, despierta, jalando, onJalar }) {
  const pases = pasesDe(invitacion);
  const nombre = welcome.novioEl || "";
  return (
    <section className={`os-entrada ${despierta ? "is-despierta" : ""} ${jalando ? "is-jalando" : ""}`} aria-labelledby="os-nombre">
      <div className="os-cielo" aria-hidden="true">
        <OsNube className="os-cielo-nube n1" />
        <OsNube className="os-cielo-nube n2" />
      </div>

      <OsMovil girando={despierta} />

      {/* Cordón del móvil: se jala para despertarlo */}
      <div className="os-cordon">
        <span className="os-cordon-hilo" aria-hidden="true" />
        <button type="button" className="os-tirador" onClick={onJalar} disabled={despierta} aria-label="Jalar el cordón del móvil para abrir la invitación">
          <OsTirador />
        </button>
        <span className="os-cordon-pista" aria-hidden="true">
          <svg viewBox="0 0 40 30"><path d="M36 4 C 26 4 16 10 10 24 M10 24 L 6 16 M10 24 L 17 20" /></svg>
          jala el cordón
        </span>
      </div>

      {/* Escena escondida bajo las nubes */}
      <div className="os-escena" aria-hidden="true">
        <OsGlobo tono="salvia" className="os-globo g1" />
        <OsGlobo tono="beige" className="os-globo g2" />
        <OsGlobo tono="claro" className="os-globo g3" />
        <OsGlobo tono="beige" className="os-globo g4" />
        <OsPampas className="os-escena-pampas p1" />
        <OsPampas className="os-escena-pampas p2" espejo />
        <OsNube className="os-asiento" />
        <OsOsito className="os-osito" />
      </div>

      <div className="os-letrero">
        <div className="os-letrero-antes">
          {/* Mantita con el nombre bordado */}
          <div className="os-mantita">
            <OsMantita className="os-mantita-tela" />
            {invitacion?.nombre ? (
              <>
                <p className="os-mantita-para">bordada para</p>
                <p className="os-bordado">{invitacion.nombre}</p>
              </>
            ) : (
              <p className="os-bordado os-bordado-sin">Con mucho amor</p>
            )}
          </div>
          {invitacion?.nombre && pases > 0 && (
            <p className="os-huellas">
              <Patitas n={pases} />
              <span>{texto(pases)}</span>
            </p>
          )}
        </div>
        <div className="os-letrero-despues">
          {welcome.bienvenidaTexto && <p className="os-bienvenida">{welcome.bienvenidaTexto}</p>}
          <h1 className="os-nombre" id="os-nombre">{nombre}</h1>
          {partes && <p className="os-fecha"><span>{partes.semana}</span> {partes.dia} de {partes.mes} · {partes.anio}</p>}
          {invitacion?.nombre && despierta && (
            <p className="os-para">
              {pases > 0 && <Patitas n={Math.min(pases, 4)} className="is-mini" />}
              <span><b>{invitacion.nombre}</b>{pases > 0 && <>, {texto(pases)}</>}</span>
            </p>
          )}
        </div>
      </div>

      <div className="os-mar" aria-hidden="true">
        {MAR.map((m, i) => (
          <OsNube
            key={i}
            className={`os-mar-nube os-mar-${m.lado}`}
            style={{ left: `${m.x}%`, bottom: `${m.y - 8}%`, width: `${m.w}%`, zIndex: m.capa, "--d": `${(4 - m.capa) * 90}ms` }}
          />
        ))}
      </div>

      {!despierta && <button type="button" className="os-toque" onClick={onJalar} tabIndex={-1} aria-hidden="true" />}
      {despierta && <span className="os-desliza" aria-hidden="true">{UI.abajo}</span>}
    </section>
  );
}

export default function Osito({ site, contenidoDe, invitacion, onEnviarRSVP, enEditor }) {
  useFuentes(FUENTES);
  // En el panel la entrada se salta: la portada aparece ya despierta.
  const [abierta, setAbierta] = useState(Boolean(enEditor));
  const [rsvpAbierto, setRsvpAbierto] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [jalando, setJalando] = useState(false);
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
  const modo = info.cronogramaModo || "detallado";
  const cronograma = modo === "detallado" ? (info.cronograma || []).filter((c) => c && c.titulo) : [];
  const mensajeTarde = modo === "mensaje" ? (info.cronogramaMensaje || "").trim() : "";
  const padres = [welcome.padreElMadre, welcome.padreElPadre, welcome.padreEllaMadre, welcome.padreEllaPadre].filter(Boolean);
  const grupos = (padrinos.grupos || []).filter((g) => g && (g.personas || []).some(Boolean));
  const fotos = [...(site.fotosSubidas || []), ...(activo("fotos") ? fotosSec.urls || [] : [])].filter(Boolean);
  const enlaces = (regalos.enlaces || []).filter((e) => e?.url);
  const puntos = (importante.items || []).filter(Boolean);
  const preguntas = (faq.items || []).filter((f) => f && f.p);
  const permitidos = (vestimenta.permitidos || []).filter((p) => p && (p.colores || []).length);
  const evitar = (vestimenta.evitar || []).filter((p) => p && p.nombre);
  const letras = (() => {
    const primero = nombre.trim().split(/\s+/)[0] || "";
    return primero.length > 0 && primero.length <= 6 ? [...primero.toUpperCase()] : primero ? [primero[0].toUpperCase()] : [];
  })();

  // Jalar el cordón: el cordón baja y rebota, y entonces el móvil despierta.
  // La música arranca en el mismo toque (el navegador lo exige).
  const temporizador = useRef(0);
  useEffect(() => () => clearTimeout(temporizador.current), []);
  function jalar() {
    if (abierta || jalando) return;
    setJalando(true);
    audioRef.current?.play().then(() => setSonando(true)).catch(() => {});
    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    temporizador.current = setTimeout(() => { setAbierta(true); setJalando(false); }, quieto ? 0 : 620);
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

  // Numeración de bloques para alternar color, giro y lado de los cubos.
  let n = 0;
  const sig = () => n++;

  return (
    <div className="os" ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop />}
      {audioSrc && abierta && (
        <button className={`os-musica ${sonando ? "is-sonando" : ""}`} type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label={sonando ? "Pausar música" : "Reproducir música"}>
          <span className="os-musica-ondas" aria-hidden="true"><i /><i /></span>
          <OsSonajero className="os-sonajero" />
          {!sonando && <span className="os-musica-pausa" aria-hidden="true">{UI.musica}</span>}
        </button>
      )}

      <Entrada welcome={welcome} partes={partes} invitacion={invitacion} despierta={abierta} jalando={jalando} onJalar={jalar} />

      {abierta && (
        <main className="os-cuerpo">
          {(welcome.fraseIntro || padres.length > 0 || welcome.versiculo) && (
            <Bloque n={sig()} icono="corazon" ante={welcome.padresTexto || "Con amor"} id="os-intro">
              {welcome.fraseIntro && <p className="os-lead">{welcome.fraseIntro}</p>}
              {padres.length > 0 && <p className="os-firma">{padres.join(" & ")}</p>}
              {welcome.versiculo && (
                <blockquote className="os-versiculo">
                  <p>{welcome.versiculo}</p>
                  {welcome.versiculoCita && <cite>{welcome.versiculoCita}</cite>}
                </blockquote>
              )}
            </Bloque>
          )}

          {partes && (
            <Bloque n={sig()} icono="reloj" ante="Cuenta regresiva" titulo={cuenta ? "Faltan" : "¡Llegó el día!"} id="os-cuenta">
              <p className="os-dia"><span>{partes.semana}</span> {partes.dia} de {partes.mes} · {partes.hora}</p>
              {cuenta && (
                <div className="os-cuenta" role="timer" aria-labelledby="os-cuenta">
                  {[["dias", "días", "beige"], ["horas", "horas", "salvia"], ["min", "minutos", "claro"], ["seg", "segundos", "beige"]].map(([k, l, tono], i) => (
                    <div key={k} className="os-cuenta-cubo" style={{ "--giro": `${[-5, 4, -3, 6][i]}deg`, "--i": i }}>
                      <span className="os-cuenta-salto" key={k === "seg" ? cuenta.seg : k}>
                        <OsCubo tono={tono} letra={String(cuenta[k]).padStart(k === "dias" ? 1 : 2, "0")} />
                      </span>
                      <span className="os-cuenta-l">{l}</span>
                      <span className="os-oculto">{cuenta[k]} {l}</span>
                    </div>
                  ))}
                </div>
              )}
            </Bloque>
          )}

          {(info.lugar || info.direccion) && (
            <Bloque n={sig()} icono="casa" ante={info.overline || "Dónde"} titulo={info.lugar || "El lugar"} id="os-lugar">
              {info.direccion && <p className="os-texto">{info.direccion}</p>}
              {info.mapaEmbed && (
                <div className="os-mapa"><iframe src={info.mapaEmbed} title={`Mapa de ${info.lugar || "el lugar"}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></div>
              )}
              <div className="os-botones">
                {info.mapsUrl && <a className="os-btn" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{UI.pin} Cómo llegar</a>}
                <button className="os-btn os-btn-suave" type="button" onClick={() => copiar([info.lugar, info.direccion].filter(Boolean).join(", "), "Dirección copiada")}>{UI.copiar} Copiar dirección</button>
              </div>
            </Bloque>
          )}

          {(mensajeTarde || cronograma.length > 0) && (
            <Bloque n={sig()} icono="globo" ante="Programa" titulo={info.tituloItinerario || "La tarde"} id="os-tarde">
              {mensajeTarde && <p className="os-lead">{mensajeTarde}</p>}
              {cronograma.length > 0 && (
                <ol className="os-programa">
                  {cronograma.map((c, i) => <li key={i}><span>{c.hora}</span><b>{c.titulo}</b></li>)}
                </ol>
              )}
            </Bloque>
          )}

          {activo("vestimenta") && vestimenta.titulo && (
            <Bloque n={sig()} icono="ropita" ante="Vestimenta" titulo={vestimenta.titulo} id="os-vestimenta">
              <OsRopita className="os-ropita" />
              {vestimenta.nota && <p className="os-texto">{vestimenta.nota}</p>}
              {permitidos.length > 0 && (
                <ul className="os-paleta">
                  {permitidos.map((p, i) => (
                    <li key={i}>
                      <span className="os-muestras" aria-hidden="true">{p.colores.slice(0, 3).map((c, j) => <i key={j} style={{ background: c }} />)}</span>
                      {p.nombre}
                    </li>
                  ))}
                </ul>
              )}
              {evitar.length > 0 && (
                <p className="os-evitar">Evita: {evitar.map((e) => e.nombre).join(", ")}</p>
              )}
            </Bloque>
          )}

          {activo("historia") && historia.texto && (
            <Bloque n={sig()} icono="luna" ante="Nuestra espera" titulo={historia.titulo || "Esperándote"} id="os-historia">
              <p className="os-lead">{historia.texto}</p>
            </Bloque>
          )}

          {activo("padrinos") && grupos.length > 0 && (
            <Bloque n={sig()} icono="estrella" ante="Con cariño" titulo={padrinos.titulo || "Padrinos"} id="os-padrinos">
              {grupos.map((g, i) => (
                <div key={i} className="os-grupo">
                  {g.etiqueta && <p className="os-ante">{g.etiqueta}</p>}
                  <p className="os-personas">{g.personas.filter(Boolean).map((x, j) => <span key={j}>{x}</span>)}</p>
                </div>
              ))}
            </Bloque>
          )}

          {fotos.length > 0 && (
            <Bloque n={sig()} icono="camara" ante={fotosSec.subtitulo || "Recuerdos"} titulo={fotosSec.titulo || "Fotos"} id="os-fotos">
              <div className="os-fotos">
                {fotos.slice(0, 6).map((f, i) => (
                  <figure key={f} style={{ "--g": `${[-3, 2.5, -1.5, 3, -2, 1.5][i]}deg` }}>
                    <img src={f} alt={`Foto ${i + 1}`} loading="lazy" />
                  </figure>
                ))}
              </div>
            </Bloque>
          )}

          {activo("regalos") && (regalos.texto || enlaces.length > 0 || regalos.datosTransferencia) && (
            <Bloque n={sig()} icono="regalo" ante="Para consentirla" titulo={regalos.titulo || "Lista de regalos"} id="os-regalos">
              <OsCoche className="os-coche" />
              {regalos.texto && <p className="os-texto">{regalos.texto}</p>}
              {enlaces.length > 0 && (
                <div className="os-botones">
                  {enlaces.map((e, i) => (
                    <a key={i} className="os-btn" href={e.url} target="_blank" rel="noopener noreferrer">{UI.enlace} {e.tienda || "Ver lista"}</a>
                  ))}
                </div>
              )}
              {regalos.datosTransferencia && (
                <div className="os-transferir">
                  <div><span className="os-ante">Datos para transferir</span><span className="v">{regalos.datosTransferencia}</span></div>
                  <button className="os-btn os-btn-suave" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>{UI.copiar} Copiar</button>
                </div>
              )}
            </Bloque>
          )}

          {activo("sobres") && sobres.texto && (
            <Bloque n={sig()} icono="sobre" ante="Lluvia de sobres" titulo="Un sobre con cariño" id="os-sobres" className="os-bloque-sobres">
              <div className="os-lluvia" aria-hidden="true">
                {[8, 22, 38, 54, 70, 86, 16, 62, 46, 78].map((x, i) => (
                  <OsSobre key={i} className="os-lluvia-sobre" style={{ left: `${x}%`, "--t": `${5.5 + (i % 4) * 0.9}s`, "--r": `${-1.4 * i}s`, "--g": `${(i % 2 ? 1 : -1) * (14 + i * 3)}deg` }} />
                ))}
              </div>
              <p className="os-lead">{sobres.texto}</p>
            </Bloque>
          )}

          {activo("info_importante") && (puntos.length > 0 || importante.nota) && (
            <Bloque n={sig()} icono="info" ante="Para tener en cuenta" titulo="Información importante" id="os-info">
              {puntos.length > 0 && <ul className="os-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
              {importante.nota && <p className="os-texto os-nota">{importante.nota}</p>}
            </Bloque>
          )}

          {activo("faq") && preguntas.length > 0 && (
            <Bloque n={sig()} icono="pregunta" ante="Dudas" titulo="Preguntas frecuentes" id="os-faq">
              <div className="os-faq">
                {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary>{f.r && <p>{f.r}</p>}</details>)}
              </div>
            </Bloque>
          )}

          {activo("musica") && audioSrc && (
            <Bloque n={sig()} icono="nota" ante="Música" titulo={musica.titulo || "Una canción de cuna"} id="os-cancion">
              <button className="os-btn" type="button" onClick={alternarMusica} aria-pressed={sonando}>
                {sonando ? UI.pausa : UI.musica} {sonando ? "Pausar" : "Escuchar"}
              </button>
            </Bloque>
          )}

          {confirmar && (
            <Bloque n={sig()} icono="biberon" tono="salvia" ante="Confirmación" titulo="¿Nos acompañas?" id="os-confirmar" className="os-bloque-confirmar">
              {confirmar.href ? (
                <a className="os-btn os-btn-grande" href={confirmar.href} target="_blank" rel="noopener noreferrer">
                  {UI.whatsapp} <span>{confirmar.texto} <b>{confirmar.grande}</b></span>
                </a>
              ) : (
                <button className="os-btn os-btn-grande" type="button" onClick={confirmar.onClick}>{confirmar.grande}</button>
              )}
              {limite && <p className="os-limite">Confirma antes del <b>{limite}</b></p>}
            </Bloque>
          )}

          <footer className="os-final" data-reveal>
            {letras.length > 0 && (
              <div className="os-letras" aria-hidden="true">
                {letras.map((l, i) => (
                  <span key={i} style={{ "--i": i, "--giro": `${GIROS[(i + 2) % GIROS.length]}deg` }}>
                    <OsCubo tono={TONOS[i % TONOS.length]} letra={l} />
                  </span>
                ))}
              </div>
            )}
            <OsPampas className="os-final-pampas p1" />
            <OsPampas className="os-final-pampas p2" espejo />
            <p className="os-te-esperamos">¡Te esperamos!</p>
            {padres.length > 0 && <p className="os-texto">Con amor, {welcome.padreElMadre && welcome.padreElPadre ? `${welcome.padreElMadre.split(" ")[0]} y ${welcome.padreElPadre.split(" ")[0]}` : padres.join(" y ")}</p>}
          </footer>
        </main>
      )}

      <div className={`os-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="os-modal" role="dialog" aria-modal="true" aria-label="Confirmar asistencia" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="os-modal-caja">
            <button type="button" className="os-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar"><OsBotonCostura /></button>
            <div className="os-modal-tela">
              <div className="os-modal-parche"><OsParche /></div>
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
        </div>
      )}
    </div>
  );
}
