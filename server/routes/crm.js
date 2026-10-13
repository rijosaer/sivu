import { Router } from "express";
import crypto from "node:crypto";
import { pool } from "../db.js";
import { capturar } from "../errores.js";
import { normalizarTelefono, telefonosDe } from "../avisosWhatsapp.js";
import { whatsappConectado } from "../whatsappWeb.js";
import { CLAVES, DEFECTOS, leerAjustes, guardarAjuste, leerAjuste, SITIO } from "../ajustes.js";
import { ESTADOS, ORIGENES, EVENTOS, anotar, crearOUnir, prioridad } from "../prospectos.js";
import { enviarDesdePanel, etiquetarCliente, jidDe, etiquetar } from "../waOrden.js";
import { textoSaludo } from "../saludo.js";
import { metricas, pendientesDeHoy, enviarReporte, armarReporte } from "../reporte.js";
import { estadoLeads } from "../leadsMeta.js";

// Todo lo del negocio de Sivú que está por encima de un evento: clientes
// potenciales, configuración, cotizaciones y producción. Solo el dueño (lo
// monta admin.js detrás de soloDueno).
export const crmRouter = Router();

const token = () => crypto.randomBytes(9).toString("base64url");
const entero = (v) => (v === "" || v === null || v === undefined ? null : Math.max(0, Math.round(Number(v) || 0)));
const fecha = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? v : null);

const urlCotizacion = (t) => `${SITIO()}/cotizacion/${t}`;

const NOMBRE_ESTADO = {
  nuevo: "Nuevo", contactado: "Contactado", cotizado: "Cotizado", ganado: "Ganado", perdido: "Perdido", frio: "Frío",
};

function conPrioridad(p) {
  return { ...p, prioridad: prioridad(p) };
}

// ---------- Tablero ----------

crmRouter.get(
  "/tablero",
  capturar(async (_req, res) => {
    const [m, pend] = await Promise.all([metricas(), pendientesDeHoy()]);
    const { rows: [conteos] } = await pool.query(
      `SELECT ${ESTADOS.map((e) => `count(*) FILTER (WHERE estado = '${e}')::int AS ${e}`).join(", ")} FROM prospectos`
    );
    res.json({
      metricas: m,
      conteos,
      hoy: {
        calientes: pend.calientes.length,
        sinContactar: pend.sinContactar.length,
        seguimientos: pend.seguimientos.length,
        sinLeer: pend.sinLeer.length,
        atrasados: pend.atrasados.map((e) => ({ id: e.id, nombre: e.nombre, dias: e.dias, etapa: e.etapa })),
        saldos: pend.saldos.map((e) => ({
          id: e.id, nombre: e.nombre, dias: e.dias, falta: Number(e.valor_total) - Number(e.pagado),
        })),
      },
      whatsapp: whatsappConectado(),
      leads: estadoLeads(),
    });
  })
);

// ---------- Clientes potenciales ----------

crmRouter.get(
  "/prospectos",
  capturar(async (req, res) => {
    const { estado, origen, evento, q } = req.query;
    const filtros = [];
    const params = [];
    if (estado === "abiertos") filtros.push("p.estado IN ('nuevo', 'contactado', 'cotizado')");
    else if (ESTADOS.includes(estado)) {
      params.push(estado);
      filtros.push(`p.estado = $${params.length}`);
    }
    if (ORIGENES.includes(origen)) {
      params.push(origen);
      filtros.push(`p.origen = $${params.length}`);
    }
    if (EVENTOS.includes(evento)) {
      params.push(evento);
      filtros.push(`p.evento = $${params.length}`);
    }
    if (q?.trim()) {
      params.push(`%${q.trim().toLowerCase()}%`);
      const digitos = q.replace(/\D/g, "");
      filtros.push(
        `(lower(p.nombre) LIKE $${params.length} OR lower(p.ciudad) LIKE $${params.length} OR lower(p.notas) LIKE $${params.length}` +
          (digitos.length >= 4 ? ` OR p.telefono LIKE '%${digitos}%'` : "") +
          ")"
      );
    }
    const { rows } = await pool.query(
      `SELECT p.*,
         EXISTS (SELECT 1 FROM cotizaciones c WHERE c.prospecto_id = p.id AND c.vistas > 0) AS cotizacion_vista,
         (SELECT texto FROM mensajes_whatsapp m WHERE m.prospecto_id = p.id ORDER BY m.creado_en DESC LIMIT 1) AS ultimo_mensaje,
         (SELECT direccion FROM mensajes_whatsapp m WHERE m.prospecto_id = p.id ORDER BY m.creado_en DESC LIMIT 1) AS ultimo_direccion
       FROM prospectos p
       ${filtros.length ? `WHERE ${filtros.join(" AND ")}` : ""}
       ORDER BY p.creado_en DESC
       LIMIT 500`,
      params
    );
    res.json(rows.map(conPrioridad));
  })
);

