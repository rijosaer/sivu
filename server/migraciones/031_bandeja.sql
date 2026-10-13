-- ------------------------------------------------------------------
-- Bandeja de WhatsApp en el panel: las fotos, audios, videos y documentos
-- que llegan (o se mandan) por el WhatsApp de Sivú se guardan aparte de los
-- mensajes, para que la lista de chats siga siendo liviana. Solo se guardan
-- los de clientes potenciales e invitados, igual que los mensajes.
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mensajes_media (
  mensaje_id INTEGER PRIMARY KEY REFERENCES mensajes_whatsapp(id) ON DELETE CASCADE,
  mime TEXT NOT NULL DEFAULT '',
  nombre TEXT NOT NULL DEFAULT '',
  segundos INTEGER,
  bytes INTEGER NOT NULL DEFAULT 0,
  datos BYTEA,
  error TEXT NOT NULL DEFAULT '',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
