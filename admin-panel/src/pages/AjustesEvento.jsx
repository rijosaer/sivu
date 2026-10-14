import { useEffect, useState } from "react";
import { api, getInvitacionActual } from "../api";
import { ir } from "../ruta";
import { NOMBRE_TIPO_EVENTO } from "../tiposEvento";
import { useCatalogoDisenos } from "../catalogoDisenos";
import { useToast } from "../ui/Toast";
import { AccesoCliente, AvisosWhatsapp } from "./SelectorEventos";
import { PERMISO_CLIENTE, PERMISOS } from "../permisos";

// Ajustes de un evento, solo para el dueño. Antes vivían como enlaces sueltos
// dentro de cada tarjeta de la lista de eventos; aquí van juntos y abiertos.

function Bloque({ titulo, ayuda, children }) {
  return (
    <section className="tarjeta p-5 sm:p-6 flex flex-col gap-3">
      <div>
        <h3 className="bloque-titulo">{titulo}</h3>
        {ayuda && <p className="ayuda mt-1 max-w-[62ch]">{ayuda}</p>}
      </div>
      {children}
    </section>
  );
}

function QueEditaElCliente() {
  const toast = useToast();
  const [valor, setValor] = useState(null);

  useEffect(() => {
    api
      .tema()
      .then((t) => setValor((Array.isArray(t) ? t.find((x) => x.clave === PERMISO_CLIENTE)?.valor : t?.[PERMISO_CLIENTE]) || "ver"))
      .catch(() => setValor("ver"));
  }, []);

  async function cambiar(v) {
    const antes = valor;
    setValor(v);
    try {
      await api.actualizarTema(PERMISO_CLIENTE, v);
      toast(v === "textos" ? "El cliente ya puede editar los textos" : "El cliente solo mira");
    } catch (e) {
      setValor(antes);
      toast(e.message, "error");
    }
  }

  if (!valor) return <p className="text-sm text-ink-tenue">Cargando...</p>;
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {PERMISOS.map((p) => (
        <label
          key={p.key}
          className={`cursor-pointer rounded-xl border p-4 flex gap-3 transition-colors ${
            valor === p.key ? "border-marca bg-marca-suave/60" : "border-borde hover:border-borde-fuerte bg-paper"
          }`}
        >
          <input type="radio" name="permiso-cliente" checked={valor === p.key} onChange={() => cambiar(p.key)} className="mt-0.5" />
          <span className="flex flex-col gap-1">
            <span className="text-sm font-medium text-ink">{p.titulo}</span>
            <span className="insignia insignia-oro self-start">{p.paquete}</span>
            <span className="ayuda">{p.detalle}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

export default function AjustesEvento() {
  const toast = useToast();
  const [inv, setInv] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [borrar, setBorrar] = useState(false);
  const catalogo = useCatalogoDisenos();
  const id = getInvitacionActual()?.id;

  useEffect(() => {
    api.obtenerInvitacion(id).then(setInv).catch((e) => toast(e.message, "error"));
  }, [id]);

  async function cambiar(cambios, aviso) {
    setGuardando(true);
    try {
      const r = await api.actualizarInvitacion(inv.id, cambios);
      setInv((prev) => ({ ...prev, ...r }));
      if (aviso) toast(aviso);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setGuardando(false);
    }
  }

  async function borrarEvento() {
    try {
      await api.borrarInvitacion(inv.id);
      toast("Evento borrado");
      ir("/eventos");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  if (!inv) return <p className="text-sm text-ink-tenue">Cargando...</p>;

  return (
    <div>
      <h2 className="panel-titulo">Ajustes del evento</h2>
      <p className="panel-subtitulo mb-8">Quién entra, qué puede cambiar y a quién le llegan los avisos. Esto solo lo ves tú.</p>

      <div className="flex flex-col gap-5">
        <Bloque
          titulo="Qué puede cambiar el cliente"
          ayuda="Los colores y el diseño los define Sivú siempre. Según el paquete, el cliente solo mira cómo van sus invitados o también puede corregir los textos."
        >
          <QueEditaElCliente />
        </Bloque>

        <Bloque titulo="Acceso del cliente" ayuda="Con este usuario el cliente entra al panel y solo ve su evento. La contraseña no se puede leer de vuelta, solo reemplazar.">
          <AccesoCliente inv={inv} fijo />
        </Bloque>

        <Bloque titulo="Avisos al cliente por WhatsApp">
          <AvisosWhatsapp inv={inv} fijo onCambio={(c) => setInv((p) => ({ ...p, ...c }))} />
        </Bloque>

        <Bloque titulo="Diseño base" ayuda="Cambia adornos, colores y letras de toda la invitación. Los textos, los invitados y las fotos se quedan igual.">
          <select
            className="campo sm:max-w-sm"
            value={inv.diseno_variante || inv.diseno || "clasico"}
            disabled={guardando}
            onChange={(e) => cambiar({ diseno: e.target.value }, `Diseño: ${catalogo.find((d) => d.key === e.target.value)?.nombre}`)}
          >
            {catalogo.map((d) => (
              <option key={d.key} value={d.key}>
                {d.nombre}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-ink-suave cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={Boolean(inv.es_plantilla)}
              disabled={guardando}
              onChange={() => cambiar({ es_plantilla: !inv.es_plantilla }, inv.es_plantilla ? "Ya no es plantilla" : "Marcado como plantilla")}
            />
            Usar como plantilla para nuevos eventos de {NOMBRE_TIPO_EVENTO[inv.tipo_evento] || "este tipo"}
          </label>
        </Bloque>

        <Bloque titulo="Estado">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`insignia ${inv.activo ? "insignia-ok" : "insignia-neutra"}`}>{inv.activo ? "invitación activa" : "invitación apagada"}</span>
            <button className="boton-secundario" disabled={guardando} onClick={() => cambiar({ activo: !inv.activo }, inv.activo ? "Invitación apagada" : "Invitación activa")}>
              {inv.activo ? "Apagar la invitación" : "Activar la invitación"}
            </button>
            <span className="flex-1" />
            {borrar ? (
              <span className="flex items-center gap-2 text-xs text-red-700">
                Se pierden sus invitados y su contenido.
                <button className="boton-peligro !border-red-300 !text-red-700" onClick={borrarEvento}>
                  Sí, borrar
                </button>
                <button className="boton-texto" onClick={() => setBorrar(false)}>
                  cancelar
                </button>
              </span>
            ) : (
              <button className="boton-peligro" onClick={() => setBorrar(true)}>
                Borrar evento
              </button>
            )}
          </div>
        </Bloque>
      </div>
    </div>
  );
}