crmRouter.post(
  "/prospectos",
  capturar(async (req, res) => {
    const { nombre, telefono, origen = "otro", evento = "", ciudad = "", notas = "" } = req.body;
    if (!String(nombre || "").trim() && !normalizarTelefono(telefono)) {
      return res.status(400).json({ error: "Escribe al menos el nombre o el teléfono" });
    }
    const { prospecto, nuevo } = await crearOUnir({ origen, nombre, telefono, evento, ciudad, notas });
    if (nuevo && prospecto.telefono) etiquetar(jidDe(prospecto.telefono), "🎯 Cliente potencial");
    res.status(nuevo ? 201 : 200).json({ ...conPrioridad(prospecto), unido: !nuevo });
  })
);

async function cargarProspecto(id) {
  const { rows: [p] } = await pool.query(
    `SELECT p.*, EXISTS (SELECT 1 FROM cotizaciones c WHERE c.prospecto_id = p.id AND c.vistas > 0) AS cotizacion_vista,
            i.slug AS invitacion_slug, i.nombre AS invitacion_nombre, i.datos_token
     FROM prospectos p LEFT JOIN invitaciones i ON i.id = p.invitacion_id
     WHERE p.id = $1`,
    [id]
  );
  return p ? conPrioridad(p) : null;
}

crmRouter.get(
  "/prospectos/:id",
  capturar(async (req, res) => {
    const p = await cargarProspecto(req.params.id);
    if (!p) return res.status(404).json({ error: "Ese cliente no existe" });
    const [historial, mensajes, cotizaciones] = await Promise.all([
      pool.query("SELECT tipo, detalle, creado_en FROM prospecto_historial WHERE prospecto_id = $1 ORDER BY creado_en DESC LIMIT 100", [p.id]),
      pool.query(
        `SELECT id, direccion, texto, tipo, creado_en FROM mensajes_whatsapp
         WHERE prospecto_id = $1 OR (prospecto_id IS NULL AND telefono = $2 AND $2 <> '')
         ORDER BY creado_en DESC LIMIT 200`,
        [p.id, p.telefono]
      ),
      pool.query("SELECT * FROM cotizaciones WHERE prospecto_id = $1 ORDER BY creado_en DESC", [p.id]),
    ]);
    res.json({
      ...p,
      historial: historial.rows,
      mensajes: mensajes.rows.reverse(),
      cotizaciones: cotizaciones.rows.map((c) => ({ ...c, total: Number(c.total), url: urlCotizacion(c.token) })),
    });
  })
);

crmRouter.post(
  "/prospectos/:id/leido",
  capturar(async (req, res) => {
    await pool.query("UPDATE prospectos SET sin_leer = 0 WHERE id = $1", [req.params.id]);
    await pool.query("UPDATE mensajes_whatsapp SET leido = true WHERE prospecto_id = $1 AND NOT leido", [req.params.id]);
    res.json({ ok: true });
  })
);

