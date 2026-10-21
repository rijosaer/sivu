import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./cuento.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer,
} from "../comun";

// Motor de los diseños «de cuento» (Cielito, Capillita, Cometas, Bosquecito):
// invitaciones pintadas a mano donde toda la página es un solo dibujo.
// - Entrada: la escena de portada está hecha por capas (una placa limpia de
//   fondo, el personaje y lo que queda cerca de la cámara). Al cargar, sin
//   que haya que tocar nada, la cámara hace el recorrido propio de cada
//   diseño entre esas capas y termina en el encuadre completo. Mientras
//   arranca se ve a quién va la invitación y sus pases.
// - Cuerpo: un fondo pintado continuo (cielo, pared, bosque…) corre de arriba
//   abajo y el texto va encima, sin tarjetas. Solo los capítulos clave llevan
//   el soporte pintado del título (cinta, azulejo, banderín, letrero); los
//   demás van con letras y un trazo, para que no se repita. Cada escena y
//   cada adorno aparece una sola vez.
// Cada diseño entrega su configuración (arte, recorrido, textos) y su CSS con
// la clase raíz `cu-<clave>`. Todo el color sale del tema.

const suave = (t) => t * t * (3 - 2 * t);

function camaraEn(viaje, seg) {
  if (seg <= viaje[0].t) return viaje[0];
  for (let i = 1; i < viaje.length; i++) {
    const a = viaje[i - 1], b = viaje[i];
    if (seg <= b.t) {
      const t = suave((seg - a.t) / (b.t - a.t || 1));
      const m = (a.m ?? 1) + ((b.m ?? 1) - (a.m ?? 1)) * t;
      return { fx: a.fx + (b.fx - a.fx) * t, fy: a.fy + (b.fy - a.fy) * t, z: a.z + (b.z - a.z) * t, m };
    }
  }
  return viaje[viaje.length - 1];
}

// Borde de viñeta pintada a mano: rectángulo redondeado de filo irregular.
function bordePintado() {
  const pts = [];
  const n = 64;
  const ruido = (i) => Math.sin(i * 1.7) * 0.55 + Math.sin(i * 4.3 + 1) * 0.35 + Math.sin(i * 9.1 + 2) * 0.2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const cx = Math.cos(a), cy = Math.sin(a);
    const x = Math.sign(cx) * Math.pow(Math.abs(cx), 0.25) * 46.5;
    const y = Math.sign(cy) * Math.pow(Math.abs(cy), 0.25) * 46.5;
    const d = 1 + ruido(i) * 0.012;
    pts.push([50 + x * d, 50 + y * d]);
  }
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ") + "Z";
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${path}' fill='black'/></svg>`)}")`;
}

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
const Icono = {
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  regalo: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="3.5" y="9" width="17" height="11.5" rx="1.5" /><path d="M2.5 9h19M12 9v11.5M12 9c-1.5-3.5-6-4.5-6-1.8C6 8.8 9 9 12 9zm0 0c1.5-3.5 6-4.5 6-1.8C18 8.8 15 9 12 9z" /></svg>,
  whatsapp: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-1.9-1-.9.8a4 4 0 0 1-2.3-2.3l.8-.9-1-1.9z" /></svg>,
  cerrar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>,
  nota: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.5V6l10-2v11.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><ellipse cx="6.6" cy="17.6" rx="2.6" ry="2" fill="currentColor" /><ellipse cx="16.6" cy="15.6" rx="2.6" ry="2" fill="currentColor" /></svg>,
};

// Florecita: viñeta de listas y paradas del programa (cada diseño la tiñe).
function Flor() {
  return (
    <svg className="cu-flor" viewBox="0 0 24 24" aria-hidden="true">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((g) => (
        <ellipse key={g} cx="12" cy="6.2" rx="2.6" ry="4.6" transform={`rotate(${g} 12 12)`} className="cu-flor-petalo" />
      ))}
      <circle cx="12" cy="12" r="3.1" className="cu-flor-centro" />
    </svg>
  );
}

// Título de capítulo. Con soporte: va escrito sobre la pieza pintada del
// diseño (cinta, azulejo, banderín, letrero). Sin soporte: letras y un trazo.
function Titulo({ id, titulo, soporte }) {
  if (soporte) {
    return (
      <div className="cu-soporte">
        <img src={soporte} alt="" aria-hidden="true" loading="lazy" decoding="async" />
        <h2 className="cu-h2 cu-h2-soporte" id={id} style={{ "--largo": Math.max(titulo.length, 8) }}>{titulo}</h2>
      </div>
    );
  }
  return <h2 className="cu-h2 cu-h2-libre" id={id}>{titulo}</h2>;
}

