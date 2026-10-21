import Cuento from "../Cuento";
import "./bosquecito.css";
import escenaFondo from "./arte/escena-fondo.webp";
import escenaFigura from "./arte/escena-figura.webp";
import escenaCerca from "./arte/escena-cerca.webp";
import titular from "./arte/titular.webp";
import kiosco from "./arte/kiosco.webp";
import torta from "./arte/torta.webp";
import ropa from "./arte/ropa.webp";
import regalos from "./arte/regalos.webp";
import conejo from "./arte/conejo.webp";
import figuraFinal from "./arte/figura-final.webp";
import globo1 from "./arte/globo-1.webp";
import globo2 from "./arte/globo-2.webp";
import globo3 from "./arte/globo-3.webp";
import globo4 from "./arte/globo-4.webp";
import hongos1 from "./arte/hongos-1.webp";
import hongos2 from "./arte/hongos-2.webp";
import hongos3 from "./arte/hongos-3.webp";

// Diseño «Bosquecito» (cumpleaños infantil): un picnic en un claro del
// bosque con animalitos, pintado en gouache soleado.
// - Entrada «el paseo por el bosque»: la escena es apaisada y la cámara la
//   recorre de lado; al cargar arranca a la izquierda, con el erizo y el
//   conejo que traen un regalo, y camina hasta la fiesta en el centro.
// - Cuerpo: un claro de bosque con helechos en los bordes corre por toda la
//   página. Los capítulos clave llevan su título en un letrero de madera con
//   una ardilla; la cuenta regresiva va en globos y los hongos salen a los
//   lados.
// Colores del tema: papel = verde claro, principal = fresa, claro = miel,
// oscuro = verde bosque, mármol = crema, sello = azul cielo.
// Letras: Sniglet, Baloo 2 y Lexend.

const CONFIG = {
  clave: "bosquecito",
  fuentes: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700&family=Lexend:wght@400;600&family=Sniglet:wght@400;800&display=swap",
  escena: {
    w: 1536,
    h: 864,
    capas: [
      { src: escenaFondo, k: 0.9, clase: "cu-capa-fondo" },
      { src: escenaFigura, k: 1, clase: "cu-capa-figura", alt: (n) => `${n || "El cumpleañero"} celebra un picnic en el bosque con un zorro, un oso y una ardilla` },
      { src: escenaCerca, k: 1.25, clase: "cu-capa-cerca" },
    ],
    viaje: [
      { t: 0, fx: 0.15, fy: 0.55, z: 1.12 },
      { t: 1.4, fx: 0.16, fy: 0.55, z: 1.12 },
      { t: 5.6, fx: 0.5, fy: 0.5, z: 1 },
    ],
  },
  union: null,
  soporte: titular,
  soporteEn: ["bienvenida", "ceremonia", "confirmar"],
  piezas: { ceremonia: kiosco, programa: torta, vestimenta: ropa, regalos, confirmar: conejo },
  cuenta: [globo1, globo2, globo3, globo4],
  adornos: {
    bienvenida: [{ src: hongos1, clase: "cu-adorno-der cu-adorno-bajo cu-adorno-hongo" }],
    padrinos: [{ src: hongos2, clase: "cu-adorno-izq cu-adorno-bajo cu-adorno-hongo" }],
    faq: [{ src: hongos3, clase: "cu-adorno-der cu-adorno-bajo cu-adorno-hongo" }],
  },
  final: { fondo: null, figura: figuraFinal },
  textos: {
    portada: "¡Ven a mi fiesta!",
    anteBienvenida: "En el bosque",
    bienvenida: "¡Hola!",
    hijoDe: "hijo de",
    anteCeremonia: "Nos vemos en",
    ceremonia: "La fiesta",
    antePrograma: "Ese día",
    antePadrinos: "Me acompañan",
    padrinos: "Mis padrinos",
    anteHistoria: "Te cuento",
    gracias: "¡Te espero!",
  },
};

export default function Bosquecito(props) {
  return <Cuento config={CONFIG} {...props} />;
}
