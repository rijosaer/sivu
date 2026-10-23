import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { pool } from "../db.js";
import { capturar } from "../errores.js";
import { resolverInvitacionAdmin } from "../middlewareInvitacion.js";
import { soloDueno } from "../auth.js";
import { avisosListos, describirRespuesta, enviarAviso, telefonosDe } from "../avisosWhatsapp.js";
import { enviarResumen } from "../resumenDiario.js";
import { TIPOS_EVENTO, decoracionesBase, plantillaSecciones } from "../plantillas.js";
import { resolverDiseno } from "../disenos.js";

// CRUD de invitaciones (los "eventos" del sistema). Es lo que le permite al
// dueño operar muchos clientes desde un solo panel: cada fila de aquí es una
// invitación independiente, con su propio tema, secciones, decoraciones e
// invitados, todos colgando de su invitacion_id.
export const invitacionesRouter = Router();

function slugificar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos ya separados por NFD
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Un enlace hecho solo con los nombres ("maria-y-juan") se adivina probando:
// quien lo encuentra ve la fecha, el lugar y los nombres de la familia. Los
// enlaces que arma el sistema llevan un final al azar (6 caracteres, ~2.000
// millones de opciones): "maria-y-juan-k7m2qx". Si el dueño escribe el enlace
// a mano, se respeta tal cual.
const ALFABETO_SLUG = "abcdefghjkmnpqrstuvwxyz23456789";
function conSufijo(base) {
  let sufijo = "";
  for (let i = 0; i < 6; i++) sufijo += ALFABETO_SLUG[randomInt(ALFABETO_SLUG.length)];
  return `${String(base || "invitacion").slice(0, 50).replace(/-+$/, "")}-${sufijo}`;
}

async function slugUnico(base) {
  const raiz = base || "invitacion";
  let slug = raiz;
  for (let i = 2; i < 200; i++) {
    const { rowCount } = await pool.query("SELECT 1 FROM invitaciones WHERE slug = $1", [slug]);
    if (!rowCount) return slug;
    slug = `${raiz}-${i}`;
  }
  throw new Error("No se pudo generar un slug único");
}

async function conStats(rows) {
  if (!rows.length) return rows;
  const ids = rows.map((r) => r.id);
  const { rows: stats } = await pool.query(
    `SELECT invitacion_id,
            count(*)::int AS invitados,
            count(*) FILTER (WHERE NOT EXISTS (
              SELECT 1 FROM invitado_miembros m
              WHERE m.invitado_id = invitados.id AND m.estado <> 'pendiente'
            ))::int AS sin_responder
     FROM invitados WHERE invitacion_id = ANY($1) GROUP BY invitacion_id`,
    [ids]
  );
  const porId = Object.fromEntries(stats.map((s) => [s.invitacion_id, s]));
  return rows.map((r) => ({
    ...r,
    invitados: porId[r.id]?.invitados || 0,
    sin_responder: porId[r.id]?.sin_responder || 0,
  }));
}

invitacionesRouter.get(
  "/",
  capturar(async (req, res) => {
    // El dueño ve todos los eventos; un cliente, solo el suyo.
    const soloUno = req.admin.invitacionId || null;
    const { rows } = await pool.query(
      `SELECT id, slug, nombre, tipo_evento, diseno, diseno_variante, fecha_evento, activo, es_plantilla, solo_codigo, avisos_whatsapp, creado_en
       FROM invitaciones WHERE ($1::int IS NULL OR id = $1) ORDER BY creado_en DESC`,
      [soloUno]
    );
    res.json(await conStats(rows));
  })
);

// Reglas compartidas para el usuario de un cliente: corto, fácil de dictar
// por WhatsApp y sin sorpresas de teclado.
const USUARIO_RE = /^[a-z0-9._-]{3,40}$/;
function validarAccesoCliente(usuario, password) {
  if (typeof usuario !== "string" || !USUARIO_RE.test(usuario)) {
    return "El usuario solo puede tener minúsculas, números, punto, guion y guion bajo (3 a 40 caracteres)";
  }
  if (typeof password !== "string" || password.length < 10 || password.length > 200) {
    return "La contraseña del cliente necesita entre 10 y 200 caracteres";
  }
  return null;
}

