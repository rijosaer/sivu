# Avisos por WhatsApp en tiempo real

Cuando un invitado responde desde su enlace, Sivú le escribe por WhatsApp al cliente solo si asiste o no:

> ✅ **Familia Pérez** confirmó que asiste
> _XV · Emilia_

> ❌ **Laura Méndez** no asistirá
> _XV · Emilia_

- Se prende **por evento** desde la tarjeta del evento en el panel → «Avisos por WhatsApp». Solo el dueño lo ve.
- Ahí se ponen uno o varios números del cliente, separados por coma (los de 10 dígitos se completan con el 57).
- «Enviar prueba» manda un aviso de ejemplo. Debajo salen los últimos envíos con su estado (enviado, simulado, o falló y por qué).
- Solo avisa cuando cambia el sí o el no. Si una familia pasa de 3 a 2 personas, sigue asistiendo y no avisa otra vez.
  Tampoco avisa si alguien se marca a mano en el panel.
- Si WhatsApp falla, la confirmación del invitado se guarda igual. El fallo queda anotado en el panel.

## Modo provisional: número de Sivú vinculado (lo que se usa hoy)

Mientras no esté la cuenta oficial, los avisos salen de un número de Sivú vinculado como WhatsApp Web.

1. Consigue un **número aparte** (una SIM nueva con WhatsApp normal o WhatsApp Business en un celular).
   **No uses el personal ni el número de ventas**: este modo no es oficial y WhatsApp puede bloquear el número.
2. En el panel (pantalla «Tus eventos»), en el recuadro **WhatsApp de Sivú**, toca **Vincular número**.
3. En el celular de ese número: WhatsApp → **Dispositivos vinculados** → **Vincular un dispositivo**, y escanea el QR.
4. Listo: queda «vinculado · +57…». La sesión se guarda en la base de datos y sobrevive a reinicios y despliegues.
   Si alguien lo desvincula desde el celular, el panel lo muestra y hay que escanear de nuevo.

Para bajar el riesgo de bloqueo:
- Los envíos salen de a uno, con «escribiendo…» y pausas de unos segundos.
- Pídele a cada cliente que **guarde el número de Sivú y le escriba un «hola»** antes del evento:
  a WhatsApp le preocupan los mensajes a gente que nunca ha hablado con el número.
- El celular de ese número debe conectarse a internet de vez en cuando (al menos cada 14 días), o WhatsApp cierra
  los dispositivos vinculados.

Si un día se configura la cuenta oficial (abajo), el servidor la usa en vez del número vinculado.

## Más adelante: cuenta oficial de WhatsApp Business

Es el camino autorizado, sin riesgo de bloqueo, pero pide verificación en Meta y cobra por mensaje.

1. **Cuenta de Meta Business** en business.facebook.com. Verifica el negocio (RUT o cámara de comercio de Sivú).
   Mientras no esté verificado, Meta deja escribir a pocos números al día.
2. **App de WhatsApp**: en developers.facebook.com crea una app tipo «Business» y agrégale el producto WhatsApp.
3. **Número de Sivú**: registra un número que **no** esté en uso en la app de WhatsApp normal ni en WhatsApp Business del
   celular (puede ser una línea nueva). Copia su **Phone number ID**.
4. **Token permanente**: en Configuración del negocio → Usuarios del sistema, crea un usuario «Admin».
   Dale acceso a la app y genera un token con los permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
5. **Plantilla**: en el Administrador de WhatsApp → Plantillas de mensajes, crea:
   - Nombre: `sivu_respuesta_invitado`
   - Categoría: **Utilidad**
   - Idioma: **Español** (`es`)
   - Cuerpo:
     ```
     Nueva respuesta en {{1}}: {{2}}. Mira el detalle en tu panel de Sivú.
     ```
   - Ejemplos que pide Meta: `{{1}}` = `XV · Emilia`, `{{2}}` = `Familia Pérez confirmó que asiste`.
   - La aprobación suele tardar de minutos a un día.
6. **Variables en Railway** (servicio `convite`):
   ```
   WHATSAPP_TOKEN=<token permanente del paso 4>
   WHATSAPP_NUMERO_ID=<Phone number ID del paso 3>
   # opcionales
   WHATSAPP_PLANTILLA=sivu_respuesta_invitado
   WHATSAPP_IDIOMA=es
   ```
7. En el panel prende los avisos en un evento, guarda tu propio número y usa «Enviar prueba».

## Costos

Meta cobra cada mensaje de plantilla de **Utilidad** que se envía a Colombia (centavos de dólar; la tarifa vigente está
en la página de precios de WhatsApp Business). Un evento de 120 invitados genera más o menos 120 avisos por número
configurado. Con dos números (mamá y papá), el costo se duplica.

## Errores comunes (se ven en el panel)

| Detalle | Qué pasa |
|---|---|
| `132001` | La plantilla no existe o no está aprobada con ese nombre o idioma. |
| `131030` | El número no está en la lista de prueba (cuenta sin verificar). |
| `190` | El token venció o no es el permanente. |
| `131026` | El número del cliente no tiene WhatsApp. |
