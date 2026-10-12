import ValleDeLuna from "./Valle";
import noche from "./arte/claro/noche.webp";
import rama from "./arte/claro/rama.webp";
import esquina from "./arte/claro/esquina.webp";

// Diseño «Valle claro»: el mismo Valle de luna con azul cielo empolvado en
// lugar de azul noche. Cambian las acuarelas (más luminosas) y los colores
// del tema; la hacienda sepia y todo lo demás se comparten.
const ARTE = { noche, rama, esquina };

export default function ValleClaro(props) {
  return <ValleDeLuna {...props} arte={ARTE} variante="claro" />;
}
