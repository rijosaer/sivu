import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../ui/Toast";

// Envío automático de invitaciones (o recordatorios) por el WhatsApp de Sivú.
// El panel arma cada mensaje con la plantilla de «Mensajes» y el servidor los
// manda uno por uno con el ritmo moderado (pausas al azar, tandas con
// descanso y horario de 8 a. m. a 8 p. m.). Aquí se arranca, se sigue el
// avance y se pausa o cancela.

const ESTADOS = {
  en_curso: { texto: "Enviando", clase: "text-emerald-700" },
  pausado: { texto: "En pausa", clase: "text-amber-700" },
  detenido: { texto: "Detenido", clase: "text-red-600" },
  terminado: { texto: "Terminado", clase: "text-ink" },
  cancelado: { texto: "Cancelado", clase: "text-ink-tenue" },
};

// Pequeñas diferencias en el saludo para que no salgan todos los mensajes
// idénticos: «Hola Ana 👋», «Hola, Ana 😊», «Hola Ana»…
const EMOJIS = ["👋", "😊", "🙌", ""];
function variarSaludo(texto) {
  const [primera, ...resto] = texto.split("\n");
  let linea = primera;
  if (/^Hola /.test(linea) && Math.random() < 0.5) linea = linea.replace(/^Hola /, "Hola, ");
  if (/\s👋$/.test(linea)) {
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    linea = linea.replace(/\s👋$/, emoji ? ` ${emoji}` : "");
  }
  return [linea, ...resto].join("\n");
}

// Duración aproximada: pausa media + lo que tarda cada envío («escribiendo…»),
// más un descanso medio por cada tanda completa.
function duracionEstimada(n, ritmo) {
  if (!n || !ritmo) return "";
  const porMensaje = (ritmo.pausaMin + ritmo.pausaMax) / 2 + 6000;
  const descansos = Math.floor((n - 1) / ritmo.tanda) * ((ritmo.descansoMin + ritmo.descansoMax) / 2);
  const min = Math.round(((n - 1) * porMensaje + descansos) / 60000);
  if (min < 60) return `unos ${Math.max(min, 1)} minutos`;
  const h = Math.floor(min / 60);
  const m = Math.round((min % 60) / 5) * 5;
  return `aprox. ${h} h${m ? ` ${m} min` : ""}`;
}

const hora = (iso) =>
  new Date(iso).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" });

