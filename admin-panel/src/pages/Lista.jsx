import ListaConfirmados from "./ListaConfirmados";

// La lista de personas era una tarjeta al fondo de Resumen, después de los
// contadores: había que saber que estaba ahí para encontrarla. Es la pantalla
// que se le pasa a la wedding planner, así que ahora tiene su propia entrada
// en el menú.
export default function Lista() {
  return (
    <div>
      <h2 className="panel-titulo">Lista de personas</h2>
      <p className="panel-subtitulo mb-6">
        Una línea por persona, no por invitación. Se actualiza sola conforme responden; puedes
        exportarla a Excel o imprimirla en PDF.
      </p>
      <ListaConfirmados />
    </div>
  );
}
