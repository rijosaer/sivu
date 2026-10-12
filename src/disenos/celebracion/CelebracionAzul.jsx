import Celebracion from "./Celebracion";

// Diseño «Celebración azul»: la misma tarjeta de Celebración dorada en azul
// de loza sobre crema (los colores vienen del tema). Todos los nombres de los
// festejados van en el mismo azul, sin alternar con el verde.
export default function CelebracionAzul(props) {
  return <Celebracion {...props} variante="azul" />;
}
