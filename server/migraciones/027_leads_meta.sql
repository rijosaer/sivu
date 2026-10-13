-- ------------------------------------------------------------------
-- Clientes potenciales de los anuncios de Meta (Facebook / Instagram)
-- ------------------------------------------------------------------
-- Los formularios de cotización de los anuncios de Sivú se revisan cada
-- pocos minutos (leadsMeta.js). Cada contacto nuevo se saluda desde el
-- WhatsApp de Sivú y se avisa a los números del equipo, para que toda la
-- conversación siga allá. Esta tabla evita escribirle dos veces a nadie.
--
--   saludado_en / avisado_en → cuándo salió cada mensaje; NULL = pendiente
--                              (por ejemplo, si el WhatsApp estaba
--                              desvinculado: se reintenta después).
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS leads_meta (
  id TEXT PRIMARY KEY,
  formulario TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL,
  nombre TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  datos JSONB NOT NULL DEFAULT '{}',
  saludado_en TIMESTAMPTZ,
  avisado_en TIMESTAMPTZ,
  intentos SMALLINT NOT NULL DEFAULT 0,
  detalle TEXT NOT NULL DEFAULT '',
  recibido_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_meta_creado ON leads_meta (creado_en DESC);