// Crea (o restablece) el usuario de un cliente amarrado a UNA invitación.
// Es la misma lógica de seed-cliente.js, disponible desde el panel.
async function guardarUsuarioCliente(client, invitacionId, usuario, password) {
  const previo = await client.query("SELECT invitacion_id FROM admin_usuarios WHERE usuario = $1", [usuario]);
  if (previo.rows.length && previo.rows[0].invitacion_id === null) {
    return { error: `"${usuario}" es el usuario administrador del sistema; elige otro nombre` };
  }
  const hash = bcrypt.hashSync(String(password), 12);
  await client.query(
    `INSERT INTO admin_usuarios (usuario, password_hash, invitacion_id) VALUES ($1, $2, $3)
     ON CONFLICT (usuario) DO UPDATE
       SET password_hash = EXCLUDED.password_hash, invitacion_id = EXCLUDED.invitacion_id,
         sesion_version = admin_usuarios.sesion_version + 1`,
    [usuario, hash, invitacionId]
  );
  return { usuario };
}

invitacionesRouter.post(
  "/",
  soloDueno,
  capturar(async (req, res) => {
    const {
      nombre, tipo_evento = "boda", fecha_evento = null, slug: slugPedido, diseno,
      plantilla_id = null, usuario = null, password = null,
    } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: "Ponle un nombre a la invitación" });
    if (!TIPOS_EVENTO.includes(tipo_evento)) {
      return res.status(400).json({ error: "Tipo de evento no válido" });
    }
    if (usuario) {
      const invalido = validarAccesoCliente(usuario, password);
      if (invalido) return res.status(400).json({ error: invalido });
    }
    // Con plantilla se clonan su tema, decoraciones, ubicaciones y secciones
    // (nunca sus medios ni sus invitados, que son datos de otro evento).
    let plantilla = null;
    if (plantilla_id) {
      const { rows } = await pool.query(
        "SELECT id, diseno FROM invitaciones WHERE id = $1 AND es_plantilla = true",
        [plantilla_id]
      );
      if (!rows.length) return res.status(400).json({ error: "Esa plantilla no existe" });
      plantilla = rows[0];
    }
    // El diseño puede ser uno programado o una variante del catálogo.
    const elegido = await resolverDiseno(diseno || plantilla?.diseno || "clasico");
    if (!elegido) return res.status(400).json({ error: "Diseño no válido" });
    const disenoFinal = elegido.base;
    const base = slugPedido ? slugificar(slugPedido) || "invitacion" : conSufijo(slugificar(nombre));
    const slug = await slugUnico(base);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO invitaciones (slug, nombre, tipo_evento, fecha_evento, diseno, diseno_variante)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [slug, nombre.trim(), tipo_evento, fecha_evento || null, disenoFinal, plantilla ? null : elegido.variante]
      );
      const invitacion = rows[0];

      if (plantilla) {
        await client.query(
          "INSERT INTO tema (invitacion_id, clave, valor) SELECT $1, clave, valor FROM tema WHERE invitacion_id = $2",
          [invitacion.id, plantilla.id]
        );
        await client.query(
          `INSERT INTO decoraciones (invitacion_id, clave, etiqueta, datos, personalizada)
           SELECT $1, clave, etiqueta, datos, personalizada FROM decoraciones WHERE invitacion_id = $2`,
          [invitacion.id, plantilla.id]
        );
        await client.query(
          `INSERT INTO decoracion_ubicaciones (invitacion_id, clave, seccion_tipo, x, y, ancho, rotacion, opacidad, capa)
           SELECT $1, clave, seccion_tipo, x, y, ancho, rotacion, opacidad, capa FROM decoracion_ubicaciones WHERE invitacion_id = $2`,
          [invitacion.id, plantilla.id]
        );
        await client.query(
          `INSERT INTO secciones (invitacion_id, tipo, titulo_panel, orden, activo, contenido)
           SELECT $1, tipo, titulo_panel, orden, activo, contenido FROM secciones WHERE invitacion_id = $2`,
          [invitacion.id, plantilla.id]
        );
      } else {
        for (const [clave, valor] of elegido.tema) {
          await client.query(
            "INSERT INTO tema (invitacion_id, clave, valor) VALUES ($1, $2, $3)",
            [invitacion.id, clave, valor]
          );
        }
        for (const d of decoracionesBase()) {
          await client.query(
            "INSERT INTO decoraciones (invitacion_id, clave, etiqueta, datos) VALUES ($1, $2, $3, NULL)",
            [invitacion.id, d.clave, d.etiqueta]
          );
        }
        for (const sec of plantillaSecciones(tipo_evento, nombre.trim())) {
          await client.query(
            `INSERT INTO secciones (invitacion_id, tipo, titulo_panel, orden, activo, contenido)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [invitacion.id, sec.tipo, sec.titulo_panel, sec.orden, sec.activo, JSON.stringify(sec.contenido)]
          );
        }
      }

      let acceso = null;
      if (usuario) {
        acceso = await guardarUsuarioCliente(client, invitacion.id, usuario, password);
        if (acceso.error) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: acceso.error });
        }
      }

      await client.query("COMMIT");
      res.status(201).json({ ...invitacion, acceso });
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  })
);

// Qué usuarios de cliente tienen acceso a esta invitación (solo el nombre,
// jamás el hash de la contraseña).
invitacionesRouter.get(
  "/:invitacionId/acceso",
  soloDueno,
  resolverInvitacionAdmin,
  capturar(async (req, res) => {
    const { rows } = await pool.query(
      "SELECT usuario FROM admin_usuarios WHERE invitacion_id = $1 ORDER BY usuario",
      [req.invitacionId]
    );
    res.json(rows.map((r) => r.usuario));
  })
);

// Avisos por WhatsApp al cliente cuando un invitado responde. Solo el dueño
// los prende y decide a qué números van; aquí también se ven los últimos
// envíos, para saber si salieron y, si no, por qué.
async function estadoAvisos(invitacionId) {
  const ev = await pool.query(
    "SELECT avisos_whatsapp, avisos_telefonos, avisos_resumen, avisos_resumen_hora FROM invitaciones WHERE id = $1",
    [invitacionId]
  );
  // El teléfono de «Favor confirmar al» de la invitación: se sugiere como
  // número para los avisos, que suele ser el del anfitrión.
  const sugerido = await pool.query(
    "SELECT contenido->>'telefonoConfirmar' AS t FROM secciones WHERE invitacion_id = $1 AND tipo = 'informacion_boda' LIMIT 1",
    [invitacionId]
  );
  const { rows: ultimos } = await pool.query(
    `SELECT telefono, texto, estado, detalle, creado_en FROM avisos_enviados
     WHERE invitacion_id = $1 ORDER BY creado_en DESC LIMIT 8`,
    [invitacionId]
  );
  return {
    activo: ev.rows[0].avisos_whatsapp,
    telefonos: ev.rows[0].avisos_telefonos,
    sugerido: sugerido.rows[0]?.t || "",
    resumen: ev.rows[0].avisos_resumen,
    resumenHora: ev.rows[0].avisos_resumen_hora,
    configurado: avisosListos(),
    ultimos,
  };
}

invitacionesRouter.get(
  "/:invitacionId/avisos",
  soloDueno,
  resolverInvitacionAdmin,
  capturar(async (req, res) => res.json(await estadoAvisos(req.invitacionId)))
);

invitacionesRouter.put(
  "/:invitacionId/avisos",
  soloDueno,
  resolverInvitacionAdmin,
  capturar(async (req, res) => {
    const activo = Boolean(req.body.activo);
    const telefonos = String(req.body.telefonos || "").trim();
    const resumen = Boolean(req.body.resumen);
    const hora = Number.isInteger(req.body.resumenHora) ? req.body.resumenHora : 19;
    if (hora < 0 || hora > 23) return res.status(400).json({ error: "La hora del resumen no es válida" });
    if (activo && !telefonosDe(telefonos).length) {
      return res.status(400).json({ error: "Escribe al menos un número de WhatsApp del cliente" });
    }
    await pool.query(
      `UPDATE invitaciones SET avisos_whatsapp = $2, avisos_telefonos = $3, avisos_resumen = $4,
         avisos_resumen_hora = $5, actualizado_en = now() WHERE id = $1`,
      [req.invitacionId, activo, telefonos, resumen, hora]
    );
    res.json(await estadoAvisos(req.invitacionId));
  })
);

// Aviso de ejemplo a los números guardados, para comprobar que llega.
invitacionesRouter.post(
  "/:invitacionId/avisos/prueba",
  soloDueno,
  resolverInvitacionAdmin,
  capturar(async (req, res) => {
    const { rows } = await pool.query("SELECT avisos_telefonos FROM invitaciones WHERE id = $1", [req.invitacionId]);
    const telefonos = telefonosDe(rows[0].avisos_telefonos);
    if (!telefonos.length) return res.status(400).json({ error: "Primero guarda un número de WhatsApp" });
    const envio = await enviarAviso({
      invitacionId: req.invitacionId,
      telefonos,
      evento: req.invitacion.nombre,
      respuesta: describirRespuesta({ nombre: "Invitado de prueba" }, [{ estado: "confirmado" }]),
    });
    res.json({ ...envio, ...(await estadoAvisos(req.invitacionId)) });
  })
);

// Resumen del avance ahora mismo, haya o no respuestas nuevas.
invitacionesRouter.post(
  "/:invitacionId/avisos/resumen",
  soloDueno,
  resolverInvitacionAdmin,
  capturar(async (req, res) => {
    const envio = await enviarResumen(req.invitacionId, { siempre: true });
    if (envio.omitido) return res.status(400).json({ error: "Primero guarda un número de WhatsApp" });
    res.json({ ...envio, ...(await estadoAvisos(req.invitacionId)) });
  })
);

// Crear o restablecer el usuario de un cliente para esta invitación.
invitacionesRouter.post(
  "/:invitacionId/usuario",
  soloDueno,
  resolverInvitacionAdmin,
  capturar(async (req, res) => {
    const { usuario, password } = req.body;
    const invalido = validarAccesoCliente(usuario, password);
    if (invalido) return res.status(400).json({ error: invalido });
    const client = await pool.connect();
    try {
      const acceso = await guardarUsuarioCliente(client, req.invitacionId, usuario, password);
      if (acceso.error) return res.status(400).json({ error: acceso.error });
      res.status(201).json(acceso);
    } finally {
      client.release();
    }
  })
);

invitacionesRouter.get(
  "/:invitacionId",
  resolverInvitacionAdmin,
  capturar(async (req, res) => {
    const rows = await conStats([req.invitacion]);
    res.json(rows[0]);
  })
);

invitacionesRouter.put(
  "/:invitacionId",
  soloDueno,
  resolverInvitacionAdmin,
  capturar(async (req, res) => {
    const {
      nombre, slug: slugPedido, tipo_evento, fecha_evento, activo, es_plantilla, diseno,
      solo_codigo, regenerar_enlace,
    } = req.body;
    if (solo_codigo !== undefined && typeof solo_codigo !== "boolean") {
      return res.status(400).json({ error: "El valor de «solo con enlace personal» no es válido" });
    }
    if (tipo_evento && !TIPOS_EVENTO.includes(tipo_evento)) {
      return res.status(400).json({ error: "Tipo de evento no válido" });
    }
    const elegido = diseno ? await resolverDiseno(diseno) : null;
    if (diseno && !elegido) return res.status(400).json({ error: "Diseño no válido" });
    let slug = null;
    if (slugPedido && slugPedido !== req.invitacion.slug) {
      const candidato = slugificar(slugPedido);
      if (!candidato) return res.status(400).json({ error: "El enlace no puede quedar vacío" });
      const { rowCount } = await pool.query(
        "SELECT 1 FROM invitaciones WHERE slug = $1 AND id <> $2",
        [candidato, req.invitacionId]
      );
      if (rowCount) return res.status(400).json({ error: "Ese enlace ya lo usa otra invitación" });
      slug = candidato;
    }
    // Cambiar el enlace por uno difícil de adivinar. Los enlaces que ya se
    // mandaron con el anterior dejan de abrir: el panel lo advierte antes.
    if (regenerar_enlace === true) {
      slug = await slugUnico(conSufijo(slugificar(req.invitacion.nombre)));
    }
    // Cambiar de diseño aplica su paquete de colores y letras; el resto del
    // tema (mensajes de WhatsApp, etc.) se conserva.
    const actual = req.invitacion.diseno_variante || req.invitacion.diseno;
    if (elegido && diseno !== actual) {
      for (const [clave, valor] of elegido.tema) {
        await pool.query(
          `INSERT INTO tema (invitacion_id, clave, valor) VALUES ($1, $2, $3)
           ON CONFLICT (invitacion_id, clave) DO UPDATE SET valor = EXCLUDED.valor`,
          [req.invitacionId, clave, valor]
        );
      }
    }
    const { rows } = await pool.query(
      `UPDATE invitaciones SET
         nombre = COALESCE($2, nombre),
         slug = COALESCE($3, slug),
         tipo_evento = COALESCE($4, tipo_evento),
         fecha_evento = CASE WHEN $5::boolean THEN $6::date ELSE fecha_evento END,
         activo = COALESCE($7, activo),
         es_plantilla = COALESCE($8, es_plantilla),
         diseno = COALESCE($9, diseno),
         diseno_variante = CASE WHEN $9::text IS NULL THEN diseno_variante ELSE $10::text END,
         solo_codigo = COALESCE($11, solo_codigo),
         actualizado_en = now()
       WHERE id = $1 RETURNING *`,
      [
        req.invitacionId,
        nombre?.trim() || null,
        slug,
        tipo_evento || null,
        fecha_evento !== undefined,
        fecha_evento || null,
        activo,
        es_plantilla,
        elegido?.base || null,
        elegido?.variante || null,
        solo_codigo ?? null,
      ]
    );
    res.json(rows[0]);
  })
);

// Copia completa de una invitación: tema, decoraciones (con sus imágenes),
// ubicaciones, secciones y medios. Los invitados NO se copian: son personas
// reales del evento original y una copia suele ser para otro evento (o de
// ejemplo), donde esos nombres y códigos no tienen por qué estar.
invitacionesRouter.post(
  "/:invitacionId/duplicar",
  soloDueno,
  resolverInvitacionAdmin,
  capturar(async (req, res) => {
    const { nombre, slug: slugPedido } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: "Ponle un nombre a la copia" });
    const base = slugPedido ? slugificar(slugPedido) || "invitacion" : conSufijo(slugificar(nombre));
    const slug = await slugUnico(base);
    const origen = req.invitacionId;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO invitaciones (slug, nombre, tipo_evento, fecha_evento, diseno)
         SELECT $1, $2, tipo_evento, fecha_evento, diseno FROM invitaciones WHERE id = $3
         RETURNING *`,
        [slug, nombre.trim(), origen]
      );
      const copia = rows[0];

      await client.query(
        "INSERT INTO tema (invitacion_id, clave, valor) SELECT $1, clave, valor FROM tema WHERE invitacion_id = $2",
        [copia.id, origen]
      );
      await client.query(
        `INSERT INTO decoraciones (invitacion_id, clave, etiqueta, datos, personalizada)
         SELECT $1, clave, etiqueta, datos, personalizada FROM decoraciones WHERE invitacion_id = $2`,
        [copia.id, origen]
      );
      await client.query(
        `INSERT INTO decoracion_ubicaciones (invitacion_id, clave, seccion_tipo, x, y, ancho, rotacion, opacidad, capa)
         SELECT $1, clave, seccion_tipo, x, y, ancho, rotacion, opacidad, capa FROM decoracion_ubicaciones WHERE invitacion_id = $2`,
        [copia.id, origen]
      );
      await client.query(
        `INSERT INTO secciones (invitacion_id, tipo, titulo_panel, orden, activo, contenido)
         SELECT $1, tipo, titulo_panel, orden, activo, contenido FROM secciones WHERE invitacion_id = $2`,
        [copia.id, origen]
      );
      await client.query(
        `INSERT INTO medios (invitacion_id, tipo, mime, nombre, datos, orden)
         SELECT $1, tipo, mime, nombre, datos, orden FROM medios WHERE invitacion_id = $2`,
        [copia.id, origen]
      );

      await client.query("COMMIT");
      res.status(201).json(copia);
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  })
);

