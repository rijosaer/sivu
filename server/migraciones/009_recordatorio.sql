-- Plantilla del recordatorio de WhatsApp, para perseguir a quienes aún no
-- confirman. Es aparte de la plantilla de la invitación inicial. No viaja al
-- sitio: /site solo devuelve las claves color-%.
INSERT INTO tema (clave, valor) VALUES (
  'whatsapp-recordatorio',
  'Hola {nombre} 💌' || chr(10) || chr(10) ||
  'Te recordamos con cariño que puedes confirmar tu asistencia a nuestra boda aquí:' || chr(10) ||
  '{enlace}' || chr(10) || chr(10) ||
  '¡Nos encantaría contar contigo!'
) ON CONFLICT (clave) DO NOTHING;
