import { useEffect, useMemo, useRef, useState } from "react";
import "./medianoche.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer,
} from "../comun";
import { MdReloj, MdFuegos, MdCopas, MdPlato, MdAbanico, MdEsquina } from "./arte";

// Diseño «Medianoche»: gala sofisticada en negro liso y oro fino, pensada
// para cenas corporativas de fin de año. Oscuro a propósito pero sin recargo:
// mucho aire, filetes de un píxel y el brillo reservado a la entrada.
// - Entrada «Recibe el año»: un reloj de bolsillo antiguo de oro marca casi
//   las 12. Al tocar suena la cuenta 3 · 2 · 1 en grande, las agujas llegan a
//   la medianoche y estallan fuegos artificiales dorados que revelan el nombre
//   de la empresa y del evento.
// - Cuerpo: un programa de gala art-déco. Marco escalonado de filetes dorados;
//   cada sección y cada momento de la noche llevan número romano y un abanico
//   art-déco pequeño. Simétrico, sobrio y centrado.
// Colores del tema: principal = oro, claro = champaña, oscuro = bronce,
// papel = negro, mármol = tarjetas, sello = acento champaña.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Federo&display=swap";

const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
const romano = (n) => ROMANOS[n] || String(n + 1);

// Las agujas arrancan a las 11:57 y llegan a las 12 con la cuenta.
const ANTES = { hora: -1.5, minuto: -18 };

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" };
const Icono = {
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="1" /><path d="M16 8V5H5v11h3" /></svg>,
  musica: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>,
  pausa: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>,
  parqueadero: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="1" /><path d="M9.5 17V7h3.5a3 3 0 0 1 0 6H9.5" /></svg>,
  persona: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6" /></svg>,
  documento: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="1" /><circle cx="8.5" cy="11" r="2" /><path d="M5.5 15.5c.6-1.4 1.6-2 3-2s2.4.6 3 2M14 10h4.5M14 13h3.5" /></svg>,
  rombo: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 5l7 7-7 7-7-7z" /><path d="M12 9l3 3-3 3-3-3z" /></svg>,
};
function iconoDe(texto) {
  const t = texto.toLowerCase();
  if (/parque|estaciona|valet/.test(t)) return Icono.parqueadero;
  if (/acompa|personal|intransferible/.test(t)) return Icono.persona;
  if (/documento|c[ée]dula|identidad|carn[ée]/.test(t)) return Icono.documento;
  return Icono.rombo;
}

// Encabezado de cada sección del programa: abanico, número romano entre
// filetes y título en Federo espaciado.
function Encabezado({ n, titulo, id, ante }) {
  return (
    <div className="md-cabeza">
      <MdAbanico className="md-cabeza-abanico" />
      <p className="md-numeral" aria-hidden="true"><i />{romano(n)}<i /></p>
      {ante && <p className="md-ante">{ante}</p>}
      <h2 id={id}>{titulo}</h2>
    </div>
  );
}

