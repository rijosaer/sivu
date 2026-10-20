import { Router } from "express";
import { pool } from "../db.js";
import { capturar } from "../errores.js";
import { exigirAccesoPublico, resolverInvitacionPublica } from "../middlewareInvitacion.js";
import { avisarRespuesta, fotoRespuestas } from "../avisosWhatsapp.js";
import { publicoNegocioRouter } from "./publicoNegocio.js";
import { enviarArchivo, firmaValida, urlMedio } from "../archivos.js";
import { CLAVE_RE, CODIGO_RE, esIdValido, limitador, texto } from "../seguridad.js";

export const publicRouter = Router();

// Cotizaciones y formulario de datos del evento (enlaces con token).
publicRouter.use(publicoNegocioRouter);

// Convierte una data URL ("data:image/png;base64,AAA...") en bytes + mime.
// Las decoraciones se guardan así desde antes; se decodifican al servirlas.
function partirDataUrl(dataUrl) {
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl || "");
  if (!m) return null;
  return { mime: m[1].toLowerCase(), buffer: Buffer.from(m[2], "base64") };
}

// Antes de las URLs firmadas, alguien pudo pegar en el contenido de una
// sección la dirección de una foto subida ("…/api/public/medio/12", por
// ejemplo en «fotos por enlace externo»). Para que esas invitaciones sigan
// viéndose igual, al servirlas se les pone la firma, pero solo a los archivos
// que son de este mismo evento: así no sirve para abrir los de otro.
async function firmarMediosDelContenido(secciones, invitacionId) {
  const texto = JSON.stringify(secciones);
  const ids = [...new Set([...texto.matchAll(/\/api\/public\/medio\/(\d{1,10})(?!\d|\?f=)/g)].map((m) => Number(m[1])))];
  if (!ids.length) return secciones;
  const { rows } = await pool.query("SELECT id FROM medios WHERE id = ANY($1) AND invitacion_id = $2", [ids, invitacionId]);
  const propios = new Set(rows.map((r) => r.id));
  return JSON.parse(
    texto.replace(/\/api\/public\/medio\/(\d{1,10})(?!\d|\?f=)/g, (todo, id) =>
      propios.has(Number(id)) ? urlMedio(id) : todo
    )
  );
}

const codigoValido = (c) => typeof c === "string" && CODIGO_RE.test(c);

// Adivinar códigos de invitado: cada código que no existe cuenta. 20 fallos
// en 10 minutos bastan para quien se equivoca escribiendo; para recorrer los
// ~mil millones de códigos posibles harían falta siglos.
const limiteCodigos = limitador({
  ventanaMs: 10 * 60 * 1000,
  maximo: 20,
  soloFallos: true,
  mensaje: "Demasiados códigos incorrectos. Espera unos minutos.",
});
// Confirmar asistencia: nadie necesita mandar más de unas cuantas por minuto.
const limiteRsvp = limitador({
  ventanaMs: 10 * 60 * 1000,
  maximo: 30,
  mensaje: "Demasiadas confirmaciones seguidas. Espera un momento.",
});

// Todo lo de una invitación puntual cuelga de su slug:
// /api/public/invitaciones/:slug/... . resolverInvitacionPublica ya validó
// que el slug existe y que la invitación está activa antes de llegar aquí.
const invitacionRouter = Router({ mergeParams: true });
// Quien recorre nombres de eventos ("maria-y-juan", "carlos-y-laura"...)
// buscando invitaciones choca con este freno: solo cuentan los que no
// existen, así que abrir una invitación real nunca lo activa.
const limiteSlugs = limitador({
  ventanaMs: 10 * 60 * 1000,
  maximo: 15,
  soloFallos: true,
  mensaje: "Demasiadas invitaciones no encontradas. Espera unos minutos.",
});
publicRouter.use("/invitaciones/:slug", limiteSlugs, resolverInvitacionPublica, invitacionRouter);

