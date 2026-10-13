-- ------------------------------------------------------------------
-- Pagos que reporta el cliente desde su cotización («Ya pagué»)
-- ------------------------------------------------------------------
-- El cliente paga (por ejemplo con el QR de Nequi), toca «Ya pagué» y sube
-- la captura del comprobante. Queda aquí «por confirmar»: el dueño revisa
-- en su Nequi que la plata llegó y con un toque lo confirma (se registra el
-- pago, el cliente pasa a ganado y se crea su evento) o lo rechaza.
CREATE TABLE IF NOT EXISTS pagos_reportados (
  id SERIAL PRIMARY KEY,
  cotizacion_id INTEGER NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  prospecto_id INTEGER REFERENCES prospectos(id) ON DELETE SET NULL,
  metodo TEXT NOT NULL DEFAULT '',
  valor BIGINT NOT NULL DEFAULT 0,
  comprobante BYTEA,
  comprobante_mime TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'rechazado')),
  pago_id INTEGER REFERENCES pagos(id) ON DELETE SET NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  resuelto_en TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS pagos_reportados_estado ON pagos_reportados (estado, creado_en DESC);
