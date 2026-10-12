// Espejo de server/plantillas.js: el tipo de evento decide qué contenido
// trae de fábrica una invitación nueva. Vive duplicado (front y back son dos
// proyectos aparte) pero son solo estas siete líneas.
export const TIPOS_EVENTO = [
  "boda",
  "xv",
  "baby_shower",
  "cumpleanos",
  "bautizo",
  "corporativo",
  "otro",
];

export const NOMBRE_TIPO_EVENTO = {
  boda: "Boda",
  xv: "XV años",
  baby_shower: "Baby shower",
  cumpleanos: "Cumpleaños",
  bautizo: "Bautizo",
  corporativo: "Evento corporativo",
  otro: "Otro evento",
};

// Espejo de DISENOS en server/plantillas.js: cómo se dibuja el sitio.
export const DISENOS = [
  { key: "clasico", nombre: "Clásico (papel y dorado)" },
  { key: "jardin", nombre: "Jardín encantado (acuarela verde)" },
  { key: "ensueno", nombre: "Ensueño (acuarela menta y durazno)" },
  { key: "gala", nombre: "Gala (negro y lima neón)" },
  { key: "lazos", nombre: "Moños y perlas (rosa palo, satén y perlas)" },
  { key: "coquette", nombre: "Coquette (rosa con moños ilustrados)" },
  { key: "paris", nombre: "París rosé (rosa empolvado y oro rosa)" },
  { key: "valle", nombre: "Valle de luna (acuarela azul noche, boda)" },
  { key: "valle-claro", nombre: "Valle claro (acuarela azul cielo, boda)" },
  { key: "celebracion", nombre: "Celebración dorada (crema y oro, cumpleaños de varias personas)" },
];
