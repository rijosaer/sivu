import Celebracion from "./Celebracion";

// Diseño «Celebración azul»: la misma tarjeta de Celebración dorada en azul
// de loza sobre crema (los colores vienen del tema). El ramillete es la misma
// acuarela teñida de azul loza con un filtro, y los nombres alternan rosa
// (sello del tema) y azul en lugar de rosa y verde.
export default function CelebracionAzul(props) {
  return <Celebracion {...props} variante="azul" />;
}
