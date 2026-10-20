import { useId } from "react";

// Arte de «Dulce 30», todo en SVG semi-realista: capas de degradados, sombras
// suaves, curvas Bézier y un grano fino para que no se vea plano. Cada pieza
// con nombre lleva encima su nombre SDXL para poder cambiarla luego por un
// .webp pintado.
// - Los colores de marca salen del tema (caramelo, vainilla, tostado, papel,
//   crema de tarjetas y frutos) con style={{…}}, porque los atributos de
//   presentación del SVG no entienden var().
// - Los colores propios del objeto son fijos: el oro (metal), el mármol, el
//   bizcocho, los frutos rojos, el acero del batidor, la champaña y el fuego.
// - Los ids de degradados y filtros son únicos por instancia (useId), porque
//   las piezas se repiten en la página.

const T = {
  caramelo: "rgb(var(--color-gold))",
  vainilla: "rgb(var(--color-gold-light))",
  tostado: "rgb(var(--color-gold-dark))",
  papel: "rgb(var(--color-paper))",
  crema: "rgb(var(--color-marble))",
  frutos: "rgb(var(--color-seal))",
  tinta: "rgb(var(--color-ink))",
};
const mezcla = (a, b, p) => `color-mix(in srgb, ${a} ${p}%, ${b})`;
const ORO = { luz: "#FBF0CF", claro: "#E9CF8E", medio: "#C9A15A", oscuro: "#97733A", sombra: "#6E5226" };
const MARMOL_VETA = "#B9AFA3";

// Ids únicos por instancia de pieza: ids("a", "b") → { a: "dl…a", b: "dl…b" }.
function useIds(...nombres) {
  const base = useId().replace(/[^a-zA-Z0-9]/g, "");
  return Object.fromEntries(nombres.map((n) => [n, `dl${base}${n}`]));
}
const url = (id) => `url(#${id})`;

function Parada({ o, c, a = 1 }) {
  return <stop offset={o} style={{ stopColor: c, stopOpacity: a }} />;
}

// Grano fino de papel: ruido fractal teñido, solo donde hay pintura.
function Grano({ id, fuerza = 0.08 }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch" result="ruido" />
      <feColorMatrix in="ruido" values={`0 0 0 0 .4  0 0 0 0 .27  0 0 0 0 .15  0 0 0 ${fuerza} 0`} result="tinte" />
      <feComposite in="tinte" in2="SourceGraphic" operator="in" result="grano" />
      <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="grano" /></feMerge>
    </filter>
  );
}

// Oro metálico (bandas, aros, bordes).
function OroLineal({ id, vertical = false }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? 0 : 1} y2={vertical ? 1 : 0}>
      <Parada o="0" c={ORO.oscuro} />
      <Parada o=".22" c={ORO.claro} />
      <Parada o=".38" c={ORO.luz} />
      <Parada o=".55" c={ORO.medio} />
      <Parada o=".78" c={ORO.claro} />
      <Parada o="1" c={ORO.sombra} />
    </linearGradient>
  );
}

function Sombra({ id, opacidad = 0.32 }) {
  return (
    <radialGradient id={id}>
      <Parada o="0" c={T.tostado} a={opacidad} />
      <Parada o=".6" c={T.tostado} a={opacidad * 0.35} />
      <Parada o="1" c={T.tostado} a="0" />
    </radialGradient>
  );
}

// Puntos sobre el frente de una elipse (de izquierda a derecha).
function arcoFrente(cx, cy, rx, ry, n, margen = 0.06) {
  return Array.from({ length: n }, (_, i) => {
    const t = Math.PI * (1 - margen) - (i / (n - 1)) * Math.PI * (1 - 2 * margen);
    return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
  });
}

// ---------- Frutos rojos y detalles ----------

function degradadosFrutos(g) {
  return (
    <>
      <radialGradient id={g.fresa} cx=".38" cy=".3" r=".85">
        <Parada o="0" c="#FF9C8E" />
        <Parada o=".35" c="#E5414A" />
        <Parada o=".8" c="#B5212F" />
        <Parada o="1" c="#7E1622" />
      </radialGradient>
      <radialGradient id={g.fram} cx=".35" cy=".3" r=".8">
        <Parada o="0" c="#F58AA0" />
        <Parada o=".6" c="#C8304F" />
        <Parada o="1" c="#86183A" />
      </radialGradient>
      <radialGradient id={g.arandano} cx=".35" cy=".3" r=".85">
        <Parada o="0" c="#8D9BCB" />
        <Parada o=".5" c="#46508A" />
        <Parada o="1" c="#252A52" />
      </radialGradient>
      <linearGradient id={g.hoja} x1="0" y1="0" x2="1" y2="1">
        <Parada o="0" c="#A6C08A" />
        <Parada o="1" c="#55784A" />
      </linearGradient>
    </>
  );
}

