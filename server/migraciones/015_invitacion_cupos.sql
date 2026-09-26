-- ------------------------------------------------------------------
-- Invitación por cupos: un titular + N cupos para acompañantes
-- ------------------------------------------------------------------
-- A diferencia de "familia", aquí no se sabe de antemano quiénes vienen: se
-- da un número de cupos y el propio invitado escribe los nombres al
-- confirmar. Los cupos son ADICIONALES al titular (3 cupos = hasta 4
-- personas), y el titular puede no asistir y aun así repartirlos.

ALTER TABLE invitados ADD COLUMN IF NOT EXISTS cupos INTEGER NOT NULL DEFAULT 0;

-- Distingue al titular (false) de quien ocupa un cupo (true). Hace falta una
-- marca explícita y no basta con el "orden": en una invitación de cupos los
-- acompañantes se borran y se vuelven a crear cada vez que el invitado cambia
-- su respuesta, mientras que el titular siempre es el mismo.
ALTER TABLE invitado_miembros
  ADD COLUMN IF NOT EXISTS es_acompanante BOOLEAN NOT NULL DEFAULT false;
