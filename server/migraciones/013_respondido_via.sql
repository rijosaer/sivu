-- De dónde salió la respuesta: 'invitado' (respondió desde su invitación) o
-- 'panel' (se marcó a mano desde el panel). Marcar a mano también sella
-- respondido_en para que esa persona suba al principio de la lista, pero no
-- debe sonar el aviso: quien lo marcó fue el propio panel.
ALTER TABLE invitado_miembros
  ADD COLUMN IF NOT EXISTS respondido_via TEXT NOT NULL DEFAULT 'invitado';