// Fresa entera con semillas y su hojita verde.
function Fresa({ x, y, s = 1, giro = 0, g }) {
  const semillas = [[-3.5, -3], [2, -4.5], [5, 0], [-5, 2], [0, 1.5], [3, 5.5], [-2.5, 7], [0, -7.5], [-5.5, -5.5]];
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${s})`}>
      <ellipse cx="1" cy="12" rx="8" ry="2.4" fill={T.tinta} opacity=".14" />
      <path d="M0 -9 C 7 -10.5 10.5 -4 8.6 2.5 C 6.8 8.6 2.6 12 0 12 C -2.6 12 -6.8 8.6 -8.6 2.5 C -10.5 -4 -7 -10.5 0 -9 Z" fill={url(g.fresa)} />
      {semillas.map(([sx, sy], i) => (
        <ellipse key={i} cx={sx} cy={sy} rx=".7" ry="1" fill="#F7D58A" opacity=".9" />
      ))}
      <path d="M-5.5 -6 C -4 -8 -1 -9 2 -8.6" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M0 -8.5 L-7 -11 L-3 -9.5 L-5.5 -14 L-1 -10.5 L0 -15.5 L1.6 -10.5 L6 -13.5 L3.4 -9.4 L7.4 -10.6 Z" fill={url(g.hoja)} />
      <path d="M0 -10 l.4 -4" stroke="#55784A" strokeWidth="1.1" strokeLinecap="round" />
    </g>
  );
}

// Frambuesa: racimo de drupas.
function Frambuesa({ x, y, s = 1, g }) {
  const drupas = [[0, 0], [-3, -2], [3, -2], [-2, 2.5], [2.5, 2.5], [0, -4.5], [-4.5, 1], [4.5, 1], [0, 4.6]];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="7" rx="6" ry="1.8" fill={T.tinta} opacity=".12" />
      {drupas.map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r="2.7" fill={url(g.fram)} />)}
      {drupas.map(([dx, dy], i) => <circle key={`b${i}`} cx={dx - 0.8} cy={dy - 0.9} r=".7" fill="#fff" opacity=".55" />)}
    </g>
  );
}

// Arándano con su coronita y su pruina.
function Arandano({ x, y, r = 5, g }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={url(g.arandano)} />
      <circle r={r} fill="#fff" opacity=".12" />
      <path d={`M0 ${-r * 0.55} l${r * 0.22} ${r * 0.3} l${r * 0.32} 0 l${-r * 0.26} ${r * 0.22} l${r * 0.1} ${r * 0.32} l${-r * 0.38} ${-r * 0.2} l${-r * 0.38} ${r * 0.2} l${r * 0.1} ${-r * 0.32} l${-r * 0.26} ${-r * 0.22} l${r * 0.32} 0 Z`}
        fill="#1B1F3D" opacity=".75" />
      <ellipse cx={-r * 0.4} cy={-r * 0.45} rx={r * 0.28} ry={r * 0.16} fill="#fff" opacity=".45" transform={`rotate(-30 ${-r * 0.4} ${-r * 0.45})`} />
    </g>
  );
}

// Hojilla de oro comestible.
function HojaOro({ x, y, s = 1, giro = 0, g }) {
  return (
    <path transform={`translate(${x} ${y}) rotate(${giro}) scale(${s})`}
      d="M0 -4 L3.5 -3 L5 .5 L2.5 3.6 L-1.5 4 L-4.6 1.2 L-3.6 -2.6 Z" fill={url(g.oro)} opacity=".95" />
  );
}

// Roseta de crema hecha con manga (vista de tres cuartos).
function Roseta({ x, y, r = 6, g }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy={r * 0.45} rx={r * 1.05} ry={r * 0.45} fill={T.tostado} opacity=".14" />
      <ellipse cx="0" cy="0" rx={r} ry={r * 0.78} fill={url(g.crema)} />
      <path d={`M${-r * 0.7} ${r * 0.1} C ${-r * 0.7} ${-r * 0.7}, ${r * 0.7} ${-r * 0.7}, ${r * 0.6} ${r * 0.05} C ${r * 0.5} ${r * 0.55}, ${-r * 0.4} ${r * 0.5}, ${-r * 0.3} ${-r * 0.05} C ${-r * 0.2} ${-r * 0.4}, ${r * 0.3} ${-r * 0.35}, ${r * 0.2} 0`}
        fill="none" style={{ stroke: mezcla(T.vainilla, T.caramelo, 55) }} strokeWidth={r * 0.13} strokeLinecap="round" />
    </g>
  );
}

// Macaron de perfil (tres cuartos): concha de abajo, pie rizado, relleno,
// pie y concha de arriba con brillo. `color` puede ser del tema o un hex.
function Macaron({ x, y, r, color, id }) {
  const pie = (base) => {
    const n = 14;
    let d = `M${-r * 0.93} ${base}`;
    for (let i = 0; i <= n; i++) {
      const px = -r * 0.93 + (i / n) * r * 1.86;
      d += ` L${px.toFixed(2)} ${(base - (i % 2 ? 2.2 : 0.6) * (r / 22)).toFixed(2)}`;
    }
    d += ` L${r * 0.93} ${base + 3.2 * (r / 22)} L${-r * 0.93} ${base + 3.2 * (r / 22)} Z`;
    return d;
  };
  const k = r / 22;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${id}c`} cx=".35" cy=".3" r=".85">
          <Parada o="0" c={mezcla(color, "#fff", 45)} />
          <Parada o=".55" c={color} />
          <Parada o="1" c={mezcla(color, "#000", 82)} />
        </radialGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <Parada o="0" c={mezcla(color, "#fff", 70)} />
          <Parada o="1" c={mezcla(color, "#000", 78)} />
        </linearGradient>
      </defs>
      <ellipse cx="0" cy={14 * k} rx={r * 1.05} ry={r * 0.22} fill={T.tinta} opacity=".14" />
      <path d={`M${-r} ${4 * k} C ${-r} ${16 * k}, ${r} ${16 * k}, ${r} ${4 * k} Z`} fill={`url(#${id}b)`} />
      <path d={pie(4 * k)} style={{ fill: mezcla(color, "#fff", 80) }} />
      <ellipse cx="0" cy={0} rx={r * 0.9} ry={r * 0.2} fill="#FFF8EC" />
      <ellipse cx="0" cy={1.2 * k} rx={r * 0.9} ry={r * 0.16} style={{ fill: mezcla(color, "#FFF8EC", 25) }} />
      <path d={pie(-4.5 * k)} style={{ fill: mezcla(color, "#fff", 80) }} />
      <path d={`M${-r} ${-3 * k} C ${-r} ${-r * 0.95}, ${r} ${-r * 0.95}, ${r} ${-3 * k} C ${r * 0.6} ${-0.5 * k}, ${-r * 0.6} ${-0.5 * k}, ${-r} ${-3 * k} Z`}
        fill={`url(#${id}c)`} />
      <path d={`M${-r * 0.55} ${-r * 0.45} C ${-r * 0.35} ${-r * 0.66}, ${r * 0.05} ${-r * 0.72}, ${r * 0.25} ${-r * 0.68}`}
        fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth={1.6 * k} strokeLinecap="round" />
    </g>
  );
}

// Surtido de macarons: caramelo, pistacho, vainilla, frutos, chocolate, limón.
const SURTIDO = [T.caramelo, "#BFD39A", "#F4E7C8", T.frutos, "#8B5E3C", "#F1D77E"];

// Piso de pastel: cilindro de crema de vainilla con su tapa.
function Piso({ cx, arriba, abajo, rx, ry, g }) {
  const cuerpo = `M${cx - rx} ${arriba} L${cx - rx} ${abajo} A${rx} ${ry} 0 0 0 ${cx + rx} ${abajo} L${cx + rx} ${arriba} Z`;
  return (
    <g>
      <path d={cuerpo} fill={url(g.cil)} />
      <path d={cuerpo} fill={url(g.vertical)} />
      <ellipse cx={cx} cy={arriba} rx={rx} ry={ry} fill={url(g.tapa)} />
    </g>
  );
}

// Caramelo que cubre la tapa y chorrea por el frente del piso. `largos` es
// la longitud de cada gota de izquierda a derecha (0 = sin gota).
function goteo(cx, arriba, rx, ry, largos) {
  const pts = arcoFrente(cx, arriba, rx, ry, largos.length, 0.035);
  let d = `M${cx - rx} ${arriba}`;
  pts.forEach(([x, y], i) => {
    const L = largos[i];
    const w = 2.4 + L * 0.07;
    if (L > 0) {
      d += ` L${(x - w).toFixed(1)} ${(y + 4).toFixed(1)} C ${(x - w).toFixed(1)} ${(y + L * 0.7).toFixed(1)}, ${(x - w - 0.5).toFixed(1)} ${(y + L).toFixed(1)}, ${x.toFixed(1)} ${(y + L).toFixed(1)}`;
      d += ` C ${(x + w + 0.5).toFixed(1)} ${(y + L).toFixed(1)}, ${(x + w).toFixed(1)} ${(y + L * 0.7).toFixed(1)}, ${(x + w).toFixed(1)} ${(y + 4).toFixed(1)}`;
    } else {
      d += ` L${x.toFixed(1)} ${(y + 4).toFixed(1)}`;
    }
  });
  d += ` L${cx + rx} ${arriba} A${rx} ${ry} 0 0 0 ${cx - rx} ${arriba} Z`;
  return d;
}
function Goteo({ cx, arriba, rx, ry, largos, g }) {
  return (
    <g>
      <path d={goteo(cx, arriba, rx, ry, largos)} fill={url(g.caramelo)} />
      <path d={`M${cx - rx + 4} ${arriba + 2} A${rx - 4} ${ry - 1.5} 0 0 0 ${cx + rx - 4} ${arriba + 2}`} fill="none"
        stroke="#FFF4DE" strokeOpacity=".7" strokeWidth="1.1" />
      <ellipse cx={cx - rx * 0.25} cy={arriba - ry * 0.3} rx={rx * 0.35} ry={ry * 0.32} fill="#FFF4DE" opacity=".35" />
    </g>
  );
}

