// Plantillas de arranque para una invitación nueva.
//
// Cada tipo de evento arranca con un contenido genérico y corto, fácil de
// reemplazar desde el panel. A propósito NO se clona el contenido real de
// "Maite & Ricardo" (la boda marcada es_plantilla=true, preservada por la
// migración 019): esa fila sigue viviendo en la base como la primera
// invitación del sistema y como referencia de lo que es una boda terminada,
// pero copiar sus textos y su dirección de verdad dentro del borrador de un
// cliente nuevo filtraría los datos personales del dueño a cada cuenta que
// se cree. La plantilla de "boda" de aquí abajo es deliberadamente genérica,
// con la misma forma de contenido (las mismas claves) que usa esa boda real.

export const TIPOS_EVENTO = [
  "boda",
  "xv",
  "baby_shower",
  "cumpleanos",
  "bautizo",
  "corporativo",
  "otro",
];

// Diseños con los que el sitio puede dibujar una invitación (columna
// invitaciones.diseno). Tiene que coincidir con src/disenos del sitio.
export const DISENOS = ["clasico", "jardin", "ensueno", "gala", "lazos", "coquette", "paris"];

export const NOMBRE_TIPO_EVENTO = {
  boda: "Boda",
  xv: "XV años",
  baby_shower: "Baby shower",
  cumpleanos: "Cumpleaños",
  bautizo: "Bautizo",
  corporativo: "Evento corporativo",
  otro: "Otro evento",
};

// Misma paleta de fábrica para todos los tipos: es un punto de partida
// neutro (beige/dorado, ya probado en la boda real) y el dueño la cambia por
// completo desde "Colores" según la identidad de cada cliente.
// Cada diseño es un paquete completo: además de sus adornos (que viven en el
// código del sitio) trae sus colores y sus letras. Al crear un evento en blanco
// o al cambiarle el diseño se escriben estas claves en su tema; los textos, los
// invitados y las fotos no se tocan.
const TEMA_JARDIN = [
  ["color-paper", "#FBFAF2"],
  ["color-ink", "#4C5638"],
  ["color-gold", "#7F9663"],
  ["color-gold-light", "#C9D6B0"],
  ["color-gold-dark", "#5B6F45"],
  ["color-marble", "#EEF1E4"],
  ["color-seal", "#9C7B34"],
  ["fuente-titulos", "Pinyon Script"],
  ["fuente-cuerpo", "Cormorant Garamond"],
];

const TEMA_ENSUENO = [
  ["color-paper", "#FBFCFB"],
  ["color-ink", "#1F3A34"],
  ["color-gold", "#2E6B5C"],
  ["color-gold-light", "#A8DCC8"],
  ["color-gold-dark", "#24564A"],
  ["color-marble", "#FCE6DA"],
  ["color-seal", "#A9512F"],
  ["fuente-titulos", "Cormorant Garamond"],
  ["fuente-cuerpo", "Nunito Sans"],
];

const TEMA_GALA = [
  ["color-paper", "#0A0A0B"],
  ["color-ink", "#F3F1EC"],
  ["color-gold", "#D4FF3A"],
  ["color-gold-light", "#E2FF78"],
  ["color-gold-dark", "#141416"],
  ["color-marble", "#1C1C1F"],
  ["color-seal", "#A3A3AA"],
  ["fuente-titulos", "Unbounded"],
  ["fuente-cuerpo", "Manrope"],
];

const TEMA_LAZOS = [
  ["color-paper", "#FFF8FA"],
  ["color-ink", "#5B2C3D"],
  ["color-gold", "#C9638A"],
  ["color-gold-light", "#F5C9D6"],
  ["color-gold-dark", "#9E3D62"],
  ["color-marble", "#FDE8EF"],
  ["color-seal", "#B48A5A"],
  ["fuente-guion", "Ballet"],
  ["fuente-titulos", "Bodoni Moda"],
  ["fuente-cuerpo", "Jost"],
];