function Capitulo({ id, ante, titulo, soporte, escena, escenaClase = "", escenaAbajo, adornos = [], children }) {
  return (
    <section className={`cu-capitulo cu-cap-${id}`} aria-labelledby={`cu-${id}`} data-reveal>
      {adornos.map((a, i) => (
        <img key={i} className={`cu-adorno ${a.clase}`} src={a.src} alt="" aria-hidden="true" loading="lazy" decoding="async" />
      ))}
      {escena && !escenaAbajo && <img className={`cu-escena ${escenaClase}`} src={escena} alt="" aria-hidden="true" loading="lazy" decoding="async" />}
      {ante && <p className="cu-ante">{ante}</p>}
      <Titulo id={`cu-${id}`} titulo={titulo} soporte={soporte} />
      <div className="cu-letras">{children}</div>
      {escena && escenaAbajo && <img className={`cu-escena ${escenaClase}`} src={escena} alt="" aria-hidden="true" loading="lazy" decoding="async" />}
    </section>
  );
}

// En los soportes caben títulos cortos; si el del cliente es largo, va el corto.
const corto = (t, porDefecto) => (t && t.length <= 18 ? t : porDefecto);

function urlDelMapa(valor) {
  if (!valor) return "";
  const texto = String(valor).trim();
  const conSrc = texto.match(/src\s*=\s*["']([^"']+)["']/i);
  const url = conSrc ? conSrc[1] : texto;
  return /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(url) ? url : "";
}