// Todo el sitio: tema, decoraciones, dónde va cada una y las secciones activas.
// Ojo: aquí NO viajan imágenes ni audio, solo las URLs para pedirlos aparte.
invitacionRouter.get(
  "/site",
  exigirAccesoPublico,
  capturar(async (req, res) => {
    const id = req.invitacionId;
    const [tema, decoraciones, ubicaciones, secciones, fotos, audio, fondo, limite] = await Promise.all([
      // Solo colores y letras: la tabla "tema" también guarda ajustes del
      // panel (como la plantilla de WhatsApp) que no tienen por qué viajar al
      // navegador de cada invitado.
      pool.query(
        "SELECT clave, valor FROM tema WHERE invitacion_id = $1 AND (clave LIKE 'color-%' OR clave LIKE 'fuente-%')",
        [id]
      ),
      pool.query(
        "SELECT clave, (datos IS NOT NULL) AS tiene, extract(epoch FROM actualizado_en)::bigint AS v FROM decoraciones WHERE invitacion_id = $1",
        [id]
      ),
      pool.query(
        `SELECT id, clave, seccion_tipo, x::float, y::float, ancho::float,
                rotacion::float, opacidad::float, capa
         FROM decoracion_ubicaciones WHERE invitacion_id = $1 ORDER BY id`,
        [id]
      ),
      pool.query(
        "SELECT id, tipo, contenido FROM secciones WHERE invitacion_id = $1 AND activo = true ORDER BY orden ASC",
        [id]
      ),
      pool.query("SELECT id FROM medios WHERE invitacion_id = $1 AND tipo = 'foto' ORDER BY orden, id", [id]),
      pool.query("SELECT id FROM medios WHERE invitacion_id = $1 AND tipo = 'audio' ORDER BY id DESC LIMIT 1", [id]),
      pool.query("SELECT id FROM medios WHERE invitacion_id = $1 AND tipo = 'fondo' ORDER BY id DESC LIMIT 1", [id]),
      pool.query(sqlLimite(), [id]),
    ]);

    res.json({
      invitacion: {
        slug: req.invitacion.slug,
        nombre: req.invitacion.nombre,
        tipoEvento: req.invitacion.tipo_evento,
        diseno: req.invitacion.diseno || "clasico",
      },
      tema: Object.fromEntries(tema.rows.map((r) => [r.clave, r.valor])),
      // null = usar la imagen de fábrica que trae el sitio.
      decoraciones: Object.fromEntries(
        decoraciones.rows.map((r) => [
          r.clave,
          r.tiene ? `/api/public/invitaciones/${req.invitacion.slug}/decoracion/${r.clave}?v=${r.v}` : null,
        ])
      ),
      ubicaciones: ubicaciones.rows,
      secciones: await firmarMediosDelContenido(secciones.rows, id),
      // Aparte de las secciones a propósito: el plazo se aplica en el servidor
      // aunque "Información de la boda" esté oculta, así que el sitio también
      // tiene que conocerlo en ese caso. Si no, el invitado vería el formulario
      // abierto y recibiría un 403 al confirmar.
      fechaLimiteConfirmacion: limite.rows[0]?.limite || null,
      fotosSubidas: fotos.rows.map((r) => urlMedio(r.id)),
      audioUrl: audio.rows.length ? urlMedio(audio.rows[0].id) : null,
      // null = usar el papel dibujado por CSS que trae el sitio.
      fondoUrl: fondo.rows.length ? urlMedio(fondo.rows[0].id) : null,
    });
  })
);

// Imagen de una decoración. Lleva ?v= en la URL, así que se puede cachear.
invitacionRouter.get(
  "/decoracion/:clave",
  capturar(async (req, res) => {
    if (!CLAVE_RE.test(req.params.clave)) return res.status(404).json({ error: "Decoración no encontrada" });
    const { rows } = await pool.query(
      "SELECT datos FROM decoraciones WHERE clave = $1 AND invitacion_id = $2",
      [req.params.clave, req.invitacionId]
    );
    const partes = rows.length ? partirDataUrl(rows[0].datos) : null;
    if (!partes) return res.status(404).json({ error: "Decoración no encontrada" });
    enviarArchivo(res, partes.mime, partes.buffer);
  })
);

// La invitación de un código, con todas las personas que cubre.
invitacionRouter.get(
  "/invitado/:codigo",
  limiteCodigos,
  capturar(async (req, res) => {
    if (!codigoValido(req.params.codigo)) return res.status(404).json({ error: "Invitación no encontrada" });
    const { rows } = await pool.query(
      "SELECT id, codigo, tipo, nombre, familia, mensaje, cupos FROM invitados WHERE codigo = $1 AND invitacion_id = $2",
      [req.params.codigo, req.invitacionId]
    );
    if (!rows.length) return res.status(404).json({ error: "Invitación no encontrada" });

    const invitacion = rows[0];
    const miembros = await pool.query(
      `SELECT id, nombre, estado, restriccion, comentario, es_acompanante
       FROM invitado_miembros WHERE invitado_id = $1 ORDER BY orden, id`,
      [invitacion.id]
    );

    res.json({
      codigo: invitacion.codigo,
      tipo: invitacion.tipo,
      nombre: invitacion.nombre,
      familia: invitacion.familia,
      mensaje: invitacion.mensaje,
      // Cuántos acompañantes puede traer, además del titular. Solo aplica al
      // tipo "cupos"; en el resto es 0.
      cupos: invitacion.cupos,
      miembros: miembros.rows,
    });
  })
);

