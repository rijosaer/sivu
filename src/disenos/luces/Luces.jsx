import { useEffect, useMemo, useRef, useState } from "react";
import "./luces.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer,
} from "../comun";
import {
  LuMesaCenital, LuPlato, LuCubierto, LuGuirnalda, LuVela, LuFlores, LuPortavela, LuLlama, LuBrindis,
  LuBombillaBoton, LuBorla, Icono,
} from "./arte";

// Diseño «Luces de verano»: boda de noche cálida al aire libre, con mantel
// de lino crema, luces colgantes, velas y flores blancas.
// - Entrada: la mesa larga del banquete vista desde arriba (cenital): mantel
//   de lino, puestos con plato y cubiertos, camino de olivo y flores con
//   velas apagadas y tres guirnaldas de bombillas apagadas que la cruzan. En
//   la cabecera, el plato del invitado con su tarjeta de puesto. Un cordel
//   con borla invita a «Tira para encender»: las bombillas se prenden una a
//   una, la luz pasa de fría a cálida, se encienden las velas y la carta de
//   la cena se posa en la mesa con los nombres y «Tomar asiento».
// - Cuerpo: claro, sobre lino. Cada sección es una tarjeta de mesa doblada
//   (place card) que se posa con un destello de bombilla; los títulos van en
//   caligrafía de menú con un filete de luces; la cuenta regresiva son cuatro
//   velas que se consumen; el programa es un «menú de cena»; cierra con un
//   brindis de copas bajo la guirnalda.
// Colores del tema: principal = ámbar, claro = ámbar claro, oscuro = ámbar
// tostado, papel = lino crema, mármol = cartulina de las tarjetas, sello =
// azul crepúsculo (velo frío de la entrada). Todo el color de marca sale del
// tema.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Gloock&family=Petit+Formal+Script&family=Raleway:wght@300;400;500;600&display=swap";

const TIEMPOS = ["Primer", "Segundo", "Tercer", "Cuarto", "Quinto", "Sexto", "Séptimo", "Octavo", "Noveno", "Décimo"];

const reducido = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Título de sección: caligrafía de carta de cena con un filete de bombillas
// que se encienden cuando la tarjeta se posa.
function Titulo({ id, sobre, children }) {
  return (
    <>
      <h2 className="lu-h2" id={id}>{children}</h2>
      <div className="lu-filete-luces" aria-hidden="true"><LuGuirnalda n={5} ancho={140} alto={5} r={2.6} /></div>
      {sobre && <p className="lu-sobre">{sobre}</p>}
    </>
  );
}

// Tarjeta de mesa doblada: cara de cartulina con la sombra del pliegue arriba,
// sombra de contacto sobre el mantel, una vela encendida a un lado y el
// destello de bombilla que salta cuando se posa.
function Tarjeta({ titulo, sobre, id, vela = "der", inclina = 0, className = "", children }) {
  return (
    <section className={`lu-tarjeta ${className}`} style={{ "--inclina": `${inclina}deg` }} aria-labelledby={titulo ? id : undefined} data-reveal>
      <div className="lu-tarjeta-cara">
        <span className="lu-destello" aria-hidden="true" />
        {vela && <span className={`lu-tarjeta-brillo lu-brillo-${vela}`} aria-hidden="true" />}
        {titulo && <Titulo id={id} sobre={sobre}>{titulo}</Titulo>}
        {children}
      </div>
      {vela && <LuVela className={`lu-tarjeta-vela lu-vela-${vela}`} />}
    </section>
  );
}

function Separador() {
  return (
    <div className="lu-separador" data-reveal aria-hidden="true">
      <LuGuirnalda n={9} alto={26} r={5.5} />
    </div>
  );
}

// El puesto del invitado: plato visto desde arriba con su tarjeta de puesto
// doblada encima y, debajo, un cubierto por cada pase.
function Puesto({ nombre, pases, className = "" }) {
  return (
    <div className={`lu-puesto ${className}`}>
      <div className="lu-puesto-mesa">
        <LuPlato className="lu-puesto-plato" />
        {nombre && (
          <div className="lu-place">
            <span className="lu-place-dorso" aria-hidden="true" />
            <div className="lu-place-cara">
              <p className="lu-place-nombre">{nombre}</p>
            </div>
          </div>
        )}
      </div>
      {nombre && pases > 0 && (
        <p className="lu-cubiertos">
          <span className="lu-cubiertos-fila" aria-hidden="true">
            {Array.from({ length: Math.min(pases, 6) }, (_, i) => <LuCubierto key={i} />)}
          </span>
          <span>{pases} {pases === 1 ? "puesto" : "puestos"} en nuestra mesa</span>
        </p>
      )}
    </div>
  );
}

