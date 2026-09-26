-- ------------------------------------------------------------------
-- La tarjeta de los servidores pasa a ser personal, una por persona
-- ------------------------------------------------------------------
-- La 017 la dejó como una tarjeta común: un enlace con los seis nombres en
-- una lista. Se veía sencilla y, sobre todo, impersonal — cada quien leía su
-- nombre en una lista de seis, no un agradecimiento suyo.
--
-- Ahora cada persona tiene su propio enlace (?servidores=su-nombre) y su
-- propia tarjeta: su nombre en grande, la función con la que sirve ese día y
-- un mensaje escrito para ella. El enlace común (?servidores=1) se queda como
-- respaldo y muestra a los seis.
--
--   "texto"   es la plantilla que reciben todos; {nombre} y {funcion} se
--             reemplazan por los de cada quien.
--   "mensaje" de una persona, si está escrito, reemplaza esa plantilla entera:
--             es el hueco para decirle algo que solo aplica a ella.
--
-- Las funciones entran con un valor de arranque igual para los seis
-- ("parte del ministerio de alabanza"): sirve para todos y encaja en la frase
-- «que como {funcion}...». Cada una se afina desde el panel.

UPDATE secciones
SET contenido = jsonb_build_object(
  'titulo', COALESCE(contenido -> 'titulo', to_jsonb('Gracias por ser parte'::text)),
  'texto', to_jsonb(
    'Gracias por formar parte de uno de los momentos más importantes de nuestras vidas. Que como {funcion}, y de la mano de Dios, tu servicio llene de bendición este día.'::text
  ),
  'versiculo', to_jsonb('«Todo lo que respira alabe al Señor.» — Salmo 150:6'::text),
  'cierre', to_jsonb('Con todo nuestro cariño,'::text),
  -- Solo para el enlace común, encima de la lista de los seis.
  'subtitulo', COALESCE(contenido -> 'subtitulo', to_jsonb('Quienes nos acompañan'::text)),
  'personas', COALESCE(
    (
      -- WITH ORDINALITY + ORDER BY: sin eso el orden de los seis dependería
      -- de cómo agregue el motor, y la lista es la que ellos escribieron.
      SELECT jsonb_agg(
               jsonb_build_object(
                 'nombre', n.valor,
                 'funcion', 'parte del ministerio de alabanza',
                 'mensaje', ''
               )
               ORDER BY n.pos
             )
      FROM jsonb_array_elements_text(contenido -> 'nombres') WITH ORDINALITY AS n(valor, pos)
    ),
    contenido -> 'personas',
    '[]'::jsonb
  )
)
WHERE tipo = 'servidores';
