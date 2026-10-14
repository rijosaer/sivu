# Dónde se registra un diseño

Rutas relativas a la raíz del repo (`Downloads\invitacion-postgres-v1\invitacion`). Si falta uno de estos pasos, el diseño no aparece o el servidor lo rechaza.

## 1. Sitio — `src/App.jsx`

En `DISENOS_ALTERNATIVOS` (carga diferida, para que la boda clásica no descargue ilustraciones ajenas):

```js
"mi-clave": lazy(() => import("./disenos/mi-clave/MiDiseno")),
```

App le pasa siempre estas props:

```jsx
<Diseno site={site} contenidoDe={contenidoDe} invitacion={invitacion}
        enEditor={enEditor} onEnviarRSVP={(respuestas, acompanantes) => …} />
```

## 2. Servidor — `server/plantillas.js`

- Agrega la clave a `DISENOS` (lista que valida la columna `invitaciones.diseno`).
- Crea `TEMA_MI_CLAVE` (pares `[clave, valor]`) y agrégalo a `TEMAS_DISENO`. Al crear un evento o cambiarle el diseño, estas claves se escriben en su tema; textos, invitados y fotos no se tocan.

```js
// Mi diseño: principal = …, claro = …, oscuro = …, sello = ….
const TEMA_MI_CLAVE = [
  ["color-paper", "#FBF6EC"],      // fondo
  ["color-ink", "#3A2A1C"],        // texto
  ["color-gold", "#B8862E"],       // color principal
  ["color-gold-light", "#E8CF97"], // principal claro
  ["color-gold-dark", "#7E5A1E"],  // principal oscuro
  ["color-marble", "#F3E8D6"],     // segundo fondo / tarjetas
  ["color-seal", "#B4466A"],       // acento (sello, nombres)
  ["fuente-guion", "Great Vibes"],
  ["fuente-titulos", "Playfair Display"],
  ["fuente-cuerpo", "Libre Baskerville"],
];
```

Escribe el comentario de qué significa cada color en ese diseño (los nombres `gold`/`seal` son históricos).

- Si el diseño necesita **campos nuevos**, agrégalos vacíos a la plantilla del tipo de evento en `PLANTILLAS` (p. ej. `festejados` y `telefonoConfirmar` en `cumpleanos`). Siempre opcionales: los eventos viejos no los tienen.

## 3. Panel — `admin-panel/src/tiposEvento.js`

En `DISENOS` (espejo del servidor), con un nombre que describa el look:

```js
{ key: "mi-clave", nombre: "Mi diseño (crema y oro, cumpleaños)" },
```

Campos nuevos → su etiqueta en `admin-panel/src/pages/EditorCampos.jsx` (objeto de etiquetas, p. ej. `festejados: "Festejados (nombre y edad que cumplen)"`).

## 4. Demo pública — solo plantillas de catálogo

No para clientes reales.

- `src/demo/Demo.jsx`: agrega a `DISENOS`, `MUESTRAS` y `NOMBRES`.
- `src/demo/muestras/<clave>.json`: `{ site: { invitacion: { slug: "plantillas/<clave>", nombre, tipoEvento, diseno }, tema, decoraciones, ubicaciones: [], secciones: [...] , fotosSubidas, audioUrl }, invitado: {...} }`. Copia una existente (`paris.json`, `valle.json`) y cambia los datos de ejemplo.
- Se ve en `/plantillas/<clave>`. **No** se agrega a la landing (`src/landing/`) hasta que el usuario lo apruebe.

## 5. Variante de color

Una variante (mismo diseño, otra paleta) no copia el componente:

```jsx
// src/disenos/celebracion/CelebracionAzul.jsx
import Celebracion from "./Celebracion";
export default function CelebracionAzul(props) {
  return <Celebracion {...props} variante="azul" />;
}
```

El componente base pone la clase `xx-<variante>` en la raíz para los pocos ajustes que no salen del tema (p. ej. un filtro SVG que tiñe una acuarela, o arte alterno vía prop `arte` como en Valle claro). Luego registra la clave nueva en los pasos 1–4 con su propio `TEMA_…`. Cuidado con chocar con una clase que ya exista (Valle usa `.va-v-claro` porque `.va-claro` ya era un color).
