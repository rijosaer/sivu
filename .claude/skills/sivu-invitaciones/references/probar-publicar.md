# Probar y publicar

## Local

- Base: contenedor Docker `convite-prueba` (Postgres 5440, base `railway`, usuario/clave `prueba`). Arráncalo si está detenido: `docker start convite-prueba`.
- API (desde `server/`): puerto 4811 (en sesiones anteriores también 4810).
- Sitio (raíz): `npx vite --port 5191` (o 5199). Panel (`admin-panel/`): `VITE_API_URL=http://localhost:4811 npx vite --port 5192`.
- Mira qué puertos usa ya la máquina antes de levantar otro (`netstat -ano | findstr LISTEN`).

Qué ver:

- **Plantilla de catálogo:** `http://localhost:5191/plantillas/<clave>` (no necesita base ni API).
- **Evento real local:** crea o cambia un evento al diseño nuevo desde el panel y abre `http://localhost:5191/<slug>` sin código y con `?i=<CODIGO>` de un invitado con pases.

Revisa siempre:

1. Móvil 390 × 844 y también 360 px (nombres largos, fecha, botón).
2. Con invitado y sin invitado (con y sin `telefonoConfirmar`).
3. Secciones opcionales apagadas o vacías: no deben quedar títulos huérfanos.
4. El modal RSVP abre, envía y se ve con las letras del diseño.
5. Música: arranca solo tras un toque; botón de pausa visible.
6. Movimiento reducido: todo visible sin animación.
7. `npm run lint` y `npm run build` sin errores.

Para capturas, usa el navegador integrado (skill `anthropic-skills:built-in-browser` o `chrome-browser`) en tamaño de teléfono y muéstraselas al usuario.

## Publicar (solo si el usuario lo pide de forma explícita)

Railway, proyecto `invitacion-boda`. **No está conectado a GitHub**: un push no publica. El usuario rechazó republicaciones que no pidió.

| Qué cambió | Comando (desde la raíz del repo) |
|---|---|
| Sitio (`src/`, `public/`) | `railway up --service convite --ci` |
| Servidor (`server/`, p. ej. `DISENOS`, `TEMA_…`, plantillas) | `railway up server --path-as-root --service invitacion-api --ci` |
| Panel (`admin-panel/`) | `railway up admin-panel --path-as-root --service panel-2cth2s --ci` |

Un diseño nuevo toca los tres. `railway up --ci` del sitio puede quedarse mostrando registros aunque ya terminó: confirma con `railway status`.

Dominio: `heysivu.com` (sitio) y `panel.heysivu.com` (panel). La API sigue en `invitacion-api-production.up.railway.app`.

Commit en `master` del repo `rijosaer/sivu` solo si el usuario lo pide. Sin acceso directo a la base de producción: los eventos se crean desde el panel o con la API usando credenciales que da el usuario (ver `crear-en-produccion.mjs` en `Publicidad\SIVU-plantillas\clientes\…`).
