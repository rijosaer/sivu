---
name: sivu-invitaciones
description: Diseña invitaciones digitales nuevas para Sivú (ex Convite, heysivu.com) como «diseños» del sitio React del repo rijosaer/sivu — boda, XV, cumpleaños, baby shower, bautizo o corporativo. Úsala cuando pidan una plantilla o diseño de invitación nuevo para Sivú, replicar una tarjeta impresa, video o boceto de un cliente, hacer una variante de color de un diseño existente, o mejorar uno que ya existe (Jardín, Ensueño, Gala, Moños y perlas, Coquette, París, Valle, Celebración). Cubre concepto, entrada y cuerpo únicos, paleta y letras del tema, arte semi-realista con SDXL local, registro en sitio/servidor/panel, muestra de demostración y prueba local.
---

# Diseñar invitaciones de Sivú

Sivú es un sistema multi-invitación: cada evento vive en `heysivu.com/<slug>`, cada invitado abre su enlace con `?i=CODIGO`, y la columna `invitaciones.diseno` decide con qué componente se dibuja. **Diseñar una invitación = crear un diseño nuevo** en `src/disenos/<clave>/` que lee el mismo contenido que todos los demás.

Repo local: `C:\Users\ricar\Downloads\invitacion-postgres-v1\invitacion` (GitHub privado `rijosaer/sivu`, rama `master`).

## Flujo

1. **Entender el pedido.** ¿Hay referencia (tarjeta impresa, video, boceto, captura)? Si la hay, la réplica manda: misma composición, mismos textos, misma jerarquía. ¿Tipo de evento? ¿Cliente real o plantilla de catálogo?
2. **Concepto.** Antes de escribir código, decide y di en una línea: nombre, clave (`kebab`), prefijo CSS de 2 letras, **entrada** (primera pantalla), **cuerpo** (cómo se presentan las secciones), paleta y trío de letras. Revisa [references/estilo.md](references/estilo.md): la entrada, el cuerpo y las letras **no pueden repetir** los de otro diseño.
3. **Arte.** Si lleva ilustración, se genera en local con SDXL y se recorta con transparencia real. Ver [references/arte.md](references/arte.md).
4. **Componente.** Copia [plantilla/Diseno.jsx](plantilla/Diseno.jsx) y [plantilla/diseno.css](plantilla/diseno.css) a `src/disenos/<clave>/`, renombra el prefijo y construye. Contrato de datos (props, secciones, campos) en [references/contenido.md](references/contenido.md).
5. **Registro.** Un diseño existe solo si está en los 4–5 lugares de [references/registro.md](references/registro.md) (sitio, servidor, panel, tema y, si es de catálogo, demo).
6. **Probar** en local, en móvil (390 px) y con y sin invitado. Ver [references/probar-publicar.md](references/probar-publicar.md).
7. **Mostrar y esperar aprobación.** No publicar, no hacer commit y no agregarlo a la landing sin que el usuario lo pida explícitamente.

## Reglas que no se negocian

- **Todo el color sale del tema** (`--color-paper`, `--color-ink`, `--color-gold`, `--color-gold-light`, `--color-gold-dark`, `--color-marble`, `--color-seal`, en canales `R G B`). Nada de hex sueltos para los colores de marca: así una variante de color (p. ej. Celebración azul) es solo otra paleta + `variante`.
- **Letras del tema con respaldo:** `var(--fuente-guion, "X")`, `var(--fuente-titulos, "Y")`, `var(--fuente-cuerpo, "Z")`. El cliente las cambia desde el panel.
- **Móvil primero.** Se abre desde WhatsApp en un teléfono. Ancho de diseño 390 px; `100svh`; sin scroll horizontal; tocables ≥ 44 px.
- **A quién se invitó se ve primero:** con invitado, «Invitación especial para <nombre>» + píldora de pases (`pasesDe(invitacion)`).
- **Sin invitado** (enlace sin `?i=`) la página también funciona: si hay `telefonoConfirmar`, el botón va a WhatsApp de ese número; si no, no hay botón.
- **Secciones opcionales:** solo se dibujan si están activas (`activo(tipo)`) y tienen contenido. Ningún título vacío ni texto de relleno visible.
- **No repetir en el cuerpo lo que ya dice la tarjeta** de la primera pantalla.
- **Animación con propósito:** aparición al entrar (`useAparecer`), respetar `prefers-reduced-motion`. Nada de scroll «atado» (scrub): se sintió «mitad sí, mitad no».
- **El formulario RSVP es el común** (`src/components/RSVP.jsx`); se viste con un bloque CSS del diseño para que tome sus letras y colores, no se reescribe.
- **Clientes reales:** sin demo pública con sus datos ni fotos. Sus datos van en `C:\Users\ricar\Publicidad\SIVU-plantillas\clientes\<evento>\`.
- **Gusto del usuario:** claro, fino y semi-realista. Nada de fucsia chillón, escarcha ni fondos oscuros recargados. Ante un «no me gusta» parcial, **mejorar lo que existe** con cambios acotados; si algo se rehace, conservar lo anterior como diseño aparte.

## Al terminar

Di en pocas líneas: clave y nombre del diseño, dónde verlo en local, qué entrada/cuerpo/letras usa, qué falta (aprobación, demo, publicación). Si el usuario aprueba y pide publicar, sigue [references/probar-publicar.md](references/probar-publicar.md).
