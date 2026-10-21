import Cuento from "../Cuento";
import "./cometas.css";
import escenaFondo from "./arte/escena-fondo.webp";
import escenaFigura from "./arte/escena-figura.webp";
import escenaCerca from "./arte/escena-cerca.webp";
import titular from "./arte/titular.webp";
import iglesia from "./arte/iglesia.webp";
import mirador from "./arte/mirador.webp";
import ropa from "./arte/ropa.webp";
import regalo from "./arte/regalo.webp";
import carta from "./arte/carta.webp";
import figuraFinal from "./arte/figura-final.webp";
import cometa1 from "./arte/cometa-1.webp";
import cometa2 from "./arte/cometa-2.webp";
import cometa3 from "./arte/cometa-3.webp";
import cometa4 from "./arte/cometa-4.webp";
import diente1 from "./arte/diente-1.webp";
import diente2 from "./arte/diente-2.webp";
import diente3 from "./arte/diente-3.webp";

// Diseño «Cometas» (confirmación): una loma colombiana al atardecer donde un
// muchacho eleva una cometa, pintada en gouache cálido.
// - Entrada «subir con las cometas»: al cargar, la cámara está cerca del
//   muchacho en la loma; sube siguiendo la cuerda hasta las cometas en el
//   cielo y vuelve a abrirse al paisaje completo.
// - Cuerpo: el cielo del atardecer corre por toda la página y se va hacia
//   el lila del anochecer. Los capítulos clave llevan su título en el
//   banderín de tela que arrastra una cometa; la cuenta regresiva va en
//   cuatro cometas de colores y los dientes de león flotan a los lados.
// Colores del tema: papel = albaricoque claro, principal = coral, claro =
// amarillo dorado, oscuro = ciruela del anochecer, mármol = crema, sello =
// lila. Letras: Caveat, Bree Serif y Hanken Grotesk.

const CONFIG = {
  clave: "cometas",
  fuentes: "https://fonts.googleapis.com/css2?family=Bree+Serif&family=Caveat:wght@600;700&family=Hanken+Grotesk:ital,wght@0,400;0,700;1,400&display=swap",
  escena: {
    w: 864,
    h: 1536,
    capas: [
      { src: escenaFondo, k: 0.7, clase: "cu-capa-fondo" },
      { src: escenaFigura, k: 1, clase: "cu-capa-figura", alt: (n) => `${n || "El muchacho"} eleva una cometa en una loma al atardecer` },
      { src: escenaCerca, k: 1.35, clase: "cu-capa-cerca" },
    ],
    viaje: [
      { t: 0, fx: 0.34, fy: 0.66, z: 1.55 },
      { t: 1.4, fx: 0.35, fy: 0.64, z: 1.5 },
      { t: 3.8, fx: 0.62, fy: 0.2, z: 1.45 },
      { t: 5.8, fx: 0.5, fy: 0.5, z: 1 },
    ],
  },
  union: null,
  soporte: titular,
  soporteEn: ["bienvenida", "ceremonia", "confirmar"],
  piezas: { ceremonia: iglesia, programa: mirador, vestimenta: ropa, regalos: regalo, confirmar: carta },
  cuenta: [cometa1, cometa2, cometa3, cometa4],
  adornos: {
    bienvenida: [{ src: diente1, clase: "cu-adorno-der cu-adorno-diente" }],
    padrinos: [{ src: diente2, clase: "cu-adorno-izq cu-adorno-diente" }],
    historia: [{ src: diente3, clase: "cu-adorno-der cu-adorno-diente cu-adorno-bajo" }],
  },
  final: { fondo: null, figura: figuraFinal },
  textos: {
    portada: "Mi confirmación",
    anteBienvenida: "Un paso de fe",
    bienvenida: "Bienvenidos",
    hijoDe: "hijo de",
    anteCeremonia: "Nos vemos en",
    ceremonia: "La ceremonia",
    antePrograma: "Ese sábado",
    antePadrinos: "Me acompañan",
    padrinos: "Mis padrinos",
    anteHistoria: "Lo que me trajo aquí",
    gracias: "¡Te espero!",
  },
};

export default function Cometas(props) {
  return <Cuento config={CONFIG} {...props} />;
}
