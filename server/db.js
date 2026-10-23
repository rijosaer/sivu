import pg from "pg";
import "dotenv/config";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgres://invitacion:invitacion@localhost:5432/invitacion",
  // Ninguna consulta del sitio debería tardar segundos: si una se atasca (o
  // alguien encuentra la forma de pedir algo carísimo), Postgres la corta en
  // vez de dejar la conexión ocupada indefinidamente.
  statement_timeout: 15_000,
  idle_in_transaction_session_timeout: 30_000,
  connectionTimeoutMillis: 10_000,
  max: 15,
});

// Una conexión inactiva puede morir por su cuenta (la corta la red o el propio
// Postgres). Ese error llega como evento del pool, no como rechazo de una
// consulta: sin este listener, Node lo trata como excepción no capturada y
// termina el proceso. El pool descarta esa conexión y abre otra solo.
pool.on("error", (err) => {
  console.error("Error en una conexión inactiva del pool:", err);
});
