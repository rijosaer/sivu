-- El recordatorio nunca mencionaba el plazo: la plantilla que instaló la
-- migración 009 no traía ningún marcador de días, así que por más que el panel
-- supiera calcularlos, el mensaje que le llegaba al invitado no los decía.
-- Aquí se le agrega {plazo}, que el panel reemplaza por la frase completa
-- ("quedan 5 días para confirmar", "hoy es el último día para confirmar").
--
-- El WHERE compara contra el texto exacto de fábrica a propósito: si los novios
-- ya escribieron su propio recordatorio desde el panel, esta migración no lo
-- toca. Pisarles el texto sería peor que dejar el mensaje sin el plazo.
UPDATE tema
SET valor =
  'Hola {nombre} 💌' || chr(10) || chr(10) ||
  'Te recordamos con cariño que puedes confirmar tu asistencia a nuestra boda aquí:' || chr(10) ||
  '{enlace}' || chr(10) || chr(10) ||
  'Para organizarlo todo cerramos la lista pronto: {plazo}.' || chr(10) || chr(10) ||
  '¡Nos encantaría contar contigo!'
WHERE clave = 'whatsapp-recordatorio'
  AND valor =
    'Hola {nombre} 💌' || chr(10) || chr(10) ||
    'Te recordamos con cariño que puedes confirmar tu asistencia a nuestra boda aquí:' || chr(10) ||
    '{enlace}' || chr(10) || chr(10) ||
    '¡Nos encantaría contar contigo!';
