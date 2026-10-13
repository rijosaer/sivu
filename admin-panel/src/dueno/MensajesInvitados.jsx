import { useEffect, useState } from "react";
import { api } from "../api";
import { haceCuanto, waUrl } from "./comun";

// Lo que escriben los invitados al WhatsApp de Sivú, de todos los eventos:
// sus chats se archivan tras el envío, así que aquí es donde se leen.
export default function MensajesInvitados() {
  const [mensajes, setMensajes] = useState(null);
  const [evento, setEvento] = useState("");

  useEffect(() => {
    const cargar = () => api.crm.mensajesInvitados().then(setMensajes).catch(() => setMensajes([]));
    cargar();
    const t = setInterval(cargar, 30000);
    return () => clearInterval(t);
  }, []);

  const eventos = [...new Map((mensajes || []).map((m) => [m.invitacion_id, m.evento])).entries()];
  const visibles = (mensajes || []).filter((m) => !evento || String(m.invitacion_id) === evento);

  return (
    <div>
      <h2 className="panel-titulo">Mensajes de invitados</h2>
      <p className="panel-subtitulo mb-4">
        Lo que los invitados le escriben al WhatsApp de Sivú. Sus chats quedan archivados después del envío; aquí no se pierde nada.
      </p>
      {eventos.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
          <button onClick={() => setEvento("")} className={`chip-filtro shrink-0 ${!evento ? "chip-filtro-activo" : ""}`}>
            Todos
          </button>
          {eventos.map(([id, nombre]) => (
            <button key={id} onClick={() => setEvento(String(id))} className={`chip-filtro shrink-0 ${evento === String(id) ? "chip-filtro-activo" : ""}`}>
              {nombre}
            </button>
          ))}
        </div>
      )}
      <ListaMensajes mensajes={visibles} mostrarEvento />
    </div>
  );
}

export function ListaMensajes({ mensajes, mostrarEvento }) {
  if (!mensajes) return <p className="text-sm text-ink-tenue">Cargando...</p>;
  if (!mensajes.length)
    return (
      <div className="vacio">
        <p className="text-sm text-ink-suave">Todavía no hay mensajes de invitados.</p>
        <p className="ayuda mt-1">Cuando un invitado le responda al WhatsApp de Sivú, aparece aquí.</p>
      </div>
    );
  return (
    <div className="tarjeta p-0 overflow-hidden">
      {mensajes.map((m) => (
        <div key={m.id} className={`px-4 py-3 border-t border-borde first:border-t-0 ${m.leido ? "" : "bg-emerald-50/40"}`}>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="font-medium text-ink">{m.invitado || m.nombre_contacto || `+${m.telefono}`}</span>
            {mostrarEvento && m.evento && <span className="insignia insignia-neutra">{m.evento}</span>}
            {m.direccion === "saliente" && <span className="insignia insignia-info">Sivú</span>}
            <span className="text-ink-tenue ml-auto">{haceCuanto(m.creado_en)}</span>
          </div>
          <p className="text-[13px] text-ink-suave mt-1 whitespace-pre-wrap break-words">{m.texto || <i>({m.tipo})</i>}</p>
          {m.direccion !== "saliente" && (
            <a href={waUrl(m.telefono)} target="_blank" rel="noreferrer" className="boton-texto !text-[11px] mt-1 inline-flex">
              Responder en WhatsApp
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
