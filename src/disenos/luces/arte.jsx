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

// Punto de una curva cúbica y su ángulo, para repartir hojas sobre una rama.
function cubica(p, t) {
  const u = 1 - t;
  const x = u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6];
  const y = u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7];
  const dx = 3 * u * u * (p[2] - p[0]) + 6 * u * t * (p[4] - p[2]) + 3 * t * t * (p[6] - p[4]);
  const dy = 3 * u * u * (p[3] - p[1]) + 6 * u * t * (p[5] - p[3]) + 3 * t * t * (p[7] - p[5]);
  return { x, y, a: (Math.atan2(dy, dx) * 180) / Math.PI };
}
const azar = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };

// Hoja alargada (tipo olivo/eucalipto) de largo l, apuntando a la derecha.
const hoja = (l, w) => `M0 0 C ${l * 0.3} ${-w} ${l * 0.75} ${-w * 0.8} ${l} 0 C ${l * 0.75} ${w * 0.8} ${l * 0.3} ${w} 0 0 Z`;

// Rama en silueta con hojas a los dos lados. p = [x0 y0 c1x c1y c2x c2y x1 y1].
function Rama({ p, grosor = 3, hojas = 14, semilla = 1, largo = 22 }) {
  const lista = [];
  for (let i = 0; i < hojas; i++) {
    const t = 0.12 + (0.86 * i) / hojas;
    const { x, y, a } = cubica(p, t);
    const lado = i % 2 ? 1 : -1;
    const ang = a + lado * (38 + azar(semilla + i) * 30);
    const l = largo * (0.65 + azar(semilla + i * 3) * 0.5) * (1 - t * 0.35);
    lista.push(<path key={i} d={hoja(l, l * 0.2)} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`} />);
  }
  const fin = cubica(p, 1);
  lista.push(<path key="punta" d={hoja(largo * 0.7, largo * 0.15)} transform={`translate(${fin.x} ${fin.y}) rotate(${fin.a})`} />);
  return (
    <g>
      <path d={`M${p[0]} ${p[1]} C ${p[2]} ${p[3]} ${p[4]} ${p[5]} ${p[6]} ${p[7]}`} fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" />
      <g fill="currentColor">{lista}</g>
    </g>
  );
}

const ESTRELLAS = Array.from({ length: 46 }, (_, i) => ({
  x: azar(i + 11) * 390,
  y: 20 + azar(i + 51) * 430,
  r: 0.5 + azar(i + 91) * 1.1,
  d: Math.round(azar(i + 131) * 1800),
}));

// SDXL: lu_cielo
// Cielo de la entrada: atardecer durazno → azul polvo que pasa a crepúsculo
// (capa nocturna que se funde por CSS con .lu-luces-on), estrellas, nubes
// rasgadas, cerros, una hacienda con ventanas que se encienden y ramas en
// silueta arriba.
export function LuCielo({ className = "" }) {
  const u = limpia(useId());
  const id = (n) => `lu-cielo-${n}-${u}`;
  const sombra = mezcla(tema("ink"), 82, "#05070d");
  return (
    <svg className={`lu-cielo ${className}`} viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id("dia")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8E9FBC" />
          <stop offset=".34" stopColor="#B4B6CB" />
          <stop offset=".56" stopColor="#E3BDB0" />
          <stop offset=".74" stopColor="#F4C9A2" />
          <stop offset=".86" stopColor="#F7D3A6" />
          <stop offset="1" stopColor="#EFC197" />
        </linearGradient>
        <linearGradient id={id("noche")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: mezcla(tema("seal"), 62, "#0b0f1c") }} />
          <stop offset=".38" style={{ stopColor: mezcla(tema("seal"), 92, "#0b0f1c") }} />
          <stop offset=".62" style={{ stopColor: mezcla(tema("seal"), 70, "#8a6a78") }} />
          <stop offset=".8" style={{ stopColor: mezcla(tema("gold"), 52, tema("seal")) }} />
          <stop offset=".9" style={{ stopColor: mezcla(tema("gold-light"), 70, tema("gold")) }} />
          <stop offset="1" style={{ stopColor: mezcla(tema("gold"), 70, tema("seal")) }} />
        </linearGradient>
        <radialGradient id={id("sol")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFF4DD" stopOpacity=".95" />
          <stop offset=".35" stopColor="#FCE0B6" stopOpacity=".6" />
          <stop offset="1" stopColor="#F6C99A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("resplandor")} cx="50%" cy="50%" r="50%">
          <stop offset="0" style={{ stopColor: tema("gold-light"), stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: tema("gold"), stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id={id("lejos")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: mezcla(tema("seal"), 60, "#c9a7a0") }} />
          <stop offset="1" style={{ stopColor: mezcla(tema("seal"), 80, tema("ink")) }} />
        </linearGradient>
        <linearGradient id={id("cerca")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: mezcla(tema("ink"), 88, tema("seal")) }} />
          <stop offset="1" style={{ stopColor: sombra }} />
        </linearGradient>
        <radialGradient id={id("ventana")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFE7B0" />
          <stop offset=".45" style={{ stopColor: tema("gold-light"), stopOpacity: 0.7 }} />
          <stop offset="1" style={{ stopColor: tema("gold"), stopOpacity: 0 }} />
        </radialGradient>
        <filter id={id("nube")} x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id={id("difuso")} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4" /></filter>
        <Grano id={id("grano")} fuerza={0.12} frecuencia={1.1} />
      </defs>

      <g filter={`url(#${id("grano")})`}>
        <rect width="390" height="844" fill={`url(#${id("dia")})`} />
        <rect className="lu-cielo-noche" width="390" height="844" fill={`url(#${id("noche")})`} />

        <ellipse className="lu-cielo-sol" cx="195" cy="690" rx="260" ry="190" fill={`url(#${id("sol")})`} />
        <ellipse className="lu-cielo-resplandor" cx="195" cy="700" rx="300" ry="160" fill={`url(#${id("resplandor")})`} />

        <g className="lu-cielo-nubes" filter={`url(#${id("nube")})`}>
          <path d="M-20 520 C 60 506 130 512 210 500 S 340 486 420 498 L 420 512 C 330 506 260 520 180 522 S 40 530 -20 534 Z" fill="#F9D9C2" opacity=".75" />
          <path d="M40 470 C 110 460 170 466 240 458 S 330 452 380 458 L 380 466 C 300 466 230 474 150 476 S 70 480 40 480 Z" fill="#EBC4C0" opacity=".6" />
          <path d="M-10 590 C 80 580 150 588 230 582 S 350 574 410 580 L 410 592 C 320 590 250 598 160 600 S 30 604 -10 602 Z" fill="#FBE3C4" opacity=".7" />
          <path d="M120 410 C 170 404 220 408 280 402 L 280 408 C 230 412 170 414 120 414 Z" fill="#D9C2CC" opacity=".5" />
        </g>

        <g className="lu-cielo-estrellas" fill="#FFF8EA">
          {ESTRELLAS.map((e, i) => (
            <circle key={i} cx={e.x.toFixed(1)} cy={e.y.toFixed(1)} r={e.r.toFixed(2)} style={{ "--d": `${e.d}ms` }} />
          ))}
        </g>

        {/* Cerros lejanos, cerro cercano con la hacienda y sus ventanas. */}
        <path d="M0 690 C 50 664 96 668 140 680 C 190 692 220 662 270 656 C 320 650 352 672 390 664 L 390 844 L 0 844 Z" fill={`url(#${id("lejos")})`} opacity=".72" />
        <path d="M0 736 C 60 714 120 724 170 716 C 230 706 300 722 390 708 L 390 844 L 0 844 Z" fill={`url(#${id("cerca")})`} />
        <g transform="translate(232 676)" style={{ fill: sombra }}>
          <path d="M0 44 L0 22 L30 8 L60 22 L60 44 Z" />
          <path d="M60 44 L60 28 L104 28 L118 36 L118 46 Z" />
          <rect x="24" y="0" width="12" height="16" />
          <path d="M22 0 L30 -6 L38 0 Z" />
          {/* Cipreses junto a la casa */}
          <path d="M-14 46 C -18 30 -14 14 -10 4 C -6 14 -2 30 -6 46 Z" />
          <path d="M128 48 C 124 34 127 22 131 12 C 135 22 138 34 134 48 Z" />
        </g>
        <g className="lu-cielo-ventanas" transform="translate(232 676)">
          {[[10, 28], [22, 28], [38, 28], [50, 28], [72, 34], [86, 34], [100, 34], [29, 4]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x + 2} cy={y + 3} r="7" fill={`url(#${id("ventana")})`} />
              <rect x={x} y={y} width="4" height="6" rx="1.5" fill="#FFE2A6" />
            </g>
          ))}
        </g>

        {/* Ramas en silueta, arriba: una entra por la izquierda y otra por la derecha. */}
        <g style={{ color: sombra }} filter={`url(#${id("difuso")})`} opacity=".55">
          <Rama p={[-20, 30, 60, 10, 120, 50, 190, 40]} grosor={2.5} hojas={18} semilla={40} largo={20} />
        </g>
        <g style={{ color: sombra }}>
          <Rama p={[-30, -10, 40, 30, 90, 20, 160, 70]} grosor={5} hojas={22} semilla={3} largo={30} />
          <Rama p={[30, 18, 50, 60, 40, 100, 70, 138]} grosor={3} hojas={12} semilla={17} largo={24} />
          <Rama p={[90, 26, 120, 10, 160, 14, 210, 0]} grosor={2.5} hojas={10} semilla={23} largo={22} />
          <Rama p={[420, 10, 360, 30, 320, 20, 262, 70]} grosor={5} hojas={22} semilla={9} largo={30} />
          <Rama p={[372, 22, 352, 70, 368, 110, 340, 150]} grosor={3} hojas={12} semilla={29} largo={24} />
          <Rama p={[300, 34, 280, 50, 250, 40, 220, 58]} grosor={2} hojas={8} semilla={35} largo={20} />
        </g>
      </g>
    </svg>
  );
}

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

