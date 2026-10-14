-- Nueve diseños nuevos (de las tarjetas de la publicidad de Sivú). Entran al
-- catálogo sin publicar: se muestran en la landing desde panel → Diseños.
INSERT INTO disenos (id, base, nombre, descripcion, en_landing, orden) VALUES
  ('eucalipto', 'eucalipto', 'Eucalipto', 'Boda · rosas blancas y eucalipto', false, 12),
  ('luces', 'luces', 'Luces de verano', 'Boda · luces colgantes y ámbar', false, 13),
  ('vals', 'vals', 'Vals rosa', 'XV · telón y rosas rosa palo', false, 14),
  ('luz', 'luz', 'Luz de bautizo', 'Bautizo · vela, olivo y oro', false, 15),
  ('confeti', 'confeti', 'Confeti', 'Cumpleaños · globos durazno y oro', false, 16),
  ('dulce', 'dulce', 'Dulce 30', 'Cumpleaños · pastel, macarons y rosa', false, 17),
  ('birrete', 'birrete', 'Birrete', 'Graduación · marfil, tinta y oro', false, 18),
  ('medianoche', 'medianoche', 'Medianoche', 'Corporativo · cena de fin de año negro y oro', false, 19),
  ('osito', 'osito', 'Osito', 'Baby shower · osito, nubes y salvia', false, 20)
ON CONFLICT (id) DO NOTHING;
