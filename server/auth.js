import jwt from "jsonwebtoken";
import "dotenv/config";

const SECRET = process.env.JWT_SECRET || "cambia-este-secreto-en-produccion";

export function firmarToken(usuario) {
  return jwt.sign({ usuario }, SECRET, { expiresIn: "30d" });
}

export function requiereAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No autenticado" });
  try {
    req.admin = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Sesión inválida o expirada" });
  }
}
