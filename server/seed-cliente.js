// Crea (o actualiza) el usuario de un cliente, amarrado a UN evento: al entrar
// al panel va directo a ese evento y no ve ni puede tocar ningún otro.
// Uso:  node seed-cliente.js usuario contraseña slug-del-evento
import bcrypt from "bcryptjs";
import { pool } from "./db.js";

const [, , usuario, password, slug] = process.argv;

if (!usuario || !password || !slug) {
  console.log("Uso: node seed-cliente.js <usuario> <contraseña> <slug-del-evento>");
  process.exit(1);
}

const { rows } = await pool.query("SELECT id, nombre FROM invitaciones WHERE slug = $1", [slug]);
if (!rows.length) {
  console.log(`No existe un evento con el enlace "${slug}".`);
  process.exit(1);
}
const evento = rows[0];

// Un usuario que ya existe como dueño no se degrada a cliente por accidente.
const previo = await pool.query("SELECT invitacion_id FROM admin_usuarios WHERE usuario = $1", [usuario]);
if (previo.rows.length && previo.rows[0].invitacion_id === null) {
  console.log(`"${usuario}" es un usuario administrador del sistema; usa otro nombre para el cliente.`);
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
await pool.query(
  `INSERT INTO admin_usuarios (usuario, password_hash, invitacion_id) VALUES ($1, $2, $3)
   ON CONFLICT (usuario) DO UPDATE
     SET password_hash = EXCLUDED.password_hash, invitacion_id = EXCLUDED.invitacion_id`,
  [usuario, hash, evento.id]
);

console.log(`Listo. Cliente "${usuario}" con acceso solo a "${evento.nombre}" (/${slug}).`);
process.exit(0);
