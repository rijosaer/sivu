import { useEffect, useRef, useState } from "react";
import "./landing.css";
import { PRECIOS, waLink } from "./config";
import { API_URL } from "../api/site";

const ESTILOS = [
  { tipo: "Boda", nombre: "Camila & Andrés", fecha: "13 · 02 · 2027", fondo: "linear-gradient(170deg,#f3ece0 0%,#e9dccb 100%)", tinta: "#5C0F27", acento: "#B87F1E", flor: "#c98a9b" },
  { tipo: "XV años", nombre: "Valentina", fecha: "10 · 05 · 2027", fondo: "linear-gradient(170deg,#eef3ea 0%,#d6e3d0 100%)", tinta: "#1b3b2b", acento: "#b59556", flor: "#8fb08a" },
  { tipo: "Baby shower", nombre: "Bienvenido Mateo", fecha: "21 · 11 · 2026", fondo: "linear-gradient(170deg,#eaf3f8 0%,#cfe2ee 100%)", tinta: "#0E4676", acento: "#E3A63E", flor: "#7fb3d5" },
];

const AVISOS = [
  { icono: "✓", texto: "Familia Rodríguez confirmó", sub: "4 personas", color: "#146B4E" },
  { icono: "👀", texto: "Laura abrió su invitación", sub: "hace 2 min", color: "#1868A8" },
  { icono: "✓", texto: "Julián confirmó + 1 cupo", sub: "trae a Natalia", color: "#146B4E" },
  { icono: "⏳", texto: "Recordatorio enviado", sub: "a 6 pendientes", color: "#B87F1E" },
];

// Cada modelo se muestra como la invitación misma, funcionando dentro de un
// celular: la boda carga la invitación de ejemplo (Ana & Diego) y los demás la
// demostración pública de su diseño (/plantillas/<diseño>, sin base de datos).
// Los modelos que se muestran los decide el panel (Diseños → «En la landing»).
// Esta lista es el respaldo si la API no responde.
const MODELOS_RESPALDO = [
  { estilo: "Clásico", vista: "/ana-y-diego" },
  { estilo: "Jardín encantado", vista: "/plantillas/jardin" },
  { estilo: "Ensueño", vista: "/plantillas/ensueno" },
  { estilo: "Gala", vista: "/plantillas/gala" },
];

function useModelos() {
  const [modelos, setModelos] = useState(MODELOS_RESPALDO);
  useEffect(() => {
    fetch(`${API_URL}/api/public/disenos`)
      .then((r) => (r.ok ? r.json() : null))
      .then((lista) => {
        if (Array.isArray(lista) && lista.length) setModelos(lista.map((d) => ({ estilo: d.nombre, vista: d.vista })));
      })
      .catch(() => {});
  }, []);
  return modelos;
}

const PREGUNTAS = [
  ["¿Cuánto tarda en estar lista mi invitación?", "Normalmente entre 3 y 5 días hábiles desde que nos envías la información del evento y la lista de invitados."],
  ["¿Mis invitados tienen que instalar algo?", "No. Reciben un enlace por WhatsApp y la invitación abre en el navegador del celular, como una página web."],
  ["¿Qué es el código por invitado?", "Cada invitado o familia recibe su propio enlace: la invitación lo saluda por su nombre, le muestra sus cupos y su confirmación llega directo a tu tablero."],
  ["¿Puedo cambiar la información después de enviarla?", "Sí. Fecha, lugar, textos, fotos y música se actualizan y todos los invitados ven el cambio al instante, sin reenviar nada."],
  ["¿Sirve para eventos que no son bodas?", "Sí: XV años, bautizos, baby showers, cumpleaños, grados, aniversarios y eventos de empresa."],
];

