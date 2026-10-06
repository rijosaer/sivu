import { useEffect, useState } from "react";
import { api, setInvitacionActual, sitioUrlInvitacion } from "../api";
import { TIPOS_EVENTO, NOMBRE_TIPO_EVENTO, DISENOS } from "../tiposEvento";
import { useToast } from "../ui/Toast";
import Icono from "../ui/Icono";

// Pantalla que ve el dueño justo después de entrar: el panel ya no
// administra un solo evento, así que antes de tocar contenido hay que
// elegir (o crear) cuál. Es deliberadamente simple — una lista de tarjetas y
// un formulario corto — porque lo que importa aquí es la decisión, no el
// detalle: eso se edita después, adentro del evento.

// La contraseña solo se ve una vez, aquí recién creada: el servidor guarda
// su hash y no hay forma de volver a leerla (después solo se puede
// restablecer desde la tarjeta del evento).
function EventoCreado({ inv, clave, onEntrar, onVolver }) {
  const toast = useToast();
  const enlaceInvitacion = sitioUrlInvitacion(inv.slug);
  const enlacePanel = window.location.origin;

  async function copiar(texto, aviso) {
    await navigator.clipboard.writeText(texto);
    toast(aviso);
  }

  return (
    <div className="tarjeta p-6">
      <h3 className="text-base font-medium text-ink mb-1">«{inv.nombre}» está listo</h3>
      <p className="ayuda mb-5">
        Comparte estos datos con tu cliente. La contraseña <b>no se vuelve a mostrar</b>; si se le
        pierde, la restableces desde la tarjeta del evento.
      </p>

      <dl className="flex flex-col gap-3 mb-5 text-sm">
        <div className="flex items-center justify-between gap-3 bg-lienzo rounded-lg px-3 py-2">
          <div className="min-w-0">
            <dt className="etiqueta !mb-0">Invitación pública</dt>
            <dd className="truncate text-ink-suave text-xs">{enlaceInvitacion}</dd>
          </div>
          <button type="button" className="boton-secundario shrink-0" onClick={() => copiar(enlaceInvitacion, "Enlace copiado")}>
            <Icono nombre="copiar" className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 bg-lienzo rounded-lg px-3 py-2">
          <div className="min-w-0">
            <dt className="etiqueta !mb-0">Panel del cliente</dt>
            <dd className="truncate text-ink-suave text-xs">{enlacePanel}</dd>
          </div>
          <button type="button" className="boton-secundario shrink-0" onClick={() => copiar(enlacePanel, "Enlace copiado")}>
            <Icono nombre="copiar" className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 bg-lienzo rounded-lg px-3 py-2">
          <div className="min-w-0">
            <dt className="etiqueta !mb-0">Usuario y contraseña</dt>
            <dd className="truncate text-ink-suave text-xs">
              {inv.acceso.usuario} · {clave}
            </dd>
          </div>
          <button
            type="button"
            className="boton-secundario shrink-0"
            onClick={() => copiar(`Panel: ${enlacePanel}\nUsuario: ${inv.acceso.usuario}\nContraseña: ${clave}`, "Datos de acceso copiados")}
          >
            <Icono nombre="copiar" className="w-3.5 h-3.5" />
          </button>
        </div>
      </dl>

      <div className="flex gap-2">
        <button onClick={() => onEntrar(inv)} className="boton-primario flex-1">
          Entrar a editar
        </button>
        <button onClick={onVolver} className="boton-secundario">
          Volver a la lista
        </button>
      </div>
    </div>
  );
}

