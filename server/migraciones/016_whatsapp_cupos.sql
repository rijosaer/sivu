-- Las invitaciones de tipo "titular + cupos" no se anunciaban en el WhatsApp:
-- el invitado se enteraba de que podía traer gente solo al abrir el enlace y
-- llegar al formulario. Aquí se les agrega {cupos} a las dos plantillas.
--
-- {cupos} escribe una frase completa ("Tu invitación incluye 3 cupos
-- adicionales: al confirmar escribes los nombres de tus acompañantes.") y se
-- queda vacío en las invitaciones que no manejan cupos, que son la mayoría.
-- Por eso va en su propio renglón: cuando queda vacío, el panel borra el
-- renglón entero y el mensaje sale exactamente como salía antes.
--
-- Los WHERE comparan contra el texto exacto de fábrica a propósito: si los
-- novios ya escribieron sus propios mensajes desde el panel, esta migración no
-- los toca. Pisarles el texto sería peor que dejarlos sin la frase de cupos.

-- Invitación inicial (texto instalado por la migración 006).
UPDATE tema
SET valor =
  'Hola {nombre}, ¡nos casamos! 💍' || chr(10) || chr(10) ||
  'Te compartimos tu invitación personal:' || chr(10) ||
  '{enlace}' || chr(10) || chr(10) ||
  '{cupos}' || chr(10) ||
  'Ahí puedes confirmar tu asistencia. ¡Nos encantaría contar contigo!'
WHERE clave = 'whatsapp-plantilla'
  AND valor =
    'Hola {nombre}, ¡nos casamos! 💍' || chr(10) || chr(10) ||
    'Te compartimos tu invitación personal:' || chr(10) ||
    '{enlace}' || chr(10) || chr(10) ||
    'Ahí puedes confirmar tu asistencia. ¡Nos encantaría contar contigo!';

-- Recordatorio (texto que dejó la migración 014, ya con {plazo}).
UPDATE tema
SET valor =
  'Hola {nombre} 💌' || chr(10) || chr(10) ||
  'Te recordamos con cariño que puedes confirmar tu asistencia a nuestra boda aquí:' || chr(10) ||
  '{enlace}' || chr(10) || chr(10) ||
  '{cupos}' || chr(10) ||
  'Para organizarlo todo cerramos la lista pronto: {plazo}.' || chr(10) || chr(10) ||
  '¡Nos encantaría contar contigo!'
WHERE clave = 'whatsapp-recordatorio'
  AND valor =
    'Hola {nombre} 💌' || chr(10) || chr(10) ||
    'Te recordamos con cariño que puedes confirmar tu asistencia a nuestra boda aquí:' || chr(10) ||
    '{enlace}' || chr(10) || chr(10) ||
    'Para organizarlo todo cerramos la lista pronto: {plazo}.' || chr(10) || chr(10) ||
    '¡Nos encantaría contar contigo!';
