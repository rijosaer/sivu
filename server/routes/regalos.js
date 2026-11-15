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
    `SELECT id, nombre, detalle, url, reservado_por FROM regalo_opciones
     WHERE invitacion_id = $1 ORDER BY orden, id`,
    [invitacionId]
  );
  // Nunca se manda quién apartó: solo si está libre o si es la suya.
  return rows.map(({ reservado_por, ...o }) => ({
    ...o,
    libre: reservado_por === null,
    mia: reservado_por === invitadoId,
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
    if (!invitado.regalo_detalle) return null;
    return {
      tipo: "especifico",
      titulo: c.titulo,
      texto: mensaje(c, "textoEspecifico"),
      regalo: invitado.regalo_detalle,
      url: invitado.regalo_url || "",
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

// Aparta una opción para el invitado, o la suelta si opcionId es null. Cambiar
// de opción es atómico: si la nueva ya la tomó otro, conserva la que tenía.
export async function reservarOpcion(invitacionId, invitadoId, opcionId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE regalo_opciones SET reservado_por = NULL, reservado_en = NULL WHERE invitacion_id = $1 AND reservado_por = $2",
      [invitacionId, invitadoId]
    );
    if (opcionId !== null) {
      const { rowCount } = await client.query(
        `UPDATE regalo_opciones SET reservado_por = $3, reservado_en = now()
         WHERE id = $1 AND invitacion_id = $2 AND reservado_por IS NULL`,
        [opcionId, invitacionId, invitadoId]
      );
      if (!rowCount) {
        await client.query("ROLLBACK");
        return false;
      }
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
      `SELECT o.id, o.nombre, o.detalle, o.url, o.orden, o.reservado_por, o.reservado_en, i.nombre AS invitado
       FROM regalo_opciones o LEFT JOIN invitados i ON i.id = o.reservado_por
       WHERE o.invitacion_id = $1 ORDER BY o.orden, o.id`,
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
  return { nombre: String(nombre).trim(), detalle: String(detalle ?? "").trim(), url: limpio };
}

regalosRouter.post(
  "/regalos/opciones",
  capturar(async (req, res) => {
    const datos = datosOpcion(req.body);
    if (!datos) return res.status(400).json({ error: "Escribe el nombre de la opción" });
    if (datos.error) return res.status(400).json({ error: datos.error });
    const { rows } = await pool.query(
      `INSERT INTO regalo_opciones (invitacion_id, nombre, detalle, url, orden)
       SELECT $1, $2, $3, $4, COALESCE(MAX(orden), 0) + 1 FROM regalo_opciones WHERE invitacion_id = $1
       RETURNING id`,
      [req.invitacionId, datos.nombre, datos.detalle, datos.url]
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
    const { rowCount } = await pool.query(
      "UPDATE regalo_opciones SET nombre = $3, detalle = $4, url = $5 WHERE id = $1 AND invitacion_id = $2",
      [req.params.opcionId, req.invitacionId, datos.nombre, datos.detalle, datos.url]
    );
    if (!rowCount) return res.status(404).json({ error: "Opción no encontrada" });
    res.json({ ok: true });
  })
);

regalosRouter.post(
  "/regalos/opciones/:opcionId/liberar",
  capturar(async (req, res) => {
    const { rowCount } = await pool.query(
      "UPDATE regalo_opciones SET reservado_por = NULL, reservado_en = NULL WHERE id = $1 AND invitacion_id = $2",
      [req.params.opcionId, req.invitacionId]
    );
    if (!rowCount) return res.status(404).json({ error: "Opción no encontrada" });
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
