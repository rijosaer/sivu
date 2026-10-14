-- ------------------------------------------------------------------
-- Catálogo de diseños de invitación (panel → Diseños)
-- ------------------------------------------------------------------
-- Cada diseño programado (clasico, jardin, valle...) tiene aquí su nombre
-- comercial y si se muestra en la landing. Las variantes son filas nuevas que
-- reutilizan el dibujo de un diseño base («base») con otros colores y letras
-- («tema»: solo las claves que cambian). Así se crean diseños nuevos sin
-- programar: cambia la paleta, no la estructura.
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS disenos (
  id TEXT PRIMARY KEY,                       -- igual a «base» en los programados
  base TEXT NOT NULL,                        -- diseño programado que dibuja
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  tema JSONB NOT NULL DEFAULT '{}',          -- { "color-paper": "#...", "fuente-titulos": "..." }
  en_landing BOOLEAN NOT NULL DEFAULT false,
  orden INTEGER NOT NULL DEFAULT 100,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Qué variante eligió cada evento (su «diseno» sigue siendo el base, que es
-- lo que el sitio sabe dibujar).
ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS diseno_variante TEXT;

INSERT INTO disenos (id, base, nombre, descripcion, en_landing, orden) VALUES
  ('clasico', 'clasico', 'Clásico', 'Papel y dorado', true, 1),
  ('jardin', 'jardin', 'Jardín encantado', 'Acuarela verde', true, 2),
  ('ensueno', 'ensueno', 'Ensueño', 'Acuarela menta y durazno', true, 3),
  ('gala', 'gala', 'Gala', 'Negro y lima neón', true, 4),
  ('lazos', 'lazos', 'Moños y perlas', 'Rosa palo, satén y perlas', false, 5),
  ('coquette', 'coquette', 'Coquette', 'Rosa con moños ilustrados', false, 6),
  ('paris', 'paris', 'París rosé', 'Rosa empolvado y oro rosa', false, 7),
  ('valle', 'valle', 'Valle de luna', 'Acuarela azul noche · boda', false, 8),
  ('valle-claro', 'valle-claro', 'Valle claro', 'Acuarela azul cielo · boda', false, 9),
  ('celebracion', 'celebracion', 'Celebración dorada', 'Crema y oro · cumpleaños de varias personas', false, 10),
  ('celebracion-azul', 'celebracion-azul', 'Celebración azul', 'Crema y azul loza · cumpleaños de varias personas', false, 11)
ON CONFLICT (id) DO NOTHING;