// Personalización en vivo del preview: qué campo pide cada modelo y cómo se
// llama el query param que entiende su invitación. La boda además cambia la
// fecha (el sitio la deriva todo de ahí: cuenta regresiva, textos, calendario).
const PERSONALIZA = {
  "Boda": { etiqueta: "Nombres de la pareja", ejemplo: "Ana & Diego", paramNombre: "demo_novios", paramFecha: "demo_fecha" },
  "XV años": { etiqueta: "Nombre de la quinceañera", ejemplo: "Valentina Morales", paramNombre: "nombre" },
  "Corporativo": { etiqueta: "Nombre de la empresa", ejemplo: "Nortex Colombia", paramNombre: "empresa" },
};

function urlVista(modelo, demo) {
  if (!modelo.vista) return null;
  const q = new URLSearchParams();
  const p = PERSONALIZA[modelo.tipo];
  if (p && demo.nombres.trim()) q.set(p.paramNombre, demo.nombres.trim());
  if (p?.paramFecha && demo.fecha) q.set(p.paramFecha, demo.fecha);
  if (modelo.vista.includes("?")) {
    const [base, fija] = modelo.vista.split("?");
    return `${base}?${fija}${q.size ? "&" + q : ""}`;
  }
  return q.size ? `${modelo.vista}?${q}` : modelo.vista;
}

// Aparición suave al hacer scroll (respeta "reducir movimiento").
function useAparecer() {
  const ref = useRef(null);
  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    const els = raiz.querySelectorAll("[data-aparece]");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("cv-visto"));
      return;
    }
    const io = new IntersectionObserver(
      (entradas) => entradas.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("cv-visto"); io.unobserve(en.target); } }),
      { threshold: 0.15 }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return ref;
}

function Telefono() {
  const [i, setI] = useState(0);
  const [aviso, setAviso] = useState(0);
  useEffect(() => {
    const a = setInterval(() => setI((v) => (v + 1) % ESTILOS.length), 4200);
    const b = setInterval(() => setAviso((v) => (v + 1) % AVISOS.length), 2600);
    return () => { clearInterval(a); clearInterval(b); };
  }, []);
  const e = ESTILOS[i];
  const av = AVISOS[aviso];
  return (
    <div className="cv-escena">
      <div className="cv-abanico cv-ab1" />
      <div className="cv-abanico cv-ab2" />
      <div className="cv-telefono">
        <div className="cv-notch" />
        <div className="cv-pantalla" style={{ background: e.fondo, color: e.tinta }} key={i}>
          <svg className="cv-ramo cv-ramo-sup" viewBox="0 0 200 120" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((k) => (
              <ellipse key={k} cx={30 + k * 34} cy={40 + (k % 2) * 18} rx="22" ry="9" fill={e.flor} opacity={0.35 + (k % 3) * 0.15} transform={`rotate(${-30 + k * 15} ${30 + k * 34} ${40 + (k % 2) * 18})`} />
            ))}
            {[0, 1, 2].map((k) => <circle key={k} cx={50 + k * 50} cy={30 + k * 8} r="7" fill={e.acento} opacity=".55" />)}
          </svg>
          <div className="cv-inv">
            <span className="cv-inv-tipo" style={{ color: e.acento }}>{e.tipo}</span>
            <span className="cv-inv-hola">Querida Familia Rodríguez</span>
            <span className="cv-inv-nombre">{e.nombre}</span>
            <span className="cv-inv-linea" style={{ background: e.acento }} />
            <span className="cv-inv-fecha">{e.fecha}</span>
            <span className="cv-inv-cupos">Reservamos <b>4 cupos</b> en tu honor</span>
            <span className="cv-inv-boton" style={{ background: e.tinta }}>Confirmar asistencia</span>
          </div>
          <svg className="cv-ramo cv-ramo-inf" viewBox="0 0 200 120" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((k) => (
              <ellipse key={k} cx={20 + k * 40} cy={80 - (k % 2) * 16} rx="24" ry="9" fill={e.flor} opacity={0.3 + (k % 3) * 0.15} transform={`rotate(${25 - k * 12} ${20 + k * 40} ${80 - (k % 2) * 16})`} />
            ))}
          </svg>
        </div>
      </div>
      <div className="cv-aviso" key={`a${aviso}`}>
        <span className="cv-aviso-icono" style={{ background: av.color }}>{av.icono}</span>
        <span><b>{av.texto}</b><small>{av.sub}</small></span>
      </div>
      <div className="cv-sello">RSVP<br />en vivo</div>
    </div>
  );
}

