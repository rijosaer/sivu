import { useId } from "react";

// Arte de «Birrete», todo en SVG semi-realista: capas de degradados, sombras
// suaves y un grano de papel muy leve. Los colores de marca salen del tema
// (oro = --color-gold, azul tinta = --color-seal); el pergamino, el vidrio y
// las páginas de los libros llevan sus tonos naturales. Cada pieza tiene su
// nombre SDXL para poder cambiarla luego por un .webp pintado.

const ORO = "rgb(var(--color-gold))";
const ORO_CLARO = "rgb(var(--color-gold-light))";
const ORO_OSC = "rgb(var(--color-gold-dark))";
const AZUL = "rgb(var(--color-seal))";
const mezcla = (a, b, pct) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;
const tope = (offset, color, opacity) => (
  <stop offset={offset} style={{ stopColor: color, stopOpacity: opacity ?? 1 }} />
);

// ids únicos por instancia: las piezas se repiten en la página.
function useIds() {
  const base = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (n) => `bi${base}${n}`;
}

// Grano sutil de papel (feTurbulence + feColorMatrix a baja opacidad).
function Grano({ id, opacidad = 0.09 }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="t" />
      <feColorMatrix in="t" values={`0 0 0 0 .35  0 0 0 0 .27  0 0 0 0 .15  0 0 0 ${opacidad} 0`} result="g" />
      <feComposite in="g" in2="SourceGraphic" operator="in" />
    </filter>
  );
}

function Sombra({ id, desv = 4 }) {
  return (
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation={desv} />
    </filter>
  );
}