// SDXL: lu_mesa
// Escena de cierre: la mesa larga con mantel de lino vista en perspectiva,
// camino de hojas y flores blancas, velas que se achican hacia el fondo y la
// guirnalda encendida arriba, sobre el mismo lino crema del cuerpo.
export function LuMesa({ className = "" }) {
  const u = limpia(useId());
  const id = (n) => `lu-mesa-${n}-${u}`;
  // Velas a cada lado del camino, de adelante (grande) hacia el fondo.
  const filas = [0, 1, 2, 3, 4, 5];
  const prof = (k) => 1 - k * 0.15;
  const yFila = (k) => 262 - k * 26 + k * k * 1.2;
  const xLado = (k, lado) => 200 + lado * (70 - k * 10);
  return (
    <svg className={`lu-mesa ${className}`} viewBox="0 0 400 300" aria-hidden="true">
      <defs>
        <linearGradient id={id("mantel")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EFE5D3" />
          <stop offset=".6" stopColor="#FBF6EC" />
          <stop offset="1" stopColor="#F3EADA" />
        </linearGradient>
        <linearGradient id={id("caida")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#D9CCB4" />
          <stop offset=".12" stopColor="#F2E9D9" />
          <stop offset=".3" stopColor="#E3D6BF" />
          <stop offset=".5" stopColor="#F6EEE0" />
          <stop offset=".7" stopColor="#E1D3BB" />
          <stop offset=".88" stopColor="#F2E9D9" />
          <stop offset="1" stopColor="#D5C7AE" />
        </linearGradient>
        <radialGradient id={id("calor")} cx="50%" cy="60%" r="60%">
          <stop offset="0" style={{ stopColor: tema("gold-light"), stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: tema("gold-light"), stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={id("halo")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFF2CC" stopOpacity=".95" />
          <stop offset=".35" style={{ stopColor: tema("gold-light"), stopOpacity: 0.4 }} />
          <stop offset="1" style={{ stopColor: tema("gold"), stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id={id("cera")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E2D3B8" />
          <stop offset=".4" stopColor="#FFFAF0" />
          <stop offset="1" stopColor="#CDBB9C" />
        </linearGradient>
        <linearGradient id={id("verde")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8EA07E" />
          <stop offset="1" stopColor="#566b4e" />
        </linearGradient>
        <radialGradient id={id("piso")} cx="50%" cy="20%" r="70%">
          <stop offset="0" stopColor="#2a2216" stopOpacity=".22" />
          <stop offset="1" stopColor="#2a2216" stopOpacity="0" />
        </radialGradient>
        <Grano id={id("grano")} fuerza={0.1} frecuencia={1.2} />
      </defs>
      <ellipse cx="200" cy="150" rx="210" ry="150" fill={`url(#${id("calor")})`} />
      <g filter={`url(#${id("grano")})`}>
        {/* Sombra en el césped y la mesa en perspectiva */}
        <ellipse cx="200" cy="292" rx="190" ry="14" fill={`url(#${id("piso")})`} />
        <path d="M168 104 L232 104 L364 262 L36 262 Z" fill={`url(#${id("mantel")})`} />
        <path d="M36 262 L364 262 L366 290 C 300 296 100 296 34 290 Z" fill={`url(#${id("caida")})`} />
        <path d="M36 262 L364 262" stroke="#fff" strokeOpacity=".8" strokeWidth="1" />
        <path d="M168 104 L36 262 L30 278 L160 112 Z" fill="#E7DBC6" opacity=".7" />
        <path d="M232 104 L364 262 L370 278 L240 112 Z" fill="#E2D5BE" opacity=".7" />
        {/* Hilos del lino */}
        <g stroke="#d9ccb4" strokeWidth=".4" opacity=".6">
          {[0.2, 0.4, 0.6, 0.8].map((t) => <path key={t} d={`M${168 + 64 * t} 104 L${36 + 328 * t} 262`} />)}
        </g>
        {/* Camino de hojas */}
        <path d="M194 104 L206 104 L244 262 L156 262 Z" fill={`url(#${id("verde")})`} opacity=".25" />
        {filas.map((k) => {
          const s = prof(k);
          const y = yFila(k) - 6;
          return (
            <g key={`c${k}`} transform={`translate(200 ${y}) scale(${s})`}>
              {[-30, -14, 2, 18].map((dx, j) => (
                <path key={j} d={hoja(24, 6)} transform={`translate(${dx} ${(j % 2) * 4}) rotate(${j % 2 ? -12 : 14})`} fill={`url(#${id("verde")})`} />
              ))}
              <circle cx="-8" cy="-2" r="7.5" fill="#FFFFFF" stroke="#ddd2c2" strokeWidth=".5" />
              <circle cx="-8" cy="-2" r="2.2" fill="#D2AC5A" />
              <circle cx="10" cy="2" r="6" fill="#FDFBF6" stroke="#ddd2c2" strokeWidth=".5" />
              <circle cx="10" cy="2" r="1.8" fill="#D2AC5A" />
              <circle cx="0" cy="-8" r="2" fill="#fff" />
              <circle cx="20" cy="-4" r="1.6" fill="#fff" />
            </g>
          );
        })}
        {/* Velas a los lados del camino */}
        {filas.flatMap((k) => [-1, 1].map((lado) => {
          const s = prof(k);
          const x = xLado(k, lado);
          const y = yFila(k);
          return (
            <g key={`v${k}${lado}`} transform={`translate(${x} ${y}) scale(${s})`}>
              <circle className="lu-mesa-halo" cx="0" cy="-34" r="22" fill={`url(#${id("halo")})`} style={{ "--d": `${(k * 2 + (lado + 1) / 2) * 220}ms` }} />
              <ellipse cx="0" cy="1" rx="9" ry="2.4" fill="#2a2216" opacity=".18" />
              <rect x="-4.5" y="-26" width="9" height="26" rx="1.5" fill={`url(#${id("cera")})`} />
              <ellipse cx="0" cy="-26" rx="4.5" ry="1.3" fill="#FBF2E1" />
              <path d="M0 -26 L0 -29" stroke="#3a2c1c" strokeWidth=".8" />
              <path className="lu-llama" d="M0 -40 C 2.5 -35 3.5 -32 3 -30 C 2.5 -27.5 -2.5 -27.5 -3 -30 C -3.5 -32 -2.5 -35 0 -40 Z" fill="#FFD27A" />
              <path d="M0 -36 C 1 -33 1.4 -31 1 -30 C .5 -29 -.5 -29 -1 -30 C -1.4 -31 -1 -33 0 -36 Z" fill="#FFFBEA" />
            </g>
          );
        }))}
      </g>
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

// Ornamento pequeño: rombo con dos filetes, en ámbar del tema.
export function LuFilete({ className = "" }) {
  return (
    <svg className={`lu-filete ${className}`} viewBox="0 0 120 12" aria-hidden="true">
      <path d="M4 6 H50 M70 6 H116" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" />
      <path d="M60 1 L65 6 L60 11 L55 6 Z" fill="currentColor" />
      <circle cx="47" cy="6" r="1.2" fill="currentColor" />
      <circle cx="73" cy="6" r="1.2" fill="currentColor" />
    </svg>
  );
}

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
