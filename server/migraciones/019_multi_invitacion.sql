-- ------------------------------------------------------------------
-- Multi-invitación
-- ------------------------------------------------------------------
-- Hasta aquí el sistema alojaba UNA sola boda: una fila de "tema", un set
-- de "secciones", un set de "decoraciones" e "invitados", todo global.
--
-- Esta migración convierte el sistema en multi-invitación: crea la tabla
-- "invitaciones" (un evento = una fila, con su slug, su tipo y su fecha) y
-- le agrega invitacion_id a todo lo que antes era global, para que el
-- panel pueda operar muchos eventos independientes desde una sola base.
--
-- Lo más importante: TODO lo que ya existe en la base (la boda real de
-- Maite y Ricardo: su tema, sus secciones, sus decoraciones, sus
-- invitados) se conserva byte a byte y pasa a ser la PRIMERA invitación
-- del sistema — además queda marcada como "es_plantilla" para el tipo
-- "boda", así que sirve de punto de partida al crear una boda nueva desde
-- el panel sin tener que escribir cada sección desde cero.
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS invitaciones (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,               -- nombre interno para el panel, ej. "Maite & Ricardo"
  tipo_evento TEXT NOT NULL DEFAULT 'boda',
    -- boda | xv | baby_shower | cumpleanos | bautizo | corporativo | otro
  fecha_evento DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  -- Sirve de plantilla al crear una invitación nueva del mismo tipo_evento:
  -- se clonan su tema y sus secciones (nunca sus medios ni sus invitados).
  es_plantilla BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitaciones_tipo ON invitaciones (tipo_evento);
CREATE INDEX IF NOT EXISTS idx_invitaciones_activo ON invitaciones (activo);

-- ------------------------------------------------------------------
-- 1) La invitación existente pasa a ser la primera fila de "invitaciones"
-- ------------------------------------------------------------------
-- El nombre y la fecha se leen de lo que ya haya en "secciones" (welcome e
-- informacion_boda) en vez de escribirlos a mano: así funciona igual de
-- bien contra la base real (Maite & Ricardo) que contra una base recién
-- creada con schema.sql (que trae su propio contenido de demostración).
INSERT INTO invitaciones (slug, nombre, tipo_evento, fecha_evento, activo, es_plantilla)
SELECT
  'maite-y-ricardo',
  COALESCE(
    NULLIF(
      trim(
        both ' & ' FROM
        COALESCE((SELECT contenido ->> 'novioEl' FROM secciones WHERE tipo = 'welcome' ORDER BY id LIMIT 1), '')
        || ' & ' ||
        COALESCE((SELECT contenido ->> 'novioElla' FROM secciones WHERE tipo = 'welcome' ORDER BY id LIMIT 1), '')
      ),
      ''
    ),
    'Maite & Ricardo'
  ),
  'boda',
  (
    SELECT (contenido ->> 'fecha')::timestamptz::date
    FROM secciones WHERE tipo = 'informacion_boda' ORDER BY id LIMIT 1
  ),
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM invitaciones WHERE slug = 'maite-y-ricardo');

-- Id de esa primera invitación, reutilizado en todos los backfills de abajo.
-- (subconsulta repetida a propósito: mantiene el archivo como SQL plano,
-- igual que el resto de las migraciones, sin bloques PL/pgSQL con variables)

-- ------------------------------------------------------------------
-- 2) tema: la clave era la llave primaria global; pasa a ser única POR
--    invitación.
-- ------------------------------------------------------------------
ALTER TABLE tema ADD COLUMN IF NOT EXISTS invitacion_id INTEGER REFERENCES invitaciones (id) ON DELETE CASCADE;
UPDATE tema SET invitacion_id = (SELECT id FROM invitaciones WHERE slug = 'maite-y-ricardo')
WHERE invitacion_id IS NULL;
ALTER TABLE tema ALTER COLUMN invitacion_id SET NOT NULL;
ALTER TABLE tema DROP CONSTRAINT IF EXISTS tema_pkey;
ALTER TABLE tema ADD PRIMARY KEY (invitacion_id, clave);

