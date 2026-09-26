-- El itinerario pasa a tener tres formas: detallado (la lista de horas de
-- siempre), un mensaje suelto, o no mostrarse. Se arranca en "detallado"
-- para que la invitación se vea exactamente igual que antes de este cambio.
--
-- El mensaje se deja escrito aunque no se use todavía: si el campo no existe
-- en el JSON, el panel no lo muestra y no habría dónde escribirlo al cambiar
-- de modo.
UPDATE secciones
SET contenido = contenido || jsonb_build_object(
  'cronogramaModo', COALESCE(contenido -> 'cronogramaModo', '"detallado"'::jsonb),
  'cronogramaMensaje', COALESCE(
    contenido -> 'cronogramaMensaje',
    '"Les compartiremos el orden del día más cerca de la fecha."'::jsonb
  )
)
WHERE tipo = 'informacion_boda';

-- "Información importante" se muestra como nota en vez de lista numerada.
-- La nota nace vacía a propósito: mientras lo esté se siguen viendo los
-- puntos que ya estaban escritos, ahora sin los números.
UPDATE secciones
SET contenido = contenido || jsonb_build_object(
  'nota', COALESCE(contenido -> 'nota', '""'::jsonb)
)
WHERE tipo = 'info_importante';
