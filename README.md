# Invitación de boda — sitio + panel administrativo + Postgres

Arquitectura de 3 piezas que corren por separado:

```
invitacion/
├── src/            → sitio público (React + Vite). Puerto 5173.
├── admin-panel/    → panel de administración (React + Vite). Puerto 5174.
├── server/         → API (Node + Express + PostgreSQL). Puerto 4000.
└── docker-compose.yml → levanta Postgres con un comando.
```

Casi todo el contenido (textos, orden de secciones, colores, decoraciones,
invitados) vive en la base de datos y se edita desde el panel — no hace
falta tocar código para eso.

## 1. Levantar la base de datos

Necesitas [Docker](https://www.docker.com/products/docker-desktop/) instalado.

```bash
docker compose up -d
```

Esto crea Postgres en `localhost:5432` y ya lo deja con las tablas y los
datos de ejemplo (`server/schema.sql` se ejecuta solo la primera vez).

## 2. Levantar el servidor (API)

```bash
cd server
cp .env.example .env
npm install
npm run seed-admin admin tu-contraseña-aqui   # crea tu usuario del panel
npm run dev
```

Queda escuchando en `http://localhost:4000`.

## 3. Levantar el sitio de la invitación

```bash
# en la raíz del proyecto
cp .env.example .env
npm install
npm run dev
```

Se abre en `http://localhost:5173`. Cada invitado entra con
`http://localhost:5173/?i=SU_CODIGO`.

## 4. Levantar el panel de administración

```bash
cd admin-panel
npm install
npm run dev
```

Se abre en `http://localhost:5174`. Entra con el usuario/contraseña que
creaste en el paso 2 (`npm run seed-admin`).

## Qué puedes editar desde el panel, sin programar

- **Invitados**: agregar, editar, eliminar, y generar el código/enlace
  único de cada persona (con botón para copiarlo).
- **Contenido**: el texto de cada sección (bienvenida, información de la
  boda, código de vestimenta, menú, etc.), si se muestra o no, y su
  orden (con flechas subir/bajar).
- **Tema**: los colores del sitio (con selector de color) y las
  tipografías — se aplican al instante en todo el sitio.
- **Decoración**: subir tu propia imagen para el marco, las columnas,
  las esquinas florales y el divisor — o dejar la de fábrica.

## Qué NO se edita desde el panel (requiere tocar código)

- Agregar un tipo de sección completamente nuevo que no exista ya
  (agregar campos a una sección existente sí es libre, vía JSON en
  "Contenido").
- Cambios de diseño/layout que no sean color (tipografía puntual,
  espaciados, animaciones).

## Cuando quieras que viva en internet (no solo en tu computador)

Este setup corre en tu máquina. Para que cualquier invitado lo abra
desde su celular necesitas:
1. Hostear Postgres (ej. [Neon](https://neon.tech) o [Supabase](https://supabase.com), tienen plan gratis).
2. Hostear `server/` (ej. [Railway](https://railway.app) o [Render](https://render.com)).
3. Hostear `src/` y `admin-panel/` (ej. [Vercel](https://vercel.com) o [Netlify](https://www.netlify.com)) — cada uno como un proyecto aparte, apuntando su `VITE_API_URL` al servidor ya hosteado.

Si quieres, seguimos con esa parte cuando termines de probar todo en local.
