import { useId } from "react";

// Arte de «Vals rosa», todo en SVG semi-realista: capas de degradados, sombras
// difusas, pétalos y pliegues con curvas Bézier y un grano sutil para que no
// se vea plano. Los colores de marca salen del tema (canales R G B):
//   gold = rosa palo · gold-light = rosa claro · gold-dark = rosa antiguo ·
//   seal = oro suave · paper = fondo · marble = tarjetas · ink = texto.
// Los colores naturales (hojas, piel, cabello, cristal) son fijos.
// Cada pieza lleva encima su nombre SDXL por si luego se pinta como .webp.

const col = (v, a) => (a == null ? `rgb(var(--color-${v}))` : `rgb(var(--color-${v}) / ${a})`);
const mezcla = (v, pct, otro = "white") => `color-mix(in srgb, rgb(var(--color-${v})) ${pct}%, ${otro})`;

function Stop({ o, c, a = 1 }) {
  return <stop offset={o} style={{ stopColor: c, stopOpacity: a }} />;
}

// Ids únicos por instancia (las piezas se repiten en la página).
function useUid() {
  const u = "vr" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (n) => `${u}-${n}`;
}

// Grano de papel / terciopelo: ruido fino que oscurece apenas.
function Grano({ id, fuerza = 0.08, frec = 0.9 }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={frec} numOctaves="2" stitchTiles="stitch" result="r" />
      <feColorMatrix in="r" type="matrix" values={`0 0 0 0 .27  0 0 0 0 .16  0 0 0 0 .19  ${fuerza * 2.2} 0 0 0 ${-fuerza * 0.6}`} result="m" />
      <feComposite in="m" in2="SourceGraphic" operator="in" result="g" />
      <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="g" /></feMerge>
    </filter>
  );
}

// Oro suave con brillo y sombra (lee --color-seal).
function Oro({ id, x2 = "0", y2 = "1" }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      <Stop o="0" c={mezcla("seal", 42, "white")} />
      <Stop o=".3" c={col("seal")} />
      <Stop o=".52" c={mezcla("seal", 68, col("ink"))} />
      <Stop o=".78" c={mezcla("seal", 70, "white")} />
      <Stop o="1" c={mezcla("seal", 78, col("ink"))} />
    </linearGradient>
  );
}

function OroRadial({ id }) {
  return (
    <radialGradient id={id} cx="38%" cy="32%" r="70%">
      <Stop o="0" c={mezcla("seal", 25, "white")} />
      <Stop o=".45" c={col("seal")} />
      <Stop o="1" c={mezcla("seal", 62, col("ink"))} />
    </radialGradient>
  );
}

/* ------------------------------------------------------------------ */
/* Rosa de jardín (pieza interna de VrRosas y del vestido)             */
/* ------------------------------------------------------------------ */

// Dibujada en una unidad de radio 40; `tono` es el color base del pétalo.
function Rosa({ x, y, r, rot = 0, tono = col("gold"), sinSombra = false }) {
  const id = useUid();
  const claro = `color-mix(in srgb, ${tono} 45%, white)`;
  const hondo = `color-mix(in srgb, ${tono} 72%, rgb(var(--color-gold-dark)))`;
  const muyHondo = `color-mix(in srgb, ${tono} 40%, rgb(var(--color-gold-dark)))`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${r / 40})`}>
      <defs>
        <radialGradient id={id("fondo")} cx="50%" cy="46%" r="58%">
          <Stop o="0" c={muyHondo} />
          <Stop o=".55" c={tono} />
          <Stop o="1" c={claro} />
        </radialGradient>
        <linearGradient id={id("frente")} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c={claro} />
          <Stop o=".5" c={tono} />
          <Stop o="1" c={hondo} />
        </linearGradient>
        <linearGradient id={id("dentro")} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c={tono} />
          <Stop o="1" c={muyHondo} />
        </linearGradient>
        <radialGradient id={id("centro")} cx="50%" cy="60%" r="60%">
          <Stop o="0" c={muyHondo} />
          <Stop o="1" c={tono} />
        </radialGradient>
      </defs>
      {!sinSombra && <ellipse cx="3" cy="8" rx="40" ry="36" fill={col("ink", 0.14)} style={{ filter: "blur(4px)" }} />}
      {/* corona de pétalos de atrás */}
      <path fill={`url(#${id("fondo")})`} d="M0 -40 C 16 -45 34 -35 37 -18 C 47 -8 45 14 33 24 C 27 38 7 45 -6 41 C -22 43 -39 31 -39 14 C -47 2 -41 -21 -27 -31 C -20 -39 -10 -41 0 -40 Z" />
      <path fill="none" stroke={muyHondo} strokeOpacity=".35" strokeWidth="1.2" strokeLinecap="round" d="M-27 -31 C -20 -24 -17 -18 -16 -12 M37 -18 C 28 -14 24 -10 22 -4 M33 24 C 26 19 22 16 18 14 M-39 14 C -30 12 -25 10 -22 7 M-6 41 C -4 34 -3 30 -2 26" />
      {/* interior del cáliz (sombra) */}
      <path fill={`url(#${id("dentro")})`} d="M-29 2 C -28 -21 -11 -30 2 -28 C 19 -28 31 -15 29 3 C 21 -5 11 -9 0 -9 C -12 -9 -22 -5 -29 2 Z" />
      {/* pétalos interiores en espiral */}
      <path fill={`url(#${id("frente")})`} d="M-20 5 C -20 -11 -7 -18 4 -16 C 15 -14 20 -3 18 7 C 11 0 3 -3 -4 -1 C -11 1 -16 4 -20 5 Z" />
      <path fill={`url(#${id("centro")})`} d="M-13 9 C -11 -4 0 -9 9 -7 C 15 -5 15 4 11 10 C 7 4 1 2 -4 4 Z" />
      <path fill="none" stroke={muyHondo} strokeWidth="1.3" strokeLinecap="round" d="M-6 4 C -6 -2 0 -5 4 -3 C 7 -1 6 3 3 5" />
      {/* copa del frente */}
      <path fill={`url(#${id("frente")})`} d="M-33 -1 C -37 20 -20 37 0 37 C -10 29 -14 15 -12 5 C -19 3 -27 1 -33 -1 Z" />
      <path fill={`url(#${id("frente")})`} d="M33 -1 C 37 20 20 37 0 37 C 10 29 14 15 12 5 C 19 3 27 1 33 -1 Z" />
      <path fill={`url(#${id("frente")})`} d="M-14 6 C -10 14 10 14 14 6 C 16 20 10 32 0 36 C -10 32 -16 20 -14 6 Z" />
      {/* brillos de borde */}
      <path fill="none" stroke="white" strokeOpacity=".6" strokeWidth="1.1" strokeLinecap="round" d="M-31 1 C -29 -2 -22 2 -14 5 M31 1 C 28 -2 22 2 14 5 M-12 7 C -6 12 6 12 12 7 M-18 4 C -14 -8 -2 -14 8 -12" />
    </g>
  );
}

