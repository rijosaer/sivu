import { useId } from "react";

// Arte de «Luces de verano», todo en SVG semi-realista: capas de degradados,
// sombras suaves y un grano fino para que nada se vea plano. Cada pieza es
// un componente con nombre y su clave SDXL encima, para poder cambiarla luego
// por un .webp pintado. Los ids de degradados y filtros salen de useId()
// porque las piezas se repiten en la página. Los colores de marca leen el
// tema (--color-*); los naturales (cera, hojas, pétalos) son fijos.

const tema = (v, a = 1) => (a === 1 ? `rgb(var(--color-${v}))` : `rgb(var(--color-${v}) / ${a})`);
const mezcla = (a, pa, b) => `color-mix(in srgb, ${a} ${pa}%, ${b})`;
const limpia = (id) => id.replace(/[^a-zA-Z0-9_-]/g, "");

// Grano: ruido fractal que solo cae donde hay pintura (SourceAlpha) y se
// mezcla encima, con muy poca opacidad.
function Grano({ id, fuerza = 0.1, frecuencia = 0.9 }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={frecuencia} numOctaves="2" seed="7" result="ruido" />
      <feColorMatrix in="ruido" type="matrix" values={`0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 ${fuerza * 2.4} ${-fuerza * 0.6}`} result="puntos" />
      <feComposite in="puntos" in2="SourceAlpha" operator="in" result="grano" />
      <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="grano" /></feMerge>
    </filter>
  );
}

const azar = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };

// Hoja alargada (tipo olivo/eucalipto) de largo l, apuntando a la derecha.
const hoja = (l, w) => `M0 0 C ${l * 0.3} ${-w} ${l * 0.75} ${-w * 0.8} ${l} 0 C ${l * 0.75} ${w * 0.8} ${l * 0.3} ${w} 0 0 Z`;

// Una bombilla tipo globo (G50) que cuelga de su casquillo. Apagada es vidrio
// claro con un filamento gris; encendida (CSS: .lu-luces-on / .is-in) se
// tiñe de ámbar, el filamento brilla y el halo se abre.
function Bombilla({ x, y, r, i, ids }) {
  return (
    <g className="lu-bombilla" style={{ "--i": i }} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      <circle className="lu-halo" cx="0" cy={r * 1.9} r={r * 4.2} fill={`url(#${ids.halo})`} />
      <line x1="0" y1="-2" x2="0" y2={r * 0.4} style={{ stroke: ids.cable }} strokeWidth=".9" />
      <rect x={-r * 0.42} y={r * 0.35} width={r * 0.84} height={r * 0.95} rx={r * 0.12} fill={`url(#${ids.casquillo})`} />
      <path d={`M${-r * 0.42} ${r * 0.62} h${r * 0.84} M${-r * 0.42} ${r * 0.9} h${r * 0.84}`} stroke="#1a1d24" strokeWidth=".5" opacity=".6" />
      <ellipse className="lu-vidrio" cx="0" cy={r * 2.2} rx={r} ry={r * 1.05} fill={`url(#${ids.vidrio})`} stroke="rgb(60 64 80 / .3)" strokeWidth=".5" />
      <ellipse className="lu-vidrio-luz" cx="0" cy={r * 2.2} rx={r} ry={r * 1.05} fill={`url(#${ids.luz})`} />
      <path className="lu-filamento" d={`M${-r * 0.22} ${r * 1.4} L${-r * 0.22} ${r * 2.1} Q 0 ${r * 2.55} ${r * 0.22} ${r * 2.1} L${r * 0.22} ${r * 1.4}`} fill="none" strokeWidth=".7" strokeLinecap="round" />
      <ellipse cx={-r * 0.38} cy={r * 1.78} rx={r * 0.22} ry={r * 0.36} fill="#fff" opacity=".7" transform={`rotate(24 ${-r * 0.38} ${r * 1.78})`} />
    </g>
  );
}