function FormularioNuevo({ plantillas, onCreado, onCancelar }) {
  const toast = useToast();
  const [nombre, setNombre] = useState("");
  const [tipoEvento, setTipoEvento] = useState("boda");
  const [diseno, setDiseno] = useState("clasico");
  const [fecha, setFecha] = useState("");
  const [plantillaId, setPlantillaId] = useState("");
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  // Solo se ofrecen plantillas del mismo tipo: una boda clonada en unos XV
  // traería secciones y textos de boda.
  const delTipo = plantillas.filter((p) => p.tipo_evento === tipoEvento);
  const nombreDiseno = (key) => DISENOS.find((d) => d.key === (key || "clasico"))?.nombre || key;

  async function crear(e) {
    e.preventDefault();
    if (!nombre.trim()) return setError("Ponle un nombre al evento");
    if (usuario.trim() && !clave) return setError("Ponle una contraseña al usuario del cliente");
    setGuardando(true);
    setError("");
    try {
      const inv = await api.crearInvitacion({
        nombre: nombre.trim(),
        tipo_evento: tipoEvento,
        diseno: plantillaId ? undefined : diseno,
        fecha_evento: fecha || null,
        plantilla_id: plantillaId || null,
        usuario: usuario.trim() || null,
        password: clave || null,
      });
      toast(plantillaId ? "Evento creado desde la plantilla" : "Evento creado con su contenido de arranque");
      onCreado(inv, clave);
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
        Empieza desde una plantilla (con su diseño y sus textos de ejemplo) o en blanco según el
        tipo de evento. Si le creas acceso al cliente, ese usuario solo podrá ver y editar ESTE
        evento, ningún otro.
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

      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="block">
          <span className="etiqueta">Tipo de evento</span>
          <select
            className="campo"
            value={tipoEvento}
            onChange={(e) => {
              setTipoEvento(e.target.value);
              setPlantillaId("");
            }}
          >
            {TIPOS_EVENTO.map((t) => (
              <option key={t} value={t}>
                {NOMBRE_TIPO_EVENTO[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="etiqueta">Fecha (opcional)</span>
          <input type="date" className="campo" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
      </div>

      <label className="block mb-4">
        <span className="etiqueta">Plantilla de partida</span>
        <select className="campo" value={plantillaId} onChange={(e) => setPlantillaId(e.target.value)}>
          <option value="">En blanco (contenido de arranque del tipo de evento)</option>
          {delTipo.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} — {nombreDiseno(p.diseno)}
            </option>
          ))}
        </select>
        {delTipo.length === 0 && (
          <span className="ayuda mt-1 block">
            Aún no hay plantillas de {NOMBRE_TIPO_EVENTO[tipoEvento]}. Marca un evento como plantilla para
            que aparezca aquí.
          </span>
        )}
        {plantillaId && (
          <span className="ayuda mt-1 block">
            Se copian su diseño, sus colores y sus textos; nunca sus invitados ni sus fotos.
          </span>
        )}
      </label>

      {!plantillaId && (
        <label className="block mb-4">
          <span className="etiqueta">Diseño</span>
          <select className="campo" value={diseno} onChange={(e) => setDiseno(e.target.value)}>
            {DISENOS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.nombre}
              </option>
            ))}
          </select>
          <span className="ayuda mt-1 block">Trae sus adornos, sus colores y sus letras.</span>
        </label>
      )}

      <fieldset className="border border-borde rounded-lg p-4 mb-5">
        <legend className="etiqueta !mb-0 px-1">Acceso del cliente (opcional)</legend>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="block">
            <span className="etiqueta">Usuario</span>
            <input
              className="campo"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value.toLowerCase())}
              placeholder="Ej. valentina"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="etiqueta">Contraseña</span>
            <input
              className="campo"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </label>
        </div>
        <p className="ayuda mt-2">
          Con este usuario el cliente entra al panel y solo ve su evento. Puedes crearlo o
          restablecerlo después desde la tarjeta del evento.
        </p>
      </fieldset>

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

// Acceso del cliente a este evento: ver qué usuarios existen y crear o
// restablecer usuario y contraseña. El servidor los amarra solo a esta
// invitación; la contraseña nunca se puede leer de vuelta, solo reemplazar.
function AccesoCliente({ inv }) {
  const toast = useToast();
  const [abierto, setAbierto] = useState(false);
  const [usuarios, setUsuarios] = useState(null);
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function abrir() {
    if (!abierto) {
      try {
        setUsuarios(await api.obtenerAcceso(inv.id));
      } catch (err) {
        toast(err.message, "error");
      }
    }
    setAbierto(!abierto);
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      await api.crearUsuarioCliente(inv.id, { usuario: usuario.trim(), password: clave });
      setUsuarios(await api.obtenerAcceso(inv.id));
      setUsuario("");
      setClave("");
      toast(`Acceso listo: el cliente entra con "${usuario.trim()}" y solo ve este evento`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) {
    return (
      <button onClick={abrir} className="boton-texto !text-[11px] self-start">
        <Icono nombre="llave" className="w-3.5 h-3.5" />
        Acceso del cliente
      </button>
    );
  }

  return (
    <div className="border border-borde rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="etiqueta !mb-0">Acceso del cliente</span>
        <button onClick={() => setAbierto(false)} className="boton-texto !text-[11px]">
          cerrar
        </button>
      </div>
      <p className="text-[11px] text-ink-suave">
        {usuarios === null
          ? "Cargando..."
          : usuarios.length
            ? `Usuario${usuarios.length > 1 ? "s" : ""}: ${usuarios.join(", ")}`
            : "Todavía no tiene usuario. Créalo aquí:"}
      </p>
      <form onSubmit={guardar} className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            className="campo !py-1.5 !text-xs"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value.toLowerCase())}
            placeholder="usuario"
            autoComplete="off"
            required
          />
          <input
            className="campo !py-1.5 !text-xs"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="contraseña nueva"
            autoComplete="new-password"
            required
          />
        </div>
        {error && <p className="text-red-600 text-[11px]">{error}</p>}
        <button disabled={guardando} className="boton-secundario !py-1.5 !text-xs self-start">
          {guardando ? "Guardando..." : usuarios?.length ? "Restablecer / agregar" : "Crear acceso"}
        </button>
      </form>
    </div>
  );
}

