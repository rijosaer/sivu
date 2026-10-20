import { useEffect, useMemo, useRef, useState } from "react";
import "./confeti.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer,
} from "../comun";
import { CfGlobo, CfRamo, CfPinza, CfPastel, CfRegalo } from "./arte";

// Diseño «Confeti»: cumpleaños alegre pero elegante. Globos durazno, rubor,
// crema y oro sobre papel crema, con confeti dorado.
// - Entrada «¡Revienta el globo!»: un gran globo durazno brillante flota en
//   el centro con un vaivén suave. Al tocarlo se revienta (crece, estalla en
//   pedazos de látex) y suelta una lluvia de confeti dorado y durazno que
//   descubre la tarjeta con el nombre y la edad en grande.
// - Cuerpo «polaroids colgadas»: un cordel fino cruza la página y de él
//   cuelgan, con pinzas de madera, instantáneas tipo polaroid (marco blanco
//   con borde inferior ancho donde va el título a mano), levemente giradas y
//   alternando a cada lado. Al aparecer se mecen hasta quedar quietas. Las
//   fotos del evento también cuelgan como polaroids, de a dos por cordel.
// Colores del tema: principal = durazno, claro = rubor, oscuro = terracota,
// papel = crema, mármol = blanco de las polaroids, sello = oro del confeti.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Cookie&family=Poppins:wght@300;400;500;600&display=swap";

// Número pseudoaleatorio estable entre 0 y 1 (mismo confeti en cada carga).
const azar = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
const COLORES = ["oro", "oro", "oro", "durazno", "claro", "oscuro", "blanco", "oro", "durazno"];
const FORMAS = ["tira", "tira", "punto", "rizo", "tira", "rombo"];

// Primera ola: estalla desde el globo y cae. Segunda: llueve desde arriba.
const ESTALLIDO = Array.from({ length: 46 }, (_, i) => {
  const angulo = azar(i + 11) * Math.PI * 2;
  const fuerza = 70 + azar(i + 21) * 150;
  return {
    forma: FORMAS[i % FORMAS.length],
    color: COLORES[Math.floor(azar(i + 31) * COLORES.length)],
    bx: Math.cos(angulo) * fuerza,
    by: Math.sin(angulo) * fuerza * 0.8 - 60,
    sx: (azar(i + 41) * 2 - 1) * 60,
    gira: Math.round(azar(i + 51) * 720 - 360),
    dur: 2200 + Math.round(azar(i + 61) * 1400),
    tam: 0.7 + azar(i + 71) * 0.7,
    aleteo: 400 + Math.round(azar(i + 81) * 500),
  };
});
const LLUVIA = Array.from({ length: 64 }, (_, i) => ({
  forma: FORMAS[(i + 3) % FORMAS.length],
  color: COLORES[Math.floor(azar(i + 131) * COLORES.length)],
  x: azar(i + 141) * 100,
  sx: (azar(i + 151) * 2 - 1) * 70,
  gira: Math.round(azar(i + 161) * 900 - 450),
  dur: 2400 + Math.round(azar(i + 171) * 1800),
  retraso: 120 + Math.round(azar(i + 181) * 1300),
  tam: 0.65 + azar(i + 191) * 0.7,
  aleteo: 380 + Math.round(azar(i + 201) * 600),
}));
// Pedazos de látex que salen volando al reventar.
const PEDAZOS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 + azar(i + 301) * 0.5;
  const d = 120 + azar(i + 311) * 90;
  return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, gira: Math.round(azar(i + 321) * 540 - 270), forma: i % 3 };
});
const FORMAS_PEDAZO = [
  "M2 8 C 6 0 18 0 22 6 C 18 10 14 14 6 14 C 2 13 0 11 2 8 Z",
  "M0 4 C 8 -2 20 2 24 10 C 16 12 10 16 4 14 Z",
  "M4 2 C 12 0 18 6 16 14 C 10 18 2 14 0 8 Z",
];
// Confeti quieto impreso en la tarjeta (posición en %, giro, forma y color).
const IMPRESO = [
  [6, 8, 30, "tira", "oro"], [14, 3, -20, "punto", "durazno"], [88, 6, 60, "tira", "durazno"], [94, 16, -35, "punto", "oro"],
  [4, 46, 15, "punto", "claro"], [96, 52, -50, "tira", "oro"], [8, 84, 70, "tira", "durazno"], [16, 94, 10, "punto", "oro"],
  [90, 88, -15, "rombo", "oro"], [80, 96, 40, "tira", "claro"], [50, 2, 90, "punto", "oro"], [2, 66, -60, "rombo", "durazno"],
];
const GIROS = [-2.2, 1.8, -1.4, 2.3, -1.9, 1.3, -2.5, 1.6];

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
const Icono = {
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  musica: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>,
  pausa: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>,
  whatsapp: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z" /></svg>,
  enlace: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>,
};

