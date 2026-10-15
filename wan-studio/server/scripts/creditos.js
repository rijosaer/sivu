// Suma (o resta, con número negativo) créditos a una cuenta.
//   npm run creditos correo@ejemplo.com 100
import { pool } from "../db.js";

const [email, cantidad] = process.argv.slice(2);
const n = Number(cantidad);
if (!email || !Number.isInteger(n)) {
  console.error("Uso: npm run creditos <correo> <cantidad>");
  process.exit(1);
}

const { rows } = await pool.query(
  `UPDATE usuarios SET creditos = GREATEST(0, creditos + $2)
    WHERE email = $1 RETURNING email, creditos`,
  [email.trim().toLowerCase(), n]
);
if (!rows[0]) {
  console.error(`No existe una cuenta con el correo ${email}`);
  process.exit(1);
}
console.log(`${rows[0].email} ahora tiene ${rows[0].creditos} créditos.`);
process.exit(0);
