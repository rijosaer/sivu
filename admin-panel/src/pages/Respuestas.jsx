import ListaConfirmados from "./ListaConfirmados";
import RespuestasInvitados from "./RespuestasInvitados";

// Quién va, quién no y quién falta, por persona (no por invitación), con la
// descarga en PDF o Excel. Debajo, lo que escribieron por WhatsApp. Antes la
// lista estaba en Invitados → «Lista de personas» y los mensajes en
// Invitados → WhatsApp.
export default function Respuestas() {
  const exportar = window.location.pathname.split("/").filter(Boolean)[3] === "exportar";
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="font-display text-[1.6rem] text-ink leading-tight">¿Quién va?</h2>
        <p className="text-[14px] text-ink-suave mt-1 mb-5 max-w-[64ch]">
          Una línea por persona, no por invitación. Se actualiza sola mientras responden. Descárgala para el lugar, la comida o la entrada.
        </p>
        <ListaConfirmados abrirExportar={exportar} />
      </div>
      <div className="separador" />
      <RespuestasInvitados />
    </div>
  );
}
