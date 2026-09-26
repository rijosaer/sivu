-- El código de vestimenta pasa a ser "toda la gama pastel". Una entrada de
-- color ahora puede ser una gama entera ({nombre, colores: [...]}) en vez de
-- un color suelto ({nombre, color}), porque pintar veinte círculos para decir
-- "pasteles" queda abarrotado y no comunica que es un rango.
--
-- El título se cambia junto con los colores: decía "tonos beige y marrones",
-- que contradice de plano lo que muestran las muestras de color.
UPDATE secciones
SET contenido = contenido
  || jsonb_build_object(
       'titulo', 'Formal — toda la gama pastel',
       'permitidos', jsonb_build_array(
         jsonb_build_object(
           'nombre', 'Toda la gama pastel',
           'colores', jsonb_build_array(
             '#F6D8DE', '#F8DFC8', '#FAF0C8', '#DDEBD0',
             '#C8E6E4', '#CFE1F2', '#DCD4EC', '#EED7E9'
           )
         )
       )
     )
WHERE tipo = 'vestimenta';
