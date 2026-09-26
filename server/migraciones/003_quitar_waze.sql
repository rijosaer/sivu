-- El botón de Waze se quitó de la invitación. Si el campo se queda en el
-- JSON, el panel lo sigue mostrando como algo editable que ya no hace nada.
UPDATE secciones
SET contenido = contenido - 'wazeUrl'
WHERE tipo = 'informacion_boda'
  AND contenido ? 'wazeUrl';