// Cuenta regresiva: cuatro velas en candeleros de latón que se consumen
// (días sobre un año, horas sobre 24, minutos y segundos sobre 60).
const VELAS = [["dias", "días", 365], ["horas", "horas", 24], ["min", "minutos", 60], ["seg", "segundos", 60]];
function CuentaVelas({ cuenta }) {
  return (
    <div className="lu-velas" role="timer" aria-labelledby="lu-cuenta">
      {VELAS.map(([k, l, max]) => {
        const f = Math.max(0.1, Math.min(1, Number(cuenta[k]) / max));
        return (
          <div key={k} className={`lu-vc lu-vc-${k}`} style={{ "--f": f.toFixed(3) }}>
            <div className="lu-vc-cuerpo">
              <LuLlama className="lu-vc-llama" />
              <span className="lu-vc-cera" />
            </div>
            <LuPortavela className="lu-vc-base" />
            <span className="lu-vc-n">{cuenta[k]}</span>
            <span className="lu-vc-l">{l}</span>
          </div>
        );
      })}
    </div>
  );
}

// Entrada: la mesa vista desde arriba, con guirnaldas apagadas y el cordel.
function Entrada({ welcome, partes, invitacion, onTirar, onEntrar }) {
  // fase 0: luz fría, esperando el tirón · 1: encendiendo · 2: carta y «Tomar asiento».
  const [fase, setFase] = useState(0);
  const pases = pasesDe(invitacion);
  const nombres = [welcome.novioEl, welcome.novioElla].filter(Boolean);
  useEffect(() => {
    if (fase !== 1) return;
    const t = setTimeout(() => setFase(2), reducido() ? 50 : 3300);
    return () => clearTimeout(t);
  }, [fase]);

  function tirar() {
    if (fase) return;
    setFase(1);
    onTirar();
  }

  return (
    <section className={`lu-entrada ${fase ? "lu-luces-on" : ""} ${fase === 2 ? "lu-entrar-listo" : ""}`} aria-label="Abrir invitación">
      <div className="lu-escena">
        <LuMesaCenital />
        <Puesto nombre={invitacion?.nombre} pases={pases} className="lu-puesto-cabecera" />
        <div className="lu-carta" aria-hidden={fase !== 2}>
          {welcome.bienvenidaTexto && <p className="lu-carta-sobre">{welcome.bienvenidaTexto}</p>}
          <h1 className="lu-carta-h1">
            {nombres[0]}
            {nombres[1] && <><span className="lu-y">&amp;</span>{nombres[1]}</>}
          </h1>
          <div className="lu-filete-luces" aria-hidden="true"><LuGuirnalda n={5} ancho={140} alto={5} r={2.6} /></div>
          {partes && <p className="lu-carta-fecha">{partes.dia} · {partes.mes} · {partes.anio}</p>}
          <button type="button" className="lu-asiento" onClick={onEntrar} tabIndex={fase === 2 ? 0 : -1}>Tomar asiento</button>
        </div>
      </div>

      <button type="button" className={`lu-cordel ${fase ? "is-tirado" : ""}`} onClick={tirar} aria-label="Tira del cordel para encender las luces" disabled={fase > 0}>
        <span className="lu-cordel-hilo" aria-hidden="true" />
        <LuBorla />
      </button>
      <p className={`lu-tira ${fase ? "is-oculto" : ""}`} aria-hidden="true">
        <span>Tira para encender</span>
        <svg viewBox="0 0 40 16" aria-hidden="true"><path d="M2 8 C 12 2 22 14 34 8 M28 3 L35 8 L28 13" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </p>
    </section>
  );
}

