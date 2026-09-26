-- Aperturas de la invitación: cuándo se abrió por primera vez y cuántas veces.
-- Sirve para saber quién ya vio su invitación y avisar en el panel.
ALTER TABLE invitados ADD COLUMN IF NOT EXISTS abierto_en TIMESTAMPTZ;
ALTER TABLE invitados ADD COLUMN IF NOT EXISTS aperturas INTEGER NOT NULL DEFAULT 0;
