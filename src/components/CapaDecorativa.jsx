import { useRef } from "react";
import { useDecor } from "../theme/DecorContext";
import { useEditor } from "../editor/EditorContext";

// Ámbito especial: la decoración no pertenece a ninguna sección, se coloca
// sobre toda la invitación. Sirve para las que deben quedar a caballo entre
// dos secciones, donde un anclaje por sección las cortaría.
export const ZONA_LIBRE = "__global__";

// Dibuja las decoraciones colocadas en una sección. Las coordenadas son
// porcentajes del alto y ancho de esa sección, así que la posición aguanta
// cualquier tamaño de pantalla.
//
// En modo editor (?editor=1, dentro del panel) las decoraciones se pueden
// arrastrar: el arrastre ocurre aquí, sobre el sitio real, y el panel solo
// recibe la posición nueva y la guarda.
export default function CapaDecorativa({ seccionTipo, capa }) {
  const { ubicaciones, imagenDe } = useDecor();
  const editor = useEditor();
  const capaRef = useRef(null);
  const arrastre = useRef(null);

  const items = ubicaciones.filter((u) => u.seccion_tipo === seccionTipo && u.capa === capa);
  if (!items.length) return null;

  function alPresionar(e, item) {
    if (!editor.activo) return;
    e.preventDefault();
    e.stopPropagation();
    const caja = capaRef.current.getBoundingClientRect();
    arrastre.current = {
      id: item.id,
      caja,
      inicioX: e.clientX,
      inicioY: e.clientY,
      origenX: item.x,
      origenY: item.y,
      movido: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    editor.seleccionar(item.id);
  }

  function alMover(e) {
    const a = arrastre.current;
    if (!a) return;
    const dx = ((e.clientX - a.inicioX) / a.caja.width) * 100;
    const dy = ((e.clientY - a.inicioY) / a.caja.height) * 100;
    if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) a.movido = true;
    // Se permite salirse un poco del borde: muchas decoraciones se ven mejor
    // asomando por la esquina que encajadas por completo dentro.
    const x = Math.min(115, Math.max(-25, a.origenX + dx));
    const y = Math.min(115, Math.max(-25, a.origenY + dy));
    editor.moverEnVivo(a.id, x, y);
  }

  function alSoltar(e) {
    const a = arrastre.current;
    arrastre.current = null;
    if (!a) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (a.movido) editor.confirmarMovimiento(a.id);
  }

  return (
    <div
      ref={capaRef}
      aria-hidden="true"
      // pointer-events explícito en el editor: el contenido que envuelve a
      // esta capa lleva pointer-events-none, y sin esto la capa lo heredaría
      // y las decoraciones no se podrían agarrar.
      className={`absolute inset-0 overflow-hidden ${
        capa === "delante" ? "z-20" : "z-0"
      } ${editor.activo ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      {items.map((item) => {
        const src = imagenDe(item.clave);
        if (!src) return null;
        const seleccionada = editor.activo && editor.seleccionadaId === item.id;
        return (
          <img
            key={item.id}
            src={src}
            alt=""
            draggable={false}
            onPointerDown={(e) => alPresionar(e, item)}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
            className={`absolute select-none ${
              editor.activo ? "cursor-move touch-none pointer-events-auto" : "pointer-events-none"
            } ${seleccionada ? "outline outline-2 outline-offset-2 outline-sky-500" : ""}`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.ancho}%`,
              opacity: item.opacidad,
              transform: `rotate(${item.rotacion}deg)`,
              transformOrigin: "center",
              // La seleccionada sube al frente para poder agarrarla aunque
              // otra decoración la esté tapando.
              zIndex: seleccionada ? 50 : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
