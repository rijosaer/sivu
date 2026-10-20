import { useId } from "react";

// Arte de «Medianoche», todo en SVG semi-realista: oro con degradados en capas
// (brillo, cuerpo y sombra), sombras suaves y un grano fino para que el metal
// y el cristal no se vean planos. Los colores de marca salen del tema
// (--color-gold, --color-gold-light, --color-gold-dark, --color-seal); solo
// los materiales naturales (porcelana, cristal, acero) tienen color fijo.
// Cada pieza lleva su nombre SDXL para poder cambiarla por un .webp pintado.

const ORO = "rgb(var(--color-gold))";
const CLARO = "rgb(var(--color-gold-light))";
const OSCURO = "rgb(var(--color-gold-dark))";
const ACENTO = "rgb(var(--color-seal))";

// Ids únicos por instancia (las piezas se repiten en la página).
function useIds(...nombres) {
  const base = useId().replace(/:/g, "");
  return Object.fromEntries(nombres.map((n) => [n, `md${base}${n}`]));
}

// Grano sutil: ruido fraccional en gris, a muy baja opacidad, recortado a la forma.
function Grano({ id, opacidad = 0.16 }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="ruido" />
      <feColorMatrix in="ruido" type="matrix" values={`0 0 0 0 .5  0 0 0 0 .42  0 0 0 0 .3  0 0 0 ${opacidad} 0`} result="gris" />
      <feComposite in="gris" in2="SourceGraphic" operator="in" result="grano" />
      <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="grano" /></feMerge>
    </filter>
  );
}

// Degradado metálico (lineal): sombra, cuerpo, brillo, cuerpo, sombra.
function Metal({ id, x1 = 0, y1 = 0, x2 = 1, y2 = 1 }) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
      <stop offset="0" stopColor={CLARO} />
      <stop offset=".28" stopColor={ORO} />
      <stop offset=".52" stopColor={OSCURO} />
      <stop offset=".7" stopColor={ORO} />
      <stop offset=".88" stopColor={CLARO} />
      <stop offset="1" stopColor={ORO} />
    </linearGradient>
  );
}

