-- Regalos por invitado: a unos invitados se les da un enlace de compra y a
-- otros una lista de opciones que pueden apartar. Lo común del evento (títulos,
-- textos y el enlace) vive en la sección "regalos" con contenido.porInvitado;
-- las opciones van en su propia tabla porque cada una guarda quién la apartó.

ALTER TABLE invitados ADD COLUMN IF NOT EXISTS regalo_modo TEXT NOT NULL DEFAULT ''
  CHECK (regalo_modo IN ('', 'enlace', 'lista'));

CREATE TABLE IF NOT EXISTS regalo_opciones (
  id SERIAL PRIMARY KEY,
  invitacion_id INTEGER NOT NULL REFERENCES invitaciones (id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  detalle TEXT NOT NULL DEFAULT '',
  orden INTEGER NOT NULL DEFAULT 1,
  -- Si se borra al invitado, su opción vuelve a quedar libre.
  reservado_por INTEGER REFERENCES invitados (id) ON DELETE SET NULL,
  reservado_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_regalo_opciones_invitacion ON regalo_opciones (invitacion_id, orden);

-- Una opción por invitado: el servidor lo cuida, y esto lo garantiza aunque
-- lleguen dos peticiones a la vez.
CREATE UNIQUE INDEX IF NOT EXISTS uq_regalo_opciones_reservado
  ON regalo_opciones (reservado_por) WHERE reservado_por IS NOT NULL;