function TarjetaEvento({ inv, onEntrar, onCambio, onBorrar }) {
  const toast = useToast();
  const [guardando, setGuardando] = useState(false);
  const enlace = sitioUrlInvitacion(inv.slug);

  async function cambiarDiseno(e) {
    const nuevo = DISENOS.find((d) => d.key === e.target.value);
    const ok = window.confirm(
      `¿Cambiar a «${nuevo?.nombre}»?\n\nSe cambian los adornos, los colores y las letras de la invitación. ` +
        "Los textos, los invitados y las fotos se quedan igual."
    );
    if (!ok) return;
    setGuardando(true);
    try {
      onCambio(await api.actualizarInvitacion(inv.id, { diseno: e.target.value }));
    } finally {
      setGuardando(false);
    }
  }

  async function alternarPlantilla() {
    setGuardando(true);
    try {
      onCambio(await api.actualizarInvitacion(inv.id, { es_plantilla: !inv.es_plantilla }));
    } finally {
      setGuardando(false);
    }
  }

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
            {new Date(`${String(inv.fecha_evento).slice(0, 10)}T00:00:00`).toLocaleDateString("es-CO", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-ink-suave">
        <span className="truncate">{enlace}</span>
        <button
          type="button"
          className="boton-texto shrink-0 !p-1"
          title="Copiar enlace público"
          onClick={async () => {
            await navigator.clipboard.writeText(enlace);
            toast("Enlace copiado");
          }}
        >
          <Icono nombre="copiar" className="w-3.5 h-3.5" />
        </button>
      </div>

      <label className="flex items-center gap-2 text-[11px] text-ink-suave">
        <span className="shrink-0">Diseño</span>
        <select className="campo !py-1 !text-xs" value={inv.diseno || "clasico"} onChange={cambiarDiseno} disabled={guardando}>
          {DISENOS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-[11px] text-ink-suave cursor-pointer">
        <input type="checkbox" checked={Boolean(inv.es_plantilla)} onChange={alternarPlantilla} disabled={guardando} />
        Usar como plantilla para nuevos eventos de {NOMBRE_TIPO_EVENTO[inv.tipo_evento] || "este tipo"}
      </label>

      <AccesoCliente inv={inv} />

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
  const [recienCreado, setRecienCreado] = useState(null); // { inv, clave }
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
            <span className="marca-sello">c.</span>
            <span>
              <span className="block text-[15px] font-semibold tracking-[-.03em] text-ink">
                Convite
              </span>
              <span className="block text-[10px] uppercase tracking-[.16em] text-ink-tenue mt-0.5">
                invitaciones digitales
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

        {recienCreado ? (
          <EventoCreado
            inv={recienCreado.inv}
            clave={recienCreado.clave}
            onEntrar={entrar}
            onVolver={() => setRecienCreado(null)}
          />
        ) : creando ? (
          <FormularioNuevo
            plantillas={(eventos || []).filter((e) => e.es_plantilla)}
            onCreado={(inv, clave) => {
              setCreando(false);
              cargar();
              // Con usuario nuevo, primero se muestran los datos de acceso una
              // única vez; sin usuario, directo a editar como siempre.
              if (inv.acceso) setRecienCreado({ inv, clave });
              else entrar(inv);
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
