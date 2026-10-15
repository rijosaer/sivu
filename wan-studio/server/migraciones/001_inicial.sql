CREATE TABLE usuarios (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  hash        TEXT NOT NULL,
  creditos    INTEGER NOT NULL DEFAULT 0 CHECK (creditos >= 0),
  es_admin    BOOLEAN NOT NULL DEFAULT false,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Llaves de la API pública. Solo se guarda el hash (sha256): la llave
-- completa se muestra una única vez al crearla.
CREATE TABLE api_llaves (
  id           SERIAL PRIMARY KEY,
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  prefijo      TEXT NOT NULL,
  hash         TEXT NOT NULL UNIQUE,
  creada_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_uso   TIMESTAMPTZ,
  revocada_en  TIMESTAMPTZ
);

CREATE TABLE generaciones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  preset         TEXT NOT NULL,
  modo           TEXT NOT NULL CHECK (modo IN ('i2v', 't2v')),
  prompt         TEXT NOT NULL DEFAULT '',
  prompt_final   TEXT NOT NULL,
  negativo       TEXT NOT NULL DEFAULT '',
  parametros     JSONB NOT NULL,
  imagen         TEXT,
  estado         TEXT NOT NULL DEFAULT 'en_cola'
                 CHECK (estado IN ('en_cola', 'procesando', 'completada', 'fallida', 'cancelada')),
  motor          TEXT,
  motor_estado   JSONB,
  progreso       REAL,
  video          TEXT,
  error          TEXT,
  costo          INTEGER NOT NULL,
  webhook_url    TEXT,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  iniciado_en    TIMESTAMPTZ,
  terminado_en   TIMESTAMPTZ
);

CREATE INDEX generaciones_usuario ON generaciones (usuario_id, creado_en DESC);
CREATE INDEX generaciones_pendientes ON generaciones (creado_en)
  WHERE estado IN ('en_cola', 'procesando');