// SDXL: dl_pastel
// Pastel de tres pisos de crema de vainilla con caramelo chorreado, fresas,
// frambuesas y arándanos, hojillas de oro y rosetas de crema, sobre un
// pedestal de mármol con aros dorados. Las velas encendidas llevan la clase
// dl-llama (el CSS las hace titilar y las apaga al soplar). Con `topper`
// dibuja los palillos dorados donde va la edad (texto en el HTML).
export const VELAS = [
  { x: 110, base: 116 }, { x: 124, base: 113 }, { x: 196, base: 113 }, { x: 210, base: 116 },
];
const ALTO_VELA = 34;
export function DlPastel({ className = "", topper = false }) {
  const g = useIds("cil", "vertical", "tapa", "crema", "caramelo", "marmol", "marmolPie", "oro", "sombra", "sombraPiso",
    "grano", "fresa", "fram", "arandano", "hoja", "llama", "halo", "vela", "c2", "m1", "m2", "m3");
  const p1 = { cx: 160, arriba: 252, abajo: 330, rx: 110, ry: 15 };
  const p2 = { cx: 160, arriba: 182, abajo: 254, rx: 80, ry: 12 };
  const p3 = { cx: 160, arriba: 114, abajo: 184, rx: 54, ry: 9 };
  const cuerpo2 = `M80 ${p2.arriba} L80 ${p2.abajo} A80 12 0 0 0 240 ${p2.abajo} L240 ${p2.arriba} Z`;

  return (
    <svg className={className} viewBox="0 0 320 440" aria-hidden="true">
      <defs>
        <linearGradient id={g.cil} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c={mezcla(T.caramelo, T.vainilla, 45)} />
          <Parada o=".14" c={T.vainilla} />
          <Parada o=".38" c={mezcla(T.vainilla, "#fff", 35)} />
          <Parada o=".55" c={mezcla(T.vainilla, "#fff", 60)} />
          <Parada o=".82" c={T.vainilla} />
          <Parada o="1" c={mezcla(T.caramelo, T.vainilla, 55)} />
        </linearGradient>
        <linearGradient id={g.vertical} x1="0" y1="0" x2="0" y2="1">
          <Parada o="0" c="#fff" a=".18" />
          <Parada o=".3" c="#fff" a="0" />
          <Parada o="1" c={T.tostado} a=".16" />
        </linearGradient>
        <radialGradient id={g.tapa} cx=".42" cy=".35" r=".75">
          <Parada o="0" c="#fff" />
          <Parada o="1" c={T.vainilla} />
        </radialGradient>
        <radialGradient id={g.crema} cx=".4" cy=".3" r=".8">
          <Parada o="0" c="#FFFFFF" />
          <Parada o=".6" c={mezcla(T.vainilla, "#fff", 50)} />
          <Parada o="1" c={T.vainilla} />
        </radialGradient>
        <linearGradient id={g.caramelo} x1="0" y1="0" x2="0" y2="1">
          <Parada o="0" c={mezcla(T.caramelo, "#fff", 72)} />
          <Parada o=".35" c={T.caramelo} />
          <Parada o="1" c={mezcla(T.tostado, T.caramelo, 70)} />
        </linearGradient>
        <linearGradient id={g.marmol} x1="0" y1="0" x2="1" y2="1">
          <Parada o="0" c="#FFFFFF" />
          <Parada o=".5" c="#F3EFE8" />
          <Parada o="1" c="#FFFFFF" />
        </linearGradient>
        <linearGradient id={g.marmolPie} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c="#DAD2C6" />
          <Parada o=".35" c="#FFFFFF" />
          <Parada o=".7" c="#F1ECE4" />
          <Parada o="1" c="#CDC4B8" />
        </linearGradient>
        <OroLineal id={g.oro} />
        <Sombra id={g.sombra} opacidad={0.35} />
        <Sombra id={g.sombraPiso} opacidad={0.4} />
        <linearGradient id={g.vela} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c={mezcla(T.vainilla, T.caramelo, 70)} />
          <Parada o=".4" c="#fff" />
          <Parada o="1" c={T.vainilla} />
        </linearGradient>
        <radialGradient id={g.llama} cx=".5" cy=".78" r=".7">
          <Parada o="0" c="#FFFFFF" />
          <Parada o=".3" c="#FFF4C2" />
          <Parada o=".62" c="#FFC560" />
          <Parada o=".9" c="#F2875A" a=".85" />
          <Parada o="1" c="#F2875A" a="0" />
        </radialGradient>
        <radialGradient id={g.halo}>
          <Parada o="0" c="#FFE7A8" a=".55" />
          <Parada o="1" c="#FFE7A8" a="0" />
        </radialGradient>
        {degradadosFrutos(g)}
        <clipPath id={g.c2}><path d={cuerpo2} /></clipPath>
        <Grano id={g.grano} />
      </defs>

      <g filter={url(g.grano)}>
        {/* Pedestal de mármol: pie, tallo con aros dorados y plato. */}
        <ellipse cx="160" cy="426" rx="104" ry="10" fill={url(g.sombra)} />
        <path d="M100 418 A60 9 0 0 0 220 418 L220 412 A60 9 0 0 1 100 412 Z" fill={url(g.oro)} />
        <ellipse cx="160" cy="412" rx="60" ry="9" fill={url(g.marmolPie)} />
        <path d="M147 352 L147 384 C147 396 124 401 110 410 C130 416 190 416 210 410 C196 401 173 396 173 384 L173 352 Z" fill={url(g.marmolPie)} />
        <path d="M150 360 C 156 372 152 386 160 398 M166 356 C 170 366 164 374 168 384" fill="none" stroke={MARMOL_VETA} strokeWidth=".7" opacity=".6" />
        <rect x="143" y="383" width="34" height="6" rx="3" fill={url(g.oro)} />
        <rect x="141" y="350" width="38" height="8" rx="3" fill={url(g.oro)} />
        <path d="M20 336 A140 18 0 0 0 300 336 L300 344 A140 18 0 0 1 20 344 Z" fill={url(g.oro)} />
        <ellipse cx="160" cy="336" rx="140" ry="18" fill={url(g.marmol)} />
        <path d="M34 334 C 60 340 70 330 96 338 M226 344 C 246 336 262 344 286 336 M60 346 C 80 342 92 350 112 346" fill="none" stroke={MARMOL_VETA} strokeWidth=".7" opacity=".55" />
        <ellipse cx="160" cy="333" rx="122" ry="14" fill={url(g.sombraPiso)} />

        {/* Piso de abajo: caramelo, hojillas de oro y rosetas en la base. */}
        <Piso {...p1} g={g} />
        <Goteo cx={160} arriba={p1.arriba} rx={110} ry={15} g={g}
          largos={[10, 22, 7, 16, 30, 9, 18, 6, 26, 12, 20, 8, 28, 14, 7, 19, 11]} />
        {[[66, 300, 1, 20], [92, 286, .8, -30], [232, 296, 1.1, 40], [258, 284, .7, 10], [118, 312, .7, 70], [204, 314, .8, -10]].map(([x, y, s, r], i) => (
          <HojaOro key={i} x={x} y={y} s={s} giro={r} g={g} />
        ))}
        {arcoFrente(160, 330, 110, 15, 15, 0.04).map(([x, y], i) => <Roseta key={i} x={x} y={y - 3} r={6.6} g={g} />)}

        {/* Piso del medio: crema peinada con espátula y caramelo. */}
        <ellipse cx="160" cy={p2.abajo + 2} rx="88" ry="15" fill={url(g.sombraPiso)} />
        <Piso {...p2} g={g} />
        <g clipPath={url(g.c2)}>
          {[206, 218, 230, 242].map((y) => (
            <g key={y}>
              <path d={`M80 ${y} A80 12 0 0 0 240 ${y}`} fill="none" style={{ stroke: mezcla(T.vainilla, T.caramelo, 60) }} strokeOpacity=".45" strokeWidth=".9" />
              <path d={`M80 ${y + 1.2} A80 12 0 0 0 240 ${y + 1.2}`} fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth=".7" />
            </g>
          ))}
        </g>
        <Goteo cx={160} arriba={p2.arriba} rx={80} ry={12} g={g} largos={[8, 18, 6, 24, 11, 5, 20, 9, 15, 26, 7, 13, 6]} />
        {[[104, 230, .7, 15], [216, 226, .8, -25], [180, 240, .6, 60], [132, 244, .55, 0]].map(([x, y, s, r], i) => (
          <HojaOro key={i} x={x} y={y} s={s} giro={r} g={g} />
        ))}

        {/* Piso de arriba: caramelo y banda dorada. */}
        <ellipse cx="160" cy={p3.abajo + 2} rx="62" ry="12" fill={url(g.sombraPiso)} />
        <Piso {...p3} g={g} />
        <path d={`M106 ${p3.abajo - 9} A54 9 0 0 0 214 ${p3.abajo - 9} L214 ${p3.abajo} A54 9 0 0 1 106 ${p3.abajo} Z`} fill={url(g.oro)} />
        <Goteo cx={160} arriba={p3.arriba} rx={54} ry={9} g={g} largos={[7, 15, 5, 19, 9, 13, 22, 6, 12]} />

        {/* Palillos dorados del topper. */}
        {topper && (
          <g>
            <path d="M151 116 L151 76 M169 116 L169 76" stroke={ORO.claro} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M151 116 L151 76 M169 116 L169 76" stroke={ORO.oscuro} strokeWidth=".5" opacity=".6" transform="translate(.7 0)" />
          </g>
        )}

        {/* Frutos rojos: corona del piso de arriba y cascada por los bordes. */}
        <Arandano x={140} y={119} r={4.6} g={g} />
        <Fresa x={150} y={116} s={0.82} giro={-22} g={g} />
        <Frambuesa x={162} y={121} s={0.85} g={g} />
        <Fresa x={174} y={115} s={0.78} giro={24} g={g} />
        <Arandano x={184} y={121} r={4.4} g={g} />
        <HojaOro x={160} y={110} s={0.9} giro={15} g={g} />

        <Arandano x={86} y={188} r={4.8} g={g} />
        <Fresa x={100} y={186} s={1} giro={-30} g={g} />
        <Frambuesa x={113} y={193} s={0.9} g={g} />
        <HojaOro x={92} y={196} s={0.9} giro={30} g={g} />

        <Frambuesa x={236} y={262} s={1} g={g} />
        <Fresa x={251} y={257} s={1.05} giro={20} g={g} />
        <Arandano x={265} y={264} r={5} g={g} />

        <Arandano x={252} y={344} r={5.2} g={g} />
        <Frambuesa x={262} y={334} s={1} g={g} />
        <Fresa x={276} y={338} s={1.2} giro={-14} g={g} />
        <Arandano x={292} y={344} r={4.6} g={g} />
        <Macaron x={58} y={334} r={15} color={SURTIDO[0]} id={g.m1} />
        <Macaron x={86} y={344} r={15} color={SURTIDO[1]} id={g.m2} />
        <Macaron x={68} y={318} r={13} color={SURTIDO[3]} id={g.m3} />
      </g>

      {/* Velas con llama (fuera del grano para que la luz quede limpia). */}
      {VELAS.map((v, i) => {
        const tope = v.base - ALTO_VELA;
        return (
          <g key={v.x}>
            <rect x={v.x - 3} y={tope} width="6" height={ALTO_VELA} rx="2" fill={url(g.vela)} />
            <path d={`M${v.x - 3} ${tope + 8} l6 -4 M${v.x - 3} ${tope + 16} l6 -4 M${v.x - 3} ${tope + 24} l6 -4 M${v.x - 3} ${tope + 32} l6 -4`}
              style={{ stroke: T.caramelo }} strokeOpacity=".75" strokeWidth="1.3" />
            <ellipse cx={v.x} cy={tope} rx="3" ry="1.2" fill="#fff" />
            <path d={`M${v.x} ${tope} q.6 -2 -.2 -4`} fill="none" stroke="#4A3A34" strokeWidth="1.1" strokeLinecap="round" />
            <g transform={`translate(${v.x} ${tope - 3})`}>
              <g className="dl-llama" style={{ "--i": i }}>
                <circle cx="0" cy="-8" r="15" fill={url(g.halo)} className="dl-halo" />
                <path d="M0 0 C -4.8 -3.5 -4.6 -10 0 -18 C 4.6 -10 4.8 -3.5 0 0 Z" fill={url(g.llama)} />
                <path d="M0 -1 C -1.8 -3 -1.8 -6 0 -9 C 1.8 -6 1.8 -3 0 -1 Z" fill="#9FC3FF" opacity=".5" />
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// SDXL: dl_humo
// Hilos de humo que suben de cada mecha al soplar. Mismo lienzo que el
// pastel (320 × 440) para calzar encima; el CSS dibuja y desvanece cada hilo.
export function DlHumo({ className = "" }) {
  const g = useIds("humo", "difumina");
  return (
    <svg className={className} viewBox="0 0 320 440" aria-hidden="true">
      <defs>
        <linearGradient id={g.humo} x1="0" y1="1" x2="0" y2="0">
          <Parada o="0" c="#8A7F76" a=".65" />
          <Parada o=".5" c="#B6ADA4" a=".45" />
          <Parada o="1" c="#DAD3CB" a="0" />
        </linearGradient>
        <filter id={g.difumina} x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
      </defs>
      <g filter={url(g.difumina)}>
        {VELAS.map((v, i) => {
          const y = v.base - ALTO_VELA - 4;
          const s = i % 2 ? -1 : 1;
          return (
            <path key={v.x} className="dl-humo-hilo" pathLength="100" style={{ "--i": i }}
              d={`M${v.x} ${y} C ${v.x - 6 * s} ${y - 12}, ${v.x + 7 * s} ${y - 22}, ${v.x + s} ${y - 34} S ${v.x - 8 * s} ${y - 54}, ${v.x + 4 * s} ${y - 70}`}
              fill="none" stroke={url(g.humo)} strokeWidth="2.6" strokeLinecap="round" />
          );
        })}
      </g>
    </svg>
  );
}

// SDXL: dl_soplido
// Soplido dibujado: ráfagas de aire con remolinos que rodean el «Sopla las
// velas». Cada trazo lleva la clase dl-aire (el CSS lo hace fluir).
export function DlSoplido({ className = "" }) {
  const g = useIds("aire");
  const trazos = [
    { d: "M22 30 C 70 22 120 30 168 22 C 204 16 234 10 247 22 C 258 33 246 47 234 40 C 226 35 230 26 238 28", w: 2.6 },
    { d: "M262 88 C 214 94 168 86 118 94 C 82 100 50 106 34 96 C 22 87 30 73 42 77 C 50 81 46 89 40 89", w: 2.6 },
    { d: "M56 50 C 40 52 26 58 14 68", w: 1.8 },
    { d: "M226 64 C 244 62 258 56 268 47", w: 1.8 },
    { d: "M84 12 C 110 8 136 12 152 8", w: 1.4 },
  ];
  return (
    <svg className={className} viewBox="0 0 280 110" aria-hidden="true">
      <defs>
        <linearGradient id={g.aire} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c={T.caramelo} a=".45" />
          <Parada o=".5" c={T.tostado} a=".95" />
          <Parada o="1" c={T.caramelo} a=".6" />
        </linearGradient>
      </defs>
      {trazos.map((t, i) => (
        <g key={i}>
          <path d={t.d} fill="none" style={{ stroke: T.vainilla }} strokeWidth={t.w + 3} strokeLinecap="round" opacity=".7" />
          <path className="dl-aire" style={{ "--i": i }} d={t.d} pathLength="100" fill="none" stroke={url(g.aire)} strokeWidth={t.w} strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

// SDXL: dl_temporizador
// Temporizador de horno de esmalte caramelo: bisel dorado, esfera de crema
// con los segundos y un aro que gira (clase dl-dial, el giro llega por
// `giro`). Al centro queda un disco liso para los días (texto en el HTML).
export function DlTemporizador({ className = "", giro = 0 }) {
  const g = useIds("esmalte", "cara", "centro", "oro", "sombra", "grano");
  return (
    <svg className={className} viewBox="0 0 240 250" aria-hidden="true">
      <defs>
        <radialGradient id={g.esmalte} cx=".36" cy=".3" r=".8">
          <Parada o="0" c={mezcla(T.caramelo, "#fff", 55)} />
          <Parada o=".55" c={T.caramelo} />
          <Parada o="1" c={mezcla(T.tostado, T.caramelo, 80)} />
        </radialGradient>
        <radialGradient id={g.cara} cx=".45" cy=".4" r=".7">
          <Parada o="0" c="#FFFFFF" />
          <Parada o=".7" c={T.crema} />
          <Parada o="1" c={T.vainilla} />
        </radialGradient>
        <radialGradient id={g.centro} cx=".4" cy=".35" r=".8">
          <Parada o="0" c="#FFFFFF" />
          <Parada o="1" c={mezcla(T.vainilla, "#fff", 55)} />
        </radialGradient>
        <OroLineal id={g.oro} />
        <Sombra id={g.sombra} opacidad={0.4} />
        <Grano id={g.grano} fuerza={0.06} />
      </defs>
      <ellipse cx="120" cy="238" rx="96" ry="9" fill={url(g.sombra)} />
      <g filter={url(g.grano)}>
        {/* Patitas y cuerpo de esmalte. */}
        <path d="M58 212 L50 236 L74 236 L80 218 Z M182 212 L190 236 L166 236 L160 218 Z" fill={url(g.oro)} />
        <circle cx="120" cy="120" r="113" fill={url(g.esmalte)} />
        <path d="M30 86 C 44 46 82 18 126 16" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="5" strokeLinecap="round" />
        <circle cx="120" cy="120" r="99" fill="none" stroke={url(g.oro)} strokeWidth="6" />
        <circle cx="120" cy="120" r="95" fill={url(g.cara)} />
      </g>
      {/* Aro que gira con los segundos. */}
      <g className="dl-dial" style={{ transform: `rotate(${giro}deg)`, transformOrigin: "120px 120px" }}>
        {Array.from({ length: 60 }, (_, i) => (
          <line key={i} x1="120" y1={i % 5 ? 30 : 27} x2="120" y2="36" transform={`rotate(${i * 6} 120 120)`}
            style={{ stroke: i % 5 ? T.caramelo : T.tostado }} strokeWidth={i % 5 ? 1 : 2} strokeLinecap="round" />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <text key={i} x="120" y="54" textAnchor="middle" transform={`rotate(${i * 30} 120 120)`}
            style={{ fill: T.tinta, fontFamily: "var(--f-titulo)", fontSize: 13 }}>{i * 5}</text>
        ))}
      </g>
      <circle cx="120" cy="120" r="58" fill={url(g.centro)} />
      <circle cx="120" cy="120" r="58" fill="none" stroke={url(g.oro)} strokeWidth="1.6" />
      {/* Marcador fijo arriba. */}
      <path d="M120 30 L112 14 L128 14 Z" style={{ fill: T.tostado }} />
      <path d="M120 27 L115 17 L118 17 Z" fill="#fff" opacity=".45" />
    </svg>
  );
}

// SDXL: dl_macarons
// Pirámide de macarons surtidos sobre un platito dorado. Con `colores` usa
// esos tonos (en vestimenta muestra la paleta del código de vestir).
export function DlMacarons({ className = "", colores }) {
  const g = useIds("oro", "sombra", "grano", "m");
  const tonos = (colores && colores.length ? colores : SURTIDO);
  const puestos = [
    [110, 52, 20], [88, 80, 21], [132, 80, 21], [66, 108, 22], [110, 108, 22], [154, 108, 22],
  ];
  return (
    <svg className={className} viewBox="0 0 220 160" aria-hidden="true">
      <defs>
        <OroLineal id={g.oro} />
        <Sombra id={g.sombra} />
        <Grano id={g.grano} />
      </defs>
      <g filter={url(g.grano)}>
        <ellipse cx="110" cy="150" rx="92" ry="8" fill={url(g.sombra)} />
        <path d="M86 146 L134 146 L126 136 L94 136 Z" fill={url(g.oro)} />
        <path d="M24 128 A86 10 0 0 0 196 128 L196 133 A86 10 0 0 1 24 133 Z" fill={url(g.oro)} />
        <ellipse cx="110" cy="128" rx="86" ry="10" fill={url(g.oro)} />
        <ellipse cx="110" cy="127" rx="76" ry="7.5" fill="#FFF9EE" opacity=".55" />
        {puestos.map(([x, y, r], i) => (
          <Macaron key={i} x={x} y={y} r={r} color={tonos[i % tonos.length]} id={`${g.m}${i}`} />
        ))}
      </g>
    </svg>
  );
}

// SDXL: dl_copas
// Dos copas de champaña dorada que brindan, con burbujas y chispas de oro.
function Copa({ x, y, giro, g }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro})`}>
      <ellipse cx="0" cy="96" rx="26" ry="5" fill={url(g.sombra)} />
      <ellipse cx="0" cy="90" rx="22" ry="4.6" fill="#fff" fillOpacity=".55" stroke="#fff" strokeWidth="1" />
      <path d="M-22 90 A22 4.6 0 0 0 22 90" fill="none" style={{ stroke: T.tostado }} strokeOpacity=".35" strokeWidth=".8" />
      <path d="M-1.6 22 C -1.6 50 -2.2 70 -2.8 88 L 2.8 88 C 2.2 70 1.6 50 1.6 22 Z" fill="#fff" fillOpacity=".85" style={{ stroke: T.tostado }} strokeOpacity=".45" strokeWidth=".8" />
      <ellipse cx="0" cy="44" rx="3.2" ry="2.2" fill="#fff" fillOpacity=".85" />
      <path d="M-40 0 C -38 24 38 24 40 0 Z" fill="#fff" fillOpacity=".45" />
      <path d="M-36 6 C -33 22 33 22 36 6 Z" fill={url(g.champana)} />
      <ellipse cx="0" cy="6" rx="36" ry="5.4" fill={url(g.superficie)} />
      {[[-14, 13, 1.3], [-6, 16, 1], [4, 12, 1.4], [12, 15, 1], [20, 10, 1.1], [-22, 9, 1]].map(([bx, by, br], i) => (
        <circle key={i} cx={bx} cy={by} r={br} fill="#fff" fillOpacity=".8" />
      ))}
      <path d="M-40 0 C -38 24 38 24 40 0" fill="none" stroke="#fff" strokeOpacity=".95" strokeWidth="1.3" />
      <path d="M-40 0 C -38 24 38 24 40 0" fill="none" style={{ stroke: T.tostado }} strokeOpacity=".45" strokeWidth=".8" transform="translate(0 1)" />
      <ellipse cx="0" cy="0" rx="40" ry="6.4" fill="none" stroke={url(g.oro)} strokeWidth="1.8" />
      <path d="M-31 6 C -29 13 -22 17 -14 19" fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}
export function DlCopas({ className = "" }) {
  const g = useIds("champana", "superficie", "oro", "sombra", "grano", "chispa", "fresa", "fram", "arandano", "hoja");
  return (
    <svg className={className} viewBox="0 0 220 170" aria-hidden="true">
      <defs>
        <linearGradient id={g.champana} x1="0" y1="0" x2="0" y2="1">
          <Parada o="0" c="#F7E3A8" />
          <Parada o="1" c="#D7A04E" />
        </linearGradient>
        <radialGradient id={g.superficie} cx=".4" cy=".4" r=".8">
          <Parada o="0" c="#FFF8E6" />
          <Parada o="1" c="#F0D594" />
        </radialGradient>
        <OroLineal id={g.oro} />
        <Sombra id={g.sombra} />
        <radialGradient id={g.chispa}>
          <Parada o="0" c="#FFF6D8" />
          <Parada o="1" c={ORO.medio} a="0" />
        </radialGradient>
        {degradadosFrutos(g)}
        <Grano id={g.grano} fuerza={0.05} />
      </defs>
      <g filter={url(g.grano)}>
        <Copa x={78} y={52} giro={-9} g={g} />
        <Copa x={142} y={52} giro={9} g={g} />
        <Fresa x={46} y={50} s={0.9} giro={-40} g={g} />
        {[[110, 22, 7], [96, 10, 4], [126, 8, 4.5], [112, 2, 3]].map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r={r * 1.6} fill={url(g.chispa)} opacity=".7" />
            <path d={`M0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`} fill={ORO.claro} />
          </g>
        ))}
      </g>
    </svg>
  );
}

// SDXL: dl_tarta
// Porción de torta de capas (bizcocho de vainilla, crema y mermelada de
// frutos rojos) con glaseado de caramelo, frambuesas, arándano y un tenedor
// dorado sobre plato de porcelana.
export function DlTarta({ className = "" }) {
  const g = useIds("oro", "sombra", "grano", "glaseado", "cara1", "cara2", "plato", "fresa", "fram", "arandano", "hoja");
  const A = [58, 62], B = [152, 50], P = [76, 98];
  const H = 40;
  const capas = [
    [0, 5, T.caramelo],
    [5, 14, "#F2DDB4"],
    [14, 17, "#FFFAF2"],
    [17, 19.5, "#B5344A"],
    [19.5, 28, "#F2DDB4"],
    [28, 31, "#FFFAF2"],
    [31, 40, "#EDD3A6"],
  ];
  const cara = (p, q, d0, d1) => `M${p[0]} ${p[1] + d0} L${q[0]} ${q[1] + d0} L${q[0]} ${q[1] + d1} L${p[0]} ${p[1] + d1} Z`;
  return (
    <svg className={className} viewBox="0 0 220 170" aria-hidden="true">
      <defs>
        <OroLineal id={g.oro} />
        <Sombra id={g.sombra} />
        <Grano id={g.grano} fuerza={0.1} />
        <radialGradient id={g.glaseado} cx=".45" cy=".3" r=".9">
          <Parada o="0" c={mezcla(T.caramelo, "#fff", 50)} />
          <Parada o=".55" c={T.caramelo} />
          <Parada o="1" c={mezcla(T.tostado, T.caramelo, 60)} />
        </radialGradient>
        <linearGradient id={g.cara1} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c={T.tinta} a=".22" />
          <Parada o="1" c={T.tinta} a=".08" />
        </linearGradient>
        <linearGradient id={g.cara2} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c="#fff" a=".18" />
          <Parada o="1" c={T.tinta} a=".06" />
        </linearGradient>
        <radialGradient id={g.plato} cx=".45" cy=".4" r=".7">
          <Parada o="0" c="#FFFFFF" />
          <Parada o=".8" c="#F7F2EA" />
          <Parada o="1" c="#E5DCCF" />
        </radialGradient>
        {degradadosFrutos(g)}
      </defs>
      <g filter={url(g.grano)}>
        <ellipse cx="108" cy="150" rx="96" ry="12" fill={url(g.sombra)} />
        <path d="M18 132 A88 18 0 0 0 198 132 L198 136 A88 18 0 0 1 18 136 Z" fill="#E4DACC" />
        <ellipse cx="108" cy="132" rx="90" ry="18" fill={url(g.plato)} />
        <ellipse cx="108" cy="132" rx="78" ry="14.5" fill="none" stroke={url(g.oro)} strokeWidth="1.4" />
        <ellipse cx="104" cy="128" rx="62" ry="10" fill={url(g.sombra)} />

        {/* Tenedor dorado. */}
        <g transform="translate(192 124) rotate(-10)">
          <path d="M-2 0 L-1.4 -36 C -1.4 -40 -5 -42 -5 -48 L -5 -60 M-1.6 -48 L-1.6 -60 M1.6 -48 L1.6 -60 M5 -48 L5 -60" fill="none" stroke={ORO.oscuro} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M-5 -48 C -5 -42 -1.4 -40 -1.4 -36 L-2.2 4 Q 0 7 2.2 4 L 1.4 -36 C 1.4 -40 5 -42 5 -48 Z" fill={url(g.oro)} />
        </g>

        {/* Caras cortadas con las capas. */}
        {capas.map(([d0, d1, c], i) => <path key={`a${i}`} d={cara(A, P, d0, d1)} style={{ fill: c }} />)}
        <path d={cara(A, P, 0, H)} fill={url(g.cara1)} />
        {capas.map(([d0, d1, c], i) => <path key={`b${i}`} d={cara(P, B, d0, d1)} style={{ fill: c }} />)}
        <path d={cara(P, B, 0, H)} fill={url(g.cara2)} />
        {[[90, 108], [104, 106], [120, 104], [134, 110], [98, 124], [116, 124], [140, 122], [66, 108], [70, 124]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r=".9" fill="#C9A673" opacity=".7" />
        ))}
        {/* Gotas de caramelo por la cara cortada. */}
        <path d="M84 96 C 84 104 88 106 88 100 L 88 96 Z M120 82 C 120 92 125 94 125 86 L 125 82 Z" fill={url(g.glaseado)} />

        {/* Cara de arriba glaseada, con rosetas y frutos rojos. */}
        <path d={`M${A[0]} ${A[1]} L${P[0]} ${P[1]} L${B[0]} ${B[1]} Q 112 30 ${A[0]} ${A[1]} Z`} fill={url(g.glaseado)} />
        <path d={`M${A[0] + 6} ${A[1] - 2} Q 100 40 ${B[0] - 14} ${B[1] - 4}`} fill="none" stroke="#FFF4DE" strokeOpacity=".55" strokeWidth="1.4" strokeLinecap="round" />
        {[[66, 58], [80, 51], [96, 46], [112, 44], [128, 44], [142, 47]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r="5.2" fill="#FFFAF2" />
            <path d="M-3.5 .5 C -3.5 -4 3.5 -4 3.5 0 C 3.5 3 -1.5 3.5 -1.5 0" fill="none" style={{ stroke: T.vainilla }} strokeWidth="1.1" />
          </g>
        ))}
        <Frambuesa x={98} y={66} s={0.95} g={g} />
        <Arandano x={112} y={70} r={4.4} g={g} />
        <path d="M122 72 l7 -3 l-2 6 z" fill={url(g.oro)} />
      </g>
    </svg>
  );
}

// SDXL: dl_cajita
// Cajita de pastelería de cartón crema a rayas caramelo, atada con cordel
// de panadero y una estampilla dorada (ícono de regalos).
export function DlCajita({ className = "" }) {
  const g = useIds("oro", "sombra", "grano", "frente", "lado", "tapa", "rayas");
  return (
    <svg className={className} viewBox="0 0 220 170" aria-hidden="true">
      <defs>
        <OroLineal id={g.oro} />
        <Sombra id={g.sombra} />
        <Grano id={g.grano} />
        <linearGradient id={g.frente} x1="0" y1="0" x2="1" y2="1">
          <Parada o="0" c="#FFFFFF" />
          <Parada o="1" c={T.vainilla} />
        </linearGradient>
        <linearGradient id={g.lado} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c={mezcla(T.vainilla, T.caramelo, 70)} />
          <Parada o="1" c={mezcla(T.vainilla, T.caramelo, 50)} />
        </linearGradient>
        <linearGradient id={g.tapa} x1="0" y1="0" x2="1" y2="1">
          <Parada o="0" c="#fff" />
          <Parada o="1" c={mezcla(T.vainilla, "#fff", 60)} />
        </linearGradient>
        <pattern id={g.rayas} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="6" height="12" style={{ fill: T.caramelo }} fillOpacity=".28" />
        </pattern>
      </defs>
      <g filter={url(g.grano)}>
        <ellipse cx="112" cy="152" rx="92" ry="10" fill={url(g.sombra)} />
        <path d="M44 72 L134 72 L134 146 L44 146 Z" fill={url(g.frente)} />
        <path d="M44 72 L134 72 L134 146 L44 146 Z" fill={url(g.rayas)} />
        <path d="M134 72 L172 56 L172 128 L134 146 Z" fill={url(g.lado)} />
        <path d="M134 72 L172 56 L172 128 L134 146 Z" fill={url(g.rayas)} opacity=".6" />
        <path d="M40 70 L136 70 L136 84 L40 84 Z" style={{ fill: T.caramelo }} />
        <path d="M40 70 L136 70 L136 73 L40 73 Z" fill="#fff" fillOpacity=".35" />
        <path d="M136 70 L176 53 L176 67 L136 84 Z" style={{ fill: mezcla(T.caramelo, T.tostado, 70) }} />
        <path d="M40 70 L80 53 L176 53 L136 70 Z" fill={url(g.tapa)} />
        {/* Cordel de panadero: rayado caramelo y crema. */}
        {["M89 70 L89 146", "M156 60 L156 135", "M89 70 L132 53", "M58 62 L156 62"].map((d, i) => (
          <g key={i}>
            <path d={d} style={{ stroke: T.tostado }} strokeWidth="2.4" strokeLinecap="round" />
            <path d={d} stroke="#FFF8EC" strokeWidth="2.4" strokeDasharray="2.4 2.4" />
          </g>
        ))}
        <g transform="translate(108 62)" fill="none" strokeLinecap="round">
          <path d="M0 0 C -8 -12 -20 -8 -12 0 C -8 3 -3 2 0 0 C 8 -12 20 -8 12 0 C 8 3 3 2 0 0 M0 0 C -4 8 -8 14 -12 18 M0 0 C 3 8 8 14 13 17" style={{ stroke: T.tostado }} strokeWidth="2" />
        </g>
        <g transform="translate(64 118)">
          <circle r="11" fill={url(g.oro)} />
          <circle r="8" fill="none" stroke="#FFF6DA" strokeOpacity=".8" strokeWidth=".8" />
          <path d="M-4 2 C -4 -4 4 -4 4 2 M-3 2 L3 2" fill="none" stroke={ORO.sombra} strokeWidth="1" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

// SDXL: dl_caja_cierre
// Caja de pastelería abierta cuya tapa baja y se ata con cordel de panadero
// (cierre de la página). La tapa lleva la clase dl-caja-tapa, el cordel
// dl-cordel y el nudo dl-nudo; el CSS los anima al aparecer. `sello` es el
// texto de la estampilla del frente.
export function DlCajaCierre({ className = "", sello = "" }) {
  const g = useIds("oro", "sombra", "grano", "frente", "lado", "tapa", "rayas", "interior", "fresa", "fram", "arandano", "hoja");
  const cordel = ["M109 104 L109 186", "M195 95 L195 176", "M109 90 L155 71", "M69 80.5 L195 80.5"];
  return (
    <svg className={className} viewBox="0 0 260 210" aria-hidden="true">
      <defs>
        <OroLineal id={g.oro} />
        <Sombra id={g.sombra} opacidad={0.4} />
        <Grano id={g.grano} />
        <linearGradient id={g.frente} x1="0" y1="0" x2="1" y2="1">
          <Parada o="0" c="#FFFFFF" />
          <Parada o="1" c={T.vainilla} />
        </linearGradient>
        <linearGradient id={g.lado} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c={mezcla(T.vainilla, T.caramelo, 72)} />
          <Parada o="1" c={mezcla(T.vainilla, T.caramelo, 52)} />
        </linearGradient>
        <linearGradient id={g.tapa} x1="0" y1="0" x2="1" y2="1">
          <Parada o="0" c="#fff" />
          <Parada o="1" c={mezcla(T.vainilla, "#fff", 55)} />
        </linearGradient>
        <linearGradient id={g.interior} x1="0" y1="0" x2="0" y2="1">
          <Parada o="0" c={mezcla(T.caramelo, T.vainilla, 45)} />
          <Parada o="1" c={T.vainilla} />
        </linearGradient>
        <pattern id={g.rayas} width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="7" height="14" fill="#FFF8EC" fillOpacity=".9" />
        </pattern>
        {degradadosFrutos(g)}
      </defs>
      <ellipse cx="134" cy="192" rx="112" ry="12" fill={url(g.sombra)} />
      <g filter={url(g.grano)}>
        {/* Boca abierta de la caja con un pedacito de torta adentro. */}
        <path d="M50 92 L94 74 L214 74 L170 92 Z" fill={url(g.interior)} />
        <path d="M100 88 L148 88 L148 83 Q 124 75 100 83 Z" style={{ fill: T.caramelo }} />
        <Fresa x={124} y={83} s={0.6} giro={10} g={g} />
        <path d="M50 92 L170 92 L170 186 L50 186 Z" fill={url(g.frente)} />
        <path d="M170 92 L214 74 L214 168 L170 186 Z" fill={url(g.lado)} />
        <path d="M50 92 L170 92" stroke="#fff" strokeOpacity=".8" strokeWidth="1" />
        <g transform="translate(76 150)">
          <circle r="17" fill={url(g.oro)} />
          <circle r="13.5" fill="none" stroke="#FFF6DA" strokeOpacity=".85" strokeWidth=".8" strokeDasharray="1.5 1.8" />
          {sello && (
            <text y="5" textAnchor="middle" style={{ fill: ORO.sombra, fontFamily: "var(--f-titulo)", fontSize: 15 }}>{sello}</text>
          )}
        </g>
      </g>
      {/* Tapa que baja. */}
      <g className="dl-caja-tapa">
        <path d="M46 90 L172 90 L172 104 L46 104 Z" style={{ fill: T.caramelo }} />
        <path d="M46 90 L172 90 L172 104 L46 104 Z" fill={url(g.rayas)} />
        <path d="M172 90 L218 71 L218 85 L172 104 Z" style={{ fill: mezcla(T.caramelo, T.tostado, 70) }} />
        <path d="M172 90 L218 71 L218 85 L172 104 Z" fill={url(g.rayas)} opacity=".55" />
        <path d="M46 90 L92 71 L218 71 L172 90 Z" fill={url(g.tapa)} />
        <path d="M46 104 L172 104" style={{ stroke: T.tostado }} strokeOpacity=".35" strokeWidth="1" />
      </g>
      {/* Cordel de panadero y nudo. */}
      <g className="dl-cordel" fill="none" strokeLinecap="round">
        {cordel.map((d, i) => (
          <g key={i}>
            <path d={d} pathLength="100" className="dl-cordel-base" style={{ stroke: T.tostado, "--i": i }} strokeWidth="2.6" />
            <path d={d} className="dl-cordel-raya" stroke="#FFF8EC" strokeWidth="2.6" strokeDasharray="2.6 2.6" />
          </g>
        ))}
      </g>
      <g transform="translate(132 80.5)"><g className="dl-nudo" fill="none" strokeLinecap="round">
        <path d="M0 0 C -9 -14 -24 -9 -14 0 C -9 3 -4 2 0 0 C 9 -14 24 -9 14 0 C 9 3 4 2 0 0 M0 0 C -4 8 -9 14 -14 18 M0 0 C 3 8 9 14 15 17"
          style={{ stroke: T.tostado }} strokeWidth="2.2" />
        <circle r="2.6" style={{ fill: T.tostado }} />
      </g></g>
    </svg>
  );
}

// SDXL: dl_batidor
// Batidor de globo de acero con mango caramelo y una nube de crema.
export function DlBatidor({ className = "" }) {
  const g = useIds("acero", "mango");
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={g.acero} x1="0" y1="0" x2="1" y2="1">
          <Parada o="0" c="#E9EDF0" />
          <Parada o=".5" c="#A3AAB0" />
          <Parada o="1" c="#6E757B" />
        </linearGradient>
        <linearGradient id={g.mango} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c={mezcla(T.caramelo, "#fff", 70)} />
          <Parada o=".5" c={T.caramelo} />
          <Parada o="1" c={T.tostado} />
        </linearGradient>
      </defs>
      <g fill="none" stroke={url(g.acero)} strokeWidth="1.4">
        <path d="M27 27 C 14 22 5 11 11 5 C 17 0 29 13 27 27" />
        <path d="M27 27 C 17 20 11 9 15 5.5 C 19 2 28 15 27 27" />
        <path d="M27 27 C 10 25 3 14 7 8 C 11 3 25 16 27 27" />
        <path d="M27 27 C 21 18 18 7 21 5 C 25 4 28 16 27 27" />
      </g>
      <path d="M8 9 C 6 6 9 3 12 5 C 14 3 18 5 17 8 C 19 10 16 13 13 12 C 11 14 7 13 8 9 Z" fill="#FFFDF8" stroke="#E8DCC7" strokeWidth=".6" />
      <path d="M26 26 L38 40" stroke={url(g.mango)} strokeWidth="5.2" strokeLinecap="round" />
      <path d="M26.5 26.5 L37 39" stroke="#fff" strokeOpacity=".45" strokeWidth="1" strokeLinecap="round" transform="translate(-1 .8)" />
      <circle cx="38" cy="40" r="1.2" fill="#fff" opacity=".6" />
    </svg>
  );
}

// ---------- Ornamentos (leen el tema) ----------

// Toldo festoneado de pastelería, a rayas caramelo y crema, con barra dorada.
export function DlToldo({ className = "" }) {
  const g = useIds("oro", "pliegue", "sombra", "grano");
  const ancho = 30;
  const n = 14;
  return (
    <svg className={className} viewBox="0 0 420 86" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <defs>
        <OroLineal id={g.oro} vertical />
        <linearGradient id={g.pliegue} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c={T.tinta} a=".14" />
          <Parada o=".4" c="#fff" a=".22" />
          <Parada o="1" c={T.tinta} a=".1" />
        </linearGradient>
        <linearGradient id={g.sombra} x1="0" y1="0" x2="0" y2="1">
          <Parada o="0" c="#fff" a=".25" />
          <Parada o="1" c={T.tostado} a=".22" />
        </linearGradient>
        <Grano id={g.grano} fuerza={0.06} />
      </defs>
      <g filter={url(g.grano)}>
        {Array.from({ length: n }, (_, i) => {
          const x = i * ancho;
          const d = `M${x} 8 H${x + ancho} V58 A15 15 0 0 1 ${x} 58 Z`;
          return (
            <g key={i}>
              <path d={d} transform="translate(0 3)" style={{ fill: T.tostado }} opacity=".16" />
              <path d={d} style={{ fill: i % 2 ? T.crema : T.caramelo }} />
              <path d={d} fill={url(g.pliegue)} />
              <path d={d} fill={url(g.sombra)} />
              <path d={`M${x + ancho} 58 A15 15 0 0 1 ${x} 58`} fill="none" style={{ stroke: i % 2 ? T.caramelo : T.vainilla }} strokeWidth="1.2" opacity=".9" />
            </g>
          );
        })}
        <rect x="0" y="2" width="420" height="9" rx="4.5" fill={url(g.oro)} />
      </g>
    </svg>
  );
}

// Silueta de etiqueta colgante (se estira al ancho del texto; el trazo no).
export function DlEtiqueta({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">
      <path d="M22 2 H194 Q198 2 198 6 V74 Q198 78 194 78 H22 L2 40 Z" style={{ fill: T.crema }} stroke={ORO.medio} strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
      <path d="M25 6 H192 Q194 6 194 8 V72 Q194 74 192 74 H25 L7 40 Z" fill="none" stroke={ORO.claro} strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Cordón dorado de la etiqueta.
export function DlCordon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 40 60" aria-hidden="true">
      <path d="M20 0 C 22 18 8 28 14 46 C 16 52 20 56 24 58" fill="none" stroke={ORO.medio} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M20 0 C 22 18 8 28 14 46" fill="none" stroke={ORO.luz} strokeWidth=".5" strokeLinecap="round" transform="translate(.6 0)" />
    </svg>
  );
}

// Filete dorado con un macaron diminuto al centro.
export function DlFilete({ className = "" }) {
  const g = useIds("m");
  return (
    <svg className={className} viewBox="0 0 200 24" aria-hidden="true">
      <path d="M8 12 H82 M118 12 H192" stroke={ORO.medio} strokeWidth="1.2" />
      <path d="M8 11.5 H82 M118 11.5 H192" stroke={ORO.luz} strokeWidth=".4" />
      <circle cx="6" cy="12" r="2" fill={ORO.medio} />
      <circle cx="194" cy="12" r="2" fill={ORO.medio} />
      <Macaron x={100} y={13} r={9} color={T.caramelo} id={g.m} />
    </svg>
  );
}

// Macaron suelto y pequeño (viñetas del programa).
export function DlMacaronSuelto({ className = "", color = T.caramelo }) {
  const g = useIds("m");
  return (
    <svg className={className} viewBox="0 0 40 30" aria-hidden="true">
      <Macaron x={20} y={17} r={14} color={color} id={g.m} />
    </svg>
  );
}

export { SURTIDO };
