import { Router } from "express";
import { pool } from "../db.js";
import { capturar } from "../errores.js";
import { esIdValido, texto, validarParam } from "../seguridad.js";

// Regalos por invitado. El panel asigna a cada invitado un modo:
//   "sobres":     lluvia de sobres; ve el mensaje y los datos para aportar.
//   "especifico": un regalo puntual pensado para esa persona (y dónde comprarlo).
//   "lista":      ve las opciones y aparta una; a los demás les sale ocupada.
//   "enlace":     ve un botón a la tienda donde puede comprar.
// Quien no tiene modo no ve la sección. Por eso la sección "regalos" con
// contenido.porInvitado no viaja en /site: solo llega con /invitado/:codigo.

const TEXTOS_BASE = {
  titulo: "Regalos",
  textoEnlace: "",
  enlaceUrl: "",
  enlaceEtiqueta: "Ver tienda",
  textoLista: "",
  textoSobres: "",
  datosSobres: "",
  textoEspecifico: "",
};

// Si el mensaje de un tipo de regalo queda vacío, sale este: así la sección
// nunca se ve seca. El panel los muestra como ejemplo en cada casilla.
export const MENSAJES_DEFECTO = {
  textoEspecifico: "Tu presencia es nuestro mejor regalo. Si deseas tener un detalle con nosotros, pensamos en este para ti:",
  textoLista: "Tu presencia es nuestro mejor regalo. Si deseas tener un detalle con nosotros, elige una de estas opciones y apártala; así nadie más la repite.",
  textoEnlace: "Tu presencia es nuestro mejor regalo. Si deseas tener un detalle con nosotros, aquí encuentras nuestra lista de regalos.",
  textoSobres: "Tu presencia es nuestro mejor regalo. Si deseas tener un detalle con nosotros, lo recibimos con cariño en lluvia de sobres.",
};
const mensaje = (c, clave) => String(c[clave] || "").trim() || MENSAJES_DEFECTO[clave];

