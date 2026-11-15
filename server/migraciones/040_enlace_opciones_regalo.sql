-- Cada opción de la lista de regalos puede llevar dónde comprarla (opcional).
ALTER TABLE regalo_opciones ADD COLUMN IF NOT EXISTS url TEXT NOT NULL DEFAULT '';
