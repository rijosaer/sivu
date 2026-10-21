-- Cuentos ilustrados (pintura digital por capas, entrada animada): bautizo,
-- primera comunión, confirmación y cumpleaños infantil. Entran al catálogo ya
-- publicados en la landing (se pueden ocultar desde panel → Diseños).
INSERT INTO disenos (id, base, nombre, descripcion, en_landing, orden) VALUES
  ('cielito', 'cielito', 'Cielito', 'Bautizo · cuento ilustrado entre nubes', true, 21),
  ('capillita', 'capillita', 'Capillita', 'Primera comunión · pueblo, buganvilias y capilla', true, 22),
  ('cometas', 'cometas', 'Cometas', 'Confirmación · loma al atardecer con cometas', true, 23),
  ('bosquecito', 'bosquecito', 'Bosquecito', 'Cumpleaños infantil · picnic con animalitos', true, 24)
ON CONFLICT (id) DO NOTHING;
