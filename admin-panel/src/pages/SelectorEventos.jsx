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
export function EventoCreado({ inv, clave, onEntrar, onVolver }) {
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

export function FormularioNuevo({ plantillas, onCreado, onCancelar }) {
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
export function AccesoCliente({ inv, fijo = false }) {
  const toast = useToast();
  const [abierto, setAbierto] = useState(fijo);
  const [usuarios, setUsuarios] = useState(null);
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // En Ajustes del evento el bloque va siempre abierto.
  useEffect(() => {
    if (fijo) api.obtenerAcceso(inv.id).then(setUsuarios).catch((err) => toast(err.message, "error"));
  }, [fijo, inv.id]);

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
    <div className={fijo ? "flex flex-col gap-2" : "border border-borde rounded-lg p-3 flex flex-col gap-2"}>
      {!fijo && (
        <div className="flex items-center justify-between">
          <span className="etiqueta !mb-0">Acceso del cliente</span>
          <button onClick={() => setAbierto(false)} className="boton-texto !text-[11px]">
            cerrar
          </button>
        </div>
      )}
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

// El número de WhatsApp de Sivú que manda los avisos, vinculado como
// WhatsApp Web: se escanea el QR desde el celular de ese número (WhatsApp →
// Dispositivos vinculados). Provisional mientras no esté la cuenta oficial.
export function WhatsappSivu() {
  const toast = useToast();
  const [wa, setWa] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vivo = true;
    let id;
    async function mirar() {
      try {
        const e = await api.estadoWhatsapp();
        if (!vivo) return;
        setWa(e);
        // Mientras se conecta o espera el escaneo, se consulta seguido.
        id = setTimeout(mirar, e.estado === "qr" || e.estado === "conectando" ? 2000 : 15000);
      } catch {
        if (vivo) id = setTimeout(mirar, 15000);
      }
    }
    mirar();
    return () => {
      vivo = false;
      clearTimeout(id);
    };
  }, []);

  async function conectar() {
    setOcupado(true);
    try {
      setWa(await api.conectarWhatsapp());
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setOcupado(false);
    }
  }

  async function desconectar() {
    if (!confirm("¿Desvincular el WhatsApp de Sivú? Los avisos dejan de salir hasta que lo vuelvas a vincular.")) return;
    setOcupado(true);
    try {
      setWa(await api.desconectarWhatsapp());
      toast("WhatsApp desvinculado");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setOcupado(false);
    }
  }

  if (!wa) return null;
  const conectado = wa.estado === "conectado";

  return (
    <div className="tarjeta-lista p-5 mb-8 flex flex-col sm:flex-row gap-5 sm:items-center">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">WhatsApp de Sivú</span>
          <span className={`insignia ${conectado ? "insignia-ok" : wa.estado === "apagado" ? "insignia-neutra" : "insignia-aviso"}`}>
            {conectado ? `vinculado · +${wa.numero}` : wa.estado === "qr" ? "esperando escaneo" : wa.estado === "conectando" ? "conectando..." : "sin vincular"}
          </span>
        </div>
        <p className="text-[12px] text-ink-suave">
          {conectado
            ? "Los avisos de los eventos que los tengan activos salen desde este número."
            : wa.estado === "qr"
              ? "En el celular del número de Sivú abre WhatsApp → Dispositivos vinculados → Vincular un dispositivo, y escanea el código."
              : "Vincula un número de Sivú para que los avisos a los clientes salgan por WhatsApp."}
        </p>
        <p className="text-[11px] text-amber-700">
          Usa un número aparte, no el personal: este modo no es oficial y WhatsApp puede bloquear el número.
        </p>
        {wa.error && !conectado && <p className="text-[11px] text-red-600">{wa.error}</p>}
        <div className="flex gap-2 mt-1">
          {conectado ? (
            <button onClick={desconectar} disabled={ocupado} className="boton-secundario !py-1.5 !text-xs">
              Desvincular
            </button>
          ) : (
            wa.estado === "apagado" && (
              <button onClick={conectar} disabled={ocupado} className="boton-primario !py-1.5 !text-xs">
                {ocupado ? "Preparando..." : "Vincular número"}
              </button>
            )
          )}
        </div>
      </div>
      {wa.estado === "qr" && wa.qr && (
        <img src={wa.qr} alt="Código QR para vincular WhatsApp" className="w-56 h-56 self-center rounded-lg border border-borde bg-white p-2" />
      )}
    </div>
  );
}

const ESTADO_AVISO = {
  enviado: ["insignia-ok", "enviado"],
  simulado: ["insignia-neutra", "simulado"],
  error: ["insignia-no", "falló"],
};

// Avisos por WhatsApp: cuando un invitado responde desde su enlace, Sivú le
// escribe al cliente aunque no tenga el panel abierto. Se prende por evento.
export function AvisosWhatsapp({ inv, onCambio, fijo = false }) {
  const toast = useToast();
  const [abierto, setAbierto] = useState(fijo);
  const [datos, setDatos] = useState(null);
  const [activo, setActivo] = useState(false);
  const [telefonos, setTelefonos] = useState("");
  const [resumen, setResumen] = useState(false);
  const [hora, setHora] = useState(19);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  function cargar(d) {
    setDatos(d);
    setActivo(d.activo);
    // Sin números guardados, se propone el de «Favor confirmar al».
    setTelefonos(d.telefonos || d.sugerido || "");
    setResumen(d.resumen);
    setHora(d.resumenHora);
  }

  useEffect(() => {
    if (fijo) api.obtenerAvisos(inv.id).then(cargar).catch((err) => toast(err.message, "error"));
  }, [fijo, inv.id]);

  async function abrir() {
    if (!abierto) {
      try {
        cargar(await api.obtenerAvisos(inv.id));
      } catch (err) {
        toast(err.message, "error");
        return;
      }
    }
    setAbierto(!abierto);
  }

  async function guardar(e) {
    e.preventDefault();
    setOcupado(true);
    setError("");
    try {
      const d = await api.guardarAvisos(inv.id, { activo, telefonos, resumen, resumenHora: hora });
      cargar(d);
      onCambio({ ...inv, avisos_whatsapp: d.activo });
      toast(d.activo ? "Avisos por WhatsApp activados" : "Avisos por WhatsApp apagados");
    } catch (err) {
      setError(err.message);
    } finally {
      setOcupado(false);
    }
  }

  async function resumenAhora() {
    setOcupado(true);
    setError("");
    try {
      const r = await api.enviarResumen(inv.id);
      cargar(r);
      const fallo = r.resultados.find((x) => x.estado === "error");
      if (fallo) setError(`No salió: ${fallo.detalle}`);
      else toast(r.resultados[0]?.estado === "simulado" ? "Resumen simulado: el WhatsApp de Sivú no está vinculado" : "Resumen enviado");
    } catch (err) {
      setError(err.message);
    } finally {
      setOcupado(false);
    }
  }

  async function probar() {
    setOcupado(true);
    setError("");
    try {
      const r = await api.probarAvisos(inv.id);
      cargar(r);
      const fallos = r.resultados.filter((x) => x.estado === "error");
      if (fallos.length) setError(`No salió: ${fallos[0].detalle}`);
      else toast(r.resultados[0]?.estado === "simulado" ? "Prueba simulada: falta configurar WhatsApp en el servidor" : "Prueba enviada: revisa el WhatsApp del cliente");
    } catch (err) {
      setError(err.message);
    } finally {
      setOcupado(false);
    }
  }

  if (!abierto) {
    return (
      <button onClick={abrir} className="boton-texto !text-[11px] self-start">
        <Icono nombre="campana" className="w-3.5 h-3.5" />
        Avisos por WhatsApp{inv.avisos_whatsapp ? " · activos" : ""}
      </button>
    );
  }

  return (
    <div className={fijo ? "flex flex-col gap-2" : "border border-borde rounded-lg p-3 flex flex-col gap-2"}>
      {!fijo && (
        <div className="flex items-center justify-between">
          <span className="etiqueta !mb-0">Avisos por WhatsApp</span>
          <button onClick={() => setAbierto(false)} className="boton-texto !text-[11px]">
            cerrar
          </button>
        </div>
      )}
      <p className="text-[11px] text-ink-suave">
        Cada vez que un invitado responda desde su enlace, el cliente recibe un WhatsApp diciendo si asiste o no.
        También puede recibir un resumen diario de cómo va.
      </p>
      {datos && !datos.configurado && (
        <p className="text-[11px] text-amber-700">
          El WhatsApp de Sivú no está vinculado (Configuración → WhatsApp de Sivú): los avisos quedan anotados como «simulado» y no salen.
        </p>
      )}
      <form onSubmit={guardar} className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[11px] text-ink cursor-pointer">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          Avisarle al cliente en tiempo real
        </label>
        <input
          className="campo !py-1.5 !text-xs"
          value={telefonos}
          onChange={(e) => setTelefonos(e.target.value)}
          placeholder="WhatsApp del cliente (varios separados por coma)"
          inputMode="tel"
        />
        <label className="flex items-center gap-2 text-[11px] text-ink cursor-pointer">
          <input type="checkbox" checked={resumen} onChange={(e) => setResumen(e.target.checked)} />
          Resumen diario del avance a las
          <select
            className="campo !w-auto !py-0.5 !text-xs"
            value={hora}
            onChange={(e) => setHora(Number(e.target.value))}
            disabled={!resumen}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {h === 0 ? "12 a. m." : h < 12 ? `${h} a. m.` : h === 12 ? "12 m." : `${h - 12} p. m.`}
              </option>
            ))}
          </select>
        </label>
        <p className="text-[10px] text-ink-tenue -mt-1">Solo llega los días con respuestas nuevas, hasta el día del evento.</p>
        {error && <p className="text-red-600 text-[11px]">{error}</p>}
        <div className="flex gap-2">
          <button disabled={ocupado} className="boton-secundario !py-1.5 !text-xs">
            {ocupado ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" disabled={ocupado || !datos?.telefonos} onClick={probar} className="boton-texto !text-[11px]">
            Enviar prueba
          </button>
          <button type="button" disabled={ocupado || !datos?.telefonos} onClick={resumenAhora} className="boton-texto !text-[11px]">
            Enviar resumen ahora
          </button>
        </div>
      </form>
      {datos?.ultimos?.length > 0 && (
        <ul className="flex flex-col gap-1.5 border-t border-borde pt-2">
          {datos.ultimos.map((a, i) => {
            const [clase, etiqueta] = ESTADO_AVISO[a.estado] || ["insignia-neutra", a.estado];
            return (
              <li key={i} className="text-[11px] text-ink-suave">
                <span className={`insignia ${clase} mr-1`}>{etiqueta}</span>
                {new Date(a.creado_en).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                {" · "}
                {a.texto.replace(/ · [^·]*$/, "")}
                {a.estado === "error" && <span className="block text-red-600">{a.detalle}</span>}
              </li>
            );
          })}
        </ul>
      )}
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
      <AvisosWhatsapp inv={inv} onCambio={onCambio} />

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

export default function SelectorEventos({ onElegir, onSalir, incrustado = false }) {
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

  // Dentro del panel del dueño (pestaña «Eventos») ya hay cabecera y fondo.
  return (
    <div className={incrustado ? "" : "min-h-screen panel-lienzo px-6 py-10"}>
      <div className={incrustado ? "" : "max-w-4xl mx-auto"}>
        {!incrustado && <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="marca-sello">c.</span>
            <span>
              <span className="block text-[15px] font-semibold tracking-[-.03em] text-ink">
                Sivú
              </span>
              <span className="block text-[10px] uppercase tracking-[.16em] text-ink-tenue mt-0.5">
                invitaciones digitales
              </span>
            </span>
          </div>
          <button onClick={onSalir} className="boton-texto">
            Cerrar sesión
          </button>
        </div>}

        <h1 className="panel-titulo">Tus eventos</h1>
        <p className="panel-subtitulo mb-8">
          Elige un evento para administrarlo, o crea uno nuevo. Cada uno tiene su propio contenido,
          sus propios invitados y su propio enlace.
        </p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <WhatsappSivu />

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
