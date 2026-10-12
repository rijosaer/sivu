-- ------------------------------------------------------------------
-- Envío automático de invitaciones por el WhatsApp vinculado
-- ------------------------------------------------------------------
-- Con un botón, el servidor manda las invitaciones (o los recordatorios) de
-- un evento una por una desde el número de Sivú, con pausas al azar para no
-- parecer un bot. La cola vive en la base: si el servidor se reinicia a mitad
-- de camino, sigue donde iba.
--
--   envios_masivos        → un envío por evento (estado, cuándo sale el
--                           próximo, cuántos van en la tanda actual).
--   envios_masivos_items  → un mensaje por invitación, con el texto ya armado.
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS envios_masivos (
  id SERIAL PRIMARY KEY,
  invitacion_id INTEGER NOT NULL REFERENCES invitaciones(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'invitacion' CHECK (tipo IN ('invitacion', 'recordatorio')),
  estado TEXT NOT NULL DEFAULT 'en_curso'
    CHECK (estado IN ('en_curso', 'pausado', 'terminado', 'cancelado', 'detenido')),
  detalle TEXT NOT NULL DEFAULT '',
  en_tanda INTEGER NOT NULL DEFAULT 0,
  fallos_seguidos INTEGER NOT NULL DEFAULT 0,
  siguiente_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS envios_masivos_items (
  id SERIAL PRIMARY KEY,
  envio_id INTEGER NOT NULL REFERENCES envios_masivos(id) ON DELETE CASCADE,
  invitado_id INTEGER REFERENCES invitados(id) ON DELETE SET NULL,
  orden INTEGER NOT NULL,
  nombre TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL,
  texto TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'enviando', 'enviado', 'fallido', 'omitido')),
  detalle TEXT NOT NULL DEFAULT '',
  enviado_en TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS envios_masivos_items_envio ON envios_masivos_items (envio_id, orden);
