import Cuento from "../Cuento";
import "./cielito.css";
import escenaFondo from "./arte/escena-fondo.webp";
import escenaPersonaje from "./arte/escena-personaje.webp";
import escenaCerca from "./arte/escena-cerca.webp";
import arcoiris from "./arte/arcoiris.webp";
import capilla from "./arte/capilla.webp";
import mesa from "./arte/mesa.webp";
import tendedero from "./arte/tendedero.webp";
import regalo from "./arte/regalo.webp";
import pajaroSobre from "./arte/pajaro-sobre.webp";
import cinta from "./arte/cinta.webp";
import nubes from "./arte/nubes.webp";
import canasta from "./arte/canasta.webp";
import nubecita1 from "./arte/nubecita-1.webp";
import nubecita2 from "./arte/nubecita-2.webp";
import nubecita3 from "./arte/nubecita-3.webp";
import nubecita4 from "./arte/nubecita-4.webp";
import pajaro1 from "./arte/pajaro-1.webp";
import pajaro2 from "./arte/pajaro-2.webp";
import pajaro3 from "./arte/pajaro-3.webp";
import pajaro4 from "./arte/pajaro-4.webp";

// Diseño «Cielito» (bautizo): un libro de cuentos pintado en gouache pastel.
// - Entrada «la viñeta que se vuelve cielo»: al cargar se ve la escena
//   chiquita, con borde pintado sobre papel crema, y arriba a quién va la
//   invitación. Sola, la viñeta crece hasta llenar la pantalla y la cámara
//   sube al cielo, baja hasta el bebé dormido en la canasta y se aleja
//   mientras pasan las nubes de adelante.
// - Cuerpo: un cielo pintado que atardece de celeste a durazno. La cinta que
//   llevan dos pajaritos anuncia solo la bienvenida, la ceremonia y la
//   confirmación; los demás títulos van con letras y trazo. La cuenta
//   regresiva va sobre nubecitas.
// Colores del tema: papel = cielo claro, principal = azul pajarito, claro =
// durazno de las nubes, oscuro = azul profundo, mármol = nube crema, sello =
// melocotón. Letras: Playball, Corben y Atkinson Hyperlegible.

const CONFIG = {
  clave: "cielito",
  fuentes: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Corben:wght@400;700&family=Playball&display=swap",
  escena: {
    w: 864,
    h: 1536,
    vineta: true,
    capas: [
      { src: escenaFondo, k: 0.55, clase: "cu-capa-fondo" },
      { src: escenaPersonaje, k: 1, clase: "cu-capa-figura", alt: (n) => `${n || "El bebé"} dormido en una canasta de mimbre entre las nubes, sostenida por pajaritos` },
      { src: escenaCerca, k: 1.55, clase: "cu-capa-cerca" },
    ],
    // m: cuánto creció la viñeta (0 = chiquita sobre el papel).
    viaje: [
      { t: 0, fx: 0.5, fy: 0.5, z: 1, m: 0 },
      { t: 1.8, fx: 0.5, fy: 0.5, z: 1, m: 0 },
      { t: 3.2, fx: 0.45, fy: 0.24, z: 1.6, m: 1 },
      { t: 5.2, fx: 0.5, fy: 0.5, z: 1.45, m: 1 },
      { t: 6.8, fx: 0.5, fy: 0.5, z: 1, m: 1 },
    ],
  },
  union: nubes,
  soporte: cinta,
  soporteEn: ["bienvenida", "ceremonia", "confirmar"],
  piezas: { bienvenida: arcoiris, ceremonia: capilla, programa: mesa, vestimenta: tendedero, regalos: regalo, confirmar: pajaroSobre },
  cuenta: [nubecita1, nubecita2, nubecita3, nubecita4],
  adornos: {
    bienvenida: [{ src: pajaro1, clase: "cu-adorno-der" }],
    ceremonia: [{ src: pajaro4, clase: "cu-adorno-izq cu-adorno-espejo" }],
    padrinos: [{ src: pajaro2, clase: "cu-adorno-izq cu-adorno-bajo cu-adorno-espejo" }],
    historia: [{ src: pajaro3, clase: "cu-adorno-der cu-adorno-bajo" }],
  },
  final: { fondo: nubes, figura: canasta },
  textos: {
    portada: "Mi bautizo",
    anteBienvenida: "Con el corazón lleno",
    bienvenida: "Bienvenidos",
    hijoDe: "hija de",
    anteCeremonia: "Nos vemos en",
    ceremonia: "La ceremonia",
    antePrograma: "Para ese día",
    antePadrinos: "Me acompañan en la fe",
    padrinos: "Mis padrinos",
    anteHistoria: "Había una vez…",
    gracias: "¡Te esperamos!",
  },
};

export default function Cielito(props) {
  return <Cuento config={CONFIG} {...props} />;
}