// SDXL: md_reloj
// Reloj de bolsillo antiguo de oro, sin números: caja con bisel, corona y
// argolla, esfera de esmalte marfil con guilloché fino, índices de bastón y
// un pequeño segundero a las 6. `minuto` y `hora` son ángulos en grados
// (0 = las 12); el componente que lo usa los anima con una transición CSS.
export function MdReloj({ className = "", minuto = 0, hora = 0, segundero = true, llamado = false }) {
  const id = useIds("caja", "bisel", "esfera", "brillo", "sombra", "grano", "aguja", "argolla", "vidrio");
  const marcas = Array.from({ length: 60 }, (_, i) => i);
  const anillos = [56, 52, 48, 44, 40, 36, 32];
  return (
    <svg className={`md-reloj ${className}`} viewBox="0 0 240 300" aria-hidden="true">
      <defs>
        <Metal id={id.caja} x1="0" y1="0" x2="1" y2="1" />
        <Metal id={id.argolla} x1="0" y1="0" x2="1" y2=".4" />
        <linearGradient id={id.bisel} x1="1" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={CLARO} />
          <stop offset=".45" stopColor={OSCURO} />
          <stop offset="1" stopColor={CLARO} />
        </linearGradient>
        <radialGradient id={id.esfera} cx=".42" cy=".38" r=".75">
          <stop offset="0" stopColor="#FBF6EA" />
          <stop offset=".65" stopColor="#F1E7CF" />
          <stop offset="1" stopColor="#D9C9A2" />
        </radialGradient>
        <radialGradient id={id.brillo} cx=".3" cy=".22" r=".55">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id.vidrio} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".4" stopColor="#fff" stopOpacity="0" />
          <stop offset=".85" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".12" />
        </linearGradient>
        <linearGradient id={id.aguja} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={OSCURO} />
          <stop offset=".5" stopColor={ORO} />
          <stop offset="1" stopColor={OSCURO} />
        </linearGradient>
        <radialGradient id={id.sombra} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#000" stopOpacity=".55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <Grano id={id.grano} opacidad={0.22} />
      </defs>

      {/* Sombra difusa debajo del reloj */}
      <ellipse cx="124" cy="286" rx="86" ry="10" fill={`url(#${id.sombra})`} />

      <g filter={`url(#${id.grano})`}>
        {/* Argolla y corona */}
        <ellipse cx="120" cy="32" rx="24" ry="22" fill="none" stroke={`url(#${id.argolla})`} strokeWidth="7" />
        <ellipse cx="120" cy="32" rx="24" ry="22" fill="none" stroke={CLARO} strokeOpacity=".5" strokeWidth="1" transform="translate(-1.5 -1.5)" />
        {/* La corona es la que se presiona: baja y sube con CSS. */}
        <g className="md-reloj-corona">
          <rect x="111" y="50" width="18" height="12" rx="3" fill={`url(#${id.caja})`} />
          <rect x="107" y="60" width="26" height="16" rx="4" fill={`url(#${id.caja})`} />
          <path d="M110 62v12M114 62v12M118 62v12M122 62v12M126 62v12M130 62v12" stroke={OSCURO} strokeOpacity=".55" strokeWidth="1" />
          <rect x="108" y="61" width="24" height="3" rx="1.5" fill={CLARO} opacity=".55" />
        </g>
        <rect x="114" y="74" width="12" height="10" rx="2" fill={`url(#${id.caja})`} />

        {/* Caja */}
        <circle cx="120" cy="178" r="104" fill={`url(#${id.caja})`} />
        <circle cx="120" cy="178" r="103" fill="none" stroke={CLARO} strokeOpacity=".6" strokeWidth="1" />
        <circle cx="120" cy="178" r="96" fill={`url(#${id.bisel})`} />
        <circle cx="120" cy="178" r="90" fill="none" stroke={OSCURO} strokeWidth="1.2" />
        {/* Granulado del bisel */}
        <circle cx="120" cy="178" r="93" fill="none" stroke={CLARO} strokeOpacity=".55" strokeWidth="2" strokeDasharray="1 3.2" />

        {/* Esfera de esmalte */}
        <circle cx="120" cy="178" r="88" fill={`url(#${id.esfera})`} />
        <g fill="none" stroke={OSCURO} strokeOpacity=".09" strokeWidth=".8">
          {anillos.map((r) => <circle key={r} cx="120" cy="178" r={r} />)}
        </g>
        {/* Pista de minutos e índices de bastón (sin números) */}
        <circle cx="120" cy="178" r="80" fill="none" stroke={OSCURO} strokeOpacity=".5" strokeWidth=".7" />
        <circle cx="120" cy="178" r="74" fill="none" stroke={OSCURO} strokeOpacity=".35" strokeWidth=".6" />
        <g stroke={OSCURO}>
          {marcas.map((i) => (
            i % 5 === 0 ? (
              <line key={i} x1="120" y1="99" x2="120" y2={i === 0 ? 120 : 114} strokeWidth={i === 0 ? 4 : 2.6} strokeLinecap="round" transform={`rotate(${i * 6} 120 178)`} stroke={`url(#${id.aguja})`} />
            ) : (
              <line key={i} x1="120" y1="98.5" x2="120" y2="104" strokeWidth=".8" strokeOpacity=".7" transform={`rotate(${i * 6} 120 178)`} />
            )
          ))}
        </g>
        {/* Doble índice a las 12 */}
        <line x1="114" y1="99" x2="114" y2="114" stroke={`url(#${id.aguja})`} strokeWidth="2.4" strokeLinecap="round" />
        <line x1="126" y1="99" x2="126" y2="114" stroke={`url(#${id.aguja})`} strokeWidth="2.4" strokeLinecap="round" />

        {/* Pequeño segundero a las 6 */}
        <circle cx="120" cy="222" r="18" fill="#EDE2C6" stroke={OSCURO} strokeOpacity=".45" strokeWidth=".7" />
        <g stroke={OSCURO} strokeOpacity=".5" strokeWidth=".7">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1="120" y1="205.5" x2="120" y2="209" transform={`rotate(${i * 30} 120 222)`} />
          ))}
        </g>
        {segundero && (
          <g className="md-reloj-seg" style={{ transformOrigin: "120px 222px" }}>
            <line x1="120" y1="226" x2="120" y2="207" stroke={OSCURO} strokeWidth="1.1" strokeLinecap="round" />
          </g>
        )}
        <circle cx="120" cy="222" r="1.8" fill={OSCURO} />
      </g>

      {/* Agujas tipo hoja (no llevan grano para que se vean nítidas) */}
      <g className="md-reloj-hora" style={{ transform: `rotate(${hora}deg)`, transformOrigin: "120px 178px" }}>
        <path d="M120 128 C 125 140 125 158 122.6 182 L 117.4 182 C 115 158 115 140 120 128 Z" fill={`url(#${id.aguja})`} stroke={OSCURO} strokeWidth=".6" />
        <path d="M120 186 L 120 194" stroke={OSCURO} strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className="md-reloj-minuto" style={{ transform: `rotate(${minuto}deg)`, transformOrigin: "120px 178px" }}>
        <path d="M120 100 C 123.6 116 123.4 150 121.6 182 L 118.4 182 C 116.6 150 116.4 116 120 100 Z" fill={`url(#${id.aguja})`} stroke={OSCURO} strokeWidth=".6" />
        <path d="M120 186 L 120 200" stroke={OSCURO} strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <circle cx="120" cy="178" r="5.5" fill={`url(#${id.caja})`} stroke={OSCURO} strokeWidth=".8" />
      <circle cx="119" cy="177" r="1.6" fill={CLARO} />

      {/* Cristal: reflejo y brillo */}
      <circle cx="120" cy="178" r="88" fill={`url(#${id.vidrio})`} />
      <path d="M58 140 C 72 104 104 88 140 92" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />
      <circle cx="120" cy="178" r="104" fill={`url(#${id.brillo})`} />

      {/* Ondas doradas alrededor de la corona: «presióname» */}
      {llamado && (
        <g className="md-corona-ondas" fill="none" stroke={CLARO} strokeWidth="1.4">
          <ellipse cx="120" cy="66" rx="22" ry="16" />
          <ellipse cx="120" cy="66" rx="22" ry="16" />
        </g>
      )}
    </svg>
  );
}

