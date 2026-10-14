# Arte: SDXL local

Generador en `C:\Users\ricar\ia-imagenes` (tarjeta gráfica de esta PC). Las salidas van a `salidas/<pieza>-<semilla>.png`; el arte final, en `.webp`, a `src/disenos/<clave>/arte/`.

## Generar

1. Define la pieza en `PIEZAS` de `generar.py` con un prefijo de 2 letras del diseño:

   ```python
   "xx_ramo": dict(
       prompt="small bouquet of white garden roses with eucalyptus leaves, centered, small in frame, " + SEMI,
       neg=NEG_SEMI, w=1024, h=1024),
   ```

   - CLIP lee **77 tokens**: el objeto va primero, el estilo al final y corto. Estilos ya hechos: `SEMI` (semi-realista, el preferido), `ESTILO`/`ESTILO_EN` (acuarela), `SEMI_PA` (París).
   - Pide **objetos sueltos y pequeños en el cuadro** («centered, small in frame, isolated on plain white background»). Los «ramos» tienden a salir como papel tapiz que llena el cuadro y no se pueden recortar.
   - Sin rostros si el cliente no los quiere (la princesa de Jardín va de espaldas).

2. Lanza desde **PowerShell**:

   ```powershell
   cd C:\Users\ricar\ia-imagenes
   venv\Scripts\python generar.py xx_ramo,xx_esquina 7 13 21
   ```

   Varias piezas separadas por coma comparten una carga del modelo.

## Problemas de memoria (frecuentes)

- **Brave abierto** ocupa ~1 GB de VRAM: pide cerrarlo antes de generar.
- Revisa que no haya otro `generar.py` corriendo (otra sesión puede usar la GPU).
- Con poca RAM libre (~2–3 GB) solo aguanta ~2 imágenes por proceso → un proceso por imagen en un bucle con reintentos.
- Se cae con `0xC0000005` por RAM; ya está mitigado en `generar.py` (VAE en CPU).
- **No correr rembg y SDXL a la vez.**

## Recortar y ajustar

| Script | Uso |
|---|---|
| `procesar.py ent sal [ancho] --alfa [--solido]` | Fondo blanco → transparencia real. Para acuarela |
| `recortar.py ent sal [ancho] [--principal]` | rembg (venv-recorte); `--principal` quita restos sueltos. Para semi-realista |
| `rosar.py ent sal [grados]` | Gira el tono durazno → rosa |
| `azular.py ent sal [--hojas]` | Verdes → azul sin tocar el oro |
| `escalar.py ent sal [ancho]` | Real-ESRGAN x4 cuando el arte se ve borroso; mezclar 70/30 con la original para conservar el grano |

- Usa **transparencia real**, no `mix-blend-mode: multiply`: deja recuadros blancos en elementos que animan su opacidad.
- Exporta a `.webp` con un ancho razonable (≤ 1200 px para piezas grandes) para que la invitación cargue rápido desde WhatsApp.
- Una pieza puede servir dos veces (esquina de arriba y de abajo giradas), y un filtro SVG puede teñirla para una variante de color (ver `cd-azulado` en Celebracion.jsx).

## Lo que se hace en CSS/SVG

Filetes, marcos, sellos, cintas, ornamentos e íconos van en SVG dentro del componente, con `currentColor` o degradados que leen el tema. Agrégales grano y sombreado suave para que no se vean planos junto al arte pintado.