function Tablero() {
  const filas = [
    ["Familia Rodríguez", "4 de 4", "conf"], ["Laura y Andrés", "2 de 2", "conf"], ["Tía Carmen", "No asistirá", "no"],
    ["Julián Gómez", "2 de 3 cupos", "conf"], ["Familia Herrera", "Pendiente", "pend"], ["Valentina Ruiz", "Abrió · sin responder", "pend"],
  ];
  return (
    <div className="cv-tablero" data-aparece>
      <div className="cv-tab-barra"><i /><i /><i /><span>panel.sivu · Camila & Andrés</span></div>
      <div className="cv-tab-cuerpo">
        <div className="cv-tab-kpis">
          <div><b>68</b><span>confirmados</span></div>
          <div><b>21</b><span>pendientes</span></div>
          <div><b>7</b><span>no asistirán</span></div>
        </div>
        <div className="cv-tab-progreso"><span style={{ width: "71%" }} /><em>71 % de respuestas</em></div>
        <ul>
          {filas.map(([n, e, k]) => (
            <li key={n}><span>{n}</span><em className={`cv-est cv-est-${k}`}>{e}</em></li>
          ))}
        </ul>
        <div className="cv-tab-acciones">
          <span>⟳ Recordar a pendientes</span><span>⬇ Exportar PDF</span>
        </div>
      </div>
      <p className="cv-tab-nota">Vista de ejemplo del panel</p>
    </div>
  );
}

