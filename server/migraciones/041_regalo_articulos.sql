-- Un regalo puede ser varias cosas, cada una con su cantidad y su enlace:
-- p. ej. «6 toallas de cuerpo» (tienda 1) + «6 toallas de cara» (tienda 2).
-- Sirve en el regalo específico de un invitado y en cada opción de la lista.
-- Formato: [{ "cantidad": 6, "nombre": "Toallas de cuerpo", "url": "https://..." }]
ALTER TABLE regalo_opciones ADD COLUMN IF NOT EXISTS articulos JSONB NOT NULL DEFAULT '[]';
ALTER TABLE invitados ADD COLUMN IF NOT EXISTS regalo_articulos JSONB NOT NULL DEFAULT '[]';
