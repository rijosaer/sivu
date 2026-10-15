import pg from "pg";
import "dotenv/config";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgres://wan:wan@localhost:5433/wanstudio",
});

// Una conexión inactiva que muere llega como evento del pool, no como rechazo
// de una consulta: sin este listener Node termina el proceso.
pool.on("error", (err) => {
  console.error("Error en una conexión inactiva del pool:", err);
});
