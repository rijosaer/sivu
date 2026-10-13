import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../ui/Toast";
import { EVENTO_EN_FRASE, EVENTOS, rellenar, peso, TIPOS_PAGO, ETIQUETAS_CAMPO_PAGO, nombreMetodo, textoMetodosPago } from "./comun";

// Configuración del negocio: todo lo que antes había que pedir que se
// cambiara en el servidor. Cada bloque se guarda por separado.

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const hora12 = (h) => (h === 0 ? "12 a. m." : h < 12 ? `${h} a. m.` : h === 12 ? "12 m." : `${h - 12} p. m.`);
const HORAS = Array.from({ length: 24 }, (_, h) => h);

// Igual que el servidor (ajustes.js), para la vista previa en vivo.
function describirHorario(h) {
  if (!h?.definido || !h.dias?.length) return "";
  const dias = [...new Set(h.dias)].sort((a, b) => a - b);
  const seguidos = dias.length > 1 && dias.every((d, i) => i === 0 || d === dias[i - 1] + 1);
  const texto =
    dias.length === 7
      ? "todos los días"
      : seguidos
        ? `de ${DIAS_LARGOS[dias[0]]} a ${DIAS_LARGOS[dias.at(-1)]}`
        : `los ${dias.map((d) => DIAS_LARGOS[d]).join(", ").replace(/, ([^,]*)$/, " y $1")}`;
  return `${texto}, de ${hora12(h.desde)} a ${hora12(h.hasta)}`;
}
function ahoraBogota() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", weekday: "short", hour: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value])
  );
  return { dia: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), hora: Number(p.hour) };
}
function dentroDeHorario(h) {
  if (!h?.definido) return true;
  const { dia, hora } = ahoraBogota();
  return h.dias.includes(dia) && hora >= h.desde && hora < h.hasta;
}
function proximaAtencion(h) {
  if (!h?.definido) return "en cuanto podamos";
  const { dia, hora } = ahoraBogota();
  if (h.dias.includes(dia) && hora < h.desde) return `hoy desde las ${hora12(h.desde)}`;
  for (let i = 1; i <= 7; i++) {
    const d = (dia + i) % 7;
    if (h.dias.includes(d)) return i === 1 ? "mañana a primera hora" : `el ${DIAS_LARGOS[d]} en la mañana`;
  }
  return "en cuanto podamos";
}