// Entrada: reloj de bolsillo que llega a la medianoche.
function Entrada({ welcome, invitacion, onTocar, onAbrir }) {
  // fase: espera → cuenta (3, 2, 1) → fuegos (revela empresa y evento)
  const [fase, setFase] = useState("espera");
  const [numero, setNumero] = useState(3);
  // El reloj se retira del todo cuando termina de desvanecerse.
  const [sinReloj, setSinReloj] = useState(false);
  const tiempos = useRef([]);
  const pases = pasesDe(invitacion);

  useEffect(() => () => tiempos.current.forEach(clearTimeout), []);

  function tocar() {
    if (fase !== "espera") return;
    onTocar();
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = (fn, ms) => tiempos.current.push(setTimeout(fn, ms));
    if (reducido) {
      setFase("fuegos");
      t(() => setSinReloj(true), 400);
      t(onAbrir, 2200);
      return;
    }
    setFase("cuenta");
    setNumero(3);
    t(() => setNumero(2), 900);
    t(() => setNumero(1), 1800);
    t(() => setFase("fuegos"), 2700);
    t(() => setSinReloj(true), 4300);
    t(onAbrir, 7600);
  }

  const enHora = fase !== "espera";
  return (
    <section className={`md-entrada md-fase-${fase}`} aria-labelledby="md-entrada-titulo">
      <div className="md-entrada-arriba">
        {invitacion?.nombre ? (
          <>
            <p className="md-para">Invitación especial para</p>
            <p className="md-para-nombre">{invitacion.nombre}</p>
            {pases > 0 && <p className="md-pases">{pases} {pases === 1 ? "pase reservado" : "pases reservados"}</p>}
          </>
        ) : (
          <p className="md-para">Invitación</p>
        )}
      </div>

      <div className="md-escena">
        {!sinReloj && (
          <button type="button" className="md-reloj-boton" onClick={tocar} disabled={enHora} aria-label="Recibir el año y abrir la invitación">
            <MdReloj className="md-reloj-entrada" hora={enHora ? 0 : ANTES.hora} minuto={enHora ? 0 : ANTES.minuto} />
          </button>
        )}
        {fase === "cuenta" && (
          <span key={numero} className="md-cuenta-grande" aria-live="assertive">{numero}</span>
        )}
        <div className={`md-fuegos-capa ${fase === "fuegos" ? "md-fuegos-on" : ""}`} aria-hidden="true">
          {fase === "fuegos" && <MdFuegos />}
        </div>
        <div className="md-revela" aria-hidden={fase !== "fuegos"}>
          {welcome.bienvenidaTexto && <p className="md-revela-evento">{welcome.bienvenidaTexto}</p>}
          <h1 className="md-revela-empresa" id="md-entrada-titulo">
            {[welcome.novioEl, welcome.novioElla].filter(Boolean).join(" & ")}
          </h1>
          <span className="md-revela-filete" />
          {fase === "fuegos" && (
            <button type="button" className="md-btn md-btn-linea md-revela-seguir" onClick={onAbrir}>Ver el programa</button>
          )}
        </div>
      </div>

      <div className="md-entrada-abajo">
        <button type="button" className="md-btn md-btn-oro md-tocar" onClick={tocar} disabled={enHora}>
          Toca para recibir el año
        </button>
      </div>
    </section>
  );
}

