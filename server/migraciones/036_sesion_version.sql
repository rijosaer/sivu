-- Versión de sesión de cada usuario del panel. Va dentro de su token; al
-- cerrar sesión o cambiar la contraseña se sube, y todos los tokens que ya
-- se habían emitido dejan de servir en el acto (revocación del lado del
-- servidor, sin esperar a que venzan).
ALTER TABLE admin_usuarios ADD COLUMN IF NOT EXISTS sesion_version INTEGER NOT NULL DEFAULT 0;
