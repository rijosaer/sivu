-- Una opción de la lista puede apartarla más de una persona (p. ej. quieren
-- dos escritorios: «personas = 2»). Cada invitado sigue apartando UNA opción.
ALTER TABLE regalo_opciones ADD COLUMN IF NOT EXISTS personas INTEGER NOT NULL DEFAULT 1;
DO $$ BEGIN
  ALTER TABLE regalo_opciones ADD CONSTRAINT regalo_opciones_personas_rango CHECK (personas BETWEEN 1 AND 99);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Las reservas pasan a su propia tabla: una opción, varias personas.
CREATE TABLE IF NOT EXISTS regalo_reservas (
  id SERIAL PRIMARY KEY,
  opcion_id INTEGER NOT NULL REFERENCES regalo_opciones (id) ON DELETE CASCADE,
  invitado_id INTEGER NOT NULL UNIQUE REFERENCES invitados (id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_regalo_reservas_opcion ON regalo_reservas (opcion_id);

-- Lo que ya estaba apartado se conserva. Las columnas viejas (reservado_por,
-- reservado_en) quedan como estaban, sin usarse, por si hubiera que volver
-- a la versión anterior.
INSERT INTO regalo_reservas (opcion_id, invitado_id, creado_en)
  SELECT id, reservado_por, COALESCE(reservado_en, now()) FROM regalo_opciones WHERE reservado_por IS NOT NULL
  ON CONFLICT (invitado_id) DO NOTHING;