// Hoja con nervadura (verde natural, fijo).
function Hoja({ x, y, ang = 0, largo = 40, id }) {
  const k = largo / 40;
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang}) scale(${k})`}>
      <path fill={`url(#${id})`} d="M0 0 C 9 -13 28 -14 41 0 C 28 11 9 11 0 0 Z" />
      <path fill="none" stroke="#e9f0df" strokeOpacity=".55" strokeWidth=".9" d="M2 0 Q 21 -1.5 39 0" />
      <path fill="none" stroke="#3f5a3d" strokeOpacity=".35" strokeWidth=".7" d="M10 -.6 L 15 -6 M18 -.9 L 24 -7 M26 -.9 L 31 -5.5 M12 .4 L 17 5 M20 .5 L 26 6 M28 .3 L 32 4.5" />
    </g>
  );
}

function Capullo({ x, y, ang = 0, s = 1, idVerde }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang}) scale(${s})`}>
      <path fill="none" stroke="#6d8a64" strokeWidth="1.6" strokeLinecap="round" d="M0 2 C 1 10 3 18 2 26" />
      <path fill={col("gold")} d="M0 0 C -8 -6 -8 -19 0 -27 C 8 -19 8 -6 0 0 Z" />
      <path fill={mezcla("gold", 55, "white")} d="M0 -27 C 3 -20 4 -10 0 0 C 6 -6 7 -17 0 -27 Z" />
      <path fill={`url(#${idVerde})`} d="M0 1 C -7 -2 -9 -9 -6 -14 C -4 -8 -2 -4 0 -2 C 2 -4 4 -8 6 -14 C 9 -9 7 -2 0 1 Z" />
    </g>
  );
}

function Florecita({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-3.2" rx="2.2" ry="3.2" fill="#fffaf8" stroke={col("gold-dark", 0.25)} strokeWidth=".4" transform={`rotate(${a})`} />
      ))}
      <circle r="1.4" fill={col("seal")} />
    </g>
  );
}

