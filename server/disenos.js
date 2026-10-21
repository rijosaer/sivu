import { Router } from "express";
import { pool } from "./db.js";
import { capturar } from "./errores.js";
import { DISENOS, temaDeDiseno } from "./plantillas.js";

// Catálogo de diseños de invitación (tabla «disenos»). Los diseños
// programados (src/disenos/* del sitio) son la base; una variante usa el
// mismo dibujo con otra paleta y otras letras. Un evento con una variante
// guarda su base en invitaciones.diseno (lo que el sitio sabe dibujar), la
// variante en diseno_variante, y el tema con los colores de la variante.

// Claves del tema que una variante puede cambiar.
export const CLAVES_TEMA = [
  "color-paper", "color-ink", "color-gold", "color-gold-light", "color-gold-dark", "color-marble", "color-seal",
  "fuente-guion", "fuente-titulos", "fuente-cuerpo",
];

// Diseños con demostración pública en /plantillas/<id> (src/demo del sitio).
// El clásico se enseña con una boda real; Celebración aún no tiene muestra.
const CON_DEMO = ["jardin", "ensueno", "gala", "lazos", "coquette", "paris", "valle", "valle-claro", "eucalipto", "luces", "vals", "luz", "confeti", "dulce", "birrete", "medianoche", "osito", "cielito", "capillita", "cometas", "bosquecito"];

export function vistaDe(d) {
  if (CON_DEMO.includes(d.base)) return `/plantillas/${d.id}`;
  if (d.id === "clasico") return "/ana-y-diego";
  return null;
}