invitacionesRouter.delete(
  "/:invitacionId",
  soloDueno,
  resolverInvitacionAdmin,
  capturar(async (req, res) => {
    // Una invitación marcada como plantilla (empezando por la boda real de
    // Maite y Ricardo) no se borra sin querer: hay que quitarle esa marca
    // desde "editar" antes de poder eliminarla.
    if (req.invitacion.es_plantilla) {
      return res.status(400).json({
        error: "Esta invitación es una plantilla protegida. Quítale esa marca antes de borrarla.",
      });
    }
    await pool.query("DELETE FROM invitaciones WHERE id = $1", [req.invitacionId]);
    res.json({ ok: true });
  })
);

// Crea un evento con el contenido de arranque de su tipo (lo mismo que
// «Nuevo evento» sin plantilla), dentro de una transacción ya abierta. Lo usa
// «Confirmar pago» para convertir a un cliente en evento de un solo toque.
export async function crearEventoBasico(client, { nombre, tipo_evento = "otro", fecha_evento = null, diseno = "clasico" }) {
  const tipo = TIPOS_EVENTO.includes(tipo_evento) ? tipo_evento : "otro";
  const elegido = (await resolverDiseno(diseno, client)) || (await resolverDiseno("clasico", client));
  const disenoFinal = elegido.base;
  const slug = await slugUnico(conSufijo(slugificar(nombre)));
  const { rows: [invitacion] } = await client.query(
    `INSERT INTO invitaciones (slug, nombre, tipo_evento, fecha_evento, diseno, diseno_variante)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [slug, nombre.trim(), tipo, fecha_evento || null, disenoFinal, elegido.variante]
  );
  for (const [clave, valor] of elegido.tema) {
    await client.query("INSERT INTO tema (invitacion_id, clave, valor) VALUES ($1, $2, $3)", [invitacion.id, clave, valor]);
  }
  for (const d of decoracionesBase()) {
    await client.query("INSERT INTO decoraciones (invitacion_id, clave, etiqueta, datos) VALUES ($1, $2, $3, NULL)", [
      invitacion.id, d.clave, d.etiqueta,
    ]);
  }
  for (const sec of plantillaSecciones(tipo, nombre.trim())) {
    await client.query(
      `INSERT INTO secciones (invitacion_id, tipo, titulo_panel, orden, activo, contenido)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [invitacion.id, sec.tipo, sec.titulo_panel, sec.orden, sec.activo, JSON.stringify(sec.contenido)]
    );
  }
  return invitacion;
}