// Varias cosas en un mismo regalo: [{ cantidad, nombre, url }]. Devuelve la
// lista limpia, { error } si algo no sirve, o undefined si no vino.
export function limpiarArticulos(valor) {
  if (valor === undefined) return undefined;
  if (!Array.isArray(valor)) return { error: "La lista de cosas del regalo no es válida" };
  const lista = [];
  for (const a of valor) {
    const nombre = String(a?.nombre ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
    const url = String(a?.url ?? "").trim().slice(0, 1000);
    if (!nombre && !url) continue; // fila vacía del formulario
    if (!nombre) return { error: "Cada cosa del regalo necesita un nombre" };
    const cantidad = a?.cantidad === undefined || a?.cantidad === "" ? 1 : Number(a.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 999) {
      return { error: `La cantidad de «${nombre}» debe ser un número de 1 a 999` };
    }
    if (!urlValida(url)) return { error: `El enlace de «${nombre}» debe empezar por https://` };
    lista.push({ cantidad, nombre, url });
  }
  if (lista.length > 10) return { error: "Un regalo puede tener hasta 10 cosas" };
  return lista;
}

export const esSeccionPorInvitado = (s) => s.tipo === "regalos" && s.contenido?.porInvitado === true;

async function seccionRegalos(invitacionId, db = pool) {
  const { rows } = await db.query(
    "SELECT id, tipo, activo, contenido FROM secciones WHERE invitacion_id = $1 AND tipo = 'regalos' ORDER BY id LIMIT 1",
    [invitacionId]
  );
  return rows[0] || null;
}

async function opcionesParaInvitado(invitacionId, invitadoId) {
  const { rows } = await pool.query(
    `SELECT o.id, o.nombre, o.detalle, o.url, o.articulos, o.personas,
            count(r.id)::int AS apartadas,
            COALESCE(bool_or(r.invitado_id = $2), false) AS mia
     FROM regalo_opciones o LEFT JOIN regalo_reservas r ON r.opcion_id = o.id
     WHERE o.invitacion_id = $1
     GROUP BY o.id ORDER BY o.orden, o.id`,
    [invitacionId, invitadoId]
  );
  // Nunca se manda quién apartó: solo cuántos cupos quedan y si uno es suyo.
  return rows.map(({ apartadas, ...o }) => ({
    ...o,
    quedan: Math.max(0, o.personas - apartadas),
    libre: apartadas < o.personas,
  }));
}

// Lo que ve este invitado, o null si no le corresponde nada.
export async function regaloDeInvitado(invitacionId, invitado) {
  if (!invitado.regalo_modo) return null;
  const seccion = await seccionRegalos(invitacionId);
  // Si nunca se guardó Regalos, valen los textos por defecto: un regalo
  // específico o una lista con opciones no necesitan nada más para verse.
  // Solo se oculta si los regalos por invitado se apagaron a propósito, o si
  // el evento muestra a todos una sección de regalos general (no por invitado).
  if (seccion && esSeccionPorInvitado(seccion) && !seccion.activo) return null;
  if (seccion && !esSeccionPorInvitado(seccion) && seccion.activo) return null;
  const c = { ...TEXTOS_BASE, ...(seccion && esSeccionPorInvitado(seccion) ? seccion.contenido : {}) };
  if (invitado.regalo_modo === "sobres") {
    if (!c.textoSobres && !c.datosSobres) return null;
    return { tipo: "sobres", titulo: c.titulo, texto: mensaje(c, "textoSobres"), datos: c.datosSobres };
  }
  if (invitado.regalo_modo === "especifico") {
    const articulos = Array.isArray(invitado.regalo_articulos) ? invitado.regalo_articulos : [];
    if (!invitado.regalo_detalle && !articulos.length) return null;
    return {
      tipo: "especifico",
      titulo: c.titulo,
      texto: mensaje(c, "textoEspecifico"),
      regalo: invitado.regalo_detalle || "",
      url: invitado.regalo_url || "",
      articulos,
    };
  }
  if (invitado.regalo_modo === "enlace") {
    if (!c.enlaceUrl) return null;
    return {
      tipo: "enlace",
      titulo: c.titulo,
      texto: mensaje(c, "textoEnlace"),
      url: c.enlaceUrl,
      etiqueta: c.enlaceEtiqueta || TEXTOS_BASE.enlaceEtiqueta,
    };
  }
  const opciones = await opcionesParaInvitado(invitacionId, invitado.id);
  if (!opciones.length) return null;
  return { tipo: "lista", titulo: c.titulo, texto: mensaje(c, "textoLista"), opciones };
}

// Aparta una opción para el invitado, o la suelta si opcionId es null. Cada
// invitado tiene a lo sumo UNA opción; una opción admite tantas personas como
// diga «personas». Cambiar de opción es atómico: si la nueva ya se llenó,
// conserva la que tenía. La fila de la opción se bloquea (FOR UPDATE) para que
// dos invitados no se lleven el último cupo a la vez.
export async function reservarOpcion(invitacionId, invitadoId, opcionId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (opcionId !== null) {
      const { rows } = await client.query(
        "SELECT personas FROM regalo_opciones WHERE id = $1 AND invitacion_id = $2 FOR UPDATE",
        [opcionId, invitacionId]
      );
      if (!rows.length) {
        await client.query("ROLLBACK");
        return false;
      }
      const { rows: ya } = await client.query(
        `SELECT count(*)::int AS apartadas, COALESCE(bool_or(invitado_id = $2), false) AS mia
         FROM regalo_reservas WHERE opcion_id = $1`,
        [opcionId, invitadoId]
      );
      if (ya[0].mia) {
        await client.query("COMMIT");
        return true;
      }
      if (ya[0].apartadas >= rows[0].personas) {
        await client.query("ROLLBACK");
        return false;
      }
    }
    await client.query("DELETE FROM regalo_reservas WHERE invitado_id = $1", [invitadoId]);
    if (opcionId !== null) {
      await client.query("INSERT INTO regalo_reservas (opcion_id, invitado_id) VALUES ($1, $2)", [opcionId, invitadoId]);
    }
    await client.query("COMMIT");
    return true;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    // Dos peticiones simultáneas del mismo invitado: gana la primera.
    if (e.code === "23505") return false;
    throw e;
  } finally {
    client.release();
  }
}

