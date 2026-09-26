-- Participación: la página pública para quienes no van al evento (?anuncio=1).
-- Comparte los nombres con la portada, así que sus textos viven en la sección
-- de bienvenida. Muestra la noticia y la fecha; nada de logística.
UPDATE secciones
SET contenido = contenido || jsonb_build_object(
  'anuncioTitulo', COALESCE(contenido -> 'anuncioTitulo', to_jsonb('Nos vamos a casar'::text)),
  'anuncioTexto', COALESCE(
    contenido -> 'anuncioTexto',
    to_jsonb('Con el corazón lleno de alegría queremos compartirte que muy pronto uniremos nuestras vidas. Gracias por acompañarnos con tu cariño.'::text)
  )
)
WHERE tipo = 'welcome';