crmRouter.put(
  "/prospectos/:id",
  capturar(async (req, res) => {
    const previo = await cargarProspecto(req.params.id);
    if (!previo) return res.status(404).json({ error: "Ese cliente no existe" });
    const b = req.body;
    const cambios = {};
    if ("nombre" in b) cambios.nombre = String(b.nombre || "").trim().slice(0, 120);
    if ("telefono" in b) {
      const t = normalizarTelefono(b.telefono);
      if (t && t !== previo.telefono) {
        const { rows } = await pool.query("SELECT id FROM prospectos WHERE telefono = $1 AND id <> $2", [t, previo.id]);
        if (rows.length) return res.status(400).json({ error: "Ese teléfono ya es de otro cliente potencial" });
      }
      cambios.telefono = t;
    }
    if ("origen" in b && ORIGENES.includes(b.origen)) cambios.origen = b.origen;
    if ("evento" in b && (b.evento === "" || EVENTOS.includes(b.evento))) cambios.evento = b.evento;
    for (const k of ["cuando", "invitados", "ciudad", "motivo_perdida"]) if (k in b) cambios[k] = String(b[k] || "").slice(0, 120);
    if ("notas" in b) cambios.notas = String(b.notas || "").slice(0, 8000);
    if ("fecha_evento" in b) cambios.fecha_evento = fecha(b.fecha_evento);
    if ("proximo_seguimiento" in b) cambios.proximo_seguimiento = fecha(b.proximo_seguimiento);
    if ("valor_cotizado" in b) cambios.valor_cotizado = entero(b.valor_cotizado);
    if ("valor_ganado" in b) cambios.valor_ganado = entero(b.valor_ganado);
    if ("invitacion_id" in b) cambios.invitacion_id = b.invitacion_id ? Number(b.invitacion_id) : null;

    let nuevoEstado = null;
    if ("estado" in b && ESTADOS.includes(b.estado) && b.estado !== previo.estado) {
      nuevoEstado = b.estado;
      cambios.estado = nuevoEstado;
      if (nuevoEstado === "contactado" && !previo.contactado_en) cambios.contactado_en = new Date();
      if (nuevoEstado === "cotizado") {
        cambios.cotizado_en = new Date();
        // Seguimiento propuesto: en N días, si no hay uno puesto.
        if (!("proximo_seguimiento" in b) && !previo.proximo_seguimiento) {
          const { diasCotizado } = await leerAjuste("seguimiento");
          cambios.proximo_seguimiento = new Date(Date.now() + diasCotizado * 86400000).toISOString().slice(0, 10);
        }
      }
      if (nuevoEstado === "ganado") {
        cambios.ganado_en = new Date();
        if (!("valor_ganado" in b) && previo.valor_ganado === null) cambios.valor_ganado = previo.valor_cotizado;
        cambios.proximo_seguimiento = null;
      }
      if (nuevoEstado === "perdido") {
        cambios.perdido_en = new Date();
        cambios.proximo_seguimiento = null;
      }
    }

    const claves = Object.keys(cambios);
    if (claves.length) {
      await pool.query(
        `UPDATE prospectos SET ${claves.map((k, i) => `${k} = $${i + 2}`).join(", ")}, actualizado_en = now() WHERE id = $1`,
        [previo.id, ...claves.map((k) => cambios[k])]
      );
    }
    if (nuevoEstado) {
      await anotar(
        previo.id,
        "estado",
        `Pasó a ${NOMBRE_ESTADO[nuevoEstado].toLowerCase()}${nuevoEstado === "perdido" && cambios.motivo_perdida ? `: ${cambios.motivo_perdida}` : ""}`
      );
      if (nuevoEstado === "ganado") etiquetarCliente(cambios.telefono ?? previo.telefono);
    }
    if ("notas" in b && cambios.notas !== previo.notas) await anotar(previo.id, "nota", "Se actualizaron las notas");
    if ("proximo_seguimiento" in b && cambios.proximo_seguimiento) {
      await anotar(previo.id, "seguimiento", `Seguimiento programado para el ${cambios.proximo_seguimiento}`);
    }
    res.json(await cargarProspecto(previo.id));
  })
);