export const opcionesDeInvitado = opcionesParaInvitado;

// ---------- Panel ----------

export const regalosRouter = Router({ mergeParams: true });
regalosRouter.param("opcionId", validarParam(esIdValido));

function urlValida(valor) {
  if (!valor) return true;
  try {
    return ["http:", "https:"].includes(new URL(valor).protocol);
  } catch {
    return false;
  }
}

regalosRouter.get(
  "/regalos",
  capturar(async (req, res) => {
    const seccion = await seccionRegalos(req.invitacionId);
    const { rows: opciones } = await pool.query(
      `SELECT o.id, o.nombre, o.detalle, o.url, o.articulos, o.personas, o.orden,
              COALESCE(json_agg(json_build_object('id', i.id, 'nombre', i.nombre) ORDER BY r.creado_en)
                FILTER (WHERE r.id IS NOT NULL), '[]') AS apartados
       FROM regalo_opciones o
       LEFT JOIN regalo_reservas r ON r.opcion_id = o.id
       LEFT JOIN invitados i ON i.id = r.invitado_id
       WHERE o.invitacion_id = $1
       GROUP BY o.id ORDER BY o.orden, o.id`,
      [req.invitacionId]
    );
    res.json({
      // Todos los diseños dibujan el regalo personal (componente común).
      disponible: true,
      config: seccion && esSeccionPorInvitado(seccion) ? { ...TEXTOS_BASE, ...seccion.contenido } : { ...TEXTOS_BASE },
      porDefecto: MENSAJES_DEFECTO,
      opciones,
    });
  })
);

