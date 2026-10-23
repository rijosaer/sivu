import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import PaperBackground from "./components/PaperBackground";
import Welcome from "./components/Welcome";
import RSVP from "./components/RSVP";
import MusicToggle from "./components/MusicToggle";
import FinalScreen from "./components/FinalScreen";
import CapaDecorativa, { ZONA_LIBRE } from "./components/CapaDecorativa";
import Anuncio from "./components/Anuncio";
import Servidores, { personaDelEnlace } from "./components/Servidores";
import { getSite, getInvitado, submitRSVP, registrarApertura } from "./api/site";
import { DecorProvider } from "./theme/DecorContext";
import { EditorProvider, editorActivo, editandoPortada, mensajeDelPanel } from "./editor/EditorContext";
import { applyTema } from "./theme/applyTema";
import { renderSeccion } from "./SectionRenderer";

// Diseños alternativos (columna invitaciones.diseno). Se cargan aparte para
// que la boda clásica no descargue sus ilustraciones.
const DISENOS_ALTERNATIVOS = {
  jardin: lazy(() => import("./disenos/jardin/Jardin")),
  ensueno: lazy(() => import("./disenos/ensueno/Ensueno")),
  gala: lazy(() => import("./disenos/gala/Gala")),
  lazos: lazy(() => import("./disenos/lazos/Lazos")),
  coquette: lazy(() => import("./disenos/coquette/Coquette")),
  paris: lazy(() => import("./disenos/paris/Paris")),
  valle: lazy(() => import("./disenos/valle/Valle")),
  "valle-claro": lazy(() => import("./disenos/valle/ValleClaro")),
  celebracion: lazy(() => import("./disenos/celebracion/Celebracion")),
  "celebracion-azul": lazy(() => import("./disenos/celebracion/CelebracionAzul")),
  eucalipto: lazy(() => import("./disenos/eucalipto/Eucalipto")),
  luces: lazy(() => import("./disenos/luces/Luces")),
  vals: lazy(() => import("./disenos/vals/Vals")),
  luz: lazy(() => import("./disenos/luz/Luz")),
  confeti: lazy(() => import("./disenos/confeti/Confeti")),
  dulce: lazy(() => import("./disenos/dulce/Dulce")),
  birrete: lazy(() => import("./disenos/birrete/Birrete")),
  medianoche: lazy(() => import("./disenos/medianoche/Medianoche")),
  osito: lazy(() => import("./disenos/osito/Osito")),
  cielito: lazy(() => import("./disenos/cuento/cielito/Cielito")),
  capillita: lazy(() => import("./disenos/cuento/capillita/Capillita")),
  cometas: lazy(() => import("./disenos/cuento/cometas/Cometas")),
  bosquecito: lazy(() => import("./disenos/cuento/bosquecito/Bosquecito")),
};

function useInvitationCode() {
  return useMemo(() => new URLSearchParams(window.location.search).get("i") || "", []);
}

// El sistema aloja muchas invitaciones (multi-invitación): cada una vive en
// su propio slug, "dominio.com/slug-del-evento". El slug es el primer tramo
// de la ruta; "?i=codigo", "?anuncio=1" y "?servidores=..." siguen siendo
// aparte, porque identifican al INVITADO dentro de esa invitación, no a la
// invitación en sí.
//
// Si no hay ningún tramo (la raíz del dominio) se usa DEFAULT_SLUG: son los
// enlaces que ya se repartieron para la boda de Maite y Ricardo antes de que
// existiera el multi-invitación, y tienen que seguir abriendo exactamente lo
// mismo que abrían.
const DEFAULT_SLUG = "maite-y-ricardo";

function useInvitacionSlug() {
  return useMemo(() => {
    const tramo = window.location.pathname.split("/").filter(Boolean)[0];
    return tramo ? decodeURIComponent(tramo) : DEFAULT_SLUG;
  }, []);
}

