-- ------------------------------------------------------------------
-- Tarjeta de los servidores (adoradores)
-- ------------------------------------------------------------------
-- Una tercera página pública, hermana de la participación (?anuncio=1): un
-- solo enlace, ?servidores=1, para quienes acompañan el evento sirviendo.
-- No es una invitación: no lleva código, no cuenta asistencia y no pide
-- confirmar. Es un agradecimiento con los nombres de quienes están ese día.
--
-- Va como sección para que los novios puedan editar el texto y la lista de
-- nombres desde el panel sin tocar código. No se dibuja dentro de la
-- invitación: "servidores" no está en el REGISTRO de SectionRenderer, así que
-- el cuerpo la ignora y solo la lee la página del enlace.
--
-- Apagarla desde el panel ("Oculta") deja la página sin contenido: el sitio
-- solo recibe las secciones activas. Es la forma de retirar la tarjeta.

INSERT INTO secciones (tipo, titulo_panel, orden, activo, contenido)
SELECT
  'servidores',
  'Tarjeta de los servidores (enlace aparte)',
  COALESCE((SELECT max(orden) FROM secciones), 0) + 1,
  true,
  '{
    "titulo": "Gracias por acompañarnos",
    "texto": "Gracias a cada adorador por ser parte de uno de los momentos más hermosos de nuestra vida. Que su música acompañe cada instante de nuestra boda civil.",
    "subtitulo": "Quienes nos acompañan",
    "nombres": [
      "María José Fragozo",
      "Ximena Posada",
      "Margarita Peinado",
      "Omar Adrián Luján",
      "Emiliano Ditta",
      "Iván Gámez"
    ],
    "cierre": "Con todo nuestro cariño."
  }'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM secciones WHERE tipo = 'servidores');