function Pieza({ forma, color, tam = 1, estilo, className = "" }) {
  return (
    <i className={`cf-pieza cf-${forma} cf-c-${color} ${className}`} style={{ "--tam": tam, ...estilo }} aria-hidden="true">
      <b />
    </i>
  );
}

// Lluvia de confeti al reventar el globo (capa fija encima de todo).
function Lluvia() {
  return (
    <div className="cf-lluvia" aria-hidden="true">
      {ESTALLIDO.map((p, i) => (
        <Pieza key={`e${i}`} {...p} className="cf-sale"
          estilo={{ "--bx": `${p.bx}px`, "--by": `${p.by}px`, "--sx": `${p.sx}px`, "--gira": `${p.gira}deg`, "--dur": `${p.dur}ms`, "--aleteo": `${p.aleteo}ms` }} />
      ))}
      {LLUVIA.map((p, i) => (
        <Pieza key={`l${i}`} {...p} className="cf-cae"
          estilo={{ left: `${p.x}%`, "--sx": `${p.sx}px`, "--gira": `${p.gira}deg`, "--dur": `${p.dur}ms`, "--retraso": `${p.retraso}ms`, "--aleteo": `${p.aleteo}ms` }} />
      ))}
    </div>
  );
}

// Cordel que cruza la página: baja un poco en cada pinza, como si el peso de
// la polaroid lo jalara. `puntos` son las x (en %) de cada pinza.
function Cordel({ puntos, hondo = 22 }) {
  const pasos = [[-10, 6], ...puntos.map((x) => [x, hondo]), [110, 8]];
  let d = `M${pasos[0][0]} ${pasos[0][1]}`;
  for (let i = 1; i < pasos.length; i++) {
    const [x0, y0] = pasos[i - 1];
    const [x1, y1] = pasos[i];
    d += ` Q ${(x0 + x1) / 2} ${(y0 + y1) / 2 + 4} ${x1} ${y1}`;
  }
  return (
    <svg className="cf-cordel" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Una sección = una polaroid colgada del cordel con su pinza de madera.
function Colgada({ n, titulo, id, children, className = "" }) {
  const lado = n % 2 ? "der" : "izq";
  return (
    <section className={`cf-colgada cf-${lado} ${className}`} aria-labelledby={id} data-reveal style={{ "--giro": `${GIROS[n % GIROS.length]}deg` }}>
      <Cordel puntos={[lado === "izq" ? 46 : 54]} />
      <div className="cf-polaroid">
        <CfPinza className="cf-pinza" />
        <div className="cf-foto">{children}</div>
        <h2 className="cf-pie" id={id}>{titulo}</h2>
      </div>
    </section>
  );
}

function Entrada({ welcome, invitacion, reventando, onReventar }) {
  const pases = pasesDe(invitacion);
  return (
    <section className={`cf-entrada ${reventando ? "cf-reventado" : ""}`} aria-label="Abrir invitación">
      <div className="cf-fondo-globos" aria-hidden="true">
        <CfGlobo tono="rubor" className="cf-globito cf-globito-1" />
        <CfGlobo tono="oro" className="cf-globito cf-globito-2" />
        <CfGlobo tono="crema" className="cf-globito cf-globito-3" />
      </div>
      <div className="cf-entrada-arriba">
        {invitacion?.nombre ? (
          <div className="cf-invitado">
            <span className="cf-etiqueta">Invitación especial para</span>
            <p className="cf-invitado-nombre">{invitacion.nombre}</p>
            {pases > 0 && <span className="cf-pases">{pases} {pases === 1 ? "pase reservado" : "pases reservados"}</span>}
          </div>
        ) : (
          <div className="cf-invitado">
            <span className="cf-etiqueta">{welcome.bienvenidaTexto || "Estás invitado"}</span>
            <p className="cf-invitado-nombre">¡Hay fiesta!</p>
          </div>
        )}
      </div>
      <div className="cf-globo-zona">
        <span className="cf-halo" aria-hidden="true" />
        <button type="button" className="cf-globo-btn" onClick={onReventar} aria-label="Reventar el globo y abrir la invitación">
          <CfGlobo tono="durazno" className="cf-globo-grande" />
        </button>
        <span className="cf-pum" aria-hidden="true" />
        <span className="cf-pedazos" aria-hidden="true">
          {PEDAZOS.map((p, i) => (
            <svg key={i} viewBox="0 0 24 18" style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px`, "--gira": `${p.gira}deg` }}>
              <path d={FORMAS_PEDAZO[p.forma]} />
            </svg>
          ))}
        </span>
      </div>
      <div className="cf-entrada-abajo">
        <p className="cf-revienta">¡Revienta el globo!</p>
        <p className="cf-pista">Tócalo para abrir tu invitación</p>
      </div>
    </section>
  );
}

export default function Confeti({ site, contenidoDe, invitacion, onEnviarRSVP, enEditor }) {
  useFuentes(FUENTES);
  // cerrada → reventando (globo estalla, cuerpo ya debajo) → abierta.
  const [fase, setFase] = useState(enEditor ? "abierta" : "cerrada");
  const [lluvia, setLluvia] = useState(false);
  const [rsvpAbierto, setRsvpAbierto] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [aviso, setAviso] = useState("");
  const audioRef = useRef(null);
  const relojes = useRef([]);
  const abierta = fase !== "cerrada";
  const raiz = useAparecer(abierta, "[data-reveal]", "is-in");

  useEffect(() => () => relojes.current.forEach(clearTimeout), []);

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
  const festejados = (welcome.festejados || []).filter((f) => f && f.nombre);
  const personas = festejados.length
    ? festejados
    : [welcome.novioEl, welcome.novioElla].filter(Boolean).map((nombre) => ({ nombre, edad: "" }));
  const varios = personas.length > 1;
  const audioSrc = site.audioUrl || musica.src;
  const telefono = (info.telefonoConfirmar || "").trim();
  const digitos = telefono.replace(/\D/g, "");
  const cronograma = info.cronogramaModo === "detallado" ? (info.cronograma || []).filter((c) => c && (c.hora || c.titulo)) : [];
  const mensajePrograma = info.cronogramaModo === "mensaje" ? info.cronogramaMensaje : "";
  const padres = [welcome.padreElPadre, welcome.padreElMadre, welcome.padreEllaPadre, welcome.padreEllaMadre].filter(Boolean);
  const grupos = activo("padrinos") ? (padrinos.grupos || []).filter((g) => g && (g.personas || []).some(Boolean)) : [];
  const fotos = [...(activo("fotos") ? fotosSec.urls || [] : []), ...(site.fotosSubidas || [])].filter(Boolean);
  const enlaces = activo("regalos") ? (regalos.enlaces || []).filter((e) => e?.url) : [];
  const transferencia = activo("regalos") ? regalos.datosTransferencia : "";
  const textoRegalo = (activo("regalos") && regalos.texto) || "";
  const textoSobres = (activo("sobres") && sobres.texto) || "";
  const hayRegalo = textoRegalo || textoSobres || transferencia || enlaces.length > 0;
  const puntos = activo("info_importante") ? (importante.items || []).filter(Boolean) : [];
  const preguntas = activo("faq") ? (faq.items || []).filter((f) => f && f.p) : [];
  const permitidos = (vestimenta.permitidos || []).filter((p) => p && (p.nombre || (p.colores || []).length));
  const evitar = (vestimenta.evitar || []).filter((p) => p && (p.nombre || p.color));
  const lugar = [info.lugar, info.direccion].filter(Boolean).join(", ");
  const mapa = /^https:\/\//.test(info.mapaEmbed || "") ? info.mapaEmbed : "";
  const firma = personas.map((p) => p.nombre.split(" ")[0]).join(" y ");

  // La música arranca con el toque que revienta el globo, nunca sola.
  function reventar() {
    if (fase !== "cerrada") return;
    if (audioRef.current) audioRef.current.play().then(() => setSonando(true)).catch(() => {});
    window.scrollTo(0, 0);
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducido) { setFase("abierta"); return; }
    setFase("reventando");
    setLluvia(true);
    relojes.current.push(setTimeout(() => setFase("abierta"), 1300));
    relojes.current.push(setTimeout(() => setLluvia(false), 5200));
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
    relojes.current.push(setTimeout(() => setAviso(""), 2200));
  }

  // Con invitación personal se confirma por el formulario; sin código, por
  // WhatsApp al teléfono del anfitrión; si no hay ninguno, no hay botón.
  const confirmar = invitacion
    ? { grande: "Confirmar asistencia", onClick: () => setRsvpAbierto(true) }
    : digitos
      ? { texto: "Favor confirmar al", grande: telefono, href: `https://wa.me/${digitos.length === 10 ? `57${digitos}` : digitos}` }
      : null;

  // Cada polaroid alterna de lado y de giro según el orden en que aparece.
  let orden = 0;
  const sig = () => orden++;
  const pares = [];
  for (let i = 0; i < fotos.length; i += 2) pares.push(fotos.slice(i, i + 2));

  return (
    <div className="cf" ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop preload="none" />}
      {audioSrc && abierta && (
        <button className="cf-musica" type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label={sonando ? "Pausar la música" : "Poner música"}>
          {sonando ? Icono.pausa : Icono.musica}
          <span>{sonando ? "Pausar" : "Música"}</span>
        </button>
      )}

      {fase !== "abierta" && (
        <Entrada welcome={welcome} invitacion={invitacion} reventando={fase === "reventando"} onReventar={reventar} />
      )}
      {lluvia && <Lluvia />}

      {abierta && (
        <main className="cf-cuerpo" aria-labelledby="cf-titulo">
          {/* La tarjeta que descubre el confeti: nombre y edad en grande. */}
          <header className="cf-portada">
            <CfRamo className="cf-portada-ramo" />
            <div className="cf-tarjeta">
              {IMPRESO.map(([x, y, g, forma, color], i) => (
                <Pieza key={i} forma={forma} color={color} className="cf-impreso" estilo={{ left: `${x}%`, top: `${y}%`, rotate: `${g}deg` }} />
              ))}
              <p className="cf-etiqueta">{welcome.bienvenidaTexto || "¡Vamos a celebrar!"}</p>
              {varios ? (
                <>
                  <h1 className="cf-sr" id="cf-titulo">{personas.map((p) => p.nombre).join(" y ")}</h1>
                  <ul className="cf-festejados" aria-hidden="true">
                    {personas.map((p, i) => (
                      <li key={i}>
                        <span className="cf-nombre cf-nombre-chico">{p.nombre}</span>
                        {p.edad && <span className="cf-edad cf-edad-chica"><b>{p.edad}</b><span>años</span></span>}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <h1 className="cf-nombre" id="cf-titulo">{personas[0]?.nombre}</h1>
                  {personas[0]?.edad && (
                    <p className="cf-edad"><b>{personas[0].edad}</b><span>años</span></p>
                  )}
                </>
              )}
              {welcome.fraseIntro && <p className="cf-frase">{welcome.fraseIntro}</p>}
              {partes && (
                <div className="cf-fecha">
                  <span>{partes.semana}</span>
                  <b>{partes.dia}</b>
                  <span>{partes.hora}</span>
                  <em>{partes.mes} · {partes.anio}</em>
                </div>
              )}
            </div>
          </header>

          <div className="cf-tendedero">
            {partes && (
              <Colgada n={sig()} id="cf-cuenta" titulo={cuenta ? "¡Ya casi!" : "¡Hoy es el día!"}>
                <CfPastel className="cf-pastel" />
                {cuenta ? (
                  <>
                    <p className="cf-k">Faltan para soplar las velas</p>
                    <div className="cf-cuenta" role="timer" aria-label="Cuenta regresiva">
                      {[["dias", "días"], ["horas", "horas"], ["min", "min"], ["seg", "seg"]].map(([k, l]) => (
                        <div key={k}><span className="n">{cuenta[k]}</span><span className="l">{l}</span></div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="cf-lead">¡Llegó el gran día!</p>
                )}
              </Colgada>
            )}

            {lugar && (
              <Colgada n={sig()} id="cf-lugar" titulo={info.tituloSeccion && info.tituloSeccion.length < 22 ? info.tituloSeccion : "¿Dónde?"}>
                <span className="cf-icono-grande" aria-hidden="true">{Icono.pin}</span>
                {info.overline && <p className="cf-k">{info.overline}</p>}
                <p className="cf-v">{info.lugar || info.direccion}</p>
                {info.lugar && info.direccion && <p className="cf-texto">{info.direccion}</p>}
                {mapa && <iframe className="cf-mapa" src={mapa} title={`Mapa de ${info.lugar || "el lugar"}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />}
                <div className="cf-botones">
                  {info.mapsUrl && <a className="cf-btn" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>}
                  <button className="cf-btn cf-btn-linea" type="button" onClick={() => copiar(lugar, "Dirección copiada")}>{Icono.copiar} Copiar</button>
                </div>
              </Colgada>
            )}

            {(cronograma.length > 0 || mensajePrograma) && (
              <Colgada n={sig()} id="cf-programa" titulo={info.tituloItinerario || "El plan"}>
                {cronograma.length > 0 ? (
                  <ol className="cf-programa">
                    {cronograma.map((c, i) => (
                      <li key={i}><span className="cf-hora">{c.hora}</span><span className="cf-que">{c.titulo}</span></li>
                    ))}
                  </ol>
                ) : (
                  <p className="cf-lead">{mensajePrograma}</p>
                )}
              </Colgada>
            )}

            {activo("vestimenta") && (vestimenta.titulo || vestimenta.nota) && (
              <Colgada n={sig()} id="cf-vestimenta" titulo="¿Qué me pongo?">
                <p className="cf-k">Código de vestimenta</p>
                {vestimenta.titulo && <p className="cf-v">{vestimenta.titulo}</p>}
                {vestimenta.nota && <p className="cf-texto">{vestimenta.nota}</p>}
                {permitidos.length > 0 && (
                  <ul className="cf-paletas">
                    {permitidos.map((p, i) => (
                      <li key={i}>
                        <span className="cf-gotas">{(p.colores || []).map((c, k) => <i key={k} style={{ background: c }} />)}</span>
                        {p.nombre && <span>{p.nombre}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {evitar.length > 0 && (
                  <p className="cf-evitar">
                    <span className="cf-k">Evita</span>
                    {evitar.map((e, i) => (
                      <span key={i} className="cf-evitar-item">{e.color && <i style={{ background: e.color }} />}{e.nombre}</span>
                    ))}
                  </p>
                )}
              </Colgada>
            )}

            {(padres.length > 0 || grupos.length > 0) && (
              <Colgada n={sig()} id="cf-familia" titulo={padrinos.titulo && padrinos.titulo.length < 22 ? padrinos.titulo : "Con mucho amor"}>
                {padres.length > 0 && (
                  <div className="cf-grupo">
                    <p className="cf-k">{welcome.padresTexto || "Mis padres"}</p>
                    {padres.map((p, i) => <p key={i} className="cf-persona">{p}</p>)}
                  </div>
                )}
                {grupos.map((g, i) => (
                  <div key={i} className="cf-grupo">
                    {g.etiqueta && <p className="cf-k">{g.etiqueta}</p>}
                    {g.personas.filter(Boolean).map((p, k) => <p key={k} className="cf-persona">{p}</p>)}
                  </div>
                ))}
              </Colgada>
            )}

            {activo("historia") && historia.texto && (
              <Colgada n={sig()} id="cf-historia" titulo={historia.titulo && historia.titulo.length < 22 ? historia.titulo : "Un poco de mí"}>
                <p className="cf-carta">{historia.texto}</p>
                {firma && <p className="cf-firma">{firma}</p>}
              </Colgada>
            )}

            {pares.length > 0 && (
              <section className="cf-album" aria-labelledby="cf-fotos" data-reveal>
                <h2 className="cf-letrero" id="cf-fotos">{fotosSec.titulo || "Momentos"}</h2>
                {fotosSec.subtitulo && <p className="cf-texto cf-album-sub">{fotosSec.subtitulo}</p>}
                {pares.map((par, i) => (
                  <div key={i} className={`cf-fila ${par.length === 1 ? "cf-fila-una" : ""}`}>
                    <Cordel puntos={par.length === 1 ? [50] : [25, 75]} hondo={20} />
                    {par.map((url, k) => (
                      <figure key={url + k} className="cf-polaroid cf-polaroid-foto" style={{ "--giro": `${GIROS[(i * 2 + k + 1) % GIROS.length] * 1.4}deg` }}>
                        <CfPinza className="cf-pinza" />
                        <img src={url} alt={`Foto ${i * 2 + k + 1} de ${firma || "la cumpleañera"}`} loading="lazy" />
                        <figcaption aria-hidden="true">{["♡", "✶", "♡", "✷"][(i * 2 + k) % 4]}</figcaption>
                      </figure>
                    ))}
                  </div>
                ))}
              </section>
            )}

            {hayRegalo && (
              <Colgada n={sig()} id="cf-regalo" titulo={regalos.titulo && regalos.titulo.length < 22 ? regalos.titulo : "Un detalle"}>
                <CfRegalo className="cf-regalo" />
                <p className="cf-lead">{textoSobres || textoRegalo || "Tu presencia es mi mejor regalo; si deseas tener un detalle conmigo, aquí te dejo cómo."}</p>
                {textoSobres && textoRegalo && <p className="cf-texto">{textoRegalo}</p>}
                {transferencia && (
                  <div className="cf-transferir">
                    <span className="cf-k">Datos para transferir</span>
                    <span className="cf-transferir-v">{transferencia}</span>
                    <button className="cf-btn cf-btn-linea" type="button" onClick={() => copiar(transferencia, "Datos copiados")}>{Icono.copiar} Copiar</button>
                  </div>
                )}
                {enlaces.length > 0 && (
                  <div className="cf-botones">
                    {enlaces.map((e, i) => (
                      <a key={i} className="cf-btn cf-btn-linea" href={e.url} target="_blank" rel="noopener noreferrer">{Icono.enlace} {e.tienda || "Ver lista"}</a>
                    ))}
                  </div>
                )}
              </Colgada>
            )}

            {(puntos.length > 0 || (activo("info_importante") && importante.nota)) && (
              <Colgada n={sig()} id="cf-info" titulo="Ten en cuenta">
                {importante.nota && <p className="cf-texto">{importante.nota}</p>}
                {puntos.length > 0 && <ul className="cf-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
              </Colgada>
            )}

            {preguntas.length > 0 && (
              <Colgada n={sig()} id="cf-faq" titulo="Preguntas">
                <div className="cf-faq">
                  {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary><p>{f.r}</p></details>)}
                </div>
              </Colgada>
            )}

            {confirmar && (
              <Colgada n={sig()} id="cf-confirmar" titulo="¿Vienes?" className="cf-colgada-rsvp">
                <p className="cf-lead">{invitacion ? "Me encantaría celebrar contigo." : "Me encantaría celebrar contigo. Cuéntame si vienes."}</p>
                {confirmar.href ? (
                  <a className="cf-btn cf-btn-grande" href={confirmar.href} target="_blank" rel="noopener noreferrer">
                    {Icono.whatsapp}<span>{confirmar.texto} <b>{confirmar.grande}</b></span>
                  </a>
                ) : (
                  <button className="cf-btn cf-btn-grande" type="button" onClick={confirmar.onClick}>{confirmar.grande}</button>
                )}
                {limite && <p className="cf-limite">Confirma antes del <b>{limite}</b></p>}
              </Colgada>
            )}
          </div>

          <footer className="cf-final" data-reveal>
            <CfRamo className="cf-final-ramo" />
            <p className="cf-te-espero">{varios ? "¡Te esperamos!" : "¡Te espero!"}</p>
            {firma && <p className="cf-texto">Con cariño, {firma}</p>}
          </footer>
        </main>
      )}

      <div className={`cf-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="cf-modal" role="dialog" aria-modal="true" aria-label="Confirmar asistencia" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="cf-modal-caja">
            <CfPinza className="cf-modal-pinza" />
            <button type="button" className="cf-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">×</button>
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