// «No es cliente»: se borra la ficha y el número no vuelve a entrar solo.
crmRouter.delete(
  "/prospectos/:id",
  capturar(async (req, res) => {
    const { rows: [p] } = await pool.query("DELETE FROM prospectos WHERE id = $1 RETURNING telefono", [req.params.id]);
    if (p?.telefono && req.query.ignorar === "1") {
      await pool.query("INSERT INTO wa_ignorados (telefono) VALUES ($1) ON CONFLICT DO NOTHING", [p.telefono]);
    }
    res.status(204).end();
  })
);

crmRouter.post(
  "/prospectos/:id/mensaje",
  capturar(async (req, res) => {
    const p = await cargarProspecto(req.params.id);
    if (!p) return res.status(404).json({ error: "Ese cliente no existe" });
    const texto = String(req.body.texto || "").trim();
    if (!texto) return res.status(400).json({ error: "Escribe el mensaje" });
    if (!p.telefono) return res.status(400).json({ error: "Este cliente no tiene teléfono" });
    if (!whatsappConectado()) return res.status(400).json({ error: "El WhatsApp de Sivú no está vinculado" });
    const r = await enviarDesdePanel(p, texto.slice(0, 4000));
    if (r.estado !== "enviado") return res.status(400).json({ error: r.detalle || "No se pudo enviar" });
    res.json({ ok: true });
  })
);

// ---------- Cotizaciones ----------

function calcularTotal(items, descuento) {
  const subtotal = (items || []).reduce((s, it) => s + (Number(it.valor) || 0) * (Number(it.cantidad) || 1), 0);
  return Math.max(0, Math.round(subtotal - (Number(descuento) || 0)));
}

function limpiarItems(items) {
  return (Array.isArray(items) ? items : []).slice(0, 30).map((it) => ({
    descripcion: String(it.descripcion || "").slice(0, 120),
    detalle: String(it.detalle || "").slice(0, 1500),
    cantidad: Math.max(1, Math.round(Number(it.cantidad) || 1)),
    valor: Math.max(0, Math.round(Number(it.valor) || 0)),
  })).filter((it) => it.descripcion);
}


crmRouter.post(
  "/prospectos/:id/cotizaciones",
  capturar(async (req, res) => {
    const p = await cargarProspecto(req.params.id);
    if (!p) return res.status(404).json({ error: "Ese cliente no existe" });
    const items = limpiarItems(req.body.items);
    if (!items.length) return res.status(400).json({ error: "Agrega al menos un ítem" });
    const descuento = entero(req.body.descuento) || 0;
    const { vigenciaDias, notas } = await leerAjuste("cotizacion");
    const vigencia = fecha(req.body.vigencia) || new Date(Date.now() + vigenciaDias * 86400000).toISOString().slice(0, 10);
    const total = calcularTotal(items, descuento);
    const { rows: [c] } = await pool.query(
      `INSERT INTO cotizaciones (token, prospecto_id, cliente, evento, items, descuento, total, notas, vigencia, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'enviada') RETURNING *`,
      [
        token(), p.id, String(req.body.cliente ?? p.nombre).slice(0, 120), String(req.body.evento ?? "").slice(0, 120),
        JSON.stringify(items), descuento, total, String(req.body.notas ?? notas).slice(0, 3000), vigencia,
      ]
    );
    // Cotizar mueve la ficha: valor cotizado y estado «cotizado» (si venía de antes).
    await pool.query(
      `UPDATE prospectos SET valor_cotizado = $2,
         estado = CASE WHEN estado IN ('nuevo', 'contactado', 'frio') THEN 'cotizado' ELSE estado END,
         cotizado_en = COALESCE(cotizado_en, now()),
         proximo_seguimiento = COALESCE(proximo_seguimiento, CURRENT_DATE + $3::int),
         actualizado_en = now()
       WHERE id = $1`,
      [p.id, total, (await leerAjuste("seguimiento")).diasCotizado]
    );
    await anotar(p.id, "cotizacion", `Cotización por $${total.toLocaleString("es-CO")}`);
    res.status(201).json({ ...c, url: urlCotizacion(c.token) });
  })
);

