# Contrato de datos de un diseño

## Props

| Prop | Qué trae |
|---|---|
| `site` | Todo el evento: `invitacion` ({slug, nombre, tipoEvento, diseno}), `tema`, `secciones` [{tipo, activo, contenido}], `fotosSubidas` [url], `audioUrl`, `fondoUrl`, `fechaLimiteConfirmacion` |
| `contenidoDe(tipo)` | El `contenido` de esa sección (ya con la vista previa del panel superpuesta). Devuelve `{}` si no existe |
| `invitacion` | El invitado del enlace `?i=`, o `null`. `{ nombre, tipo: "cupos"\|"familia", cupos, miembros: [{nombre, es_acompanante}], … }` |
| `enEditor` | `true` dentro del panel (vista previa). Salta entradas con toque si estorban para editar |
| `onEnviarRSVP(respuestas, acompanantes)` | Se pasa tal cual a `<RSVP onSubmit>` |
| `variante` | Solo si el diseño tiene variantes de color |

Activo: `const activo = (t) => site.secciones.some((s) => s.tipo === t && s.activo !== false);`

## Secciones y campos

Los nombres vienen de la boda original; se reutilizan para todos los tipos de evento.

- **`welcome`** — `bienvenidaTexto` (título/antetítulo), `novioEl` y `novioElla` (nombres; en XV/cumpleaños solo `novioEl`), `fraseIntro`, `padresTexto`, `padreElPadre`, `padreElMadre`, `padreEllaPadre`, `padreEllaMadre`, opcionales `versiculo`, `versiculoCita`, `festejados` [{nombre, edad}] (varias personas que cumplen años).
- **`informacion_boda`** — `fecha` (ISO con zona, p. ej. `2027-03-20T21:00:00-05:00`), `lugar`, `direccion`, `mapsUrl`, `mapaEmbed`, `overline`, `tituloSeccion`, `tituloItinerario`, `cronogramaModo` (`detallado` | `mensaje` | `oculto`), `cronograma` [{hora, titulo}], `cronogramaMensaje`, `fechaLimiteConfirmacion`, `mostrarRestriccion`, `mostrarObservaciones`, `telefonoConfirmar`.
- **`fotos`** — `titulo`, `subtitulo`, `urls`. (Las fotos subidas en el panel llegan en `site.fotosSubidas`.)
- **`vestimenta`** — `titulo`, `nota`, `permitidos` [{nombre, colores: [hex]}], `evitar` [{nombre, color}].
- **`padrinos`** — `titulo`, `grupos` [{etiqueta, personas: [nombre]}].
- **`historia`** — `texto`.
- **`regalos`** — `titulo`, `texto`, `enlaces`, `datosTransferencia` (botón «Copiar»).
- **`sobres`** — `texto` (lluvia de sobres).
- **`info_importante`** — `items` [texto], `nota`.
- **`faq`** — `items` [{p, r}].
- **`musica`** — `titulo`, `src` (también `site.audioUrl`). Arranca con un toque del usuario (la entrada es buen momento), nunca sola.

Si el diseño necesita un campo que no existe, agrégalo opcional (ver registro.md, paso 2) y dibuja algo razonable cuando falte.

## Ayudas de `src/disenos/comun.js`

```js
import { partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer, enlaceCalendario } from "../comun";
```

- `partesFecha(info.fecha)` → `{ fecha, dia, diaDos, semana, semanaCorta, mes, mesCorto, mesNum, anio, hora ("8:00 p. m."), hora24 }` en hora de Bogotá.
- `limiteLegible(fecha)` → «20 de marzo de 2027».
- `useCuentaRegresiva(partes?.fecha)` → `{dias, horas, min, seg}` o `null` si ya pasó («¡Llegó el gran día!»).
- `pasesDe(invitacion)` → número de pases (0 sin invitado).
- `useFuentes(URL_GOOGLE_FONTS)` → carga las letras propias del diseño.
- `useAparecer(dep, "[data-reveal]", "is-in")` → `ref` para la raíz; agrega la clase cuando cada bloque entra en pantalla (respeta movimiento reducido).
- `enlaceCalendario({titulo, fecha, lugar, detalle})` → Google Calendar. Úsalo solo si el usuario lo quiere (en Celebración lo pidió quitar).

## Confirmación (RSVP)

```jsx
const confirmar = invitacion
  ? { grande: "Confirmar asistencia", onClick: () => setRsvpAbierto(true) }
  : digitos ? { texto: "Favor confirmar al", grande: telefono,
                href: `https://wa.me/${digitos.length === 10 ? `57${digitos}` : digitos}` }
  : null;
```

El modal envuelve al `RSVP` común:

```jsx
<RSVP invitacion={invitacion}
      fechaLimite={info.fechaLimiteConfirmacion || site.fechaLimiteConfirmacion}
      opciones={{ mostrarRestriccion: info.mostrarRestriccion !== false,
                  mostrarObservaciones: info.mostrarObservaciones !== false }}
      onSubmit={onEnviarRSVP} />
```

Un solo texto en el botón («Confirmar asistencia»), y debajo «Confirma antes del <b>límite</b>» si hay fecha límite.
