// Aplica las migraciones pendientes y deja la base al día.
// Corre en cada despliegue (preDeployCommand en railway.json) y también
// sirve en local:  npm run migrar
//
// Cómo funciona:
//  - La tabla "migraciones" guarda qué archivos ya se aplicaron.
//  - Si la base está vacía, primero instala schema.sql y lo anota como base.
//  - Después aplica, en orden alfabético, los .sql de migraciones/ que falten.
//  - Cada archivo va dentro de una transacción: si falla, no queda a medias
//    y el despliegue falla en vez de publicar código contra una base rota.
import { readFileSync, readdirSync } from "node:fs";
import { pool } from "./db.js";

const carpeta = new URL("./migraciones/", import.meta.url);

await pool.query(`
  CREATE TABLE IF NOT EXISTS migraciones (
    archivo TEXT PRIMARY KEY,
    aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);

async function aplicar(nombre, sql) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO migraciones (archivo) VALUES ($1)", [nombre]);
    await client.query("COMMIT");
    console.log(`  ✓ ${nombre}`);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw new Error(`Falló la migración ${nombre}: ${e.message}`, { cause: e });
  } finally {
    client.release();
  }
}

const yaAplicadas = new Set(
  (await pool.query("SELECT archivo FROM migraciones")).rows.map((r) => r.archivo)
);

// Base recién creada: instalar el esquema inicial.
const { rows } = await pool.query("SELECT to_regclass('public.secciones') IS NOT NULL AS existe");
if (!rows[0].existe) {
  console.log("Base vacía — instalando schema.sql");
  await aplicar("000_schema.sql", readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
  yaAplicadas.add("000_schema.sql");
} else if (!yaAplicadas.has("000_schema.sql")) {
  // Base que ya existía antes de que hubiera migraciones: se da por instalada.
  await pool.query("INSERT INTO migraciones (archivo) VALUES ($1)", ["000_schema.sql"]);
  yaAplicadas.add("000_schema.sql");
}

const pendientes = readdirSync(carpeta)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .filter((f) => !yaAplicadas.has(f));

if (!pendientes.length) {
  console.log("Base al día, no hay migraciones pendientes.");
  process.exit(0);
}

console.log(`Aplicando ${pendientes.length} migración(es):`);
for (const archivo of pendientes) {
  await aplicar(archivo, readFileSync(new URL(archivo, carpeta), "utf8"));
}

console.log("Listo.");
process.exit(0);
