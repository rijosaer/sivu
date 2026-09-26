// Crea (o actualiza la contraseña de) el usuario administrador.
// Uso:  node seed-admin.js usuario contraseña
import bcrypt from "bcryptjs";
import { pool } from "./db.js";

const [, , usuario, password] = process.argv;

if (!usuario || !password) {
  console.log("Uso: node seed-admin.js <usuario> <contraseña>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

await pool.query(
  `INSERT INTO admin_usuarios (usuario, password_hash) VALUES ($1, $2)
   ON CONFLICT (usuario) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
  [usuario, hash]
);

console.log(`Listo. Usuario administrador "${usuario}" creado/actualizado.`);
process.exit(0);