/* ---------------------------------------------------------------- */
// Pergamino enrollado (cilindro) con la cinta azul y oro anudada. Con
// `cinta={false}` es solo el rodillo, que en la entrada baja al desenrollar.
// SDXL: bi_diploma
export function BiDiploma({ cinta = true, className = "" }) {
  const id = useIds();
  const H = 64; // grosor del rollo
  const y0 = 18;
  const cy = y0 + H / 2;
  return (
    <svg className={`bi-svg-diploma ${className}`} viewBox="0 0 340 128" aria-hidden="true">
      <defs>
        <linearGradient id={id("cuerpo")} x1="0" y1="0" x2="0" y2="1">
          {tope(0, "#E9DFC6")}
          {tope(0.16, "#FFFDF6")}
          {tope(0.38, "#F7EFDC")}
          {tope(0.7, "#E4D5B3")}
          {tope(0.92, "#BFA97E")}
          {tope(1, "#A68F63")}
        </linearGradient>
        <linearGradient id={id("largo")} x1="0" y1="0" x2="1" y2="0">
          {tope(0, "#8B7448", 0.35)}
          {tope(0.08, "#fff", 0)}
          {tope(0.9, "#fff", 0)}
          {tope(1, "#8B7448", 0.3)}
        </linearGradient>
        <radialGradient id={id("tapa")} cx="0.45" cy="0.45" r="0.6">
          {tope(0, "#C9B489")}
          {tope(0.6, "#F3E9D2")}
          {tope(1, "#B39E72")}
        </radialGradient>
        <linearGradient id={id("banda")} x1="0" y1="0" x2="0" y2="1">
          {tope(0, mezcla(AZUL, "#000", 70))}
          {tope(0.2, mezcla(AZUL, "#fff", 72))}
          {tope(0.45, AZUL)}
          {tope(1, mezcla(AZUL, "#000", 55))}
        </linearGradient>
        <linearGradient id={id("lazo")} x1="0" y1="0" x2="1" y2="1">
          {tope(0, mezcla(AZUL, "#fff", 65))}
          {tope(0.5, AZUL)}
          {tope(1, mezcla(AZUL, "#000", 60))}
        </linearGradient>
        <linearGradient id={id("oro")} x1="0" y1="0" x2="1" y2="1">
          {tope(0, ORO_CLARO)}
          {tope(0.5, ORO)}
          {tope(1, ORO_OSC)}
        </linearGradient>
        <Grano id={id("grano")} opacidad={0.14} />
        <Sombra id={id("sombra")} desv={5} />
      </defs>

      {/* Sombra en la mesa */}
      <ellipse className="bi-diploma-sombra" cx="170" cy={y0 + H + 14} rx="150" ry="9" fill="#5a4a2a" opacity=".28" filter={`url(#${id("sombra")})`} />

      {/* Cuerpo del rollo */}
      <g>
        <path d={`M28 ${y0} H312 A14 ${H / 2} 0 0 1 312 ${y0 + H} H28 Z`} fill={`url(#${id("cuerpo")})`} />
        <path d={`M28 ${y0} H312 A14 ${H / 2} 0 0 1 312 ${y0 + H} H28 Z`} fill={`url(#${id("largo")})`} />
        <path d={`M28 ${y0} H312 A14 ${H / 2} 0 0 1 312 ${y0 + H} H28 Z`} filter={`url(#${id("grano")})`} fill="#fff" />
        {/* Borde libre del papel a lo largo del rollo */}
        <path d={`M34 ${y0 + H * 0.7} C 120 ${y0 + H * 0.73} 220 ${y0 + H * 0.68} 318 ${y0 + H * 0.71}`} fill="none" stroke="#9C8659" strokeOpacity=".55" strokeWidth="1" />
        <path d={`M34 ${y0 + H * 0.7 + 1.6} C 120 ${y0 + H * 0.73 + 1.6} 220 ${y0 + H * 0.68 + 1.6} 318 ${y0 + H * 0.71 + 1.6}`} fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1" />
        {/* Filete dorado impreso que asoma en el papel */}
        <path d={`M40 ${y0 + 9} H300`} stroke={ORO} strokeOpacity=".5" strokeWidth="1.2" />
        <path d={`M40 ${y0 + 12} H300`} stroke={ORO} strokeOpacity=".3" strokeWidth=".6" />
        {/* Tapa izquierda con la espiral del papel */}
        <ellipse cx="28" cy={cy} rx="14" ry={H / 2} fill={`url(#${id("tapa")})`} />
        <ellipse cx="28" cy={cy} rx="14" ry={H / 2} fill="none" stroke="#8E7A52" strokeOpacity=".6" />
        <path
          d={`M28 ${cy} m0 -3 a3 3 0 1 1 -2 5 a6 9 0 1 1 6 -14 a8.5 15 0 1 1 -10 26 a11 22 0 1 1 13 -40 a13 28 0 1 1 -14 54`}
          fill="none" stroke="#8E7A52" strokeOpacity=".55" strokeWidth=".9"
        />
        <ellipse cx="27" cy={cy} rx="2.2" ry="4" fill="#6F5C38" opacity=".5" />
      </g>

      {cinta && (
        <g className="bi-cinta">
          {/* Banda que rodea el rollo, curva por el cilindro */}
          <g className="bi-cinta-banda">
            <path d={`M156 ${y0 - 1} C 158 ${cy} 158 ${cy} 156 ${y0 + H + 1} L 184 ${y0 + H + 1} C 186 ${cy} 186 ${cy} 184 ${y0 - 1} Z`} fill={`url(#${id("banda")})`} />
            <path d={`M159 ${y0 - 1} C 161 ${cy} 161 ${cy} 159 ${y0 + H + 1}`} stroke={`url(#${id("oro")})`} strokeWidth="2" fill="none" />
            <path d={`M181 ${y0 - 1} C 183 ${cy} 183 ${cy} 181 ${y0 + H + 1}`} stroke={`url(#${id("oro")})`} strokeWidth="2" fill="none" />
          </g>
          {/* Colas que cuelgan, con corte en V */}
          <g className="bi-cinta-colas">
            <path d={`M164 ${cy + 2} C 158 ${cy + 26} 146 ${cy + 44} 134 ${cy + 58} L 142 ${cy + 56} L 145 ${cy + 64} C 156 ${cy + 50} 166 ${cy + 30} 172 ${cy + 6} Z`} fill={`url(#${id("lazo")})`} />
            <path d={`M176 ${cy + 2} C 182 ${cy + 28} 192 ${cy + 44} 206 ${cy + 56} L 198 ${cy + 56} L 197 ${cy + 64} C 184 ${cy + 50} 174 ${cy + 30} 168 ${cy + 6} Z`} fill={`url(#${id("lazo")})`} />
            <path d={`M165 ${cy + 8} C 160 ${cy + 28} 150 ${cy + 44} 140 ${cy + 56}`} stroke={ORO} strokeOpacity=".8" strokeWidth="1" fill="none" />
            <path d={`M175 ${cy + 8} C 180 ${cy + 28} 190 ${cy + 44} 201 ${cy + 56}`} stroke={ORO} strokeOpacity=".8" strokeWidth="1" fill="none" />
          </g>
          {/* Lazo */}
          <g className="bi-cinta-lazo">
            <path d={`M168 ${cy} C 150 ${cy - 26} 124 ${cy - 22} 128 ${cy - 4} C 131 ${cy + 10} 152 ${cy + 8} 168 ${cy + 2} Z`} fill={`url(#${id("lazo")})`} />
            <path d={`M172 ${cy} C 190 ${cy - 26} 216 ${cy - 22} 212 ${cy - 4} C 209 ${cy + 10} 188 ${cy + 8} 172 ${cy + 2} Z`} fill={`url(#${id("lazo")})`} />
            <path d={`M166 ${cy - 1} C 152 ${cy - 16} 138 ${cy - 16} 134 ${cy - 8}`} stroke={mezcla(AZUL, "#000", 50)} strokeOpacity=".5" strokeWidth="1.2" fill="none" />
            <path d={`M174 ${cy - 1} C 188 ${cy - 16} 202 ${cy - 16} 206 ${cy - 8}`} stroke={mezcla(AZUL, "#000", 50)} strokeOpacity=".5" strokeWidth="1.2" fill="none" />
            <path d={`M168 ${cy} C 150 ${cy - 26} 124 ${cy - 22} 128 ${cy - 4}`} stroke={ORO} strokeWidth="1.4" fill="none" />
            <path d={`M172 ${cy} C 190 ${cy - 26} 216 ${cy - 22} 212 ${cy - 4}`} stroke={ORO} strokeWidth="1.4" fill="none" />
            <path d={`M140 ${cy - 14} C 146 ${cy - 19} 154 ${cy - 17} 158 ${cy - 12}`} stroke="#fff" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" fill="none" />
            <rect x="163" y={cy - 8} width="14" height="15" rx="4" fill={`url(#${id("oro")})`} />
            <rect x="165.5" y={cy - 6} width="4" height="10" rx="2" fill="#fff" opacity=".35" />
          </g>
        </g>
      )}
    </svg>
  );
}

