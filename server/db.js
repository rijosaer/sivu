import pg from "pg";
import "dotenv/config";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgres://invitacion:invitacion@localhost:5432/invitacion",
});

// Una conexión inactiva puede morir por su cuenta (la corta la red o el propio
// Postgres). Ese error llega como evento del pool, no como rechazo de una
// consulta: sin este listener, Node lo trata como excepción no capturada y
// termina el proceso. El pool descarta esa conexión y abre otra solo.
pool.on("error", (err) => {
  console.error("Error en una conexión inactiva del pool:", err);
});