-- ------------------------------------------------------------------
-- 3) secciones: una invitación entera de secciones por evento.
-- ------------------------------------------------------------------
ALTER TABLE secciones ADD COLUMN IF NOT EXISTS invitacion_id INTEGER REFERENCES invitaciones (id) ON DELETE CASCADE;
UPDATE secciones SET invitacion_id = (SELECT id FROM invitaciones WHERE slug = 'maite-y-ricardo')
WHERE invitacion_id IS NULL;
ALTER TABLE secciones ALTER COLUMN invitacion_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_secciones_invitacion ON secciones (invitacion_id, orden);

-- ------------------------------------------------------------------
-- 4) decoraciones: la clave también era llave primaria global; pasa a ser
--    única POR invitación. decoracion_ubicaciones pasa a referenciar el
--    par (invitacion_id, clave) para no mezclar decoraciones entre eventos.
-- ------------------------------------------------------------------
ALTER TABLE decoraciones ADD COLUMN IF NOT EXISTS invitacion_id INTEGER REFERENCES invitaciones (id) ON DELETE CASCADE;
UPDATE decoraciones SET invitacion_id = (SELECT id FROM invitaciones WHERE slug = 'maite-y-ricardo')
WHERE invitacion_id IS NULL;
ALTER TABLE decoraciones ALTER COLUMN invitacion_id SET NOT NULL;

ALTER TABLE decoracion_ubicaciones ADD COLUMN IF NOT EXISTS invitacion_id INTEGER REFERENCES invitaciones (id) ON DELETE CASCADE;
UPDATE decoracion_ubicaciones SET invitacion_id = (SELECT id FROM invitaciones WHERE slug = 'maite-y-ricardo')
WHERE invitacion_id IS NULL;
ALTER TABLE decoracion_ubicaciones ALTER COLUMN invitacion_id SET NOT NULL;

ALTER TABLE decoracion_ubicaciones DROP CONSTRAINT IF EXISTS decoracion_ubicaciones_clave_fkey;
ALTER TABLE decoraciones DROP CONSTRAINT IF EXISTS decoraciones_pkey;
ALTER TABLE decoraciones ADD PRIMARY KEY (invitacion_id, clave);
ALTER TABLE decoracion_ubicaciones
  ADD CONSTRAINT decoracion_ubicaciones_clave_fkey
  FOREIGN KEY (invitacion_id, clave) REFERENCES decoraciones (invitacion_id, clave) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ubicaciones_invitacion ON decoracion_ubicaciones (invitacion_id, seccion_tipo);

-- ------------------------------------------------------------------
-- 5) medios: fotos, audio y fondo, por invitación.
-- ------------------------------------------------------------------
ALTER TABLE medios ADD COLUMN IF NOT EXISTS invitacion_id INTEGER REFERENCES invitaciones (id) ON DELETE CASCADE;
UPDATE medios SET invitacion_id = (SELECT id FROM invitaciones WHERE slug = 'maite-y-ricardo')
WHERE invitacion_id IS NULL;
ALTER TABLE medios ALTER COLUMN invitacion_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medios_invitacion ON medios (invitacion_id, tipo, orden);

-- ------------------------------------------------------------------
-- 6) invitados: el código de invitado pasa de único-global a único POR
--    invitación (dos eventos distintos ya pueden repetir un código).
-- ------------------------------------------------------------------
ALTER TABLE invitados ADD COLUMN IF NOT EXISTS invitacion_id INTEGER REFERENCES invitaciones (id) ON DELETE CASCADE;
UPDATE invitados SET invitacion_id = (SELECT id FROM invitaciones WHERE slug = 'maite-y-ricardo')
WHERE invitacion_id IS NULL;
ALTER TABLE invitados ALTER COLUMN invitacion_id SET NOT NULL;

ALTER TABLE invitados DROP CONSTRAINT IF EXISTS invitados_codigo_key;
ALTER TABLE invitados ADD CONSTRAINT invitados_invitacion_codigo_key UNIQUE (invitacion_id, codigo);
CREATE INDEX IF NOT EXISTS idx_invitados_invitacion ON invitados (invitacion_id);