// Coquette comparte la paleta de Moños y perlas pero no sus letras: cada
// plantilla tiene su propia combinación.
const TEMA_COQUETTE = [
  ...TEMA_LAZOS.filter(([clave]) => !clave.startsWith("fuente-")),
  ["fuente-guion", "Dancing Script"],
  ["fuente-titulos", "Fraunces"],
  ["fuente-cuerpo", "Quicksand"],
];


const TEMA_PARIS = [
  ["color-paper", "#FBF3F0"],
  ["color-ink", "#4E3236"],
  ["color-gold", "#B76E79"],
  ["color-gold-light", "#EBC8C4"],
  ["color-gold-dark", "#8C4E58"],
  ["color-marble", "#F6E7E3"],
  ["color-seal", "#C9A27E"],
  ["fuente-guion", "Parisienne"],
  ["fuente-titulos", "Marcellus"],
  ["fuente-cuerpo", "Josefin Sans"],
];

const TEMAS_DISENO = { jardin: TEMA_JARDIN, ensueno: TEMA_ENSUENO, gala: TEMA_GALA, lazos: TEMA_LAZOS, coquette: TEMA_COQUETTE, paris: TEMA_PARIS };

export function temaDeDiseno(diseno) {
  const tema = TEMAS_DISENO[diseno];
  return tema ? tema.map((par) => [...par]) : temaBase();
}

export function temaBase() {
  return [
    ["color-paper", "#F8F4EE"],
    ["color-ink", "#5C4530"],
    ["color-gold", "#B8924A"],
    ["color-gold-light", "#D9BE87"],
    ["color-gold-dark", "#8C6A2E"],
    ["color-marble", "#EFEAE1"],
    ["color-seal", "#8A5A34"],
    ["fuente-titulos", "Playfair Display"],
    ["fuente-cuerpo", "Cormorant Garamond"],
  ];
}

// Las cinco decoraciones de fábrica, sin imagen propia (datos = NULL): cada
// invitación nueva las estrena en blanco y el sitio usa el arte por defecto
// que ya trae el código hasta que alguien suba una imagen personalizada.
export function decoracionesBase() {
  return [
    { clave: "scrollwork", etiqueta: "Filigrana de esquina" },
    { clave: "bouquet", etiqueta: "Ramillete floral" },
    { clave: "frame", etiqueta: "Marco ornamental (nombres)" },
    { clave: "column", etiqueta: "Columna" },
    { clave: "divider", etiqueta: "Divisor de patrón" },
  ];
}

function s(tipo, titulo_panel, orden, contenido, activo = true) {
  return { tipo, titulo_panel, orden, activo, contenido };
}

