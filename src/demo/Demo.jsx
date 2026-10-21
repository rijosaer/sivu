import { Suspense, lazy, useEffect, useState } from "react";
import { applyTema } from "../theme/applyTema";
import { WHATSAPP } from "../landing/config";
import { API_URL } from "../api/site";
import "./demo.css";

// Demostración pública de cada diseño: /plantillas/<diseño>. Muestra la
// invitación completa con datos de ejemplo incluidos en el sitio (exportados
// de una muestra real), sin tocar la base de datos: la confirmación se simula
// y no guarda nada. Así la landing enseña las plantillas sin login ni eventos.
//
// <diseño> también puede ser una variante del catálogo (panel → Diseños): se
// pide a la API su diseño base y sus colores, y se pinta el base con ellos.
// ?t=<json> pisa colores y letras sin guardar: es la vista previa en vivo del
// editor de variantes del panel.

const DISENOS = {
  jardin: lazy(() => import("../disenos/jardin/Jardin")),
  ensueno: lazy(() => import("../disenos/ensueno/Ensueno")),
  gala: lazy(() => import("../disenos/gala/Gala")),
  lazos: lazy(() => import("../disenos/lazos/Lazos")),
  coquette: lazy(() => import("../disenos/coquette/Coquette")),
  paris: lazy(() => import("../disenos/paris/Paris")),
  valle: lazy(() => import("../disenos/valle/Valle")),
  "valle-claro": lazy(() => import("../disenos/valle/ValleClaro")),
  eucalipto: lazy(() => import("../disenos/eucalipto/Eucalipto")),
  luces: lazy(() => import("../disenos/luces/Luces")),
  vals: lazy(() => import("../disenos/vals/Vals")),
  luz: lazy(() => import("../disenos/luz/Luz")),
  confeti: lazy(() => import("../disenos/confeti/Confeti")),
  dulce: lazy(() => import("../disenos/dulce/Dulce")),
  birrete: lazy(() => import("../disenos/birrete/Birrete")),
  medianoche: lazy(() => import("../disenos/medianoche/Medianoche")),
  osito: lazy(() => import("../disenos/osito/Osito")),
  cielito: lazy(() => import("../disenos/cuento/cielito/Cielito")),
  capillita: lazy(() => import("../disenos/cuento/capillita/Capillita")),
  cometas: lazy(() => import("../disenos/cuento/cometas/Cometas")),
  bosquecito: lazy(() => import("../disenos/cuento/bosquecito/Bosquecito")),
};

const MUESTRAS = {
  jardin: () => import("./muestras/jardin.json"),
  ensueno: () => import("./muestras/ensueno.json"),
  gala: () => import("./muestras/gala.json"),
  lazos: () => import("./muestras/lazos.json"),
  coquette: () => import("./muestras/coquette.json"),
  paris: () => import("./muestras/paris.json"),
  valle: () => import("./muestras/valle.json"),
  "valle-claro": () => import("./muestras/valle-claro.json"),
  eucalipto: () => import("./muestras/eucalipto.json"),
  luces: () => import("./muestras/luces.json"),
  vals: () => import("./muestras/vals.json"),
  luz: () => import("./muestras/luz.json"),
  confeti: () => import("./muestras/confeti.json"),
  dulce: () => import("./muestras/dulce.json"),
  birrete: () => import("./muestras/birrete.json"),
  medianoche: () => import("./muestras/medianoche.json"),
  osito: () => import("./muestras/osito.json"),
  cielito: () => import("./muestras/cielito.json"),
  capillita: () => import("./muestras/capillita.json"),
  cometas: () => import("./muestras/cometas.json"),
  bosquecito: () => import("./muestras/bosquecito.json"),
};

const NOMBRES = { jardin: "Jardín encantado", ensueno: "Ensueño", gala: "Gala", lazos: "Moños y perlas", coquette: "Coquette", paris: "París rosé", valle: "Valle de luna", "valle-claro": "Valle claro", eucalipto: "Eucalipto", luces: "Luces de verano", vals: "Vals lila", luz: "Luz de bautizo", confeti: "Confeti", dulce: "Dulce 30", birrete: "Birrete", medianoche: "Medianoche", osito: "Osito", cielito: "Cielito", capillita: "Capillita", cometas: "Cometas", bosquecito: "Bosquecito" };

function temaDeUrl() {
  try {
    const t = new URLSearchParams(window.location.search).get("t");
    return t ? JSON.parse(t) : {};
  } catch {
    return {};
  }
}

export default function Demo({ diseno }) {
  const [datos, setDatos] = useState(null);
  const [info, setInfo] = useState(null); // { base, nombre, tema }
  const [noExiste, setNoExiste] = useState(false);
  const enVistaPrevia = new URLSearchParams(window.location.search).has("preview");
  const base = info?.base || diseno;
  const Diseno = DISENOS[base];
  const nombre = info?.nombre || NOMBRES[diseno] || diseno;

  useEffect(() => {
    let vivo = true;
    fetch(`${API_URL}/api/public/disenos/${encodeURIComponent(diseno)}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((d) => {
        if (!vivo) return;
        const elegido = d || (DISENOS[diseno] ? { base: diseno, nombre: NOMBRES[diseno], tema: {} } : null);
        if (!elegido || !MUESTRAS[elegido.base]) return setNoExiste(true);
        setInfo(elegido);
        MUESTRAS[elegido.base]().then((m) => {
          if (!vivo) return;
          applyTema({ ...m.default.site.tema, ...(elegido.tema || {}), ...temaDeUrl() });
          document.title = `Plantilla ${elegido.nombre || diseno} · Sivú`;
          setDatos(m.default);
        });
      });
    return () => {
      vivo = false;
    };
  }, [diseno]);

  if (noExiste || (info && !Diseno)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6 font-body text-ink/70">
        <p>Esa plantilla no existe.</p>
        <a className="underline" href="/#modelos">Ver todas las plantillas</a>
      </div>
    );
  }
  if (!datos) return null;

  const { site, invitado } = datos;
  const contenidoDe = (tipo) => site.secciones.find((s) => s.tipo === tipo)?.contenido || {};
  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Hola, me gusta la plantilla «${nombre}» de Sivú para mi evento.`
  )}`;

  return (
    <>
      <Suspense fallback={null}>
        <Diseno
          site={site}
          contenidoDe={contenidoDe}
          invitacion={invitado}
          enEditor={false}
          onEnviarRSVP={async () => ({ ok: true })}
        />
      </Suspense>
      {/* Dentro de la vista previa de la landing ya están sus propios botones. */}
      {!enVistaPrevia && (
        <div className="demo-barra" role="note">
          <span>Plantilla de ejemplo</span>
          <a href={wa} target="_blank" rel="noreferrer">La quiero</a>
          <a href="/#modelos">Ver más</a>
        </div>
      )}
    </>
  );
}