export default function EnvioAutomatico({ armarItems, onCambio, onCerrar }) {
  const toast = useToast();
  const [info, setInfo] = useState(null);
  const [tipo, setTipo] = useState("invitacion");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setInfo(await api.envioAutomatico());
    } catch (e) {
      setError(e.message);
    }
  }

  const envio = info?.envio;
  const activo = envio && ["en_curso", "pausado", "detenido"].includes(envio.estado);

  // Mientras hay un envío activo se refresca solo, y la lista de invitaciones
  // también (para que vayan apareciendo como «enviadas»).
  useEffect(() => {
    cargar();
  }, []);
  useEffect(() => {
    if (!activo) return;
    const id = setInterval(() => {
      cargar();
      onCambio();
    }, 8000);
    return () => clearInterval(id);
  }, [activo]);

  const items = armarItems(tipo);
  const conectado = info?.whatsapp === "conectado";

  async function iniciar() {
    const n = items.length;
    const ok = window.confirm(
      `¿Enviar ${n} ${tipo === "invitacion" ? "invitaciones" : "recordatorios"} desde el WhatsApp de Sivú?\n\n` +
        `Salen uno por uno, con pausas de 20 a 45 segundos y un descanso cada ${info.ritmo.tanda}. ` +
        `Tiempo estimado: ${duracionEstimada(n, info.ritmo)}. Puedes pausar o cancelar en cualquier momento.`
    );
    if (!ok) return;
    setOcupado(true);
    setError("");
    try {
      const r = await api.iniciarEnvioAutomatico(
        tipo,
        items.map((i) => ({ ...i, texto: variarSaludo(i.texto) }))
      );
      setInfo((prev) => ({ ...prev, envio: r.envio }));
      toast("Envío automático en marcha");
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function accion(que) {
    if (que === "cancelar" && !window.confirm("¿Cancelar el envío? Los mensajes pendientes no saldrán.")) return;
    setOcupado(true);
    setError("");
    try {
      const r = await api.accionEnvioAutomatico(que);
      setInfo((prev) => ({ ...prev, envio: r.envio }));
      onCambio();
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="tarjeta p-5 mb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h3 className="bloque-titulo">Envío automático por WhatsApp</h3>
          <p className="ayuda mt-0.5 max-w-prose">
            Sale del número de Sivú vinculado, uno por uno: 20 a 45 segundos entre mensajes, un
            descanso de 5 a 10 minutos cada 20, y solo de 8 a. m. a 8 p. m. El servidor sigue
            enviando aunque cierres el panel.
          </p>
        </div>
        <button onClick={onCerrar} className="boton-texto">
          Cerrar
        </button>
      </div>

      {!info && !error && <p className="text-sm text-ink-tenue">Cargando...</p>}

      {info && !conectado && !activo && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          El WhatsApp de Sivú no está vinculado. Vincúlalo en «Tus eventos» → WhatsApp de Sivú y vuelve aquí.
        </p>
      )}

      {/* ---- Envío en marcha ---- */}
      {info && activo && (
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className={`text-sm font-medium ${ESTADOS[envio.estado].clase}`}>
              {ESTADOS[envio.estado].texto} ·{" "}
              {envio.tipo === "invitacion" ? "invitaciones" : "recordatorios"}
            </p>
            <p className="text-xs text-ink-tenue tabular-nums">
              {envio.enviados} de {envio.total} enviados
              {envio.fallidos.length > 0 && ` · ${envio.fallidos.length} con error`}
            </p>
          </div>
          <div className="h-2 rounded-full bg-lienzo overflow-hidden mt-2">
            <div
              className="h-full bg-marca transition-all"
              style={{ width: `${envio.total ? Math.round(((envio.total - envio.pendientes) / envio.total) * 100) : 0}%` }}
            />
          </div>
          <p className="ayuda mt-2">
            {envio.detalle ||
              (envio.estado === "en_curso" && envio.pendientes > 0
                ? `Próximo mensaje hacia las ${hora(envio.siguienteEn)} · faltan ${envio.pendientes} (${duracionEstimada(
                    envio.pendientes,
                    info.ritmo
                  )})`
                : "")}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {envio.estado === "en_curso" && (
              <button onClick={() => accion("pausar")} disabled={ocupado} className="boton-secundario">
                Pausar
              </button>
            )}
            {["pausado", "detenido"].includes(envio.estado) && (
              <button onClick={() => accion("reanudar")} disabled={ocupado || !conectado} className="boton-primario">
                Reanudar
              </button>
            )}
            <button onClick={() => accion("cancelar")} disabled={ocupado} className="boton-peligro">
              Cancelar envío
            </button>
          </div>
        </div>
      )}

      {/* ---- Preparar uno nuevo ---- */}
      {info && !activo && (
        <div>
          {envio && (
            <p className="text-xs text-ink-tenue mb-3">
              Último envío: {ESTADOS[envio.estado].texto.toLowerCase()} · {envio.enviados} de {envio.total} enviados
              {envio.fallidos.length > 0 && ` · ${envio.fallidos.length} con error`}.
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              ["invitacion", "Invitaciones sin enviar"],
              ["recordatorio", "Recordatorio a quienes no responden"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTipo(k)}
                className={`chip-filtro ${tipo === k ? "chip-filtro-activo" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-ink">
            {items.length > 0 ? (
              <>
                Se van a enviar <b>{items.length}</b>{" "}
                {tipo === "invitacion" ? "invitaciones" : "recordatorios"} al número principal de cada
                una. Tiempo estimado: {duracionEstimada(items.length, info.ritmo)}.
              </>
            ) : tipo === "invitacion" ? (
              "No hay invitaciones sin enviar que tengan teléfono."
            ) : (
              "No hay invitaciones enviadas esperando respuesta (o el plazo ya cerró)."
            )}
          </p>
          <button
            onClick={iniciar}
            disabled={ocupado || !conectado || !items.length}
            className="boton-verde mt-3"
          >
            {ocupado ? "Iniciando..." : `Enviar ${items.length} automáticamente`}
          </button>
        </div>
      )}

      {envio?.fallidos?.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-red-600 cursor-pointer">
            {envio.fallidos.length} {envio.fallidos.length === 1 ? "mensaje no salió" : "mensajes no salieron"}
          </summary>
          <ul className="mt-2 text-xs text-ink-suave space-y-0.5">
            {envio.fallidos.map((f, i) => (
              <li key={i}>
                {f.nombre} (+{f.telefono}): {f.detalle}
              </li>
            ))}
          </ul>
        </details>
      )}

      {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
    </section>
  );
}
