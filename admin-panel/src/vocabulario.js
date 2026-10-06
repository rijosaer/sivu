import { getInvitacionActual } from "./api";

// El panel es uno solo para todos los tipos de evento y los datos son los
// mismos (welcome.novioEl, padreElPadre…): lo que cambia por tipo es cómo se
// llaman los campos, cuáles sobran y cómo se nombra el evento en los textos.
// Así un cliente de XV ve "Nombre de la quinceañera" y "los XV", no "Nombre 1"
// y "la boda".

const NOTICIA_BODA = `¡Tenemos una hermosa noticia! ✨

Muy pronto comenzaremos una nueva etapa de nuestras vidas: ¡nos casamos! ❤️

Aunque no podamos celebrar este día con todas las personas que apreciamos, queríamos compartir contigo nuestra felicidad y este momento tan especial.


{enlace}`;

const noticiaGenerica = (frase) => `¡Tenemos una hermosa noticia! ✨

${frase}

Aunque no podamos celebrar este día con todas las personas que apreciamos, queríamos compartir contigo esta alegría y este momento tan especial.


{enlace}`;

const PADRES_DE_2 = ["padreEllaPadre", "padreEllaMadre"];
const TODOS_LOS_PADRES = ["padresTexto", "padreElPadre", "padreElMadre", ...PADRES_DE_2];

const VOCABULARIO = {
  boda: {
    elEvento: "la boda",
    resumen: "Cómo va la boda de un vistazo.",
    muestra: { antetitulo: "Nuestra boda", nombres: ["Maite", "Ricardo"] },
    fotos: "Fotos de los novios",
    campos: {},
    ocultarVacios: [],
    noticia: NOTICIA_BODA,
  },
  xv: {
    elEvento: "los XV",
    resumen: "Cómo van los XV de un vistazo.",
    muestra: { antetitulo: "Mis XV años", nombres: ["Valentina"] },
    fotos: "Fotos de la quinceañera",
    campos: {
      novioEl: "Nombre de la quinceañera",
      padresTexto: "Texto antes de los papás",
      padreElPadre: "Papá",
      padreElMadre: "Mamá",
    },
    ocultarVacios: ["novioElla", ...PADRES_DE_2],
    noticia: noticiaGenerica("Estoy por cumplir mis XV años y quería compartir contigo esta felicidad. 👑"),
  },
  baby_shower: {
    elEvento: "el baby shower",
    resumen: "Cómo va el baby shower de un vistazo.",
    muestra: { antetitulo: "Baby shower", nombres: ["Laura"] },
    fotos: "Fotos",
    campos: {
      novioEl: "Nombre de la mamá (o del bebé)",
      novioElla: "Nombre del papá (opcional)",
    },
    ocultarVacios: TODOS_LOS_PADRES,
    noticia: noticiaGenerica("Muy pronto llegará un nuevo integrante a la familia. 🍼"),
  },
  cumpleanos: {
    elEvento: "el cumpleaños",
    resumen: "Cómo va el cumpleaños de un vistazo.",
    muestra: { antetitulo: "Mi cumpleaños", nombres: ["Samuel"] },
    fotos: "Fotos",
    campos: { novioEl: "Nombre del cumpleañero/a" },
    ocultarVacios: ["novioElla", ...TODOS_LOS_PADRES],
    noticia: noticiaGenerica("¡Estoy de cumpleaños y quería compartir contigo esta alegría! 🎉"),
  },
  bautizo: {
    elEvento: "el bautizo",
    resumen: "Cómo va el bautizo de un vistazo.",
    muestra: { antetitulo: "Mi bautizo", nombres: ["Matías"] },
    fotos: "Fotos",
    campos: {
      novioEl: "Nombre del bautizado/a",
      padresTexto: "Texto antes de los papás (ej. «Hijo/a de»)",
      padreElPadre: "Papá",
      padreElMadre: "Mamá",
      padreEllaPadre: "Padrino",
      padreEllaMadre: "Madrina",
    },
    ocultarVacios: ["novioElla"],
    noticia: noticiaGenerica("Muy pronto nuestro bebé recibirá el bautizo. 🕊️"),
  },
  corporativo: {
    elEvento: "el evento",
    resumen: "Cómo va el evento de un vistazo.",
    muestra: { antetitulo: "Te invitamos", nombres: ["Lanzamiento 2027"] },
    fotos: "Fotos",
    campos: {
      novioEl: "Nombre del evento",
      novioElla: "Empresa u organizador (opcional)",
    },
    ocultarVacios: TODOS_LOS_PADRES,
    noticia: noticiaGenerica("Tenemos un evento muy especial y queríamos contártelo."),
  },
  otro: {
    elEvento: "el evento",
    resumen: "Cómo va el evento de un vistazo.",
    muestra: { antetitulo: "Te invitamos", nombres: ["Nuestro evento"] },
    fotos: "Fotos",
    campos: {
      novioEl: "Nombre principal",
      novioElla: "Segundo nombre (opcional)",
    },
    ocultarVacios: [],
    noticia: noticiaGenerica("Tenemos una celebración muy especial y queríamos contártelo."),
  },
};

// Las invitaciones viejas no tenían tipo: eran bodas.
export function vocabulario(tipo = getInvitacionActual()?.tipo_evento) {
  return VOCABULARIO[tipo] || VOCABULARIO.boda;
}

// Etiqueta del campo para este tipo de evento, o null si no cambia (entonces
// se usa la genérica de EditorCampos).
export function etiquetaCampo(clave, v = vocabulario()) {
  return v.campos[clave] || null;
}

// Un campo que no aplica a este tipo se esconde solo si está vacío: si alguien
// ya escribió algo ahí, se sigue mostrando para poder verlo y borrarlo.
export function campoVisible(clave, valor, v = vocabulario()) {
  if (!v.ocultarVacios.includes(clave)) return true;
  return !(valor === "" || valor == null);
}