export default function Landing() {
  const modelos = useModelos();
  const ref = useAparecer();
  useEffect(() => {
    document.title = "Sivú · Invitaciones digitales que enamoran";
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Alex+Brush&family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,400..700&family=Work+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
    return () => link.remove();
  }, []);
  const hola = waLink("¡Hola Sivú! Quiero una invitación digital para mi evento.");

  return (
    <div className="cv" ref={ref}>
      <nav className="cv-nav">
        <div className="cv-cont cv-nav-in">
          <a href="#inicio" className="cv-logo">Sivú</a>
          <div className="cv-nav-links">
            <a href="#como">Cómo funciona</a><a href="#paquetes">Paquetes</a><a href="#modelos">Modelos</a><a href="#preguntas">Preguntas</a>
          </div>
          <a href={hola} className="cv-btn cv-btn-borde" target="_blank" rel="noreferrer">Escríbenos</a>
        </div>
      </nav>

      <header id="inicio" className="cv-hero">
        <div className="cv-puntos" />
        <div className="cv-cont cv-hero-in">
          <div className="cv-hero-txt">
            <span className="cv-eyebrow cv-oro">Papelería digital para celebraciones</span>
            <h1>Una invitación que <span className="cv-script">enamora</span>.<br />Un tablero que no te deja <span className="cv-script">a ciegas</span>.</h1>
            <p>Diseñamos la invitación de tu evento, la enviamos a cada invitado con su propio enlace y te mostramos en vivo quién confirmó, quién falta y a quién recordarle.</p>
            <div className="cv-hero-ctas">
              <a href={hola} className="cv-btn cv-btn-oro" target="_blank" rel="noreferrer">Quiero mi invitación</a>
              <a href="#modelos" className="cv-btn cv-btn-claro">Ver modelos</a>
            </div>
            <ul className="cv-hero-ticks">
              <li>Sin apps: abre en el celular</li><li>Un enlace por invitado</li><li>Cambios al instante</li>
            </ul>
          </div>
          <Telefono />
        </div>
        <div className="cv-franja">
          <div className="cv-cont cv-franja-in">
            {[["Diseño a tu medida", "Un estilo propio para tu evento, no una plantilla de catálogo."], ["Un enlace por invitado", "Lo saluda por su nombre y le muestra sus cupos."], ["Tablero en vivo", "Confirmados, pendientes y recordatorios, sin hojas de cálculo."], ["Cualquier celebración", "Bodas, XV, bautizos, cumpleaños, grados, empresa."]].map(([t, d]) => (
              <div key={t}><span className="cv-eyebrow cv-oro">{t}</span><p>{d}</p></div>
            ))}
          </div>
        </div>
      </header>

      <section className="cv-marquesina" aria-label="Tipos de evento">
        <div className="cv-marq-pista">
          {[0, 1].map((r) => (
            <div key={r} className="cv-marq-grupo" aria-hidden={r === 1}>
              {["Bodas", "XV años", "Bautizos", "Baby showers", "Cumpleaños", "Grados", "Aniversarios", "Eventos corporativos"].map((t, k) => (
                <span key={t} className={`cv-chip cv-chip-${k % 6}`}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="cv-seccion cv-dos" id="tablero">
        <div className="cv-cont cv-dos-in">
          <div data-aparece>
            <span className="cv-eyebrow cv-vino">El tablero</span>
            <h2>Deja de preguntar <span className="cv-script cv-vino">“¿quién viene?”</span></h2>
            <p className="cv-lead">Cada respuesta llega sola a tu panel. Ves quién abrió la invitación, quién confirmó y con cuántas personas, y con un toque le recuerdas a quien falta. Al final, descargas la lista en PDF para el lugar del evento.</p>
            <ul className="cv-lista-check">
              <li>Confirmaciones por persona, familia o cupos</li>
              <li>Restricciones alimentarias y comentarios de cada invitado</li>
              <li>Recordatorios por WhatsApp a los pendientes</li>
            </ul>
          </div>
          <Tablero />
        </div>
      </section>

      <section className="cv-seccion cv-azul" id="como">
        <div className="cv-cont">
          <span className="cv-eyebrow cv-oro">Proceso</span>
          <h2 className="cv-blanco">Así de <span className="cv-script cv-oro">fácil</span> funciona</h2>
          <div className="cv-pasos">
            {[["01", "Nos cuentas tu evento", "Fecha, lugar, estilo y lo que quieres que vean tus invitados."], ["02", "Diseñamos y cargamos invitados", "Armamos tu tarjeta y, si eliges Personalizada, un enlace único por invitado o familia."], ["03", "Enviamos y hacemos seguimiento", "Cada invitado recibe su enlace y tú ves en el tablero quién confirmó."]].map(([n, t, d], k) => (
              <div key={n} className="cv-paso" data-aparece style={{ transitionDelay: `${k * 0.12}s` }}>
                <span className="cv-paso-num">{n}</span><h3>{t}</h3><p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cv-seccion" id="paquetes">
        <div className="cv-cont">
          <span className="cv-eyebrow cv-vino">Paquetes</span>
          <h2>Elige tu <span className="cv-script cv-vino">paquete</span> ideal</h2>
          <div className="cv-precios">
            <article className="cv-precio cv-p-general" data-aparece>
              <span className="cv-eyebrow">General</span>
              <div className="cv-monto">${PRECIOS.general}</div>
              <p>Una tarjeta, toda la información, un solo enlace para todos.</p>
              <ul><li>Tarjeta con toda la información del evento</li><li>Diseño temático a tu elección</li><li>Cuenta regresiva y agregar al calendario</li><li>Confirmación de asistencia general</li></ul>
              <a className="cv-btn cv-btn-linea" href={waLink("Hola, me interesa el paquete General de Sivú.")} target="_blank" rel="noreferrer">Lo quiero</a>
            </article>
            <article className="cv-precio cv-p-destacado" data-aparece>
              <span className="cv-recomendado">Recomendado</span>
              <span className="cv-eyebrow cv-oro">Personalizada</span>
              <div className="cv-monto">${PRECIOS.personalizada}</div>
              <p>Todo lo de General, más control de quién confirma.</p>
              <ul><li>Enlace único por invitado, familia o cupo</li><li>Tablero de confirmados y pendientes</li><li>Exportación de la lista en PDF</li><li>Recordatorios personalizados a quien falta</li></ul>
              <a className="cv-btn cv-btn-oro" href={waLink("Hola, me interesa el paquete Personalizada de Sivú.")} target="_blank" rel="noreferrer">Lo quiero</a>
            </article>
            <article className="cv-precio cv-p-gestion" data-aparece>
              <span className="cv-eyebrow">Personalizada + Gestión</span>
              <div className="cv-monto">${PRECIOS.gestion}</div>
              <p>Todo lo anterior, pero lo operamos nosotros por ti.</p>
              <ul><li>Cargamos tu lista de invitados</li><li>Enviamos cada enlace personalizado</li><li>Seguimiento diario de confirmaciones</li><li>Entrega final del PDF de confirmados</li></ul>
              <a className="cv-btn cv-btn-linea" href={waLink("Hola, me interesa el paquete Personalizada + Gestión de Sivú.")} target="_blank" rel="noreferrer">Lo quiero</a>
            </article>
          </div>
          <p className="cv-nota">Precios de referencia en pesos colombianos. El valor final depende del número de invitados y del evento.</p>
        </div>
      </section>

      <section className="cv-seccion cv-oscuro" id="modelos">
        <div className="cv-cont">
          <span className="cv-eyebrow cv-oro">Modelos</span>
          <h2 className="cv-crema">Un estilo para <span className="cv-script cv-oro">cada historia</span></h2>
          <div className="cv-telefonos">
            {modelos.map((m) => (
              <div key={m.vista} className="cv-telefono-item" data-aparece>
                <div className="cv-telefono">
                  <span className="cv-telefono-camara" aria-hidden="true" />
                  <iframe
                    title={`Invitación de ejemplo, estilo ${m.estilo}`}
                    src={`${m.vista}${m.vista.includes("?") ? "&" : "?"}preview=1`}
                    loading="lazy"
                  />
                </div>
                <div className="cv-telefono-acciones">
                  <a className="cv-btn cv-btn-oro" href={waLink(`Hola, me gusta el estilo «${m.estilo}» de Sivú para mi evento.`)} target="_blank" rel="noreferrer">La quiero</a>
                  <a className="cv-btn cv-btn-linea" href={m.vista} target="_blank" rel="noreferrer">Ver en grande</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cv-seccion" id="preguntas">
        <div className="cv-cont cv-faq">
          <div>
            <span className="cv-eyebrow cv-vino">Preguntas</span>
            <h2>Lo que más nos <span className="cv-script cv-vino">preguntan</span></h2>
          </div>
          <div className="cv-faq-lista">
            {PREGUNTAS.map(([p, r]) => (
              <details key={p}><summary>{p}</summary><p>{r}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="cv-cierre">
        <div className="cv-cont cv-cierre-in" data-aparece>
          <span className="cv-script cv-cierre-titulo">¿Le contamos a tus invitados?</span>
          <p>Escríbenos con la fecha y el tipo de evento, y armamos tu invitación esta semana.</p>
          <a href={hola} className="cv-btn cv-btn-oro cv-btn-grande" target="_blank" rel="noreferrer">Escribir por WhatsApp</a>
          <span className="cv-mono">SIVÚ · INVITACIONES DIGITALES</span>
        </div>
      </section>

      <a className="cv-flotante" href={hola} target="_blank" rel="noreferrer" aria-label="Escribir por WhatsApp">
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.6a10.6 10.6 0 0 1-5.4-1.5l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6Zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9c2 .9 2.8.9 3.8.8a3.3 3.3 0 0 0 2.2-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.2-.3-.3-.7-.5Z"/></svg>
      </a>
    </div>
  );
}
