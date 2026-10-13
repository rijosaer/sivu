import { useState } from "react";
import { api } from "../api";
import { useToast } from "../ui/Toast";
import { EVENTOS, peso, soloFecha } from "./comun";

// Arma una cotización: se toma un plan de la lista (Configuración → Planes)
// con su descripción y lo que incluye, se suman extras o ítems a mano y se
// ajusta todo, porque cada cliente pide cosas distintas. Al guardar sale un
// enlace con la marca Sivú para mandarle.

const vacio = () => ({ descripcion: "", detalle: "", cantidad: 1, valor: "" });

function itemDePlan(plan) {
  return {
    descripcion: `Plan ${plan.nombre}`,
    detalle: [plan.descripcion, ...(plan.incluye || []).map((i) => `• ${i}`)].filter(Boolean).join("\n"),
    cantidad: 1,
    valor: plan.precio,
  };
}

export default function Cotizador({ prospecto, cotizacion, ajustes, onGuardada, onCancelar }) {
  const toast = useToast();
  const [items, setItems] = useState(() =>
    cotizacion ? cotizacion.items.map((i) => ({ ...i })) : []
  );
  const [descuento, setDescuento] = useState(cotizacion ? Number(cotizacion.descuento) || "" : "");
  const [cliente, setCliente] = useState(cotizacion?.cliente ?? prospecto.nombre ?? "");
  const [evento, setEvento] = useState(cotizacion?.evento ?? (EVENTOS[prospecto.evento] || ""));
  const [notas, setNotas] = useState(cotizacion?.notas ?? ajustes?.cotizacion?.notas ?? "");
  const [vigencia, setVigencia] = useState(soloFecha(cotizacion?.vigencia));
  const [guardando, setGuardando] = useState(false);

  const subtotal = items.reduce((s, it) => s + (Number(it.valor) || 0) * (Number(it.cantidad) || 1), 0);
  const total = Math.max(0, subtotal - (Number(descuento) || 0));

  const cambiar = (i, campo, valor) => setItems((prev) => prev.map((it, j) => (j === i ? { ...it, [campo]: valor } : it)));

  async function guardar() {
    const limpios = items
      .filter((it) => it.descripcion.trim())
      .map((it) => ({ ...it, valor: Number(String(it.valor).replace(/\D/g, "")) || 0 }));
    if (!limpios.length) return toast("Agrega al menos un plan o ítem", "error");
    setGuardando(true);
    try {
      const datos = { items: limpios, descuento: Number(descuento) || 0, cliente, evento, notas, vigencia: vigencia || null };
      const c = cotizacion
        ? await api.crm.actualizarCotizacion(cotizacion.id, datos)
        : await api.crm.crearCotizacion(prospecto.id, datos);
      toast(cotizacion ? "Cotización actualizada" : "Cotización lista: ya puedes enviarla");
      onGuardada(c);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">{cotizacion ? "Editar cotización" : "Nueva cotización"}</p>
        <button onClick={onCancelar} className="boton-texto !text-xs">
          Cerrar
        </button>
      </div>

      {!cotizacion && (
        <div>
          <span className="etiqueta">Empieza con un plan</span>
          <div className="flex flex-wrap gap-2">
            {(ajustes?.planes || []).map((pl) => (
              <button key={pl.id} onClick={() => setItems((prev) => [...prev, itemDePlan(pl)])} className="chip-filtro">
                {pl.nombre} · {peso(pl.precio)}
              </button>
            ))}
            {(ajustes?.extras || []).map((ex) => (
              <button
                key={ex.id}
                onClick={() => setItems((prev) => [...prev, { descripcion: ex.nombre, detalle: ex.descripcion || "", cantidad: 1, valor: ex.precio }])}
                className="chip-filtro"
              >
                + {ex.nombre} · {peso(ex.precio)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="etiqueta">Para</span>
          <input className="campo !text-sm" value={cliente} onChange={(e) => setCliente(e.target.value)} />
        </label>
        <label className="block">
          <span className="etiqueta">Evento</span>
          <input className="campo !text-sm" value={evento} onChange={(e) => setEvento(e.target.value)} placeholder="Ej. Boda · 14 de marzo" />
        </label>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((it, i) => (
          <div key={i} className="border border-borde rounded-xl p-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                className="campo !text-sm flex-1"
                value={it.descripcion}
                onChange={(e) => cambiar(i, "descripcion", e.target.value)}
                placeholder="Qué incluye (ej. Plan Personalizada)"
              />
              <input
                className="campo !text-sm !w-16 text-center"
                inputMode="numeric"
                value={it.cantidad}
                onChange={(e) => cambiar(i, "cantidad", e.target.value.replace(/\D/g, "") || 1)}
                title="Cantidad"
              />
              <input
                className="campo !text-sm !w-32 text-right"
                inputMode="numeric"
                value={it.valor === "" ? "" : Number(String(it.valor).replace(/\D/g, "")).toLocaleString("es-CO")}
                onChange={(e) => cambiar(i, "valor", e.target.value.replace(/\D/g, ""))}
                placeholder="$ valor"
              />
              <button onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))} className="boton-texto !px-2" title="Quitar">
                ✕
              </button>
            </div>
            <textarea
              className="campo !text-xs min-h-[60px]"
              value={it.detalle}
              onChange={(e) => cambiar(i, "detalle", e.target.value)}
              placeholder="Detalle (opcional): lo que incluye, condiciones..."
            />
          </div>
        ))}
        <button onClick={() => setItems((prev) => [...prev, vacio()])} className="boton-texto !text-xs self-start">
          + Ítem a mano
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="etiqueta">Descuento</span>
          <input
            className="campo !text-sm"
            inputMode="numeric"
            value={descuento === "" ? "" : Number(descuento).toLocaleString("es-CO")}
            onChange={(e) => setDescuento(e.target.value.replace(/\D/g, ""))}
            placeholder="$ 0"
          />
        </label>
        <label className="block">
          <span className="etiqueta">Válida hasta</span>
          <input type="date" className="campo !text-sm" value={vigencia} onChange={(e) => setVigencia(e.target.value)} />
          {!vigencia && (
            <span className="ayuda">Si la dejas vacía: {ajustes?.cotizacion?.vigenciaDias ?? 8} días desde hoy.</span>
          )}
        </label>
      </div>

      <label className="block">
        <span className="etiqueta">Notas para el cliente</span>
        <textarea className="campo !text-xs min-h-[70px]" value={notas} onChange={(e) => setNotas(e.target.value)} />
      </label>

      <div className="flex items-center justify-between gap-3 flex-wrap bg-lienzo rounded-xl px-4 py-3">
        <p className="text-sm text-ink">
          Total: <b className="text-lg">{peso(total)}</b>
          {Number(descuento) > 0 && <span className="text-ink-tenue text-xs"> (antes {peso(subtotal)})</span>}
        </p>
        <button onClick={guardar} disabled={guardando} className="boton-primario">
          {guardando ? "Guardando..." : cotizacion ? "Guardar cambios" : "Crear cotización"}
        </button>
      </div>
    </div>
  );
}
