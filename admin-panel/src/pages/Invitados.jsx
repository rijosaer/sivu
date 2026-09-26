import { useEffect, useMemo, useState } from "react";
import { api, SITIO_BASE } from "../api";
import { useToast } from "../ui/Toast";
import Icono from "../ui/Icono";
import {
  armarMensaje,
  diasHasta,
  enlaceWhatsApp,
  fechaLegible,
  normalizarTelefono,
  plazoCerrado,
  telefonoValido,
} from "../whatsapp";

// Cada tipo se explica por lo que hace el invitado al confirmar, que es lo que
// de verdad los diferencia. El ejemplo de abajo se muestra al elegirlo.
const TIPOS = [
  {
    key: "individual",
    label: "Individual",
    ayuda: "Una sola persona.",
    ejemplo: "Confirma por sí misma.",
  },
  {
    key: "pareja",
    label: "Pareja",
    ayuda: "Dos personas.",
    ejemplo: "Cada una marca si asiste; el atajo «Vamos los dos» las marca juntas.",
  },
  {
    key: "familia",
    label: "Familia",
    ayuda: "Varias personas con nombre.",
    ejemplo: "Ves la lista completa y marcas quiénes asisten.",
  },
  {
    key: "cupos",
    label: "Titular + cupos",
    ayuda: "Un titular y N cupos libres.",
    ejemplo:
      "No sabes de antemano a quién trae: el invitado escribe el nombre de cada acompañante al confirmar. Puede no venir él y repartir sus cupos igual.",
  },
];

const ESTADO = {
  pendiente: { label: "Pendiente", clase: "text-ink-tenue" },
  confirmado: { label: "Asiste", clase: "text-emerald-600" },
  no_asistira: { label: "No asiste", clase: "text-red-600" },
};

// Estado inicial del formulario de "crear invitación". Los campos cambian
// según el tipo: individual usa "nombre"; pareja usa "p1" y "p2" (sin nombre
// aparte); familia usa "nombre" (el título) más "personas" (los integrantes);
// cupos usa "nombre" (el titular) más "cupos".
const NUEVO_VACIO = {
  tipo: "individual",
  nombre: "",
  p1: "",
  p2: "",
  personas: "",
  cupos: "1",
  telefono: "",
  mensaje: "",
};

// Para buscar: sin tildes y en minúsculas. Los nombres se escriben como se
// escriben ("Rodríguez", "Gómez"), pero al buscar nadie se detiene a poner la
// tilde, y sin esto esas invitaciones simplemente no aparecían.
export function paraBuscar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Acompañantes ya registrados y cupos que quedan libres. Solo tiene sentido en
// las invitaciones de tipo "cupos"; en el resto da ceros.
function cuposDe(invitacion) {
  const total = invitacion.tipo === "cupos" ? invitacion.cupos || 0 : 0;
  const usados = (invitacion.miembros || []).filter((m) => m.es_acompanante).length;
  return { total, usados, libres: total - usados };
}

function claveTema(tema, clave) {
  if (Array.isArray(tema)) return tema.find((x) => x.clave === clave)?.valor;
  return tema?.[clave];
}

// ---------------------------------------------------------------- Personas