// Portada: la escena por capas y el recorrido de la cámara al cargar.
function Portada({ config, welcome, partes, invitacion, estado, onTerminar }) {
  const { escena } = config;
  const raiz = useRef(null);
  const escenario = useRef(null);
  const capas = useRef([]);
  const reloj = useRef(null);
  const pases = pasesDe(invitacion);
  const mascara = useMemo(() => (escena.vineta ? bordePintado() : null), [escena.vineta]);
  const nombre = welcome.novioEl || "";
  const final = escena.viaje[escena.viaje.length - 1];

  const pintar = useCallback((cam) => {
    const caja = raiz.current;
    if (!caja) return;
    const vw = caja.clientWidth, vh = caja.clientHeight;
    const s0 = Math.max(vw / escena.w, vh / escena.h);
    const dw = escena.w * s0, dh = escena.h * s0;
    escena.capas.forEach(({ k }, i) => {
      const img = capas.current[i];
      if (!img) return;
      let z = Math.max(0.6, 1 + (cam.z - 1) * k);
      const fx = 0.5 + (cam.fx - 0.5) * k, fy = 0.5 + (cam.fy - 0.5) * k;
      let tx = vw / 2 - z * fx * dw, ty = vh / 2 - z * fy * dh;
      if (i === 0) {   // el fondo siempre cubre el cuadro
        z = Math.max(z, 1);
        tx = Math.min(0, Math.max(vw - z * dw, vw / 2 - z * fx * dw));
        ty = Math.min(0, Math.max(vh - z * dh, vh / 2 - z * fy * dh));
      }
      img.style.width = `${dw}px`;
      img.style.height = `${dh}px`;
      img.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${z.toFixed(4)})`;
      if (i === escena.capas.length - 1) img.style.filter = z > 1.3 ? `blur(${Math.min(5, (z - 1.3) * 6).toFixed(1)}px)` : "";
    });
    const esc = escenario.current;
    if (esc && mascara) {
      // Viñeta pintada sobre papel que crece hasta llenar la pantalla.
      const m = cam.m ?? 1;
      esc.style.transform = `scale(${(0.7 + 0.3 * suave(Math.min(1, m))).toFixed(4)})`;
      const ancho = 100 + 60 * m, alto = 62 + 98 * m;
      esc.style.webkitMaskSize = esc.style.maskSize = `${ancho}% ${alto}%`;
      esc.style.webkitMaskImage = esc.style.maskImage = m < 0.999 ? mascara : "none";
    }
  }, [escena, mascara]);

  useLayoutEffect(() => {
    pintar(estado === "viajando" ? escena.viaje[0] : final);
    const alCambiar = () => { if (estado !== "viajando") pintar(final); };
    addEventListener("resize", alCambiar);
    return () => removeEventListener("resize", alCambiar);
  }, [estado, pintar, escena.viaje, final]);

  useEffect(() => {
    if (estado !== "viajando") return undefined;
    let inicio = null;
    const duracion = final.t;
    const paso = (ahora) => {
      if (inicio === null) inicio = ahora;
      const seg = (ahora - inicio) / 1000;
      pintar(camaraEn(escena.viaje, seg));
      if (seg < duracion) reloj.current = requestAnimationFrame(paso);
      else onTerminar();
    };
    reloj.current = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(reloj.current);
  }, [estado, pintar, onTerminar, escena.viaje, final.t]);

  return (
    <section ref={raiz} className={`cu-portada cu-${estado}`} aria-labelledby="cu-portada-nombre">
      <div className="cu-escenario" ref={escenario}>
        {escena.capas.map((c, i) => (
          <div key={c.clase} className={`cu-capa ${c.clase}`}>
            <img ref={(el) => { capas.current[i] = el; }} src={c.src} alt={c.alt ? c.alt(nombre) : ""} draggable="false" decoding="async" />
          </div>
        ))}
      </div>

      {invitacion?.nombre && (
        <div className="cu-invitado" aria-hidden={estado === "abierta"}>
          <p className="cu-invitado-ante">Invitación especial para</p>
          <p className="cu-invitado-nombre">{invitacion.nombre}</p>
          {pases > 0 && <p className="cu-pases">{pases === 1 ? "1 pase reservado" : `${pases} pases reservados`}</p>}
        </div>
      )}

      <div className="cu-portada-texto">
        <p className="cu-portada-ante">{welcome.bienvenidaTexto || config.textos.portada}</p>
        <h1 className="cu-portada-nombre" id="cu-portada-nombre">{nombre}</h1>
        {partes && (
          <p className="cu-portada-fecha">
            <span>{partes.semana}</span>
            <b>{partes.dia} de {partes.mes}</b>
            <span>{partes.anio}</span>
          </p>
        )}
        {invitacion?.nombre && (
          <p className="cu-portada-para">
            Para <b>{invitacion.nombre}</b>{pases > 0 && <> · {pases === 1 ? "1 pase" : `${pases} pases`}</>}
          </p>
        )}
      </div>
      {estado === "abierta" && <p className="cu-desliza" aria-hidden="true">Desliza<i /></p>}
    </section>
  );
}

export default function Cuento({ config, site, contenidoDe, invitacion, onEnviarRSVP, enEditor }) {
  useFuentes(config.fuentes);
  const quieto = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  // La entrada arranca sola; en el panel o con movimiento reducido ya está abierta.
  const [estado, setEstado] = useState(enEditor || quieto ? "abierta" : "viajando");
  const [rsvpAbierto, setRsvpAbierto] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [aviso, setAviso] = useState("");
  const audioRef = useRef(null);
  const abierta = estado === "abierta";
  const raiz = useAparecer(abierta, "[data-reveal]", "is-in");
  const { piezas, textos } = config;
  const conSoporte = (seccion) => (config.soporteEn.includes(seccion) ? config.soporte : null);
  const adornos = (seccion) => config.adornos[seccion] || [];

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
  const nombre = welcome.novioEl || "";
  const audioSrc = site.audioUrl || musica.src;
  const telefono = (info.telefonoConfirmar || "").trim();
  const digitos = telefono.replace(/\D/g, "");
  const cronograma = info.cronogramaModo === "detallado" ? (info.cronograma || []).filter((c) => c && (c.hora || c.titulo)) : [];
  const mensajePrograma = info.cronogramaModo === "mensaje" ? (info.cronogramaMensaje || "").trim() : "";
  const padres = [welcome.padreElPadre, welcome.padreElMadre].filter(Boolean);
  const grupos = (padrinos.grupos || []).filter((g) => g && (g.personas || []).some(Boolean));
  const permitidos = (vestimenta.permitidos || []).filter((p) => p && (p.nombre || (p.colores || []).length));
  const evitar = (vestimenta.evitar || []).filter((e) => e && (e.nombre || e.color));
  const fotos = [...(site.fotosSubidas || []), ...(activo("fotos") ? fotosSec.urls || [] : [])].filter(Boolean);
  const enlaces = (regalos.enlaces || []).filter((e) => e?.url);
  const puntos = (importante.items || []).filter(Boolean);
  const preguntas = (faq.items || []).filter((f) => f && f.p);
  const mapa = urlDelMapa(info.mapaEmbed);
  const hayRegalo = (activo("sobres") && sobres.texto) || (activo("regalos") && (regalos.texto || enlaces.length > 0 || regalos.datosTransferencia));
  const hayBienvenida = welcome.fraseIntro || padres.length > 0 || welcome.versiculo;

  const terminar = useCallback(() => setEstado("abierta"), []);

  // La música no puede sonar sola: arranca con el primer toque en la página.
  useEffect(() => {
    if (!audioSrc || enEditor) return undefined;
    const primerToque = () => {
      const a = audioRef.current;
      if (a && a.paused) a.play().then(() => setSonando(true)).catch(() => {});
    };
    addEventListener("pointerdown", primerToque, { once: true });
    return () => removeEventListener("pointerdown", primerToque);
  }, [audioSrc, enEditor]);

  function alternarMusica(e) {
    e.stopPropagation();
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

  useEffect(() => {
    if (!rsvpAbierto) return undefined;
    const alTecla = (e) => e.key === "Escape" && setRsvpAbierto(false);
    addEventListener("keydown", alTecla);
    return () => removeEventListener("keydown", alTecla);
  }, [rsvpAbierto]);

  const confirmar = invitacion
    ? { grande: "Confirmar asistencia", onClick: () => setRsvpAbierto(true) }
    : digitos
      ? { texto: "Favor confirmar al", grande: telefono, href: `https://wa.me/${digitos.length === 10 ? `57${digitos}` : digitos}` }
      : null;

  return (
    <div className={`cu cu-${config.clave} ${abierta ? "cu-esta-abierta" : ""}`} ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop />}
      {audioSrc && (
        <button className={`cu-musica ${sonando ? "cu-sonando" : ""}`} type="button" aria-pressed={sonando} onClick={alternarMusica} aria-label={sonando ? "Pausar música" : "Reproducir música"}>
          {Icono.nota}
          <span className="cu-musica-notas" aria-hidden="true"><i /><i /><i /></span>
        </button>
      )}

      <Portada config={config} welcome={welcome} partes={partes} invitacion={invitacion} estado={estado} onTerminar={terminar} />

      <main className="cu-cuerpo">
        {config.union
          ? <div className="cu-union" aria-hidden="true"><img src={config.union} alt="" /></div>
          : <div className="cu-union cu-union-suave" aria-hidden="true" />}

        {hayBienvenida && (
          <Capitulo id="bienvenida" ante={textos.anteBienvenida} titulo={textos.bienvenida} soporte={conSoporte("bienvenida")}
            escena={piezas.bienvenida} escenaClase="cu-escena-bienvenida" adornos={adornos("bienvenida")}>
            {padres.length > 0 && (
              <>
                <p className="cu-etiqueta">{nombre ? `${nombre}, ${welcome.padresTexto || textos.hijoDe}` : welcome.padresTexto || textos.hijoDe}</p>
                <p className="cu-padres">{padres.join(" y ")}</p>
              </>
            )}
            {welcome.fraseIntro && <p className="cu-texto">{welcome.fraseIntro}</p>}
            {welcome.versiculo && (
              <blockquote className="cu-versiculo">
                <p>«{welcome.versiculo}»</p>
                {welcome.versiculoCita && <cite>{welcome.versiculoCita}</cite>}
              </blockquote>
            )}
          </Capitulo>
        )}

        {partes && (
          <Capitulo id="cuenta" ante={`${partes.semana} ${partes.dia} de ${partes.mes}`} titulo={cuenta ? "Faltan" : "¡Llegó el día!"}
            soporte={conSoporte("cuenta")} adornos={adornos("cuenta")}>
            {cuenta && (
              <div className="cu-cuenta" role="timer" aria-labelledby="cu-cuenta">
                {[["dias", "días"], ["horas", "horas"], ["min", "min"], ["seg", "seg"]].map(([k, l], i) => (
                  <div key={k} className="cu-cuenta-pieza" style={{ "--i": i }}>
                    <img src={config.cuenta[i]} alt="" aria-hidden="true" />
                    <span className={`n ${String(cuenta[k]).length > 2 ? "n-largo" : ""}`}>{cuenta[k]}</span>
                    <span className="l">{l}</span>
                  </div>
                ))}
              </div>
            )}
          </Capitulo>
        )}

        {(info.lugar || info.direccion) && (
          <Capitulo id="ceremonia" ante={textos.anteCeremonia} titulo={corto(info.overline, textos.ceremonia)} soporte={conSoporte("ceremonia")}
            escena={piezas.ceremonia} escenaClase="cu-escena-ceremonia" adornos={adornos("ceremonia")}>
            {info.lugar && <p className="cu-lugar">{info.lugar}</p>}
            {partes && (
              <p className="cu-cuando">
                <span>{partes.semana}</span>
                <b>{partes.dia}</b>
                <span>{partes.hora}</span>
              </p>
            )}
            {info.direccion && <p className="cu-texto">{info.direccion}</p>}
            {mapa && (
              <div className="cu-mapa">
                <iframe src={mapa} title={`Mapa de ${info.lugar || "la ceremonia"}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}
            <div className="cu-botones">
              {info.mapsUrl && <a className="cu-btn" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">{Icono.pin} Cómo llegar</a>}
              {info.direccion && <button className="cu-btn" type="button" onClick={() => copiar(info.direccion, "Dirección copiada")}>{Icono.copiar} Copiar</button>}
            </div>
          </Capitulo>
        )}

        {(cronograma.length > 0 || mensajePrograma) && (
          <Capitulo id="programa" ante={textos.antePrograma} titulo={corto(info.tituloItinerario, "El programa")} soporte={conSoporte("programa")}
            escena={piezas.programa} escenaClase="cu-escena-programa" escenaAbajo adornos={adornos("programa")}>
            {cronograma.length > 0 ? (
              <ol className="cu-programa">
                {cronograma.map((c, i) => (
                  <li key={i} style={{ "--i": i }}>
                    <Flor />
                    <span className="cu-programa-hora">{c.hora}</span>
                    <span className="cu-programa-que">{c.titulo}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="cu-texto">{mensajePrograma}</p>
            )}
          </Capitulo>
        )}

        {activo("padrinos") && grupos.length > 0 && (
          <Capitulo id="padrinos" ante={textos.antePadrinos} titulo={corto(padrinos.titulo, textos.padrinos)} soporte={conSoporte("padrinos")} adornos={adornos("padrinos")}>
            {grupos.map((g, i) => (
              <div key={i} className="cu-grupo">
                {g.etiqueta && <p className="cu-etiqueta">{g.etiqueta}</p>}
                <div className="cu-padrinos">
                  {g.personas.filter(Boolean).map((p, j) => <p key={j}>{p}</p>)}
                </div>
              </div>
            ))}
          </Capitulo>
        )}

        {activo("vestimenta") && (vestimenta.titulo || vestimenta.nota || permitidos.length > 0) && (
          <Capitulo id="vestimenta" ante={vestimenta.titulo || "Vestimenta"} titulo="Vestimenta" soporte={conSoporte("vestimenta")}
            escena={piezas.vestimenta} escenaClase="cu-escena-vestimenta" adornos={adornos("vestimenta")}>
            {vestimenta.nota && <p className="cu-texto">{vestimenta.nota}</p>}
            {permitidos.length > 0 && (
              <ul className="cu-colores" aria-label="Colores sugeridos">
                {permitidos.map((p, i) => (
                  <li key={i}>
                    <span className="cu-manchas">
                      {(p.colores || []).slice(0, 3).map((c, j) => <i key={j} style={{ "--c": c, "--j": j }} />)}
                    </span>
                    {p.nombre && <span>{p.nombre}</span>}
                  </li>
                ))}
              </ul>
            )}
            {evitar.length > 0 && (
              <p className="cu-evitar">
                Mejor evitar:{" "}
                {evitar.map((e, i) => (
                  <span key={i}>{e.color && <i style={{ background: e.color }} />}{e.nombre}</span>
                ))}
              </p>
            )}
          </Capitulo>
        )}

        {activo("historia") && historia.texto && (
          <Capitulo id="historia" ante={textos.anteHistoria} titulo={corto(historia.titulo, "Mi historia")} soporte={conSoporte("historia")} adornos={adornos("historia")}>
            <p className="cu-cuento">{historia.texto}</p>
            {nombre && <p className="cu-firma">{nombre.split(" ")[0]}</p>}
          </Capitulo>
        )}

        {fotos.length > 0 && (
          <Capitulo id="fotos" ante={fotosSec.subtitulo || "Recuerdos"} titulo={corto(fotosSec.titulo, "Momentos")} soporte={conSoporte("fotos")}>
            <div className={`cu-fotos ${fotos.length === 1 ? "cu-fotos-una" : ""}`}>
              {fotos.slice(0, 6).map((f, i) => (
                <figure key={i} style={{ "--i": i }}><img src={f} alt={`Foto ${i + 1} de ${nombre || "la familia"}`} loading="lazy" /></figure>
              ))}
            </div>
          </Capitulo>
        )}

        {hayRegalo && (
          <Capitulo id="regalos" ante="Con cariño" titulo={corto(activo("regalos") && regalos.titulo, "Un detalle")} soporte={conSoporte("regalos")}
            escena={piezas.regalos} escenaClase="cu-escena-regalos" adornos={adornos("regalos")}>
            {activo("regalos") && regalos.texto && <p className="cu-texto">{regalos.texto}</p>}
            {activo("sobres") && sobres.texto && <p className="cu-texto">{sobres.texto}</p>}
            {activo("regalos") && enlaces.length > 0 && (
              <div className="cu-botones">
                {enlaces.map((e, i) => (
                  <a key={i} className="cu-btn" href={e.url} target="_blank" rel="noopener noreferrer">{Icono.regalo} {e.tienda || e.nombre || "Ver lista"}</a>
                ))}
              </div>
            )}
            {activo("regalos") && regalos.datosTransferencia && (
              <div className="cu-transferir">
                <p className="cu-etiqueta">Datos para transferir</p>
                <p className="cu-dato">{regalos.datosTransferencia}</p>
                <button className="cu-btn" type="button" onClick={() => copiar(regalos.datosTransferencia, "Datos copiados")}>{Icono.copiar} Copiar</button>
              </div>
            )}
          </Capitulo>
        )}

        {activo("info_importante") && (puntos.length > 0 || importante.nota) && (
          <Capitulo id="importante" ante="Para tener en cuenta" titulo="Importante" soporte={conSoporte("importante")} adornos={adornos("importante")}>
            {importante.nota && <p className="cu-texto">{importante.nota}</p>}
            {puntos.length > 0 && (
              <ul className="cu-lista">
                {puntos.map((p, i) => <li key={i}><Flor />{p}</li>)}
              </ul>
            )}
          </Capitulo>
        )}

        {activo("faq") && preguntas.length > 0 && (
          <Capitulo id="faq" ante="Dudas" titulo="Preguntas" soporte={conSoporte("faq")} adornos={adornos("faq")}>
            <div className="cu-faq">
              {preguntas.map((f, i) => <details key={i}><summary>{f.p}</summary>{f.r && <p>{f.r}</p>}</details>)}
            </div>
          </Capitulo>
        )}

        {confirmar && (
          <Capitulo id="confirmar" ante="¿Me acompañas?" titulo="Confirma" soporte={conSoporte("confirmar")}
            escena={piezas.confirmar} escenaClase="cu-escena-confirmar" adornos={adornos("confirmar")}>
            {invitacion?.nombre && (
              <p className="cu-texto">
                Guardamos {pases > 1 ? <b>{pases} lugares</b> : <b>un lugar</b>} para <b>{invitacion.nombre}</b>.
              </p>
            )}
            {confirmar.href ? (
              <a className="cu-btn cu-btn-lleno" href={confirmar.href} target="_blank" rel="noopener noreferrer">
                {Icono.whatsapp} <span>{confirmar.texto} <b>{confirmar.grande}</b></span>
              </a>
            ) : (
              <button className="cu-btn cu-btn-lleno" type="button" onClick={confirmar.onClick}>{confirmar.grande}</button>
            )}
            {limite && <p className="cu-limite">Confirma antes del <b>{limite}</b></p>}
          </Capitulo>
        )}

        <footer className="cu-final" data-reveal>
          <div className="cu-final-escena" aria-hidden="true">
            {config.final.fondo && <img className="cu-final-fondo" src={config.final.fondo} alt="" loading="lazy" />}
            <img className="cu-final-figura" src={config.final.figura} alt="" loading="lazy" />
          </div>
          <p className="cu-final-gracias">{textos.gracias}</p>
          {(padres.length > 0 || nombre) && (
            <p className="cu-texto cu-final-firma">Con amor, {padres.length > 0 ? padres.join(" y ") : `la familia de ${nombre}`}</p>
          )}
        </footer>
      </main>

      <div className={`cu-aviso ${aviso ? "is-visible" : ""}`} role="status" aria-live="polite">{aviso}</div>

      {rsvpAbierto && invitacion && (
        <div className="cu-modal" role="dialog" aria-modal="true" aria-label="Confirmar asistencia" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="cu-modal-caja">
            {piezas.confirmar && <img className="cu-modal-figura" src={piezas.confirmar} alt="" aria-hidden="true" />}
            <button type="button" className="cu-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">{Icono.cerrar}</button>
            <div className="cu-modal-hoja">
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