export default function Luces({ site, contenidoDe, invitacion, onEnviarRSVP, enEditor }) {
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
  const audioSrc = site.audioUrl || musica.src;
  const telefono = (info.telefonoConfirmar || "").trim();
  const digitos = telefono.replace(/\D/g, "");
  const cronograma = info.cronogramaModo === "detallado" ? (info.cronograma || []).filter((c) => c && (c.titulo || c.hora)) : [];
  const mensajePrograma = info.cronogramaModo === "mensaje" && info.cronogramaMensaje;

  const padresEl = [welcome.padreElPadre, welcome.padreElMadre].filter(Boolean);
  const padresElla = [welcome.padreEllaPadre, welcome.padreEllaMadre].filter(Boolean);
  const hayPadres = padresEl.length > 0 || padresElla.length > 0;
  const grupos = activo("padrinos") ? (padrinos.grupos || []).filter((g) => g && (g.personas || []).some(Boolean)) : [];
  const fotos = [
    ...(activo("fotos") ? fotosSec.urls || [] : []),
    ...(site.fotosSubidas || []),
  ].filter(Boolean);
  const permitidos = (vestimenta.permitidos || []).filter((p) => p && p.nombre);
  const evitar = (vestimenta.evitar || []).filter((p) => p && p.nombre);
  const enlaces = (regalos.enlaces || []).filter((e) => e?.url);
  const hayRegalos = activo("regalos") && (regalos.texto || regalos.datosTransferencia || enlaces.length > 0);
  const haySobres = activo("sobres") && sobres.texto;
  const puntos = (importante.items || []).filter(Boolean);
  const preguntas = (faq.items || []).filter((f) => f && f.p);

  // La música arranca con el tirón del cordel (primer toque), nunca sola.
  function arrancarMusica() {
    if (enEditor) return;
    audioRef.current?.play().then(() => setSonando(true)).catch(() => {});
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

  return (
    <div className="lu" ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop />}
      {audioSrc && abierta && (
        <button className="lu-musica" type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label={sonando ? "Pausar la música" : "Encender la música"}>
          <LuBombillaBoton />
        </button>
      )}

      {!abierta && (
        <Entrada welcome={welcome} partes={partes} invitacion={invitacion} onTirar={arrancarMusica} onEntrar={abrir} />
      )}

      {abierta && (
        <main className="lu-cuerpo">
          <header className="lu-hero" data-reveal>
            <div className="lu-hero-luces" aria-hidden="true"><LuGuirnalda n={11} alto={40} r={6} /></div>
            <LuFlores className="lu-hero-flores" />
            {welcome.bienvenidaTexto && <p className="lu-etiqueta">{welcome.bienvenidaTexto}</p>}
            <h1 className="lu-nombres">
              {nombres[0]}
              {nombres[1] && <><span className="lu-y">&amp;</span>{nombres[1]}</>}
            </h1>
            {partes && (
              <p className="lu-hero-fecha">
                <span>{partes.semana}</span>
                <b>{partes.dia}</b>
                <span>{partes.mes} · {partes.anio}</span>
              </p>
            )}
            {welcome.fraseIntro && <p className="lu-frase">{welcome.fraseIntro}</p>}
          </header>

          {/* La primera tarjeta es la del invitado: su lugar en la mesa. */}
          {invitacion?.nombre && (
            <section className="lu-puesto-sec" aria-label={`Puesto de ${invitacion.nombre}`} data-reveal>
              <span className="lu-destello" aria-hidden="true" />
              <Puesto nombre={invitacion.nombre} pases={pases} />
            </section>
          )}

          {partes && (
            <section className="lu-cuenta-sec" aria-labelledby="lu-cuenta" data-reveal>
              <Titulo id="lu-cuenta" sobre={cuenta ? "para encender las velas de la cena" : null}>{cuenta ? "Faltan" : "¡Llegó el gran día!"}</Titulo>
              {cuenta && <CuentaVelas cuenta={cuenta} />}
            </section>
          )}

          <Separador />

          {(partes || info.lugar) && (
            <Tarjeta sobre={info.overline} titulo={info.tituloSeccion || "La celebración"} id="lu-lugar" vela="izq" inclina={-0.5}>
              {partes && (
                <p className="lu-cuando">
                  <span className="lu-cuando-sem">{partes.semana}</span>
                  <span className="lu-cuando-dia">{partes.dia} de {partes.mes}</span>
                  <span className="lu-cuando-hora">{partes.hora}</span>
                </p>
              )}
              {info.lugar && <p className="lu-lugar-titulo">{info.lugar}</p>}
              {info.direccion && <p className="lu-texto">{info.direccion}</p>}
              {info.mapaEmbed && /^https:\/\//.test(info.mapaEmbed) && (
                <iframe className="lu-mapa" src={info.mapaEmbed} title={`Mapa de ${info.lugar || "el lugar"}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
              )}
              {(info.mapsUrl || info.direccion) && (
                <div className="lu-botones">
                  {info.mapsUrl && <a className="lu-btn" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>}
                  {info.direccion && (
                    <button className="lu-btn lu-btn-linea" type="button" onClick={() => copiar([info.lugar, info.direccion].filter(Boolean).join(", "), "Dirección copiada")}>
                      {Icono.copiar} Copiar
                    </button>
                  )}
                </div>
              )}
            </Tarjeta>
          )}

          {cronograma.length > 0 && (
            <section className="lu-menu-mesa" aria-labelledby="lu-menu" data-reveal>
              <LuVela className="lu-menu-vela lu-menu-vela-izq" />
              <div className="lu-menu">
                <LuFlores className="lu-menu-flores" />
                <p className="lu-etiqueta">{nombres.join(" & ")}</p>
                <Titulo id="lu-menu">{info.tituloItinerario || "Menú de la noche"}</Titulo>
                <ol className="lu-menu-lista">
                  {cronograma.map((c, i) => (
                    <li key={i} style={{ "--d": `${i * 90}ms` }}>
                      <span className="lu-tiempo">{TIEMPOS[i] ? `${TIEMPOS[i]} tiempo` : `Tiempo ${i + 1}`}{c.hora && <> · {c.hora}</>}</span>
                      {c.titulo && <b>{c.titulo}</b>}
                    </li>
                  ))}
                </ol>
                <p className="lu-menu-pie">¡Buen provecho!</p>
              </div>
              <LuVela className="lu-menu-vela lu-menu-vela-der" />
            </section>
          )}

          {mensajePrograma && (
            <Tarjeta titulo={info.tituloItinerario || "Programa"} id="lu-programa" vela="der">
              <p className="lu-texto">{info.cronogramaMensaje}</p>
            </Tarjeta>
          )}

          {activo("vestimenta") && (vestimenta.titulo || vestimenta.nota) && (
            <Tarjeta sobre="código de vestimenta" titulo={vestimenta.titulo || "Vestimenta"} id="lu-vestimenta" vela="der" inclina={0.7}>
              {vestimenta.nota && <p className="lu-texto">{vestimenta.nota}</p>}
              {permitidos.length > 0 && (
                <div className="lu-paletas">
                  {permitidos.map((p, i) => (
                    <div key={i} className="lu-paleta">
                      <span className="lu-muestras">
                        {(p.colores || []).map((c, j) => <i key={j} style={{ background: c }} />)}
                      </span>
                      <span className="lu-paleta-nombre">{p.nombre}</span>
                    </div>
                  ))}
                </div>
              )}
              {evitar.length > 0 && (
                <div className="lu-evitar">
                  <span className="lu-mini">Te pedimos evitar</span>
                  <div>
                    {evitar.map((e, i) => (
                      <span key={i} className="lu-evitar-item"><i style={{ background: e.color }} />{e.nombre}</span>
                    ))}
                  </div>
                </div>
              )}
            </Tarjeta>
          )}

          {(hayPadres || grupos.length > 0) && <Separador />}

          {hayPadres && (
            <Tarjeta titulo="Nuestros padres" sobre={welcome.padresTexto || "Con la bendición de nuestros padres"} id="lu-padres" vela="izq" inclina={-0.6} className="lu-padres">
              <div className="lu-dos">
                {padresEl.length > 0 && <div>{padresEl.map((n) => <p key={n}>{n}</p>)}</div>}
                {padresElla.length > 0 && <div>{padresElla.map((n) => <p key={n}>{n}</p>)}</div>}
              </div>
            </Tarjeta>
          )}

          {grupos.length > 0 && (
            <Tarjeta sobre="nos acompañan" titulo={padrinos.titulo || "Padrinos"} id="lu-padrinos" vela="der" inclina={0.5}>
              <div className="lu-grupos">
                {grupos.map((g, i) => (
                  <div key={i} className="lu-grupo">
                    {g.etiqueta && <span className="lu-mini">{g.etiqueta}</span>}
                    <p>{g.personas.filter(Boolean).join(" & ")}</p>
                  </div>
                ))}
              </div>
            </Tarjeta>
          )}

          {activo("historia") && historia.texto && (
            <Tarjeta sobre="para la sobremesa" titulo={historia.titulo || "Nuestra historia"} id="lu-historia" vela="izq" inclina={-0.4}>
              <p className="lu-historia">{historia.texto}</p>
              {nombres.length > 0 && <p className="lu-firma">{nombres.map((n) => n.split(" ")[0]).join(" & ")}</p>}
            </Tarjeta>
          )}

          {fotos.length > 0 && (
            <section className="lu-fotos" aria-labelledby="lu-fotos" data-reveal>
              <Titulo id="lu-fotos" sobre={fotosSec.subtitulo}>{fotosSec.titulo || "Momentos"}</Titulo>
              <div className="lu-fotos-mesa">
                {fotos.slice(0, 6).map((f, i) => (
                  <figure key={f + i} className="lu-foto" style={{ "--inclina": `${[-3, 2.5, -1.5, 3, -2, 1.5][i]}deg` }}>
                    <img src={f} alt={`Foto ${i + 1} de ${nombres.join(" y ")}`} loading="lazy" />
                  </figure>
                ))}
              </div>
            </section>
          )}

          {(hayRegalos || haySobres) && <Separador />}

          {(hayRegalos || haySobres) && (
            <Tarjeta titulo={(hayRegalos && regalos.titulo) || "Regalos"} id="lu-regalos" vela="der" inclina={0.6}>
              {hayRegalos && regalos.texto && <p className="lu-texto">{regalos.texto}</p>}
              {hayRegalos && regalos.datosTransferencia && (
                <div className="lu-transferir">
                  <span className="lu-mini">Datos para transferir</span>
                  <p>{regalos.datosTransferencia}</p>
                  <button className="lu-btn lu-btn-linea" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>{Icono.copiar} Copiar</button>
                </div>
              )}
              {hayRegalos && enlaces.length > 0 && (
                <div className="lu-botones">
                  {enlaces.map((e, i) => <a key={i} className="lu-btn lu-btn-linea" href={e.url} target="_blank" rel="noopener noreferrer">{e.tienda || e.nombre || "Ver lista"}</a>)}
                </div>
              )}
              {haySobres && (
                <p className="lu-sobres"><span aria-hidden="true">{Icono.sobre}</span><span><b>Lluvia de sobres.</b> {sobres.texto}</span></p>
              )}
            </Tarjeta>
          )}

          {activo("info_importante") && (puntos.length > 0 || importante.nota) && (
            <Tarjeta sobre="antes de la cena" titulo="Ten en cuenta" id="lu-info" vela="izq" inclina={-0.5}>
              {importante.nota && <p className="lu-texto">{importante.nota}</p>}
              {puntos.length > 0 && <ul className="lu-lista">{puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>}
            </Tarjeta>
          )}

          {activo("faq") && preguntas.length > 0 && (
            <Tarjeta titulo="Preguntas frecuentes" id="lu-faq" vela="der" inclina={0.4}>
              <div className="lu-faq">
                {preguntas.map((f, i) => (
                  <details key={i}>
                    <summary>{f.p}</summary>
                    {f.r && <p>{f.r}</p>}
                  </details>
                ))}
              </div>
            </Tarjeta>
          )}

          {confirmar && <Separador />}

          {confirmar && (
            <Tarjeta titulo="¿Nos acompañas?" id="lu-confirmar" vela="izq" className="lu-rsvp">
              {confirmar.href ? (
                <a className="lu-btn lu-btn-grande" href={confirmar.href} target="_blank" rel="noopener noreferrer">
                  {Icono.whatsapp}<span>{confirmar.texto} <b>{confirmar.grande}</b></span>
                </a>
              ) : (
                <button className="lu-btn lu-btn-grande" type="button" onClick={confirmar.onClick}>{confirmar.grande}</button>
              )}
              {limite && <p className="lu-limite">Confirma antes del <b>{limite}</b></p>}
            </Tarjeta>
          )}

          <footer className="lu-final" data-reveal>
            <div className="lu-final-luces" aria-hidden="true"><LuGuirnalda n={12} alto={34} r={5} /></div>
            <LuBrindis />
            <p className="lu-te-esperamos">¡Salud por el amor!</p>
            <p className="lu-final-sub">Te esperamos en la mesa</p>
            {nombres.length > 0 && <p className="lu-etiqueta">{nombres.join(" & ")}</p>}
          </footer>
        </main>
      )}

      <div className={`lu-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="lu-modal" role="dialog" aria-modal="true" aria-label="Confirmar asistencia" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="lu-modal-carta">
            <span className="lu-modal-dorso" aria-hidden="true" />
            <div className="lu-modal-caja">
            <button type="button" className="lu-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5 L15 15 M15 5 L5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
            <div className="lu-modal-cabeza is-in">
              <p className="lu-modal-guion">Guardamos tu lugar</p>
              <div className="lu-filete-luces" aria-hidden="true"><LuGuirnalda n={7} ancho={180} alto={6} r={2.8} /></div>
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
