import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../ui/Toast";
import { DISENOS, NOMBRE_TIPO_EVENTO, TIPOS_EVENTO } from "../tiposEvento";
import { peso, haceCuanto, soloFecha } from "./comun";

// Pagos que reportó el cliente desde su cotización («Ya pagué» + captura).
// El dueño mira en su Nequi o banco que la plata llegó y con un toque lo
// confirma: se registra el pago, el cliente pasa a ganado y, si no tenía
// evento, se crea y queda en Producción. Si no llegó, «No llegó».

function Comprobante({ id }) {
  const [c, setC] = useState(null);
  const [grande, setGrande] = useState(false);
  useEffect(() => {
    let url;
    api.crm
      .comprobante(id)
      .then((r) => {
        url = r.url;
        setC(r);
      })
      .catch(() => setC({ error: true }));
    return () => url && URL.revokeObjectURL(url);
  }, [id]);
  if (!c) return <div className="w-24 h-32 rounded-lg bg-lienzo animate-pulse" />;
  if (c.error) return null;
  if (c.tipo === "application/pdf") {
    return (
      <a href={c.url} target="_blank" rel="noreferrer" className="boton-secundario !text-xs">
        Ver comprobante (PDF)
      </a>
    );
  }
  return (
    <>
      <button onClick={() => setGrande(true)} className="shrink-0" title="Ver comprobante en grande">
        <img src={c.url} alt="Comprobante de pago" className="w-24 h-32 object-cover rounded-lg border border-borde" />
      </button>
      {grande && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={() => setGrande(false)}>
          <img src={c.url} alt="Comprobante de pago" className="max-h-[90vh] max-w-full rounded-xl" />
        </div>
      )}
    </>
  );
}

function Tarjeta({ r, onHecho }) {
  const toast = useToast();
  const [confirmando, setConfirmando] = useState(false);
  const [valor, setValor] = useState(String(r.valor || ""));
  const [nombre, setNombre] = useState(r.nombre_evento_sugerido);
  const [tipo, setTipo] = useState(r.tipo_sugerido);
  const [fecha, setFecha] = useState(soloFecha(r.fecha_evento));
  const [diseno, setDiseno] = useState("clasico");
  const [ocupado, setOcupado] = useState(false);

  async function confirmar() {
    setOcupado(true);
    try {
      const res = await api.crm.confirmarPago(r.id, {
        valor: valor.replace(/\D/g, ""),
        nombre,
        tipo_evento: tipo,
        fecha_evento: fecha || null,
        diseno,
      });
      toast(
        res.evento_creado
          ? `Pago confirmado · ${r.nombre || r.cliente} es cliente · evento «${res.evento_creado.nombre}» creado en Producción`
          : `Pago confirmado y registrado en su evento`
      );
      onHecho();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setOcupado(false);
    }
  }

  async function rechazar() {
    if (!window.confirm("¿Marcar que este pago NO llegó? El cliente sigue como estaba.")) return;
    setOcupado(true);
    try {
      await api.crm.rechazarPago(r.id);
      toast("Marcado como no recibido");
      onHecho();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setOcupado(false);
    }
  }

  const resuelto = r.estado !== "pendiente";
  return (
    <div className={`tarjeta p-4 flex gap-4 ${resuelto ? "opacity-60" : "border-amber-300"}`}>
      {r.tiene_comprobante ? <Comprobante id={r.id} /> : <div className="w-24 h-32 rounded-lg bg-lienzo grid place-items-center text-[11px] text-ink-tenue text-center p-2">Sin captura</div>}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start gap-2 flex-wrap">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">
              {r.nombre || r.cliente || "Cliente"} reportó {peso(r.valor)}
              {r.metodo && <span className="font-normal text-ink-suave"> por {r.metodo}</span>}
            </p>
            <p className="text-[12px] text-ink-tenue">
              {haceCuanto(r.creado_en)} · cotización por {peso(r.total)}
              {r.pagado_antes > 0 && ` · ya había pagado ${peso(r.pagado_antes)}`}
              {r.telefono && ` · +${r.telefono}`}
            </p>
          </div>
          {resuelto && (
            <span className={`insignia ${r.estado === "confirmado" ? "insignia-ok" : "insignia-no"}`}>
              {r.estado === "confirmado" ? "confirmado" : "no llegó"}
            </span>
          )}
        </div>

        {!resuelto && !confirmando && (
          <>
            <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Revisa en tu {r.metodo || "cuenta"} que de verdad llegaron {peso(r.valor)} antes de confirmar.
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setConfirmando(true)} className="boton-verde !text-xs" disabled={ocupado}>
                ✓ Llegó: confirmar pago
              </button>
              <button onClick={rechazar} className="boton-secundario !text-xs" disabled={ocupado}>
                No llegó
              </button>
            </div>
          </>
        )}

        {!resuelto && confirmando && (
          <div className="border border-borde rounded-xl p-3 bg-lienzo flex flex-col gap-2">
            <label className="block">
              <span className="etiqueta">Valor que llegó</span>
              <input
                className="campo-sm"
                inputMode="numeric"
                value={valor ? Number(valor.replace(/\D/g, "")).toLocaleString("es-CO") : ""}
                onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            {r.invitacion_id ? (
              <p className="text-[12px] text-ink-suave">Se suma a su evento que ya existe.</p>
            ) : (
              <>
                <p className="text-[12px] text-ink-suave">Se creará su evento con estos datos (puedes cambiarlos después):</p>
                <input className="campo-sm" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                <div className="grid grid-cols-3 gap-2">
                  <select className="campo-sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    {TIPOS_EVENTO.map((t) => (
                      <option key={t} value={t}>
                        {NOMBRE_TIPO_EVENTO[t]}
                      </option>
                    ))}
                  </select>
                  <input type="date" className="campo-sm" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                  <select className="campo-sm" value={diseno} onChange={(e) => setDiseno(e.target.value)}>
                    {DISENOS.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.nombre.split(" (")[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button onClick={confirmar} disabled={ocupado || !valor} className="boton-verde !text-xs">
                {ocupado ? "Confirmando..." : r.invitacion_id ? "Confirmar pago" : "Confirmar y crear evento"}
              </button>
              <button onClick={() => setConfirmando(false)} className="boton-texto !text-xs">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PagosPorConfirmar({ onCambio }) {
  const [lista, setLista] = useState(null);
  const cargar = () => api.crm.pagosPorConfirmar(true).then(setLista).catch(() => setLista([]));
  useEffect(() => {
    cargar();
  }, []);
  if (!lista?.length) return null;
  const pendientes = lista.filter((r) => r.estado === "pendiente").length;
  return (
    <div className="mb-6">
      <h3 className="bloque-titulo mb-2">
        💵 Pagos por confirmar {pendientes > 0 && <span className="insignia insignia-aviso ml-1">{pendientes}</span>}
      </h3>
      <div className="flex flex-col gap-3">
        {lista.map((r) => (
          <Tarjeta
            key={r.id}
            r={r}
            onHecho={() => {
              cargar();
              onCambio?.();
            }}
          />
        ))}
      </div>
    </div>
  );
}