// Fecha de hoy en Bogotá como "YYYY-MM-DD". No sirve usar la del servidor:
// Railway corre en UTC, así que entre las 7 p. m. y la medianoche de Colombia
// ya estaría contando el día siguiente y cerraría las confirmaciones antes.
function hoyEnBogota() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// El plazo se guarda como "2026-10-15" dentro del contenido de la sección de
// información. Vence al terminar ese día, no al empezarlo.
// El ORDER BY no sobra: "secciones" no tiene ninguna columna única, y ya pasó
// una vez que se duplicaran todas al re-ejecutar schema.sql. Sin él, un
// duplicado viejo podía decidir el plazo de forma arbitraria.
function sqlLimite() {
  return `SELECT contenido ->> 'fechaLimiteConfirmacion' AS limite
     FROM secciones WHERE invitacion_id = $1 AND tipo = 'informacion_boda' ORDER BY id LIMIT 1`;
}

async function plazoVencido(invitacionId) {
  const { rows } = await pool.query(sqlLimite(), [invitacionId]);
  const limite = rows[0]?.limite;
  if (!limite || !/^\d{4}-\d{2}-\d{2}$/.test(limite)) return null; // sin plazo configurado
  // Las dos fechas están en el mismo formato, así que comparar el texto
  // equivale a comparar los días.
  return hoyEnBogota() > limite ? limite : null;
}

// Respuesta del invitado: una entrada por persona.
// Body: { codigo, respuestas: [{ id, estado, restriccion, comentario }],
//         acompanantes?: [{ nombre, restriccion }] }
// "acompanantes" solo lo manda una invitación por cupos: son las personas que
// el invitado escribe para ocupar los cupos que se le dieron.
invitacionRouter.post(
  "/rsvp",
  limiteRsvp,
  limiteCodigos,
  capturar(async (req, res) => {
    const { codigo, respuestas, acompanantes } = req.body || {};
    if (!codigoValido(codigo) || !Array.isArray(respuestas) || !respuestas.length || respuestas.length > 100) {
      return res.status(400).json({ error: "Faltan datos para confirmar" });
    }
    // Cada respuesta: id numérico y textos con tope. Lo que no venga así se
    // rechaza entero antes de tocar la base.
    const limpias = respuestas.map((r) => ({
      id: r?.id,
      estado: r?.estado,
      restriccion: texto(r?.restriccion, 2000),
      comentario: texto(r?.comentario, 5000),
    }));
    if (limpias.some((r) => !esIdValido(r.id) || r.restriccion === null || r.comentario === null)) {
      return res.status(400).json({ error: "La respuesta no llegó bien" });
    }

    // Se comprueba aquí, en el servidor: que el sitio esconda el formulario
    // no impide que alguien con la pestaña abierta desde antes, o llamando la
    // API directo, siga cambiando su respuesta pasado el cierre.
    const vencido = await plazoVencido(req.invitacionId);
    if (vencido) {
      return res.status(403).json({
        error: `El plazo para confirmar terminó el ${vencido}. Escríbeles a los novios si necesitas cambiar tu respuesta.`,
      });
    }

    const inv = await pool.query(
      "SELECT id, tipo, cupos FROM invitados WHERE codigo = $1 AND invitacion_id = $2",
      [codigo, req.invitacionId]
    );
    if (!inv.rows.length) return res.status(404).json({ error: "Código no encontrado" });
    const { id: invitadoId, tipo, cupos } = inv.rows[0];

    const estadosValidos = ["pendiente", "confirmado", "no_asistira"];
    if (limpias.some((r) => !estadosValidos.includes(r.estado))) {
      return res.status(400).json({ error: "Estado de asistencia no válido" });
    }

    // Los acompañantes solo se aceptan donde hay cupos que ocupar, y la única
    // condición es que cada uno venga con nombre.
    let nuevosAcompanantes = null;
    if (acompanantes !== undefined) {
      if (!Array.isArray(acompanantes) || acompanantes.length > 50) {
        return res.status(400).json({ error: "Los acompañantes no llegaron bien" });
      }
      if (tipo !== "cupos") {
        return res.status(400).json({ error: "Esta invitación no admite acompañantes" });
      }
      nuevosAcompanantes = acompanantes.map((a) => ({
        nombre: String(texto(a?.nombre, 120) ?? "").trim(),
        restriccion: String(texto(a?.restriccion, 500) ?? "").trim(),
      }));
      if (nuevosAcompanantes.some((a) => !a.nombre)) {
        return res.status(400).json({ error: "Escribe el nombre de cada acompañante" });
      }
      if (nuevosAcompanantes.length > cupos) {
        return res.status(400).json({
          error: `Tu invitación tiene ${cupos} cupo(s) para acompañantes`,
        });
      }
    }

    // Cómo estaba antes, para avisar al cliente solo si algo cambió.
    const antes = await fotoRespuestas(invitadoId);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const r of limpias) {
        // El WHERE con invitado_id impide que un código toque los miembros de otra invitación.
        await client.query(
          `UPDATE invitado_miembros
           SET estado = $3, restriccion = $4, comentario = $5,
               respondido_en = CASE WHEN $3 <> 'pendiente' THEN now() ELSE respondido_en END,
               -- Si antes se había marcado a mano desde el panel, la respuesta
               -- del propio invitado manda: vuelve a contar como novedad.
               respondido_via = 'invitado'
           WHERE id = $1 AND invitado_id = $2`,
          [r.id, invitadoId, r.estado, r.restriccion || "", r.comentario || ""]
        );
      }

      if (nuevosAcompanantes) {
        // Se reemplaza la lista entera en vez de irla comparando fila por
        // fila: el invitado puede renombrar, quitar o cambiar el orden de sus
        // acompañantes, y así lo que quede guardado es exactamente lo que él
        // ve en el formulario.
        const actuales = await client.query(
          `SELECT nombre, restriccion FROM invitado_miembros
           WHERE invitado_id = $1 AND es_acompanante = true ORDER BY orden, id`,
          [invitadoId]
        );
        // Si mandó lo mismo que ya estaba (por ejemplo, solo cambió su propia
        // respuesta), no se toca nada: recrear las filas volvería a sonar el
        // aviso del panel por gente que ya estaba confirmada.
        const igual =
          actuales.rows.length === nuevosAcompanantes.length &&
          actuales.rows.every(
            (a, i) =>
              a.nombre === nuevosAcompanantes[i].nombre &&
              a.restriccion === nuevosAcompanantes[i].restriccion
          );

        if (!igual) {
          await client.query(
            "DELETE FROM invitado_miembros WHERE invitado_id = $1 AND es_acompanante = true",
            [invitadoId]
          );
          const base = await client.query(
            "SELECT COALESCE(max(orden), 0) AS orden FROM invitado_miembros WHERE invitado_id = $1",
            [invitadoId]
          );
          for (const [i, a] of nuevosAcompanantes.entries()) {
            // Quien ocupa un cupo asiste por definición: el invitado no lo
            // escribiría si no fuera a venir.
            await client.query(
              `INSERT INTO invitado_miembros
                 (invitado_id, nombre, orden, es_acompanante, estado, restriccion,
                  respondido_en, respondido_via)
               VALUES ($1, $2, $3, true, 'confirmado', $4, now(), 'invitado')`,
              [invitadoId, a.nombre, Number(base.rows[0].orden) + i + 1, a.restriccion]
            );
          }
        }
      }

      await client.query("COMMIT");
      res.json({ ok: true });
      // Después de responder: el invitado no espera a que salga el WhatsApp.
      avisarRespuesta({ invitacionId: req.invitacionId, invitadoId, antes });
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  })
);

