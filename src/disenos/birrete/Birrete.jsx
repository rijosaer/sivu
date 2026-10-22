import { useEffect, useMemo, useRef, useState } from "react";
import "./birrete.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer,
} from "../comun";
import { BiDiploma, BiRizo, BiSello, BiSelloPases, BiFirma, BiCirculo, BiBirrete, BiLaurel, BiLibros } from "./arte";

// Diseño «Birrete»: graduación académica en vino y oro sobre una mesa de
// estudio forrada en cuero vino suave; hojas y diploma en marfil. Todo el
// arte en SVG semi-realista.
// - Entrada: el invitado recibe un certificado («Se otorga la presente
//   invitación a…», firma que se traza sola, folio y un sello de pases en
//   relieve dorado). Debajo, el diploma enrollado con su cinta vino y oro; la
//   cola del lazo es el llamado a tocar («Tira para desenrollar»). Al tirar,
//   la cinta se desata y el pergamino se desenrolla de arriba abajo.
// - Cuerpo: un portafolio con pestañas verticales (vino, oro, vino claro y
//   burdeos). La cuenta regresiva es un calendario académico con el día
//   marcado a tinta y un boletín de lo que falta. Cierre: birretes lanzados.
// Colores del tema: principal = vino, claro = vino pálido, oscuro = burdeos,
// papel = marfil, mármol = blanco de tarjeta, sello = oro.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Imperial+Script&display=swap";

const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV"];
const aRomano = (n) => {
  const t = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let s = "";
  let r = Number(n) || 0;
  for (const [v, l] of t) while (r >= v) { s += l; r -= v; }
  return s;
};

// Número de folio estable para cada invitado (sale de su código o su nombre).
const folioDe = (inv) => {
  const base = `${inv?.codigo || ""}${inv?.nombre || ""}`;
  let h = 7;
  for (const ch of base) h = (h * 31 + ch.charCodeAt(0)) % 100000;
  return String(1000 + (h % 9000));
};

