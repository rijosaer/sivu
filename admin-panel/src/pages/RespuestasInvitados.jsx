import { useEffect, useState } from "react";
import { api } from "../api";
import { ListaMensajes } from "../dueno/MensajesInvitados";

// Dentro de un evento: lo que sus invitados le escribieron al WhatsApp de
// Sivú («gracias», «¿puedo llevar a alguien?», «¿a qué hora es?»).
export default function RespuestasInvitados() {
  const [mensajes, setMensajes] = useState(null);

  useEffect(() => {
    let vivo = true;
    const cargar = () =>
      api
        .mensajesEvento()
        .then((m) => {
          if (!vivo) return;
          setMensajes(m);
          if (m.some((x) => !x.leido)) api.marcarMensajesLeidos().catch(() => {});
        })
        .catch(() => vivo && setMensajes([]));
    cargar();
    const t = setInterval(cargar, 30000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div>
      <h2 className="panel-titulo">Respuestas por WhatsApp</h2>
      <p className="panel-subtitulo mb-6">
        Lo que los invitados escribieron al WhatsApp de Sivú después de recibir su invitación. Las confirmaciones de asistencia siguen
        llegando por el enlace de cada uno.
      </p>
      <ListaMensajes mensajes={mensajes} />
    </div>
  );
}