// SDXL: lu_guirnalda
// Guirnalda de bombillas colgada en catenaria. Las bombillas se encienden una
// a una por CSS (transition-delay con --i) cuando un ancestro tiene
// .lu-luces-on o .is-in. `alto` es la caída del cable; `n`, cuántas bombillas.
export function LuGuirnalda({ n = 9, alto = 60, r = 7, ancho = 400, inicio = 0, className = "" }) {
  const u = limpia(useId());
  const ids = {
    halo: `lu-g-halo-${u}`, vidrio: `lu-g-vidrio-${u}`, luz: `lu-g-luz-${u}`, casquillo: `lu-g-casq-${u}`,
    cable: mezcla(tema("ink"), 85, "#000"),
  };
  const y0 = 8;
  const p0 = [-6, y0], p1 = [ancho / 2, y0 + alto * 2], p2 = [ancho + 6, y0];
  const punto = (t) => {
    const v = 1 - t;
    return [v * v * p0[0] + 2 * v * t * p1[0] + t * t * p2[0], v * v * p0[1] + 2 * v * t * p1[1] + t * t * p2[1]];
  };
  const bombillas = Array.from({ length: n }, (_, i) => {
    const [x, y] = punto((i + 0.5) / n);
    return { x, y };
  });
  const altoTotal = y0 + alto + r * 5.2 + r * 3;
  return (
    <svg className={`lu-guirnalda ${className}`} viewBox={`0 0 ${ancho} ${altoTotal.toFixed(0)}`} aria-hidden="true">
      <defs>
        <radialGradient id={ids.halo} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFF1CF" stopOpacity=".95" />
          <stop offset=".25" style={{ stopColor: tema("gold-light"), stopOpacity: 0.55 }} />
          <stop offset=".6" style={{ stopColor: tema("gold"), stopOpacity: 0.16 }} />
          <stop offset="1" style={{ stopColor: tema("gold"), stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={ids.vidrio} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".85" />
          <stop offset=".55" stopColor="#E7E2DA" stopOpacity=".55" />
          <stop offset="1" stopColor="#A9A49C" stopOpacity=".6" />
        </radialGradient>
        <radialGradient id={ids.luz} cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#FFFDF4" />
          <stop offset=".35" stopColor="#FFE9B8" />
          <stop offset=".8" style={{ stopColor: tema("gold-light") }} />
          <stop offset="1" style={{ stopColor: tema("gold") }} />
        </radialGradient>
        <linearGradient id={ids.casquillo} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a2d34" />
          <stop offset=".45" stopColor="#5b5e66" />
          <stop offset="1" stopColor="#1c1e24" />
        </linearGradient>
      </defs>
      <path d={`M${p0[0]} ${p0[1]} Q ${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`} fill="none" style={{ stroke: ids.cable }} strokeWidth="1.3" opacity=".85" />
      {bombillas.map((b, i) => <Bombilla key={i} x={b.x} y={b.y} r={r} i={i + inicio} ids={ids} />)}
    </svg>
  );
}

// SDXL: lu_vela
// Vela pequeña de cera marfil en un platito de latón, con goteo, mecha y una
// llama que titila (CSS en .lu-llama) y un halo cálido.
export function LuVela({ className = "" }) {
  const u = limpia(useId());
  const id = (n) => `lu-vela-${n}-${u}`;
  return (
    <svg className={`lu-vela ${className}`} viewBox="0 0 60 120" aria-hidden="true">
      <defs>
        <radialGradient id={id("halo")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFF0C8" stopOpacity=".9" />
          <stop offset=".3" style={{ stopColor: tema("gold-light"), stopOpacity: 0.45 }} />
          <stop offset="1" style={{ stopColor: tema("gold"), stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id={id("cera")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E6D8BF" />
          <stop offset=".35" stopColor="#FFF9EC" />
          <stop offset=".7" stopColor="#F4E8D2" />
          <stop offset="1" stopColor="#CDBB9C" />
        </linearGradient>
        <linearGradient id={id("brillo")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE8B0" stopOpacity=".8" />
          <stop offset="1" stopColor="#FFE8B0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id("llama")} cx="50%" cy="72%" r="65%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".3" stopColor="#FFF4C2" />
          <stop offset=".65" stopColor="#FFC65C" />
          <stop offset="1" stopColor="#E98A2C" stopOpacity=".9" />
        </radialGradient>
        <linearGradient id={id("laton")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: tema("gold-dark") }} />
          <stop offset=".4" style={{ stopColor: tema("gold-light") }} />
          <stop offset=".7" style={{ stopColor: tema("gold") }} />
          <stop offset="1" style={{ stopColor: tema("gold-dark") }} />
        </linearGradient>
        <radialGradient id={id("sombra")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#2a2216" stopOpacity=".35" />
          <stop offset="1" stopColor="#2a2216" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="114" rx="28" ry="5" fill={`url(#${id("sombra")})`} />
      <circle className="lu-vela-halo" cx="30" cy="30" r="30" fill={`url(#${id("halo")})`} />
      {/* Platito */}
      <ellipse cx="30" cy="108" rx="24" ry="6" fill={`url(#${id("laton")})`} />
      <ellipse cx="30" cy="106.5" rx="20" ry="4" fill="#000" opacity=".12" />
      {/* Cera */}
      <path d="M17 54 Q 30 50 43 54 L 43 104 Q 30 108 17 104 Z" fill={`url(#${id("cera")})`} />
      <path d="M17 54 Q 30 50 43 54 L 43 70 Q 30 66 17 70 Z" fill={`url(#${id("brillo")})`} opacity=".7" />
      <ellipse cx="30" cy="54" rx="13" ry="3.4" fill="#FBF2E1" />
      <ellipse cx="30" cy="54.4" rx="9" ry="2" fill="#EBDDC4" />
      <path d="M38 55 C 39 60 41 62 40.5 68 C 40 72 38 72 38 68 C 38 63 37 60 37 56 Z" fill="#FFF7E8" />
      <path d="M21 55 C 20 58 19.5 61 20.5 63 C 21.5 64.5 22.5 62 22.5 59 Z" fill="#FFF7E8" />
      <path d="M17.6 58 L17.6 102" stroke="#fff" strokeOpacity=".5" strokeWidth="1" />
      {/* Mecha y llama */}
      <path d="M30 54 L30 46" stroke="#3a2c1c" strokeWidth="1.4" strokeLinecap="round" />
      <g className="lu-llama">
        <path d="M30 18 C 34 28 37 34 36 40 C 35 46 25 46 24 40 C 23 34 26 28 30 18 Z" fill={`url(#${id("llama")})`} />
        <path d="M30 34 C 32 38 32.5 41 31.5 43 C 30.5 44.5 29.5 44.5 28.5 43 C 27.5 41 28 38 30 34 Z" fill="#9FB8FF" opacity=".55" />
      </g>
    </svg>
  );
}

// Una flor blanca de cinco pétalos (tipo rosa de jardín abierta / cosmos)
// con pétalos sombreados, estambres dorados y una sombra suave.
function Flor({ x, y, s = 1, rot = 0, ids }) {
  const petalo = "M0 0 C -9 -6 -11 -20 -4 -27 C -1 -30 1 -30 4 -27 C 11 -20 9 -6 0 0 Z";
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx="2" cy="4" rx="26" ry="24" fill={`url(#${ids.sombra})`} />
      {[0, 72, 144, 216, 288].map((a) => <path key={a} d={petalo} transform={`rotate(${a + 36}) scale(1.05)`} fill={`url(#${ids.petaloAtras})`} />)}
      {[0, 72, 144, 216, 288].map((a) => <path key={a} d={petalo} transform={`rotate(${a})`} fill={`url(#${ids.petalo})`} stroke="#d8cdbd" strokeWidth=".35" />)}
      {[0, 72, 144, 216, 288].map((a) => <path key={a} d="M0 -4 C -1 -10 -1 -16 0 -22" transform={`rotate(${a})`} fill="none" stroke="#e2d7c6" strokeWidth=".5" />)}
      <circle r="5.5" fill={`url(#${ids.centro})`} />
      {Array.from({ length: 12 }, (_, k) => {
        const a = (k / 12) * Math.PI * 2;
        return <circle key={k} cx={(Math.cos(a) * 6.5).toFixed(2)} cy={(Math.sin(a) * 6.5).toFixed(2)} r=".9" fill="#C99A3E" />;
      })}
    </g>
  );
}

function HojaVerde({ x, y, l = 30, rot = 0, ids }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={hoja(l, l * 0.26)} fill={`url(#${ids.hoja})`} />
      <path d={`M1 0 Q ${l * 0.5} ${-l * 0.03} ${l - 2} 0`} fill="none" stroke="#dfe7cf" strokeOpacity=".7" strokeWidth=".6" />
      {[0.25, 0.45, 0.65].map((t) => (
        <path key={t} d={`M${l * t} 0 l ${l * 0.1} ${-l * 0.09} M${l * t} 0 l ${l * 0.1} ${l * 0.09}`} stroke="#dfe7cf" strokeOpacity=".45" strokeWidth=".4" />
      ))}
    </g>
  );
}

// SDXL: lu_flores
// Ramito horizontal de flores blancas con hojas de olivo, botones y nube
// (gypsophila). Sirve de remate arriba de tarjetas y del menú.
export function LuFlores({ className = "", espejo = false }) {
  const u = limpia(useId());
  const ids = {
    petalo: `lu-f-p-${u}`, petaloAtras: `lu-f-pa-${u}`, centro: `lu-f-c-${u}`, hoja: `lu-f-h-${u}`,
    sombra: `lu-f-s-${u}`, grano: `lu-f-g-${u}`,
  };
  return (
    <svg className={`lu-flores ${className}`} viewBox="0 0 220 110" aria-hidden="true">
      <defs>
        <radialGradient id={ids.petalo} cx="50%" cy="10%" r="95%">
          <stop offset="0" stopColor="#F1E8DA" />
          <stop offset=".4" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FBF6EE" />
        </radialGradient>
        <radialGradient id={ids.petaloAtras} cx="50%" cy="20%" r="90%">
          <stop offset="0" stopColor="#E3D7C5" />
          <stop offset="1" stopColor="#F6EFE3" />
        </radialGradient>
        <radialGradient id={ids.centro} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#F3D58A" />
          <stop offset=".6" stopColor="#C9A04A" />
          <stop offset="1" stopColor="#8C6A2A" />
        </radialGradient>
        <linearGradient id={ids.hoja} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8EA07E" />
          <stop offset=".6" stopColor="#6E8463" />
          <stop offset="1" stopColor="#4F6448" />
        </linearGradient>
        <radialGradient id={ids.sombra} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#3a2e1c" stopOpacity=".18" />
          <stop offset="1" stopColor="#3a2e1c" stopOpacity="0" />
        </radialGradient>
        <Grano id={ids.grano} fuerza={0.1} frecuencia={1.4} />
      </defs>
      <g filter={`url(#${ids.grano})`} transform={espejo ? "translate(220 0) scale(-1 1)" : undefined}>
        <path d="M10 70 C 60 62 120 58 210 44" fill="none" stroke="#6b7b5c" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M60 64 C 70 50 78 40 92 30" fill="none" stroke="#6b7b5c" strokeWidth="1.1" />
        <path d="M140 54 C 150 66 158 74 172 82" fill="none" stroke="#6b7b5c" strokeWidth="1.1" />
        <HojaVerde ids={ids} x={14} y={70} l={34} rot={160} />
        <HojaVerde ids={ids} x={28} y={68} l={30} rot={-150} />
        <HojaVerde ids={ids} x={46} y={66} l={30} rot={120} />
        <HojaVerde ids={ids} x={92} y={30} l={24} rot={-30} />
        <HojaVerde ids={ids} x={74} y={46} l={26} rot={-120} />
        <HojaVerde ids={ids} x={170} y={48} l={30} rot={-40} />
        <HojaVerde ids={ids} x={186} y={46} l={28} rot={30} />
        <HojaVerde ids={ids} x={204} y={45} l={22} rot={-10} />
        <HojaVerde ids={ids} x={160} y={74} l={26} rot={60} />
        <HojaVerde ids={ids} x={120} y={58} l={28} rot={100} />
        {/* Nube (gypsophila) */}
        <g fill="#FFFFFF" stroke="#d9cfbf" strokeWidth=".3">
          {Array.from({ length: 22 }, (_, k) => (
            <circle key={k} cx={(40 + azar(k + 300) * 150).toFixed(1)} cy={(30 + azar(k + 340) * 46).toFixed(1)} r={(1.4 + azar(k + 380) * 1.4).toFixed(2)} />
          ))}
        </g>
        <Flor ids={ids} x={106} y={52} s={1.08} rot={8} />
        <Flor ids={ids} x={66} y={62} s={0.78} rot={-20} />
        <Flor ids={ids} x={150} y={50} s={0.86} rot={30} />
        {/* Botones */}
        <g>
          <ellipse cx="94" cy="28" rx="5" ry="7" transform="rotate(30 94 28)" fill={`url(#${ids.petalo})`} stroke="#d8cdbd" strokeWidth=".4" />
          <path d="M90 33 C 92 30 96 30 98 33" fill="#7d8f6c" />
          <ellipse cx="174" cy="82" rx="4.5" ry="6.5" transform="rotate(-50 174 82)" fill={`url(#${ids.petalo})`} stroke="#d8cdbd" strokeWidth=".4" />
        </g>
      </g>
    </svg>
  );
}

// ---------- Cubiertos (plata, vistos desde arriba) ----------
// Tenedor y cuchillo acostados a lo largo del eje x (la punta hacia +x),
// centrados en el origen; ~54 de largo.
function Tenedor({ fill }) {
  return (
    <g fill={fill}>
      <rect x="-27" y="-1.9" width="34" height="3.8" rx="1.9" />
      <path d="M6 -1.6 C 10 -2.2 12 -4.6 15 -4.6 L 15 4.6 C 12 4.6 10 2.2 6 1.6 Z" />
      {[-3.8, -1.3, 1.3, 3.8].map((y) => <rect key={y} x="14" y={y - 0.55} width="14" height="1.1" rx=".55" />)}
    </g>
  );
}
function Cuchillo({ fill }) {
  return (
    <g fill={fill}>
      <rect x="-27" y="-2.1" width="27" height="4.2" rx="2.1" />
      <path d="M-1 -1.7 L 24 -1.9 C 28 -1.6 29.5 .2 27.5 1.6 L -1 2.1 Z" />
    </g>
  );
}

// Un puesto lateral visto desde arriba: plato de base en latón, plato,
// servilleta de lino doblada con ramita, tenedor a la izquierda del
// comensal, cuchillo a la derecha y copa. Dibujado para quien se sienta del
// lado izquierdo (mira hacia +x); el lado derecho se gira 180°.
function PuestoCenital({ x, y, girar, ids }) {
  return (
    <g transform={`translate(${x} ${y})${girar ? " rotate(180)" : ""}`}>
      <circle cx="3" cy="5" r="34" fill="#20190f" opacity=".2" filter={`url(#${ids.difuso})`} />
      <circle r="33" fill={`url(#${ids.laton})`} />
      <circle r="29" fill={`url(#${ids.plato})`} />
      <circle r="25.5" fill="none" style={{ stroke: tema("gold", 0.55) }} strokeWidth=".6" />
      <circle r="18" fill="none" stroke="#e1d8c9" strokeWidth="1.2" />
      {/* Servilleta doblada con una ramita */}
      <g transform="rotate(-8)">
        <rect x="-9" y="-14" width="18" height="28" rx="1.5" fill={`url(#${ids.servilleta})`} />
        <path d="M-9 -2 H9" stroke="#d8ccb6" strokeWidth=".7" />
        <path d={hoja(13, 3)} transform="translate(-4 -6) rotate(-60)" fill={`url(#${ids.hoja})`} />
        <path d={hoja(11, 2.6)} transform="translate(-4 -6) rotate(-120)" fill={`url(#${ids.hoja})`} />
      </g>
      <g transform="translate(0 -45)"><Tenedor fill={`url(#${ids.plata})`} /></g>
      <g transform="translate(0 45)"><Cuchillo fill={`url(#${ids.plata})`} /></g>
      {/* Copa vista desde arriba: borde fino, vino claro y brillo */}
      <g transform="translate(38 30)">
        <circle cx="3" cy="4" r="10" fill="#20190f" opacity=".14" filter={`url(#${ids.difuso})`} />
        <circle r="9.5" fill={`url(#${ids.copa})`} stroke="#b9b4ab" strokeWidth=".6" />
        <circle r="6" fill="#fff" opacity=".35" />
        <path d="M-6 -4 A 7 7 0 0 1 -1 -7.5" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".9" />
      </g>
    </g>
  );
}

// Silla de madera con respaldo curvo, vista desde arriba (asiento de lado
// izquierdo; el derecho se gira).
function SillaCenital({ x, y, girar, ids }) {
  return (
    <g transform={`translate(${x} ${y})${girar ? " rotate(180)" : ""}`}>
      <rect x="-2" y="-21" width="44" height="42" rx="7" fill="#20190f" opacity=".22" filter={`url(#${ids.difuso})`} />
      <rect x="-6" y="-20" width="44" height="40" rx="6" fill={`url(#${ids.madera})`} />
      <rect x="-1" y="-15" width="34" height="30" rx="4" fill={`url(#${ids.cojin})`} />
      <path d="M-8 -22 C -16 -10 -16 10 -8 22" fill="none" stroke="#6b4a2d" strokeWidth="6" strokeLinecap="round" />
      <path d="M-9 -20 C -15 -9 -15 9 -9 20" fill="none" stroke="#a87c52" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
    </g>
  );
}

// Bombilla vista desde arriba: el casquillo oscuro al centro, el globo de
// vidrio alrededor y su sombra corrida sobre el mantel. Encendida
// (.lu-luces-on) el vidrio se vuelve ámbar y se abre el halo.
function BombillaCenital({ x, y, i, ids }) {
  return (
    <g className="lu-bombilla" style={{ "--i": i }} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      <ellipse className="lu-sombra-bombilla" cx="9" cy="13" rx="9" ry="8" fill="#1d1a14" opacity=".3" filter={`url(#${ids.difuso})`} />
      <circle className="lu-halo" r="44" fill={`url(#${ids.halo})`} />
      <circle r="9" fill={`url(#${ids.vidrio})`} stroke="rgb(60 64 80 / .35)" strokeWidth=".6" />
      <circle className="lu-vidrio-luz" r="9" fill={`url(#${ids.luz})`} />
      <circle r="3.6" fill={`url(#${ids.casquillo})`} />
      <circle r="1.6" fill="#0f1116" opacity=".6" />
      <ellipse cx="-4" cy="-4.4" rx="2.4" ry="1.4" fill="#fff" opacity=".85" transform="rotate(-38 -4 -4.4)" />
    </g>
  );
}

// Vela del camino de mesa vista desde arriba, en su platito de latón. La
// llama (un punto de luz con halo) se enciende al final, tras las bombillas.
function VelaCenital({ x, y, k, ids }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="3" cy="4" r="11" fill="#20190f" opacity=".22" filter={`url(#${ids.difuso})`} />
      <circle r="10.5" fill={`url(#${ids.laton})`} />
      <circle r="6.6" fill={`url(#${ids.cera})`} />
      <circle r="4.2" fill="none" stroke="#e6dac4" strokeWidth=".8" />
      <circle r="1.1" fill="#3a2c1c" />
      <g className="lu-vela-cenital" style={{ "--k": k }}>
        <circle r="34" fill={`url(#${ids.halo})`} />
        <circle r="3.2" fill="#FFF6D8" />
        <circle r="1.6" fill="#FFFFFF" />
      </g>
    </g>
  );
}

const FILAS = [330, 470, 610, 750];
const VELAS_CAMINO = [[181, 300], [211, 372], [179, 452], [212, 540], [180, 622], [211, 712], [181, 800]];
const GUIRNALDAS = [
  { y: 4, caida: 20, n: 6 },
  { y: 282, caida: 22, n: 7 },
  { y: 650, caida: 22, n: 7 },
];
const FLORES_CAMINO = Array.from({ length: 9 }, (_, k) => ({
  x: 195 + (k % 2 ? 11 : -11) + (azar(k + 900) - 0.5) * 6,
  y: 296 + k * 66 + azar(k + 910) * 14,
  s: 0.42 + azar(k + 920) * 0.16,
  rot: Math.round(azar(k + 930) * 70),
}));
const HOJAS_CAMINO = Array.from({ length: 64 }, (_, k) => {
  const lado = k % 2 ? 1 : -1;
  const y = 262 + k * 9.6;
  const x = 195 + Math.sin(y / 46) * 6;
  const sube = azar(k + 700) > 0.55;
  const a = (sube ? -90 : 90) + lado * (35 + azar(k + 710) * 45);
  return { x, y, a, l: 18 + azar(k + 720) * 12 };
});

// SDXL: lu_mesa_cenital
// La mesa larga de banquete vista desde arriba, como una foto cenital: piso
// de losas, sillas de madera, mantel de lino con pliegues, puestos con plato
// de latón, servilleta y cubiertos, un camino de olivo y flores blancas con
// velas sin encender, y tres guirnaldas de bombillas apagadas que cruzan la
// mesa. Con .lu-luces-on: el velo frío (azul del tema) se va, entra el
// cálido, las bombillas se encienden una a una y al final las velas.
// La cabecera queda libre: ahí va el puesto del invitado (HTML encima).
export function LuMesaCenital({ className = "" }) {
  const u = limpia(useId());
  const id = (n) => `lu-mc-${n}-${u}`;
  const ids = {
    halo: id("halo"), vidrio: id("vidrio"), luz: id("luz"), casquillo: id("casq"), charco: id("charco"),
    difuso: id("difuso"), laton: id("laton"), plato: id("plato"), servilleta: id("serv"), plata: id("plata"),
    copa: id("copa"), hoja: id("hoja"), madera: id("madera"), cojin: id("cojin"), cera: id("cera"),
    petalo: id("p"), petaloAtras: id("pa"), centro: id("c"), sombra: id("s"),
  };
  const cable = mezcla(tema("ink"), 80, "#000");
  let cuenta = 0;
  const lineas = GUIRNALDAS.map((g) => {
    const p0 = [-12, g.y], p1 = [195, g.y + g.caida * 2], p2 = [402, g.y];
    const pto = (t) => {
      const v = 1 - t;
      return [v * v * p0[0] + 2 * v * t * p1[0] + t * t * p2[0], v * v * p0[1] + 2 * v * t * p1[1] + t * t * p2[1]];
    };
    const bombillas = Array.from({ length: g.n }, (_, k) => {
      const [x, y] = pto((k + 0.5) / g.n);
      return { x, y, i: cuenta++ };
    });
    return { d: `M${p0[0]} ${p0[1]} Q ${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`, bombillas };
  });
  return (
    <svg className={`lu-mesa-cenital ${className}`} viewBox="0 0 390 844" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <defs>
        <pattern id={id("losas")} width="96" height="64" patternUnits="userSpaceOnUse">
          <rect width="96" height="64" fill="#d6cbb9" />
          <rect x="1" y="1" width="46" height="30" rx="2" fill="#ddd2c1" />
          <rect x="49" y="1" width="46" height="30" rx="2" fill="#d2c6b3" />
          <rect x="-23" y="33" width="46" height="30" rx="2" fill="#d0c4b0" />
          <rect x="25" y="33" width="46" height="30" rx="2" fill="#dbd0bf" />
          <rect x="73" y="33" width="46" height="30" rx="2" fill="#d4c8b5" />
        </pattern>
        <filter id={id("manchas")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="12" />
          <feColorMatrix values="0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .24  0 0 0 .5 -.12" />
        </filter>
        <filter id={id("hilos")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".85 .012" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 .5  0 0 0 0 .42  0 0 0 0 .3  0 0 0 .55 -.2" />
        </filter>
        <filter id={id("trama")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".012 .85" numOctaves="2" seed="9" />
          <feColorMatrix values="0 0 0 0 .5  0 0 0 0 .42  0 0 0 0 .3  0 0 0 .45 -.2" />
        </filter>
        <filter id={ids.difuso} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" /></filter>
        <filter id={id("sombra-mesa")} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9" /></filter>
        <clipPath id={id("mesa")}><rect x="52" y="28" width="286" height="840" rx="3" /></clipPath>
        <linearGradient id={id("mantel")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E3D8C5" />
          <stop offset=".07" stopColor="#F6F0E5" />
          <stop offset=".5" stopColor="#FCF9F3" />
          <stop offset=".93" stopColor="#F4EDE1" />
          <stop offset="1" stopColor="#DDD1BC" />
        </linearGradient>
        <linearGradient id={id("pliegue")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d9ccb6" stopOpacity="0" />
          <stop offset=".45" stopColor="#d9ccb6" stopOpacity=".55" />
          <stop offset=".55" stopColor="#ffffff" stopOpacity=".8" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("pliegue-h")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9ccb6" stopOpacity="0" />
          <stop offset=".45" stopColor="#d9ccb6" stopOpacity=".45" />
          <stop offset=".55" stopColor="#ffffff" stopOpacity=".7" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={ids.plato} cx="45%" cy="40%" r="60%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".7" stopColor="#F8F5EF" />
          <stop offset="1" stopColor="#E4DCCF" />
        </radialGradient>
        <linearGradient id={ids.laton} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: tema("gold-light") }} />
          <stop offset=".45" style={{ stopColor: tema("gold") }} />
          <stop offset=".7" style={{ stopColor: tema("gold-light") }} />
          <stop offset="1" style={{ stopColor: tema("gold-dark") }} />
        </linearGradient>
        <linearGradient id={ids.servilleta} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3ECDF" />
          <stop offset=".5" stopColor="#E7DCC8" />
          <stop offset="1" stopColor="#D8CAB1" />
        </linearGradient>
        <linearGradient id={ids.plata} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2F3F5" />
          <stop offset=".5" stopColor="#B8BCC2" />
          <stop offset="1" stopColor="#8A8F96" />
        </linearGradient>
        <radialGradient id={ids.copa} cx="40%" cy="40%" r="70%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".7" />
          <stop offset=".8" stopColor="#E9E4DA" stopOpacity=".5" />
          <stop offset="1" stopColor="#B9B2A6" stopOpacity=".7" />
        </radialGradient>
        <linearGradient id={ids.hoja} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#93A584" />
          <stop offset=".6" stopColor="#6E8463" />
          <stop offset="1" stopColor="#4F6448" />
        </linearGradient>
        <linearGradient id={ids.madera} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a5534" />
          <stop offset=".5" stopColor="#a47a50" />
          <stop offset="1" stopColor="#80593a" />
        </linearGradient>
        <linearGradient id={ids.cojin} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EFE6D6" />
          <stop offset="1" stopColor="#D5C8B1" />
        </linearGradient>
        <radialGradient id={ids.cera} cx="45%" cy="40%" r="60%">
          <stop offset="0" stopColor="#FFFDF6" />
          <stop offset="1" stopColor="#E6D8BF" />
        </radialGradient>
        <radialGradient id={ids.halo} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFF4D6" stopOpacity=".95" />
          <stop offset=".22" style={{ stopColor: tema("gold-light"), stopOpacity: 0.6 }} />
          <stop offset=".6" style={{ stopColor: tema("gold"), stopOpacity: 0.16 }} />
          <stop offset="1" style={{ stopColor: tema("gold"), stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={ids.charco} cx="50%" cy="50%" r="50%">
          <stop offset="0" style={{ stopColor: tema("gold-light"), stopOpacity: 0.55 }} />
          <stop offset=".55" style={{ stopColor: tema("gold-light"), stopOpacity: 0.2 }} />
          <stop offset="1" style={{ stopColor: tema("gold-light"), stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={ids.vidrio} cx="38%" cy="34%" r="72%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".95" />
          <stop offset=".55" stopColor="#E4E0D8" stopOpacity=".75" />
          <stop offset="1" stopColor="#9E998F" stopOpacity=".8" />
        </radialGradient>
        <radialGradient id={ids.luz} cx="45%" cy="42%" r="62%">
          <stop offset="0" stopColor="#FFFDF4" />
          <stop offset=".4" stopColor="#FFE9B8" />
          <stop offset=".85" style={{ stopColor: tema("gold-light") }} />
          <stop offset="1" style={{ stopColor: tema("gold") }} />
        </radialGradient>
        <radialGradient id={ids.casquillo} cx="40%" cy="40%" r="65%">
          <stop offset="0" stopColor="#6a6d75" />
          <stop offset="1" stopColor="#1c1e24" />
        </radialGradient>
        <radialGradient id={ids.petalo} cx="50%" cy="10%" r="95%">
          <stop offset="0" stopColor="#F1E8DA" />
          <stop offset=".4" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FBF6EE" />
        </radialGradient>
        <radialGradient id={ids.petaloAtras} cx="50%" cy="20%" r="90%">
          <stop offset="0" stopColor="#E3D7C5" />
          <stop offset="1" stopColor="#F6EFE3" />
        </radialGradient>
        <radialGradient id={ids.centro} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#F3D58A" />
          <stop offset=".6" stopColor="#C9A04A" />
          <stop offset="1" stopColor="#8C6A2A" />
        </radialGradient>
        <radialGradient id={ids.sombra} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#3a2e1c" stopOpacity=".22" />
          <stop offset="1" stopColor="#3a2e1c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("calido")} cx="50%" cy="45%" r="70%">
          <stop offset="0" style={{ stopColor: tema("gold-light") }} />
          <stop offset="1" style={{ stopColor: tema("gold") }} />
        </radialGradient>
        <radialGradient id={id("vineta")} cx="50%" cy="45%" r="75%">
          <stop offset=".6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".28" />
        </radialGradient>
        <Grano id={id("grano")} fuerza={0.1} frecuencia={1.1} />
      </defs>

      <g filter={`url(#${id("grano")})`}>
        {/* Piso de losas */}
        <rect width="390" height="844" fill={`url(#${id("losas")})`} />
        <rect width="390" height="844" filter={`url(#${id("manchas")})`} opacity=".7" />

        {/* Sillas (debajo de la mesa) */}
        <g transform="translate(195 6) rotate(90)"><SillaCenital x={0} y={0} ids={ids} /></g>
        {FILAS.map((y) => (
          <g key={y}>
            <SillaCenital x={18} y={y} ids={ids} />
            <SillaCenital x={372} y={y} girar ids={ids} />
          </g>
        ))}

        {/* Sombra de la mesa y mantel de lino */}
        <rect x="60" y="40" width="290" height="840" fill="#1d160c" opacity=".32" filter={`url(#${id("sombra-mesa")})`} />
        <rect x="52" y="28" width="286" height="840" rx="3" fill={`url(#${id("mantel")})`} />
        <g clipPath={`url(#${id("mesa")})`}>
          <rect x="52" y="28" width="286" height="840" filter={`url(#${id("hilos")})`} opacity=".55" />
          <rect x="52" y="28" width="286" height="840" filter={`url(#${id("trama")})`} opacity=".45" />
          {/* Pliegues de planchado */}
          {[124, 266].map((x) => <rect key={x} x={x - 5} y="28" width="10" height="840" fill={`url(#${id("pliegue")})`} />)}
          {[236, 448, 660].map((y) => <rect key={y} x="52" y={y - 4} width="286" height="8" fill={`url(#${id("pliegue-h")})`} />)}
          <rect x="52" y="28" width="286" height="840" fill="none" stroke="#cbbda5" strokeWidth="2" opacity=".6" />
        </g>

        {/* Camino de olivo con flores blancas */}
        <g>
          {HOJAS_CAMINO.map((h, k) => (
            <path key={k} d={hoja(h.l, h.l * 0.22)} transform={`translate(${h.x.toFixed(1)} ${h.y.toFixed(1)}) rotate(${h.a.toFixed(1)})`} fill={`url(#${ids.hoja})`} opacity={0.82 + azar(k + 730) * 0.18} />
          ))}
          <g fill="#FFFFFF" stroke="#d9cfbf" strokeWidth=".3">
            {Array.from({ length: 70 }, (_, k) => (
              <circle key={k} cx={(195 + (azar(k + 800) - 0.5) * 46).toFixed(1)} cy={(270 + azar(k + 810) * 590).toFixed(1)} r={(1 + azar(k + 820) * 1.2).toFixed(2)} />
            ))}
          </g>
          {FLORES_CAMINO.map((f, k) => <Flor key={k} ids={ids} x={f.x} y={f.y} s={f.s} rot={f.rot} />)}
        </g>
        {VELAS_CAMINO.map(([x, y], k) => <VelaCenital key={k} x={x} y={y} k={k} ids={ids} />)}

        {/* Puestos a lado y lado */}
        {FILAS.map((y) => (
          <g key={y}>
            <PuestoCenital x={100} y={y} ids={ids} />
            <PuestoCenital x={290} y={y} girar ids={ids} />
          </g>
        ))}

        {/* Velo frío (antes) y luz cálida (después) */}
        <rect className="lu-velo-frio" width="390" height="844" style={{ fill: tema("seal"), mixBlendMode: "multiply" }} />
        <rect className="lu-velo-calido" width="390" height="844" fill={`url(#${id("calido")})`} style={{ mixBlendMode: "multiply" }} />
        <rect width="390" height="844" fill={`url(#${id("vineta")})`} />

        {/* Charcos de luz que cada bombilla deja sobre la mesa */}
        {lineas.flatMap((l) => l.bombillas.map((b) => (
          <g key={`ch${b.i}`} className="lu-bombilla" style={{ "--i": b.i }}>
            <ellipse className="lu-vidrio-luz" cx={b.x + 10} cy={b.y + 16} rx="70" ry="58" fill={`url(#${ids.charco})`} />
          </g>
        )))}

        {/* Guirnaldas: cable y bombillas */}
        {lineas.map((l, k) => (
          <g key={k}>
            <path d={l.d} fill="none" stroke="#1d160c" strokeWidth="1.6" opacity=".18" transform="translate(9 13)" filter={`url(#${ids.difuso})`} />
            <path d={l.d} fill="none" style={{ stroke: cable }} strokeWidth="1.4" />
            {l.bombillas.map((b) => <BombillaCenital key={b.i} x={b.x} y={b.y} i={b.i} ids={ids} />)}
          </g>
        ))}
      </g>
    </svg>
  );
}

// SDXL: lu_plato
// Plato de la cabecera visto desde arriba: plato de base en latón, plato de
// loza con filete del tema, tenedor y cuchillo de plata. Encima va la
// tarjeta de puesto con el nombre del invitado (HTML).
export function LuPlato({ className = "" }) {
  const u = limpia(useId());
  const id = (n) => `lu-pl-${n}-${u}`;
  return (
    <svg className={`lu-plato ${className}`} viewBox="0 0 240 200" aria-hidden="true">
      <defs>
        <radialGradient id={id("loza")} cx="44%" cy="38%" r="62%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".72" stopColor="#F9F6F0" />
          <stop offset="1" stopColor="#E2D9CB" />
        </radialGradient>
        <radialGradient id={id("fondo")} cx="56%" cy="60%" r="60%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EEE8DE" />
        </radialGradient>
        <linearGradient id={id("laton")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: tema("gold-light") }} />
          <stop offset=".4" style={{ stopColor: tema("gold") }} />
          <stop offset=".65" style={{ stopColor: tema("gold-light") }} />
          <stop offset="1" style={{ stopColor: tema("gold-dark") }} />
        </linearGradient>
        <linearGradient id={id("plata")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F5F7" />
          <stop offset=".5" stopColor="#B8BCC2" />
          <stop offset="1" stopColor="#868B92" />
        </linearGradient>
        <filter id={id("difuso")} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id={id("difuso2")} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6" /></filter>
        <Grano id={id("grano")} fuerza={0.08} frecuencia={1.3} />
      </defs>
      <g filter={`url(#${id("grano")})`}>
        <circle cx="126" cy="108" r="84" fill="#20190f" opacity=".24" filter={`url(#${id("difuso")})`} />
        <circle cx="120" cy="100" r="84" fill={`url(#${id("laton")})`} />
        <circle cx="120" cy="100" r="80" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth=".8" />
        <circle cx="120" cy="100" r="74" fill={`url(#${id("loza")})`} />
        <circle cx="120" cy="100" r="68" fill="none" style={{ stroke: tema("gold", 0.7) }} strokeWidth="1" />
        <circle cx="120" cy="100" r="48" fill={`url(#${id("fondo")})`} stroke="#e3dacb" strokeWidth="2" />
        <path d="M78 66 A 56 56 0 0 1 150 50" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
        <g filter={`url(#${id("difuso2")})`} opacity=".25" fill="#20190f">
          <rect x="23" y="38" width="6" height="130" rx="3" />
          <rect x="215" y="38" width="6" height="130" rx="3" />
        </g>
        <g transform="translate(22 100) rotate(-90) scale(2.3)"><Tenedor fill={`url(#${id("plata")})`} /></g>
        <g transform="translate(218 100) rotate(-90) scale(2.3)"><Cuchillo fill={`url(#${id("plata")})`} /></g>
      </g>
    </svg>
  );
}

// Puesto en miniatura (línea fina): plato con tenedor y cuchillo. Uno por
// cada pase del invitado.
export function LuCubierto({ className = "" }) {
  return (
    <svg className={`lu-cubierto ${className}`} viewBox="0 0 40 24" aria-hidden="true">
      <circle cx="20" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="20" cy="12" r="5.2" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".6" />
      <path d="M5 3.5 V20.5 M3 3.5 V8 Q5 10 7 8 V3.5" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M35 20.5 V3.5 C 37.6 6 37.6 10 35 12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// SDXL: lu_portavela
// Candelero bajo de latón (vista de lado) para la cuenta regresiva.
export function LuPortavela({ className = "" }) {
  const u = limpia(useId());
  const id = (n) => `lu-pv-${n}-${u}`;
  return (
    <svg className={`lu-portavela ${className}`} viewBox="0 0 60 34" aria-hidden="true">
      <defs>
        <linearGradient id={id("laton")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: tema("gold-dark") }} />
          <stop offset=".35" style={{ stopColor: tema("gold-light") }} />
          <stop offset=".6" style={{ stopColor: tema("gold") }} />
          <stop offset="1" style={{ stopColor: tema("gold-dark") }} />
        </linearGradient>
        <radialGradient id={id("sombra")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#2a2216" stopOpacity=".35" />
          <stop offset="1" stopColor="#2a2216" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="31" rx="29" ry="3" fill={`url(#${id("sombra")})`} />
      <path d="M8 29 C 8 24 22 23 24 20 L 36 20 C 38 23 52 24 52 29 Z" fill={`url(#${id("laton")})`} />
      <ellipse cx="30" cy="20" rx="7" ry="2" fill={`url(#${id("laton")})`} />
      <path d="M26 20 C 26 15 23 14 23 11 L 37 11 C 37 14 34 15 34 20 Z" fill={`url(#${id("laton")})`} />
      <path d="M18 7 L 42 7 L 40 11 L 20 11 Z" fill={`url(#${id("laton")})`} />
      <ellipse cx="30" cy="7" rx="12" ry="2.2" style={{ fill: tema("gold-light") }} />
      <path d="M14 27 C 18 25 22 24.5 25 22" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth=".8" />
    </svg>
  );
}

// Llama suelta (vista de lado) con halo, para las velas de la cuenta.
export function LuLlama({ className = "" }) {
  const u = limpia(useId());
  const id = (n) => `lu-ll-${n}-${u}`;
  return (
    <svg className={`lu-llama-sola ${className}`} viewBox="0 0 40 56" aria-hidden="true">
      <defs>
        <radialGradient id={id("halo")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFF0C8" stopOpacity=".9" />
          <stop offset=".35" style={{ stopColor: tema("gold-light"), stopOpacity: 0.45 }} />
          <stop offset="1" style={{ stopColor: tema("gold"), stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={id("llama")} cx="50%" cy="72%" r="65%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".3" stopColor="#FFF4C2" />
          <stop offset=".65" stopColor="#FFC65C" />
          <stop offset="1" stopColor="#E98A2C" stopOpacity=".9" />
        </radialGradient>
      </defs>
      <circle className="lu-vela-halo" cx="20" cy="30" r="20" fill={`url(#${id("halo")})`} />
      <path d="M20 50 L20 56" stroke="#3a2c1c" strokeWidth="1.3" strokeLinecap="round" />
      <g className="lu-llama">
        <path d="M20 22 C 23.5 31 26 36 25 42 C 24 48 16 48 15 42 C 14 36 16.5 31 20 22 Z" fill={`url(#${id("llama")})`} />
        <path d="M20 37 C 21.6 40 22 43 21.2 45 C 20.6 46.2 19.4 46.2 18.8 45 C 18 43 18.4 40 20 37 Z" fill="#9FB8FF" opacity=".55" />
      </g>
    </svg>
  );
}

// Una copa de champaña (flauta) dibujada con la base en el origen.
function Flauta({ ids, burbujas = 0 }) {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="25" ry="5" fill={`url(#${ids.vidrio})`} stroke="#c9c3b8" strokeWidth=".6" />
      <path d="M-24 -1 Q 0 4 24 -1" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1" />
      <rect x="-1.8" y="-74" width="3.6" height="73" fill={`url(#${ids.tallo})`} />
      <path d="M-7 -72 C -19 -100 -22 -152 -20 -194 L 20 -194 C 22 -152 19 -100 7 -72 Z" fill={`url(#${ids.vidrio})`} stroke="#bdb6aa" strokeWidth=".7" />
      <path d="M-6.4 -80 C -17 -104 -19.6 -136 -19.2 -160 L 19.2 -160 C 19.6 -136 17 -104 6.4 -80 Z" fill={`url(#${ids.champana})`} />
      <ellipse cx="0" cy="-160" rx="19.2" ry="2.6" style={{ fill: tema("gold-light") }} opacity=".9" />
      <ellipse cx="0" cy="-160" rx="19.2" ry="2.6" fill="#fff" opacity=".35" />
      {Array.from({ length: 7 }, (_, k) => (
        <circle key={k} className="lu-burbuja" cx={(-9 + azar(k + burbujas) * 18).toFixed(1)} cy={(-92 - azar(k + burbujas + 40) * 20).toFixed(1)} r={(0.8 + azar(k + burbujas + 80) * 0.9).toFixed(2)} fill="#FFFBEA" style={{ "--b": `${Math.round(azar(k + burbujas + 120) * 2400)}ms` }} />
      ))}
      <ellipse cx="0" cy="-194" rx="20" ry="3" fill="none" stroke="#fff" strokeWidth="1" opacity=".9" />
      <path d="M-14 -186 C -16 -150 -14 -112 -6 -86" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity=".75" />
      <path d="M12 -180 C 13 -150 12 -120 7 -100" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity=".5" />
    </g>
  );
}

// SDXL: lu_brindis
// Cierre: dos copas de champaña que brindan bajo las luces, con burbujas que
// suben, un destello en el choque y destellos cálidos desenfocados detrás.
export function LuBrindis({ className = "" }) {
  const u = limpia(useId());
  const id = (n) => `lu-br-${n}-${u}`;
  const ids = { vidrio: id("vidrio"), tallo: id("tallo"), champana: id("champana") };
  return (
    <svg className={`lu-brindis ${className}`} viewBox="0 0 400 270" aria-hidden="true">
      <defs>
        <linearGradient id={ids.vidrio} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".55" />
          <stop offset=".3" stopColor="#F4F1EA" stopOpacity=".25" />
          <stop offset=".7" stopColor="#E8E3D9" stopOpacity=".2" />
          <stop offset="1" stopColor="#C9C2B4" stopOpacity=".55" />
        </linearGradient>
        <linearGradient id={ids.tallo} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d8d2c6" />
          <stop offset=".5" stopColor="#ffffff" />
          <stop offset="1" stopColor="#bfb8ab" />
        </linearGradient>
        <linearGradient id={ids.champana} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: tema("gold-light") }} />
          <stop offset=".6" style={{ stopColor: mezcla(tema("gold-light"), 60, tema("gold")) }} />
          <stop offset="1" style={{ stopColor: tema("gold") }} />
        </linearGradient>
        <radialGradient id={id("bokeh")} cx="50%" cy="50%" r="50%">
          <stop offset="0" style={{ stopColor: tema("gold-light"), stopOpacity: 0.75 }} />
          <stop offset=".7" style={{ stopColor: tema("gold-light"), stopOpacity: 0.3 }} />
          <stop offset="1" style={{ stopColor: tema("gold-light"), stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={id("chispa")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".3" stopColor="#FFF3CF" stopOpacity=".9" />
          <stop offset="1" style={{ stopColor: tema("gold-light"), stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={id("sombra")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#2a2216" stopOpacity=".28" />
          <stop offset="1" stopColor="#2a2216" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Luces desenfocadas detrás */}
      {Array.from({ length: 11 }, (_, k) => (
        <circle key={k} className="lu-bokeh" cx={(20 + azar(k + 500) * 360).toFixed(0)} cy={(20 + azar(k + 520) * 150).toFixed(0)} r={(10 + azar(k + 540) * 16).toFixed(0)} fill={`url(#${id("bokeh")})`} style={{ "--d": `${k * 260}ms` }} />
      ))}
      <ellipse cx="200" cy="254" rx="120" ry="9" fill={`url(#${id("sombra")})`} />
      <g className="lu-copa lu-copa-izq" style={{ transformOrigin: "140px 252px" }}>
        <g transform="translate(140 252)"><Flauta ids={ids} burbujas={0} /></g>
      </g>
      <g className="lu-copa lu-copa-der" style={{ transformOrigin: "260px 252px" }}>
        <g transform="translate(260 252)"><Flauta ids={ids} burbujas={200} /></g>
      </g>
      <g className="lu-chispa" style={{ transformOrigin: "200px 64px" }}>
        <circle cx="200" cy="64" r="30" fill={`url(#${id("chispa")})`} />
        <path d="M200 36 L202 60 L226 64 L202 68 L200 92 L198 68 L174 64 L198 60 Z" fill="#FFFDF2" opacity=".9" />
      </g>
    </svg>
  );
}

// Botón de música: una bombilla colgada de su cable. Encendida cuando suena.
export function LuBombillaBoton({ className = "" }) {
  const u = limpia(useId());
  const id = (n) => `lu-bb-${n}-${u}`;
  return (
    <svg className={`lu-bombilla-boton ${className}`} viewBox="0 0 48 84" aria-hidden="true">
      <defs>
        <radialGradient id={id("halo")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFF4D6" stopOpacity=".95" />
          <stop offset=".35" style={{ stopColor: tema("gold-light"), stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: tema("gold"), stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={id("vidrio")} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".95" />
          <stop offset=".55" stopColor="#ECE8E0" stopOpacity=".85" />
          <stop offset="1" stopColor="#A9A49C" stopOpacity=".85" />
        </radialGradient>
        <radialGradient id={id("luz")} cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#FFFDF4" />
          <stop offset=".4" stopColor="#FFE9B8" />
          <stop offset=".85" style={{ stopColor: tema("gold-light") }} />
          <stop offset="1" style={{ stopColor: tema("gold") }} />
        </radialGradient>
        <linearGradient id={id("casq")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a2d34" />
          <stop offset=".45" stopColor="#62656d" />
          <stop offset="1" stopColor="#1c1e24" />
        </linearGradient>
      </defs>
      <line x1="24" y1="0" x2="24" y2="26" stroke="#2a2d34" strokeWidth="1.4" />
      <circle className="lu-bb-halo" cx="24" cy="56" r="24" fill={`url(#${id("halo")})`} />
      <rect x="18" y="25" width="12" height="13" rx="1.6" fill={`url(#${id("casq")})`} />
      <path d="M18 29.5 h12 M18 33.5 h12" stroke="#0f1116" strokeWidth=".7" opacity=".6" />
      <circle cx="24" cy="54" r="15" fill={`url(#${id("vidrio")})`} stroke="rgb(60 64 80 / .35)" strokeWidth=".7" />
      <circle className="lu-bb-luz" cx="24" cy="54" r="15" fill={`url(#${id("luz")})`} />
      <path className="lu-bb-filamento" d="M20.5 40 L20.5 52 Q 24 58 27.5 52 L27.5 40" fill="none" strokeWidth="1" strokeLinecap="round" />
      <ellipse cx="18.5" cy="47" rx="2.6" ry="4.4" fill="#fff" opacity=".75" transform="rotate(24 18.5 47)" />
    </svg>
  );
}

// Íconos de línea que leen el color del texto.
const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" };
export const Icono = {
  pin: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  copiar: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>,
  musica: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>,
  pausa: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>,
  sobre: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="1.5" /><path d="M3.5 7l8.5 6.5L20.5 7" /></svg>,
  whatsapp: <svg viewBox="0 0 24 24" {...trazo} aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8.5 19z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-.9.8a4 4 0 0 1-2.2-2.2l.8-.9-1-2z" /></svg>,
};

// Cordel con borla de la entrada: cuerda trenzada y borla de hilo ámbar.
export function LuBorla({ className = "" }) {
  const u = limpia(useId());
  const id = (n) => `lu-borla-${n}-${u}`;
  return (
    <svg className={`lu-borla ${className}`} viewBox="0 0 40 90" aria-hidden="true">
      <defs>
        <linearGradient id={id("hilo")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: tema("gold-dark") }} />
          <stop offset=".35" style={{ stopColor: tema("gold-light") }} />
          <stop offset=".65" style={{ stopColor: tema("gold") }} />
          <stop offset="1" style={{ stopColor: tema("gold-dark") }} />
        </linearGradient>
        <radialGradient id={id("nudo")} cx="40%" cy="35%" r="70%">
          <stop offset="0" style={{ stopColor: tema("gold-light") }} />
          <stop offset="1" style={{ stopColor: tema("gold-dark") }} />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="12" rx="7" ry="8" fill={`url(#${id("nudo")})`} />
      <path d="M13 20 Q 20 17 27 20 L 27 25 Q 20 28 13 25 Z" fill={`url(#${id("hilo")})`} />
      <path d="M13 25 Q 20 28 27 25 L 33 80 Q 20 88 7 80 Z" fill={`url(#${id("hilo")})`} />
      <g stroke="#6e4a1a" strokeOpacity=".35" strokeWidth=".6">
        {[11, 14, 17, 20, 23, 26, 29].map((x) => <path key={x} d={`M${20 + (x - 20) * 0.35} 27 L${x} 82`} />)}
      </g>
      <path d="M10 30 L8 78" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" />
    </svg>
  );
}