function limpiarTema(tema) {
  const limpio = {};
  for (const [k, v] of Object.entries(tema || {})) {
    if (!CLAVES_TEMA.includes(k) || typeof v !== "string") continue;
    const valor = v.trim();
    if (k.startsWith("color-") && /^#[0-9a-fA-F]{6}$/.test(valor)) limpio[k] = valor.toUpperCase();
    if (k.startsWith("fuente-") && /^[\w ]{2,40}$/.test(valor)) limpio[k] = valor;
  }
  return limpio;
}

// El tema completo que ve un evento con este diseño: el del base y, encima,
// lo que cambia la variante.
export function temaEfectivo(d) {
  const base = Object.fromEntries(temaDeDiseno(d.base));
  return { ...base, ...(d.tema || {}) };
}

// «valle» o «valle-rosa» → { base, variante, tema: [[clave, valor], ...] }.
// null si no existe.
export async function resolverDiseno(id, db = pool) {
  if (!id) return null;
  const { rows: [d] } = await db.query("SELECT * FROM disenos WHERE id = $1", [id]);
  if (d) return { base: d.base, variante: d.id === d.base ? null : d.id, tema: Object.entries(temaEfectivo(d)) };
  if (DISENOS.includes(id)) return { base: id, variante: null, tema: temaDeDiseno(id) };
  return null;
}

function slug(texto) {
  return String(texto || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

// ---------- Rutas del dueño (/api/admin/crm/disenos) ----------

export const disenosRouter = Router();

async function listar() {
  const { rows } = await pool.query(
    `SELECT d.*,
       (SELECT count(*) FROM invitaciones i
         WHERE NOT i.es_plantilla AND COALESCE(i.diseno_variante, i.diseno) = d.id)::int AS eventos
     FROM disenos d ORDER BY d.orden, d.creado_en`
  );
  return rows.map((d) => ({
    ...d,
    variante: d.id !== d.base,
    vista: vistaDe(d),
    tema_efectivo: temaEfectivo(d),
  }));
}

disenosRouter.get("/", capturar(async (_req, res) => res.json(await listar())));

disenosRouter.put(
  "/:id",
  capturar(async (req, res) => {
    const { rows: [d] } = await pool.query("SELECT * FROM disenos WHERE id = $1", [req.params.id]);
    if (!d) return res.status(404).json({ error: "Ese diseño no existe" });
    const { nombre, descripcion, en_landing, tema } = req.body;
    if (nombre !== undefined && !String(nombre).trim()) return res.status(400).json({ error: "Ponle un nombre al diseño" });
    if (en_landing === true && !vistaDe(d)) {
      return res.status(400).json({ error: "Este diseño todavía no tiene vista de ejemplo, así que no se puede mostrar en la landing" });
    }
    // Los colores de los diseños programados viven en el código: aquí solo
    // se cambian los de las variantes.
    if (tema !== undefined && d.id === d.base) {
      return res.status(400).json({ error: "Para cambiar colores crea una variante: el diseño original queda intacto" });
    }
    await pool.query(
      `UPDATE disenos SET
         nombre = COALESCE($2, nombre), descripcion = COALESCE($3, descripcion),
         en_landing = COALESCE($4, en_landing), tema = COALESCE($5, tema), actualizado_en = now()
       WHERE id = $1`,
      [
        d.id,
        nombre !== undefined ? String(nombre).trim().slice(0, 60) : null,
        descripcion !== undefined ? String(descripcion).trim().slice(0, 120) : null,
        typeof en_landing === "boolean" ? en_landing : null,
        tema !== undefined ? JSON.stringify(limpiarTema(tema)) : null,
      ]
    );
    res.json((await listar()).find((x) => x.id === d.id));
  })
);

disenosRouter.post(
  "/:id/variante",
  capturar(async (req, res) => {
    const { rows: [origen] } = await pool.query("SELECT * FROM disenos WHERE id = $1", [req.params.id]);
    if (!origen) return res.status(404).json({ error: "Ese diseño no existe" });
    const nombre = String(req.body.nombre || `${origen.nombre} (variante)`).trim().slice(0, 60);
    // La dirección pública sale del nombre: /plantillas/valle-rosa-atardecer.
    let id = slug(nombre) || `${origen.base}-variante`;
    if (DISENOS.includes(id)) id = `${id}-variante`;
    for (let n = 2; (await pool.query("SELECT 1 FROM disenos WHERE id = $1", [id])).rowCount; n++) {
      id = `${id.replace(/-\d+$/, "")}-${n}`;
    }
    await pool.query(
      `INSERT INTO disenos (id, base, nombre, descripcion, tema, en_landing, orden)
       VALUES ($1, $2, $3, $4, $5, false, $6)`,
      [id, origen.base, nombre, origen.descripcion, JSON.stringify(origen.tema || {}), origen.orden]
    );
    res.status(201).json((await listar()).find((x) => x.id === id));
  })
);

disenosRouter.delete(
  "/:id",
  capturar(async (req, res) => {
    const d = (await listar()).find((x) => x.id === req.params.id);
    if (!d) return res.status(404).json({ error: "Ese diseño no existe" });
    if (!d.variante) return res.status(400).json({ error: "Los diseños originales no se borran" });
    if (d.eventos > 0) return res.status(400).json({ error: `Lo usan ${d.eventos} evento(s): no se puede borrar` });
    await pool.query("DELETE FROM disenos WHERE id = $1", [d.id]);
    res.status(204).end();
  })
);

// ---------- Rutas públicas (/api/public/disenos) ----------

export const disenosPublicosRouter = Router();

// Lo que muestra la landing en «Modelos».
disenosPublicosRouter.get(
  "/",
  capturar(async (_req, res) => {
    const { rows } = await pool.query("SELECT * FROM disenos WHERE en_landing ORDER BY orden, creado_en");
    res.set("Cache-Control", "public, max-age=60");
    res.json(rows.filter(vistaDe).map((d) => ({ id: d.id, nombre: d.nombre, descripcion: d.descripcion, vista: vistaDe(d) })));
  })
);

// Lo que necesita /plantillas/<id> para pintar una variante: su base y sus
// colores. Los diseños sin publicar también responden (el panel los previsualiza).
disenosPublicosRouter.get(
  "/:id",
  capturar(async (req, res) => {
    const { rows: [d] } = await pool.query("SELECT * FROM disenos WHERE id = $1", [req.params.id]);
    if (!d) return res.status(404).json({ error: "Ese diseño no existe" });
    res.json({ id: d.id, base: d.base, nombre: d.nombre, tema: d.tema || {} });
  })
);