/* ---------------------------------------------------------------- */
// Borde de arriba del pergamino desenrollado: un rizo delgado.
export function BiRizo({ className = "" }) {
  const id = useIds();
  return (
    <svg className={`bi-svg-rizo ${className}`} viewBox="0 0 340 30" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id("r")} x1="0" y1="0" x2="0" y2="1">
          {tope(0, "#D9CBA8")}
          {tope(0.3, "#FFFDF6")}
          {tope(0.75, "#E3D3AE")}
          {tope(1, "#A8916A")}
        </linearGradient>
      </defs>
      <path d="M26 6 H314 A10 11 0 0 1 314 28 H26 Z" fill={`url(#${id("r")})`} />
      <ellipse cx="26" cy="17" rx="10" ry="11" fill="#E7DABB" stroke="#9A8560" strokeOpacity=".6" />
      <path d="M26 17 m0 -2 a2 2 0 1 1 -1 3.5 a5 6 0 1 1 4 -9 a8 10 0 1 1 -6 17" fill="none" stroke="#8E7A52" strokeOpacity=".5" strokeWidth=".8" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
// Sello dorado con borde festoneado, laurel en relieve y colas azules.
// SDXL: bi_sello
export function BiSello({ className = "", texto = "MMXXVII" }) {
  const id = useIds();
  const N = 30;
  const R = 46;
  const c = 60;
  let d = "";
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const x = (c + R * Math.cos(a)).toFixed(2);
    const y = (c + R * Math.sin(a)).toFixed(2);
    d += i === 0 ? `M${x} ${y}` : ` A5.6 5.6 0 0 1 ${x} ${y}`;
  }
  const hojas = Array.from({ length: 9 }, (_, i) => i);
  return (
    <svg className={`bi-svg-sello ${className}`} viewBox="0 0 120 150" aria-hidden="true">
      <defs>
        <radialGradient id={id("o")} cx="0.38" cy="0.32" r="0.8">
          {tope(0, mezcla(ORO_CLARO, "#fff", 70))}
          {tope(0.35, ORO_CLARO)}
          {tope(0.7, ORO)}
          {tope(1, ORO_OSC)}
        </radialGradient>
        <linearGradient id={id("aro")} x1="0" y1="0" x2="1" y2="1">
          {tope(0, ORO_OSC)}
          {tope(0.5, ORO_CLARO)}
          {tope(1, ORO_OSC)}
        </linearGradient>
        <linearGradient id={id("cola")} x1="0" y1="0" x2="1" y2="0">
          {tope(0, mezcla(AZUL, "#000", 70))}
          {tope(0.45, mezcla(AZUL, "#fff", 78))}
          {tope(1, AZUL)}
        </linearGradient>
        <Grano id={id("g")} opacidad={0.22} />
        <Sombra id={id("s")} desv={2.6} />
        <path id={id("arco")} d="M30 60 A30 30 0 0 1 90 60" />
      </defs>
      {/* Colas de cinta */}
      <path d="M48 88 L34 146 L44 139 L52 148 L62 96 Z" fill={`url(#${id("cola")})`} />
      <path d="M72 88 L86 146 L76 139 L68 148 L58 96 Z" fill={`url(#${id("cola")})`} />
      <path d="M50 92 L38 140 M70 92 L82 140" stroke={ORO} strokeOpacity=".7" strokeWidth=".9" />
      {/* Sombra y disco */}
      <path d={d + " Z"} transform="translate(1.5 3)" fill="#3a2a10" opacity=".35" filter={`url(#${id("s")})`} />
      <path d={d + " Z"} fill={`url(#${id("o")})`} stroke={ORO_OSC} strokeOpacity=".7" strokeWidth=".8" />
      <circle cx={c} cy={c} r="37" fill="none" stroke={`url(#${id("aro")})`} strokeWidth="2.2" />
      <circle cx={c} cy={c} r="33.5" fill="none" stroke={ORO_OSC} strokeOpacity=".55" strokeWidth=".7" strokeDasharray="1.2 2" />
      {/* Laurel en relieve */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${c} ${c}) scale(${s} 1)`}>
          <path d="M-4 24 C -20 18 -26 4 -22 -12" fill="none" stroke={ORO_OSC} strokeWidth="1" strokeOpacity=".8" />
          {hojas.map((i) => {
            const t = i / 8;
            const a = Math.PI * (0.62 + t * 0.6);
            const x = Math.cos(a) * 24 * (0.9 + 0.1 * t);
            const y = Math.sin(a) * 24 * (0.9 + 0.1 * t) - 0;
            const rot = (a * 180) / Math.PI + 90 + (i % 2 ? 26 : -26);
            return (
              <path key={i} transform={`translate(${x.toFixed(1)} ${(-y + 6).toFixed(1)}) rotate(${rot.toFixed(0)})`} d="M0 0 C 2.6 -2 2.4 -6 0 -8 C -2.4 -6 -2.6 -2 0 0 Z" fill={ORO_OSC} opacity=".75" />
            );
          })}
        </g>
      ))}
      {/* Birrete en relieve al centro */}
      <g transform={`translate(${c} ${c - 3})`}>
        <path d="M-15 -2 L0 -9 L15 -2 L0 5 Z" fill={ORO_OSC} opacity=".85" />
        <path d="M-9 1.5 V8 C -4 11 4 11 9 8 V1.5 L0 5 Z" fill={ORO_OSC} opacity=".7" />
        <path d="M0 -2 L11 2 V10" stroke={ORO_OSC} strokeWidth=".9" fill="none" opacity=".9" />
        <circle cx="11" cy="11" r="1.6" fill={ORO_OSC} />
        <path d="M-14 -2 L0 -8.2" stroke="#fff" strokeOpacity=".55" strokeWidth=".8" />
      </g>
      <text fontSize="6.6" letterSpacing="1.4" fill={ORO_OSC} style={{ fontFamily: "var(--fuente-titulos, 'Cinzel Decorative'), serif" }} textAnchor="middle">
        <textPath href={`#${id("arco")}`} startOffset="50%">{texto}</textPath>
      </text>
      {/* Brillo y grano del metal */}
      <path d={d + " Z"} filter={`url(#${id("g")})`} fill="#fff" />
      <path d="M30 38 C 38 26 52 20 66 21" stroke="#fff" strokeOpacity=".55" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
// Birrete de graduación en tres cuartos: tabla azul tinta, casquete,
// botón y borla dorada con hilos.
// SDXL: bi_birrete
export function BiBirrete({ className = "" }) {
  const id = useIds();
  return (
    <svg className={`bi-svg-birrete ${className}`} viewBox="0 0 160 130" aria-hidden="true">
      <defs>
        <linearGradient id={id("tabla")} x1="0" y1="0" x2="1" y2="1">
          {tope(0, mezcla(AZUL, "#fff", 62))}
          {tope(0.45, AZUL)}
          {tope(1, mezcla(AZUL, "#000", 62))}
        </linearGradient>
        <linearGradient id={id("canto")} x1="0" y1="0" x2="1" y2="0">
          {tope(0, mezcla(AZUL, "#000", 55))}
          {tope(0.5, mezcla(AZUL, "#000", 75))}
          {tope(1, mezcla(AZUL, "#000", 45))}
        </linearGradient>
        <linearGradient id={id("casco")} x1="0" y1="0" x2="1" y2="0">
          {tope(0, mezcla(AZUL, "#000", 45))}
          {tope(0.35, mezcla(AZUL, "#fff", 80))}
          {tope(0.7, AZUL)}
          {tope(1, mezcla(AZUL, "#000", 50))}
        </linearGradient>
        <linearGradient id={id("borla")} x1="0" y1="0" x2="1" y2="0">
          {tope(0, ORO_OSC)}
          {tope(0.4, ORO_CLARO)}
          {tope(1, ORO)}
        </linearGradient>
        <Grano id={id("g")} opacidad={0.12} />
        <Sombra id={id("s")} desv={4} />
      </defs>
      <ellipse cx="80" cy="118" rx="46" ry="6" fill="#2b2410" opacity=".22" filter={`url(#${id("s")})`} />
      {/* Casquete */}
      <path d="M44 58 V88 C 60 102 100 102 116 88 V58 Z" fill={`url(#${id("casco")})`} />
      <path d="M44 86 C 60 99 100 99 116 86" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="1.2" />
      {/* Tabla */}
      <path d="M80 26 L150 50 L80 76 L10 50 Z" fill={`url(#${id("canto")})`} transform="translate(0 4)" />
      <path d="M80 26 L150 50 L80 76 L10 50 Z" fill={`url(#${id("tabla")})`} />
      <path d="M80 26 L150 50 L80 76 L10 50 Z" fill="#fff" filter={`url(#${id("g")})`} />
      <path d="M14 50 L80 27.6" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" />
      {/* Cordón, botón y borla */}
      <path d="M80 50 C 104 52 124 56 132 62 V96" fill="none" stroke={`url(#${id("borla")})`} strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="80" cy="50" rx="6" ry="3.4" fill={`url(#${id("borla")})`} />
      <ellipse cx="78.6" cy="49" rx="2.2" ry="1.1" fill="#fff" opacity=".6" />
      <rect x="128.5" y="92" width="7" height="7" rx="2" fill={`url(#${id("borla")})`} />
      <g stroke={`url(#${id("borla")})`} strokeWidth="1.3" strokeLinecap="round">
        {[-3, -1.5, 0, 1.5, 3].map((dx, i) => (
          <path key={i} d={`M${132 + dx * 0.6} 99 C ${132 + dx} 106 ${132 + dx * 1.3} 112 ${132 + dx * 1.6} ${116 + (i % 2) * 2}`} fill="none" />
        ))}
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------- */
// Rama de laurel dorado con hojas nervadas. `espejo` la voltea.
// SDXL: bi_laurel
export function BiLaurel({ className = "", espejo = false }) {
  const id = useIds();
  // Tallo: bezier cuadrática de abajo hacia la punta.
  const P0 = [86, 214];
  const P1 = [6, 128];
  const P2 = [62, 12];
  const punto = (t) => [
    (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0],
    (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1],
  ];
  const tangente = (t) => [
    2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]),
    2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]),
  ];
  const hojas = [];
  for (let i = 0; i < 14; i++) {
    const t = 0.06 + i * 0.066;
    const [x, y] = punto(t);
    const [tx, ty] = tangente(t);
    const ang = (Math.atan2(ty, tx) * 180) / Math.PI + 90;
    const lado = i % 2 ? 1 : -1;
    const L = 30 - i * 1.15;
    hojas.push({ x, y, rot: ang + lado * 42, L, W: L * 0.36, k: i });
  }
  const [px, py] = punto(1);
  return (
    <svg className={`bi-svg-laurel ${className}`} viewBox="0 0 120 220" aria-hidden="true" style={espejo ? { transform: "scaleX(-1)" } : undefined}>
      <defs>
        <linearGradient id={id("h")} x1="0" y1="1" x2="1" y2="0">
          {tope(0, ORO_OSC)}
          {tope(0.45, ORO)}
          {tope(0.8, ORO_CLARO)}
          {tope(1, mezcla(ORO_CLARO, "#fff", 60))}
        </linearGradient>
        <linearGradient id={id("t")} x1="0" y1="1" x2="0" y2="0">
          {tope(0, ORO_OSC)}
          {tope(1, ORO)}
        </linearGradient>
        <Sombra id={id("s")} desv={1.4} />
      </defs>
      <path d={`M${P0[0]} ${P0[1]} Q ${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`} fill="none" stroke={`url(#${id("t")})`} strokeWidth="2.4" strokeLinecap="round" />
      {hojas.map((h) => (
        <g key={h.k} transform={`translate(${h.x.toFixed(1)} ${h.y.toFixed(1)}) rotate(${h.rot.toFixed(1)})`}>
          <path transform="translate(1 1.6)" d={`M0 0 C ${h.W} ${-h.L * 0.28} ${h.W * 0.8} ${-h.L * 0.8} 0 ${-h.L} C ${-h.W * 0.8} ${-h.L * 0.8} ${-h.W} ${-h.L * 0.28} 0 0 Z`} fill="#3a2a10" opacity=".22" filter={`url(#${id("s")})`} />
          <path d={`M0 0 C ${h.W} ${-h.L * 0.28} ${h.W * 0.8} ${-h.L * 0.8} 0 ${-h.L} C ${-h.W * 0.8} ${-h.L * 0.8} ${-h.W} ${-h.L * 0.28} 0 0 Z`} fill={`url(#${id("h")})`} />
          <path d={`M0 -1 Q ${h.W * 0.12} ${-h.L * 0.5} 0 ${-h.L * 0.94}`} fill="none" stroke={ORO_OSC} strokeOpacity=".7" strokeWidth=".8" />
          <path d={`M${-h.W * 0.45} ${-h.L * 0.3} C ${-h.W * 0.5} ${-h.L * 0.5} ${-h.W * 0.35} ${-h.L * 0.7} ${-h.W * 0.1} ${-h.L * 0.82}`} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth=".9" />
        </g>
      ))}
      {/* Bayas */}
      {[0.3, 0.55, 0.78].map((t) => {
        const [x, y] = punto(t);
        return (
          <g key={t}>
            <circle cx={x + 6} cy={y + 2} r="3.6" fill={`url(#${id("h")})`} stroke={ORO_OSC} strokeOpacity=".5" strokeWidth=".6" />
            <circle cx={x + 5} cy={y + 1} r="1" fill="#fff" opacity=".7" />
          </g>
        );
      })}
      <path d={`M${px} ${py} C ${px + 4} ${py - 6} ${px + 3} ${py - 10} ${px} ${py - 12} C ${px - 3} ${py - 9} ${px - 4} ${py - 5} ${px} ${py} Z`} fill={`url(#${id("h")})`} />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
// Pila de tres libros de tapa dura con cantos de páginas y lomos dorados.
// SDXL: bi_libros
export function BiLibros({ className = "" }) {
  const id = useIds();
  const lineas = (x, y, w, h, n) =>
    Array.from({ length: n }, (_, i) => (
      <path key={i} d={`M${x + 2} ${y + 2 + (i * (h - 4)) / (n - 1)} H${x + w - 2}`} stroke="#B8A57E" strokeOpacity=".55" strokeWidth=".5" />
    ));
  return (
    <svg className={`bi-svg-libros ${className}`} viewBox="0 0 170 130" aria-hidden="true">
      <defs>
        <linearGradient id={id("azul")} x1="0" y1="0" x2="0" y2="1">
          {tope(0, mezcla(AZUL, "#fff", 70))}
          {tope(0.5, AZUL)}
          {tope(1, mezcla(AZUL, "#000", 55))}
        </linearGradient>
        <linearGradient id={id("cuero")} x1="0" y1="0" x2="0" y2="1">
          {tope(0, mezcla(ORO_OSC, "#fff", 75))}
          {tope(0.5, ORO_OSC)}
          {tope(1, mezcla(ORO_OSC, "#000", 60))}
        </linearGradient>
        <linearGradient id={id("marfil")} x1="0" y1="0" x2="0" y2="1">
          {tope(0, "#F4EDDC")}
          {tope(0.5, "#E6DAC0")}
          {tope(1, "#C9B892")}
        </linearGradient>
        <linearGradient id={id("pag")} x1="0" y1="0" x2="0" y2="1">
          {tope(0, "#FFFDF6")}
          {tope(1, "#E8DEC6")}
        </linearGradient>
        <linearGradient id={id("oro")} x1="0" y1="0" x2="1" y2="0">
          {tope(0, ORO_OSC)}
          {tope(0.5, ORO_CLARO)}
          {tope(1, ORO)}
        </linearGradient>
        <Grano id={id("g")} opacidad={0.14} />
        <Sombra id={id("s")} desv={4} />
      </defs>
      <ellipse cx="85" cy="122" rx="74" ry="6" fill="#2b2410" opacity=".24" filter={`url(#${id("s")})`} />
      {/* Libro de abajo: azul */}
      <g>
        <rect x="12" y="88" width="146" height="30" rx="3" fill={`url(#${id("azul")})`} />
        <rect x="20" y="91" width="134" height="22" fill={`url(#${id("pag")})`} />
        {lineas(20, 91, 134, 22, 7)}
        <rect x="12" y="88" width="22" height="30" rx="3" fill={`url(#${id("azul")})`} />
        <rect x="16" y="93" width="14" height="2" fill={`url(#${id("oro")})`} />
        <rect x="16" y="110" width="14" height="2" fill={`url(#${id("oro")})`} />
      </g>
      {/* Libro del medio: cuero dorado oscuro, girado */}
      <g transform="rotate(-3 85 74)">
        <rect x="22" y="60" width="130" height="28" rx="3" fill={`url(#${id("cuero")})`} />
        <rect x="22" y="63" width="122" height="21" fill={`url(#${id("pag")})`} />
        {lineas(22, 63, 122, 21, 7)}
        <rect x="136" y="60" width="16" height="28" rx="3" fill={`url(#${id("cuero")})`} />
        <rect x="139" y="66" width="10" height="1.6" fill={`url(#${id("oro")})`} />
        <rect x="139" y="81" width="10" height="1.6" fill={`url(#${id("oro")})`} />
      </g>
      {/* Libro de arriba: marfil con filete azul */}
      <g transform="rotate(2.5 85 46)">
        <rect x="30" y="36" width="112" height="24" rx="3" fill={`url(#${id("marfil")})`} />
        <rect x="36" y="38.5" width="104" height="18" fill={`url(#${id("pag")})`} />
        {lineas(36, 38.5, 104, 18, 6)}
        <rect x="30" y="36" width="14" height="24" rx="3" fill={`url(#${id("marfil")})`} />
        <rect x="33" y="40" width="8" height="16" fill="none" stroke={AZUL} strokeWidth="1" />
      </g>
      {/* Cinta marcapáginas */}
      <path d="M118 60 L118 76 L114 72 L110 76 L110 60" fill={AZUL} transform="rotate(2.5 85 46)" />
      {/* Un lápiz encima */}
      <g transform="rotate(-8 90 30)">
        <rect x="52" y="28" width="66" height="6" rx="1" fill={`url(#${id("oro")})`} />
        <path d="M118 28 L128 31 L118 34 Z" fill="#E8D3A8" />
        <path d="M125 30.1 L128 31 L125 31.9 Z" fill="#2b2b2b" />
        <rect x="48" y="28" width="5" height="6" fill={AZUL} />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------- */
// Dos copas de champaña que brindan, con burbujas y destello.
// SDXL: bi_copas
export function BiCopas({ className = "" }) {
  const id = useIds();
  const copa = (girar, k) => (
    <g key={k} transform={`rotate(${girar} 80 120)`}>
      {/* Cáliz de vidrio */}
      <path d="M62 14 C 60 44 64 70 74 84 C 76 87 84 87 86 84 C 96 70 100 44 98 14 Z" fill={`url(#${id("vidrio")})`} stroke="#A9B2C2" strokeOpacity=".7" strokeWidth=".9" />
      {/* Champaña */}
      <path d="M63.6 34 C 63 52 66 70 75 82 C 77 84.5 83 84.5 85 82 C 94 70 97 52 96.4 34 Z" fill={`url(#${id("vino")})`} />
      <ellipse cx="80" cy="34" rx="16.4" ry="2.4" fill={mezcla(ORO_CLARO, "#fff", 50)} opacity=".9" />
      {[[74, 70], [82, 60], [78, 50], [86, 44], [72, 56], [84, 74]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.9 + (i % 3) * 0.4} fill="#fff" opacity=".75" />
      ))}
      {/* Tallo y pie */}
      <path d="M78 86 C 79 100 79 112 78.5 124 H81.5 C 81 112 81 100 82 86 Z" fill={`url(#${id("vidrio")})`} stroke="#A9B2C2" strokeOpacity=".6" strokeWidth=".7" />
      <ellipse cx="80" cy="126" rx="14" ry="3.2" fill={`url(#${id("vidrio")})`} stroke="#A9B2C2" strokeOpacity=".7" strokeWidth=".8" />
      {/* Brillos */}
      <path d="M66 20 C 65 40 67 60 73 74" stroke="#fff" strokeOpacity=".85" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M94 22 C 94 34 93 44 91 52" stroke="#fff" strokeOpacity=".5" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </g>
  );
  return (
    <svg className={`bi-svg-copas ${className}`} viewBox="0 0 160 140" aria-hidden="true">
      <defs>
        <linearGradient id={id("vidrio")} x1="0" y1="0" x2="1" y2="0">
          {tope(0, "#E9EEF5", 0.75)}
          {tope(0.35, "#ffffff", 0.35)}
          {tope(0.7, "#DCE3EE", 0.4)}
          {tope(1, "#C3CCDA", 0.8)}
        </linearGradient>
        <linearGradient id={id("vino")} x1="0" y1="0" x2="0" y2="1">
          {tope(0, ORO_CLARO, 0.95)}
          {tope(0.6, mezcla(ORO, ORO_CLARO, 60), 0.92)}
          {tope(1, ORO, 0.95)}
        </linearGradient>
        <Sombra id={id("s")} desv={3} />
      </defs>
      <ellipse cx="80" cy="132" rx="56" ry="4" fill="#2b2410" opacity=".2" filter={`url(#${id("s")})`} />
      <g transform="translate(-20 0)">{copa(-14, "a")}</g>
      <g transform="translate(20 0)">{copa(14, "b")}</g>
      {/* Destello del brindis */}
      <g transform="translate(80 12)" fill={ORO}>
        <path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" />
        <circle cx="-14" cy="4" r="1.6" opacity=".8" />
        <circle cx="13" cy="-6" r="1.3" opacity=".7" />
        <circle cx="10" cy="9" r="1" opacity=".6" />
      </g>
    </svg>
  );
}
