# Estilo y lo que ya está usado

Actualiza estas listas cada vez que se apruebe un diseño nuevo.

## Diseños existentes

| Clave | Nombre | Prefijo | Tipo | Look |
|---|---|---|---|---|
| `clasico` | Clásico | — | boda | papel y dorado (componentes de `src/components`) |
| `jardin` | Jardín encantado | `jd` | XV | acuarela verde, princesa de espaldas sin rostro |
| `ensueno` | Ensueño | `en` | XV | acuarela menta y durazno |
| `gala` | Gala | `ga` | corporativo | negro y lima neón |
| `lazos` | Moños y perlas | `lz` | XV | rosa palo, satén y perlas, semi-realista |
| `coquette` | Coquette | `cq` | XV | rosa con moños vectoriales |
| `paris` | París rosé | `pr` | XV | rosa empolvado y oro rosa |
| `valle` / `valle-claro` | Valle de luna / Valle claro | `va` | boda | acuarela azul noche / azul cielo, arco con luna |
| `celebracion` / `celebracion-azul` | Celebración dorada / azul | `cd` | cumpleaños de varias personas | crema y oro / crema y azul loza |

Descartado: **Mariposas y brillo** (fucsia saturado + escarcha + fondo oscuro → «muy maluca»).

Mira el prefijo real en el CSS del diseño antes de elegir uno nuevo (`grep -h "^\.[a-z][a-z] " src/disenos/*/*.css`).

## Entradas ya usadas (primera pantalla)

- Sobre con sello que se abre — Jardín, Ensueño, Clásico
- Boleto — Gala
- Caja de regalo — Moños y perlas, Coquette
- Alas que se abren — Mariposas (descartada)
- Torre que se enciende al tocar — París
- Portada con sello + arco nocturno — Valle
- La tarjeta impresa ES la primera pantalla (sin toque) — Celebración

Ideas libres: telón que se corre, vela que se enciende, libro que se abre, cortina de flores, polaroid que se revela, llave/cerradura, pergamino que se desenrolla, puerta de hacienda, carta lacrada que se desliza, cielo que pasa de día a noche, mapa con ruta.

## Cuerpos ya usados (cómo se ven las secciones)

- Tarjetas apiladas con antetítulo + título + guion + ornamento centrados — Ensueño, Moños y perlas, Coquette
- Ruta de vuelo con títulos a la izquierda — Mariposas (descartada)
- Postales con estampilla + carta de bistró + carta a mano — París
- Bloques que se arman al entrar, itinerario, cinta diagonal y capas de papel con hilo dorado — Valle
- Secciones sobrias centradas bajo la tarjeta (cuenta, programa, vestimenta…) — Celebración

Cada diseño nuevo cambia **las dos cosas**: entrada y cuerpo.

## Letras (trío guion + títulos + cuerpo; ninguna combinación se repite)

| Diseño | Guion | Títulos | Cuerpo |
|---|---|---|---|
| Clásico | — | Playfair Display | Cormorant Garamond |
| Jardín | Pinyon Script | — | Cormorant Garamond |
| Ensueño | Pinyon Script | Cormorant Garamond | Nunito Sans |
| Gala | — | Unbounded | Manrope |
| Moños y perlas | Ballet | Bodoni Moda | Jost |
| Coquette | Dancing Script 600 | Fraunces | Quicksand |
| París | Parisienne | Marcellus | Josefin Sans |
| Valle | Pinyon Script | Cormorant Garamond | Jost |
| Celebración | Great Vibes | Playfair Display | Libre Baskerville |
| Mariposas (descartada) | Yellowtail | DM Serif Display | Outfit |
| Landing de Sivú | Alex Brush | Fraunces | Work Sans (+ IBM Plex Mono) |

- La cursiva debe ser **legible y con grosor**: Sacramento resultó muy fina. Pruébala a 390 px con nombres largos («María José Fragozo»).
- Títulos: serif con carácter o display; cuerpo: algo cómodo a 15–17 px.

## Color

- Claro y luminoso por defecto. Fondos oscuros solo si el concepto lo exige (Gala) y nunca recargados.
- Rosados: empolvados, palo, oro rosa. Sin fucsia saturado.
- La base de toda la página va en el color del concepto (en Jardín se pidió verde en toda la página, no crema).
- Contraste del texto sobre arte: si la acuarela tapa letras, se aligera el arte o se pone un velo, no se achica la letra.

## Lecciones de feedback

- Portada demasiado cargada de acuarela tapaba las letras (Jardín).
- Un sobre hecho solo con CSS «se veía básico»; un cuerpo sin color, «muy básico».
- Fotos de producto reales + lazo real «no cuadra»; vector puro tampoco: el punto es **semi-realista** (pintura digital).
- El usuario quiere iterar sobre lo que ya existe; no reinventar al primer «no me gusta».
- En la réplica de una tarjeta, respetar los detalles del original (las «líneas transversales» del boceto de Valle, el formato clásico de fecha `SÁBADO | 28 | 1:00 P. M.` con `NOVIEMBRE · 2026` en Celebración).
- Se retiró «Agregar al calendario» y los textos repetidos donde el usuario lo pidió: menos es más.
- La boda real de Maite y Ricardo no se usa como muestra de marca.
