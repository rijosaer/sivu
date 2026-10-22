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
  { key: "celebracion-azul", nombre: "Celebración azul (crema y azul loza, cumpleaños de varias personas)" },
  { key: "eucalipto", nombre: "Eucalipto (azul plata y flores blancas, boda)" },
  { key: "luces", nombre: "Luces de verano (luces colgantes y ámbar, boda)" },
  { key: "vals", nombre: "Vals lila (telón lila y plata, xv)" },
  { key: "luz", nombre: "Luz de bautizo (vela, olivo y oro, bautizo)" },
  { key: "confeti", nombre: "Confeti (globos durazno y oro, cumpleaños)" },
  { key: "dulce", nombre: "Dulce 30 (caramelo y vainilla, cumpleaños)" },
  { key: "birrete", nombre: "Birrete (vino y oro, graduación)" },
  { key: "medianoche", nombre: "Medianoche (esmeralda y oro art-déco, corporativo)" },
  { key: "osito", nombre: "Osito (osito, nubes y salvia, baby shower)" },
];