regalosRouter.put(
  "/regalos/config",
  capturar(async (req, res) => {
    const c = {
      titulo: texto(req.body?.titulo, 120),
      textoEnlace: texto(req.body?.textoEnlace, 1000),
      enlaceUrl: String(texto(req.body?.enlaceUrl, 1000) ?? "").trim(),
      enlaceEtiqueta: texto(req.body?.enlaceEtiqueta, 40),
      textoLista: texto(req.body?.textoLista, 1000),
      textoSobres: texto(req.body?.textoSobres, 1000),
      datosSobres: texto(req.body?.datosSobres, 500),
      textoEspecifico: texto(req.body?.textoEspecifico, 1000),
    };
    if (Object.values(c).some((v) => v === null)) return res.status(400).json({ error: "Algún texto es demasiado largo" });
    if (!urlValida(c.enlaceUrl)) {
      return res.status(400).json({ error: "El enlace debe empezar por https://" });
    }
    const contenido = JSON.stringify({ ...TEXTOS_BASE, ...c, porInvitado: true });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const seccion = await seccionRegalos(req.invitacionId, client);
      if (seccion) {
        await client.query("UPDATE secciones SET contenido = $1, activo = true WHERE id = $2", [contenido, seccion.id]);
      } else {
        await client.query(
          `INSERT INTO secciones (invitacion_id, tipo, titulo_panel, orden, activo, contenido)
           SELECT $1, 'regalos', 'Regalos por invitado', COALESCE(MAX(orden), 0) + 1, true, $2
           FROM secciones WHERE invitacion_id = $1`,
          [req.invitacionId, contenido]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
    res.json({ ok: true });
  })
);

// null si falta el nombre o algo es muy largo; { error } si el enlace no sirve.
function datosOpcion(body) {
  const nombre = texto(body?.nombre, 200);
  const detalle = texto(body?.detalle, 500);
  const url = texto(body?.url, 1000);
  if (!String(nombre ?? "").trim() || detalle === null || url === null) return null;
  const limpio = String(url ?? "").trim();
  if (!urlValida(limpio)) return { error: "El enlace debe empezar por https://" };
  const articulos = limpiarArticulos(body?.articulos ?? []);
  if (articulos.error) return { error: articulos.error };
  const personas = body?.personas === undefined || body?.personas === "" ? 1 : Number(body.personas);
  if (!Number.isInteger(personas) || personas < 1 || personas > 99) {
    return { error: "Las personas que pueden apartarla deben ser de 1 a 99" };
  }
  return { nombre: String(nombre).trim(), detalle: String(detalle ?? "").trim(), url: limpio, articulos, personas };
}

regalosRouter.post(
  "/regalos/opciones",
  capturar(async (req, res) => {
    const datos = datosOpcion(req.body);
    if (!datos) return res.status(400).json({ error: "Escribe el nombre de la opción" });
    if (datos.error) return res.status(400).json({ error: datos.error });
    const { rows } = await pool.query(
      `INSERT INTO regalo_opciones (invitacion_id, nombre, detalle, url, articulos, personas, orden)
       SELECT $1, $2, $3, $4, $5, $6, COALESCE(MAX(orden), 0) + 1 FROM regalo_opciones WHERE invitacion_id = $1
       RETURNING id`,
      [req.invitacionId, datos.nombre, datos.detalle, datos.url, JSON.stringify(datos.articulos), datos.personas]
    );
    res.status(201).json(rows[0]);
  })
);

// Editar nombre, detalle o enlace sin tocar quién la apartó.
regalosRouter.put(
  "/regalos/opciones/:opcionId",
  capturar(async (req, res) => {
    const datos = datosOpcion(req.body);
    if (!datos) return res.status(400).json({ error: "Escribe el nombre de la opción" });
    if (datos.error) return res.status(400).json({ error: datos.error });
    const { rows: ya } = await pool.query(
      `SELECT count(r.id)::int AS apartadas FROM regalo_opciones o
       LEFT JOIN regalo_reservas r ON r.opcion_id = o.id
       WHERE o.id = $1 AND o.invitacion_id = $2 GROUP BY o.id`,
      [req.params.opcionId, req.invitacionId]
    );
    if (!ya.length) return res.status(404).json({ error: "Opción no encontrada" });
    if (datos.personas < ya[0].apartadas) {
      return res.status(400).json({
        error: `Ya la apartaron ${ya[0].apartadas} personas: no puede quedar en menos. Libera a alguien primero.`,
      });
    }
    await pool.query(
      `UPDATE regalo_opciones SET nombre = $3, detalle = $4, url = $5, articulos = $6, personas = $7
       WHERE id = $1 AND invitacion_id = $2`,
      [req.params.opcionId, req.invitacionId, datos.nombre, datos.detalle, datos.url, JSON.stringify(datos.articulos), datos.personas]
    );
    res.json({ ok: true });
  })
);

regalosRouter.post(
  "/regalos/opciones/:opcionId/liberar",
  capturar(async (req, res) => {
    // Con invitadoId suelta solo a esa persona; sin él, a todas las de la opción.
    const invitadoId = req.body?.invitadoId;
    if (invitadoId !== undefined && !esIdValido(invitadoId)) return res.status(400).json({ error: "Invitado no válido" });
    const { rowCount } = await pool.query("SELECT 1 FROM regalo_opciones WHERE id = $1 AND invitacion_id = $2", [
      req.params.opcionId,
      req.invitacionId,
    ]);
    if (!rowCount) return res.status(404).json({ error: "Opción no encontrada" });
    await pool.query("DELETE FROM regalo_reservas WHERE opcion_id = $1 AND ($2::int IS NULL OR invitado_id = $2)", [
      req.params.opcionId,
      invitadoId === undefined ? null : Number(invitadoId),
    ]);
    res.json({ ok: true });
  })
);

regalosRouter.delete(
  "/regalos/opciones/:opcionId",
  capturar(async (req, res) => {
    await pool.query("DELETE FROM regalo_opciones WHERE id = $1 AND invitacion_id = $2", [
      req.params.opcionId,
      req.invitacionId,
    ]);
    res.json({ ok: true });
  })
);
