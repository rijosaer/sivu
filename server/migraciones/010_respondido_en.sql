-- Momento en que cada persona respondió (confirmó o rechazó). Sirve para
-- avisar al panel de las respuestas nuevas. Las respuestas anteriores a esta
-- columna quedan en NULL: no se notifican (no son nuevas).
ALTER TABLE invitado_miembros ADD COLUMN IF NOT EXISTS respondido_en TIMESTAMPTZ;
