-- Horario de cada envío automático: antes era fijo de 8 a. m. a 8 p. m.
-- (RITMO en envioMasivo.js). Ahora cada envío guarda su franja y el dueño la
-- puede cambiar, incluso con el envío en marcha. 24 = hasta la medianoche.
ALTER TABLE envios_masivos ADD COLUMN IF NOT EXISTS hora_desde INTEGER NOT NULL DEFAULT 8;
ALTER TABLE envios_masivos ADD COLUMN IF NOT EXISTS hora_hasta INTEGER NOT NULL DEFAULT 20;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'envios_masivos_horario_valido') THEN
    ALTER TABLE envios_masivos ADD CONSTRAINT envios_masivos_horario_valido
      CHECK (hora_desde >= 0 AND hora_hasta <= 24 AND hora_desde < hora_hasta);
  END IF;
END $$;