// SDXL: vr_rosas
// Viñeta de rosas de jardín con hojas, capullos y florecitas.
export function VrRosas({ className = "", variante = "ramo" }) {
  const id = useUid();
  const grano = id("grano");
  const verde = id("verde");
  return (
    <svg className={className} viewBox="0 0 240 150" aria-hidden="true" overflow="visible">
      <defs>
        <linearGradient id={verde} x1="0" y1="0" x2="1" y2="1">
          <Stop o="0" c="#a9bf98" />
          <Stop o=".55" c="#7d9a72" />
          <Stop o="1" c="#55704f" />
        </linearGradient>
        <Grano id={grano} fuerza={0.06} />
      </defs>
      <g filter={`url(#${grano})`}>
        {variante === "ramo" ? (
          <>
            <Hoja id={verde} x={112} y={84} ang={-160} largo={56} />
            <Hoja id={verde} x={128} y={86} ang={-20} largo={58} />
            <Hoja id={verde} x={96} y={100} ang={160} largo={48} />
            <Hoja id={verde} x={146} y={100} ang={18} largo={50} />
            <Hoja id={verde} x={120} y={104} ang={95} largo={38} />
            <Hoja id={verde} x={70} y={72} ang={-140} largo={34} />
            <Hoja id={verde} x={170} y={72} ang={-40} largo={34} />
            <Capullo idVerde={verde} x={42} y={98} ang={-58} s={0.9} />
            <Capullo idVerde={verde} x={198} y={98} ang={58} s={0.9} />
            <Rosa x={78} y={92} r={25} rot={-14} tono={mezcla("gold", 62, "white")} />
            <Rosa x={164} y={92} r={24} rot={12} tono={col("gold-light")} />
            <Rosa x={121} y={78} r={34} rot={4} tono={col("gold")} />
            <Florecita x={52} y={74} s={1.1} />
            <Florecita x={190} y={70} s={1} />
            <Florecita x={100} y={118} s={0.9} />
            <Florecita x={146} y={120} s={1} />
          </>
        ) : (
          <>
            {/* rama en esquina: para orlas y bordes */}
            <path fill="none" stroke="#6d8a64" strokeWidth="1.8" strokeLinecap="round" d="M10 140 C 40 120 70 110 120 104 C 160 100 200 92 232 70" />
            <Hoja id={verde} x={40} y={124} ang={-120} largo={34} />
            <Hoja id={verde} x={84} y={110} ang={-30} largo={36} />
            <Hoja id={verde} x={150} y={100} ang={-140} largo={32} />
            <Hoja id={verde} x={196} y={88} ang={10} largo={32} />
            <Capullo idVerde={verde} x={226} y={74} ang={64} s={0.8} />
            <Rosa x={118} y={102} r={26} rot={-6} tono={col("gold")} />
            <Rosa x={66} y={118} r={18} rot={10} tono={col("gold-light")} />
            <Florecita x={176} y={92} />
            <Florecita x={30} y={134} s={0.9} />
          </>
        )}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Telón de terciopelo                                                 */
/* ------------------------------------------------------------------ */

// Pliegues irregulares, uno por franja, con dobladillo ondulado.
const ORILLAS = [-6, 22, 50, 82, 108, 140, 168, 206];
const PLIEGUES = ORILLAS.slice(0, -1).map((xl, i) => {
  const xr = ORILLAS[i + 1];
  const a = i % 2 ? 4 : -4;
  const b = (i % 3) - 1;
  const mid = (xl + xr) / 2 + b * 2;
  const bajo = 766 + (i % 2) * 7;
  const xc = xl + (xr - xl) * 0.5;
  return {
    d: `M${xl} 0 C${xl + a} 260 ${xl - a} 520 ${xl + b * 2} ${bajo} Q${mid} ${bajo + 20} ${xr + b * 2} ${bajo} C${xr - a} 520 ${xr + a} 260 ${xr} 0 Z`,
    cresta: `M${xc} 0 C${xc + a} 260 ${xc - a} 520 ${mid} ${bajo + 8}`,
    bajo: { xl: xl + b * 2, xr: xr + b * 2, mid, y: bajo },
  };
});
const DOBLADILLO = PLIEGUES.map((p, i) => `${i ? "L" : "M"}${p.bajo.xl} ${p.bajo.y} Q${p.bajo.mid} ${p.bajo.y + 20} ${p.bajo.xr} ${p.bajo.y}`).join(" ");

function Borla({ x, y, s = 1, oro, oroR }) {
  const hilos = [];
  for (let k = -13; k <= 13; k += 2.2) hilos.push(k);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="2" cy="102" rx="14" ry="3" fill={col("ink", 0.18)} style={{ filter: "blur(2px)" }} />
      <path d="M0 0 V28" stroke={`url(#${oro})`} strokeWidth="2.6" />
      <path d="M0 0 V28" stroke={mezcla("seal", 60, col("ink"))} strokeWidth="2.6" strokeDasharray="1.4 1.6" strokeOpacity=".55" />
      <ellipse cx="0" cy="31" rx="6.5" ry="5.5" fill={`url(#${oroR})`} />
      <rect x="-3.5" y="35" width="7" height="5" fill={`url(#${oro})`} />
      <ellipse cx="0" cy="47" rx="10.5" ry="9" fill={`url(#${oroR})`} />
      <path d="M-8 42 L 6 54 M-4 39 L 9 50 M-10 48 L 0 56 M8 41 L -6 54 M3 39 L -9 50 M10 47 L 1 56" stroke={mezcla("seal", 55, col("ink"))} strokeOpacity=".45" strokeWidth=".7" />
      <rect x="-11.5" y="55" width="23" height="4.2" rx="2" fill={`url(#${oro})`} />
      <path d="M-10 59 C -12 72 -15 86 -16 99 Q 0 105 16 99 C 15 86 12 72 10 59 Z" fill={`url(#${oro})`} />
      {hilos.map((k) => (
        <path key={k} d={`M${k * 0.72} 60 L ${k * 1.18} 100`} stroke={mezcla("seal", 55, col("ink"))} strokeOpacity=".38" strokeWidth=".6" />
      ))}
      <path d="M-6 62 L -9 98" stroke="white" strokeOpacity=".55" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="-3" cy="28.5" r="1.6" fill="white" fillOpacity=".7" />
      <circle cx="-4" cy="43" r="2.4" fill="white" fillOpacity=".55" />
    </g>
  );
}

function Mitad({ id, espejo }) {
  return (
    <g transform={espejo ? "translate(200 0) scale(-1 1)" : undefined}>
      <rect x="0" y="0" width="200" height="790" fill={mezcla("gold-dark", 80, col("ink"))} />
      <g filter={`url(#${id("grano")})`}>
        {PLIEGUES.map((p, i) => (
          <path key={i} d={p.d} fill={`url(#${id(i % 2 ? "pliegueB" : "pliegueA")})`} />
        ))}
        {/* luz del escenario desde el centro y sombra arriba/abajo */}
        <rect x="0" y="0" width="200" height="800" fill={`url(#${id("sombra")})`} />
        <rect x="0" y="0" width="200" height="800" fill={`url(#${id("foco")})`} />
      </g>
      <g filter={`url(#${id("difuso")})`}>
        {PLIEGUES.map((p, i) => (
          <path key={i} d={p.cresta} fill="none" stroke="white" strokeOpacity={i % 2 ? 0.22 : 0.3} strokeWidth="3" />
        ))}
      </g>
      {/* galón bordado en la orilla interior */}
      <rect x="186" y="0" width="14" height="784" fill={`url(#${id("oroH")})`} />
      <rect x="186" y="0" width="14" height="784" fill={`url(#${id("bordado")})`} />
      <path d="M185.5 0 V784" stroke={mezcla("seal", 55, col("ink"))} strokeOpacity=".6" strokeWidth="1" />
      {/* flecos dorados del dobladillo */}
      <path d={DOBLADILLO} transform="translate(0 6)" fill="none" stroke={`url(#${id("oroH")})`} strokeWidth="11" strokeDasharray="1 1.7" />
      <path d={DOBLADILLO} fill="none" stroke={`url(#${id("oroH")})`} strokeWidth="2.6" />
    </g>
  );
}

function Cenefa({ id }) {
  const festones = [[-24, 150], [250, 424], [118, 282]];
  const curva = (a, b, d, dx = 0) => {
    const w = b - a;
    const m = (a + b) / 2;
    return `M${a + w * 0.04 + dx} 24 C${a + w * 0.15} ${24 + (d - 24) * 0.6} ${m - w * 0.3} ${d} ${m} ${d} C${m + w * 0.3} ${d} ${b - w * 0.15} ${24 + (d - 24) * 0.6} ${b - w * 0.04 - dx} 24`;
  };
  return (
    <>
      <rect x="0" y="0" width="400" height="26" fill={`url(#${id("tabla")})`} />
      {festones.map(([a, b], i) => {
        const w = b - a;
        const m = (a + b) / 2;
        const d = 88;
        return (
          <g key={i} filter={`url(#${id("grano")})`}>
            <path d={`M${a} 20 L${b} 20 C${b - w * 0.12} 62 ${m + w * 0.3} ${d + 2} ${m} ${d + 2} C${m - w * 0.3} ${d + 2} ${a + w * 0.12} 62 ${a} 20 Z`}
              fill={`url(#${id("festón")})`} />
            <g filter={`url(#${id("difuso")})`} fill="none" strokeLinecap="round">
              {[0.32, 0.52, 0.72, 0.9].map((k, j) => (
                <path key={j} d={curva(a, b, 24 + (d - 24) * k, 8)} stroke={j % 2 ? col("gold-dark", 0.5) : "white"} strokeOpacity={j % 2 ? 1 : 0.35} strokeWidth={j % 2 ? 3 : 4} />
              ))}
            </g>
            <path d={curva(a, b, d + 5)} fill="none" stroke={`url(#${id("oroH")})`} strokeWidth="11" strokeDasharray="1 1.7" />
            <path d={curva(a, b, d)} fill="none" stroke={`url(#${id("oroH")})`} strokeWidth="2.6" />
          </g>
        );
      })}
      <rect x="0" y="18" width="400" height="6" fill={`url(#${id("oroH")})`} />
      <path d="M0 21 H400" stroke={mezcla("seal", 55, col("ink"))} strokeWidth="1" strokeDasharray="3 2" strokeOpacity=".55" />
      <Borla x={133} y={18} s={0.78} oro={id("oro")} oroR={id("oroR")} />
      <Borla x={267} y={18} s={0.78} oro={id("oro")} oroR={id("oroR")} />
    </>
  );
}

// SDXL: vr_telon
// Telón de terciopelo rosa palo con pliegues, galón y flecos dorados.
// lado: "izq" | "der" (cada mitad), "cenefa" (bambalina de arriba con
// borlas) o "amarre" (cordón con borla que recoge cada mitad).
export function VrTelon({ lado = "izq", className = "" }) {
  const id = useUid();
  const defs = (
    <defs>
      {["pliegueA", "pliegueB"].map((n, i) => (
        <linearGradient key={n} id={id(n)} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c={mezcla("gold-dark", 70, col("ink"))} />
          <Stop o={i ? ".18" : ".25"} c={mezcla("gold", 72, col("gold-dark"))} />
          <Stop o={i ? ".42" : ".5"} c={mezcla("gold", 62, "white")} />
          <Stop o={i ? ".6" : ".68"} c={col("gold")} />
          <Stop o=".86" c={mezcla("gold", 55, col("gold-dark"))} />
          <Stop o="1" c={mezcla("gold-dark", 62, col("ink"))} />
        </linearGradient>
      ))}
      <linearGradient id={id("sombra")} x1="0" y1="0" x2="0" y2="1">
        <Stop o="0" c={col("ink")} a=".42" />
        <Stop o=".16" c={col("ink")} a="0" />
        <Stop o=".82" c={col("ink")} a="0" />
        <Stop o="1" c={col("ink")} a=".28" />
      </linearGradient>
      <radialGradient id={id("foco")} cx="100%" cy="46%" r="70%" gradientTransform="translate(0 0) scale(1 1)">
        <Stop o="0" c="white" a=".26" />
        <Stop o="1" c="white" a="0" />
      </radialGradient>
      <linearGradient id={id("tabla")} x1="0" y1="0" x2="0" y2="1">
        <Stop o="0" c={mezcla("gold-dark", 70, col("ink"))} />
        <Stop o="1" c={mezcla("gold", 70, col("gold-dark"))} />
      </linearGradient>
      <linearGradient id={id("festón")} x1="0" y1="0" x2="0" y2="1">
        <Stop o="0" c={mezcla("gold-dark", 75, col("ink"))} />
        <Stop o=".35" c={mezcla("gold", 75, col("gold-dark"))} />
        <Stop o=".7" c={mezcla("gold", 70, "white")} />
        <Stop o="1" c={col("gold")} />
      </linearGradient>
      <Oro id={id("oro")} x2="1" y2="0" />
      <Oro id={id("oroH")} x2="1" y2="0" />
      <OroRadial id={id("oroR")} />
      <pattern id={id("bordado")} x="186" y="0" width="14" height="22" patternUnits="userSpaceOnUse">
        <path d="M7 2 L 11 11 L 7 20 L 3 11 Z" fill="none" stroke={mezcla("seal", 55, col("ink"))} strokeOpacity=".55" strokeWidth=".8" />
        <circle cx="7" cy="11" r="1.4" fill="white" fillOpacity=".6" />
      </pattern>
      <filter id={id("difuso")} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2" /></filter>
      <Grano id={id("grano")} fuerza={0.1} frec={1.1} />
    </defs>
  );

  if (lado === "cenefa") {
    return (
      <svg className={className} viewBox="0 0 400 112" preserveAspectRatio="none" aria-hidden="true">
        {defs}
        <Cenefa id={id} />
      </svg>
    );
  }
  if (lado === "amarre") {
    return (
      <svg className={className} viewBox="0 0 70 150" aria-hidden="true" overflow="visible">
        {defs}
        <path d="M2 20 C 20 34 40 36 58 26" fill="none" stroke={`url(#${id("oro")})`} strokeWidth="6" strokeLinecap="round" />
        <path d="M2 20 C 20 34 40 36 58 26" fill="none" stroke={mezcla("seal", 55, col("ink"))} strokeOpacity=".5" strokeWidth="6" strokeDasharray="2 2.2" />
        <Borla x={48} y={28} s={1.05} oro={id("oro")} oroR={id("oroR")} />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 200 800" preserveAspectRatio="none" aria-hidden="true">
      {defs}
      <Mitad id={id} espejo={lado === "der"} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Salón con candelabro                                                */
/* ------------------------------------------------------------------ */

const ARCOS = [
  { x0: 122, x1: 268, top: 196, bot: 590 },
  { x0: 22, x1: 94, top: 260, bot: 590 },
  { x0: 296, x1: 368, top: 260, bot: 590 },
];
const arco = ({ x0, x1, top, bot }) => {
  const r = (x1 - x0) / 2;
  return `M${x0} ${bot} V${top + r} A${r} ${r} 0 0 1 ${x1} ${top + r} V${bot} Z`;
};

// Velas: [x, y, escala, atrás]
const VELAS = [
  [148, 150, 0.8, true], [242, 150, 0.8, true],
  [168, 128, 0.7, true], [222, 128, 0.7, true],
  [118, 172, 1, false], [272, 172, 1, false],
  [156, 190, 1, false], [234, 190, 1, false],
  [179, 146, 0.82, false], [211, 146, 0.82, false],
];

function Vela({ x, y, s, id }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="-17" r="18" fill={`url(#${id("halo")})`} />
      <rect x="-3" y="-12" width="6" height="18" rx="1.2" fill={`url(#${id("cera")})`} />
      <ellipse cx="0" cy="7" rx="8" ry="2.6" fill={`url(#${id("oroH")})`} />
      <path d="M-5 8 Q 0 13 5 8" fill={`url(#${id("oroH")})`} />
      <g className="vr-llama">
        <path d="M0 -24 C 3 -19 3.6 -15 0 -12.5 C -3.6 -15 -3 -19 0 -24 Z" fill={`url(#${id("llama")})`} />
      </g>
    </g>
  );
}

// SDXL: vr_salon
// Salón de baile claro: arcos con ventanales, pilastras, piso pulido que
// refleja la luz y un candelabro de cristal con velas al centro.
export function VrSalon({ className = "" }) {
  const id = useUid();
  const vertical = [];
  for (let x = -420; x <= 820; x += 64) vertical.push(x);
  return (
    <svg className={className} viewBox="0 0 390 844" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <defs>
        <linearGradient id={id("muro")} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c={mezcla("gold", 50, col("paper"))} />
          <Stop o=".4" c={mezcla("gold-light", 75, col("paper"))} />
          <Stop o=".7" c={col("paper")} />
        </linearGradient>
        <linearGradient id={id("ventana")} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c={mezcla("gold-light", 55, "white")} />
          <Stop o=".55" c="#fffdfb" />
          <Stop o="1" c={mezcla("gold-light", 70, "white")} />
        </linearGradient>
        <linearGradient id={id("pilastra")} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c={mezcla("gold-light", 60, col("gold"))} />
          <Stop o=".4" c={mezcla("gold-light", 45, "white")} />
          <Stop o="1" c={mezcla("gold-light", 80, col("gold"))} />
        </linearGradient>
        <linearGradient id={id("piso")} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c={mezcla("gold-light", 55, "white")} />
          <Stop o=".5" c={mezcla("gold-light", 85, col("paper"))} />
          <Stop o="1" c={mezcla("gold", 50, col("paper"))} />
        </linearGradient>
        <radialGradient id={id("luz")} cx="50%" cy="50%" r="50%">
          <Stop o="0" c="white" a=".85" />
          <Stop o=".5" c="white" a=".35" />
          <Stop o="1" c="white" a="0" />
        </radialGradient>
        <radialGradient id={id("halo")} cx="50%" cy="50%" r="50%">
          <Stop o="0" c={mezcla("seal", 30, "white")} a=".85" />
          <Stop o=".4" c={mezcla("seal", 40, "white")} a=".3" />
          <Stop o="1" c={col("seal")} a="0" />
        </radialGradient>
        <radialGradient id={id("llama")} cx="50%" cy="70%" r="60%">
          <Stop o="0" c="white" />
          <Stop o=".5" c="#ffe6a8" />
          <Stop o="1" c="#f0a94e" />
        </radialGradient>
        <linearGradient id={id("cera")} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c="#efe6df" />
          <Stop o=".4" c="#fffdfa" />
          <Stop o="1" c="#e2d4cb" />
        </linearGradient>
        <linearGradient id={id("cristal")} x1="0" y1="0" x2="1" y2="1">
          <Stop o="0" c="white" />
          <Stop o=".5" c={mezcla("gold-light", 40, "white")} />
          <Stop o="1" c={mezcla("seal", 30, "white")} />
        </linearGradient>
        <Oro id={id("oro")} />
        <Oro id={id("oroH")} x2="1" y2="0" />
        <OroRadial id={id("oroR")} />
        <filter id={id("difuso")} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" /></filter>
        <filter id={id("suave")} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4" /></filter>
        <Grano id={id("grano")} fuerza={0.06} />
        <clipPath id={id("piso-c")}><rect x="-200" y="592" width="790" height="300" /></clipPath>
      </defs>

      <g filter={`url(#${id("grano")})`}>
        <rect x="-200" y="0" width="790" height="900" fill={`url(#${id("muro")})`} />
        {/* paneles del muro */}
        {[[-150, -10], [400, 540]].map(([a, b]) => (
          <rect key={a} x={a} y="250" width={b - a} height="300" fill="none" stroke={col("seal", 0.45)} strokeWidth="1.5" />
        ))}
        {/* cornisa */}
        <rect x="-200" y="0" width="790" height="60" fill={mezcla("gold", 62, col("paper"))} />
        <rect x="-200" y="58" width="790" height="5" fill={`url(#${id("oro")})`} />
        <rect x="-200" y="66" width="790" height="1.5" fill={col("seal", 0.7)} />
        {/* ventanales en arco */}
        {ARCOS.map((a, i) => {
          const r = (a.x1 - a.x0) / 2;
          const cx = (a.x0 + a.x1) / 2;
          const cy = a.top + r;
          const rayos = [-60, -30, 0, 30, 60];
          return (
            <g key={i}>
              <path d={arco(a)} fill={`url(#${id("ventana")})`} />
              <ellipse cx={cx} cy={cy + 60} rx={r * 0.9} ry={170} fill={`url(#${id("luz")})`} />
              <g stroke={col("seal", 0.55)} strokeWidth="1.1" fill="none">
                <path d={`M${cx} ${cy} V${a.bot}`} />
                {[cy + 80, cy + 180, cy + 280].filter((y) => y < a.bot).map((y) => <path key={y} d={`M${a.x0} ${y} H${a.x1}`} />)}
                <path d={`M${a.x0} ${cy} H${a.x1}`} />
                {rayos.map((g) => <path key={g} d={`M${cx} ${cy} L${cx + Math.sin((g * Math.PI) / 180) * r} ${cy - Math.cos((g * Math.PI) / 180) * r}`} />)}
                <path d={`M${cx - r * 0.35} ${cy} A${r * 0.35} ${r * 0.35} 0 0 1 ${cx + r * 0.35} ${cy}`} />
              </g>
              <path d={arco(a)} fill="none" stroke={`url(#${id("oroH")})`} strokeWidth="4" />
              <path d={arco({ x0: a.x0 - 7, x1: a.x1 + 7, top: a.top - 7, bot: a.bot })} fill="none" stroke={col("seal", 0.5)} strokeWidth="1.2" />
              <path d={`M${cx - 7} ${a.top - 10} L${cx + 7} ${a.top - 10} L${cx + 4} ${a.top + 6} L${cx - 4} ${a.top + 6} Z`} fill={`url(#${id("oro")})`} />
            </g>
          );
        })}
        {/* pilastras */}
        {[100, 274, -8, 382].map((x) => (
          <g key={x}>
            <rect x={x} y="78" width="16" height="512" fill={`url(#${id("pilastra")})`} />
            {[4, 8, 12].map((d) => <path key={d} d={`M${x + d} 96 V572`} stroke={col("gold-dark", 0.18)} strokeWidth="1" />)}
            <rect x={x - 3} y="70" width="22" height="10" rx="1" fill={`url(#${id("oro")})`} />
            <circle cx={x - 1} cy="83" r="3" fill={`url(#${id("oroR")})`} />
            <circle cx={x + 17} cy="83" r="3" fill={`url(#${id("oroR")})`} />
            <rect x={x - 3} y="576" width="22" height="14" fill={mezcla("gold-light", 60, col("gold"))} />
          </g>
        ))}
        {/* zócalo y piso pulido */}
        <rect x="-200" y="584" width="790" height="8" fill={`url(#${id("oro")})`} />
        <rect x="-200" y="592" width="790" height="300" fill={`url(#${id("piso")})`} />
        <g clipPath={`url(#${id("piso-c")})`}>
          <g transform="translate(0 1184) scale(1 -1)" opacity=".2">
            {ARCOS.map((a, i) => <path key={i} d={arco(a)} fill="white" stroke={col("seal")} strokeWidth="3" />)}
          </g>
          <g stroke={col("seal", 0.22)} strokeWidth="1">
            {vertical.map((x) => <path key={x} d={`M195 470 L${x} 900`} />)}
            {[606, 628, 660, 704, 764, 844].map((y) => <path key={y} d={`M-200 ${y} H590`} />)}
          </g>
          <ellipse cx="195" cy="660" rx="190" ry="48" fill="white" fillOpacity=".5" filter={`url(#${id("difuso")})`} />
        </g>
      </g>

      {/* resplandor del candelabro */}
      <circle cx="195" cy="168" r="150" fill={`url(#${id("luz")})`} opacity=".75" />
      {[[60, 120, 10], [330, 150, 13], [90, 330, 8], [310, 360, 9], [40, 470, 7], [352, 500, 11]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="white" fillOpacity=".45" filter={`url(#${id("suave")})`} />
      ))}

      {/* candelabro */}
      <g className="vr-candelabro">
        {Array.from({ length: 13 }, (_, i) => (
          <ellipse key={i} cx="195" cy={6 + i * 7} rx={i % 2 ? 1.4 : 2.4} ry="3.6" fill="none" stroke={`url(#${id("oroH")})`} strokeWidth="1.4" />
        ))}
        {VELAS.filter((v) => v[3]).map(([x, y]) => (
          <path key={`b${x}${y}`} d={`M195 ${y < 140 ? 136 : 168} C ${195 + (x - 195) * 0.3} ${y + 26} ${x} ${y + 22} ${x} ${y + 8}`} fill="none" stroke={`url(#${id("oroH")})`} strokeWidth="3" opacity=".85" />
        ))}
        {VELAS.filter((v) => v[3]).map(([x, y, s]) => <Vela key={`v${x}${y}`} x={x} y={y} s={s} id={id} />)}
        {/* guirnaldas de cristal de atrás */}
        <path d="M148 158 Q 195 186 242 158" fill="none" stroke="white" strokeWidth="2.6" strokeDasharray="0 4.2" strokeLinecap="round" opacity=".9" />
        {/* columna central */}
        <ellipse cx="195" cy="100" rx="6" ry="5" fill={`url(#${id("oroR")})`} />
        <rect x="192" y="104" width="6" height="44" fill={`url(#${id("oroH")})`} />
        <ellipse cx="195" cy="120" rx="5" ry="4" fill={`url(#${id("oroR")})`} />
        <path d="M181 136 Q 195 128 209 136 Q 207 146 195 148 Q 183 146 181 136 Z" fill={`url(#${id("oroR")})`} />
        <ellipse cx="195" cy="160" rx="11" ry="10" fill={`url(#${id("oroR")})`} />
        <rect x="185" y="168" width="20" height="4" rx="2" fill={`url(#${id("oroH")})`} />
        <path d="M168 172 Q 195 204 222 172 Z" fill={`url(#${id("oroR")})`} />
        <path d="M172 174 Q 195 196 218 174" fill="none" stroke="white" strokeOpacity=".5" strokeWidth="1" />
        {/* brazos del frente */}
        {VELAS.filter((v) => !v[3]).map(([x, y]) => (
          <path key={`a${x}${y}`} d={`M195 ${y < 150 ? 140 : 180} C ${195 + (x - 195) * 0.3} ${y + 34} ${x} ${y + 28} ${x} ${y + 9}`} fill="none" stroke={`url(#${id("oroH")})`} strokeWidth="3.6" />
        ))}
        {VELAS.filter((v) => !v[3]).map(([x, y, s]) => <Vela key={`f${x}${y}`} x={x} y={y} s={s} id={id} />)}
        {/* cristales: guirnaldas y lágrimas */}
        {[["M118 180 Q 137 206 156 198"], ["M156 198 Q 195 226 234 198"], ["M234 198 Q 253 206 272 180"]].map(([d], i) => (
          <g key={i}>
            <path d={d} fill="none" stroke="white" strokeWidth="3" strokeDasharray="0 4.4" strokeLinecap="round" />
            <path d={d} fill="none" stroke={mezcla("seal", 40, "white")} strokeWidth="1.2" strokeDasharray="0 4.4" strokeLinecap="round" transform="translate(.6 .6)" />
          </g>
        ))}
        {[[118, 182], [272, 182], [156, 200], [234, 200], [137, 198], [253, 198], [195, 212]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path d="M0 0 V6" stroke={col("seal", 0.7)} strokeWidth=".6" />
            <path d="M0 6 C 3 10 3.4 14 0 17 C -3.4 14 -3 10 0 6 Z" fill={`url(#${id("cristal")})`} stroke={col("seal", 0.5)} strokeWidth=".5" />
          </g>
        ))}
        <path d="M195 186 V214" stroke={`url(#${id("oroH")})`} strokeWidth="2" />
        <path d="M195 214 C 202 222 203 232 195 242 C 187 232 188 222 195 214 Z" fill={`url(#${id("cristal")})`} stroke={col("seal", 0.6)} strokeWidth=".7" />
        <path d="M193 220 L 192 234" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Quinceañera de espaldas                                             */
/* ------------------------------------------------------------------ */

// SDXL: vr_quince
// Quinceañera de espaldas, sin rostro: moño alto con tiara, hombros
// descubiertos, corsé con lazo dorado y falda de baile de tul con rosas.
export function VrQuince({ className = "" }) {
  const id = useUid();
  const pliegues = [
    "M138 186 C 120 250 84 330 52 432", "M144 188 C 136 260 118 350 104 444",
    "M150 188 C 150 270 148 360 150 450", "M156 188 C 164 260 182 350 196 444",
    "M162 186 C 180 250 216 330 248 432", "M132 184 C 110 240 70 320 32 420", "M168 184 C 190 240 230 320 268 420",
  ];
  return (
    <svg className={className} viewBox="0 0 300 470" aria-hidden="true" overflow="visible">
      <defs>
        <linearGradient id={id("falda")} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c={mezcla("gold", 70, col("gold-dark"))} />
          <Stop o=".28" c={mezcla("gold", 70, "white")} />
          <Stop o=".5" c={mezcla("gold", 82, "white")} />
          <Stop o=".72" c={col("gold")} />
          <Stop o="1" c={mezcla("gold", 60, col("gold-dark"))} />
        </linearGradient>
        <linearGradient id={id("tul")} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c="white" a="0" />
          <Stop o=".6" c="white" a=".28" />
          <Stop o="1" c="white" a=".5" />
        </linearGradient>
        <linearGradient id={id("corse")} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c={mezcla("gold", 65, col("gold-dark"))} />
          <Stop o=".35" c={mezcla("gold", 72, "white")} />
          <Stop o=".6" c={col("gold")} />
          <Stop o="1" c={mezcla("gold", 55, col("gold-dark"))} />
        </linearGradient>
        <linearGradient id={id("piel")} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c="#d9a68b" />
          <Stop o=".45" c="#f0cdb6" />
          <Stop o="1" c="#d29d82" />
        </linearGradient>
        <radialGradient id={id("pelo")} cx="40%" cy="35%" r="70%">
          <Stop o="0" c="#7a5040" />
          <Stop o=".6" c="#4f3126" />
          <Stop o="1" c="#33201a" />
        </radialGradient>
        <Oro id={id("oro")} x2="1" y2="0" />
        <OroRadial id={id("oroR")} />
        <filter id={id("difuso")} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" /></filter>
        <filter id={id("sombra")} x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="7" /></filter>
        <Grano id={id("grano")} fuerza={0.07} />
      </defs>

      <ellipse cx="150" cy="452" rx="150" ry="16" fill={col("gold-dark", 0.35)} filter={`url(#${id("sombra")})`} />
      <g filter={`url(#${id("grano")})`}>
        {/* brazos */}
        <path d="M104 106 C 94 116 90 140 90 162 C 90 184 92 200 96 214 C 98 220 104 220 104 213 C 102 196 102 178 104 160 C 106 142 112 126 114 116 Z" fill={`url(#${id("piel")})`} />
        <path d="M196 106 C 206 116 210 140 210 162 C 210 184 208 200 204 214 C 202 220 196 220 196 213 C 198 196 198 178 196 160 C 194 142 188 126 186 116 Z" fill={`url(#${id("piel")})`} />
        {/* falda de baile */}
        <path d="M126 178 C 110 232 70 300 34 378 C 22 404 14 424 12 442 Q 150 470 288 442 C 286 424 278 404 266 378 C 230 300 190 232 174 178 Z" fill={`url(#${id("falda")})`} />
        <g filter={`url(#${id("difuso")})`} fill="none" strokeLinecap="round">
          {pliegues.map((d, i) => (
            <path key={i} d={d} stroke={i % 2 ? col("gold-dark", 0.4) : "white"} strokeOpacity={i % 2 ? 1 : 0.55} strokeWidth={i % 2 ? 6 : 5} />
          ))}
        </g>
        {/* volante de tul */}
        <path d="M30 392 C 70 380 110 400 150 392 C 190 400 230 380 270 392 C 280 410 286 426 288 442 Q 150 470 12 442 C 14 426 20 410 30 392 Z" fill={mezcla("gold", 60, "white")} fillOpacity=".75" />
        <path d="M12 442 Q 40 432 58 446 Q 80 434 102 450 Q 126 438 150 452 Q 174 438 198 450 Q 220 434 242 446 Q 260 432 288 442 Q 150 472 12 442 Z" fill={mezcla("gold", 45, "white")} />
        <path d="M30 392 C 70 380 110 400 150 392 C 190 400 230 380 270 392" fill="none" stroke="white" strokeOpacity=".7" strokeWidth="1.4" />
        <path d="M126 178 C 110 232 70 300 34 378 C 22 404 14 424 12 442 Q 150 470 288 442 C 286 424 278 404 266 378 C 230 300 190 232 174 178 Z" fill={`url(#${id("tul")})`} />
        {/* espalda y hombros */}
        <path d="M139 66 C 139 80 134 88 122 92 C 110 96 102 100 100 110 L 120 124 L 180 124 L 200 110 C 198 100 190 96 178 92 C 166 88 161 80 161 66 Z" fill={`url(#${id("piel")})`} />
        <path d="M128 104 C 134 112 140 116 146 116 M172 104 C 166 112 160 116 154 116 M150 92 V122" fill="none" stroke="#b9826a" strokeOpacity=".45" strokeWidth="1.4" strokeLinecap="round" />
        {/* corsé */}
        <path d="M106 112 C 122 106 138 110 150 116 C 162 110 178 106 194 112 C 190 134 184 158 176 184 Q 150 190 124 184 C 116 158 110 134 106 112 Z" fill={`url(#${id("corse")})`} />
        <path d="M124 120 C 128 142 130 162 132 184 M176 120 C 172 142 170 162 168 184" stroke={col("gold-dark", 0.35)} strokeWidth="1.2" fill="none" />
        <path d="M106 112 C 122 106 138 110 150 116 C 162 110 178 106 194 112" fill="none" stroke="white" strokeOpacity=".6" strokeWidth="1.6" />
        {/* cordón del corsé */}
        <path d="M144 120 L 156 128 M156 120 L 144 128 M144 132 L 156 140 M156 132 L 144 140 M144 144 L 156 152 M156 144 L 144 152 M144 156 L 156 164 M156 156 L 144 164 M144 168 L 156 176 M156 168 L 144 176"
          stroke={`url(#${id("oro")})`} strokeWidth="1.8" strokeLinecap="round" />
        {/* lazo en la cintura */}
        <path d="M150 184 C 136 172 120 174 122 184 C 124 194 140 192 150 186 Z" fill={`url(#${id("oro")})`} />
        <path d="M150 184 C 164 172 180 174 178 184 C 176 194 160 192 150 186 Z" fill={`url(#${id("oro")})`} />
        <path d="M148 188 C 142 210 136 228 128 246 L 136 244 L 140 252 C 146 232 150 212 152 190 Z" fill={`url(#${id("oro")})`} />
        <path d="M152 188 C 158 210 164 228 172 246 L 164 244 L 160 252 C 154 232 150 212 148 190 Z" fill={`url(#${id("oro")})`} />
        <ellipse cx="150" cy="185" rx="5" ry="4.4" fill={`url(#${id("oroR")})`} />
        {/* cuello */}
        <path d="M140 50 L 140 72 Q 150 78 160 72 L 160 50 Z" fill={`url(#${id("piel")})`} />
        {/* cabello: cabeza, moño y mechones */}
        <ellipse cx="150" cy="44" rx="24" ry="28" fill={`url(#${id("pelo")})`} />
        <path d="M130 52 C 132 64 140 70 150 70 C 160 70 168 64 170 52 C 166 60 160 64 150 64 C 140 64 134 60 130 52 Z" fill="#3a241c" />
        <circle cx="150" cy="22" r="15" fill={`url(#${id("pelo")})`} />
        <path d="M138 22 C 140 12 158 10 162 20 C 160 30 146 32 142 24 C 146 18 154 18 156 22" fill="none" stroke="#a87660" strokeOpacity=".7" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M134 34 C 140 44 140 56 136 64 M150 28 C 152 42 152 56 150 66 M166 34 C 160 44 160 56 164 64 M142 30 C 146 44 146 56 142 66"
          fill="none" stroke="#9b6a55" strokeOpacity=".5" strokeWidth="1" strokeLinecap="round" />
        <path d="M131 58 C 126 66 130 74 126 82 C 124 86 128 90 126 94" fill="none" stroke="#4a2d22" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M169 58 C 174 66 170 74 174 82 C 176 86 172 90 174 94" fill="none" stroke="#4a2d22" strokeWidth="1.6" strokeLinecap="round" />
        {/* tiara vista desde atrás */}
        <path d="M128 30 C 136 18 164 18 172 30" fill="none" stroke={`url(#${id("oro")})`} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M136 22 L 138 13 L 142 21 M148 18 L 150 7 L 152 18 M158 21 L 162 13 L 164 22" fill="none" stroke={`url(#${id("oro")})`} strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="150" cy="7" r="2" fill="white" />
        <circle cx="138" cy="13" r="1.5" fill="white" />
        <circle cx="162" cy="13" r="1.5" fill="white" />
      </g>
      {/* rosas aplicadas en la falda */}
      <Rosa x={150} y={196} r={6} tono={col("gold-light")} sinSombra />
      <Rosa x={96} y={318} r={8} rot={-20} tono={mezcla("gold", 60, "white")} sinSombra />
      <Rosa x={204} y={330} r={7} rot={14} tono={mezcla("gold", 60, "white")} sinSombra />
      <Rosa x={150} y={376} r={9} tono={col("gold-light")} sinSombra />
      <Rosa x={58} y={404} r={8} rot={-10} tono={col("gold-light")} sinSombra />
      <Rosa x={244} y={404} r={8} rot={10} tono={col("gold-light")} sinSombra />
      <Rosa x={124} y={270} r={6} tono={col("gold-light")} sinSombra />
      <Rosa x={178} y={262} r={6} tono={col("gold-light")} sinSombra />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Tiara y zapatillas                                                  */
/* ------------------------------------------------------------------ */

// SDXL: vr_tiara
// Tiara de oro suave con filigrana, perlas y una piedra rosa al centro.
export function VrTiara({ className = "" }) {
  const id = useUid();
  const piedras = [[40, 72, 2.4], [62, 68, 2.8], [138, 68, 2.8], [160, 72, 2.4], [80, 62, 2.2], [120, 62, 2.2]];
  return (
    <svg className={className} viewBox="0 0 200 100" aria-hidden="true">
      <defs>
        <Oro id={id("oro")} />
        <OroRadial id={id("oroR")} />
        <radialGradient id={id("gema")} cx="40%" cy="35%" r="70%">
          <Stop o="0" c="white" />
          <Stop o=".35" c={col("gold-light")} />
          <Stop o=".75" c={col("gold")} />
          <Stop o="1" c={col("gold-dark")} />
        </radialGradient>
        <radialGradient id={id("perla")} cx="35%" cy="30%" r="70%">
          <Stop o="0" c="white" />
          <Stop o=".6" c="#f6eee9" />
          <Stop o="1" c={mezcla("gold-light", 60, col("seal"))} />
        </radialGradient>
        <filter id={id("sombra")} x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#4a2e36" floodOpacity=".25" /></filter>
      </defs>
      <g filter={`url(#${id("sombra")})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 86 Q 100 64 186 86" stroke={`url(#${id("oro")})`} strokeWidth="5" />
        <path d="M16 92 Q 100 72 184 92" stroke={`url(#${id("oro")})`} strokeWidth="2" />
        {/* filigrana */}
        <path d="M24 82 C 26 66 36 56 44 52 C 50 62 54 70 56 76 M56 76 C 60 58 70 44 80 38 C 86 52 88 62 88 70 M88 70 C 92 46 96 26 100 10 C 104 26 108 46 112 70 M112 70 C 112 62 114 52 120 38 C 130 44 140 58 144 76 M144 76 C 146 70 150 62 156 52 C 164 56 174 66 176 82"
          stroke={`url(#${id("oro")})`} strokeWidth="2.6" />
        <path d="M44 74 C 40 66 46 62 50 66 C 52 70 48 72 46 70 M156 74 C 160 66 154 62 150 66 C 148 70 152 72 154 70 M72 66 C 66 56 74 50 80 56 C 82 62 76 64 74 60 M128 66 C 134 56 126 50 120 56 C 118 62 124 64 126 60 M100 54 C 92 48 92 38 100 34 C 108 38 108 48 100 54 Z"
          stroke={`url(#${id("oro")})`} strokeWidth="1.6" />
      </g>
      <ellipse cx="100" cy="44" rx="6.5" ry="9" fill={`url(#${id("gema")})`} stroke={`url(#${id("oro")})`} strokeWidth="1.4" />
      <path d="M97 39 L 99 46" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      {[[100, 9, 4.6], [44, 51, 3.6], [156, 51, 3.6], [80, 37, 3.8], [120, 37, 3.8]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={`url(#${id("perla")})`} stroke={col("seal", 0.5)} strokeWidth=".5" />
      ))}
      {piedras.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="white" stroke={`url(#${id("oro")})`} strokeWidth=".9" />
          <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.35} fill={col("gold-light")} />
        </g>
      ))}
    </svg>
  );
}

// SDXL: vr_zapatillas
// Par de zapatillas de satén rosa palo con tacón dorado y lazo.
export function VrZapatillas({ className = "" }) {
  const id = useUid();
  const zapato = "M34 52 C 29 62 28 78 34 90 L 40 93 L 46 124 L 51 124 L 54 97 C 72 101 94 112 128 116 C 160 120 194 118 202 108 C 206 98 196 92 180 90 C 152 86 130 84 116 86 C 92 90 62 76 34 52 Z";
  const Uno = ({ dx, dy, s, atras }) => (
    <g transform={`translate(${dx} ${dy}) scale(${s})`} opacity={atras ? 0.92 : 1}>
      <path d={zapato} fill={`url(#${id(atras ? "satenB" : "saten")})`} />
      <path d="M38 56 C 62 74 92 88 116 87 C 96 95 66 90 44 74 Z" fill={mezcla("gold-light", 50, "white")} />
      <path d="M40 93 L 46 124 L 51 124 L 54 97 Z" fill={`url(#${id("oro")})`} />
      <path d="M54 97 C 72 101 94 112 128 116 C 160 120 194 118 202 108" fill="none" stroke={mezcla("gold-dark", 70, col("ink"))} strokeWidth="2" />
      <path d="M60 86 C 90 100 140 106 186 100" fill="none" stroke="white" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" filter={`url(#${id("difuso")})`} />
      <path d="M116 86 C 110 78 102 80 104 86 C 106 92 112 90 116 87 C 120 78 130 78 128 85 C 126 92 118 90 116 87 Z" fill={`url(#${id("saten")})`} stroke={col("gold-dark", 0.5)} strokeWidth=".8" />
      <circle cx="116" cy="86.5" r="2.6" fill={`url(#${id("oroR")})`} />
    </g>
  );
  return (
    <svg className={className} viewBox="0 0 230 140" aria-hidden="true" overflow="visible">
      <defs>
        <linearGradient id={id("saten")} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c={mezcla("gold", 50, "white")} />
          <Stop o=".45" c={col("gold")} />
          <Stop o=".7" c={mezcla("gold", 70, "white")} />
          <Stop o="1" c={mezcla("gold", 70, col("gold-dark"))} />
        </linearGradient>
        <linearGradient id={id("satenB")} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c={mezcla("gold", 75, "white")} />
          <Stop o=".5" c={mezcla("gold", 80, col("gold-dark"))} />
          <Stop o="1" c={mezcla("gold", 50, col("gold-dark"))} />
        </linearGradient>
        <Oro id={id("oro")} x2="1" y2="0" />
        <OroRadial id={id("oroR")} />
        <filter id={id("difuso")} x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="2" /></filter>
        <filter id={id("sombra")} x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="4" /></filter>
        <Grano id={id("grano")} fuerza={0.06} />
      </defs>
      <ellipse cx="124" cy="128" rx="96" ry="7" fill={col("gold-dark", 0.3)} filter={`url(#${id("sombra")})`} />
      <g filter={`url(#${id("grano")})`}>
        <Uno dx={-18} dy={-10} s={0.94} atras />
        <Uno dx={14} dy={4} s={1} />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Ornamentos del libro                                                */
/* ------------------------------------------------------------------ */

// Letra capital dorada e iluminada (primera letra del título de cada página).
export function VrCapital({ letra = "A", className = "" }) {
  const id = useUid();
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={id("campo")} cx="50%" cy="45%" r="70%">
          <Stop o="0" c={mezcla("gold-light", 35, "white")} />
          <Stop o="1" c={col("gold-light")} />
        </radialGradient>
        <linearGradient id={id("letra")} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c={mezcla("seal", 55, "white")} />
          <Stop o=".45" c={col("seal")} />
          <Stop o=".6" c={mezcla("seal", 65, col("ink"))} />
          <Stop o="1" c={mezcla("seal", 80, "white")} />
        </linearGradient>
        <Oro id={id("oro")} x2="1" y2="1" />
        <filter id={id("relieve")} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx=".8" dy="1.4" stdDeviation=".6" floodColor="#4a2e36" floodOpacity=".45" />
        </filter>
      </defs>
      <rect x="2" y="2" width="96" height="96" rx="3" fill={`url(#${id("campo")})`} />
      <rect x="2" y="2" width="96" height="96" rx="3" fill="none" stroke={`url(#${id("oro")})`} strokeWidth="3" />
      <rect x="8" y="8" width="84" height="84" rx="1" fill="none" stroke={col("seal", 0.7)} strokeWidth="1" />
      {/* filigrana de enredadera */}
      <g fill="none" stroke={col("seal", 0.6)} strokeWidth="1.1" strokeLinecap="round">
        <path d="M12 88 C 18 70 14 56 22 44 C 28 36 20 28 14 32 C 10 36 16 40 18 36" />
        <path d="M88 12 C 82 30 86 44 78 56 C 72 64 80 72 86 68 C 90 64 84 60 82 64" />
        <path d="M12 88 C 26 84 34 90 46 86 M88 12 C 74 16 66 10 54 14" />
      </g>
      <g fill={col("seal", 0.5)}>
        <path d="M22 44 C 16 42 14 46 18 50 C 22 48 22 46 22 44 Z" />
        <path d="M78 56 C 84 58 86 54 82 50 C 78 52 78 54 78 56 Z" />
        <circle cx="46" cy="86" r="1.8" /><circle cx="54" cy="14" r="1.8" />
      </g>
      <circle cx="16" cy="84" r="5" fill={col("gold")} />
      <circle cx="16" cy="84" r="2.6" fill={col("gold-dark")} />
      <circle cx="84" cy="16" r="5" fill={col("gold")} />
      <circle cx="84" cy="16" r="2.6" fill={col("gold-dark")} />
      <text x="51" y="73" textAnchor="middle" fontSize="66" filter={`url(#${id("relieve")})`}
        style={{ fontFamily: 'var(--fuente-titulos, "Prata"), Georgia, serif' }} fill={`url(#${id("letra")})`}
        stroke={mezcla("seal", 60, col("ink"))} strokeWidth=".8">{letra}</text>
    </svg>
  );
}

// Esquinero de filigrana dorada para las páginas.
export function VrEsquina({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 60 60" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M4 56 V14 C 4 8 8 4 14 4 H56" />
        <path d="M10 50 V20 C 10 14 14 10 20 10 H50" strokeOpacity=".55" />
        <path d="M14 26 C 14 18 18 14 26 14 C 22 18 22 22 26 24 C 30 26 32 22 30 20" />
        <path d="M4 34 C 8 32 10 34 10 38 M34 4 C 32 8 34 10 38 10" strokeOpacity=".7" />
      </g>
      <circle cx="26" cy="26" r="2" fill="currentColor" />
    </svg>
  );
}

// Filete con un rombo y dos hojitas, en oro.
export function VrFilete({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 220 20" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M6 10 H88 M132 10 H214" strokeWidth="1" strokeOpacity=".7" />
        <path d="M88 10 C 96 4 102 6 104 10 C 102 14 96 16 88 10 Z M132 10 C 124 4 118 6 116 10 C 118 14 124 16 132 10 Z" strokeWidth="1" />
      </g>
      <path d="M110 3 L 117 10 L 110 17 L 103 10 Z" fill="currentColor" />
      <circle cx="6" cy="10" r="1.6" fill="currentColor" />
      <circle cx="214" cy="10" r="1.6" fill="currentColor" />
    </svg>
  );
}