function Personas({ invitacion, onCambio }) {
  const [nuevo, setNuevo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  const esCupos = invitacion.tipo === "cupos";
  const cupos = cuposDe(invitacion);
  // En una invitación por cupos no se agrega gente "suelta": lo que se agrega
  // ocupa un cupo, y no hay más que los que se dieron.
  const bloqueado = esCupos && cupos.libres <= 0;

  async function agregar(e) {
    e.preventDefault();
    if (!nuevo.trim()) return;
    setOcupado(true);
    setError("");
    try {
      onCambio(await api.agregarMiembro(invitacion.id, nuevo.trim(), esCupos));
      setNuevo("");
    } catch (e2) {
      setError(e2.message);
    }
    setOcupado(false);
  }

  async function cambiarEstado(id, estado) {
    onCambio(await api.actualizarMiembro(id, { estado }));
  }

  async function quitar(id) {
    if (invitacion.miembros.length === 1) {
      return alert("Una invitación necesita al menos una persona.");
    }
    if (!confirm("¿Quitar a esta persona de la invitación?")) return;
    try {
      onCambio(await api.borrarMiembro(id));
    } catch (e2) {
      setError(e2.message);
    }
  }

  const comentario = invitacion.miembros.find((m) => m.comentario)?.comentario;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <span className="etiqueta mb-0">Personas</span>
        {esCupos && (
          <span className="text-[11px] text-ink-tenue">
            {cupos.usados} de {cupos.total} {cupos.total === 1 ? "cupo usado" : "cupos usados"} · el
            titular va aparte
          </span>
        )}
      </div>

      <div className="rounded-lg border border-borde divide-y divide-borde">
        {invitacion.miembros.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-3 py-2 flex-wrap">
            <span className="text-sm flex-1 min-w-[120px] text-ink">
              {m.nombre}
              {esCupos && (
                <span className="ml-2 insignia insignia-neutra">
                  {m.es_acompanante ? "cupo" : "titular"}
                </span>
              )}
            </span>
            <span className={`text-xs w-20 ${ESTADO[m.estado]?.clase}`}>
              {ESTADO[m.estado]?.label || m.estado}
            </span>
            {m.restriccion && (
              <span className="text-[11px] text-ink-tenue italic">🍽 {m.restriccion}</span>
            )}
            <select
              value={m.estado}
              onChange={(e) => cambiarEstado(m.id, e.target.value)}
              className="text-[11px] border border-borde-fuerte px-1.5 py-1"
              aria-label={`Cambiar asistencia de ${m.nombre}`}
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Asiste</option>
              <option value="no_asistira">No asiste</option>
            </select>
            {/* El titular de una invitación por cupos no se quita: es a quien se
                le mandó el enlace. Se le cambia el nombre en «Editar». */}
            {(!esCupos || m.es_acompanante) && (
              <button
                onClick={() => quitar(m.id)}
                aria-label={`Quitar a ${m.nombre}`}
                className="text-[11px] text-ink-tenue hover:text-red-600 transition-colors px-1"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {comentario && <p className="text-[11px] text-ink-suave italic mt-2">💬 {comentario}</p>}

      {bloqueado ? (
        <p className="ayuda mt-2">
          No quedan cupos libres. Súbelos con «Editar» si le vas a dar más.
        </p>
      ) : (
        <>
          <form onSubmit={agregar} className="flex gap-2 mt-2">
            <input
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              placeholder={esCupos ? "Nombre del acompañante..." : "Agregar persona..."}
              className="campo-sm flex-1"
            />
            <button disabled={ocupado} className="boton-secundario">
              Agregar
            </button>
          </form>
          {/* Se agrega ya confirmado porque este camino es justo para cuando
              nos avisan por fuera (WhatsApp) y anotamos nosotros el nombre. */}
          {esCupos && (
            <p className="ayuda mt-1">Queda como «asiste»; puedes cambiarlo con el selector.</p>
          )}
        </>
      )}

      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ------------------------------------------------------- Editar identidad

// Edita el nombre de una invitación ya creada. Se adapta al tipo, igual que el
// formulario de creación: individual = un nombre; pareja = los dos nombres (el
// título se recompone); familia = el título más el de cada integrante; cupos =
// el titular más cuántos cupos tiene.
// Agregar o quitar integrantes se sigue haciendo en la lista de personas.
function EditarIdentidad({ invitacion, onCambio, onCerrar }) {
  const { tipo, miembros } = invitacion;
  const titular = miembros.find((m) => !m.es_acompanante) || miembros[0];
  const [nombre, setNombre] = useState(
    tipo === "individual" || tipo === "cupos"
      ? titular?.nombre || invitacion.nombre
      : invitacion.nombre
  );
  const [cupos, setCupos] = useState(String(invitacion.cupos ?? 1));
  const [p1, setP1] = useState(miembros[0]?.nombre || "");
  const [p2, setP2] = useState(miembros[1]?.nombre || "");
  const [integrantes, setIntegrantes] = useState(() =>
    Object.fromEntries(miembros.map((m) => [m.id, m.nombre]))
  );
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setError("");
    setGuardando(true);
    try {
      let ultima = null;
      if (tipo === "individual") {
        const n = nombre.trim();
        if (!n) throw new Error("Escribe el nombre de la persona.");
        if (miembros[0]) await api.actualizarMiembro(miembros[0].id, { nombre: n });
        ultima = await api.actualizarInvitado(invitacion.id, { nombre: n });
      } else if (tipo === "cupos") {
        const n = nombre.trim();
        if (!n) throw new Error("Escribe el nombre del titular.");
        const cantidad = Number(cupos);
        if (!Number.isInteger(cantidad) || cantidad < 1) {
          throw new Error("Los cupos deben ser un número de 1 en adelante.");
        }
        if (titular) await api.actualizarMiembro(titular.id, { nombre: n });
        // El servidor rechaza dejar menos cupos de los que ya están ocupados.
        ultima = await api.actualizarInvitado(invitacion.id, { nombre: n, cupos: cantidad });
      } else if (tipo === "pareja") {
        const a = p1.trim();
        const b = p2.trim();
        if (!a || !b) throw new Error("Escribe el nombre de las dos personas.");
        if (miembros[0]) await api.actualizarMiembro(miembros[0].id, { nombre: a });
        if (miembros[1]) await api.actualizarMiembro(miembros[1].id, { nombre: b });
        ultima = await api.actualizarInvitado(invitacion.id, { nombre: `${a} y ${b}` });
      } else {
        const t = nombre.trim();
        if (!t) throw new Error("Ponle un nombre a la familia.");
        // Renombrar solo a quienes cambiaron. La última respuesta del servidor
        // ya trae los miembros actualizados, así que con esa se refresca todo.
        for (const m of miembros) {
          const nuevo = (integrantes[m.id] ?? m.nombre).trim();
          if (nuevo && nuevo !== m.nombre) await api.actualizarMiembro(m.id, { nombre: nuevo });
        }
        ultima = await api.actualizarInvitado(invitacion.id, { nombre: t });
      }
      if (ultima) onCambio(ultima);
      onCerrar();
    } catch (e) {
      setError(e.message);
    }
    setGuardando(false);
  }

  return (
    <div className="rounded-lg bg-lienzo border border-borde p-3 space-y-2">
      <span className="etiqueta">Editar nombre</span>

      {tipo === "individual" && (
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre completo"
          className="campo"
        />
      )}

      {tipo === "cupos" && (
        <div className="flex flex-wrap gap-2 items-center">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del titular"
            className="campo flex-1 min-w-[180px]"
          />
          <label className="flex items-center gap-2 text-[11px] text-ink-suave">
            Cupos
            <input
              type="number"
              min="1"
              value={cupos}
              onChange={(e) => setCupos(e.target.value)}
              className="campo w-20"
            />
          </label>
        </div>
      )}

      {tipo === "pareja" && (
        <div className="flex flex-wrap gap-2">
          <input
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            placeholder="Primera persona"
            className="campo flex-1 min-w-[140px]"
          />
          <input
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            placeholder="Segunda persona"
            className="campo flex-1 min-w-[140px]"
          />
        </div>
      )}

      {tipo === "familia" && (
        <>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre de la familia"
            className="campo"
          />
          <span className="etiqueta mt-2">Integrantes</span>
          {miembros.map((m) => (
            <input
              key={m.id}
              value={integrantes[m.id] ?? m.nombre}
              onChange={(e) => setIntegrantes((prev) => ({ ...prev, [m.id]: e.target.value }))}
              className="campo"
            />
          ))}
          <p className="ayuda">Para agregar o quitar integrantes usa la lista de arriba.</p>
        </>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={guardar} disabled={guardando} className="boton-primario">
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        <button onClick={onCerrar} className="boton-secundario">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- Tarjeta

function Tarjeta({ invitacion, plantilla, plantillaRecordatorio, cuenta, onCambio, onBorrar }) {
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [copiado, setCopiado] = useState("");
  const [telefono, setTelefono] = useState(invitacion.telefono || "");

  const enlace = `${SITIO_BASE}?i=${invitacion.codigo}`;
  // "cupos" solo tiene valor en las invitaciones de tipo cupos; en el resto
  // {cupos} se queda vacío y su renglón desaparece del mensaje.
  const cupos = cuposDe(invitacion);
  const datosMensaje = {
    nombre: invitacion.familia || invitacion.nombre,
    enlace,
    cupos: cupos.total,
    ...cuenta,
  };
  const mensaje = armarMensaje(plantilla, datosMensaje);
  const mensajeRecordatorio = armarMensaje(plantillaRecordatorio, datosMensaje);
  const enviado = Boolean(invitacion.enviado_en);
  const telefonoSucio = telefono.trim() && !telefonoValido(telefono);
  // Pasado el cierre no tiene sentido recordar: el sitio esconde el formulario
  // y el servidor rechaza la respuesta, así que sería mandar a la gente a una
  // puerta cerrada.
  const cerrado = plazoCerrado(cuenta?.diasLimite);

  const asisten = invitacion.miembros.filter((m) => m.estado === "confirmado").length;
  const noAsisten = invitacion.miembros.filter((m) => m.estado === "no_asistira").length;
  const pendientes = invitacion.miembros.filter((m) => m.estado === "pendiente").length;
  const tipo = TIPOS.find((t) => t.key === invitacion.tipo);

  function avisar(que) {
    setCopiado(que);
    setTimeout(() => setCopiado(""), 1500);
  }

  async function guardarTelefono() {
    if (telefono.trim() === (invitacion.telefono || "").trim()) return;
    onCambio(await api.actualizarInvitado(invitacion.id, { telefono: telefono.trim() }));
  }

  async function marcar(valor) {
    onCambio(await api.actualizarInvitado(invitacion.id, { enviado: valor }));
  }

  // Se abre WhatsApp con el mensaje escrito y se marca como enviada. Marcarla
  // aquí y no al confirmar el envío es a propósito: WhatsApp no le devuelve
  // nada al panel, así que no hay forma de saberlo. Se puede desmarcar.
  async function enviar() {
    window.open(enlaceWhatsApp(telefono, mensaje), "_blank", "noopener");
    if (telefono.trim() !== (invitacion.telefono || "").trim()) await guardarTelefono();
    if (!enviado) await marcar(true);
  }

  // Recordatorio: abre WhatsApp con la plantilla de recordatorio. No cambia el
  // estado de envío (esa marca es para la invitación inicial); es solo un
  // empujón a quien todavía no confirma.
  function recordar() {
    window.open(enlaceWhatsApp(telefono, mensajeRecordatorio), "_blank", "noopener");
    if (telefono.trim() !== (invitacion.telefono || "").trim()) guardarTelefono();
  }

  return (
    <div className="tarjeta-lista p-4 mb-2.5">
      {/* ---- Cabecera: quién es, cómo va y la acción principal ---- */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <button
          onClick={() => setAbierto(!abierto)}
          aria-expanded={abierto}
          className="flex-1 min-w-[220px] text-left group"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-ink group-hover:underline underline-offset-4 decoration-borde-fuerte">
              {invitacion.nombre}
            </span>
            <span className="insignia insignia-neutra">{tipo?.label || invitacion.tipo}</span>
            <span className="font-mono text-xs text-ink-tenue">{invitacion.codigo}</span>
          </div>

          <p className="text-xs mt-1.5 flex items-center gap-x-2 gap-y-1 flex-wrap">
            {asisten > 0 && <span className="text-emerald-600">{asisten} asisten</span>}
            {noAsisten > 0 && <span className="text-red-600">{noAsisten} no</span>}
            {pendientes > 0 && <span className="text-ink-tenue">{pendientes} sin responder</span>}
            {cupos.total > 0 && (
              <span className="text-marca">
                {cupos.usados}/{cupos.total} cupos
              </span>
            )}
            <span className="text-ink-tenue/70">·</span>
            <span className={enviado ? "text-ink-tenue" : "text-amber-700"}>
              {enviado ? `enviada ${fechaLegible(invitacion.enviado_en)}` : "sin enviar"}
            </span>
            {invitacion.abierto_en ? (
              <span
                className="text-sky-700"
                title={`Primera vez: ${fechaLegible(invitacion.abierto_en)}${
                  invitacion.ultima_apertura
                    ? ` · Última: ${fechaLegible(invitacion.ultima_apertura)}`
                    : ""
                }`}
              >
                abierta{invitacion.aperturas > 1 ? ` ·${invitacion.aperturas}` : ""}
              </span>
            ) : (
              <span className="text-ink-tenue">sin abrir</span>
            )}
          </p>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {pendientes > 0 && enviado && (
            <button
              onClick={recordar}
              disabled={cerrado}
              className="boton-secundario"
              title={
                cerrado
                  ? "El plazo de confirmación ya cerró: el sitio no aceptaría la respuesta"
                  : "Enviar recordatorio a quienes faltan por confirmar"
              }
            >
              Recordar ({pendientes})
            </button>
          )}
          <button onClick={enviar} className="boton-verde">
            {enviado ? "Reenviar por WhatsApp" : "Enviar por WhatsApp"}
          </button>
          <button
            onClick={() => setAbierto(!abierto)}
            aria-label={abierto ? "Ocultar detalles" : "Ver detalles"}
            className="boton-secundario w-8 px-0"
          >
            {abierto ? "▴" : "▾"}
          </button>
        </div>
      </div>

      {/* ---- Detalle: solo cuando hace falta ---- */}
      {abierto && (
        <div className="mt-4 pt-4 border-t border-borde space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <span className="etiqueta">WhatsApp</span>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                onBlur={guardarTelefono}
                placeholder="300 123 4567"
                className={`campo ${telefonoSucio ? "border-red-300" : ""}`}
                aria-label={`Teléfono de ${invitacion.nombre}`}
              />
              <p className="ayuda mt-1">
                {telefono.trim()
                  ? `Se enviará a +${normalizarTelefono(telefono)}`
                  : "Sin número, WhatsApp te deja elegir el contacto."}
              </p>
            </div>

            <div>
              <span className="etiqueta">Enlace del invitado</span>
              <div className="flex gap-2">
                <input readOnly value={enlace} className="campo flex-1 text-ink-suave" />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(enlace);
                    avisar("enlace");
                  }}
                  className="boton-secundario"
                >
                  <Icono nombre="copiar" className="w-3.5 h-3.5" />
                  {copiado === "enlace" ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mensaje);
                  avisar("mensaje");
                }}
                className="boton-texto mt-2"
              >
                {copiado === "mensaje" ? "¡Mensaje copiado!" : "Copiar el mensaje completo"}
              </button>
            </div>
          </div>

          <Personas invitacion={invitacion} onCambio={onCambio} />

          {editando ? (
            <EditarIdentidad
              invitacion={invitacion}
              onCambio={onCambio}
              onCerrar={() => setEditando(false)}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button onClick={() => setEditando(true)} className="boton-secundario">
                Editar nombre{invitacion.tipo === "cupos" ? " y cupos" : ""}
              </button>
              {enviado && (
                <button onClick={() => marcar(false)} className="boton-texto">
                  Marcar como no enviada
                </button>
              )}
              <button onClick={() => onBorrar(invitacion.id)} className="boton-peligro ml-auto">
                Eliminar invitación
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------ Crear invitación

function Crear({ onCreada, onCancelar }) {
  const toast = useToast();
  const [nuevo, setNuevo] = useState({ ...NUEVO_VACIO });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const tipoActual = TIPOS.find((t) => t.key === nuevo.tipo);

  async function agregar(e) {
    e.preventDefault();
    setError("");

    // Cada tipo arma su "nombre" (el título de la invitación) y sus miembros
    // de forma distinta. En pareja no se pide un nombre aparte: son los dos
    // nombres, y el título se compone con ellos.
    let nombre = "";
    let miembros = [];
    let cupos;
    if (nuevo.tipo === "individual") {
      nombre = nuevo.nombre.trim();
      if (!nombre) return setError("Escribe el nombre de la persona.");
    } else if (nuevo.tipo === "cupos") {
      // Solo se crea el titular: los nombres de los cupos llegan después, sea
      // porque el invitado los escribe o porque los anotamos aquí.
      nombre = nuevo.nombre.trim();
      if (!nombre) return setError("Escribe el nombre del titular.");
      cupos = Number(nuevo.cupos);
      if (!Number.isInteger(cupos) || cupos < 1) {
        return setError("Los cupos deben ser un número de 1 en adelante.");
      }
      miembros = [{ nombre }];
    } else if (nuevo.tipo === "pareja") {
      const a = nuevo.p1.trim();
      const b = nuevo.p2.trim();
      if (!a || !b) return setError("Escribe el nombre de las dos personas.");
      nombre = `${a} y ${b}`;
      miembros = [{ nombre: a }, { nombre: b }];
    } else {
      nombre = nuevo.nombre.trim();
      if (!nombre) return setError("Ponle un nombre a la familia (ej. Familia Rodríguez).");
      miembros = nuevo.personas
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((n) => ({ nombre: n }));
      if (!miembros.length) return setError("Agrega al menos un integrante de la familia.");
    }

    setGuardando(true);
    try {
      await api.crearInvitado({
        nombre,
        mensaje: nuevo.mensaje,
        telefono: nuevo.telefono,
        tipo: nuevo.tipo,
        miembros,
        ...(cupos ? { cupos } : {}),
      });
      setNuevo({ ...NUEVO_VACIO, tipo: nuevo.tipo });
      toast("Invitación creada");
      onCreada();
    } catch (e2) {
      setError(e2.message);
      toast("No se pudo crear la invitación", "error");
    }
    setGuardando(false);
  }

  return (
    <form onSubmit={agregar} className="tarjeta p-5 mb-5">
      <h3 className="bloque-titulo mb-3">Nueva invitación</h3>

      <span className="etiqueta">¿A quién va dirigida?</span>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {TIPOS.map((t) => (
          <button
            type="button"
            key={t.key}
            onClick={() => setNuevo({ ...nuevo, tipo: t.key })}
            aria-pressed={nuevo.tipo === t.key}
            className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
              nuevo.tipo === t.key
                ? "border-ink bg-ink text-white"
                : "border-borde-fuerte bg-white hover:border-[#aeb5aa]"
            }`}
          >
            <span className="block text-xs font-medium">{t.label}</span>
            <span
              className={`block text-[11px] mt-0.5 ${
                nuevo.tipo === t.key ? "text-white/70" : "text-ink-tenue"
              }`}
            >
              {t.ayuda}
            </span>
          </button>
        ))}
      </div>
      <p className="ayuda mt-2 mb-4">{tipoActual?.ejemplo}</p>

      {nuevo.tipo === "individual" && (
        <label className="block mb-4">
          <span className="etiqueta">Nombre completo</span>
          <input
            placeholder="Ej. Pedro Salas"
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            className="campo"
          />
        </label>
      )}

      {nuevo.tipo === "cupos" && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex-1 min-w-[200px]">
              <span className="etiqueta">Nombre del titular</span>
              <input
                placeholder="Ej. Carlos Rodríguez"
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                className="campo"
              />
            </label>
            <label>
              <span className="etiqueta">Cupos</span>
              <input
                type="number"
                min="1"
                value={nuevo.cupos}
                onChange={(e) => setNuevo({ ...nuevo, cupos: e.target.value })}
                className="campo w-24"
              />
            </label>
          </div>
          <p className="ayuda mt-1.5">
            Los cupos son <strong>además</strong> del titular: con {nuevo.cupos || 0}{" "}
            {Number(nuevo.cupos) === 1 ? "cupo" : "cupos"} pueden llegar hasta{" "}
            {1 + (Number(nuevo.cupos) || 0)} personas.
          </p>
        </div>
      )}

      {nuevo.tipo === "pareja" && (
        <div className="flex flex-wrap gap-3 mb-4">
          <label className="flex-1 min-w-[160px]">
            <span className="etiqueta">Primera persona</span>
            <input
              value={nuevo.p1}
              onChange={(e) => setNuevo({ ...nuevo, p1: e.target.value })}
              className="campo"
            />
          </label>
          <label className="flex-1 min-w-[160px]">
            <span className="etiqueta">Segunda persona</span>
            <input
              value={nuevo.p2}
              onChange={(e) => setNuevo({ ...nuevo, p2: e.target.value })}
              className="campo"
            />
          </label>
        </div>
      )}

      {nuevo.tipo === "familia" && (
        <div className="mb-4">
          <label className="block mb-3">
            <span className="etiqueta">Nombre de la familia</span>
            <input
              placeholder="Ej. Familia Rodríguez"
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              className="campo"
            />
          </label>
          <label className="block">
            <span className="etiqueta">Integrantes — uno por línea</span>
            <textarea
              value={nuevo.personas}
              onChange={(e) => setNuevo({ ...nuevo, personas: e.target.value })}
              rows={4}
              placeholder={"Carlos Rodríguez\nAna Pérez\nSofía Rodríguez"}
              className="campo resize-y"
            />
          </label>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <label>
          <span className="etiqueta">WhatsApp (opcional)</span>
          <input
            placeholder="300 123 4567"
            value={nuevo.telefono}
            onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })}
            className="campo"
          />
        </label>
        <label>
          <span className="etiqueta">Mensaje personal dentro de la invitación (opcional)</span>
          <input
            placeholder="Ej. ¡No podemos imaginarnos ese día sin ti!"
            value={nuevo.mensaje}
            onChange={(e) => setNuevo({ ...nuevo, mensaje: e.target.value })}
            className="campo"
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

      <div className="flex items-center gap-2 mt-4">
        <button disabled={guardando} className="boton-primario">
          {guardando ? "Creando..." : "Crear y generar enlace"}
        </button>
        <button type="button" onClick={onCancelar} className="boton-secundario">
          Cerrar
        </button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------- La pantalla

export default function Invitados({ irA }) {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [plantilla, setPlantilla] = useState("");
  const [recordatorio, setRecordatorio] = useState("");
  // Fechas de la sección «Información de la boda»: alimentan {dias} y
  // {dias_limite} de las plantillas.
  const [fechas, setFechas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [vista, setVista] = useState("todas");
  const [creando, setCreando] = useState(false);

  async function cargar() {
    setCargando(true);
    // Las secciones y el tema son para los mensajes: si fallan, la pantalla
    // sigue sirviendo (el WhatsApp saldría con la plantilla de respaldo).
    const [invs, tema, secciones] = await Promise.all([
      api.invitados(),
      api.tema(),
      api.secciones().catch(() => []),
    ]);
    setLista(invs);
    setFechas(secciones.find((s) => s.tipo === "informacion_boda")?.contenido || {});
    setPlantilla(
      claveTema(tema, "whatsapp-plantilla") || "Hola {nombre}, te compartimos tu invitación: {enlace}"
    );
    setRecordatorio(
      claveTema(tema, "whatsapp-recordatorio") ||
        "Hola {nombre}, te recordamos confirmar tu asistencia ({plazo}): {enlace}"
    );
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function borrar(id) {
    if (!confirm("¿Eliminar esta invitación y todas sus personas?")) return;
    await api.borrarInvitado(id);
    cargar();
    toast("Invitación eliminada", "info");
  }

  function reemplazar(actualizada) {
    setLista((prev) => prev.map((i) => (i.id === actualizada.id ? actualizada : i)));
  }

  // Los filtros se cuentan sobre la lista completa: el número que muestra cada
  // uno es cuántas invitaciones te esperan ahí, aunque estés viendo otro.
  const cuentas = useMemo(() => {
    const pendiente = (i) => i.miembros.some((m) => m.estado === "pendiente");
    return {
      todas: lista.length,
      sin_enviar: lista.filter((i) => !i.enviado_en).length,
      sin_responder: lista.filter((i) => i.enviado_en && pendiente(i)).length,
      respondidas: lista.filter((i) => !pendiente(i)).length,
    };
  }, [lista]);

  const VISTAS = [
    { key: "todas", label: "Todas" },
    { key: "sin_enviar", label: "Sin enviar" },
    { key: "sin_responder", label: "Falta que respondan" },
    { key: "respondidas", label: "Ya respondieron" },
  ];

  const filtrada = useMemo(() => {
    const q = paraBuscar(filtro.trim());
    return lista.filter((i) => {
      const pendiente = i.miembros.some((m) => m.estado === "pendiente");
      if (vista === "sin_enviar" && i.enviado_en) return false;
      if (vista === "sin_responder" && (!i.enviado_en || !pendiente)) return false;
      if (vista === "respondidas" && pendiente) return false;
      if (!q) return true;
      return (
        paraBuscar(i.nombre).includes(q) ||
        paraBuscar(i.familia).includes(q) ||
        paraBuscar(i.codigo).includes(q) ||
        (i.telefono || "").includes(q) ||
        i.miembros.some((m) => paraBuscar(m.nombre).includes(q))
      );
    });
  }, [lista, filtro, vista]);

  // Se recalcula en cada render, así que si el panel queda abierto de un día
  // para otro el mensaje sale con los días correctos igual.
  const cuenta = {
    dias: diasHasta(fechas.fecha),
    diasLimite: diasHasta(fechas.fechaLimiteConfirmacion),
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="panel-titulo">Invitaciones</h2>
          <p className="panel-subtitulo">
            {cargando
              ? "Cargando..."
              : `${cuentas.todas} invitaciones · ${cuentas.sin_enviar} sin enviar · ${cuentas.sin_responder} esperando respuesta`}
          </p>
        </div>
        <button onClick={() => setCreando((v) => !v)} className="boton-primario">
          <Icono nombre="mas" className="w-3.5 h-3.5" />
          Nueva invitación
        </button>
      </div>

      {creando && <Crear onCreada={cargar} onCancelar={() => setCreando(false)} />}

      {/* Buscador y filtros juntos: es la barra desde la que se trabaja. */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Icono
            nombre="buscar"
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-tenue"
          />
          <input
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por nombre, código o teléfono..."
            className="campo pl-9"
          />
        </div>
        {VISTAS.map((v) => (
          <button
            key={v.key}
            onClick={() => setVista(v.key)}
            className={`chip-filtro ${vista === v.key ? "chip-filtro-activo" : ""}`}
          >
            {v.label}
            <span className="chip-cuenta">{cuentas[v.key]}</span>
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-sm text-ink-tenue">Cargando...</p>
      ) : filtrada.length ? (
        filtrada.map((inv) => (
          <Tarjeta
            key={inv.id}
            invitacion={inv}
            plantilla={plantilla}
            plantillaRecordatorio={recordatorio}
            cuenta={cuenta}
            onCambio={reemplazar}
            onBorrar={borrar}
          />
        ))
      ) : (
        <div className="vacio">
          <p className="text-sm text-ink">
            {lista.length
              ? "Ninguna invitación coincide con la búsqueda."
              : "Todavía no has creado ninguna invitación."}
          </p>
          <p className="ayuda mt-1 mb-4">
            {lista.length
              ? "Prueba con otro nombre o quita el filtro."
              : "Crea la primera y te generamos su enlace y su código."}
          </p>
          {!lista.length && (
            <button onClick={() => setCreando(true)} className="boton-primario">
              <Icono nombre="mas" className="w-3.5 h-3.5" />
              Nueva invitación
            </button>
          )}
        </div>
      )}

      {!cargando && lista.length > 0 && (
        <p className="ayuda mt-5">
          El texto de los WhatsApp se edita en{" "}
          <button onClick={() => irA?.("mensajes")} className="boton-texto">
            Mensajes
          </button>
          .
        </p>
      )}
    </div>
  );
}
