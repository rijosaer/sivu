-- Momento de la última "sesión" de apertura. A diferencia de abierto_en (la
-- primera vez), este se actualiza cada vez que abren la invitación tras una
-- pausa, para poder avisar en cada visita real sin contar los refrescos de una
-- misma sesión como aperturas distintas.
ALTER TABLE invitados ADD COLUMN IF NOT EXISTS ultima_apertura TIMESTAMPTZ;