function Bloque({ titulo, ayuda, children, onGuardar, guardando, sucio }) {
  return (
    <section className="tarjeta p-5 mb-5">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="max-w-prose">
          <h3 className="bloque-titulo">{titulo}</h3>
          {ayuda && <p className="ayuda mt-0.5">{ayuda}</p>}
        </div>
        {onGuardar && (
          <button onClick={onGuardar} disabled={guardando || !sucio} className="boton-primario !py-1.5 !text-xs">
            {guardando ? "Guardando..." : sucio ? "Guardar" : "Guardado"}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

const Check = ({ checked, onChange, children }) => (
  <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer">
    <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
    {children}
  </label>
);

function SelectHora({ value, onChange }) {
  return (
    <select className="campo-sm !w-auto" value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {HORAS.map((h) => (
        <option key={h} value={h}>
          {hora12(h)}
        </option>
      ))}
    </select>
  );
}

const telefonosTexto = (lista) => (lista || []).map((t) => `+${t}`).join(", ");
const textoATelefonos = (t) =>
  String(t || "")
    .split(/[,;\n]+/)
    .map((x) => x.replace(/\D/g, ""))
    .filter(Boolean);

// El QR se guarda como imagen dentro de la configuración: se achica a 700 px
// para que pese poco y se vea nítido en la cotización.
async function achicarQr(file) {
  const bmp = await createImageBitmap(file);
  const escala = Math.min(1, 700 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * escala);
  canvas.height = Math.round(bmp.height * escala);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}
const CON_QR = ["nequi", "daviplata", "bancolombia", "banco", "llave", "otro"];

// Un método de pago: el tipo decide qué datos se piden.
function MetodoPago({ m, onCambio, onQuitar, onSubir, primero }) {
  const t = TIPOS_PAGO[m.tipo] || TIPOS_PAGO.otro;
  const activo = m.activo !== false;
  const campo = (k, label, props = {}) => (
    <label key={k} className="block">
      <span className="etiqueta">{label}</span>
      <input className="campo-sm" value={m[k] || ""} onChange={(e) => onCambio({ [k]: e.target.value })} {...props} />
    </label>
  );
  return (
    <div className={`border rounded-xl p-3 flex flex-col gap-3 ${activo ? "border-borde" : "border-dashed border-borde-fuerte opacity-60"}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="w-8 h-8 rounded-lg grid place-items-center text-base shrink-0"
          style={{ background: `${t.color}14`, border: `1px solid ${t.color}33` }}
        >
          {t.emoji}
        </span>
        <select className="campo-sm !w-auto" value={m.tipo} onChange={(e) => onCambio({ tipo: e.target.value, nombre: "" })}>
          {Object.entries(TIPOS_PAGO).map(([k, v]) => (
            <option key={k} value={k}>
              {v.nombre}
            </option>
          ))}
        </select>
        <input
          className="campo-sm flex-1 min-w-[8rem]"
          value={m.nombre || ""}
          placeholder={`Nombre que ve el cliente (${t.nombre})`}
          onChange={(e) => onCambio({ nombre: e.target.value })}
        />
        <label className="flex items-center gap-1.5 text-[12px] text-ink cursor-pointer">
          <input type="checkbox" checked={activo} onChange={(e) => onCambio({ activo: e.target.checked })} />
          Mostrar
        </label>
        {!primero && (
          <button onClick={onSubir} className="boton-texto !text-[11px]" title="Subir">
            ↑
          </button>
        )}
        <button onClick={onQuitar} className="boton-texto !text-[11px]">
          quitar
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {t.campos.map((k) =>
          k === "numero"
            ? campo("numero", t.etiquetaNumero || "Número", { inputMode: m.tipo === "llave" ? "text" : "numeric" })
            : k === "tipoCuenta" ? (
                <label key={k} className="block">
                  <span className="etiqueta">Tipo de cuenta</span>
                  <select className="campo-sm" value={m.tipoCuenta || ""} onChange={(e) => onCambio({ tipoCuenta: e.target.value })}>
                    <option value="">—</option>
                    <option>Ahorros</option>
                    <option>Corriente</option>
                  </select>
                </label>
              ) : (
                campo(k, ETIQUETAS_CAMPO_PAGO[k], k === "enlace" ? { placeholder: "https://..." } : {})
              )
        )}
      </div>
      {CON_QR.includes(m.tipo) && (
        <div className="flex items-center gap-3 flex-wrap">
          {m.qr ? (
            <>
              <img src={m.qr} alt="QR de pago" className="w-24 h-24 object-contain rounded-lg border border-borde bg-white" />
              <button onClick={() => onCambio({ qr: "" })} className="boton-texto !text-[11px]">
                quitar QR
              </button>
            </>
          ) : (
            <label className="boton-secundario !text-xs cursor-pointer">
              Subir imagen del QR (opcional)
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) onCambio({ qr: await achicarQr(f) });
                }}
              />
            </label>
          )}
          <span className="ayuda">Ej. el QR de Nequi Negocios: el cliente lo guarda y lo paga desde su app.</span>
        </div>
      )}
    </div>
  );
}

export default function Configuracion() {
  const toast = useToast();
  const [a, setA] = useState(null);
  const [original, setOriginal] = useState(null);
  const [guardando, setGuardando] = useState("");
  const [ejemplo, setEjemplo] = useState({ nombre: "Ana Pérez", evento: "boda" });

  useEffect(() => {
    api.crm.ajustes().then((r) => {
      setA(r.ajustes);
      setOriginal(JSON.stringify(r.ajustes));
    });
  }, []);

  if (!a) return <p className="text-sm text-ink-tenue">Cargando...</p>;
  const orig = JSON.parse(original);
  const sucio = (k) => JSON.stringify(a[k]) !== JSON.stringify(orig[k]);
  const set = (k, cambios) => setA((prev) => ({ ...prev, [k]: Array.isArray(cambios) ? cambios : { ...prev[k], ...cambios } }));

  async function guardar(...claves) {
    setGuardando(claves[0]);
    try {
      let r;
      for (const k of claves) r = await api.crm.guardarAjuste(k, a[k]);
      setA(r.ajustes);
      setOriginal(JSON.stringify(r.ajustes));
      toast("Guardado");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setGuardando("");
    }
  }

  const vistaSaludo = rellenar(dentroDeHorario(a.horario) ? a.saludo.texto : a.saludo.textoFueraHorario, {
    nombre: ejemplo.nombre.split(/\s+/)[0],
    evento: EVENTO_EN_FRASE[ejemplo.evento],
    horario: describirHorario(a.horario),
    proxima_atencion: proximaAtencion(a.horario),
  });

  return (
    <div>
      <h2 className="panel-titulo">Configuración</h2>
      <p className="panel-subtitulo mb-6">Textos, horario, avisos, reporte, respuestas y precios. Todo se cambia aquí.</p>

      <Bloque
        titulo="Horario de atención"
        ayuda="Si lo defines, el mensaje automático lo menciona y usa otro texto fuera de horario. Si no, no se menciona."
        onGuardar={() => guardar("horario")}
        guardando={guardando === "horario"}
        sucio={sucio("horario")}
      >
        <Check checked={a.horario.definido} onChange={(v) => set("horario", { definido: v })}>
          Tenemos horario definido
        </Check>
        {a.horario.definido && (
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {DIAS.map((d, i) => {
                const activo = a.horario.dias.includes(i);
                return (
                  <button
                    key={d}
                    onClick={() =>
                      set("horario", { dias: activo ? a.horario.dias.filter((x) => x !== i) : [...a.horario.dias, i].sort() })
                    }
                    className={`chip-filtro ${activo ? "chip-filtro-activo" : ""}`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              De <SelectHora value={a.horario.desde} onChange={(v) => set("horario", { desde: v })} /> a{" "}
              <SelectHora value={a.horario.hasta} onChange={(v) => set("horario", { hasta: v })} />
            </div>
            <p className="ayuda">Se lee así: «Atendemos {describirHorario(a.horario)}».</p>
          </div>
        )}
      </Bloque>

      <Bloque
        titulo="Mensaje automático al cliente"
        ayuda="Le llega a quien llena el formulario del anuncio: confirma que recibimos su solicitud y que una persona le escribirá. No arma nada ni promete tiempos."
        onGuardar={() => guardar("saludo")}
        guardando={guardando === "saludo"}
        sucio={sucio("saludo")}
      >
        <div className="flex flex-col gap-3">
          <Check checked={a.saludo.activo} onChange={(v) => set("saludo", { activo: v })}>
            <b>Enviar el mensaje automático</b> {a.saludo.activo ? "(prendido)" : "(apagado)"}
          </Check>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <label className="block">
                <span className="etiqueta">Texto (en horario o sin horario definido)</span>
                <textarea className="campo !text-[13px] min-h-[220px]" value={a.saludo.texto} onChange={(e) => set("saludo", { texto: e.target.value })} />
              </label>
              <label className="block">
                <span className="etiqueta">Texto fuera de horario</span>
                <textarea
                  className="campo !text-[13px] min-h-[180px]"
                  value={a.saludo.textoFueraHorario}
                  onChange={(e) => set("saludo", { textoFueraHorario: e.target.value })}
                />
              </label>
              <p className="ayuda">
                Comodines: <code>{"{nombre}"}</code> (primer nombre), <code>{"{evento}"}</code> («tu boda», «tus XV años»…),{" "}
                <code>{"{horario}"}</code>, <code>{"{proxima_atencion}"}</code> («mañana a primera hora»). Una línea con un comodín vacío no
                se envía. Para negrita usa *asteriscos*.
              </p>
              <div className="flex items-center gap-2 text-[13px] flex-wrap">
                No escribir de madrugada: solo de <SelectHora value={a.saludo.enviarDesde} onChange={(v) => set("saludo", { enviarDesde: v })} /> a{" "}
                <SelectHora value={a.saludo.enviarHasta} onChange={(v) => set("saludo", { enviarHasta: v })} />
              </div>
              <Check checked={a.saludo.responderWhatsappDirecto} onChange={(v) => set("saludo", { responderWhatsappDirecto: v })}>
                Enviarlo también a quien escribe directo por WhatsApp por primera vez
              </Check>
              {a.saludo.responderWhatsappDirecto && (
                <p className="text-[11px] text-amber-700">
                  Ojo: al WhatsApp de Sivú también escriben amigos y proveedores. Si a alguno le llega, márcalo como «No es cliente» en su ficha.
                </p>
              )}
            </div>
            <div>
              <span className="etiqueta">Así le llega (ahora mismo)</span>
              <div className="flex gap-2 mb-2">
                <input className="campo-sm" value={ejemplo.nombre} onChange={(e) => setEjemplo((p) => ({ ...p, nombre: e.target.value }))} />
                <select className="campo-sm !w-auto" value={ejemplo.evento} onChange={(e) => setEjemplo((p) => ({ ...p, evento: e.target.value }))}>
                  {Object.entries(EVENTOS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-[#efeae2] rounded-xl p-3">
                <div className="bg-white rounded-lg px-3 py-2 text-[13px] whitespace-pre-wrap shadow-sm">
                  {vistaSaludo.split(/(\*[^*\n]+\*)/g).map((t, i) => (t.startsWith("*") && t.endsWith("*") ? <b key={i}>{t.slice(1, -1)}</b> : t))}
                </div>
              </div>
              <p className="ayuda mt-1">{dentroDeHorario(a.horario) ? "Ahora estamos en horario." : "Ahora estamos fuera de horario."}</p>
            </div>
          </div>
        </div>
      </Bloque>

      <Bloque
        titulo="Avisos al equipo"
        ayuda="A estos números les llega cada cliente potencial nuevo y las novedades importantes, desde el WhatsApp de Sivú."
        onGuardar={() => guardar("avisos")}
        guardando={guardando === "avisos"}
        sucio={sucio("avisos")}
      >
        <label className="block mb-3">
          <span className="etiqueta">Números (separados por coma)</span>
          <input
            className="campo"
            defaultValue={telefonosTexto(a.avisos.telefonos)}
            onChange={(e) => set("avisos", { telefonos: textoATelefonos(e.target.value) })}
            placeholder="+57 301 254 1996, +57 314 404 8898"
          />
        </label>
        <div className="flex flex-col gap-2">
          <Check checked={a.avisos.whatsappDirecto} onChange={(v) => set("avisos", { whatsappDirecto: v })}>
            Avisar también cuando alguien nuevo escribe directo al WhatsApp
          </Check>
          <Check checked={a.avisos.cotizacionAceptada} onChange={(v) => set("avisos", { cotizacionAceptada: v })}>
            Avisar cuando un cliente acepta una cotización
          </Check>
          <Check checked={a.avisos.datosRecibidos} onChange={(v) => set("avisos", { datosRecibidos: v })}>
            Avisar cuando un cliente envía los datos de su evento
          </Check>
        </div>
      </Bloque>

      <Bloque
        titulo="Reporte de la mañana"
        ayuda="Cada día: anuncios de ayer, clientes nuevos y qué hay que hacer hoy. Los lunes suma la semana. Si no hay novedades, no llega."
        onGuardar={() => guardar("reporte")}
        guardando={guardando === "reporte"}
        sucio={sucio("reporte")}
      >
        <div className="flex flex-col gap-3">
          <Check checked={a.reporte.activo} onChange={(v) => set("reporte", { activo: v })}>
            Enviar el reporte cada mañana
          </Check>
          <div className="flex items-center gap-2 text-[13px]">
            A las <SelectHora value={a.reporte.hora} onChange={(v) => set("reporte", { hora: v })} />
            <select className="campo-sm !w-auto" value={a.reporte.minuto} onChange={(e) => set("reporte", { minuto: Number(e.target.value) })}>
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>
                  :{String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
          <label className="block">
            <span className="etiqueta">Números (vacío = los mismos de los avisos)</span>
            <input
              className="campo"
              defaultValue={telefonosTexto(a.reporte.telefonos)}
              onChange={(e) => set("reporte", { telefonos: textoATelefonos(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="etiqueta">Campañas que cuentan (el nombre contiene)</span>
            <input className="campo" value={a.reporte.filtroCampana} onChange={(e) => set("reporte", { filtroCampana: e.target.value })} />
            <span className="ayuda">La cuenta de anuncios también tiene campañas de Trivo: solo se suman las que tengan este texto en el nombre.</span>
          </label>
        </div>
      </Bloque>

      <Bloque
        titulo="Orden del WhatsApp"
        ayuda="Para que el WhatsApp de Sivú no sea un reguero entre clientes e invitados."
        onGuardar={() => guardar("whatsapp", "captura")}
        guardando={guardando === "whatsapp"}
        sucio={sucio("whatsapp") || sucio("captura")}
      >
        <div className="flex flex-col gap-2">
          <Check checked={a.captura.whatsappDirecto} onChange={(v) => set("captura", { whatsappDirecto: v })}>
            Quien escribe por primera vez (y no es invitado ni cliente) entra como cliente potencial
          </Check>
          <Check checked={a.whatsapp.etiquetar} onChange={(v) => set("whatsapp", { etiquetar: v })}>
            Poner etiquetas de WhatsApp Business: 🎯 Cliente potencial, 💼 Cliente y 💌 una por evento para los invitados
          </Check>
          <Check checked={a.whatsapp.archivarInvitados} onChange={(v) => set("whatsapp", { archivarInvitados: v })}>
            Archivar el chat de cada invitado después del envío automático (sus respuestas se ven en el panel)
          </Check>
        </div>
      </Bloque>

      <Bloque
        titulo="Seguimientos"
        onGuardar={() => guardar("seguimiento")}
        guardando={guardando === "seguimiento"}
        sucio={sucio("seguimiento")}
      >
        <div className="flex flex-col gap-2 text-[13px]">
          <label className="flex items-center gap-2">
            Al cotizar, proponer seguimiento a los
            <input
              className="campo-sm !w-16"
              inputMode="numeric"
              value={a.seguimiento.diasCotizado}
              onChange={(e) => set("seguimiento", { diasCotizado: Number(e.target.value.replace(/\D/g, "")) || 1 })}
            />
            días
          </label>
          <label className="flex items-center gap-2">
            Pasar a «Frío» después de
            <input
              className="campo-sm !w-16"
              inputMode="numeric"
              value={a.seguimiento.diasFrio}
              onChange={(e) => set("seguimiento", { diasFrio: Number(e.target.value.replace(/\D/g, "")) || 7 })}
            />
            días sin movimiento
          </label>
        </div>
      </Bloque>

      <Bloque
        titulo="Respuestas listas"
        ayuda="Botones en la ficha de cada cliente: abren su chat con el texto ya escrito para que lo revises y lo mandes. Comodines: {nombre}, {evento}, {valor}, {catalogo}, {cotizacion} (enlace de su última cotización), {datos} (enlace del formulario de datos de su evento), {pagos} (tus métodos de pago), {anticipo} (valor del anticipo)."
        onGuardar={() => guardar("respuestas")}
        guardando={guardando === "respuestas"}
        sucio={sucio("respuestas")}
      >
        <div className="flex flex-col gap-3">
          {a.respuestas.map((r, i) => (
            <div key={r.id} className="border border-borde rounded-xl p-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  className="campo-sm flex-1"
                  value={r.titulo}
                  onChange={(e) => set("respuestas", a.respuestas.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)))}
                />
                <button onClick={() => set("respuestas", a.respuestas.filter((_, j) => j !== i))} className="boton-texto !text-[11px]">
                  quitar
                </button>
              </div>
              <textarea
                className="campo-sm min-h-[90px]"
                value={r.texto}
                onChange={(e) => set("respuestas", a.respuestas.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))}
              />
            </div>
          ))}
          <button
            onClick={() => set("respuestas", [...a.respuestas, { id: `r${Date.now()}`, titulo: "Nueva respuesta", texto: "¡Hola {nombre}! " }])}
            className="boton-texto !text-xs self-start"
          >
            + Agregar respuesta
          </button>
        </div>
      </Bloque>

      <Bloque
        titulo="Planes y extras"
        ayuda="Con esto se arma una cotización en un toque. Cada cotización se puede ajustar a mano."
        onGuardar={() => guardar("planes", "extras")}
        guardando={guardando === "planes"}
        sucio={sucio("planes") || sucio("extras")}
      >
        <div className="flex flex-col gap-3">
          {a.planes.map((pl, i) => {
            const cambiar = (c) => set("planes", a.planes.map((x, j) => (j === i ? { ...x, ...c } : x)));
            return (
              <div key={pl.id} className="border border-borde rounded-xl p-3 grid sm:grid-cols-[1fr_9rem] gap-2">
                <input className="campo-sm" value={pl.nombre} onChange={(e) => cambiar({ nombre: e.target.value })} placeholder="Nombre del plan" />
                <input
                  className="campo-sm text-right"
                  inputMode="numeric"
                  value={Number(pl.precio || 0).toLocaleString("es-CO")}
                  onChange={(e) => cambiar({ precio: Number(e.target.value.replace(/\D/g, "")) || 0 })}
                />
                <input className="campo-sm sm:col-span-2" value={pl.descripcion} onChange={(e) => cambiar({ descripcion: e.target.value })} placeholder="Descripción corta" />
                <textarea
                  className="campo-sm sm:col-span-2 min-h-[80px]"
                  value={(pl.incluye || []).join("\n")}
                  onChange={(e) => cambiar({ incluye: e.target.value.split("\n") })}
                  placeholder="Qué incluye (una cosa por línea)"
                />
                <button onClick={() => set("planes", a.planes.filter((_, j) => j !== i))} className="boton-texto !text-[11px] justify-self-start">
                  quitar plan
                </button>
              </div>
            );
          })}
          <button
            onClick={() => set("planes", [...a.planes, { id: `p${Date.now()}`, nombre: "Nuevo plan", precio: 0, descripcion: "", incluye: [] }])}
            className="boton-texto !text-xs self-start"
          >
            + Agregar plan
          </button>
          <p className="etiqueta !mb-0 mt-2">Extras</p>
          {a.extras.map((ex, i) => {
            const cambiar = (c) => set("extras", a.extras.map((x, j) => (j === i ? { ...x, ...c } : x)));
            return (
              <div key={ex.id} className="flex flex-wrap gap-2">
                <input className="campo-sm flex-1 min-w-[10rem]" value={ex.nombre} onChange={(e) => cambiar({ nombre: e.target.value })} placeholder="Ej. Video de invitación" />
                <input
                  className="campo-sm !w-32 text-right"
                  inputMode="numeric"
                  value={Number(ex.precio || 0).toLocaleString("es-CO")}
                  onChange={(e) => cambiar({ precio: Number(e.target.value.replace(/\D/g, "")) || 0 })}
                />
                <button onClick={() => set("extras", a.extras.filter((_, j) => j !== i))} className="boton-texto !text-[11px]">
                  quitar
                </button>
              </div>
            );
          })}
          <button
            onClick={() => set("extras", [...a.extras, { id: `e${Date.now()}`, nombre: "", precio: 0, descripcion: "" }])}
            className="boton-texto !text-xs self-start"
          >
            + Agregar extra
          </button>
          <p className="ayuda">
            Vista rápida: {a.planes.map((p) => `${p.nombre} ${peso(p.precio)}`).join(" · ")}
          </p>
        </div>
      </Bloque>

      <Bloque
        titulo="Métodos de pago"
        ayuda="Salen en cada cotización con botón para copiar el número, y en la respuesta lista «Datos de pago». El cliente puede avisar «Ya pagué» y te llega el aviso."
        onGuardar={() => guardar("pagos")}
        guardando={guardando === "pagos"}
        sucio={sucio("pagos")}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[13px] flex-wrap">
            Anticipo para separar la fecha:
            <input
              className="campo-sm !w-16 text-center"
              inputMode="numeric"
              value={a.pagos.anticipo}
              onChange={(e) => set("pagos", { anticipo: Math.min(100, Number(e.target.value.replace(/\D/g, "")) || 0) })}
            />
            % <span className="ayuda">(0 = no se menciona)</span>
          </div>
          {a.pagos.metodos.map((m, i) => (
            <MetodoPago
              key={m.id}
              m={m}
              primero={i === 0}
              onCambio={(c) => set("pagos", { metodos: a.pagos.metodos.map((x, j) => (j === i ? { ...x, ...c } : x)) })}
              onQuitar={() => set("pagos", { metodos: a.pagos.metodos.filter((_, j) => j !== i) })}
              onSubir={() => {
                const l = [...a.pagos.metodos];
                [l[i - 1], l[i]] = [l[i], l[i - 1]];
                set("pagos", { metodos: l });
              }}
            />
          ))}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(TIPOS_PAGO).map(([k, v]) => (
              <button
                key={k}
                onClick={() =>
                  set("pagos", { metodos: [...a.pagos.metodos, { id: `m${Date.now()}`, tipo: k, nombre: "", activo: true }] })
                }
                className="chip-filtro"
              >
                + {v.emoji} {v.nombre}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="etiqueta">Indicación después de pagar</span>
            <input className="campo-sm" value={a.pagos.instrucciones} onChange={(e) => set("pagos", { instrucciones: e.target.value })} />
          </label>
          {a.pagos.metodos.some((m) => m.activo !== false) && (
            <div>
              <span className="etiqueta">Así sale en WhatsApp (respuesta «Datos de pago»)</span>
              <pre className="whitespace-pre-wrap font-sans text-[13px] bg-[#efeae2] rounded-xl p-3">{textoMetodosPago(a.pagos.metodos)}</pre>
            </div>
          )}
          {!a.pagos.metodos.length && <p className="ayuda">Agrega al menos uno con los botones de arriba.</p>}
          <p className="ayuda">
            En Producción, al registrar un pago eliges con cuál llegó:{" "}
            {a.pagos.metodos.length ? a.pagos.metodos.map(nombreMetodo).join(", ") : "—"}.
          </p>
        </div>
      </Bloque>

      <Bloque
        titulo="Cotizaciones"
        ayuda="Lo que ve el cliente al abrir su cotización."
        onGuardar={() => guardar("cotizacion")}
        guardando={guardando === "cotizacion"}
        sucio={sucio("cotizacion")}
      >
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-[13px]">
            Vigencia de
            <input
              className="campo-sm !w-16"
              inputMode="numeric"
              value={a.cotizacion.vigenciaDias}
              onChange={(e) => set("cotizacion", { vigenciaDias: Number(e.target.value.replace(/\D/g, "")) || 8 })}
            />
            días
          </label>
          <label className="block">
            <span className="etiqueta">Notas que van en todas (condiciones)</span>
            <textarea className="campo-sm min-h-[70px]" value={a.cotizacion.notas} onChange={(e) => set("cotizacion", { notas: e.target.value })} />
          </label>
          <label className="block">
            <span className="etiqueta">Otras indicaciones de pago (opcional)</span>
            <textarea
              className="campo-sm min-h-[70px]"
              value={a.cotizacion.pago}
              onChange={(e) => set("cotizacion", { pago: e.target.value })}
              placeholder="Ej. Si pagas desde otro banco, la transferencia tarda un día"
            />
            <span className="ayuda">Los métodos de pago se configuran en el bloque de arriba; esto es un texto adicional.</span>
          </label>
        </div>
      </Bloque>
    </div>
  );
}