// Número pseudoaleatorio estable entre 0 y 1.
const azar = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };

// Cada estallido: centro, radio, número de rayos, retraso (ms) y tono.
const ESTALLIDOS = [
  { x: 200, y: 210, r: 120, n: 26, d: 0, t: "claro" },
  { x: 80, y: 120, r: 70, n: 18, d: 380, t: "oro" },
  { x: 318, y: 112, r: 78, n: 20, d: 620, t: "acento" },
  { x: 92, y: 330, r: 62, n: 16, d: 980, t: "oro" },
  { x: 312, y: 318, r: 66, n: 16, d: 1240, t: "claro" },
  { x: 205, y: 70, r: 50, n: 14, d: 1600, t: "acento" },
];
const TONOS = { claro: CLARO, oro: ORO, acento: ACENTO };

// SDXL: md_fuegos
// Fuegos artificiales dorados: cada estallido sube como un trazo, se abre en
// rayos con estela que se apagan y deja chispas que titilan. Se animan solo
// cuando el contenedor recibe la clase `md-fuegos-on`. El resplandor va en
// CSS (drop-shadow sobre el SVG entero): un desenfoque SVG por estallido
// dejaba cuadros negros al animarse.
export function MdFuegos({ className = "" }) {
  const id = useIds("centro");
  return (
    <svg className={`md-fuegos ${className}`} viewBox="0 0 400 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id={id.centro}>
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".35" stopColor={CLARO} stopOpacity=".55" />
          <stop offset="1" stopColor={ORO} stopOpacity="0" />
        </radialGradient>
      </defs>
      {ESTALLIDOS.map((e, k) => {
        const color = TONOS[e.t];
        return (
          <g key={k} className="md-estallido" style={{ "--d": `${e.d}ms` }}>
            {/* Cohete que sube */}
            <line className="md-cohete" x1={e.x + (k % 2 ? 10 : -10)} y1="430" x2={e.x} y2={e.y} pathLength="100" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
            <g transform={`translate(${e.x} ${e.y})`}>
              <circle className="md-destello" r={e.r * 0.32} fill={`url(#${id.centro})`} />
              <circle className="md-nucleo" r="3.2" fill="#FFF8E6" />
              <g>
                {Array.from({ length: e.n }, (_, i) => {
                  const ang = (360 / e.n) * i + azar(k * 40 + i) * 8;
                  const largo = e.r * (0.78 + azar(k * 70 + i) * 0.3);
                  return (
                    <g key={i} transform={`rotate(${ang})`}>
                      <g className="md-caida">
                        <line className="md-estela" x1="4" y1="0" x2={largo} y2="0" pathLength="100" stroke={color} strokeWidth={i % 3 ? 1.1 : 1.6} strokeLinecap="round" />
                        <circle className="md-chispa" cx="0" cy="0" r={i % 3 ? 1.5 : 2.2} fill={i % 2 ? "#FFF7E2" : color} style={{ "--l": `${largo.toFixed(1)}px` }} />
                      </g>
                    </g>
                  );
                })}
              </g>
              {/* Chispas que titilan al apagarse */}
              {Array.from({ length: 8 }, (_, i) => {
                const a = azar(k * 13 + i) * Math.PI * 2;
                const r = e.r * (0.5 + azar(k * 17 + i) * 0.55);
                return (
                  <circle key={`t${i}`} className="md-titila" cx={Math.cos(a) * r} cy={Math.sin(a) * r + 10} r="1.3" fill="#FFF4D6"
                    style={{ "--t": `${Math.round(azar(k * 19 + i) * 500)}ms` }} />
                );
              })}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// SDXL: md_copas
// Dos copas de champaña que brindan: cristal con reflejos, champaña dorada con
// burbujas, pie con sombra y un destello donde se tocan.
export function MdCopas({ className = "" }) {
  const id = useIds("vidrio", "liquido", "pie", "sombra", "grano", "destello");
  const burbujas = [[0, 66, 1.4], [-3, 58, 1], [2, 50, 1.2], [-1, 42, .9], [3, 36, 1], [-2, 30, .8], [1, 74, 1.1]];
  const Copa = ({ giro, dx }) => (
    <g transform={`translate(${dx} 0) rotate(${giro} 0 150)`}>
      {/* Cuenco */}
      <path d="M-17 6 C -18 40 -15 72 -8 90 C -5 97 -2 100 0 101 C 2 100 5 97 8 90 C 15 72 18 40 17 6 Z" fill={`url(#${id.vidrio})`} stroke="#F7EFDC" strokeOpacity=".55" strokeWidth=".9" />
      {/* Champaña */}
      <path d="M-15.6 26 C -15.8 50 -13 74 -7 88 C -4.5 94 -2 97 0 98 C 2 97 4.5 94 7 88 C 13 74 15.8 50 15.6 26 Z" fill={`url(#${id.liquido})`} />
      <ellipse cx="0" cy="26" rx="15.6" ry="2.6" fill={CLARO} opacity=".85" />
      <ellipse cx="0" cy="26" rx="15.6" ry="2.6" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth=".6" />
      {burbujas.map(([x, y, r], i) => <circle key={i} className="md-burbuja" cx={x} cy={y} r={r} fill="#FFF8E6" opacity=".8" style={{ "--b": `${i * 260}ms` }} />)}
      {/* Borde y reflejos del cristal */}
      <ellipse cx="0" cy="6" rx="17" ry="2.8" fill="none" stroke="#FBF5E6" strokeOpacity=".75" strokeWidth=".9" />
      <path d="M-11 12 C -12 40 -10 64 -5 82" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 16 C 12 36 10 56 7 70" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1" strokeLinecap="round" />
      {/* Tallo y pie */}
      <path d="M-1.4 100 L -1.2 146 L 1.2 146 L 1.4 100 Z" fill={`url(#${id.pie})`} />
      <path d="M0 100 L 0 146" stroke="#fff" strokeOpacity=".5" strokeWidth=".5" />
      <ellipse cx="0" cy="148" rx="17" ry="3.6" fill={`url(#${id.pie})`} stroke="#F7EFDC" strokeOpacity=".5" strokeWidth=".6" />
    </g>
  );
  return (
    <svg className={`md-copas ${className}`} viewBox="-80 -14 160 180" aria-hidden="true">
      <defs>
        <linearGradient id={id.vidrio} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".32" />
          <stop offset=".25" stopColor="#FFFFFF" stopOpacity=".08" />
          <stop offset=".7" stopColor="#FFFFFF" stopOpacity=".04" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity=".24" />
        </linearGradient>
        <linearGradient id={id.liquido} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={CLARO} />
          <stop offset=".55" stopColor={ORO} />
          <stop offset="1" stopColor={OSCURO} />
        </linearGradient>
        <linearGradient id={id.pie} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".5" />
          <stop offset=".5" stopColor="#FFFFFF" stopOpacity=".14" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity=".4" />
        </linearGradient>
        <radialGradient id={id.sombra}>
          <stop offset="0" stopColor="#000" stopOpacity=".6" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id.destello}>
          <stop offset="0" stopColor="#fff" />
          <stop offset=".4" stopColor={CLARO} stopOpacity=".6" />
          <stop offset="1" stopColor={ORO} stopOpacity="0" />
        </radialGradient>
        <Grano id={id.grano} opacidad={0.18} />
      </defs>
      <ellipse cx="0" cy="156" rx="64" ry="6" fill={`url(#${id.sombra})`} />
      <g filter={`url(#${id.grano})`}>
        <Copa giro={-11} dx={-20} />
        <Copa giro={11} dx={20} />
      </g>
      {/* Destello del brindis */}
      <g className="md-copas-destello" transform="translate(0 6)">
        <circle r="12" fill={`url(#${id.destello})`} />
        <path d="M0 -14 L 1.2 -1.2 L 14 0 L 1.2 1.2 L 0 14 L -1.2 1.2 L -14 0 L -1.2 -1.2 Z" fill="#FFF8E6" />
      </g>
    </svg>
  );
}

// SDXL: md_plato
// Puesto de cena visto desde arriba: plato base de oro, plato de porcelana
// con filete dorado, servilleta de lino doblada, tenedor y cuchillo.
export function MdPlato({ className = "" }) {
  const id = useIds("base", "porcelana", "fondo", "sombra", "cubierto", "grano", "lino");
  return (
    <svg className={`md-plato ${className}`} viewBox="0 0 240 150" aria-hidden="true">
      <defs>
        <Metal id={id.base} x1="0" y1="0" x2="1" y2="1" />
        <radialGradient id={id.porcelana} cx=".42" cy=".36" r=".7">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".7" stopColor="#F3EEE4" />
          <stop offset="1" stopColor="#D8D0C0" />
        </radialGradient>
        <radialGradient id={id.fondo} cx=".55" cy=".6" r=".6">
          <stop offset="0" stopColor="#FBF9F4" />
          <stop offset=".85" stopColor="#EEE8DC" />
          <stop offset="1" stopColor="#DCD3C2" />
        </radialGradient>
        <radialGradient id={id.sombra}>
          <stop offset="0" stopColor="#000" stopOpacity=".55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id.cubierto} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={OSCURO} />
          <stop offset=".45" stopColor={CLARO} />
          <stop offset="1" stopColor={ORO} />
        </linearGradient>
        <linearGradient id={id.lino} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F7F2E8" />
          <stop offset="1" stopColor="#D9D0BE" />
        </linearGradient>
        <Grano id={id.grano} opacidad={0.2} />
      </defs>
      <g filter={`url(#${id.grano})`}>
        {/* Sombras */}
        <ellipse cx="122" cy="80" rx="64" ry="60" fill={`url(#${id.sombra})`} />
        <rect x="34" y="20" width="18" height="122" rx="9" fill={`url(#${id.sombra})`} opacity=".6" />
        <rect x="190" y="20" width="18" height="122" rx="9" fill={`url(#${id.sombra})`} opacity=".6" />

        {/* Plato base */}
        <circle cx="120" cy="75" r="62" fill={`url(#${id.base})`} />
        <circle cx="120" cy="75" r="58" fill="none" stroke={CLARO} strokeOpacity=".5" strokeWidth="1" strokeDasharray="1.2 2.6" />
        {/* Porcelana */}
        <circle cx="120" cy="75" r="53" fill={`url(#${id.porcelana})`} />
        <circle cx="120" cy="75" r="49.5" fill="none" stroke={ORO} strokeWidth="1.1" />
        <circle cx="120" cy="75" r="36" fill={`url(#${id.fondo})`} />
        <circle cx="120" cy="75" r="36" fill="none" stroke="#C9BFA9" strokeOpacity=".6" strokeWidth=".8" />
        {/* Servilleta doblada en triángulo */}
        <path d="M100 58 L 142 62 L 118 98 Z" fill={`url(#${id.lino})`} />
        <path d="M100 58 L 142 62 L 124 70 Z" fill="#fff" opacity=".55" />
        <path d="M118 98 L 124 70" stroke="#C8BEA8" strokeWidth=".6" />
        <path d="M104 63 L 138 66" stroke={ORO} strokeOpacity=".7" strokeWidth=".8" />
        {/* Brillo de la porcelana */}
        <path d="M84 50 C 92 38 106 30 122 29" fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="2.2" strokeLinecap="round" />

        {/* Tenedor */}
        <g fill={`url(#${id.cubierto})`}>
          <path d="M37 18 h1.8 v20 h-1.8z M41.2 18 h1.8 v20 h-1.8z M45.4 18 h1.8 v20 h-1.8z M49.6 18 h1.8 v20 h-1.8z" />
          <path d="M36.6 36 C 36.6 46 40 50 42.6 52 L 42 132 C 42 136 46 136 46 132 L 45.4 52 C 48 50 51.4 46 51.4 36 Z" />
        </g>
        {/* Cuchillo */}
        <path d="M196 18 C 206 26 207 52 204 74 L 203 74 L 201 132 C 201 136 197 136 197 132 L 197 18 Z" fill={`url(#${id.cubierto})`} />
        <path d="M198.5 22 L 198.5 72" stroke="#fff" strokeOpacity=".45" strokeWidth=".7" />
      </g>
    </svg>
  );
}

// Abanico art-déco: semicírculo de rayos y arcos con base escalonada. Trazo
// fino de oro; se usa pequeño en cada sección. Los rayos giran con CSS
// (`--g`), así el abanico se despliega cuando su sección aparece.
export function MdAbanico({ className = "" }) {
  const id = useIds("oro");
  const rayos = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];
  return (
    <svg className={`md-abanico ${className}`} viewBox="0 0 64 36" aria-hidden="true">
      <defs><Metal id={id.oro} x1="0" y1="0" x2="1" y2="0" /></defs>
      <g fill="none" stroke={`url(#${id.oro})`} strokeWidth="1" strokeLinecap="round">
        <path d="M4 30 A 28 28 0 0 1 60 30" />
        <path d="M11 30 A 21 21 0 0 1 53 30" strokeOpacity=".75" />
        <path d="M20 30 A 12 12 0 0 1 44 30" />
        {rayos.map((a) => (
          <line key={a} className="md-rayo" x1="32" y1="30" x2="32" y2="3.5" style={{ "--g": `${a}deg` }} strokeOpacity={a % 30 === 0 ? 1 : 0.6} />
        ))}
        <path d="M14 30 H 50 M 18 33 H 46" />
      </g>
      <path d="M32 21 L 35 26 L 32 31 L 29 26 Z" fill={`url(#${id.oro})`} />
    </svg>
  );
}

// Esquina escalonada del marco art-déco (arriba a la izquierda; las demás se
// voltean con CSS). Tapa el filete recto con el color de fondo y lo redibuja
// con escalones; las medidas coinciden con los filetes del CSS (0,5 y 7,5 px).
export function MdEsquina({ className = "", fondo = "rgb(var(--color-paper))" }) {
  return (
    <svg className={`md-esquina ${className}`} viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
      <rect width="27.5" height="27.5" fill={fondo} />
      <path d="M0.5 28 V18.5 H6.5 V6.5 H18.5 V0.5 H28" fill="none" stroke={ORO} strokeOpacity=".7" />
      <path d="M7.5 28 V25.5 H13.5 V13.5 H25.5 V7.5 H28" fill="none" stroke={ORO} strokeOpacity=".38" />
      <path d="M20 17.5 L 22.5 20 L 20 22.5 L 17.5 20 Z" fill={ORO} />
    </svg>
  );
}

// SDXL: md_esfera
// Esfera art-déco de la cuenta regresiva: bisel de oro escalonado, esfera
// esmeralda con rayos de sol finos, números romanos y una ventanilla de fecha
// a las 6 con los días que faltan. Las agujas marcan las horas, minutos y
// segundos que restan (el componente las gira con CSS).
export function MdEsfera({ className = "", dias = "", horas = 0, minutos = 0, segundos = 0 }) {
  const id = useIds("bisel", "anillo", "cara", "aguja", "vidrio", "grano", "sombra");
  const C = 140;
  const romanos = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
  const angH = ((horas % 12) + minutos / 60) * 30;
  const angM = (minutos + segundos / 60) * 6;
  const angS = segundos * 6;
  const gira = (a) => ({ transform: `rotate(${a}deg)`, transformOrigin: `${C}px ${C}px` });
  return (
    <svg className={`md-esfera ${className}`} viewBox="0 0 280 292" aria-hidden="true">
      <defs>
        <Metal id={id.bisel} x1="0" y1="0" x2="1" y2="1" />
        <linearGradient id={id.anillo} x1="1" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={CLARO} />
          <stop offset=".5" stopColor={OSCURO} />
          <stop offset="1" stopColor={CLARO} />
        </linearGradient>
        <radialGradient id={id.cara} cx=".45" cy=".36" r=".72">
          <stop offset="0" stopColor="rgb(var(--color-marble))" />
          <stop offset="1" stopColor="rgb(var(--color-paper))" />
        </radialGradient>
        <linearGradient id={id.aguja} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={OSCURO} />
          <stop offset=".5" stopColor={CLARO} />
          <stop offset="1" stopColor={ORO} />
        </linearGradient>
        <linearGradient id={id.vidrio} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id.sombra}>
          <stop offset="0" stopColor="#000" stopOpacity=".5" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <Grano id={id.grano} opacidad={0.2} />
      </defs>
      <ellipse cx={C} cy="282" rx="96" ry="8" fill={`url(#${id.sombra})`} />
      <g filter={`url(#${id.grano})`}>
        {/* Bisel escalonado: tres anillos */}
        <circle cx={C} cy={C} r="136" fill={`url(#${id.bisel})`} />
        <circle cx={C} cy={C} r="135" fill="none" stroke={CLARO} strokeOpacity=".55" />
        <circle cx={C} cy={C} r="128" fill={`url(#${id.anillo})`} />
        <circle cx={C} cy={C} r="131" fill="none" stroke={CLARO} strokeOpacity=".5" strokeWidth="2" strokeDasharray="1 3.4" />
        <circle cx={C} cy={C} r="122" fill={`url(#${id.cara})`} />
        <circle cx={C} cy={C} r="122" fill="none" stroke={OSCURO} strokeWidth="1.2" />
      </g>
      {/* Rayos de sol art-déco sobre la esfera */}
      <g stroke={ORO}>
        {Array.from({ length: 48 }, (_, i) => (
          <line key={i} x1={C} y1={C - 24} x2={C} y2={C - 84} strokeWidth={i % 2 ? 0.5 : 0.9} strokeOpacity={i % 2 ? 0.1 : 0.2} transform={`rotate(${i * 7.5} ${C} ${C})`} />
        ))}
      </g>
      <circle cx={C} cy={C} r="86" fill="none" stroke={ORO} strokeOpacity=".45" strokeWidth=".8" />
      <circle cx={C} cy={C} r="82" fill="none" stroke={ORO} strokeOpacity=".25" strokeWidth=".6" />
      {/* Pista de minutos */}
      <g stroke={CLARO}>
        {Array.from({ length: 60 }, (_, i) => (
          <line key={i} x1={C} y1={C - 118} x2={C} y2={C - (i % 5 ? 114 : 110)} strokeWidth={i % 5 ? 0.7 : 1.6} strokeOpacity={i % 5 ? 0.5 : 0.95} transform={`rotate(${i * 6} ${C} ${C})`} />
        ))}
      </g>
      {/* Números romanos */}
      <g fill={CLARO} style={{ fontFamily: "var(--f-titulos)" }} textAnchor="middle" dominantBaseline="central">
        {romanos.map((r, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const rr = 97;
          return (
            <text key={r} x={(C + Math.sin(a) * rr).toFixed(1)} y={(C - Math.cos(a) * rr).toFixed(1)} fontSize={i % 3 ? 14 : 18} opacity={i === 6 ? 0 : 1}>{r}</text>
          );
        })}
      </g>
      {/* Ventanilla de fecha a las 6 con los días */}
      <g>
        <path d={`M${C - 40} 186 h80 l6 6 v24 l-6 6 h-80 l-6 -6 v-24 z`} fill="rgb(var(--color-paper))" stroke={`url(#${id.bisel})`} strokeWidth="2" />
        <path d={`M${C - 37} 190 h74 l4 4 v20 l-4 4 h-74 l-4 -4 v-20 z`} fill="none" stroke={ORO} strokeOpacity=".4" strokeWidth=".7" />
        <text x={C} y="205" textAnchor="middle" dominantBaseline="central" fill="rgb(var(--color-ink))" fontSize="22" style={{ fontFamily: "var(--f-titulos)", letterSpacing: "1px" }}>{dias}</text>
        <text x={C} y="238" textAnchor="middle" fill={ORO} fontSize="10" style={{ fontFamily: "var(--f-titulos)", letterSpacing: "2px" }}>DÍAS</text>
      </g>
      {/* Agujas art-déco: lanza escalonada */}
      <g className="md-esf-hora" style={gira(angH)}>
        <path d={`M${C} ${C + 14} L${C - 4.5} ${C + 6} L${C - 4.5} ${C - 30} L${C - 2} ${C - 34} L${C - 5} ${C - 44} L${C} ${C - 66} L${C + 5} ${C - 44} L${C + 2} ${C - 34} L${C + 4.5} ${C - 30} L${C + 4.5} ${C + 6} Z`} fill={`url(#${id.aguja})`} stroke={OSCURO} strokeWidth=".6" />
      </g>
      <g className="md-esf-min" style={gira(angM)}>
        <path d={`M${C} ${C + 18} L${C - 3} ${C + 8} L${C - 3} ${C - 70} L${C - 1.4} ${C - 74} L${C - 3.4} ${C - 82} L${C} ${C - 104} L${C + 3.4} ${C - 82} L${C + 1.4} ${C - 74} L${C + 3} ${C - 70} L${C + 3} ${C + 8} Z`} fill={`url(#${id.aguja})`} stroke={OSCURO} strokeWidth=".6" />
      </g>
      <g className="md-esf-seg" style={gira(angS)}>
        <line x1={C} y1={C + 26} x2={C} y2={C - 112} stroke={ACENTO} strokeWidth="1" strokeLinecap="round" />
        <path d={`M${C} ${C + 20} l4 6 -4 6 -4 -6 z`} fill={ACENTO} />
      </g>
      <circle cx={C} cy={C} r="6.5" fill={`url(#${id.bisel})`} stroke={OSCURO} strokeWidth=".8" />
      <circle cx={C} cy={C} r="2" fill={ACENTO} />
      {/* Reflejo del cristal */}
      <circle cx={C} cy={C} r="122" fill={`url(#${id.vidrio})`} />
      <path d="M44 104 C 58 66 92 40 132 34" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// SDXL: md_copa
// Una copa flauta de champaña, de frente, para contar los pases en la
// tarjeta de mesa. La champaña sube con CSS (.md-copa-liquido).
export function MdCopa({ className = "", style }) {
  const id = useIds("vidrio", "liquido");
  return (
    <svg className={`md-copa ${className}`} style={style} viewBox="0 0 24 64" aria-hidden="true">
      <defs>
        <linearGradient id={id.vidrio} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity=".38" />
          <stop offset=".4" stopColor="#fff" stopOpacity=".06" />
          <stop offset="1" stopColor="#fff" stopOpacity=".3" />
        </linearGradient>
        <linearGradient id={id.liquido} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={CLARO} />
          <stop offset="1" stopColor={ORO} />
        </linearGradient>
      </defs>
      <g className="md-copa-liquido">
        <path d="M5.4 10 C 5.4 24 6.6 33 12 37 C 17.4 33 18.6 24 18.6 10 Z" fill={`url(#${id.liquido})`} />
        <ellipse cx="12" cy="10" rx="6.6" ry="1.2" fill={CLARO} />
        <circle cx="10.5" cy="28" r=".8" fill="#FFF8E6" opacity=".8" />
        <circle cx="13" cy="21" r=".6" fill="#FFF8E6" opacity=".8" />
      </g>
      <path d="M4.4 3 C 4.2 22 5.8 34 12 38.5 C 18.2 34 19.8 22 19.6 3 Z" fill={`url(#${id.vidrio})`} stroke="#F7EFDC" strokeOpacity=".7" strokeWidth=".7" />
      <path d="M7 6 C 7 20 7.8 28 10 33" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth=".9" strokeLinecap="round" />
      <path d="M11.4 38.5 L 11.5 58 H 12.5 L 12.6 38.5 Z" fill="#fff" fillOpacity=".55" />
      <ellipse cx="12" cy="59" rx="7" ry="1.8" fill="#fff" fillOpacity=".35" stroke="#F7EFDC" strokeOpacity=".6" strokeWidth=".5" />
    </svg>
  );
}

// SDXL: md_atril
// Atril de bronce escalonado (zigurat art-déco) que sostiene la tarjeta de
// mesa reservada, con su sombra sobre el mantel.
export function MdAtril({ className = "" }) {
  const id = useIds("metal", "sombra", "grano");
  return (
    <svg className={`md-atril ${className}`} viewBox="0 0 240 34" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <Metal id={id.metal} x1="0" y1="0" x2="1" y2=".2" />
        <radialGradient id={id.sombra}>
          <stop offset="0" stopColor="#000" stopOpacity=".5" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <Grano id={id.grano} opacidad={0.2} />
      </defs>
      <ellipse cx="120" cy="29" rx="118" ry="5" fill={`url(#${id.sombra})`} />
      <g filter={`url(#${id.grano})`} fill={`url(#${id.metal})`}>
        <rect x="30" y="0" width="180" height="7" />
        <rect x="16" y="7" width="208" height="7" />
        <rect x="4" y="14" width="232" height="10" />
      </g>
      <g stroke={CLARO} strokeOpacity=".65" strokeWidth=".8">
        <path d="M30 .5 H210 M16 7.5 H224 M4 14.5 H236" />
      </g>
      <path d="M120 16 l3.5 3.5 -3.5 3.5 -3.5 -3.5 z" fill={OSCURO} />
    </svg>
  );
}

// Rayos de sol art-déco que nacen del pie de la tarjeta de mesa (fondo).
export function MdRayos({ className = "" }) {
  return (
    <svg className={`md-rayos ${className}`} viewBox="0 0 200 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g stroke={ORO} strokeWidth=".6">
        {Array.from({ length: 19 }, (_, i) => (
          <line key={i} x1="100" y1="100" x2="100" y2="-60" strokeOpacity={i % 2 ? 0.08 : 0.16} transform={`rotate(${-90 + i * 10} 100 100)`} />
        ))}
      </g>
      <g fill="none" stroke={ORO} strokeOpacity=".18" strokeWidth=".6">
        <path d="M70 100 A 30 30 0 0 1 130 100" />
        <path d="M80 100 A 20 20 0 0 1 120 100" />
      </g>
    </svg>
  );
}

// SDXL: md_disco
// Disco de vinilo esmeralda con etiqueta de oro y brazo del gramófono: el
// botón de la música. Gira mientras suena; el brazo se apoya al sonar.
export function MdDisco({ className = "", sonando = false }) {
  const id = useIds("vinilo", "etiqueta", "brazo", "brillo");
  return (
    <svg className={`md-disco ${className}`} viewBox="0 0 60 60" aria-hidden="true">
      <defs>
        <radialGradient id={id.vinilo} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="rgb(var(--color-marble))" />
          <stop offset=".9" stopColor="rgb(var(--color-paper))" />
          <stop offset="1" stopColor={OSCURO} />
        </radialGradient>
        <Metal id={id.etiqueta} x1="0" y1="0" x2="1" y2="1" />
        <Metal id={id.brazo} x1="0" y1="0" x2="1" y2="0" />
        <linearGradient id={id.brillo} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".45" stopColor="#fff" stopOpacity=".18" />
          <stop offset=".55" stopColor="#fff" stopOpacity=".18" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="md-disco-gira">
        <circle cx="28" cy="32" r="26" fill={`url(#${id.vinilo})`} stroke={ORO} strokeOpacity=".6" strokeWidth=".8" />
        <g fill="none" stroke={CLARO} strokeOpacity=".16" strokeWidth=".5">
          {[23, 20.5, 18, 15.5, 13].map((r) => <circle key={r} cx="28" cy="32" r={r} />)}
        </g>
        <circle cx="28" cy="32" r="9" fill={`url(#${id.etiqueta})`} />
        <path d="M28 25 l2 3.4 -2 3.4 -2 -3.4 z M28 32 l2 3.4 -2 3.4 -2 -3.4 z" fill={OSCURO} opacity=".7" />
        <circle cx="28" cy="32" r="1.4" fill="rgb(var(--color-paper))" />
      </g>
      <circle cx="28" cy="32" r="26" fill={`url(#${id.brillo})`} />
      {/* Brazo del gramófono */}
      <g className={`md-disco-brazo ${sonando ? "md-disco-brazo-on" : ""}`}>
        <circle cx="53" cy="7" r="3.6" fill={`url(#${id.brazo})`} />
        <path d="M53 7 L 50 26 L 42 34" fill="none" stroke={`url(#${id.brazo})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="38.5" y="32" width="6" height="4" rx="1" fill={CLARO} transform="rotate(-45 41.5 34)" />
      </g>
    </svg>
  );
}