crmRouter.put(
  "/cotizaciones/:id",
  capturar(async (req, res) => {
    const items = limpiarItems(req.body.items);
    if (!items.length) return res.status(400).json({ error: "Agrega al menos un ítem" });
    const descuento = entero(req.body.descuento) || 0;
    const total = calcularTotal(items, descuento);
    const { rows: [c] } = await pool.query(
      `UPDATE cotizaciones SET items = $2, descuento = $3, total = $4, notas = $5, vigencia = COALESCE($6, vigencia),
         cliente = COALESCE($7, cliente), evento = COALESCE($8, evento), actualizado_en = now()
       WHERE id = $1 RETURNING *`,
      [
        req.params.id, JSON.stringify(items), descuento, total, String(req.body.notas || "").slice(0, 3000),
        fecha(req.body.vigencia), req.body.cliente ?? null, req.body.evento ?? null,
      ]
    );
    if (!c) return res.status(404).json({ error: "Esa cotización no existe" });
    if (c.prospecto_id) {
      await pool.query("UPDATE prospectos SET valor_cotizado = $2, actualizado_en = now() WHERE id = $1", [c.prospecto_id, total]);
      await anotar(c.prospecto_id, "cotizacion", `Cotización editada: $${total.toLocaleString("es-CO")}`);
    }
    res.json({ ...c, url: urlCotizacion(c.token) });
  })
);

crmRouter.delete(
  "/cotizaciones/:id",
  capturar(async (req, res) => {
    await pool.query("DELETE FROM cotizaciones WHERE id = $1", [req.params.id]);
    res.status(204).end();
  })
);

// ---------- Configuración ----------

// Sin números guardados en el panel se usan los de LEADS_WHATSAPP: se
// muestran para que se vea a quién le está llegando hoy.
async function ajustesParaPanel() {
  const ajustes = await leerAjustes();
  if (!ajustes.avisos.telefonos?.length) ajustes.avisos.telefonos = telefonosDe(process.env.LEADS_WHATSAPP);
  return ajustes;
}

crmRouter.get(
  "/ajustes",
  capturar(async (_req, res) => {
    res.json({ ajustes: await ajustesParaPanel(), defectos: DEFECTOS });
  })
);

crmRouter.put(
  "/ajustes/:clave",
  capturar(async (req, res) => {
    const { clave } = req.params;
    if (!CLAVES.includes(clave)) return res.status(400).json({ error: "Ajuste desconocido" });
    const valor = req.body.valor;
    const def = DEFECTOS[clave];
    if (Array.isArray(def) !== Array.isArray(valor) || typeof valor !== "object" || valor === null) {
      return res.status(400).json({ error: "Formato no válido" });
    }
    if (JSON.stringify(valor).length > 100_000) return res.status(400).json({ error: "Demasiado largo" });
    if (clave === "avisos" || clave === "reporte") {
      valor.telefonos = [...new Set((valor.telefonos || []).map(normalizarTelefono).filter((t) => t.length >= 11))];
    }
    await guardarAjuste(clave, valor);
    res.json({ ajustes: await ajustesParaPanel() });
  })
);

// Vista previa del mensaje automático con un cliente de ejemplo (o uno real).
crmRouter.post(
  "/ajustes/vista-saludo",
  capturar(async (req, res) => {
    const ejemplo = { nombre: req.body.nombre || "Ana Pérez", evento: req.body.evento || "boda" };
    res.json({ texto: await textoSaludo(ejemplo) });
  })
);

crmRouter.get(
  "/reporte/vista",
  capturar(async (_req, res) => {
    res.json(await armarReporte());
  })
);

crmRouter.post(
  "/reporte/enviar",
  capturar(async (_req, res) => {
    const r = await enviarReporte({ siempre: true });
    if (r.error) return res.status(400).json({ error: r.error });
    res.json(r);
  })
);

// ---------- Exportar ----------

crmRouter.get(
  "/exportar",
  capturar(async (_req, res) => {
    const { rows } = await pool.query("SELECT * FROM prospectos ORDER BY creado_en DESC");
    res.json(rows.map(conPrioridad));
  })
);

