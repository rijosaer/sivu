-- Mapa incrustado en la sección de información, en vez del botón que abría
-- Google Maps. Se guarda la URL del embed que da Google en "Insertar un mapa".
-- El sitio también acepta que se pegue el <iframe> completo: extrae la src.
UPDATE secciones
SET contenido = contenido || jsonb_build_object(
  'mapaEmbed', COALESCE(
    contenido -> 'mapaEmbed',
    to_jsonb('https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d250852.1845671675!2d-73.1339926!3d10.7679402!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e8ae7ae48b66189%3A0xc93210645e70affa!2sCatedral%20del%20Reino!5e0!3m2!1ses!2sco!4v1785989180825!5m2!1ses!2sco'::text)
  )
)
WHERE tipo = 'informacion_boda';