const SEMANA = ["L", "M", "M", "J", "V", "S", "D"];
// Celdas del mes del evento, con la semana empezando en lunes.
function celdasMes(anio, mes) {
  const primero = (new Date(anio, mes - 1, 1).getDay() + 6) % 7;
  const total = new Date(anio, mes, 0).getDate();
  return [...Array(primero).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
}

// Birretes lanzados del cierre: posición, giro, tamaño y demora.
const LANZADOS = [
  { x: -118, y: 34, r: -24, s: 0.62, d: 0 },
  { x: -54, y: -4, r: 14, s: 0.86, d: 0.12 },
  { x: 8, y: 22, r: -8, s: 1, d: 0.04 },
  { x: 70, y: -10, r: 22, s: 0.74, d: 0.2 },
  { x: 122, y: 30, r: -16, s: 0.58, d: 0.3 },
];

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
const Icono = {
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  musica: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>,
  pausa: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>,
  abajo: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>,
  whatsapp: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" /><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1.2-1.2 1.8.8-.3 1.6c-3.6.4-7.7-3.7-7.3-7.3l1.6-.3.8 1.8z" /></svg>,
};

// Hoja del portafolio: papel marfil con su pestaña lateral de color.
function Hoja({ clave, titulo, indice, children, clase = "" }) {
  return (
    <section
      className={`bi-hoja bi-tono-${indice % 4} ${clase}`}
      style={{ "--tab": `${(indice % 3) * 46}px`, "--giro": `${indice % 2 ? -0.9 : 0.8}deg` }}
      aria-labelledby={`bi-h-${clave}`}
      data-reveal
    >
      <h2 className="bi-pestana" id={`bi-h-${clave}`}><span>{titulo}</span></h2>
      <div className="bi-papel">
        <p className="bi-folio" aria-hidden="true">Folio {ROMANOS[indice] || indice + 1}</p>
        {children}
      </div>
    </section>
  );
}

export default function Birrete({ site, contenidoDe, invitacion, onEnviarRSVP, enEditor }) {
  useFuentes(FUENTES);
  // enrollado → suelto (la cinta cae) → abierto (el pergamino se desenrolla).
  // En el panel se salta la entrada y el pergamino ya está abierto.
  const [fase, setFase] = useState(enEditor ? "abierto" : "enrollado");
  const abierta = fase === "abierto";
  const [rsvpAbierto, setRsvpAbierto] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [aviso, setAviso] = useState("");
  const audioRef = useRef(null);
  const tiempos = useRef([]);
  const raiz = useAparecer(abierta, "[data-reveal]", "is-in");

  useEffect(() => {
    const lista = tiempos.current;
    return () => lista.forEach(clearTimeout);
  }, []);

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
  const nombres = [welcome.novioEl, welcome.novioElla].filter(Boolean);
  const nombrePila = (nombres[0] || "").split(" ")[0];
  const audioSrc = site.audioUrl || musica.src;
  const telefono = (info.telefonoConfirmar || "").trim();
  const digitos = telefono.replace(/\D/g, "");
  const cronograma = info.cronogramaModo === "detallado" ? (info.cronograma || []).filter((c) => c && (c.titulo || c.hora)) : [];
  const mensajePrograma = info.cronogramaModo === "mensaje" ? info.cronogramaMensaje : "";
  const padres = [welcome.padreElPadre, welcome.padreElMadre, welcome.padreEllaPadre, welcome.padreEllaMadre].filter(Boolean);
  const grupos = activo("padrinos") ? (padrinos.grupos || []).filter((g) => g && (g.personas || []).some(Boolean)) : [];
  const fotos = activo("fotos") ? [...(site.fotosSubidas || []), ...(fotosSec.urls || [])].filter(Boolean) : [];
  const enlaces = (regalos.enlaces || []).filter((e) => e?.url);
  const puntos = (importante.items || []).filter(Boolean);
  const preguntas = (faq.items || []).filter((f) => f && f.p);
  const permitidos = (vestimenta.permitidos || []).filter((p) => p && (p.nombre || (p.colores || []).length));
  const evitar = (vestimenta.evitar || []).filter((p) => p && (p.nombre || p.color));
  const lugar = [info.lugar, info.direccion].filter(Boolean).join(", ");

  // La música arranca con el toque que desenrolla el diploma, nunca sola.
  function desenrollar() {
    if (fase !== "enrollado") return;
    if (audioRef.current && !enEditor) audioRef.current.play().then(() => setSonando(true)).catch(() => {});
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducido) { setFase("abierto"); return; }
    setFase("suelto");
    tiempos.current.push(setTimeout(() => setFase("abierto"), 750));
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
    tiempos.current.push(setTimeout(() => setAviso(""), 2200));
  }

  const confirmar = invitacion
    ? { grande: "Confirmar asistencia", onClick: () => setRsvpAbierto(true) }
    : digitos
      ? { texto: "Favor confirmar al", grande: telefono, href: `https://wa.me/${digitos.length === 10 ? `57${digitos}` : digitos}` }
      : null;

  // Hojas del portafolio, solo las que tienen contenido.
  const hojas = [];
  if (partes) {
    hojas.push({
      clave: "cuenta", titulo: "Calendario",
      cuerpo: (
        <>
          <p className="bi-k">{info.overline || "Calendario académico"}</p>
          <div className="bi-calendario">
            <p className="bi-cal-mes"><span>{partes.mes}</span> · {aRomano(partes.anio)}</p>
            <div className="bi-cal-rejilla" aria-hidden="true">
              {SEMANA.map((d, i) => <span key={`s${i}`} className="bi-cal-sem">{d}</span>)}
              {celdasMes(Number(partes.anio), Number(partes.mesNum)).map((d, i) => (
                <span key={i} className={`bi-cal-dia ${d === Number(partes.dia) ? "is-hoy" : ""}`}>
                  {d}
                  {d === Number(partes.dia) && <BiCirculo className="bi-cal-marca" />}
                </span>
              ))}
            </div>
            <p className="bi-fecha-larga">
              <span>{partes.semana}</span> {partes.dia} de {partes.mes}, {partes.hora}
            </p>
          </div>
          {cuenta ? (
            <table className="bi-boletin" role="timer" aria-label="Cuenta regresiva">
              <caption>Registro de lo que falta</caption>
              <tbody>
                {[["dias", "Días"], ["horas", "Horas"], ["min", "Minutos"], ["seg", "Segundos"]].map(([k, l]) => (
                  <tr key={k}><th scope="row"><span>{l}</span></th><td>{cuenta[k]}</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="bi-llego">¡Llegó el gran día!</p>
          )}
        </>
      ),
    });
  }
  if (lugar) {
    hojas.push({
      clave: "lugar", titulo: "El lugar",
      cuerpo: (
        <>
          {info.tituloSeccion && <p className="bi-k">{info.tituloSeccion}</p>}
          <p className="bi-v">{info.lugar || info.direccion}</p>
          {info.lugar && info.direccion && <p className="bi-ayuda">{info.direccion}</p>}
          {info.mapaEmbed && /^https:\/\//.test(info.mapaEmbed) && (
            <iframe className="bi-mapa" src={info.mapaEmbed} title={`Mapa de ${info.lugar || "el lugar"}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
          )}
          <div className="bi-botones">
            {info.mapsUrl && <a className="bi-btn bi-btn-linea" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>}
            <button className="bi-btn bi-btn-linea" type="button" onClick={() => copiar(lugar, "Dirección copiada")}>{Icono.copiar} Copiar</button>
          </div>
        </>
      ),
    });
  }
  if (cronograma.length > 0 || mensajePrograma) {
    hojas.push({
      clave: "programa", titulo: "Programa",
      cuerpo: (
        <>
          <p className="bi-k">{info.tituloItinerario || "El programa"}</p>
          {cronograma.length > 0 ? (
            <ol className="bi-programa">
              {cronograma.map((c, i) => (
                <li key={i}><span className="bi-hora">{c.hora}</span><span className="bi-que">{c.titulo}</span></li>
              ))}
            </ol>
          ) : (
            <p className="bi-lead">{mensajePrograma}</p>
          )}
        </>
      ),
    });
  }
  if (activo("vestimenta") && (vestimenta.titulo || vestimenta.nota || permitidos.length > 0)) {
    hojas.push({
      clave: "vestimenta", titulo: "Vestimenta",
      cuerpo: (
        <>
          <p className="bi-k">Código de vestimenta</p>
          {vestimenta.titulo && <p className="bi-v">{vestimenta.titulo}</p>}
          {vestimenta.nota && <p className="bi-ayuda">{vestimenta.nota}</p>}
          {permitidos.length > 0 && (
            <ul className="bi-paleta" aria-label="Colores sugeridos">
              {permitidos.map((p, i) => (
                <li key={i}>
                  <span className="bi-muestras">{(p.colores || []).map((c, j) => <i key={j} style={{ background: c }} />)}</span>
                  {p.nombre && <span>{p.nombre}</span>}
                </li>
              ))}
            </ul>
          )}
          {evitar.length > 0 && (
            <>
              <p className="bi-k bi-k-evitar">Te pedimos evitar</p>
              <ul className="bi-paleta bi-evitar">
                {evitar.map((p, i) => (
                  <li key={i}><span className="bi-muestras"><i style={{ background: p.color }} /></span>{p.nombre && <span>{p.nombre}</span>}</li>
                ))}
              </ul>
            </>
          )}
        </>
      ),
    });
  }
  if (padres.length > 0 || grupos.length > 0) {
    hojas.push({
      clave: "gratitud", titulo: "Gratitud",
      cuerpo: (
        <>
          {welcome.padresTexto && <p className="bi-lead bi-italica">{welcome.padresTexto}</p>}
          {padres.length > 0 && <p className="bi-firmas">{padres.map((p) => <span key={p}>{p}</span>)}</p>}
          {grupos.map((g, i) => (
            <div key={i} className="bi-grupo">
              {g.etiqueta && <p className="bi-k">{g.etiqueta}</p>}
              <p className="bi-v bi-v-chica">{g.personas.filter(Boolean).join(" · ")}</p>
            </div>
          ))}
        </>
      ),
    });
  }
  if (activo("historia") && historia.texto) {
    hojas.push({
      clave: "historia", titulo: "Mi camino",
      cuerpo: (
        <>
          {historia.titulo && <p className="bi-k">{historia.titulo}</p>}
          <BiLibros className="bi-libros" />
          <p className="bi-lead">{historia.texto}</p>
          {nombrePila && <p className="bi-firma">{nombrePila}</p>}
        </>
      ),
    });
  }
  if (activo("fotos") && (fotos.length > 0 || fotosSec.subtitulo)) {
    hojas.push({
      clave: "fotos", titulo: "Fotos",
      cuerpo: (
        <>
          {fotosSec.titulo && <p className="bi-k">{fotosSec.titulo}</p>}
          {fotos.length > 0 && (
            <div className={`bi-fotos ${fotos.length === 1 ? "is-una" : ""}`}>
              {fotos.slice(0, 6).map((f, i) => (
                <figure key={f + i}><img src={f} alt={`Foto ${i + 1} de ${nombres[0] || "la graduación"}`} loading="lazy" /></figure>
              ))}
            </div>
          )}
          {fotosSec.subtitulo && <p className="bi-lead bi-centro">{fotosSec.subtitulo}</p>}
        </>
      ),
    });
  }
  const textoSobres = activo("sobres") ? sobres.texto : "";
  const hayRegalo = activo("regalos") && (regalos.texto || regalos.datosTransferencia || enlaces.length > 0);
  if (textoSobres || hayRegalo) {
    hojas.push({
      clave: "regalos", titulo: "Regalos",
      cuerpo: (
        <>
          {hayRegalo && regalos.titulo && <p className="bi-k">{regalos.titulo}</p>}
          {textoSobres && <p className="bi-lead">{textoSobres}</p>}
          {hayRegalo && regalos.texto && <p className="bi-lead">{regalos.texto}</p>}
          {hayRegalo && enlaces.length > 0 && (
            <div className="bi-botones">
              {enlaces.map((e, i) => <a key={i} className="bi-btn bi-btn-linea" href={e.url} target="_blank" rel="noopener noreferrer">{e.tienda || "Ver lista"}</a>)}
            </div>
          )}
          {hayRegalo && regalos.datosTransferencia && (
            <div className="bi-transferir">
              <div><span className="bi-k">Datos para transferir</span><span className="bi-dato">{regalos.datosTransferencia}</span></div>
              <button className="bi-btn bi-btn-linea" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>{Icono.copiar} Copiar</button>
            </div>
          )}
        </>
      ),
    });
  }
  if (activo("info_importante") && (puntos.length > 0 || importante.nota)) {
    hojas.push({
      clave: "importante", titulo: "Ten en cuenta",
      cuerpo: (
        <>
          {puntos.length > 0 && <ul className="bi-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
          {importante.nota && <p className="bi-ayuda">{importante.nota}</p>}
        </>
      ),
    });
  }
  if (activo("faq") && preguntas.length > 0) {
    hojas.push({
      clave: "faq", titulo: "Preguntas",
      cuerpo: (
        <div className="bi-faq">
          {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary>{f.r && <p>{f.r}</p>}</details>)}
        </div>
      ),
    });
  }
  if (confirmar) {
    hojas.push({
      clave: "rsvp", titulo: "R.S.V.P.", clase: "bi-hoja-rsvp",
      cuerpo: (
        <div className="bi-rsvp">
          <p className="bi-guion">¿Me acompañas?</p>
          <p className="bi-ayuda">Tu respuesta me ayuda a preparar cada detalle.</p>
          {confirmar.href ? (
            <a className="bi-btn bi-btn-oro" href={confirmar.href} target="_blank" rel="noopener noreferrer">
              {Icono.whatsapp}<span>{confirmar.texto} <b>{confirmar.grande}</b></span>
            </a>
          ) : (
            <button className="bi-btn bi-btn-oro" type="button" onClick={confirmar.onClick}>{confirmar.grande}</button>
          )}
          {limite && <p className="bi-limite">Confirma antes del <b>{limite}</b></p>}
        </div>
      ),
    });
  }

  const anioRomano = partes ? aRomano(partes.anio) : "";

  return (
    <div className={`bi bi-fase-${fase}`} ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop />}
      {audioSrc && fase !== "enrollado" && (
        <button className={`bi-musica ${sonando ? "is-sonando" : ""}`} type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label={sonando ? "Pausar música" : "Reproducir música"}>
          <BiBirrete className="bi-musica-birrete" />
          <span className="bi-musica-icono">{sonando ? Icono.pausa : Icono.musica}</span>
        </button>
      )}

      {/* Entrada y portada: el diploma enrollado que se desenrolla. */}
      <header className="bi-portada" aria-labelledby="bi-nombre">
        {invitacion?.nombre && (
          <div className="bi-certificado">
            <p className="bi-otorga">Se otorga la presente invitación a</p>
            <p className="bi-invitado-nombre">{invitacion.nombre}</p>
            <div className="bi-cert-pie">
              <div className="bi-cert-firma">
                <BiFirma className="bi-firma-svg" />
                <p className="bi-cert-quien">{nombres[0] || "La anfitriona"}</p>
                <p className="bi-cert-folio">Folio N.º {folioDe(invitacion)}</p>
              </div>
              {pases > 0 && (
                <div className="bi-cert-pases">
                  <BiSelloPases className="bi-relieve" numero={pases} />
                  <p>Válida para {pases} {pases === 1 ? "persona" : "personas"}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bi-diploma">
          <div className="bi-rizo"><BiRizo /></div>
          <div className="bi-pliego">
            <div className="bi-pliego-in">
              <div className="bi-pliego-texto">
                <div className="bi-cresta" aria-hidden="true">
                  <BiLaurel className="bi-cresta-laurel" />
                  <BiBirrete className="bi-cresta-birrete" />
                  <BiLaurel className="bi-cresta-laurel" espejo />
                </div>
                <p className="bi-antetitulo">{welcome.bienvenidaTexto || "Mi grado"}</p>
                <h1 className="bi-nombre" id="bi-nombre">
                  {nombres[0]}
                  {nombres[1] && <><span className="bi-y"> &amp; </span>{nombres[1]}</>}
                </h1>
                <span className="bi-filete" aria-hidden="true"><i /></span>
                {welcome.fraseIntro && <p className="bi-frase">{welcome.fraseIntro}</p>}
                {partes && (
                  <p className="bi-fecha">
                    <span>{partes.semana}</span>
                    <b>{partes.dia}</b>
                    <span>{partes.mes} · {partes.anio}</span>
                  </p>
                )}
                <BiSello className="bi-sello" texto={anioRomano || "GRADO"} />
              </div>
            </div>
          </div>
          <button
            type="button"
            className="bi-rollo"
            onClick={desenrollar}
            disabled={fase !== "enrollado"}
            aria-label="Desenrollar el diploma y abrir la invitación"
          >
            <BiDiploma cinta />
          </button>
        </div>

        <div className="bi-pie-entrada">
          <button type="button" className="bi-tirar" onClick={desenrollar} tabIndex={fase === "enrollado" ? 0 : -1} aria-hidden={fase !== "enrollado"}>
            <span className="bi-tirar-cola" aria-hidden="true" />
            <span className="bi-tirar-cinta">Tira para desenrollar</span>
          </button>
          <p className="bi-desliza" aria-hidden="true">{Icono.abajo}<span>Desliza</span></p>
        </div>
      </header>

      {abierta && (
        <main className="bi-cuerpo">
          <div className="bi-emblema" data-reveal>
            <BiLaurel className="bi-emblema-laurel" />
            <div>
              <BiBirrete className="bi-emblema-birrete" />
              <p className="bi-emblema-titulo">Portafolio</p>
              <p className="bi-emblema-sub">de la celebración</p>
            </div>
            <BiLaurel className="bi-emblema-laurel" espejo />
          </div>

          <div className="bi-carpeta">
            {hojas.map((h, i) => (
              <Hoja key={h.clave} clave={h.clave} titulo={h.titulo} indice={i} clase={h.clase}>{h.cuerpo}</Hoja>
            ))}
          </div>

          <footer className="bi-final" data-reveal>
            <div className="bi-lanzados" aria-hidden="true">
              {LANZADOS.map((b, i) => (
                <span key={i} className="bi-lanzado" style={{ "--x": `${b.x}px`, "--y": `${b.y}px`, "--r": `${b.r}deg`, "--s": b.s, "--d": `${b.d}s` }}>
                  <BiBirrete className="bi-lanzado-birrete" />
                </span>
              ))}
            </div>
            <p className="bi-te-espero">¡Te espero para celebrar!</p>
            {nombres.length > 0 && <p className="bi-ayuda">Con gratitud, {nombres.join(" & ")}</p>}
            {musica.titulo && audioSrc && <p className="bi-suena">Suena: {musica.titulo}</p>}
          </footer>
        </main>
      )}

      <div className={`bi-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="bi-modal" role="dialog" aria-modal="true" aria-label="Confirmar asistencia" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="bi-modal-hoja">
            <button type="button" className="bi-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">
              <span aria-hidden="true">Cerrar</span><b aria-hidden="true">×</b>
            </button>
            <div className="bi-modal-caja">
              <div className="bi-membrete" aria-hidden="true">
                <div className="bi-membrete-escudo">
                  <BiLaurel className="bi-membrete-laurel" />
                  <BiBirrete className="bi-membrete-birrete" />
                  <BiLaurel className="bi-membrete-laurel" espejo />
                </div>
                <div className="bi-membrete-texto">
                  <p className="bi-membrete-titulo">Constancia de asistencia</p>
                  <p className="bi-membrete-sub">{[nombres[0], partes && `${partes.dia} de ${partes.mes} de ${partes.anio}`].filter(Boolean).join(" · ")}</p>
                </div>
                <p className="bi-membrete-folio">Folio N.º {folioDe(invitacion)}</p>
              </div>
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
