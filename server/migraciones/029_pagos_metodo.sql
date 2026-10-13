-- ------------------------------------------------------------------
-- Con qué se pagó cada abono (Nequi, Bancolombia, efectivo...)
-- ------------------------------------------------------------------
-- Los métodos de pago se configuran en el panel (ajuste «pagos»); aquí
-- queda guardado el nombre del que se usó en cada pago registrado.
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS metodo TEXT NOT NULL DEFAULT '';

-- Cuándo el cliente tocó «Ya pagué» en su cotización.
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS pago_reportado_en TIMESTAMPTZ;
