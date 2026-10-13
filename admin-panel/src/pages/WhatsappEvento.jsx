import RespuestasInvitados from "./RespuestasInvitados";
import Mensajes from "./Mensajes";

// Todo lo de WhatsApp de un evento en un solo lugar: lo que los invitados
// escribieron y, debajo, los textos con los que salen los mensajes.
export default function WhatsappEvento() {
  return (
    <div className="flex flex-col gap-12">
      <RespuestasInvitados />
      <div className="separador" />
      <Mensajes />
    </div>
  );
}