// Plantillas genéricas por tipo de evento. Todas reutilizan los mismos
// "tipo" de sección que ya sabe dibujar SectionRenderer.jsx — nada de tablas
// nuevas — y solo cambian título del panel y contenido inicial.
const PLANTILLAS = {
  boda: (nombre) => [
    s("welcome", "Bienvenida y nombres", 1, {
      bienvenidaTexto: "Bienvenidos a nuestra boda",
      novioEl: nombre || "Nombre de la novia",
      novioElla: "Nombre del novio",
      padresTexto: "Con la bendición de nuestros padres",
      padreElPadre: "Nombre del padre",
      padreElMadre: "Nombre de la madre",
      padreEllaPadre: "Nombre del padre",
      padreEllaMadre: "Nombre de la madre",
      fraseIntro: "Nos encantaría que nos acompañes en este día tan especial.",
    }),
    s("fotos", "Fotos de los novios", 2, {
      titulo: "Nuestras fotos",
      subtitulo: "Los novios",
      urls: [],
    }),
    s("informacion_boda", "Información de la boda", 3, {
      overline: "Ceremonia",
      tituloSeccion: "Información de la boda",
      tituloItinerario: "Itinerario",
      lugar: "Lugar de la ceremonia",
      direccion: "Dirección",
      fecha: null,
      mapsUrl: "",
      mapaEmbed: "",
      fechaLimiteConfirmacion: null,
      mostrarRestriccion: true,
      mostrarObservaciones: true,
      cronogramaModo: "detallado",
      cronogramaMensaje: "Les compartiremos el orden del día más cerca de la fecha.",
      cronograma: [
        { hora: "5:00 pm", titulo: "Ceremonia" },
        { hora: "6:00 pm", titulo: "Brindis" },
        { hora: "7:00 pm", titulo: "Recepción" },
      ],
    }),
    s("sobres", "Lluvia de sobres", 4, {
      texto: "Su presencia es el mejor regalo. Si desean tener un detalle con nosotros, lo recibimos con cariño mediante una lluvia de sobres.",
    }),
    s("vestimenta", "Código de vestimenta", 5, {
      titulo: "Formal",
      permitidos: [{ nombre: "Toda la gama pastel", colores: ["#F6D8DE", "#F8DFC8", "#DDEBD0", "#CFE1F2"] }],
      evitar: [{ nombre: "Blanco", color: "#F7F0E3" }],
    }),
    s("historia", "Nuestra historia", 6, {
      texto: "Aquí va la historia de cómo se conocieron.",
    }),
    s("padrinos", "Padrinos", 7, {
      titulo: "Padrinos de nuestra boda",
      grupos: [{ etiqueta: "Padrinos", personas: ["Nombre", "Nombre"] }],
    }),
    s("info_importante", "Información importante", 8, {
      items: ["Evento solo para invitados confirmados."],
      nota: "",
    }),
    s("faq", "Preguntas frecuentes", 9, { items: [] }),
    s("musica", "Música de fondo", 10, { titulo: "", src: "" }),
  ],

  xv: (nombre) => [
    s("welcome", "Bienvenida y nombre", 1, {
      bienvenidaTexto: "Mis XV años",
      novioEl: nombre || "Nombre de la quinceañera",
      novioElla: "",
      padresTexto: "Con la bendición de mis padres",
      padreElPadre: "Nombre del padre",
      padreElMadre: "Nombre de la madre",
      padreEllaPadre: "",
      padreEllaMadre: "",
      fraseIntro: "Quiero compartir contigo uno de los días más especiales de mi vida.",
    }),
    s("informacion_boda", "Información del evento", 2, {
      overline: "Mis quince años",
      tituloSeccion: "Información del evento",
      tituloItinerario: "Programa",
      lugar: "Salón de eventos",
      direccion: "Dirección del salón",
      fecha: null,
      mapsUrl: "",
      mapaEmbed: "",
      fechaLimiteConfirmacion: null,
      mostrarRestriccion: true,
      mostrarObservaciones: true,
      cronogramaModo: "detallado",
      cronogramaMensaje: "Les compartiremos el programa más cerca de la fecha.",
      cronograma: [
        { hora: "6:00 pm", titulo: "Recepción" },
        { hora: "7:00 pm", titulo: "Entrada de la quinceañera" },
        { hora: "8:00 pm", titulo: "Vals" },
        { hora: "9:00 pm", titulo: "Cena" },
        { hora: "10:00 pm", titulo: "Fiesta" },
      ],
    }),
    s("padrinos", "Padres y padrinos", 3, {
      titulo: "Padres y padrinos",
      grupos: [
        { etiqueta: "Padres", personas: ["Nombre del padre", "Nombre de la madre"] },
        { etiqueta: "Padrinos de honor", personas: ["Nombre", "Nombre"] },
      ],
    }),
    s("vestimenta", "Código de vestimenta", 4, {
      titulo: "Formal",
      permitidos: [{ nombre: "Toda la gama pastel", colores: ["#F6D8DE", "#F8DFC8", "#DDEBD0", "#CFE1F2"] }],
      evitar: [{ nombre: "Blanco", color: "#F7F0E3" }],
    }),
    s("regalos", "Mesa de regalos", 5, {
      titulo: "Mesa de regalos",
      texto: "Tu presencia es el mejor regalo. Si deseas tener un detalle, aquí tienes algunas opciones.",
      enlaces: [],
      datosTransferencia: "",
    }),
    s("info_importante", "Información importante", 6, {
      items: ["Evento solo para invitados confirmados."],
      nota: "",
    }),
    s("faq", "Preguntas frecuentes", 7, { items: [] }),
    s("historia", "Mi historia", 8, {
      texto: "Aquí va un texto corto sobre la quinceañera.",
    }, false),
    s("sobres", "Lluvia de sobres", 9, {
      texto: "Tu presencia es el mejor regalo. Si deseas tener un detalle conmigo, lo recibiré con cariño en una lluvia de sobres.",
    }, false),
    s("musica", "Música de fondo", 10, { titulo: "", src: "" }),
  ],

  baby_shower: (nombre) => [
    s("welcome", "Bienvenida y nombre", 1, {
      bienvenidaTexto: "Se acerca un nuevo bebé",
      novioEl: nombre || "Nombre de la mamá",
      novioElla: "",
      padresTexto: "",
      padreElPadre: "",
      padreElMadre: "",
      padreEllaPadre: "",
      padreEllaMadre: "",
      fraseIntro: "Queremos celebrar contigo la llegada de nuestro bebé.",
    }),
    s("informacion_boda", "Información del evento", 2, {
      overline: "Baby shower",
      tituloSeccion: "Información del evento",
      tituloItinerario: "Programa",
      lugar: "Lugar del evento",
      direccion: "Dirección",
      fecha: null,
      mapsUrl: "",
      mapaEmbed: "",
      fechaLimiteConfirmacion: null,
      mostrarRestriccion: true,
      mostrarObservaciones: true,
      cronogramaModo: "mensaje",
      cronogramaMensaje: "Tarde de juegos, torta y muchas sorpresas para el bebé.",
      cronograma: [],
    }),
    s("regalos", "Lista de regalos", 3, {
      titulo: "Lista de regalos",
      texto: "Tu compañía es un regalo en sí. Si deseas traer algo para el bebé, esta es nuestra lista.",
      enlaces: [],
      datosTransferencia: "",
    }),
    s("sobres", "Lluvia de sobres", 4, {
      texto: "Si prefieres un detalle en efectivo para el bebé, lo recibimos con cariño en una lluvia de sobres.",
    }),
    s("faq", "Preguntas frecuentes", 5, { items: [] }),
  ],

  cumpleanos: (nombre) => [
    s("welcome", "Bienvenida y nombre", 1, {
      bienvenidaTexto: "¡Estás invitado a mi cumpleaños!",
      novioEl: nombre || "Nombre del cumpleañero/a",
      novioElla: "",
      padresTexto: "",
      padreElPadre: "",
      padreElMadre: "",
      padreEllaPadre: "",
      padreEllaMadre: "",
      fraseIntro: "Quiero celebrar este día contigo.",
    }),
    s("informacion_boda", "Información del evento", 2, {
      overline: "Cumpleaños",
      tituloSeccion: "Información del evento",
      tituloItinerario: "Programa",
      lugar: "Lugar del evento",
      direccion: "Dirección",
      fecha: null,
      mapsUrl: "",
      mapaEmbed: "",
      fechaLimiteConfirmacion: null,
      mostrarRestriccion: true,
      mostrarObservaciones: true,
      cronogramaModo: "oculto",
      cronogramaMensaje: "",
      cronograma: [],
    }),
    s("regalos", "Lista de regalos", 3, {
      titulo: "Lista de regalos",
      texto: "Tu presencia es el mejor regalo. Si quieres traer algo, aquí van algunas ideas.",
      enlaces: [],
      datosTransferencia: "",
    }),
    s("faq", "Preguntas frecuentes", 4, { items: [] }),
  ],

  bautizo: (nombre) => [
    s("welcome", "Bienvenida y nombre", 1, {
      bienvenidaTexto: "Bautizo",
      novioEl: nombre || "Nombre del bautizado/a",
      novioElla: "",
      padresTexto: "Hijo/a de",
      padreElPadre: "Nombre del padre",
      padreElMadre: "Nombre de la madre",
      padreEllaPadre: "",
      padreEllaMadre: "",
      fraseIntro: "Nos encantaría que nos acompañes en este día tan especial.",
    }),
    s("informacion_boda", "Información del evento", 2, {
      overline: "Ceremonia de bautizo",
      tituloSeccion: "Información del evento",
      tituloItinerario: "Programa",
      lugar: "Iglesia o parroquia",
      direccion: "Dirección",
      fecha: null,
      mapsUrl: "",
      mapaEmbed: "",
      fechaLimiteConfirmacion: null,
      mostrarRestriccion: true,
      mostrarObservaciones: true,
      cronogramaModo: "detallado",
      cronogramaMensaje: "",
      cronograma: [
        { hora: "10:00 am", titulo: "Ceremonia" },
        { hora: "12:00 pm", titulo: "Celebración" },
      ],
    }),
    s("padrinos", "Padres y padrinos", 3, {
      titulo: "Padres y padrinos",
      grupos: [
        { etiqueta: "Padres", personas: ["Nombre del padre", "Nombre de la madre"] },
        { etiqueta: "Padrinos", personas: ["Nombre", "Nombre"] },
      ],
    }),
    s("faq", "Preguntas frecuentes", 4, { items: [] }),
  ],

  corporativo: (nombre) => [
    s("welcome", "Bienvenida", 1, {
      bienvenidaTexto: "Te invitamos",
      novioEl: nombre || "Nombre del evento",
      novioElla: "",
      padresTexto: "",
      padreElPadre: "",
      padreElMadre: "",
      padreEllaPadre: "",
      padreEllaMadre: "",
      fraseIntro: "Será un gusto contar con tu presencia.",
    }),
    s("informacion_boda", "Información y agenda", 2, {
      overline: "Registro",
      tituloSeccion: "Información del evento",
      tituloItinerario: "Agenda",
      lugar: "Sede del evento",
      direccion: "Dirección",
      fecha: null,
      mapsUrl: "",
      mapaEmbed: "",
      fechaLimiteConfirmacion: null,
      mostrarRestriccion: false,
      mostrarObservaciones: true,
      cronogramaModo: "detallado",
      cronogramaMensaje: "",
      cronograma: [
        { hora: "8:00 am", titulo: "Registro de asistentes" },
        { hora: "9:00 am", titulo: "Apertura" },
      ],
    }),
    // Una gala o una cena de empresa casi siempre pide código de vestimenta e
    // indicaciones; arrancan ocultas para los eventos que no las necesitan.
    s("vestimenta", "Código de vestimenta", 3, { titulo: "Elegante sport", nota: "", permitidos: [], evitar: [] }, false),
    s("info_importante", "Información importante", 4, { items: [], nota: "" }, false),
    s("faq", "Preguntas frecuentes", 5, { items: [] }),
  ],

  otro: (nombre) => [
    s("welcome", "Bienvenida", 1, {
      bienvenidaTexto: "Te invitamos",
      novioEl: nombre || "Nombre del evento",
      novioElla: "",
      padresTexto: "",
      padreElPadre: "",
      padreElMadre: "",
      padreEllaPadre: "",
      padreEllaMadre: "",
      fraseIntro: "Nos encantaría contar contigo.",
    }),
    s("informacion_boda", "Información del evento", 2, {
      overline: "Información",
      tituloSeccion: "Información del evento",
      tituloItinerario: "Programa",
      lugar: "Lugar del evento",
      direccion: "Dirección",
      fecha: null,
      mapsUrl: "",
      mapaEmbed: "",
      fechaLimiteConfirmacion: null,
      mostrarRestriccion: false,
      mostrarObservaciones: true,
      cronogramaModo: "oculto",
      cronogramaMensaje: "",
      cronograma: [],
    }),
    s("faq", "Preguntas frecuentes", 3, { items: [] }),
  ],
};

// Cualquier tipo_evento no reconocido cae a "otro" para no romper la
// creación de una invitación nueva.
export function plantillaSecciones(tipoEvento, nombre) {
  const fn = PLANTILLAS[tipoEvento];
  return fn ? fn(nombre) : PLANTILLAS.otro(nombre);
}
