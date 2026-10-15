import { useId } from "react";

// Arte de «Eucalipto», todo en SVG semi-realista: rosas blancas de jardín,
// peonías blancas, gipsofila (baby's breath) y eucalipto plateado. Cada pétalo
// es una curva Bézier con un degradado radial (más hondo hacia el centro de la
// flor) y una segunda capa de luz que entra desde arriba a la izquierda; las
// hojas llevan nervio y una «pruina» blanquecina, como el eucalipto real.
// Encima va una sombra suave y un grano fino (feTurbulence) para que no se vea
// plano. Los colores naturales (pétalos, hojas, tallos) son fijos; el metal,
// la cera y el hilo salen del tema (--color-seal, --color-gold…).
//
// Cada pieza exportada lleva encima su nombre SDXL por si luego se cambia por
// una pintura .webp. Los ids de degradados y filtros salen de useId(), así una
// pieza puede repetirse en la página sin chocar consigo misma.

const tema = (v, mezcla) =>
  mezcla ? `color-mix(in srgb, rgb(var(${v})) ${mezcla})` : `rgb(var(${v}))`;

function usePrefijo() {
  return `eu${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

// Número pseudoaleatorio estable (mismas flores en cada carga).
function azar(semilla) {
  let s = semilla % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const n1 = (v) => Math.round(v * 10) / 10;

// Punto a `u` unidades a lo largo de un eje que apunta a `ang` grados (0 =
// arriba, sentido horario) y `v` unidades hacia su derecha.
function giro(cx, cy, ang) {
  const t = (ang * Math.PI) / 180;
  const s = Math.sin(t);
  const c = Math.cos(t);
  return (u, v) => `${n1(cx + u * s + v * c)} ${n1(cy - u * c + v * s)}`;
}
function giroN(cx, cy, ang) {
  const t = (ang * Math.PI) / 180;
  return (u, v = 0) => [cx + u * Math.sin(t) + v * Math.cos(t), cy - u * Math.cos(t) + v * Math.sin(t)];
}

/* ---------------- Formas ---------------- */

function petaloRosa(ang, L, W) {
  const p = giro(0, 0, ang);
  return `M${p(2, 0)}C${p(0.22 * L, -0.95 * W)} ${p(0.84 * L, -1.14 * W)} ${p(0.99 * L, -0.4 * W)}Q${p(1.06 * L, 0)} ${p(0.99 * L, 0.4 * W)}C${p(0.84 * L, 1.14 * W)} ${p(0.22 * L, 0.95 * W)} ${p(2, 0)}Z`;
}
// Borde vuelto del pétalo: una línea de luz justo bajo la punta.
function rizoRosa(ang, L, W) {
  const p = giro(0, 0, ang);
  return `M${p(0.84 * L, -0.74 * W)}Q${p(1.04 * L, 0)} ${p(0.84 * L, 0.74 * W)}`;
}
function petaloPeonia(cx, cy, ang, L, W, r) {
  const p = giro(cx, cy, ang);
  const j = () => (r() - 0.5) * 0.09 * L;
  return `M${p(1, 0)}C${p(0.15 * L, -1.0 * W)} ${p(0.62 * L, -1.25 * W)} ${p(0.86 * L + j(), -0.8 * W)}Q${p(0.99 * L, -0.62 * W)} ${p(0.94 * L + j(), -0.3 * W)}Q${p(1.08 * L + j(), -0.04 * W)} ${p(0.96 * L, 0.2 * W)}Q${p(1.03 * L + j(), 0.55 * W)} ${p(0.86 * L, 0.8 * W)}C${p(0.62 * L, 1.25 * W)} ${p(0.15 * L, 1.0 * W)} ${p(1, 0)}Z`;
}
function plieguePeonia(cx, cy, ang, L, W, lado) {
  const p = giro(cx, cy, ang);
  return `M${p(0.22 * L, lado * 0.08 * W)}Q${p(0.55 * L, lado * 0.32 * W)} ${p(0.86 * L, lado * 0.42 * W)}`;
}
function arco(r, a0, a1) {
  const p = giro(0, 0, 0);
  const q0 = giro(0, 0, a0)(r, 0);
  const q1 = giro(0, 0, a1)(r, 0);
  void p;
  return `M${q0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${q1}`;
}

// Rosa de jardín: tres coronas de pétalos y un centro en espiral (radio ≈ 52).
const ROSA = (() => {
  const r = azar(7);
  const capa = (n, L, W, off) =>
    Array.from({ length: n }, (_, i) => {
      const a = off + (i * 360) / n + (r() - 0.5) * 12;
      const l = L * (0.93 + r() * 0.14);
      const w = W * (0.9 + r() * 0.18);
      return { d: petaloRosa(a, l, w), rizo: rizoRosa(a, l, w) };
    });
  return {
    capas: [capa(7, 50, 24, 0), capa(6, 39, 19, 27), capa(5, 28, 15, 9)],
    espiral: [arco(14.5, 20, 250), arco(11, 140, 375), arco(7.5, 255, 480), arco(4.2, 30, 250)],
  };
})();

// Peonía: cuatro coronas de pétalos rizados y un centro de pétalos arrugados
// (radio ≈ 62).
const PEONIA = (() => {
  const r = azar(23);
  const capa = (n, L, W, off) =>
    Array.from({ length: n }, (_, i) => {
      const a = off + (i * 360) / n + (r() - 0.5) * 14;
      const l = L * (0.92 + r() * 0.16);
      const w = W * (0.9 + r() * 0.2);
      return {
        d: petaloPeonia(0, 0, a, l, w, r),
        pliegues: [plieguePeonia(0, 0, a, l, w, -1), plieguePeonia(0, 0, a, l, w, 1)],
      };
    });
  const centro = Array.from({ length: 13 }, () => {
    const cx = (r() - 0.5) * 12;
    const cy = (r() - 0.5) * 12;
    const a = r() * 360;
    const l = 10 + r() * 9;
    const w = 6 + r() * 4;
    return { d: petaloPeonia(cx, cy, a, l, w, r), pliegues: [plieguePeonia(cx, cy, a, l, w, 1)] };
  });
  const estambres = Array.from({ length: 9 }, () => [n1((r() - 0.5) * 16), n1((r() - 0.5) * 16), n1(0.9 + r() * 0.9)]);
  return {
    capas: [capa(10, 60, 25, 0), capa(9, 48, 22, 18), capa(8, 37, 18, 6), capa(7, 26, 14, 30)],
    centro,
    estambres,
  };
})();

const HOJA_REDONDA = "M0 0C-8 -1 -12.6 -8 -12.2 -14.6C-11.6 -22 -5.2 -26.6 0 -26.6C5.2 -26.6 11.6 -22 12.2 -14.6C12.6 -8 8 -1 0 0Z";
const NERVIO_REDONDA = "M0 -1Q1 -12 0 -24M0 -9Q-4 -12 -7 -17M0 -9Q4 -12 7 -17";
const HOJA_LARGA = "M0 0C-5 -8 -7.4 -24 -1.2 -42C-.4 -44 .6 -44 1.4 -42C7.2 -24 5 -8 0 0Z";
const NERVIO_LARGA = "M0 -1Q.8 -20 .2 -40";

/* ---------------- Definiciones compartidas ---------------- */

function Defs({ p }) {
  return (
    <defs>
      <radialGradient id={`${p}-rosa`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="54" fx="-4" fy="-6">
        <stop offset="0" stopColor="#CBC1A8" />
        <stop offset=".3" stopColor="#E5DECD" />
        <stop offset=".64" stopColor="#F6F3EA" />
        <stop offset="1" stopColor="#FFFFFF" />
      </radialGradient>
      <radialGradient id={`${p}-peonia`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="64" fx="-5" fy="-6">
        <stop offset="0" stopColor="#D3C7AE" />
        <stop offset=".28" stopColor="#EAE1D3" />
        <stop offset=".58" stopColor="#F8F2ED" />
        <stop offset="1" stopColor="#FFFFFF" />
      </radialGradient>
      <linearGradient id={`${p}-luz`} gradientUnits="userSpaceOnUse" x1="-46" y1="-50" x2="46" y2="52">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity=".65" />
        <stop offset=".46" stopColor="#FFFFFF" stopOpacity="0" />
        <stop offset="1" stopColor="#6A604B" stopOpacity=".22" />
      </linearGradient>
      <radialGradient id={`${p}-cupula`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="17">
        <stop offset="0" stopColor="#C7BCA2" />
        <stop offset=".65" stopColor="#ECE6D8" />
        <stop offset="1" stopColor="#FBFAF6" />
      </radialGradient>
      <linearGradient id={`${p}-hoja0`} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#6C887A" />
        <stop offset=".55" stopColor="#9AB2A4" />
        <stop offset="1" stopColor="#C4D3C9" />
      </linearGradient>
      <linearGradient id={`${p}-hoja1`} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#5D796A" />
        <stop offset=".55" stopColor="#86A091" />
        <stop offset="1" stopColor="#AFC2B6" />
      </linearGradient>
      <linearGradient id={`${p}-hoja2`} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#7A948B" />
        <stop offset=".55" stopColor="#A8BDB5" />
        <stop offset="1" stopColor="#D3DFD9" />
      </linearGradient>
      <radialGradient id={`${p}-polvo`} cx=".38" cy=".34" r=".7">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity=".42" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${p}-flor`} cx=".38" cy=".34" r=".7">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset=".6" stopColor="#F1EEE6" />
        <stop offset="1" stopColor="#D2CCBC" />
      </radialGradient>
      <linearGradient id={`${p}-tallo`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#7C7468" />
        <stop offset=".5" stopColor="#A39A8B" />
        <stop offset="1" stopColor="#7C7468" />
      </linearGradient>
      <filter id={`${p}-sombra`} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
        <feDropShadow dx="1" dy="3" stdDeviation="2.6" floodColor="#2F3A33" floodOpacity=".2" />
      </filter>
      <filter id={`${p}-grano`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5" result="ruido" />
        <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 .32  0 0 0 0 .3  0 0 0 0 .24  .6 0 0 0 -.22" result="grano" />
        <feComposite in="grano" in2="SourceAlpha" operator="in" result="granoDentro" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="granoDentro" />
        </feMerge>
      </filter>
      {/* Metal envejecido del tema (anillos, ojales). */}
      <linearGradient id={`${p}-oro`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={{ stopColor: tema("--color-seal", "35%, white") }} />
        <stop offset=".35" style={{ stopColor: tema("--color-seal") }} />
        <stop offset=".6" style={{ stopColor: tema("--color-seal", "62%, #2b2418") }} />
        <stop offset=".82" style={{ stopColor: tema("--color-seal", "55%, white") }} />
        <stop offset="1" style={{ stopColor: tema("--color-seal", "80%, #2b2418") }} />
      </linearGradient>
    </defs>
  );
}

/* ---------------- Flores y follaje ---------------- */

function Rosa({ x, y, s = 1, a = 0, p }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`} filter={`url(#${p}-sombra)`}>
      {ROSA.capas.map((capa, k) => (
        <g key={k}>
          {capa.map((pt, i) => (
            <g key={i}>
              <path d={pt.d} fill={`url(#${p}-rosa)`} stroke="#BFB59E" strokeOpacity=".7" strokeWidth=".6" />
              <path d={pt.d} fill={`url(#${p}-luz)`} />
              <path d={pt.rizo} fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity=".95" />
            </g>
          ))}
        </g>
      ))}
      <circle r="15.5" fill={`url(#${p}-cupula)`} />
      {ROSA.espiral.map((d, i) => (
        <g key={i} fill="none" strokeLinecap="round">
          <path d={d} stroke="#AFA48B" strokeWidth="1.2" opacity=".75" />
          <path d={d} transform="translate(-.7 -.9)" stroke="#FFFFFF" strokeWidth="1.5" />
        </g>
      ))}
      <ellipse rx="2.4" ry="1.8" fill="#9E9279" opacity=".55" />
    </g>
  );
}

function Peonia({ x, y, s = 1, a = 0, p }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`} filter={`url(#${p}-sombra)`}>
      {PEONIA.capas.map((capa, k) => (
        <g key={k}>
          {capa.map((pt, i) => (
            <g key={i}>
              <path d={pt.d} fill={`url(#${p}-peonia)`} stroke="#C2B8A2" strokeOpacity=".65" strokeWidth=".6" />
              <path d={pt.d} fill={`url(#${p}-luz)`} />
              <path d={`${pt.pliegues[0]}${pt.pliegues[1]}`} fill="none" stroke="#CFC5B0" strokeOpacity=".55" strokeWidth=".6" strokeLinecap="round" />
            </g>
          ))}
        </g>
      ))}
      {PEONIA.estambres.map(([ex, ey, er], i) => (
        <circle key={i} cx={ex} cy={ey} r={er} fill="#E2CF94" opacity=".8" />
      ))}
      {PEONIA.centro.map((pt, i) => (
        <g key={i}>
          <path d={pt.d} fill={`url(#${p}-peonia)`} stroke="#BDB39C" strokeOpacity=".6" strokeWidth=".5" />
          <path d={pt.d} fill={`url(#${p}-luz)`} />
          <path d={pt.pliegues[0]} fill="none" stroke="#CFC5B0" strokeOpacity=".5" strokeWidth=".5" />
        </g>
      ))}
    </g>
  );
}

function Hoja({ x, y, a, s, tipo, tono, p }) {
  const larga = tipo === "larga";
  return (
    <g transform={`translate(${n1(x)} ${n1(y)}) rotate(${n1(a)}) scale(${n1(s * 100) / 100})`}>
      <path d={larga ? HOJA_LARGA : HOJA_REDONDA} fill={`url(#${p}-hoja${tono})`} stroke="#4F6857" strokeOpacity=".35" strokeWidth=".6" />
      <path d={larga ? HOJA_LARGA : HOJA_REDONDA} fill={`url(#${p}-polvo)`} />
      <path d={larga ? NERVIO_LARGA : NERVIO_REDONDA} fill="none" stroke="#EAF1EB" strokeOpacity=".5" strokeWidth=".7" strokeLinecap="round" />
    </g>
  );
}

// Ramita de eucalipto a lo largo de una curva cuadrática [x0 y0 cx cy x1 y1].
function Ramita({ c, n = 7, s0 = 1, s1 = 0.6, tipo = "redonda", opuestas = false, semilla = 1, sombra = true, p }) {
  const [x0, y0, cx, cy, x1, y1] = c;
  const r = azar(semilla);
  const punto = (t) => [
    (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1,
    (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1,
  ];
  const rumbo = (t) => {
    const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx);
    const dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
    return (Math.atan2(dx, -dy) * 180) / Math.PI;
  };
  const hojas = [];
  for (let i = 0; i < n; i++) {
    const t = 0.14 + (0.84 * i) / Math.max(1, n - 1);
    const [hx, hy] = punto(t);
    const s = s0 + ((s1 - s0) * i) / Math.max(1, n - 1);
    const lados = opuestas ? [-1, 1] : [i % 2 ? 1 : -1];
    lados.forEach((lado) => {
      const abre = tipo === "larga" ? 28 + r() * 22 : 48 + r() * 26;
      hojas.push({ x: hx, y: hy, a: rumbo(t) + lado * abre, s: s * (0.9 + r() * 0.2), tono: Math.floor(r() * 3) });
    });
  }
  const [px, py] = punto(1);
  hojas.push({ x: px, y: py, a: rumbo(1), s: s1 * 0.85, tono: 2 });
  return (
    <g filter={sombra ? `url(#${p}-sombra)` : undefined}>
      <path d={`M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}`} fill="none" stroke="#8B8275" strokeWidth={tipo === "larga" ? 1.2 : 1.6} strokeLinecap="round" />
      {hojas.map((h, i) => <Hoja key={i} {...h} tipo={tipo} p={p} />)}
    </g>
  );
}

// Gipsofila: tallitos finos que se abren en ramilletes de florecitas blancas.
function Gipsofila({ x, y, a = 0, s = 1, semilla = 3, p }) {
  const r = azar(semilla);
  const eje = giroN(x, y, a);
  const largo = 30 * s;
  const tallos = [];
  const flores = [];
  const [ex, ey] = eje(largo);
  tallos.push(`M${n1(x)} ${n1(y)}L${n1(ex)} ${n1(ey)}`);
  const ramas = 5 + Math.floor(r() * 3);
  for (let k = 0; k < ramas; k++) {
    const desde = eje(largo * (0.45 + r() * 0.55));
    const ang = a + (r() - 0.5) * 120;
    const [bx, by] = giroN(desde[0], desde[1], ang)((12 + r() * 16) * s);
    tallos.push(`M${n1(desde[0])} ${n1(desde[1])}L${n1(bx)} ${n1(by)}`);
    const cuantas = 3 + Math.floor(r() * 3);
    for (let f = 0; f < cuantas; f++) {
      const fx = bx + (r() - 0.5) * 9 * s;
      const fy = by + (r() - 0.5) * 9 * s;
      tallos.push(`M${n1(bx)} ${n1(by)}L${n1(fx)} ${n1(fy)}`);
      flores.push([n1(fx), n1(fy), n1((1.7 + r() * 1.3) * s)]);
    }
  }
  return (
    <g filter={`url(#${p}-sombra)`}>
      <path d={tallos.join("")} fill="none" stroke="#98A68C" strokeWidth=".7" strokeLinecap="round" />
      {flores.map(([fx, fy, fr], i) => (
        <g key={i}>
          <circle cx={fx} cy={fy} r={fr} fill={`url(#${p}-flor)`} stroke="#D3CDBD" strokeWidth=".35" />
          <circle cx={fx + fr * 0.1} cy={fy + fr * 0.15} r={fr * 0.28} fill="#CDBF98" opacity=".7" />
        </g>
      ))}
    </g>
  );
}

/* ---------------- Piezas ---------------- */

// SDXL: eu_rama
// Gran rama de rosas blancas, peonías, gipsofila y eucalipto plateado que
// nace del borde izquierdo (la derecha es la misma, en espejo por CSS).
export function EuRama({ className = "" }) {
  const p = usePrefijo();
  return (
    <svg className={className} viewBox="0 0 340 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Defs p={p} />
      <g filter={`url(#${p}-grano)`}>
        {/* Fondo: eucalipto de hoja larga */}
        <Ramita p={p} c={[-10, 150, 130, 70, 330, 24]} n={8} s0={1} s1={0.65} tipo="larga" semilla={11} />
        <Ramita p={p} c={[-10, 480, 150, 440, 338, 372]} n={8} s0={1} s1={0.65} tipo="larga" semilla={12} />
        <Ramita p={p} c={[-10, 830, 160, 890, 330, 950]} n={8} s0={1} s1={0.65} tipo="larga" semilla={13} />
        {/* Eucalipto dólar de plata */}
        <Ramita p={p} c={[-10, 40, 110, 96, 262, 30]} n={8} s0={1.05} s1={0.55} opuestas semilla={21} />
        <Ramita p={p} c={[-10, 270, 150, 310, 336, 228]} n={9} s0={1.1} s1={0.55} opuestas semilla={22} />
        <Ramita p={p} c={[-10, 610, 170, 560, 334, 610]} n={9} s0={1.1} s1={0.55} opuestas semilla={23} />
        <Ramita p={p} c={[-10, 720, 120, 690, 262, 770]} n={7} s0={1} s1={0.55} opuestas semilla={24} />
        <Ramita p={p} c={[-10, 965, 140, 960, 310, 1006]} n={8} s0={1.05} s1={0.55} opuestas semilla={25} />
        <Ramita p={p} c={[30, 400, 140, 350, 236, 300]} n={6} s0={0.95} s1={0.55} semilla={26} />
        {/* Gipsofila */}
        <Gipsofila p={p} x={190} y={160} a={50} s={1.25} semilla={31} />
        <Gipsofila p={p} x={276} y={300} a={70} s={1.15} semilla={32} />
        <Gipsofila p={p} x={150} y={460} a={80} s={1.2} semilla={33} />
        <Gipsofila p={p} x={292} y={540} a={40} s={1.15} semilla={34} />
        <Gipsofila p={p} x={210} y={690} a={70} s={1.25} semilla={35} />
        <Gipsofila p={p} x={290} y={860} a={30} s={1.15} semilla={36} />
        <Gipsofila p={p} x={40} y={340} a={20} s={1.1} semilla={37} />
        <Gipsofila p={p} x={60} y={900} a={60} s={1.1} semilla={38} />
        {/* Flores */}
        <Peonia p={p} x={92} y={160} s={1.15} a={-8} />
        <Rosa p={p} x={272} y={128} s={0.95} a={14} />
        <Rosa p={p} x={318} y={258} s={0.46} a={40} />
        <Rosa p={p} x={178} y={318} s={0.85} a={-20} />
        <Peonia p={p} x={292} y={432} s={0.98} a={22} />
        <Rosa p={p} x={78} y={520} s={1.0} a={6} />
        <Rosa p={p} x={232} y={606} s={0.8} a={-30} />
        <Rosa p={p} x={330} y={662} s={0.44} a={10} />
        <Peonia p={p} x={110} y={772} s={1.15} a={12} />
        <Rosa p={p} x={286} y={764} s={0.9} a={-6} />
        <Rosa p={p} x={204} y={924} s={1.0} a={30} />
        {/* Hojas delante para integrar el ramo */}
        <Ramita p={p} c={[150, 236, 200, 250, 250, 240]} n={4} s0={0.75} s1={0.55} opuestas semilla={41} />
        <Ramita p={p} c={[170, 690, 220, 700, 262, 684]} n={4} s0={0.75} s1={0.55} opuestas semilla={42} />
        <Ramita p={p} c={[20, 640, 60, 610, 118, 612]} n={4} s0={0.75} s1={0.55} opuestas semilla={43} />
        <Gipsofila p={p} x={236} y={470} a={110} s={1} semilla={44} />
        <Gipsofila p={p} x={140} y={240} a={100} s={0.9} semilla={45} />
      </g>
    </svg>
  );
}

// SDXL: eu_tallo
// Tramo del tallo de eucalipto que baja por el centro de la página. Entra y
// sale por el centro con la misma pendiente, así los tramos se apilan sin
// costura. `espejo` lo invierte para que no se note la repetición.
export function EuTallo({ className = "", espejo = false }) {
  const p = usePrefijo();
  const pares = [
    [57.6, 52, -62, 58, 1],
    [56.4, 150, -52, 68, 0.92],
    [62.8, 252, -66, 54, 1.04],
    [62.4, 352, -56, 64, 0.9],
  ];
  return (
    <svg className={className} viewBox="0 0 120 400" aria-hidden="true">
      <Defs p={p} />
      <g filter={`url(#${p}-grano)`} transform={espejo ? "translate(120 0) scale(-1 1)" : undefined}>
        <g filter={`url(#${p}-sombra)`}>
          <path d="M60 0C52 100 68 300 60 400" fill="none" stroke={`url(#${p}-tallo)`} strokeWidth="2.6" />
          {pares.map(([x, y, a1, a2, s], i) => (
            <g key={i}>
              <Hoja x={x} y={y} a={a1} s={s} tono={i % 3} p={p} />
              <Hoja x={x} y={y} a={a2} s={s * 0.96} tono={(i + 1) % 3} p={p} />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

// SDXL: eu_hojas
// Filete: dos ramitas de eucalipto que salen de una perla dorada.
export function EuHojas({ className = "" }) {
  const p = usePrefijo();
  return (
    <svg className={className} viewBox="0 0 200 44" aria-hidden="true">
      <Defs p={p} />
      <g filter={`url(#${p}-grano)`}>
        <Ramita p={p} c={[96, 24, 60, 14, 12, 24]} n={5} s0={0.62} s1={0.42} opuestas semilla={51} />
        <Ramita p={p} c={[104, 24, 140, 14, 188, 24]} n={5} s0={0.62} s1={0.42} opuestas semilla={52} />
        <circle cx="100" cy="24" r="3.6" fill={`url(#${p}-oro)`} />
        <circle cx="99" cy="22.8" r="1.1" fill="#FFFFFF" opacity=".8" />
      </g>
    </svg>
  );
}

// SDXL: eu_ramito
// Ramito de novia pequeño: peonía, dos rosas, gipsofila y eucalipto, atado
// con una cinta de satín marfil con hilo del tema.
export function EuRamito({ className = "" }) {
  const p = usePrefijo();
  return (
    <svg className={className} viewBox="0 0 240 250" aria-hidden="true">
      <Defs p={p} />
      <g filter={`url(#${p}-grano)`}>
        <g filter={`url(#${p}-sombra)`}>
          <path d="M112 168L104 246M118 168L116 248M124 168L128 247M130 168L138 244" stroke="#8E9A82" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </g>
        <Ramita p={p} c={[118, 150, 70, 120, 24, 70]} n={6} s0={0.9} s1={0.55} opuestas semilla={61} />
        <Ramita p={p} c={[122, 150, 170, 116, 216, 66]} n={6} s0={0.9} s1={0.55} opuestas semilla={62} />
        <Ramita p={p} c={[120, 150, 120, 80, 116, 8]} n={6} s0={0.8} s1={0.5} tipo="larga" semilla={63} />
        <Ramita p={p} c={[116, 160, 60, 160, 20, 136]} n={4} s0={0.8} s1={0.5} tipo="larga" semilla={64} />
        <Ramita p={p} c={[124, 160, 180, 160, 222, 132]} n={4} s0={0.8} s1={0.5} tipo="larga" semilla={65} />
        <Gipsofila p={p} x={92} y={100} a={-40} s={1.1} semilla={66} />
        <Gipsofila p={p} x={150} y={96} a={40} s={1.1} semilla={67} />
        <Gipsofila p={p} x={120} y={70} a={0} s={0.9} semilla={68} />
        <Rosa p={p} x={76} y={128} s={0.55} a={-20} />
        <Rosa p={p} x={166} y={124} s={0.5} a={25} />
        <Peonia p={p} x={120} y={108} s={0.72} a={8} />
        <Rosa p={p} x={146} y={62} s={0.3} a={0} />
        {/* Cinta: lazada de satín con borde de hilo */}
        <g filter={`url(#${p}-sombra)`}>
          <path d="M120 176C100 160 82 162 84 174C86 186 106 184 120 178Z" fill="#FBF8F0" stroke="#D8CFBC" strokeWidth=".8" />
          <path d="M120 176C140 160 158 162 156 174C154 186 134 184 120 178Z" fill="#F6F1E6" stroke="#D8CFBC" strokeWidth=".8" />
          <path d="M117 180C110 196 100 210 92 222L100 220L102 228C110 214 118 198 121 182Z" fill="#F3EEE2" stroke="#D8CFBC" strokeWidth=".8" />
          <path d="M123 180C130 196 140 210 148 222L140 220L138 228C130 214 122 198 119 182Z" fill="#FBF8F0" stroke="#D8CFBC" strokeWidth=".8" />
          <rect x="108" y="168" width="24" height="16" rx="6" fill="#FFFDF8" stroke="#D8CFBC" strokeWidth=".8" />
          <path d="M110 176H130" style={{ stroke: tema("--color-seal") }} strokeWidth="1" />
          <path d="M90 172C98 168 106 170 112 174M150 172C142 168 134 170 128 174" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity=".9" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

// SDXL: eu_anillos
// Dos argollas de oro viejo entrelazadas, una con diamante, sobre una
// ramita de eucalipto y gipsofila.
export function EuAnillos({ className = "" }) {
  const p = usePrefijo();
  return (
    <svg className={className} viewBox="0 0 180 120" aria-hidden="true">
      <Defs p={p} />
      <defs>
        <clipPath id={`${p}-cruce`}>
          <rect x="86" y="70" width="30" height="30" />
        </clipPath>
        <linearGradient id={`${p}-diamante`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".5" stopColor="#E3ECEE" />
          <stop offset="1" stopColor="#AFC0C6" />
        </linearGradient>
      </defs>
      <g filter={`url(#${p}-grano)`}>
        <Ramita p={p} c={[20, 100, 70, 112, 160, 96]} n={6} s0={0.7} s1={0.45} opuestas semilla={71} />
        <Gipsofila p={p} x={140} y={98} a={50} s={0.8} semilla={72} />
        <Gipsofila p={p} x={34} y={96} a={-50} s={0.8} semilla={73} />
        <ellipse cx="92" cy="96" rx="52" ry="7" fill="#2F3A33" opacity=".1" />
        <g filter={`url(#${p}-sombra)`} fill="none">
          <ellipse cx="74" cy="66" rx="30" ry="25" stroke={`url(#${p}-oro)`} strokeWidth="7.5" />
          <ellipse cx="74" cy="66" rx="30" ry="25" stroke="#FFFFFF" strokeOpacity=".45" strokeWidth="1.2" transform="translate(-1.6 -2)" />
          <ellipse cx="108" cy="58" rx="28" ry="23" stroke={`url(#${p}-oro)`} strokeWidth="6" />
          <ellipse cx="108" cy="58" rx="28" ry="23" stroke="#FFFFFF" strokeOpacity=".45" strokeWidth="1" transform="translate(-1.4 -1.8)" />
          {/* El primer anillo vuelve a pasar por delante en el cruce de abajo. */}
          <g clipPath={`url(#${p}-cruce)`}>
            <ellipse cx="74" cy="66" rx="30" ry="25" stroke={`url(#${p}-oro)`} strokeWidth="7.5" />
            <ellipse cx="74" cy="66" rx="30" ry="25" stroke="#FFFFFF" strokeOpacity=".45" strokeWidth="1.2" transform="translate(-1.6 -2)" />
          </g>
        </g>
        <g transform="translate(108 30)">
          <path d="M-5 2L0 -2L5 2L0 4Z" style={{ fill: tema("--color-seal", "70%, #3a3020") }} />
          <path d="M-7 -4L-3 -9H3L7 -4L0 4Z" fill={`url(#${p}-diamante)`} stroke="#9FB1B7" strokeWidth=".5" />
          <path d="M-7 -4H7M-3 -9L-2 -4L0 4M3 -9L2 -4L0 4" fill="none" stroke="#FFFFFF" strokeWidth=".5" opacity=".9" />
          <path d="M0 -15V-11M-4 -13.5L-2.6 -11.5M4 -13.5L2.6 -11.5" stroke="#FFFFFF" strokeWidth=".9" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

// SDXL: eu_copas
// Dos copas de champaña brindando, con burbujas y destellos dorados.
export function EuCopas({ className = "" }) {
  const p = usePrefijo();
  const copa = (
    <>
      <path d="M-14 0C-15 22 -9 46 -2 58V96H-14C-16 96 -16 100 -14 100H14C16 100 16 96 14 96H2V58C9 46 15 22 14 0Z" fill={`url(#${p}-vidrio)`} stroke="#8FA096" strokeOpacity=".7" strokeWidth=".9" />
      <path d="M-12.6 16C-12.6 30 -8 46 -1.6 55H1.6C8 46 12.6 30 12.6 16Z" fill={`url(#${p}-champana)`} />
      <path d="M-12.6 16H12.6" style={{ stroke: tema("--color-seal", "40%, white") }} strokeWidth="1.2" />
      {[[-5, 44, 1.1], [3, 36, 0.9], [-2, 28, 1.2], [5, 24, 0.8], [-6, 22, 0.7], [1, 48, 0.8]].map(([bx, by, br], i) => (
        <circle key={i} cx={bx} cy={by} r={br} fill="#FFFFFF" opacity=".75" />
      ))}
      <path d="M-10 4C-11 20 -7 38 -2 50" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
      <ellipse cx="0" cy="0" rx="14" ry="2.2" fill="none" stroke="#8FA096" strokeOpacity=".6" strokeWidth=".8" />
    </>
  );
  return (
    <svg className={className} viewBox="0 0 180 150" aria-hidden="true">
      <Defs p={p} />
      <defs>
        <linearGradient id={`${p}-vidrio`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".55" />
          <stop offset=".5" stopColor="#EEF3EF" stopOpacity=".25" />
          <stop offset="1" stopColor="#C9D4CC" stopOpacity=".6" />
        </linearGradient>
        <linearGradient id={`${p}-champana`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: tema("--color-seal", "30%, white") }} />
          <stop offset="1" style={{ stopColor: tema("--color-seal", "75%, white") }} />
        </linearGradient>
      </defs>
      <g filter={`url(#${p}-grano)`}>
        <ellipse cx="90" cy="140" rx="56" ry="6" fill="#2F3A33" opacity=".1" />
        <Ramita p={p} c={[30, 138, 80, 146, 150, 134]} n={6} s0={0.62} s1={0.4} opuestas semilla={81} />
        <g filter={`url(#${p}-sombra)`}>
          <g transform="translate(70 38) rotate(-14)">{copa}</g>
          <g transform="translate(110 38) rotate(14)">{copa}</g>
        </g>
        <g style={{ fill: tema("--color-seal") }}>
          <path d="M90 6L91.6 12.4L98 14L91.6 15.6L90 22L88.4 15.6L82 14L88.4 12.4Z" />
          <path d="M70 14L70.8 17.2L74 18L70.8 18.8L70 22L69.2 18.8L66 18L69.2 17.2Z" opacity=".7" />
          <path d="M112 12L112.8 15.2L116 16L112.8 16.8L112 20L111.2 16.8L108 16L111.2 15.2Z" opacity=".7" />
        </g>
      </g>
    </svg>
  );
}

// SDXL: eu_sello
// Sello de lacre en el verde del tema con las iniciales y una corona de
// hojitas en relieve.
export function EuSello({ iniciales = "", className = "" }) {
  const p = usePrefijo();
  const r = azar(91);
  const borde = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const rad = 52 + (r() - 0.5) * 6 + (i % 3 === 0 ? 2.5 : 0);
    return `${n1(60 + Math.cos(a) * rad)} ${n1(60 + Math.sin(a) * rad)}`;
  });
  const hojitas = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * 360;
    return giro(60, 60, a)(34, 0);
  });
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id={`${p}-lacre`} cx=".38" cy=".32" r=".75">
          <stop offset="0" style={{ stopColor: tema("--color-gold", "70%, white") }} />
          <stop offset=".55" style={{ stopColor: tema("--color-gold-dark") }} />
          <stop offset="1" style={{ stopColor: tema("--color-gold-dark", "70%, #1d2620") }} />
        </radialGradient>
        <radialGradient id={`${p}-hundido`} cx=".5" cy=".5" r=".5">
          <stop offset=".8" style={{ stopColor: tema("--color-gold-dark", "85%, #1d2620") }} />
          <stop offset="1" style={{ stopColor: tema("--color-gold", "60%, white") }} />
        </radialGradient>
        <filter id={`${p}-sombra`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="1" dy="3" stdDeviation="2.4" floodColor="#2F3A33" floodOpacity=".3" />
        </filter>
      </defs>
      <g filter={`url(#${p}-sombra)`}>
        <path d={`M${borde.join("L")}Z`} fill={`url(#${p}-lacre)`} strokeLinejoin="round" />
        <circle cx="60" cy="60" r="41" fill={`url(#${p}-hundido)`} opacity=".9" />
        <circle cx="60" cy="60" r="41" fill="none" stroke="#FFFFFF" strokeOpacity=".25" strokeWidth="1" />
        {hojitas.map((pt, i) => {
          const [hx, hy] = pt.split(" ").map(Number);
          return <ellipse key={i} cx={hx} cy={hy} rx="2.2" ry="4.4" transform={`rotate(${(i / 16) * 360 + 30} ${hx} ${hy})`} fill="#FFFFFF" opacity=".22" />;
        })}
        <text x="60" y="71" textAnchor="middle" fontSize="34" style={{ fontFamily: "var(--fuente-guion, 'Allura'), cursive", fill: tema("--color-gold-dark", "70%, #1d2620") }}>{iniciales}</text>
        <text x="59.2" y="70" textAnchor="middle" fontSize="34" style={{ fontFamily: "var(--fuente-guion, 'Allura'), cursive", fill: tema("--color-gold-light") }} opacity=".85">{iniciales}</text>
        <path d="M30 34C38 24 50 19 62 19" fill="none" stroke="#FFFFFF" strokeOpacity=".4" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// SDXL: eu_sobre
// Sobre de papel de algodón con solapa, sellito verde y ramita metida.
export function EuSobre({ className = "" }) {
  const p = usePrefijo();
  return (
    <svg className={className} viewBox="0 0 140 100" aria-hidden="true">
      <Defs p={p} />
      <defs>
        <linearGradient id={`${p}-papel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EFEBE1" />
        </linearGradient>
      </defs>
      <g filter={`url(#${p}-grano)`}>
        <g filter={`url(#${p}-sombra)`}>
          <rect x="10" y="22" width="120" height="72" rx="3" fill={`url(#${p}-papel)`} stroke="#D3CCBB" strokeWidth=".8" />
          <path d="M10 94L58 54Q70 46 82 54L130 94" fill="none" stroke="#D3CCBB" strokeWidth=".8" />
          <Ramita p={p} c={[40, 30, 54, 10, 74, 0]} n={4} s0={0.55} s1={0.4} opuestas semilla={93} sombra={false} />
          <path d="M10 24L62 60Q70 66 78 60L130 24Q130 22 127 22H13Q10 22 10 24Z" fill="#FBF9F4" stroke="#D3CCBB" strokeWidth=".8" />
          <circle cx="70" cy="58" r="8" style={{ fill: tema("--color-gold-dark") }} />
          <circle cx="70" cy="58" r="5" fill="none" stroke="#FFFFFF" strokeOpacity=".35" strokeWidth=".8" />
        </g>
      </g>
    </svg>
  );
}

// SDXL: eu_ojal
// Ojal de metal del tema por donde pasa el hilo de la etiqueta.
export function EuOjal({ className = "" }) {
  const p = usePrefijo();
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <Defs p={p} />
      <defs>
        <radialGradient id={`${p}-hueco`} cx=".5" cy=".42" r=".55">
          <stop offset=".55" style={{ stopColor: tema("--color-paper") }} />
          <stop offset="1" style={{ stopColor: tema("--color-paper", "80%, #2F3A33") }} />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="11" fill="#2F3A33" opacity=".12" transform="translate(.6 1.4)" />
      <circle cx="20" cy="20" r="6.6" fill={`url(#${p}-hueco)`} />
      {/* Hilo que entra por el ojal */}
      <path d="M17.4 0V17.6M22.6 0V17.6" style={{ stroke: tema("--color-seal", "85%, #3a3020") }} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="20" cy="20" r="8.6" fill="none" stroke={`url(#${p}-oro)`} strokeWidth="4" />
      <circle cx="20" cy="20" r="8.6" fill="none" stroke="#FFFFFF" strokeOpacity=".5" strokeWidth=".8" transform="translate(-.8 -.9)" />
    </svg>
  );
}

// Hilo fino del tema: sube del ojal en V y se anuda al tallo con una lazada.
export function EuHilo({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 60 100" aria-hidden="true">
      <g fill="none" style={{ stroke: tema("--color-seal", "85%, #3a3020") }} strokeWidth="1.1" strokeLinecap="round">
        <path d="M27.4 100L27.2 12M32.6 100L32.8 12" />
        <path d="M30 9C22 1 13 4 18 10C21 13 26 11 30 9C34 11 39 13 42 10C47 4 38 1 30 9Z" style={{ fill: tema("--color-seal", "18%, transparent") }} />
        <path d="M29 10C26 16 22 22 19 27M31 10C34 15 38 20 42 24" />
      </g>
      <ellipse cx="30" cy="9.5" rx="3.2" ry="2.6" style={{ fill: tema("--color-seal") }} />
    </svg>
  );
}
