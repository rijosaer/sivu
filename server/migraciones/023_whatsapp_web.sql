-- ------------------------------------------------------------------
-- Sesión de WhatsApp Web (dispositivo vinculado)
-- ------------------------------------------------------------------
-- Mientras no esté la cuenta oficial de WhatsApp Business, los avisos salen
-- de un número de Sivú vinculado como si fuera WhatsApp Web (se escanea un QR
-- desde el panel). Las llaves de esa sesión se guardan aquí y no en archivos:
-- el disco de Railway se borra en cada despliegue y habría que volver a
-- escanear cada vez.
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS whatsapp_sesion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