export default function App() {
  const enEditor = useMemo(editorActivo, []);
  const enPortada = useMemo(editandoPortada, []);
  // Participación: página pública para no invitados, con ?anuncio=1. Es aparte
  // por completo del flujo de la invitación con código, que no se toca.
  const enAnuncio = useMemo(
    () => new URLSearchParams(window.location.search).get("anuncio") === "1",
    []
  );
  // Servidores: la tarjeta de agradecimiento para quienes acompañan sirviendo.
  // El valor del parámetro dice de quién es: "?servidores=maria-jose-fragozo"
  // trae la tarjeta de esa persona y "?servidores=1" la común con todas. Igual
  // que la participación, vive fuera del flujo de la invitación con código.
  const servidorEnlace = useMemo(
    () => new URLSearchParams(window.location.search).get("servidores") || "",
    []
  );
  const enServidores = Boolean(servidorEnlace);
  // En modo editor la portada se salta, porque el panel necesita ver las
  // secciones para colocar decoraciones sobre ellas. Salvo que el panel pida
  // justo lo contrario (?portada=1) para poder decorar la portada.
  const [opened, setOpened] = useState(enEditor && !enPortada);
  const codigo = useInvitationCode();
  const slug = useInvitacionSlug();
  const [site, setSite] = useState(null);
  const [invitacion, setInvitacion] = useState(null);
  const [error, setError] = useState(null);
  // Vista previa en vivo: solo en modo editor, el panel manda por postMessage
  // el contenido que se está editando y aquí se superpone al publicado. Los
  // invitados nunca reciben estos mensajes, así que para ellos no cambia nada.
  const [vistaPrevia, setVistaPrevia] = useState({});

  const cargar = useCallback(async () => {
    try {
      const [siteData, invitadoData] = await Promise.all([
        getSite(slug, { codigo, vista: new URLSearchParams(window.location.search).get("vista") || "" }),
        codigo ? getInvitado(slug, codigo) : Promise.resolve(null),
      ]);
      setSite(siteData);
      setInvitacion(invitadoData);
      applyTema(siteData.tema);
      // Registrar la apertura solo cuando es un invitado real abriendo su
      // enlace: con código válido y fuera del editor del panel.
      if (invitadoData && codigo && !enEditor) registrarApertura(slug, codigo);
    } catch (e) {
      // 404: el enlace no existe, o el evento solo abre con enlace personal.
      setError(e?.message === "Invitación no encontrada" ? "no-encontrada" : "red");
    }
  }, [codigo, slug, enEditor]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Escucha del panel para la vista previa en vivo (solo en editor).
  useEffect(() => {
    if (!enEditor) return;
    function alRecibir(e) {
      if (!mensajeDelPanel(e)) return;
      const d = e.data;
      if (!d || d.fuente !== "invitacion-editor") return;
      if (d.tipo === "previsualizar" && d.seccionTipo) {
        setVistaPrevia((prev) => ({
          ...prev,
          [d.seccionTipo]: { contenido: d.contenido, activo: d.activo },
        }));
      } else if (d.tipo === "recargar") {
        // Tras publicar, el sitio recarga datos reales; se limpian las
        // superposiciones para no quedar mostrando lo que ya se guardó.
        setVistaPrevia({});
      }
    }
    window.addEventListener("message", alRecibir);
    return () => window.removeEventListener("message", alRecibir);
  }, [enEditor]);

  // Mientras se arrastra una decoración se actualiza solo en memoria; el
  // guardado lo hace el panel cuando se suelta.
  const cambiarUbicacion = useCallback((id, cambios) => {
    setSite((prev) =>
      prev
        ? {
            ...prev,
            ubicaciones: prev.ubicaciones.map((u) => (u.id === id ? { ...u, ...cambios } : u)),
          }
        : prev
    );
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6 font-body text-ink/70">
        {error === "no-encontrada"
          ? "No encontramos esta invitación. Ábrela desde el enlace que te enviaron, completo tal como llegó."
          : "No pudimos conectar con el servidor de la invitación. Vuelve a intentarlo en un momento."}
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-xs tracking-widest2 uppercase text-gold-dark/70">
        Cargando invitación...
      </div>
    );
  }

  // Contenido efectivo de una sección: el publicado, con la superposición de
  // la vista previa encima si la hay (solo pasa en editor).
  const contenidoDe = (tipo) => {
    const base = site.secciones.find((s) => s.tipo === tipo)?.contenido || {};
    return vistaPrevia[tipo] ? { ...base, ...vistaPrevia[tipo].contenido } : base;
  };

  const welcome = contenidoDe("welcome");
  const musica = contenidoDe("musica");
  const servidores = contenidoDe("servidores");
  const fotos = contenidoDe("fotos");
  const infoBoda = contenidoDe("informacion_boda");
  const novios = { el: welcome.novioEl, ella: welcome.novioElla };
  const contexto = { novios, fotosSubidas: site.fotosSubidas };
  const fotosNovios = [...(site.fotosSubidas || []), ...(fotos.urls || [])];

  // Participación y servidores sustituyen a la invitación entera: cuando una
  // de las dos está abierta no se dibuja ni la portada ni el cuerpo.
  const enPaginaAparte = enAnuncio || enServidores;

  // Secciones del cuerpo con las superposiciones aplicadas y respetando la
  // visibilidad que se esté previsualizando.
  const seccionesCuerpo = site.secciones
    .map((s) => {
      const ov = vistaPrevia[s.tipo];
      return ov ? { ...s, contenido: { ...s.contenido, ...ov.contenido }, activo: ov.activo } : s;
    })
    .filter((s) => s.tipo !== "welcome" && s.tipo !== "musica")
    .filter((s) => s.activo !== false);

  const Diseno = DISENOS_ALTERNATIVOS[site.invitacion?.diseno];
  if (Diseno && !enPaginaAparte) {
    return (
      <Suspense fallback={null}>
        <Diseno
          site={site}
          contenidoDe={contenidoDe}
          invitacion={invitacion}
          enEditor={enEditor}
          onEnviarRSVP={(respuestas, acompanantes) => submitRSVP(slug, codigo, respuestas, acompanantes)}
        />
      </Suspense>
    );
  }

  return (
    <EditorProvider
      activo={enEditor}
      ubicaciones={site.ubicaciones || []}
      onCambioLocal={cambiarUbicacion}
      onRecargar={cargar}
    >
      <DecorProvider overrides={site.decoraciones} ubicaciones={site.ubicaciones || []}>
        <div className="font-body">
          <PaperBackground src={site.fondoUrl} />

          {enAnuncio && !enEditor && (
            <Anuncio
              novios={novios}
              fecha={infoBoda.fecha}
              titulo={welcome.anuncioTitulo}
              texto={welcome.anuncioTexto}
              fotos={fotosNovios}
              tituloFotos={fotos.titulo}
              subtituloFotos={fotos.subtitulo}
            />
          )}

          {/* Sí se dibuja en el editor, al revés que la participación: es la
              única forma de que el panel enseñe la vista previa de esta
              tarjeta mientras se escribe, porque no vive dentro del cuerpo de
              la invitación. */}
          {enServidores && (
            <Servidores
              // Sin coincidencia cae en la tarjeta común: un enlace mal
              // copiado enseña algo con sentido en vez de una página vacía.
              persona={personaDelEnlace(servidores.personas, servidorEnlace)}
              personas={servidores.personas || []}
              novios={novios}
              fecha={infoBoda.fecha}
              titulo={servidores.titulo}
              subtitulo={servidores.subtitulo}
              texto={servidores.texto}
              versiculo={servidores.versiculo}
              cierre={servidores.cierre}
            />
          )}

          {!enPaginaAparte && !opened && (
            <Welcome
              novios={novios}
              padres={{
                el: { padre: welcome.padreElPadre, madre: welcome.padreElMadre },
                ella: { padre: welcome.padreEllaPadre, madre: welcome.padreEllaMadre },
                texto: welcome.padresTexto,
              }}
              frase={welcome.fraseIntro}
              bienvenidaTexto={welcome.bienvenidaTexto}
              invitacion={invitacion}
              onOpen={() => setOpened(true)}
            />
          )}

          {!enPaginaAparte && opened && (
            <main className="fade-up relative">
              {/* Decoraciones de zona libre: sus coordenadas son porcentajes
                  de toda la invitación, no de una sección, así que pueden
                  quedar a caballo entre dos. */}
              <CapaDecorativa seccionTipo={ZONA_LIBRE} capa="detras" />

              <div className={`relative z-10 ${enEditor ? "pointer-events-none" : ""}`}>
                {seccionesCuerpo.map((s) => renderSeccion(s, contexto))}

                {/* El contenido de la sección manda para que la vista previa del
                    editor se vea; site.fechaLimiteConfirmacion es el respaldo de
                    cuando la sección está oculta, donde el servidor sigue
                    aplicando el plazo igual y el sitio se quedaba sin saberlo. */}
                {invitacion && (
                  <RSVP
                    invitacion={invitacion}
                    fechaLimite={
                      infoBoda.fechaLimiteConfirmacion || site.fechaLimiteConfirmacion
                    }
                    opciones={{
                      mostrarRestriccion: infoBoda.mostrarRestriccion !== false,
                      mostrarObservaciones: infoBoda.mostrarObservaciones !== false,
                    }}
                    onSubmit={(respuestas, acompanantes) =>
                      submitRSVP(slug, codigo, respuestas, acompanantes)
                    }
                  />
                )}

                <FinalScreen novios={novios} />
              </div>

              <CapaDecorativa seccionTipo={ZONA_LIBRE} capa="delante" />
            </main>
          )}

          {/* Fuera de la portada y del cuerpo: el botón de música se ve desde
              el primer momento (también sobre la portada) y la canción arranca
              sola. Por eso vive aquí y no dentro de <main>. En la participación
              no suena: es un enlace de difusión amplia y no conviene autoplay. */}
          {!enEditor && (
            <MusicToggle src={site.audioUrl || musica.src} titulo={musica.titulo} />
          )}
        </div>
      </DecorProvider>
    </EditorProvider>
  );
}
