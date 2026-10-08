import { Suspense, lazy, useEffect, useState } from "react";
import { applyTema } from "../theme/applyTema";
import { WHATSAPP } from "../landing/config";
import "./demo.css";

// Demostración pública de cada diseño: /plantillas/<diseño>. Muestra la
// invitación completa con datos de ejemplo incluidos en el sitio (exportados
// de una muestra real), sin tocar la base de datos: la confirmación se simula
// y no guarda nada. Así la landing enseña las plantillas sin login ni eventos.

const DISENOS = {
  jardin: lazy(() => import("../disenos/jardin/Jardin")),
  ensueno: lazy(() => import("../disenos/ensueno/Ensueno")),
  gala: lazy(() => import("../disenos/gala/Gala")),
  lazos: lazy(() => import("../disenos/lazos/Lazos")),
  coquette: lazy(() => import("../disenos/coquette/Coquette")),
};

const MUESTRAS = {
  jardin: () => import("./muestras/jardin.json"),
  ensueno: () => import("./muestras/ensueno.json"),
  gala: () => import("./muestras/gala.json"),
  lazos: () => import("./muestras/lazos.json"),
  coquette: () => import("./muestras/coquette.json"),
};

const NOMBRES = { jardin: "Jardín encantado", ensueno: "Ensueño", gala: "Gala", lazos: "Moños y perlas", coquette: "Coquette" };

export default function Demo({ diseno }) {
  const [datos, setDatos] = useState(null);
  const enVistaPrevia = new URLSearchParams(window.location.search).has("preview");
  const Diseno = DISENOS[diseno];

  useEffect(() => {
    if (!MUESTRAS[diseno]) return;
    MUESTRAS[diseno]().then((m) => {
      applyTema(m.default.site.tema);
      document.title = `Plantilla ${NOMBRES[diseno]} · Convite`;
      setDatos(m.default);
    });
  }, [diseno]);

  if (!Diseno) {
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
    `Hola, me gusta la plantilla «${NOMBRES[diseno]}» de Convite para mi evento.`
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
