-- Cada invitación elige con qué diseño se dibuja el sitio. "clasico" es el de
-- siempre (el de la boda de Maite y Ricardo); los demás son diseños propios
-- que leen las mismas secciones del panel pero las presentan distinto.
ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS diseno TEXT NOT NULL DEFAULT 'clasico';