// ---------- Producción ----------

crmRouter.get(
  "/produccion",
  capturar(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT i.id, i.slug, i.nombre, i.tipo_evento, i.fecha_evento, i.activo, i.etapa, i.valor_total,
              i.cliente_nombre, i.cliente_telefono, i.notas_produccion, i.datos_token, i.datos_recibidos_en,
              (i.datos_cliente IS NOT NULL) AS tiene_datos,
              COALESCE((SELECT sum(valor) FROM pagos p WHERE p.invitacion_id = i.id), 0)::bigint AS pagado,
              (SELECT count(*) FROM invitados v WHERE v.invitacion_id = i.id)::int AS invitados,
              (SELECT count(*) FROM invitados v WHERE v.invitacion_id = i.id AND v.enviado_en IS NOT NULL)::int AS enviados,
              (SELECT count(*) FROM datos_archivos d WHERE d.invitacion_id = i.id)::int AS archivos,
              (SELECT count(*) FROM mensajes_whatsapp m WHERE m.invitacion_id = i.id AND m.direccion = 'entrante' AND NOT m.leido)::int AS mensajes_sin_leer,
              (SELECT id FROM prospectos pr WHERE pr.invitacion_id = i.id LIMIT 1) AS prospecto_id
       FROM invitaciones i
       WHERE NOT i.es_plantilla
       ORDER BY (i.etapa = 'realizado'), i.fecha_evento NULLS LAST, i.creado_en DESC`
    );
    res.json(rows.map((r) => ({ ...r, pagado: Number(r.pagado), valor_total: r.valor_total === null ? null : Number(r.valor_total) })));
  })
);

const ETAPAS = ["datos", "diseno", "revision", "aprobado", "enviando", "realizado"];

crmRouter.put(
  "/produccion/:id",
  capturar(async (req, res) => {
    const b = req.body;
    const cambios = {};
    if ("etapa" in b && ETAPAS.includes(b.etapa)) cambios.etapa = b.etapa;
    if ("valor_total" in b) cambios.valor_total = entero(b.valor_total);
    if ("cliente_nombre" in b) cambios.cliente_nombre = String(b.cliente_nombre || "").slice(0, 120);
    if ("cliente_telefono" in b) cambios.cliente_telefono = normalizarTelefono(b.cliente_telefono);
    if ("notas_produccion" in b) cambios.notas_produccion = String(b.notas_produccion || "").slice(0, 8000);
    const claves = Object.keys(cambios);
    if (!claves.length) return res.status(400).json({ error: "Nada que cambiar" });
    const { rowCount } = await pool.query(
      `UPDATE invitaciones SET ${claves.map((k, i) => `${k} = $${i + 2}`).join(", ")}, actualizado_en = now() WHERE id = $1`,
      [req.params.id, ...claves.map((k) => cambios[k])]
    );
    if (!rowCount) return res.status(404).json({ error: "Ese evento no existe" });
    if (cambios.cliente_telefono) etiquetarCliente(cambios.cliente_telefono);
    res.json({ ok: true });
  })
);

crmRouter.get(
  "/produccion/:id/pagos",
  capturar(async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM pagos WHERE invitacion_id = $1 ORDER BY fecha, id", [req.params.id]);
    res.json(rows.map((r) => ({ ...r, valor: Number(r.valor) })));
  })
);

crmRouter.post(
  "/produccion/:id/pagos",
  capturar(async (req, res) => {
    const valor = entero(req.body.valor);
    if (!valor) return res.status(400).json({ error: "Escribe el valor del pago" });
    const { rows: [p] } = await pool.query(
      "INSERT INTO pagos (invitacion_id, valor, fecha, nota, metodo) VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), $4, $5) RETURNING *",
      [req.params.id, valor, fecha(req.body.fecha), String(req.body.nota || "").slice(0, 200), String(req.body.metodo || "").slice(0, 80)]
    );
    res.status(201).json({ ...p, valor: Number(p.valor) });
  })
);

crmRouter.delete(
  "/pagos/:id",
  capturar(async (req, res) => {
    await pool.query("DELETE FROM pagos WHERE id = $1", [req.params.id]);
    res.status(204).end();
  })
);

// Enlace del formulario de datos del evento (se crea la primera vez).
crmRouter.post(
  "/produccion/:id/enlace-datos",
  capturar(async (req, res) => {
    const { rows: [inv] } = await pool.query(
      "UPDATE invitaciones SET datos_token = COALESCE(datos_token, $2) WHERE id = $1 RETURNING datos_token",
      [req.params.id, token()]
    );
    if (!inv) return res.status(404).json({ error: "Ese evento no existe" });
    res.json({ token: inv.datos_token, url: `${SITIO()}/datos/${inv.datos_token}` });
  })
);

crmRouter.get(
  "/produccion/:id/datos",
  capturar(async (req, res) => {
    const { rows: [inv] } = await pool.query(
      "SELECT id, nombre, tipo_evento, datos_cliente, datos_recibidos_en, datos_token FROM invitaciones WHERE id = $1",
      [req.params.id]
    );
    if (!inv) return res.status(404).json({ error: "Ese evento no existe" });
    const { rows: archivos } = await pool.query(
      "SELECT id, tipo, nombre, mime, usado, octet_length(datos) AS bytes, creado_en FROM datos_archivos WHERE invitacion_id = $1 ORDER BY id",
      [inv.id]
    );
    res.json({ ...inv, archivos, url: inv.datos_token ? `${SITIO()}/datos/${inv.datos_token}` : null });
  })
);

crmRouter.get(
  "/archivos/:id",
  capturar(async (req, res) => {
    const { rows: [a] } = await pool.query("SELECT nombre, mime, datos FROM datos_archivos WHERE id = $1", [req.params.id]);
    if (!a) return res.status(404).json({ error: "Ese archivo no existe" });
    res.setHeader("Content-Type", a.mime);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(a.nombre || "archivo")}"`);
    res.send(a.datos);
  })
);

