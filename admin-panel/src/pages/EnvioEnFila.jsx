import { useState } from "react";
import { api } from "../api";
import { useToast } from "../ui/Toast";
import { enlaceWhatsApp, normalizarTelefono } from "../whatsapp";

// Envío uno por uno desde el WhatsApp de quien usa el panel. Es la forma de
// que el cliente mande sus propias tarjetas sin conectar su número al
// servidor: cada mensaje lo envía él desde su teléfono o su computador, con
// el texto ya escrito, y el panel lleva la cuenta de por dónde va.
//
// armarItems(tipo) es el mismo armado del envío automático (misma plantilla,
// mismo enlace, mismo grupo elegido), con la invitación de cada mensaje.

export default function EnvioEnFila({ armarItems, onCambio, onCerrar }) {
  const toast = useToast();
  const [tipo, setTipo] = useState("invitacion");
  const [indice, setIndice] = useState(0);
  const [abiertos, setAbiertos] = useState(() => new Set());
  // Se arma al elegir el tipo y queda fijo mientras se envía: si la lista se
  // recalculara al marcar cada enviada, el siguiente se saltaría solo.
  const [fila, setFila] = useState(() => armarItems("invitacion"));
  // Cuántos hay de cada tipo ahora mismo (para los botones de arriba).
  const cuenta = { invitacion: armarItems("invitacion").length, recordatorio: armarItems("recordatorio").length };

  const actual = fila[indice];
  const terminado = indice >= fila.length;

  function elegirTipo(nuevo) {
    setTipo(nuevo);
    setFila(armarItems(nuevo));
    setIndice(0);
    setAbiertos(new Set());
  }

  async function abrir() {
    if (!actual) return;
    window.open(enlaceWhatsApp(actual.telefono, actual.texto), "_blank", "noopener");
    setAbiertos((s) => new Set(s).add(actual.invitado_id));
    // La invitación inicial cuenta como enviada al abrir WhatsApp (el panel no
    // puede saber si de verdad se envió; se puede desmarcar en la tarjeta).
    if (tipo === "invitacion") {
      try {
        await api.actualizarInvitado(actual.invitado_id, { enviado: true });
        onCambio();
      } catch (e) {
        toast(e.message || "No se pudo marcar como enviada", "error");
      }
    }
  }

  return (
    <section className="tarjeta p-5 mb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h3 className="bloque-titulo">Enviar uno por uno</h3>
          <p className="ayuda mt-0.5 max-w-prose">
            Se abre tu WhatsApp con el mensaje escrito: tú lo envías y vuelves aquí por el siguiente. Sale desde tu
            número, sin conectarlo a Sivú.
          </p>
        </div>
        <button onClick={onCerrar} className="boton-texto">
          Cerrar
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => elegirTipo("invitacion")}
          className={`chip-filtro ${tipo === "invitacion" ? "chip-filtro-activo" : ""}`}
        >
          Invitaciones sin enviar <span className="chip-cuenta">{cuenta.invitacion}</span>
        </button>
        <button
          onClick={() => elegirTipo("recordatorio")}
          className={`chip-filtro ${tipo === "recordatorio" ? "chip-filtro-activo" : ""}`}
        >
          Recordatorios a quienes faltan <span className="chip-cuenta">{cuenta.recordatorio}</span>
        </button>
      </div>

      {!fila.length ? (
        <p className="text-sm text-ink-tenue">
          {tipo === "invitacion"
            ? "No hay invitaciones sin enviar con un teléfono válido."
            : "No hay a quién recordarle: todos respondieron o el plazo ya cerró."}
        </p>
      ) : terminado ? (
        <div className="text-sm">
          <p className="text-emerald-700">Listo: recorriste los {fila.length} mensajes.</p>
          <button onClick={() => setIndice(0)} className="boton-texto mt-2">
            Volver al primero
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_320px] gap-4 items-start">
          <div>
            <p className="text-xs text-ink-tenue">
              {indice + 1} de {fila.length}
            </p>
            <p className="text-base font-medium text-ink mt-0.5">{actual.nombre}</p>
            <p className="ayuda">+{normalizarTelefono(actual.telefono)}</p>
            <div className="w-full h-1.5 rounded-full bg-lienzo mt-3 overflow-hidden">
              <div className="h-full bg-marca transition-all" style={{ width: `${(indice / fila.length) * 100}%` }} />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {abiertos.has(actual.invitado_id) ? (
                <button onClick={() => setIndice((i) => i + 1)} className="boton-primario">
                  Siguiente →
                </button>
              ) : (
                <button onClick={abrir} className="boton-verde">
                  Abrir WhatsApp
                </button>
              )}
              {abiertos.has(actual.invitado_id) && (
                <button onClick={abrir} className="boton-texto">
                  Abrir de nuevo
                </button>
              )}
              {!abiertos.has(actual.invitado_id) && (
                <button onClick={() => setIndice((i) => i + 1)} className="boton-texto">
                  Saltar
                </button>
              )}
              {indice > 0 && (
                <button onClick={() => setIndice((i) => i - 1)} className="boton-texto">
                  ← Anterior
                </button>
              )}
            </div>
          </div>
          <div className="bg-[#e7f6d8] border border-[#d4ecc0] rounded-xl rounded-tr-sm px-3.5 py-2.5 text-[13px] leading-relaxed text-[#111b21] whitespace-pre-wrap break-words">
            {actual.texto}
          </div>
        </div>
      )}
    </section>
  );
}
