-- Dos interruptores para la confirmación de asistencia, editables desde el
-- panel en la sección "Información de la boda" (que es donde ya vive la fecha
-- límite). Se crean encendidos para no cambiar lo que el sitio ya mostraba.
UPDATE secciones
SET contenido = contenido || jsonb_build_object(
  'mostrarRestriccion', COALESCE(contenido -> 'mostrarRestriccion', 'true'::jsonb),
  'mostrarObservaciones', COALESCE(contenido -> 'mostrarObservaciones', 'true'::jsonb)
)
WHERE tipo = 'informacion_boda';
