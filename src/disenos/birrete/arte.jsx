import { useId } from "react";

// Arte de «Birrete», todo en SVG semi-realista: capas de degradados, sombras
// suaves y un grano de papel muy leve. Los colores de marca salen del tema
// (vino = --color-gold, oro = --color-seal); el pergamino, el papel y las
// páginas de los libros llevan sus tonos naturales. Cada pieza tiene su
// nombre SDXL para poder cambiarla luego por un .webp pintado.

const VINO = "rgb(var(--color-gold))";
const VINO_OSC = "rgb(var(--color-gold-dark))";
const ORO = "rgb(var(--color-seal))";
const mezcla = (a, b, pct) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;
const ORO_CLARO = mezcla(ORO, "#fff", 50);
const ORO_OSC = mezcla(ORO, "#000", 66);
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

// Degradado de oro metálico (lámina), compartido por sellos y borlas.
function OroLamina({ id, radial = false }) {
  const paradas = (
    <>
      {tope(0, mezcla(ORO_CLARO, "#fff", 60))}
      {tope(0.32, ORO_CLARO)}
      {tope(0.62, ORO)}
      {tope(1, ORO_OSC)}
    </>
  );
  return radial
    ? <radialGradient id={id} cx="0.36" cy="0.3" r="0.85">{paradas}</radialGradient>
    : <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">{paradas}</linearGradient>;
}

// Borde dentado de un sello (rueda de dientes redondeados).
function dentado(c, R, r, n) {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r : R;
    const x = (c + rr * Math.cos(a)).toFixed(2);
    const y = (c + rr * Math.sin(a)).toFixed(2);
    d += i === 0 ? `M${x} ${y}` : ` L${x} ${y}`;
  }
  return d + " Z";
}

