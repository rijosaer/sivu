-- ------------------------------------------------------------------
-- 1) Invitaciones individuales, de pareja y familiares
-- ------------------------------------------------------------------
-- Una fila de "invitados" pasa a ser LA INVITACIÓN (un código, un enlace).
-- Las personas que cubre viven en "invitado_miembros", y cada una confirma
-- por separado. Una invitación individual simplemente tiene un miembro.

ALTER TABLE invitados ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'individual';

CREATE TABLE IF NOT EXISTS invitado_miembros (
  id SERIAL PRIMARY KEY,
  invitado_id INTEGER NOT NULL REFERENCES invitados(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 1,
  estado TEXT NOT NULL DEFAULT 'pendiente', -- pendiente | confirmado | no_asistira
  restriccion TEXT NOT NULL DEFAULT '',
  comentario TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_miembros_invitado ON invitado_miembros (invitado_id);

-- Cada invitado que ya existía se convierte en una invitación individual
-- con una sola persona, conservando lo que hubiera respondido.
INSERT INTO invitado_miembros (invitado_id, nombre, orden, estado, restriccion, comentario)
SELECT i.id, i.nombre, 1, i.estado, COALESCE(i.restriccion, ''), COALESCE(i.comentario, '')
FROM invitados i
WHERE NOT EXISTS (SELECT 1 FROM invitado_miembros m WHERE m.invitado_id = i.id);

-- ------------------------------------------------------------------
-- 2) Medios: fotos de la galería y audio de fondo
-- ------------------------------------------------------------------
-- Se guardan como bytes, no como base64 dentro del JSON del sitio: así el
-- invitado no descarga varios MB antes de ver nada. Cada archivo se sirve
-- por su propia URL y el navegador lo pide solo cuando hace falta.

CREATE TABLE IF NOT EXISTS medios (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,               -- foto | audio
  mime TEXT NOT NULL,
  nombre TEXT NOT NULL DEFAULT '',
  datos BYTEA NOT NULL,
  orden INTEGER NOT NULL DEFAULT 1,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medios_tipo ON medios (tipo, orden);

-- ------------------------------------------------------------------
-- 3) Decoraciones: se pueden agregar nuevas y colocarlas donde sea
-- ------------------------------------------------------------------

ALTER TABLE decoraciones ADD COLUMN IF NOT EXISTS personalizada BOOLEAN NOT NULL DEFAULT false;

-- Sirve para invalidar la caché del navegador cuando se reemplaza la imagen:
-- las decoraciones ya no viajan en base64 dentro del JSON del sitio, sino por
-- su propia URL, y sin esto el navegador seguiría mostrando la anterior.
ALTER TABLE decoraciones ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now();

-- Dónde va cada decoración. Las coordenadas son porcentajes respecto a la
-- sección que la contiene, para que la posición aguante cualquier ancho de
-- pantalla. "capa" decide si queda detrás o delante del texto.
CREATE TABLE IF NOT EXISTS decoracion_ubicaciones (
  id SERIAL PRIMARY KEY,
  clave TEXT NOT NULL REFERENCES decoraciones (clave) ON DELETE CASCADE,
  seccion_tipo TEXT NOT NULL,
  x NUMERIC NOT NULL DEFAULT 10,          -- % desde la izquierda
  y NUMERIC NOT NULL DEFAULT 10,          -- % desde arriba
  ancho NUMERIC NOT NULL DEFAULT 30,      -- % del ancho de la sección
  rotacion NUMERIC NOT NULL DEFAULT 0,    -- grados
  opacidad NUMERIC NOT NULL DEFAULT 1,    -- 0 a 1
  capa TEXT NOT NULL DEFAULT 'detras'     -- detras | delante
);

CREATE INDEX IF NOT EXISTS idx_ubicaciones_seccion ON decoracion_ubicaciones (seccion_tipo);

-- ------------------------------------------------------------------
-- 4) Código de vestimenta: de texto separado por comas a color + nombre
-- ------------------------------------------------------------------
-- Antes los colores se dibujaban con una tabla fija dentro del código del
-- sitio, así que solo servían seis nombres. Ahora cada color viaja con su
-- valor y el panel deja elegirlo.

CREATE OR REPLACE FUNCTION color_vestimenta_inicial(nombre TEXT) RETURNS TEXT AS $$
  SELECT CASE lower(trim(nombre))
    WHEN 'beige'       THEN '#E1D0B0'
    WHEN 'camel'       THEN '#C9932F'
    WHEN 'marrón'      THEN '#6B4423'
    WHEN 'marron'      THEN '#6B4423'
    WHEN 'verde oliva' THEN '#7A7C57'
    WHEN 'blanco'      THEN '#F7F0E3'
    WHEN 'marfil'      THEN '#EDE2CB'
    ELSE '#CCCCCC'
  END;
$$ LANGUAGE SQL IMMUTABLE;

UPDATE secciones
SET contenido = contenido || jsonb_build_object(
  'permitidos', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('nombre', trim(x), 'color', color_vestimenta_inicial(x)))
    FROM unnest(string_to_array(contenido ->> 'permitidos', ',')) AS x
    WHERE trim(x) <> ''
  ), '[]'::jsonb),
  'evitar', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('nombre', trim(x), 'color', color_vestimenta_inicial(x)))
    FROM unnest(string_to_array(contenido ->> 'evitar', ',')) AS x
    WHERE trim(x) <> ''
  ), '[]'::jsonb)
)
WHERE tipo = 'vestimenta'
  AND jsonb_typeof(contenido -> 'permitidos') = 'string';

DROP FUNCTION color_vestimenta_inicial(TEXT);
