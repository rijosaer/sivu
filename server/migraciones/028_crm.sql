-- ------------------------------------------------------------------
-- Clientes potenciales, WhatsApp ordenado, cotizaciones, datos del
-- evento y producción
-- ------------------------------------------------------------------
-- Todo lo que el dueño de Sivú necesita para atender volumen sin perder a
-- nadie: cada persona que pide una invitación (por el anuncio, por WhatsApp
-- directo, por Instagram o referida) queda como «prospecto» con su estado,
-- su prioridad, sus notas y su conversación; cuando firma se convierte en
-- evento y se sigue en producción hasta el día del evento.
--
--   ajustes             → configuración editable desde el panel (clave/JSON):
--                         saludo automático, horario, números de aviso,
--                         reporte diario, respuestas rápidas, planes y datos
--                         de pago.
--   prospectos          → los clientes potenciales.
--   prospecto_historial → línea de tiempo de cada uno (cambios de estado,
--                         notas, cotizaciones...).
--   mensajes_whatsapp   → lo que entra y sale por el WhatsApp vinculado,
--                         amarrado al prospecto o al evento/invitado que toca.
--   wa_etiquetas        → las etiquetas de WhatsApp Business que crea Sivú.
--   wa_ignorados        → números que no son clientes (amigos, proveedores):
--                         no se vuelven prospectos al escribir.
--   cotizaciones        → cotizaciones con enlace público.
--   pagos               → abonos de cada evento.
--   datos_archivos      → fotos, música y listas que el cliente sube en el
--                         formulario de datos del evento.
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ajustes (
  clave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prospectos (
  id SERIAL PRIMARY KEY,
  origen TEXT NOT NULL DEFAULT 'otro'
    CHECK (origen IN ('anuncio', 'whatsapp', 'instagram', 'referido', 'otro')),
  nombre TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  evento TEXT NOT NULL DEFAULT '',       -- boda, xv, bautizo, baby, cumple, grado, empresa, otro
  cuando TEXT NOT NULL DEFAULT '',       -- mes, 1a3, 3a6, mas6 (o vacío)
  invitados TEXT NOT NULL DEFAULT '',    -- menos50, 50a100, 100a200, mas200 (o vacío)
  ciudad TEXT NOT NULL DEFAULT '',
  fecha_evento DATE,
  estado TEXT NOT NULL DEFAULT 'nuevo'
    CHECK (estado IN ('nuevo', 'contactado', 'cotizado', 'ganado', 'perdido', 'frio')),
  motivo_perdida TEXT NOT NULL DEFAULT '',
  notas TEXT NOT NULL DEFAULT '',
  valor_cotizado BIGINT,
  valor_ganado BIGINT,
  proximo_seguimiento DATE,
  invitacion_id INTEGER REFERENCES invitaciones(id) ON DELETE SET NULL,
  saludado_en TIMESTAMPTZ,
  contactado_en TIMESTAMPTZ,
  cotizado_en TIMESTAMPTZ,
  ganado_en TIMESTAMPTZ,
  perdido_en TIMESTAMPTZ,
  ultimo_entrante TIMESTAMPTZ,           -- último mensaje que nos escribió
  ultimo_saliente TIMESTAMPTZ,           -- último mensaje que le escribimos
  sin_leer INTEGER NOT NULL DEFAULT 0,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un número es un solo prospecto: si vuelve a escribir o llena el formulario
-- otra vez, se une a la misma ficha.
CREATE UNIQUE INDEX IF NOT EXISTS prospectos_telefono ON prospectos (telefono) WHERE telefono <> '';
CREATE INDEX IF NOT EXISTS prospectos_estado ON prospectos (estado, creado_en DESC);

CREATE TABLE IF NOT EXISTS prospecto_historial (
  id SERIAL PRIMARY KEY,
  prospecto_id INTEGER NOT NULL REFERENCES prospectos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  detalle TEXT NOT NULL DEFAULT '',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prospecto_historial_p ON prospecto_historial (prospecto_id, creado_en DESC);

ALTER TABLE leads_meta ADD COLUMN IF NOT EXISTS prospecto_id INTEGER REFERENCES prospectos(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS mensajes_whatsapp (
  id SERIAL PRIMARY KEY,
  wa_id TEXT,                            -- id del mensaje en WhatsApp (evita duplicados)
  telefono TEXT NOT NULL,
  direccion TEXT NOT NULL CHECK (direccion IN ('entrante', 'saliente')),
  texto TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'texto',    -- texto, imagen, audio, video, documento, sticker, otro
  nombre_contacto TEXT NOT NULL DEFAULT '',
  prospecto_id INTEGER REFERENCES prospectos(id) ON DELETE SET NULL,
  invitacion_id INTEGER REFERENCES invitaciones(id) ON DELETE SET NULL,
  invitado_id INTEGER REFERENCES invitados(id) ON DELETE SET NULL,
  leido BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS mensajes_whatsapp_wa_id ON mensajes_whatsapp (wa_id) WHERE wa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS mensajes_whatsapp_tel ON mensajes_whatsapp (telefono, creado_en DESC);
CREATE INDEX IF NOT EXISTS mensajes_whatsapp_inv ON mensajes_whatsapp (invitacion_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS mensajes_whatsapp_pros ON mensajes_whatsapp (prospecto_id, creado_en DESC);

CREATE TABLE IF NOT EXISTS wa_etiquetas (
  nombre TEXT PRIMARY KEY,
  label_id TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wa_ignorados (
  telefono TEXT PRIMARY KEY,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cotizaciones (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  prospecto_id INTEGER REFERENCES prospectos(id) ON DELETE CASCADE,
  cliente TEXT NOT NULL DEFAULT '',
  evento TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',     -- [{ descripcion, detalle, cantidad, valor }]
  descuento BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0,
  notas TEXT NOT NULL DEFAULT '',
  vigencia DATE,
  estado TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador', 'enviada', 'vista', 'aceptada', 'vencida')),
  vistas INTEGER NOT NULL DEFAULT 0,
  vista_en TIMESTAMPTZ,
  aceptada_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cotizaciones_prospecto ON cotizaciones (prospecto_id);

-- Producción: en qué va cada evento y cuánto se ha cobrado.
ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS etapa TEXT NOT NULL DEFAULT 'datos'
  CHECK (etapa IN ('datos', 'diseno', 'revision', 'aprobado', 'enviando', 'realizado'));
ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS valor_total BIGINT;
ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS cliente_nombre TEXT NOT NULL DEFAULT '';
ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS cliente_telefono TEXT NOT NULL DEFAULT '';
ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS notas_produccion TEXT NOT NULL DEFAULT '';
-- Formulario de datos que llena el cliente (enlace público con token).
ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS datos_token TEXT UNIQUE;
ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS datos_cliente JSONB;
ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS datos_recibidos_en TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS pagos (
  id SERIAL PRIMARY KEY,
  invitacion_id INTEGER NOT NULL REFERENCES invitaciones(id) ON DELETE CASCADE,
  valor BIGINT NOT NULL CHECK (valor > 0),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  nota TEXT NOT NULL DEFAULT '',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pagos_invitacion ON pagos (invitacion_id);

CREATE TABLE IF NOT EXISTS datos_archivos (
  id SERIAL PRIMARY KEY,
  invitacion_id INTEGER NOT NULL REFERENCES invitaciones(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('foto', 'audio', 'lista', 'otro')),
  nombre TEXT NOT NULL DEFAULT '',
  mime TEXT NOT NULL,
  datos BYTEA NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT false, -- ya se pasó a la invitación
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS datos_archivos_inv ON datos_archivos (invitacion_id);

-- Los eventos que ya existían arrancan en la etapa que de verdad llevan:
-- si ya pasó la fecha, realizado; si ya se enviaron invitaciones, enviando.
UPDATE invitaciones SET etapa = 'realizado'
  WHERE NOT es_plantilla AND fecha_evento IS NOT NULL AND fecha_evento < CURRENT_DATE;
UPDATE invitaciones i SET etapa = 'enviando'
  WHERE etapa = 'datos' AND NOT es_plantilla
    AND EXISTS (SELECT 1 FROM invitados v WHERE v.invitacion_id = i.id AND v.enviado_en IS NOT NULL);
