import { useEffect, useState } from "react";
import { api, setInvitacionActual } from "../api";
import { TIPOS_EVENTO, NOMBRE_TIPO_EVENTO } from "../tiposEvento";
import { useToast } from "../ui/Toast";
import Icono from "../ui/Icono";

// Pantalla que ve el dueño justo después de entrar: el panel ya no
// administra un solo evento, así que antes de tocar contenido hay que
// elegir (o crear) cuál. Es deliberadamente simple — una lista de tarjetas y
// un formulario corto — porque lo que importa aquí es la decisión, no el
// detalle: eso se edita después, adentro del evento.

function FormularioNuevo({ onCreado, onCancelar }) {
  const toast = useToast();
  const [nombre, setNombre] = useState("");
  const [tipoEvento, setTipoEvento] = useState("boda");
  const [fecha, setFecha] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function crear(e) {
    e.preventDefault();
    if (!nombre.trim()) return setError("Ponle un nombre al evento");
    setGuardando(true);
    setError("");
    try {
      const inv = await api.crearInvitacion({
        nombre: nombre.trim(),
        tipo_evento: tipoEvento,
        fecha_evento: fecha || null,
      });
      toast("Evento creado con su contenido de arranque");
      onCreado(inv);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={crear} className="tarjeta p-6">
      <h3 className="text-base font-medium text-ink mb-1">Nuevo evento</h3>
      <p className="ayuda mb-5">
        Se crea con su tema, sus decoraciones y sus secciones ya sembradas según el tipo que elijas
        — listo para entrar a editarlo.
      </p>

      <label className="block mb-4">
        <span className="etiqueta">Nombre del evento</span>
        <input
          className="campo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Valentina — XV años"
          autoFocus
        />
      </label>

      <label className="block mb-4">
        <span className="etiqueta">Tipo de evento</span>
        <select className="campo" value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value)}>
          {TIPOS_EVENTO.map((t) => (
            <option key={t} value={t}>
              {NOMBRE_TIPO_EVENTO[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="block mb-5">
        <span className="etiqueta">Fecha del evento (opcional)</span>
        <input type="date" className="campo" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </label>

      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button disabled={guardando} className="boton-primario">
          {guardando ? "Creando..." : "Crear evento"}
        </button>
        <button type="button" onClick={onCancelar} className="boton-secundario">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function TarjetaEvento({ inv, onEntrar, onCambio, onBorrar }) {
  const [guardando, setGuardando] = useState(false);

  async function alternarActivo() {
    setGuardando(true);
    try {
      const actualizado = await api.actualizarInvitacion(inv.id, { activo: !inv.activo });
      onCambio(actualizado);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="tarjeta-lista p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{inv.nombre}</p>
          <p className="text-[11px] text-ink-tenue mt-0.5">
            {NOMBRE_TIPO_EVENTO[inv.tipo_evento] || inv.tipo_evento} · /{inv.slug}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {inv.es_plantilla && <span className="insignia insignia-info">plantilla</span>}
          <span className={`insignia ${inv.activo ? "insignia-ok" : "insignia-neutra"}`}>
            {inv.activo ? "activo" : "inactivo"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-ink-suave">
        <span>{inv.invitados} invitados</span>
        {inv.sin_responder > 0 && <span>· {inv.sin_responder} sin responder</span>}
        {inv.fecha_evento && (
          <span>
            ·{" "}
            {new Date(`${inv.fecha_evento}T00:00:00`).toLocaleDateString("es-CO", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-1">
        <button onClick={() => onEntrar(inv)} className="boton-primario flex-1">
          Entrar a editar
        </button>
        <button onClick={alternarActivo} disabled={guardando} className="boton-secundario" title={inv.activo ? "Desactivar" : "Activar"}>
          <Icono nombre={inv.activo ? "campana-off" : "campana"} className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onBorrar(inv)} className="boton-peligro" title="Borrar evento">
          ✕
        </button>
      </div>
    </div>
  );
}

export default function SelectorEventos({ onElegir, onSalir }) {
  const toast = useToast();
  const [eventos, setEventos] = useState(null);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setEventos(await api.listarInvitaciones());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function entrar(inv) {
    setInvitacionActual(inv);
    onElegir(inv);
  }

  function actualizarEnLista(inv) {
    setEventos((prev) => prev.map((e) => (e.id === inv.id ? { ...e, ...inv } : e)));
  }

  async function borrar(inv) {
    if (!confirm(`¿Borrar "${inv.nombre}"? Se pierden todos sus invitados y su contenido.`)) return;
    try {
      await api.borrarInvitacion(inv.id);
      setEventos((prev) => prev.filter((e) => e.id !== inv.id));
      toast("Evento borrado");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  return (
    <div className="min-h-screen panel-lienzo px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="marca-sello">e.</span>
            <span>
              <span className="block text-[15px] font-semibold tracking-[-.03em] text-ink">
                eventa
              </span>
              <span className="block text-[10px] uppercase tracking-[.16em] text-ink-tenue mt-0.5">
                event management
              </span>
            </span>
          </div>
          <button onClick={onSalir} className="boton-texto">
            Cerrar sesión
          </button>
        </div>

        <h1 className="panel-titulo">Tus eventos</h1>
        <p className="panel-subtitulo mb-8">
          Elige un evento para administrarlo, o crea uno nuevo. Cada uno tiene su propio contenido,
          sus propios invitados y su propio enlace.
        </p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {!eventos ? (
          <p className="text-sm text-ink-tenue">Cargando...</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {eventos.map((inv) => (
              <TarjetaEvento
                key={inv.id}
                inv={inv}
                onEntrar={entrar}
                onCambio={actualizarEnLista}
                onBorrar={borrar}
              />
            ))}
          </div>
        )}

        {creando ? (
          <FormularioNuevo
            onCreado={(inv) => {
              setCreando(false);
              cargar();
              entrar(inv);
            }}
            onCancelar={() => setCreando(false)}
          />
        ) : (
          <button onClick={() => setCreando(true)} className="boton-secundario">
            <Icono nombre="mas" className="w-3.5 h-3.5" />
            Nuevo evento
          </button>
        )}
      </div>
    </div>
  );
}