// Pasa una foto o la música que subió el cliente a la invitación.
crmRouter.post(
  "/archivos/:id/usar",
  capturar(async (req, res) => {
    const { rows: [a] } = await pool.query("SELECT * FROM datos_archivos WHERE id = $1", [req.params.id]);
    if (!a) return res.status(404).json({ error: "Ese archivo no existe" });
    if (!["foto", "audio"].includes(a.tipo)) return res.status(400).json({ error: "Solo fotos y música se pasan a la invitación" });
    if (a.tipo === "audio") await pool.query("DELETE FROM medios WHERE tipo = 'audio' AND invitacion_id = $1", [a.invitacion_id]);
    const { rows: [{ orden }] } = await pool.query(
      "SELECT COALESCE(max(orden), 0) + 1 AS orden FROM medios WHERE tipo = $1 AND invitacion_id = $2",
      [a.tipo, a.invitacion_id]
    );
    await pool.query(
      "INSERT INTO medios (invitacion_id, tipo, mime, nombre, datos, orden) VALUES ($1, $2, $3, $4, $5, $6)",
      [a.invitacion_id, a.tipo, a.mime, a.nombre, a.datos, orden]
    );
    await pool.query("UPDATE datos_archivos SET usado = true WHERE id = $1", [a.id]);
    res.json({ ok: true });
  })
);

// ---------- Mensajes de invitados (todos los eventos) ----------

crmRouter.get(
  "/mensajes-invitados",
  capturar(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT m.id, m.telefono, m.texto, m.tipo, m.creado_en, m.leido, m.nombre_contacto,
              v.nombre AS invitado, i.nombre AS evento, i.id AS invitacion_id
       FROM mensajes_whatsapp m
       LEFT JOIN invitados v ON v.id = m.invitado_id
       LEFT JOIN invitaciones i ON i.id = m.invitacion_id
       WHERE m.invitacion_id IS NOT NULL AND m.direccion = 'entrante'
       ORDER BY m.creado_en DESC LIMIT 300`
    );
    res.json(rows);
  })
);
