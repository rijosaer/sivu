// Crea (o actualiza la contraseña de) el usuario administrador.
// Uso:  node seed-admin.js usuario contraseña
import bcrypt from "bcryptjs";
import { pool } from "./db.js";

const [, , usuario, password] = process.argv;

if (!usuario || !password) {
  console.log("Uso: node seed-admin.js <usuario> <contraseña>");
  process.exit(1);
}
if (password.length < 12) {
  console.log("La contraseña del administrador necesita mínimo 12 caracteres.");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);

await pool.query(
  `INSERT INTO admin_usuarios (usuario, password_hash) VALUES ($1, $2)
   ON CONFLICT (usuario) DO UPDATE
     SET password_hash = EXCLUDED.password_hash, sesion_version = admin_usuarios.sesion_version + 1`,
  [usuario, hash]
);

console.log(`Listo. Usuario administrador "${usuario}" creado/actualizado.`);
process.exit(0);