// Registra que se abrió una invitación. Lo llama el sitio al cargar con un
// código válido. Guarda la primera apertura y cuenta las veces.
invitacionRouter.post(
  "/visto",
  capturar(async (req, res) => {
    const codigo = req.body?.codigo;
    if (!codigoValido(codigo)) return res.status(400).json({ error: "Falta el código" });
    // "ultima_apertura" solo se mueve cuando ha pasado un rato desde la última
    // apertura (nueva visita), no en cada refresco. Así se avisa una vez por
    // visita real y no una por cada recarga de la misma sesión.
    await pool.query(
      `UPDATE invitados
       SET aperturas = aperturas + 1,
           abierto_en = COALESCE(abierto_en, now()),
           ultima_apertura = CASE
             WHEN ultima_apertura IS NULL OR now() - ultima_apertura > interval '15 minutes'
             THEN now() ELSE ultima_apertura END
       WHERE codigo = $1 AND invitacion_id = $2`,
      [codigo, req.invitacionId]
    );
    // Se responde ok siempre: si el código no existe, no se revela.
    res.json({ ok: true });
  })
);

// Foto de la galería o audio de fondo. El id cambia al reemplazar el archivo,
// así que se puede cachear para siempre sin quedar desactualizado. La URL
// lleva una firma (?f=) que solo emite el servidor a quien ya puede ver el
// archivo: sin ella, recorrer ids consecutivos no devuelve nada (antes servía
// para bajar las fotos de cualquier evento). Firma mala, id mal formado o id
// inexistente responden lo mismo: 404.
publicRouter.get(
  "/medio/:id",
  capturar(async (req, res) => {
    const { id } = req.params;
    if (!esIdValido(id) || !firmaValida(id, req.query.f)) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }
    const { rows } = await pool.query("SELECT mime, datos FROM medios WHERE id = $1", [id]);
    if (!rows.length) return res.status(404).json({ error: "Archivo no encontrado" });
    enviarArchivo(res, rows[0].mime, rows[0].datos);
  })
);