/* ---------------------------------------------------------------- */
// Pergamino enrollado (cilindro) con la cinta vino y oro anudada. Con
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
          {tope(0, mezcla(VINO, "#000", 62))}
          {tope(0.2, mezcla(VINO, "#fff", 70))}
          {tope(0.45, VINO)}
          {tope(1, mezcla(VINO, "#000", 55))}
        </linearGradient>
        <linearGradient id={id("lazo")} x1="0" y1="0" x2="1" y2="1">
          {tope(0, mezcla(VINO, "#fff", 66))}
          {tope(0.5, VINO)}
          {tope(1, VINO_OSC)}
        </linearGradient>
        <OroLamina id={id("oro")} />
        <Grano id={id("grano")} opacidad={0.14} />
        <Sombra id={id("sombra")} desv={5} />
      </defs>

      {/* Sombra en la mesa */}
      <ellipse className="bi-diploma-sombra" cx="170" cy={y0 + H + 14} rx="150" ry="9" fill="#3a1a20" opacity=".3" filter={`url(#${id("sombra")})`} />

      {/* Cuerpo del rollo */}
      <g>
        <path d={`M28 ${y0} H312 A14 ${H / 2} 0 0 1 312 ${y0 + H} H28 Z`} fill={`url(#${id("cuerpo")})`} />
        <path d={`M28 ${y0} H312 A14 ${H / 2} 0 0 1 312 ${y0 + H} H28 Z`} fill={`url(#${id("largo")})`} />
        <path d={`M28 ${y0} H312 A14 ${H / 2} 0 0 1 312 ${y0 + H} H28 Z`} filter={`url(#${id("grano")})`} fill="#fff" />
        {/* Borde libre del papel a lo largo del rollo */}
        <path d={`M34 ${y0 + H * 0.7} C 120 ${y0 + H * 0.73} 220 ${y0 + H * 0.68} 318 ${y0 + H * 0.71}`} fill="none" stroke="#9C8659" strokeOpacity=".55" strokeWidth="1" />
        <path d={`M34 ${y0 + H * 0.7 + 1.6} C 120 ${y0 + H * 0.73 + 1.6} 220 ${y0 + H * 0.68 + 1.6} 318 ${y0 + H * 0.71 + 1.6}`} fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1" />
        {/* Filete dorado impreso que asoma en el papel */}
        <path d={`M40 ${y0 + 9} H300`} stroke={ORO} strokeOpacity=".6" strokeWidth="1.2" />
        <path d={`M40 ${y0 + 12} H300`} stroke={VINO} strokeOpacity=".35" strokeWidth=".6" />
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
          {/* Banda vino con orillas de oro, curva por el cilindro */}
          <g className="bi-cinta-banda">
            <path d={`M156 ${y0 - 1} C 158 ${cy} 158 ${cy} 156 ${y0 + H + 1} L 184 ${y0 + H + 1} C 186 ${cy} 186 ${cy} 184 ${y0 - 1} Z`} fill={`url(#${id("banda")})`} />
            <path d={`M158.5 ${y0 - 1} C 160.5 ${cy} 160.5 ${cy} 158.5 ${y0 + H + 1}`} stroke={`url(#${id("oro")})`} strokeWidth="2.4" fill="none" />
            <path d={`M181.5 ${y0 - 1} C 183.5 ${cy} 183.5 ${cy} 181.5 ${y0 + H + 1}`} stroke={`url(#${id("oro")})`} strokeWidth="2.4" fill="none" />
          </g>
          {/* Colas que cuelgan, con corte en V */}
          <g className="bi-cinta-colas">
            <path d={`M164 ${cy + 2} C 158 ${cy + 26} 146 ${cy + 44} 134 ${cy + 58} L 142 ${cy + 56} L 145 ${cy + 64} C 156 ${cy + 50} 166 ${cy + 30} 172 ${cy + 6} Z`} fill={`url(#${id("lazo")})`} />
            <path d={`M176 ${cy + 2} C 182 ${cy + 28} 192 ${cy + 44} 206 ${cy + 56} L 198 ${cy + 56} L 197 ${cy + 64} C 184 ${cy + 50} 174 ${cy + 30} 168 ${cy + 6} Z`} fill={`url(#${id("lazo")})`} />
            <path d={`M165 ${cy + 8} C 160 ${cy + 28} 150 ${cy + 44} 140 ${cy + 56}`} stroke={ORO} strokeOpacity=".9" strokeWidth="1.1" fill="none" />
            <path d={`M175 ${cy + 8} C 180 ${cy + 28} 190 ${cy + 44} 201 ${cy + 56}`} stroke={ORO} strokeOpacity=".9" strokeWidth="1.1" fill="none" />
          </g>
          {/* Lazo */}
          <g className="bi-cinta-lazo">
            <path d={`M168 ${cy} C 150 ${cy - 26} 124 ${cy - 22} 128 ${cy - 4} C 131 ${cy + 10} 152 ${cy + 8} 168 ${cy + 2} Z`} fill={`url(#${id("lazo")})`} />
            <path d={`M172 ${cy} C 190 ${cy - 26} 216 ${cy - 22} 212 ${cy - 4} C 209 ${cy + 10} 188 ${cy + 8} 172 ${cy + 2} Z`} fill={`url(#${id("lazo")})`} />
            <path d={`M166 ${cy - 1} C 152 ${cy - 16} 138 ${cy - 16} 134 ${cy - 8}`} stroke={VINO_OSC} strokeOpacity=".6" strokeWidth="1.2" fill="none" />
            <path d={`M174 ${cy - 1} C 188 ${cy - 16} 202 ${cy - 16} 206 ${cy - 8}`} stroke={VINO_OSC} strokeOpacity=".6" strokeWidth="1.2" fill="none" />
            <path d={`M168 ${cy} C 150 ${cy - 26} 124 ${cy - 22} 128 ${cy - 4}`} stroke={ORO} strokeWidth="1.5" fill="none" />
            <path d={`M172 ${cy} C 190 ${cy - 26} 216 ${cy - 22} 212 ${cy - 4}`} stroke={ORO} strokeWidth="1.5" fill="none" />
            <path d={`M140 ${cy - 14} C 146 ${cy - 19} 154 ${cy - 17} 158 ${cy - 12}`} stroke="#fff" strokeOpacity=".4" strokeWidth="2" strokeLinecap="round" fill="none" />
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
// Sello de lámina dorada en relieve (no lacre): borde dentado, laurel y
// birrete repujados, con dos colas de cinta vino.
// SDXL: bi_sello
export function BiSello({ className = "", texto = "MMXXVII" }) {
  const id = useIds();
  const c = 60;
  const hojas = Array.from({ length: 9 }, (_, i) => i);
  // Relieve: cada trazo se dibuja tres veces (luz arriba, sombra abajo, metal).
  const repujado = (contenido) => (
    <>
      <g transform="translate(-.7 -.7)" opacity=".7" style={{ color: mezcla(ORO_CLARO, "#fff", 40) }}>{contenido}</g>
      <g transform="translate(.8 .9)" opacity=".55" style={{ color: ORO_OSC }}>{contenido}</g>
      <g style={{ color: mezcla(ORO, ORO_CLARO, 70) }}>{contenido}</g>
    </>
  );
  const motivo = (
    <>
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${c} ${c}) scale(${s} 1)`}>
          <path d="M-4 24 C -20 18 -26 4 -22 -12" fill="none" stroke="currentColor" strokeWidth="1.1" />
          {hojas.map((i) => {
            const t = i / 8;
            const a = Math.PI * (0.62 + t * 0.6);
            const x = Math.cos(a) * 24 * (0.9 + 0.1 * t);
            const y = Math.sin(a) * 24 * (0.9 + 0.1 * t);
            const rot = (a * 180) / Math.PI + 90 + (i % 2 ? 26 : -26);
            return (
              <path key={i} transform={`translate(${x.toFixed(1)} ${(-y + 6).toFixed(1)}) rotate(${rot.toFixed(0)})`} d="M0 0 C 2.6 -2 2.4 -6 0 -8 C -2.4 -6 -2.6 -2 0 0 Z" fill="currentColor" />
            );
          })}
        </g>
      ))}
      <g transform={`translate(${c} ${c - 3})`}>
        <path d="M-15 -2 L0 -9 L15 -2 L0 5 Z" fill="currentColor" />
        <path d="M-9 1.5 V8 C -4 11 4 11 9 8 V1.5 L0 5 Z" fill="currentColor" />
        <path d="M0 -2 L11 2 V10" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="11" cy="11" r="1.6" fill="currentColor" />
      </g>
      <circle cx={c} cy={c} r="38" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </>
  );
  return (
    <svg className={`bi-svg-sello ${className}`} viewBox="0 0 120 150" aria-hidden="true">
      <defs>
        <OroLamina id={id("o")} radial />
        <linearGradient id={id("cola")} x1="0" y1="0" x2="1" y2="0">
          {tope(0, VINO_OSC)}
          {tope(0.45, mezcla(VINO, "#fff", 78))}
          {tope(1, VINO)}
        </linearGradient>
        <Grano id={id("g")} opacidad={0.22} />
        <Sombra id={id("s")} desv={2.6} />
        <path id={id("arco")} d="M29 60 A31 31 0 0 1 91 60" />
      </defs>
      {/* Colas de cinta vino */}
      <path d="M48 88 L34 146 L44 139 L52 148 L62 96 Z" fill={`url(#${id("cola")})`} />
      <path d="M72 88 L86 146 L76 139 L68 148 L58 96 Z" fill={`url(#${id("cola")})`} />
      <path d="M50 92 L38 140 M70 92 L82 140" stroke={ORO} strokeOpacity=".8" strokeWidth=".9" />
      {/* Sombra y disco de lámina */}
      <path d={dentado(c, 48, 44.5, 32)} transform="translate(1.5 3)" fill="#3a1a12" opacity=".35" filter={`url(#${id("s")})`} />
      <path d={dentado(c, 48, 44.5, 32)} fill={`url(#${id("o")})`} stroke={ORO_OSC} strokeOpacity=".6" strokeWidth=".6" />
      <circle cx={c} cy={c} r="42" fill="none" stroke={ORO_OSC} strokeOpacity=".45" strokeWidth=".7" strokeDasharray="1.2 2" />
      {repujado(motivo)}
      <text fontSize="6.6" letterSpacing="1.4" fill={ORO_OSC} style={{ fontFamily: "var(--fuente-titulos, 'Cinzel Decorative'), serif" }} textAnchor="middle">
        <textPath href={`#${id("arco")}`} startOffset="50%">{texto}</textPath>
      </text>
      {/* Grano y brillo del metal */}
      <path d={dentado(c, 48, 44.5, 32)} filter={`url(#${id("g")})`} fill="#fff" />
      <path d="M28 38 C 36 25 51 18 66 19" stroke="#fff" strokeOpacity=".55" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
// Sello de pases: lámina dorada estampada en relieve con el número de
// personas al centro y «Válida para · personas» repujado en el aro.
// SDXL: bi_sello_pases
export function BiSelloPases({ className = "", numero = 2 }) {
  const id = useIds();
  const c = 60;
  const fuente = { fontFamily: "var(--fuente-titulos, 'Cinzel Decorative'), serif" };
  const capas = (hijo) => (
    <>
      <g transform="translate(-.8 -.8)" fill={mezcla(ORO_CLARO, "#fff", 30)} opacity=".85">{hijo}</g>
      <g transform="translate(.9 1)" fill={ORO_OSC} opacity=".6">{hijo}</g>
      <g fill={mezcla(ORO, ORO_CLARO, 55)}>{hijo}</g>
    </>
  );
  return (
    <svg className={`bi-svg-relieve ${className}`} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <OroLamina id={id("o")} radial />
        <Grano id={id("g")} opacidad={0.24} />
        <Sombra id={id("s")} desv={2.4} />
        <path id={id("arriba")} d={`M${c - 33} ${c} A33 33 0 0 1 ${c + 33} ${c}`} />
        <path id={id("abajo")} d={`M${c - 39} ${c} A39 39 0 0 0 ${c + 39} ${c}`} />
      </defs>
      <path d={dentado(c, 56, 51.5, 40)} transform="translate(1.4 2.6)" fill="#3a1a12" opacity=".35" filter={`url(#${id("s")})`} />
      <path d={dentado(c, 56, 51.5, 40)} fill={`url(#${id("o")})`} stroke={ORO_OSC} strokeOpacity=".5" strokeWidth=".6" />
      {/* Aros repujados */}
      <circle cx={c} cy={c} r="46.4" fill="none" stroke={mezcla(ORO_CLARO, "#fff", 30)} strokeOpacity=".8" strokeWidth="1" transform="translate(-.6 -.6)" />
      <circle cx={c} cy={c} r="46.4" fill="none" stroke={ORO_OSC} strokeOpacity=".55" strokeWidth="1" transform="translate(.6 .7)" />
      <circle cx={c} cy={c} r="29.5" fill="none" stroke={mezcla(ORO_CLARO, "#fff", 30)} strokeOpacity=".8" strokeWidth="1" transform="translate(-.6 -.6)" />
      <circle cx={c} cy={c} r="29.5" fill="none" stroke={ORO_OSC} strokeOpacity=".55" strokeWidth="1" transform="translate(.6 .7)" />
      {capas(
        <text fontSize="7.4" letterSpacing="1.6" textAnchor="middle" style={fuente}>
          <textPath href={`#${id("arriba")}`} startOffset="50%">VÁLIDA PARA</textPath>
        </text>,
      )}
      {capas(
        <text fontSize="7.4" letterSpacing="1.6" textAnchor="middle" style={fuente}>
          <textPath href={`#${id("abajo")}`} startOffset="50%">{numero === 1 ? "PERSONA" : "PERSONAS"}</textPath>
        </text>,
      )}
      {capas(<><circle cx={c - 34} cy={c + 3} r="1.4" /><circle cx={c + 34} cy={c + 3} r="1.4" /></>)}
      {capas(
        <text x={c} y={c + 11} fontSize="31" fontWeight="700" textAnchor="middle" style={fuente}>{numero}</text>,
      )}
      <path d={dentado(c, 56, 51.5, 40)} filter={`url(#${id("g")})`} fill="#fff" />
      <path d="M22 40 C 30 24 46 15 64 14" stroke="#fff" strokeOpacity=".6" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
// Firma a pluma que se traza sola (stroke-dashoffset en el CSS).
// SDXL: bi_firma
export function BiFirma({ className = "" }) {
  return (
    <svg className={`bi-svg-firma ${className}`} viewBox="0 0 170 54" aria-hidden="true">
      <path
        className="bi-firma-trazo"
        pathLength="1"
        d="M8 36 C 12 18 22 6 26 12 C 30 18 20 40 14 42 C 8 44 16 28 26 26 C 34 24 32 36 38 34 C 44 32 44 22 50 22 C 56 22 50 34 56 34 C 62 34 62 20 68 22 C 74 24 66 36 74 35 C 80 34 82 24 86 18 C 88 14 90 16 88 24 C 86 32 84 40 90 36 C 98 30 104 26 112 28 C 122 30 132 24 146 18 C 152 15 158 14 162 16"
        fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      />
      <path className="bi-firma-trazo bi-firma-rubrica" pathLength="1" d="M20 47 C 60 41 108 44 150 38 C 156 37 160 39 154 42" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
// Círculo a mano alzada con tinta vino, para marcar el día en el calendario.
export function BiCirculo({ className = "" }) {
  return (
    <svg className={`bi-svg-circulo ${className}`} viewBox="0 0 60 50" aria-hidden="true">
      <path
        pathLength="1"
        d="M42 8 C 30 2 10 6 6 20 C 2 34 18 46 34 44 C 50 42 58 30 54 18 C 51 10 40 5 28 7"
        fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
// Birrete de graduación en tres cuartos: tabla vino, casquete, botón y
// borla de oro con hilos (la borla se mece en el botón de música).
// SDXL: bi_birrete
export function BiBirrete({ className = "" }) {
  const id = useIds();
  return (
    <svg className={`bi-svg-birrete ${className}`} viewBox="0 0 160 130" aria-hidden="true">
      <defs>
        <linearGradient id={id("tabla")} x1="0" y1="0" x2="1" y2="1">
          {tope(0, mezcla(VINO, "#fff", 68))}
          {tope(0.45, VINO)}
          {tope(1, VINO_OSC)}
        </linearGradient>
        <linearGradient id={id("canto")} x1="0" y1="0" x2="1" y2="0">
          {tope(0, mezcla(VINO_OSC, "#000", 80))}
          {tope(0.5, mezcla(VINO_OSC, "#000", 60))}
          {tope(1, mezcla(VINO_OSC, "#000", 85))}
        </linearGradient>
        <linearGradient id={id("casco")} x1="0" y1="0" x2="1" y2="0">
          {tope(0, mezcla(VINO_OSC, "#000", 70))}
          {tope(0.35, mezcla(VINO, "#fff", 82))}
          {tope(0.7, VINO)}
          {tope(1, mezcla(VINO_OSC, "#000", 70))}
        </linearGradient>
        <linearGradient id={id("borla")} x1="0" y1="0" x2="1" y2="0">
          {tope(0, ORO_OSC)}
          {tope(0.4, ORO_CLARO)}
          {tope(1, ORO)}
        </linearGradient>
        <Grano id={id("g")} opacidad={0.12} />
        <Sombra id={id("s")} desv={4} />
      </defs>
      <ellipse className="bi-birrete-sombra" cx="80" cy="118" rx="46" ry="6" fill="#2b1014" opacity=".22" filter={`url(#${id("s")})`} />
      {/* Casquete */}
      <path d="M44 58 V88 C 60 102 100 102 116 88 V58 Z" fill={`url(#${id("casco")})`} />
      <path d="M44 86 C 60 99 100 99 116 86" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="1.2" />
      {/* Tabla */}
      <path d="M80 26 L150 50 L80 76 L10 50 Z" fill={`url(#${id("canto")})`} transform="translate(0 4)" />
      <path d="M80 26 L150 50 L80 76 L10 50 Z" fill={`url(#${id("tabla")})`} />
      <path d="M80 26 L150 50 L80 76 L10 50 Z" fill="#fff" filter={`url(#${id("g")})`} />
      <path d="M14 50 L80 27.6" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" />
      {/* Cordón, botón y borla */}
      <path d="M80 50 C 104 52 124 56 132 62" fill="none" stroke={`url(#${id("borla")})`} strokeWidth="2.2" strokeLinecap="round" />
      <g className="bi-borla">
        <path d="M132 62 V96" fill="none" stroke={`url(#${id("borla")})`} strokeWidth="2.2" strokeLinecap="round" />
        <rect x="128.5" y="92" width="7" height="7" rx="2" fill={`url(#${id("borla")})`} />
        <g stroke={`url(#${id("borla")})`} strokeWidth="1.3" strokeLinecap="round">
          {[-3, -1.5, 0, 1.5, 3].map((dx, i) => (
            <path key={i} d={`M${132 + dx * 0.6} 99 C ${132 + dx} 106 ${132 + dx * 1.3} 112 ${132 + dx * 1.6} ${116 + (i % 2) * 2}`} fill="none" />
          ))}
        </g>
      </g>
      <ellipse cx="80" cy="50" rx="6" ry="3.4" fill={`url(#${id("borla")})`} />
      <ellipse cx="78.6" cy="49" rx="2.2" ry="1.1" fill="#fff" opacity=".6" />
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
          <path transform="translate(1 1.6)" d={`M0 0 C ${h.W} ${-h.L * 0.28} ${h.W * 0.8} ${-h.L * 0.8} 0 ${-h.L} C ${-h.W * 0.8} ${-h.L * 0.8} ${-h.W} ${-h.L * 0.28} 0 0 Z`} fill="#3a1a12" opacity=".22" filter={`url(#${id("s")})`} />
          <path d={`M0 0 C ${h.W} ${-h.L * 0.28} ${h.W * 0.8} ${-h.L * 0.8} 0 ${-h.L} C ${-h.W * 0.8} ${-h.L * 0.8} ${-h.W} ${-h.L * 0.28} 0 0 Z`} fill={`url(#${id("h")})`} />
          <path d={`M0 -1 Q ${h.W * 0.12} ${-h.L * 0.5} 0 ${-h.L * 0.94}`} fill="none" stroke={ORO_OSC} strokeOpacity=".7" strokeWidth=".8" />
          <path d={`M${-h.W * 0.45} ${-h.L * 0.3} C ${-h.W * 0.5} ${-h.L * 0.5} ${-h.W * 0.35} ${-h.L * 0.7} ${-h.W * 0.1} ${-h.L * 0.82}`} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth=".9" />
        </g>
      ))}
      {/* Bayas vino */}
      {[0.3, 0.55, 0.78].map((t) => {
        const [x, y] = punto(t);
        return (
          <g key={t}>
            <circle cx={x + 6} cy={y + 2} r="3.6" fill={VINO} stroke={VINO_OSC} strokeOpacity=".6" strokeWidth=".6" />
            <circle cx={x + 5} cy={y + 1} r="1" fill="#fff" opacity=".6" />
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
        <linearGradient id={id("vino")} x1="0" y1="0" x2="0" y2="1">
          {tope(0, mezcla(VINO, "#fff", 70))}
          {tope(0.5, VINO)}
          {tope(1, VINO_OSC)}
        </linearGradient>
        <linearGradient id={id("cuero")} x1="0" y1="0" x2="0" y2="1">
          {tope(0, mezcla(ORO_OSC, "#fff", 78))}
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
        <Sombra id={id("s")} desv={4} />
      </defs>
      <ellipse cx="85" cy="122" rx="74" ry="6" fill="#2b1014" opacity=".24" filter={`url(#${id("s")})`} />
      {/* Libro de abajo: vino */}
      <g>
        <rect x="12" y="88" width="146" height="30" rx="3" fill={`url(#${id("vino")})`} />
        <rect x="20" y="91" width="134" height="22" fill={`url(#${id("pag")})`} />
        {lineas(20, 91, 134, 22, 7)}
        <rect x="12" y="88" width="22" height="30" rx="3" fill={`url(#${id("vino")})`} />
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
      {/* Libro de arriba: marfil con filete vino */}
      <g transform="rotate(2.5 85 46)">
        <rect x="30" y="36" width="112" height="24" rx="3" fill={`url(#${id("marfil")})`} />
        <rect x="36" y="38.5" width="104" height="18" fill={`url(#${id("pag")})`} />
        {lineas(36, 38.5, 104, 18, 6)}
        <rect x="30" y="36" width="14" height="24" rx="3" fill={`url(#${id("marfil")})`} />
        <rect x="33" y="40" width="8" height="16" fill="none" stroke={VINO} strokeWidth="1" />
      </g>
      {/* Cinta marcapáginas */}
      <path d="M118 60 L118 76 L114 72 L110 76 L110 60" fill={VINO} transform="rotate(2.5 85 46)" />
      {/* Un lápiz encima */}
      <g transform="rotate(-8 90 30)">
        <rect x="52" y="28" width="66" height="6" rx="1" fill={`url(#${id("oro")})`} />
        <path d="M118 28 L128 31 L118 34 Z" fill="#E8D3A8" />
        <path d="M125 30.1 L128 31 L125 31.9 Z" fill="#2b2b2b" />
        <rect x="48" y="28" width="5" height="6" fill={VINO} />
      </g>
    </svg>
  );
}
