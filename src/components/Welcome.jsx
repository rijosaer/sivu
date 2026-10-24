import Divider from "./Divider";
import OrnateFrame from "./OrnateFrame";
import ParentsInvitation from "./ParentsInvitation";
import CapaDecorativa from "./CapaDecorativa";
import { useEditor } from "../editor/EditorContext";

const ETIQUETA_TIPO = {
  familia: "Invitación especial para la familia",
  pareja: "Invitación especial para",
  individual: "Invitación especial para",
  cupos: "Invitación especial para",
};

// El nombre grande de la portada. En pareja se arman los dos nombres a partir
// de los miembros, porque el campo "nombre" suele traer solo el de quien
// encabeza la invitación.
function nombreDestacado(invitacion) {
  const miembros = invitacion.miembros || [];
  if (invitacion.tipo === "familia") return invitacion.familia || invitacion.nombre;
  if (invitacion.tipo === "pareja" && miembros.length === 2) {
    return `${miembros[0].nombre} & ${miembros[1].nombre}`;
  }
  return invitacion.nombre;
}

function BloqueInvitado({ invitacion }) {
  const nombre = nombreDestacado(invitacion);
  if (!nombre) return null;

  const miembros = invitacion.miembros || [];
  // En familia el nombre grande es el apellido, así que debajo se listan las
  // personas incluidas para que quede claro a quiénes cubre la invitación.
  const listar = invitacion.tipo === "familia" && miembros.length > 0;
  // En las de cupos no hay a quién listar todavía: lo que hay que dejar claro
  // es cuánta gente puede traer, antes de que abra la invitación.
  const cupos = invitacion.tipo === "cupos" ? invitacion.cupos || 0 : 0;

  return (
    <div className="mt-7 w-full max-w-[17rem] sm:max-w-sm mx-auto border-y border-gold/40 bg-paper/85 py-5 px-4">
      <p className="font-mono text-[10px] tracking-widest2 uppercase text-gold-dark/70 mb-3">
        {ETIQUETA_TIPO[invitacion.tipo] || ETIQUETA_TIPO.individual}
      </p>

      <p className="font-script text-3xl sm:text-4xl leading-tight text-gold-dark break-words">
        {nombre}
      </p>

      {listar && (
        <p className="mt-3 font-mono text-[10px] tracking-widest2 uppercase text-ink/55 leading-relaxed">
          {miembros.map((m) => m.nombre).join(" · ")}
        </p>
      )}

      {cupos > 0 && (
        <p className="mt-3 font-mono text-[10px] tracking-widest2 uppercase text-ink/55 leading-relaxed">
          + {cupos} {cupos === 1 ? "cupo" : "cupos"} para acompañantes
        </p>
      )}

      {invitacion.mensaje && (
        <p className="mt-3 font-body text-xs italic text-ink/60 leading-relaxed">
          {invitacion.mensaje}
        </p>
      )}
    </div>
  );
}

export default function Welcome({ novios, padres, frase, bienvenidaTexto, invitacion, onOpen }) {
  const editor = useEditor();

  return (
    // Sin fondo propio a propósito: así se ve el de toda la invitación, sea
    // el papel de CSS o la imagen que se haya subido desde el panel.
    <div
      className="fixed inset-0 z-50 text-ink overflow-y-auto overflow-x-hidden"
      // Un toque en cualquier parte de la portada abre (en el editor no: ahí se
      // arrastran las decoraciones).
      onClick={(e) => { if (!editor.activo && !e.target.closest("button, a")) onOpen(); }}
    >
      {/* Este envoltorio relativo es el que ancla las decoraciones de la
          portada: sus posiciones son porcentajes de esta caja, así que tiene
          que envolver todo el contenido, no solo la parte visible. */}
      <div className="relative min-h-full flex flex-col items-center justify-center px-6 pt-10 pb-24 text-center">
        <CapaDecorativa seccionTipo="welcome" capa="detras" />

        {/* Todo el texto por encima de las decoraciones, pase lo que pase. En
            el editor deja pasar el puntero para poder agarrarlas. */}
        <div
          className={`relative z-10 w-full flex flex-col items-center ${
            editor.activo ? "pointer-events-none" : ""
          }`}
        >
          <p className="font-mono text-[11px] tracking-widest2 uppercase mb-2 text-gold-dark">
            {bienvenidaTexto || "Bienvenidos a nuestra boda civil"}
          </p>

          <div className="max-w-[17rem] sm:max-w-md mx-auto">
            <ParentsInvitation padres={padres} />
          </div>

          <OrnateFrame className="w-72 h-[26rem] sm:w-80 sm:h-[30rem] mt-2">
            <h1 className="font-display text-4xl sm:text-5xl leading-tight text-gold-dark">
              {novios.el}
              <span className="font-display italic text-ink/70 text-2xl mx-2 align-middle block sm:inline">
                &
              </span>
              {novios.ella}
            </h1>
          </OrnateFrame>

          <div className="mt-6">
            <Divider />
          </div>

          {invitacion && <BloqueInvitado invitacion={invitacion} />}

          <p className="mt-6 max-w-[17rem] sm:max-w-sm text-ink/70 font-body text-sm leading-relaxed">
            {frase}
          </p>

          <button
            onClick={onOpen}
            className="mt-10 min-h-[48px] border transition-colors duration-300 px-9 py-3.5 font-mono text-[15px] tracking-widest2 uppercase border-gold-dark bg-gold-dark text-paper hover:bg-gold hover:border-gold"
          >
            Abrir invitación
          </button>
        </div>

        <CapaDecorativa seccionTipo="welcome" capa="delante" />
      </div>
    </div>
  );
}