export default function Medianoche({ site, contenidoDe, invitacion, onEnviarRSVP, enEditor }) {
  useFuentes(FUENTES);
  // En el panel la entrada se salta para poder ver y editar las secciones.
  const [abierta, setAbierta] = useState(Boolean(enEditor));
  const [rsvpAbierto, setRsvpAbierto] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [aviso, setAviso] = useState("");
  const audioRef = useRef(null);
  const raiz = useAparecer(abierta, "[data-reveal]", "is-in");

  const welcome = contenidoDe("welcome");
  const info = contenidoDe("informacion_boda");
  const vestimenta = contenidoDe("vestimenta");
  const padrinos = contenidoDe("padrinos");
  const historia = contenidoDe("historia");
  const fotos = contenidoDe("fotos");
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
  const audioSrc = site.audioUrl || musica.src;
  const telefono = (info.telefonoConfirmar || "").trim();
  const digitos = telefono.replace(/\D/g, "");
  const cronograma = info.cronogramaModo === "detallado" ? (info.cronograma || []).filter((c) => c && c.titulo) : [];
  const mensajePrograma = info.cronogramaModo === "mensaje" ? info.cronogramaMensaje : "";
  const padres = [welcome.padreElPadre, welcome.padreElMadre, welcome.padreEllaPadre, welcome.padreEllaMadre].filter(Boolean);
  const grupos = (padrinos.grupos || []).filter((g) => g && (g.personas || []).some(Boolean));
  const listaFotos = [...(activo("fotos") ? fotos.urls || [] : []), ...(site.fotosSubidas || [])].filter(Boolean);
  const puntos = (importante.items || []).filter(Boolean);
  const preguntas = (faq.items || []).filter((f) => f && f.p);
  const permitidos = (vestimenta.permitidos || []).filter((p) => p && (p.nombre || (p.colores || []).length));
  const evitar = (vestimenta.evitar || []).filter((e) => e && (e.nombre || e.color));
  const enlacesRegalo = (regalos.enlaces || []).filter((e) => e && (e.url || typeof e === "string"));
  const lugar = [info.lugar, info.direccion].filter(Boolean).join(", ");

  // La música arranca con el toque que abre la invitación, nunca sola.
  function tocarEntrada() {
    if (audioRef.current && !enEditor) audioRef.current.play().then(() => setSonando(true)).catch(() => {});
  }
  function abrir() {
    setAbierta(true);
    window.scrollTo(0, 0);
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

  // Secciones visibles en orden; cada una recibe su número romano.
  const secciones = [];
  const agregar = (clave, visible) => { if (visible) secciones.push(clave); };
  agregar("cuenta", Boolean(partes));
  agregar("lugar", Boolean(info.lugar || info.direccion));
  agregar("programa", cronograma.length > 0 || Boolean(mensajePrograma));
  agregar("vestimenta", activo("vestimenta") && Boolean(vestimenta.titulo || vestimenta.nota || permitidos.length));
  agregar("anfitriones", (activo("padrinos") && grupos.length > 0) || padres.length > 0);
  agregar("historia", activo("historia") && Boolean(historia.texto));
  agregar("fotos", listaFotos.length > 0);
  agregar("regalos", activo("regalos") && Boolean(regalos.texto || regalos.datosTransferencia || enlacesRegalo.length));
  agregar("sobres", activo("sobres") && Boolean(sobres.texto));
  agregar("importante", activo("info_importante") && (puntos.length > 0 || Boolean(importante.nota)));
  agregar("faq", activo("faq") && preguntas.length > 0);
  agregar("confirmar", Boolean(confirmar));
  const num = (clave) => secciones.indexOf(clave);
  const ve = (clave) => secciones.includes(clave);

  return (
    <div className="md" ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop preload="none" />}
      {audioSrc && abierta && (
        <button className="md-musica" type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label={sonando ? "Pausar la música" : "Reproducir la música"}>
          {sonando ? Icono.pausa : Icono.musica}
          <span>{sonando ? "Pausar" : "Música"}</span>
        </button>
      )}

      {!abierta && <Entrada welcome={welcome} invitacion={invitacion} onTocar={tocarEntrada} onAbrir={abrir} />}

      {abierta && (
        <main className="md-cuerpo" aria-labelledby="md-titulo">
          <header className="md-hero">
            <MdReloj className="md-reloj-hero" segundero={false} />
            {welcome.bienvenidaTexto && <p className="md-ante">{welcome.bienvenidaTexto}</p>}
            <h1 className="md-nombre" id="md-titulo">
              {nombres[0]}
              {nombres[1] && <><span className="md-y"> &amp; </span>{nombres[1]}</>}
            </h1>
            {welcome.fraseIntro && <p className="md-frase">{welcome.fraseIntro}</p>}
            {partes && (
              <div className="md-fecha" aria-label={`${partes.semana} ${partes.dia} de ${partes.mes} de ${partes.anio}, ${partes.hora}`}>
                <span className="md-fecha-lado">{partes.semana}</span>
                <span className="md-fecha-dia">{partes.dia}</span>
                <span className="md-fecha-lado">{partes.hora}</span>
                <span className="md-fecha-mes">{partes.mes} · {partes.anio}</span>
              </div>
            )}
            {invitacion?.nombre && (
              <p className="md-hero-para">
                Para <b>{invitacion.nombre}</b>
                {pases > 0 && <span className="md-pases">{pases} {pases === 1 ? "pase" : "pases"}</span>}
              </p>
            )}
          </header>

          <div className="md-programa">
            <MdEsquina className="md-esq md-esq-ai" />
            <MdEsquina className="md-esq md-esq-ad" />
            <MdEsquina className="md-esq md-esq-bi" />
            <MdEsquina className="md-esq md-esq-bd" />
            <div className="md-cresta" aria-hidden="true"><MdAbanico /></div>
            <p className="md-programa-titulo">Programa de gala</p>

            {ve("cuenta") && (
              <section className="md-seccion" aria-labelledby="md-cuenta" data-reveal>
                <Encabezado n={num("cuenta")} titulo="Faltan" id="md-cuenta" ante="Para la medianoche" />
                {cuenta ? (
                  <div className="md-cuenta" role="timer" aria-labelledby="md-cuenta">
                    {[["dias", "días"], ["horas", "horas"], ["min", "min"], ["seg", "seg"]].map(([k, l]) => (
                      <div key={k}><span className="n">{cuenta[k]}</span><span className="l">{l}</span></div>
                    ))}
                  </div>
                ) : (
                  <p className="md-llego">¡Llegó la noche!</p>
                )}
              </section>
            )}

            {ve("lugar") && (
              <section className="md-seccion" aria-labelledby="md-lugar" data-reveal>
                <Encabezado n={num("lugar")} titulo={info.tituloSeccion && !/informaci/i.test(info.tituloSeccion) ? info.tituloSeccion : "El lugar"} id="md-lugar" ante={info.overline} />
                <p className="md-lugar">{info.lugar || info.direccion}</p>
                {info.lugar && info.direccion && <p className="md-texto">{info.direccion}</p>}
                {info.mapaEmbed && /^https:\/\//.test(info.mapaEmbed) && (
                  <div className="md-mapa"><iframe src={info.mapaEmbed} title={`Mapa de ${info.lugar || "el lugar"}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
                )}
                <div className="md-botones">
                  {info.mapsUrl && <a className="md-btn md-btn-linea" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>}
                  <button className="md-btn md-btn-linea" type="button" onClick={() => copiar(lugar, "Dirección copiada")}>{Icono.copiar} Copiar</button>
                </div>
              </section>
            )}

            {ve("programa") && (
              <section className="md-seccion" aria-labelledby="md-noche" data-reveal>
                <Encabezado n={num("programa")} titulo={info.tituloItinerario || "La noche"} id="md-noche" ante="Orden de la velada" />
                {cronograma.length > 0 ? (
                  <>
                    <div className="md-bodegon" aria-hidden="true">
                      <MdCopas className="md-bodegon-copas" />
                      <MdPlato className="md-bodegon-plato" />
                    </div>
                    <ol className="md-momentos">
                      {cronograma.map((c, i) => (
                        <li key={i}>
                          <span className="md-momento-num" aria-hidden="true">{romano(i)}</span>
                          {c.hora && <span className="md-momento-hora">{c.hora}</span>}
                          <span className="md-momento-titulo">{c.titulo}</span>
                          {c.detalle && <span className="md-momento-detalle">{c.detalle}</span>}
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <p className="md-texto">{mensajePrograma}</p>
                )}
              </section>
            )}

            {ve("vestimenta") && (
              <section className="md-seccion" aria-labelledby="md-vestimenta" data-reveal>
                <Encabezado n={num("vestimenta")} titulo="Código de vestimenta" id="md-vestimenta" />
                {vestimenta.titulo && <p className="md-etiqueta-grande">{vestimenta.titulo}</p>}
                {vestimenta.nota && <p className="md-texto">{vestimenta.nota}</p>}
                {permitidos.length > 0 && (
                  <ul className="md-paletas">
                    {permitidos.map((p, i) => (
                      <li key={i}>
                        <span className="md-muestras">{(p.colores || []).map((c, j) => <i key={j} style={{ background: c }} />)}</span>
                        {p.nombre && <span>{p.nombre}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {evitar.length > 0 && (
                  <p className="md-evitar">
                    Evitar:{" "}
                    {evitar.map((e, i) => (
                      <span key={i}>{e.color && <i style={{ background: e.color }} />}{e.nombre}{i < evitar.length - 1 ? " · " : ""}</span>
                    ))}
                  </p>
                )}
              </section>
            )}

            {ve("anfitriones") && (
              <section className="md-seccion" aria-labelledby="md-anfitriones" data-reveal>
                <Encabezado n={num("anfitriones")} titulo={padrinos.titulo || welcome.padresTexto || "Anfitriones"} id="md-anfitriones" />
                {padres.length > 0 && (
                  <div className="md-grupo">
                    {welcome.padresTexto && padrinos.titulo && <span className="md-grupo-etiqueta">{welcome.padresTexto}</span>}
                    {padres.map((p, i) => <p key={i} className="md-persona">{p}</p>)}
                  </div>
                )}
                {activo("padrinos") && grupos.map((g, i) => (
                  <div key={i} className="md-grupo">
                    {g.etiqueta && <span className="md-grupo-etiqueta">{g.etiqueta}</span>}
                    {g.personas.filter(Boolean).map((p, j) => <p key={j} className="md-persona">{p}</p>)}
                  </div>
                ))}
              </section>
            )}

            {ve("historia") && (
              <section className="md-seccion" aria-labelledby="md-historia" data-reveal>
                <Encabezado n={num("historia")} titulo={historia.titulo || "Nuestra historia"} id="md-historia" />
                <blockquote className="md-cita"><p>{historia.texto}</p></blockquote>
              </section>
            )}

            {ve("fotos") && (
              <section className="md-seccion" aria-labelledby="md-fotos" data-reveal>
                <Encabezado n={num("fotos")} titulo={fotos.titulo || "Momentos"} id="md-fotos" />
                {fotos.subtitulo && <p className="md-texto">{fotos.subtitulo}</p>}
                <div className={`md-fotos ${listaFotos.length === 1 ? "md-fotos-una" : ""}`}>
                  {listaFotos.slice(0, 6).map((src, i) => (
                    <figure key={i}><img src={src} alt={`Foto ${i + 1}`} loading="lazy" /></figure>
                  ))}
                </div>
              </section>
            )}

            {ve("regalos") && (
              <section className="md-seccion" aria-labelledby="md-regalos" data-reveal>
                <Encabezado n={num("regalos")} titulo={regalos.titulo || "Regalos"} id="md-regalos" />
                {regalos.texto && <p className="md-texto">{regalos.texto}</p>}
                {enlacesRegalo.length > 0 && (
                  <div className="md-botones">
                    {enlacesRegalo.map((e, i) => {
                      const url = typeof e === "string" ? e : e.url;
                      const texto = typeof e === "string" ? "Ver lista" : e.nombre || e.titulo || "Ver lista";
                      return <a key={i} className="md-btn md-btn-linea" href={url} target="_blank" rel="noopener noreferrer">{texto}</a>;
                    })}
                  </div>
                )}
                {regalos.datosTransferencia && (
                  <div className="md-transferir">
                    <span className="md-grupo-etiqueta">Datos para transferir</span>
                    <p>{regalos.datosTransferencia}</p>
                    <button className="md-btn md-btn-linea" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>{Icono.copiar} Copiar</button>
                  </div>
                )}
              </section>
            )}

            {ve("sobres") && (
              <section className="md-seccion" aria-labelledby="md-sobres" data-reveal>
                <Encabezado n={num("sobres")} titulo="Lluvia de sobres" id="md-sobres" />
                <p className="md-texto">{sobres.texto}</p>
              </section>
            )}

            {ve("importante") && (
              <section className="md-seccion" aria-labelledby="md-importante" data-reveal>
                <Encabezado n={num("importante")} titulo="Ten en cuenta" id="md-importante" />
                {puntos.length > 0 && (
                  <ul className="md-notas">
                    {puntos.map((p, i) => <li key={i}><span className="md-nota-icono">{iconoDe(p)}</span><span>{p}</span></li>)}
                  </ul>
                )}
                {importante.nota && <p className="md-texto md-nota-final">{importante.nota}</p>}
              </section>
            )}

            {ve("faq") && (
              <section className="md-seccion" aria-labelledby="md-faq" data-reveal>
                <Encabezado n={num("faq")} titulo="Preguntas" id="md-faq" />
                <div className="md-faq">
                  {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary>{f.r && <p>{f.r}</p>}</details>)}
                </div>
              </section>
            )}

            {ve("confirmar") && (
              <section className="md-seccion md-rsvp" aria-labelledby="md-confirmar" data-reveal>
                <Encabezado n={num("confirmar")} titulo="R. S. V. P." id="md-confirmar" ante="Tu lugar en la mesa" />
                {confirmar.href ? (
                  <a className="md-btn md-btn-oro md-confirmar" href={confirmar.href} target="_blank" rel="noopener noreferrer">
                    <span>{confirmar.texto}</span> <b>{confirmar.grande}</b>
                  </a>
                ) : (
                  <button className="md-btn md-btn-oro md-confirmar" type="button" onClick={confirmar.onClick}>{confirmar.grande}</button>
                )}
                {limite && <p className="md-limite">Confirma antes del <b>{limite}</b></p>}
              </section>
            )}
          </div>

          <footer className="md-final" data-reveal>
            <MdCopas className="md-final-copas" />
            <p className="md-final-frase">Brindemos por lo que viene</p>
            {nombres.length > 0 && <p className="md-ante">{nombres.join(" & ")}</p>}
          </footer>
        </main>
      )}

      <div className={`md-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="md-modal" role="dialog" aria-modal="true" aria-label="Confirmar asistencia" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="md-modal-caja">
            <button type="button" className="md-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">×</button>
            <MdAbanico className="md-modal-abanico" />
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
