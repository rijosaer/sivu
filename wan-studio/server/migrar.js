// Aplica las migraciones pendientes de migraciones/ en orden alfabético.
// Corre en cada despliegue (preDeployCommand en railway.json) y en local con
// npm run migrar. Cada archivo va en su propia transacción.
import { readFileSync, readdirSync } from "node:fs";
import { pool } from "./db.js";

const carpeta = new URL("./migraciones/", import.meta.url);

await pool.query(`
  CREATE TABLE IF NOT EXISTS migraciones (
    archivo TEXT PRIMARY KEY,
    aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);

const yaAplicadas = new Set(
  (await pool.query("SELECT archivo FROM migraciones")).rows.map((r) => r.archivo)
);
const pendientes = readdirSync(carpeta)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .filter((f) => !yaAplicadas.has(f));

if (!pendientes.length) {
  console.log("Base al día, no hay migraciones pendientes.");
  process.exit(0);
}

for (const archivo of pendientes) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(readFileSync(new URL(archivo, carpeta), "utf8"));
    await client.query("INSERT INTO migraciones (archivo) VALUES ($1)", [archivo]);
    await client.query("COMMIT");
    console.log(`  ✓ ${archivo}`);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(`Falló la migración ${archivo}: ${e.message}`);
    process.exit(1);
  } finally {
    client.release();
  }
}

console.log("Listo.");
process.exit(0);
