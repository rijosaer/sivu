-- Grupos de invitados y dos modos nuevos de regalo por invitado.
--
-- grupo: de quién es la invitación («Novio», «Novia», «Trabajo»…). Texto libre
-- para filtrar, contar y enviar por grupo; vacío = sin grupo.
--
-- regalo_modo suma «sobres» (lluvia de sobres: ve los datos para aportar) y
-- «especifico» (un regalo puntual asignado a esa persona, en regalo_detalle y,
-- si hay dónde comprarlo, regalo_url). «enlace» y «lista» siguen igual.

ALTER TABLE invitados ADD COLUMN IF NOT EXISTS grupo TEXT NOT NULL DEFAULT '';
ALTER TABLE invitados ADD COLUMN IF NOT EXISTS regalo_detalle TEXT NOT NULL DEFAULT '';
ALTER TABLE invitados ADD COLUMN IF NOT EXISTS regalo_url TEXT NOT NULL DEFAULT '';

-- La regla anterior (de 038) se creó sin nombre propio: se busca por el campo
-- que revisa y se quita, se llame como se llame, antes de poner la nueva.
DO $$
DECLARE regla TEXT;
BEGIN
  FOR regla IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'invitados'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%regalo_modo%'
  LOOP
    EXECUTE format('ALTER TABLE invitados DROP CONSTRAINT %I', regla);
  END LOOP;
END $$;
ALTER TABLE invitados ADD CONSTRAINT invitados_regalo_modo_check
  CHECK (regalo_modo IN ('', 'enlace', 'lista', 'sobres', 'especifico'));

CREATE INDEX IF NOT EXISTS idx_invitados_grupo ON invitados (invitacion_id, grupo);
