import { useEffect, useState } from "react";
import { api } from "../api";
import { ir } from "../ruta";
import { SubNav } from "../ui/Marco";
import MensajesInvitados from "./MensajesInvitados";
import { ESTADOS, haceCuanto } from "./comun";

// Todo lo que llega al WhatsApp de Sivú en un solo lugar: lo que escriben los
// clientes potenciales y lo que responden los invitados de todos los eventos.
// /mensajes/clientes y /mensajes/invitados.

function MensajesClientes() {
  const [lista, setLista] = useState(null);

  useEffect(() => {
    const cargar = () => api.crm.prospectos().then(setLista).catch(() => setLista([]));
    cargar();
    const t = setInterval(cargar, 30000);
    return () => clearInterval(t);
  }, []);

  const conMensajes = (lista || [])
    .filter((p) => p.ultimo_mensaje)
    .sort((a, b) => (b.sin_leer > 0) - (a.sin_leer > 0));

  return (
    <div>
      <h2 className="panel-titulo">Mensajes de clientes</h2>
      <p className="panel-subtitulo mb-6">
        Lo último que se habló con cada cliente potencial por el WhatsApp de Sivú. Toca uno para ver la conversación completa en su ficha.
      </p>
      {!lista ? (
        <p className="text-sm text-ink-tenue">Cargando...</p>
      ) : !conMensajes.length ? (
        <div className="vacio">
          <p className="text-sm text-ink-suave">Todavía no hay conversaciones guardadas con clientes.</p>
          <p className="ayuda mt-1">Aparecen aquí cuando un cliente le escribe al WhatsApp vinculado de Sivú, o cuando tú le escribes desde ahí.</p>
        </div>
      ) : (
        <div className="tarjeta p-0 overflow-hidden">
          {conMensajes.map((p) => (
            <button
              key={p.id}
              onClick={() => ir(`/clientes/${p.id}`)}
              className="w-full text-left px-4 py-3 border-t border-borde first:border-t-0 !rounded-none hover:bg-lienzo flex items-start gap-3"
            >
              <span className="w-9 h-9 shrink-0 rounded-full bg-marca-suave text-marca-dark grid place-items-center text-sm font-semibold">
                {(p.nombre || "?").trim().charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink truncate">{p.nombre || `+${p.telefono}`}</span>
                  <span className={`insignia ${ESTADOS[p.estado]?.clase || "insignia-neutra"}`}>{ESTADOS[p.estado]?.nombre || p.estado}</span>
                  <span className="ml-auto text-[11px] text-ink-tenue shrink-0">{haceCuanto(p.creado_en)}</span>
                </span>
                <span className={`block mt-0.5 text-[13px] truncate ${p.sin_leer > 0 ? "text-ink font-medium" : "text-ink-suave"}`}>
                  {p.ultimo_direccion === "saliente" ? "Tú: " : ""}
                  {p.ultimo_mensaje}
                </span>
              </span>
              {p.sin_leer > 0 && (
                <span className="text-[10px] font-semibold bg-emerald-600 text-white rounded-full px-1.5 py-0.5 self-center">{p.sin_leer}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Bandeja({ sub }) {
  const parte = sub === "invitados" ? "invitados" : "clientes";
  return (
    <div>
      <SubNav
        opciones={[
          ["clientes", "Clientes"],
          ["invitados", "Invitados"],
        ]}
        activo={parte}
        onIr={(k) => ir(`/mensajes/${k}`, { reemplazar: true })}
      />
      {parte === "clientes" ? <MensajesClientes /> : <MensajesInvitados />}
    </div>
  );
}
