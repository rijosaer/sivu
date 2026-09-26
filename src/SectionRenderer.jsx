import Gallery from "./components/Gallery";
import InformacionBoda from "./components/InformacionBoda";
import { GiftEnvelope, ImportantInfo, Faq } from "./components/InfoBlocks";
import DressCode from "./components/DressCode";
import OurStory from "./components/OurStory";
import Menu from "./components/Menu";
import Accommodation from "./components/Accommodation";
import Transport from "./components/Transport";
import PadresPadrinos from "./components/PadresPadrinos";
import ListaRegalos from "./components/ListaRegalos";
import CapaDecorativa from "./components/CapaDecorativa";
import { useEditor } from "./editor/EditorContext";

// Convierte el "contenido" (JSON libre, editable desde el panel) de cada
// sección en las props que espera su componente. "welcome" y "musica" no
// están aquí porque se manejan aparte (portada y botón flotante).
const REGISTRO = {
  fotos: (c, { fotosSubidas }) => (
    // Primero las que se subieron desde el panel, después las que estén
    // puestas como enlaces externos.
    <Gallery
      fotos={[...(fotosSubidas || []), ...(c.urls || [])]}
      titulo={c.titulo}
      subtitulo={c.subtitulo}
    />
  ),
  informacion_boda: (c, { novios }) => (
    <InformacionBoda
      info={{
        // Los tres de aquí abajo dejan que un baby shower, unos XV o un
        // evento corporativo reusen esta misma sección sin decir "Ceremonia
        // civil": si no vienen en el contenido (como en la boda real, de
        // antes de que existiera este campo), se ven exactamente igual que
        // siempre.
        overline: c.overline || "Ceremonia civil",
        tituloSeccion: c.tituloSeccion || "Información de la boda",
        tituloItinerario: c.tituloItinerario || "Itinerario",
        lugar: c.lugar,
        direccion: c.direccion,
        fecha: c.fecha,
        mapsUrl: c.mapsUrl,
        mapaEmbed: c.mapaEmbed,
        cronograma: c.cronograma || [],
        cronogramaModo: c.cronogramaModo || "detallado",
        cronogramaMensaje: c.cronogramaMensaje || "",
      }}
      novios={novios}
    />
  ),
  sobres: (c) => <GiftEnvelope texto={c.texto} />,
  vestimenta: (c) => (
    <DressCode
      dressCode={{
        titulo: c.titulo,
        permitidos: c.permitidos || [],
        evitar: c.evitar || [],
      }}
    />
  ),
  historia: (c) => <OurStory texto={c.texto} />,
  menu: (c) => <Menu menu={{ nota: c.nota, opciones: c.opciones || [] }} />,
  alojamiento: (c) => <Accommodation hoteles={c.hoteles || []} />,
  transporte: (c) => <Transport opciones={c.opciones || []} />,
  info_importante: (c) => <ImportantInfo items={c.items || []} nota={c.nota} />,
  faq: (c) => <Faq items={c.items || []} />,
  // Módulos pequeños reutilizables entre tipos de evento (XV años, baby
  // shower, cumpleaños, bautizos...), con el mismo mecanismo de "sección con
  // contenido JSON libre" que ya usa todo lo de arriba.
  padrinos: (c) => <PadresPadrinos titulo={c.titulo} grupos={c.grupos || []} />,
  regalos: (c) => (
    <ListaRegalos
      titulo={c.titulo}
      texto={c.texto}
      enlaces={c.enlaces || []}
      datosTransferencia={c.datosTransferencia}
    />
  ),
};

function Seccion({ seccion, contexto, render }) {
  const editor = useEditor();

  return (
    // El contenedor relativo es lo que ancla las decoraciones: sus posiciones
    // son porcentajes de esta caja, no de la pantalla.
    <div className="relative" data-seccion={seccion.tipo}>
      <CapaDecorativa seccionTipo={seccion.tipo} capa="detras" />
      {/* Las decoraciones "detrás" quedan bajo el contenido, que por tanto se
          lleva los clics. En el editor el contenido deja pasar el puntero para
          poder agarrarlas, sin alterar cómo se ven. */}
      <div className={`relative z-10 ${editor.activo ? "pointer-events-none" : ""}`}>
        {render(seccion.contenido || {}, contexto)}
      </div>
      <CapaDecorativa seccionTipo={seccion.tipo} capa="delante" />
    </div>
  );
}

export function renderSeccion(seccion, contexto) {
  const render = REGISTRO[seccion.tipo];
  if (!render) return null;
  return (
    <Seccion
      key={seccion.id ?? seccion.tipo}
      seccion={seccion}
      contexto={contexto}
      render={render}
    />
  );
}
