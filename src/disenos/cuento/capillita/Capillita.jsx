import Cuento from "../Cuento";
import "./capillita.css";
import escenaFondo from "./arte/escena-fondo.webp";
import escenaFigura from "./arte/escena-figura.webp";
import escenaCerca from "./arte/escena-cerca.webp";
import titular from "./arte/titular.webp";
import capilla from "./arte/capilla.webp";
import mesa from "./arte/mesa.webp";
import vestido from "./arte/vestido.webp";
import regalo from "./arte/regalo.webp";
import farol from "./arte/farol.webp";
import figuraFinal from "./arte/figura-final.webp";
import maceta1 from "./arte/maceta-1.webp";
import maceta2 from "./arte/maceta-2.webp";
import maceta3 from "./arte/maceta-3.webp";
import maceta4 from "./arte/maceta-4.webp";
import ramita1 from "./arte/ramita-1.webp";
import ramita2 from "./arte/ramita-2.webp";
import ramita3 from "./arte/ramita-3.webp";

// Diseño «Capillita» (primera comunión): un pueblo colonial colombiano pintado
// en gouache, con balcones, buganvilias y una capilla blanca al fondo.
// - Entrada «de la puerta a la calle»: al cargar, la cámara está frente a la
//   puerta iluminada de la capilla; luego retrocede por la calle empedrada
//   y aparece la niña caminando hacia ella. Primero se ve a quién va la
//   invitación.
// - Cuerpo: una pared encalada con ramas de buganvilia corre por toda la
//   página. Los capítulos clave llevan su título en una placa de azulejo
//   pintado, como las placas de las casas del pueblo; la cuenta regresiva va
//   en materas de geranios.
// Colores del tema: papel = cal, principal = azul cobalto del azulejo, claro
// = rosa pálido, oscuro = azul hondo, mármol = blanco cal, sello = buganvilia.
// Letras: Courgette, Gelasio y Source Sans 3.

const CONFIG = {
  clave: "capillita",
  fuentes: "https://fonts.googleapis.com/css2?family=Courgette&family=Gelasio:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:ital,wght@0,400;0,700;1,400&display=swap",
  escena: {
    w: 864,
    h: 1536,
    capas: [
      { src: escenaFondo, k: 1, clase: "cu-capa-fondo" },
      { src: escenaFigura, k: 1.6, clase: "cu-capa-figura cu-capa-quieta", alt: (n) => `${n || "La niña"} vestida de primera comunión camina por una calle empedrada hacia una capilla blanca` },
      { src: escenaCerca, k: 2, clase: "cu-capa-cerca" },
    ],
    viaje: [
      { t: 0, fx: 0.545, fy: 0.56, z: 2.5 },
      { t: 1.6, fx: 0.545, fy: 0.57, z: 2.3 },
      { t: 5.4, fx: 0.5, fy: 0.5, z: 1 },
    ],
  },
  union: null,
  soporte: titular,
  soporteEn: ["bienvenida", "ceremonia", "confirmar"],
  piezas: { ceremonia: capilla, programa: mesa, vestimenta: vestido, regalos: regalo, confirmar: farol },
  cuenta: [maceta1, maceta2, maceta3, maceta4],
  adornos: {
    bienvenida: [{ src: ramita1, clase: "cu-adorno-der cu-adorno-rama" }],
    padrinos: [{ src: ramita2, clase: "cu-adorno-izq cu-adorno-rama cu-adorno-espejo" }],
    historia: [{ src: ramita3, clase: "cu-adorno-der cu-adorno-rama cu-adorno-bajo" }],
  },
  final: { fondo: null, figura: figuraFinal },
  textos: {
    portada: "Mi primera comunión",
    anteBienvenida: "Con alegría",
    bienvenida: "Bienvenidos",
    hijoDe: "hija de",
    anteCeremonia: "Te espero en",
    ceremonia: "La misa",
    antePrograma: "Ese domingo",
    antePadrinos: "Me acompañan",
    padrinos: "Mis padrinos",
    anteHistoria: "Mi camino",
    gracias: "¡Te espero!",
  },
};

export default function Capillita(props) {
  return <Cuento config={CONFIG} {...props} />;
}
