-- Privacidad del enlace de cada evento. Con solo_codigo = true, la invitación
-- solo se abre con un enlace personal (?i=CODIGO de un invitado de ese
-- evento): el enlace general, adivinable o no, responde como si no existiera.
-- Así nadie que pruebe nombres ("maria-y-juan") ve fechas, lugar ni nombres
-- de la familia. Por defecto queda como estaba (false) para no romper
-- enlaces generales que ya se repartieron.
ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS solo_codigo BOOLEAN NOT NULL DEFAULT false;
