-- ------------------------------------------------------------------
-- Usuarios por evento
-- ------------------------------------------------------------------
-- Hasta aquí todo usuario del panel era dueño: veía, creaba y borraba
-- cualquier evento. Para darle acceso a un cliente (paquete Pro) sin que vea
-- los eventos de los demás, cada usuario puede quedar amarrado a UN evento.
--
--   invitacion_id NULL  → dueño del sistema: todos los eventos (como antes).
--   invitacion_id = N   → cliente: solo el evento N, sin crear ni borrar.
--
-- Los usuarios que ya existen quedan en NULL, o sea, siguen siendo dueños.
-- Si se borra el evento, su usuario cliente se va con él.
-- ------------------------------------------------------------------

ALTER TABLE admin_usuarios
  ADD COLUMN IF NOT EXISTS invitacion_id INTEGER REFERENCES invitaciones(id) ON DELETE CASCADE;
