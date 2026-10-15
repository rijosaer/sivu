import { useId } from "react";

// Arte de «Dulce 30», todo en SVG semi-realista: capas de degradados, sombras
// suaves, curvas Bézier y un grano fino para que no se vea plano. Cada pieza
// con nombre lleva encima su nombre SDXL para poder cambiarla luego por un
// .webp pintado.
// - Los colores de marca salen del tema (rosa, rosa claro, rosa oscuro,
//   blanco de tarjetas, lila) con style={{…}}, porque los atributos de
//   presentación del SVG no entienden var().
// - Los colores propios del objeto son fijos: el oro (metal), el mármol
//   (vetas grises), el bizcocho de vainilla, las hojas verdes y el fuego.
// - Los ids de degradados y filtros son únicos por instancia (useId), porque
//   las piezas se repiten en la página.

const T = {
  rosa: "rgb(var(--color-gold))",
  claro: "rgb(var(--color-gold-light))",
  oscuro: "rgb(var(--color-gold-dark))",
  papel: "rgb(var(--color-paper))",
  blanco: "rgb(var(--color-marble))",
  lila: "rgb(var(--color-seal))",
  tinta: "rgb(var(--color-ink))",
};
const mezcla = (a, b, p) => `color-mix(in srgb, ${a} ${p}%, ${b})`;
const ORO = { luz: "#FBF0CF", claro: "#E9CF8E", medio: "#C9A15A", oscuro: "#97733A", sombra: "#6E5226" };

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
      <feColorMatrix in="ruido" values={`0 0 0 0 .35  0 0 0 0 .22  0 0 0 0 .28  0 0 0 ${fuerza} 0`} result="tinte" />
      <feComposite in="tinte" in2="SourceGraphic" operator="in" result="grano" />
      <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="grano" /></feMerge>
    </filter>
  );
}

// Oro metálico horizontal (bandas, aros, bordes).
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
      <Parada o="0" c={T.oscuro} a={opacidad} />
      <Parada o=".6" c={T.oscuro} a={opacidad * 0.35} />
      <Parada o="1" c={T.oscuro} a="0" />
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

// Rosa de jardín vista desde arriba: hojas, pétalos de afuera hacia adentro y
// un remolino al centro. Usa los degradados de la pieza que la contiene.
const PETALO = "M0 0 C -11 -3 -13 -15 -7 -22 C -3 -26 3 -26 7 -22 C 13 -15 11 -3 0 0 Z";
function Rosa({ x, y, s = 1, g, giro = 0, hojas = true }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${s})`}>
      {hojas && (
        <g>
          <path d="M-6 6 C -22 8 -34 2 -40 -6 C -30 -10 -16 -8 -6 2 Z" fill={url(g.hoja)} />
          <path d="M-8 4 C -18 3 -28 -1 -37 -5" fill="none" stroke="#5E7A55" strokeWidth=".7" opacity=".7" />
          <path d="M8 6 C 22 12 34 10 40 2 C 30 -4 16 -2 6 2 Z" fill={url(g.hoja)} />
          <path d="M9 5 C 19 7 29 6 37 2" fill="none" stroke="#5E7A55" strokeWidth=".7" opacity=".7" />
        </g>
      )}
      <ellipse cx="0" cy="3" rx="19" ry="16" fill={url(g.sombraRosa)} />
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d={PETALO} transform={`rotate(${a + 18}) scale(1.02)`} fill={url(g.petalo)} />
      ))}
      {[36, 126, 216, 306].map((a) => (
        <path key={a} d={PETALO} transform={`rotate(${a}) scale(.72)`} fill={url(g.petalo)} />
      ))}
      <ellipse cx="0" cy="0" rx="8.5" ry="7.5" style={{ fill: mezcla(T.oscuro, T.rosa, 55) }} />
      <path d="M-6.5 -.5 C -6.5 -7 6.5 -7 6.5 -.5 C 6.5 5 -3.5 5.5 -3.5 0 C -3.5 -3.4 2.2 -3.4 2.2 0"
        style={{ fill: mezcla(T.rosa, T.claro, 60), stroke: mezcla(T.oscuro, T.rosa, 70) }} strokeWidth=".9" />
      <path d="M-15 -8 C -12 -14 -6 -17 0 -17" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}

function degradadosRosa(g) {
  return (
    <>
      <radialGradient id={g.petalo} cx=".5" cy=".95" r="1">
        <Parada o="0" c={mezcla(T.oscuro, T.rosa, 60)} />
        <Parada o=".45" c={T.rosa} />
        <Parada o=".85" c={mezcla(T.claro, "#fff", 70)} />
        <Parada o="1" c="#fff" />
      </radialGradient>
      <radialGradient id={g.sombraRosa}>
        <Parada o="0" c={T.tinta} a=".35" />
        <Parada o="1" c={T.tinta} a="0" />
      </radialGradient>
      <linearGradient id={g.hoja} x1="0" y1="0" x2="1" y2="1">
        <Parada o="0" c="#A9BE95" />
        <Parada o=".55" c="#7E9A6E" />
        <Parada o="1" c="#5F7B54" />
      </linearGradient>
    </>
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
      <ellipse cx="0" cy={0} rx={r * 0.9} ry={r * 0.2} fill="#FFF8F2" />
      <ellipse cx="0" cy={1.2 * k} rx={r * 0.9} ry={r * 0.16} style={{ fill: mezcla(color, "#FFF8F2", 25) }} />
      <path d={pie(-4.5 * k)} style={{ fill: mezcla(color, "#fff", 80) }} />
      <path d={`M${-r} ${-3 * k} C ${-r} ${-r * 0.95}, ${r} ${-r * 0.95}, ${r} ${-3 * k} C ${r * 0.6} ${-0.5 * k}, ${-r * 0.6} ${-0.5 * k}, ${-r} ${-3 * k} Z`}
        fill={`url(#${id}c)`} />
      <path d={`M${-r * 0.55} ${-r * 0.45} C ${-r * 0.35} ${-r * 0.66}, ${r * 0.05} ${-r * 0.72}, ${r * 0.25} ${-r * 0.68}`}
        fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth={1.6 * k} strokeLinecap="round" />
    </g>
  );
}

// Perla con volumen (bordes de los pisos, cajita).
function Perla({ x, y, r, g }) {
  return <circle cx={x} cy={y} r={r} fill={url(g.perla)} />;
}

// Piso de pastel: cilindro con degradado, tapa glaseada y las decoraciones
// que reciba como hijos.
function Piso({ cx, arriba, abajo, rx, ry, g }) {
  const cuerpo = `M${cx - rx} ${arriba} L${cx - rx} ${abajo} A${rx} ${ry} 0 0 0 ${cx + rx} ${abajo} L${cx + rx} ${arriba} Z`;
  return (
    <g>
      <path d={cuerpo} fill={url(g.cil)} />
      <path d={cuerpo} fill={url(g.vertical)} />
      <ellipse cx={cx} cy={arriba} rx={rx} ry={ry} fill={url(g.tapa)} />
      <path d={`M${cx - rx + 2} ${arriba + 1} A${rx - 2} ${ry - 1} 0 0 0 ${cx + rx - 2} ${arriba + 1}`} fill="none"
        stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" />
    </g>
  );
}

// SDXL: dl_pastel
// Pastel de tres pisos en rosa sobre un pedestal de mármol blanco con aros
// dorados, con rosas, macarons y velas encendidas. Las llamas llevan la
// clase dl-llama (el CSS las hace titilar y las apaga al soplar). Con
// `topper` dibuja los palillos dorados donde va la edad (texto en el HTML).
export const VELAS = [
  { x: 110, base: 116 }, { x: 124, base: 113 }, { x: 196, base: 113 }, { x: 210, base: 116 },
];
const ALTO_VELA = 34;
export function DlPastel({ className = "", topper = false }) {
  const g = useIds("cil", "vertical", "tapa", "perla", "marmol", "marmolPie", "oro", "oroV", "sombra", "sombraPiso",
    "grano", "petalo", "sombraRosa", "hoja", "llama", "halo", "vela", "c2", "m1", "m2", "m3");
  const p1 = { cx: 160, arriba: 252, abajo: 330, rx: 110, ry: 15 };
  const p2 = { cx: 160, arriba: 182, abajo: 254, rx: 80, ry: 12 };
  const p3 = { cx: 160, arriba: 114, abajo: 184, rx: 54, ry: 9 };
  const cuerpo2 = `M${80} ${p2.arriba} L80 ${p2.abajo} A80 12 0 0 0 240 ${p2.abajo} L240 ${p2.arriba} Z`;

  // Guirnaldas del piso de abajo.
  const uniones = arcoFrente(160, p1.arriba + 18, 110, 15, 7, 0.08);
  const guirnaldas = uniones.slice(0, -1).map(([x1, y1], i) => {
    const [x2, y2] = uniones[i + 1];
    return `M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + 20} ${x2} ${y2}`;
  });

  // Capitoné del piso del medio: dos familias de diagonales y perlas donde se cruzan.
  const paso = 18;
  const alto = p2.abajo - p2.arriba + 14;
  const diagonales = [];
  const cruces = [];
  for (let a = -40; a <= 340; a += paso) {
    diagonales.push(`M${a} ${p2.arriba} l${alto} ${alto}`, `M${a} ${p2.arriba} l${-alto} ${alto}`);
  }
  for (let a = -40; a <= 340; a += paso) {
    for (let b = a + paso; b <= a + 2 * alto; b += paso) {
      const x = (a + b) / 2;
      const y = p2.arriba + (b - a) / 2;
      if (x > 82 && x < 238 && y > p2.arriba + 8 && y < p2.abajo - 2) cruces.push([x, y]);
    }
  }

  return (
    <svg className={className} viewBox="0 0 320 440" aria-hidden="true">
      <defs>
        <linearGradient id={g.cil} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c={mezcla(T.oscuro, T.rosa, 55)} />
          <Parada o=".14" c={T.rosa} />
          <Parada o=".38" c={mezcla(T.claro, "#fff", 75)} />
          <Parada o=".5" c={T.claro} />
          <Parada o=".8" c={T.rosa} />
          <Parada o="1" c={mezcla(T.oscuro, T.rosa, 70)} />
        </linearGradient>
        <linearGradient id={g.vertical} x1="0" y1="0" x2="0" y2="1">
          <Parada o="0" c="#fff" a=".18" />
          <Parada o=".3" c="#fff" a="0" />
          <Parada o="1" c={T.oscuro} a=".16" />
        </linearGradient>
        <radialGradient id={g.tapa} cx=".42" cy=".35" r=".75">
          <Parada o="0" c="#fff" />
          <Parada o=".45" c={mezcla(T.claro, "#fff", 70)} />
          <Parada o="1" c={mezcla(T.rosa, T.claro, 60)} />
        </radialGradient>
        <radialGradient id={g.perla} cx=".35" cy=".3" r=".75">
          <Parada o="0" c="#fff" />
          <Parada o=".55" c="#FBF4F1" />
          <Parada o="1" c={mezcla(T.oscuro, "#EBDDE0", 25)} />
        </radialGradient>
        <linearGradient id={g.marmol} x1="0" y1="0" x2="1" y2="1">
          <Parada o="0" c="#FFFFFF" />
          <Parada o=".5" c="#F2EDEF" />
          <Parada o="1" c="#FFFFFF" />
        </linearGradient>
        <linearGradient id={g.marmolPie} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c="#DCD3D6" />
          <Parada o=".35" c="#FFFFFF" />
          <Parada o=".7" c="#F1ECEE" />
          <Parada o="1" c="#CFC5C9" />
        </linearGradient>
        <OroLineal id={g.oro} />
        <OroLineal id={g.oroV} vertical />
        <Sombra id={g.sombra} opacidad={0.35} />
        <Sombra id={g.sombraPiso} opacidad={0.4} />
        <linearGradient id={g.vela} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c={mezcla(T.lila, T.claro, 60)} />
          <Parada o=".4" c="#fff" />
          <Parada o="1" c={mezcla(T.lila, T.claro, 75)} />
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
        {degradadosRosa(g)}
        <clipPath id={g.c2}><path d={cuerpo2} /></clipPath>
        <Grano id={g.grano} />
      </defs>

      <g filter={url(g.grano)}>
        {/* Pedestal de mármol: pie, tallo con aros dorados y plato. */}
        <ellipse cx="160" cy="426" rx="104" ry="10" fill={url(g.sombra)} />
        <path d="M100 418 A60 9 0 0 0 220 418 L220 412 A60 9 0 0 1 100 412 Z" fill={url(g.oro)} />
        <ellipse cx="160" cy="412" rx="60" ry="9" fill={url(g.marmolPie)} />
        <path d="M147 352 L147 384 C147 396 124 401 110 410 C130 416 190 416 210 410 C196 401 173 396 173 384 L173 352 Z" fill={url(g.marmolPie)} />
        <path d="M150 360 C 156 372 152 386 160 398 M166 356 C 170 366 164 374 168 384" fill="none" stroke="#B9AEB4" strokeWidth=".7" opacity=".6" />
        <rect x="143" y="383" width="34" height="6" rx="3" fill={url(g.oro)} />
        <rect x="141" y="350" width="38" height="8" rx="3" fill={url(g.oro)} />
        <path d="M20 336 A140 18 0 0 0 300 336 L300 344 A140 18 0 0 1 20 344 Z" fill={url(g.oro)} />
        <ellipse cx="160" cy="336" rx="140" ry="18" fill={url(g.marmol)} />
        <path d="M34 334 C 60 340 70 330 96 338 M226 344 C 246 336 262 344 286 336 M60 346 C 80 342 92 350 112 346" fill="none" stroke="#B9AEB4" strokeWidth=".7" opacity=".55" />
        <ellipse cx="160" cy="333" rx="122" ry="14" fill={url(g.sombraPiso)} />

        {/* Piso de abajo: guirnaldas de glaseado y perlas. */}
        <Piso {...p1} g={g} />
        <g>
          {guirnaldas.map((d, i) => (
            <g key={i}>
              <path d={d} fill="none" style={{ stroke: T.oscuro }} strokeOpacity=".28" strokeWidth="4.2" strokeLinecap="round" transform="translate(0 1.6)" />
              <path d={d} fill="none" stroke="#FFFBFC" strokeWidth="3.4" strokeLinecap="round" />
            </g>
          ))}
          {uniones.map(([x, y], i) => (
            <g key={i}>
              <Perla x={x} y={y - 1} r={3.4} g={g} />
              <Perla x={x - 3} y={y + 4} r={2.2} g={g} />
              <Perla x={x + 3} y={y + 4} r={2.2} g={g} />
            </g>
          ))}
        </g>
        {arcoFrente(160, 330, 110, 15, 30, 0.03).map(([x, y], i) => <Perla key={i} x={x} y={y - 2} r={3.6} g={g} />)}

        {/* Piso del medio: capitoné con perlas en los cruces. */}
        <ellipse cx="160" cy={p2.abajo + 2} rx="88" ry="15" fill={url(g.sombraPiso)} />
        <Piso {...p2} g={g} />
        <g clipPath={url(g.c2)}>
          {diagonales.map((d, i) => (
            <g key={i}>
              <path d={d} style={{ stroke: T.oscuro }} strokeOpacity=".2" strokeWidth=".9" />
              <path d={d} stroke="#fff" strokeOpacity=".45" strokeWidth=".7" transform="translate(1 0)" />
            </g>
          ))}
          {cruces.map(([x, y], i) => <Perla key={i} x={x} y={y} r={1.9} g={g} />)}
        </g>
        {arcoFrente(160, p2.abajo, 80, 12, 24, 0.03).map(([x, y], i) => <Perla key={i} x={x} y={y - 2} r={3} g={g} />)}

        {/* Piso de arriba: cinta dorada y perlas en el borde. */}
        <ellipse cx="160" cy={p3.abajo + 2} rx="62" ry="12" fill={url(g.sombraPiso)} />
        <Piso {...p3} g={g} />
        <path d={`M106 ${p3.abajo - 10} A54 9 0 0 0 214 ${p3.abajo - 10} L214 ${p3.abajo} A54 9 0 0 1 106 ${p3.abajo} Z`} fill={url(g.oro)} />
        {arcoFrente(160, p3.arriba + 3, 54, 9, 16, 0.05).map(([x, y], i) => <Perla key={i} x={x} y={y} r={2.3} g={g} />)}

        {/* Palillos dorados del topper. */}
        {topper && (
          <g>
            <path d="M151 116 L151 76 M169 116 L169 76" stroke={url(g.oroV)} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M151 116 L151 76 M169 116 L169 76" stroke={ORO.oscuro} strokeWidth=".5" opacity=".6" transform="translate(.7 0)" />
          </g>
        )}

        {/* Rosas en cascada y macarons sobre el plato. */}
        <Rosa x={110} y={186} s={0.78} g={g} giro={-20} />
        <Rosa x={93} y={194} s={0.5} g={g} giro={30} hojas={false} />
        <Rosa x={128} y={196} s={0.42} g={g} giro={10} hojas={false} />
        <Rosa x={226} y={258} s={0.86} g={g} giro={15} />
        <Rosa x={248} y={264} s={0.52} g={g} giro={-40} hojas={false} />
        <Rosa x={270} y={340} s={0.9} g={g} giro={-10} />
        <Rosa x={248} y={348} s={0.55} g={g} giro={40} hojas={false} />
        <Macaron x={58} y={334} r={15} color={T.lila} id={g.m1} />
        <Macaron x={86} y={344} r={15} color={T.rosa} id={g.m2} />
        <Macaron x={68} y={318} r={13} color="#F3E3C6" id={g.m3} />
      </g>

      {/* Velas con llama (fuera del grano para que la luz quede limpia). */}
      {VELAS.map((v, i) => {
        const tope = v.base - ALTO_VELA;
        return (
          <g key={v.x}>
            <rect x={v.x - 3} y={tope} width="6" height={ALTO_VELA} rx="2" fill={url(g.vela)} />
            <path d={`M${v.x - 3} ${tope + 8} l6 -4 M${v.x - 3} ${tope + 16} l6 -4 M${v.x - 3} ${tope + 24} l6 -4 M${v.x - 3} ${tope + 32} l6 -4`}
              style={{ stroke: T.oscuro }} strokeOpacity=".35" strokeWidth="1" />
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
          <Parada o="0" c="#8E8088" a=".65" />
          <Parada o=".5" c="#B8AEB3" a=".45" />
          <Parada o="1" c="#D9D2D6" a="0" />
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

// SDXL: dl_macarons
// Pirámide de macarons pastel sobre un platito dorado. Con `colores` usa
// esos tonos (en vestimenta muestra la paleta del código de vestir).
export function DlMacarons({ className = "", colores }) {
  const g = useIds("oro", "sombra", "grano", "m");
  const base = [T.rosa, T.lila, "#F3E3C6", "#CFE3CF", mezcla(T.claro, T.rosa, 40), "#F6D5C4"];
  const tonos = (colores && colores.length ? colores : base);
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
// Dos copas de champaña rosada que brindan, con burbujas y chispas doradas.
function Copa({ x, y, giro, g }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro})`}>
      <ellipse cx="0" cy="96" rx="26" ry="5" fill={url(g.sombra)} />
      <ellipse cx="0" cy="90" rx="22" ry="4.6" fill="#fff" fillOpacity=".55" stroke="#fff" strokeWidth="1" />
      <path d="M-22 90 A22 4.6 0 0 0 22 90" fill="none" style={{ stroke: T.oscuro }} strokeOpacity=".35" strokeWidth=".8" />
      <path d="M-1.6 22 C -1.6 50 -2.2 70 -2.8 88 L 2.8 88 C 2.2 70 1.6 50 1.6 22 Z" fill="#fff" fillOpacity=".75" style={{ stroke: T.oscuro }} strokeOpacity=".25" strokeWidth=".6" />
      <ellipse cx="0" cy="44" rx="3.2" ry="2.2" fill="#fff" fillOpacity=".85" />
      {/* Copa vacía (vidrio) y champaña. */}
      <path d="M-40 0 C -38 24 38 24 40 0 Z" fill="#fff" fillOpacity=".28" />
      <path d="M-36 6 C -33 22 33 22 36 6 Z" fill={url(g.champana)} />
      <ellipse cx="0" cy="6" rx="36" ry="5.4" fill={url(g.superficie)} />
      {[[-14, 13, 1.3], [-6, 16, 1], [4, 12, 1.4], [12, 15, 1], [20, 10, 1.1], [-22, 9, 1]].map(([bx, by, br], i) => (
        <circle key={i} cx={bx} cy={by} r={br} fill="#fff" fillOpacity=".8" />
      ))}
      <path d="M-40 0 C -38 24 38 24 40 0" fill="none" stroke="#fff" strokeOpacity=".95" strokeWidth="1.3" />
      <path d="M-40 0 C -38 24 38 24 40 0" fill="none" style={{ stroke: T.oscuro }} strokeOpacity=".28" strokeWidth=".6" transform="translate(0 1)" />
      <ellipse cx="0" cy="0" rx="40" ry="6.4" fill="none" stroke={url(g.oro)} strokeWidth="1.8" />
      <path d="M-31 6 C -29 13 -22 17 -14 19" fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}
export function DlCopas({ className = "" }) {
  const g = useIds("champana", "superficie", "oro", "sombra", "grano", "chispa");
  return (
    <svg className={className} viewBox="0 0 220 170" aria-hidden="true">
      <defs>
        <linearGradient id={g.champana} x1="0" y1="0" x2="0" y2="1">
          <Parada o="0" c={mezcla(T.rosa, "#F8D6BE", 45)} />
          <Parada o="1" c={mezcla(T.oscuro, "#F2B9A4", 45)} />
        </linearGradient>
        <radialGradient id={g.superficie} cx=".4" cy=".4" r=".8">
          <Parada o="0" c="#FFF7F1" />
          <Parada o="1" c={mezcla(T.rosa, "#F8D6BE", 60)} />
        </radialGradient>
        <OroLineal id={g.oro} />
        <Sombra id={g.sombra} />
        <radialGradient id={g.chispa}>
          <Parada o="0" c="#FFF6D8" />
          <Parada o="1" c={ORO.medio} a="0" />
        </radialGradient>
        <Grano id={g.grano} fuerza={0.05} />
      </defs>
      <g filter={url(g.grano)}>
        <Copa x={78} y={52} giro={-9} g={g} />
        <Copa x={142} y={52} giro={9} g={g} />
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
// Porción de torta de capas (bizcocho de vainilla, crema y mermelada) con
// glaseado rosa, una frambuesa y un tenedor dorado sobre plato de porcelana.
export function DlTarta({ className = "" }) {
  const g = useIds("oro", "sombra", "grano", "glaseado", "cara1", "cara2", "plato", "fram");
  const A = [58, 62], B = [152, 50], P = [76, 98];
  const H = 40;
  const capas = [
    [0, 5, mezcla(T.rosa, T.claro, 60)],
    [5, 14, "#F2DDB4"],
    [14, 17, "#FFFaf5"],
    [17, 19.5, mezcla(T.oscuro, "#C0435E", 55)],
    [19.5, 28, "#F2DDB4"],
    [28, 31, "#FFFaf5"],
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
          <Parada o="0" c="#fff" />
          <Parada o=".5" c={T.claro} />
          <Parada o="1" c={T.rosa} />
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
          <Parada o=".8" c="#F7F1F3" />
          <Parada o="1" c="#E6DCE0" />
        </radialGradient>
        <radialGradient id={g.fram} cx=".35" cy=".3" r=".8">
          <Parada o="0" c="#F59AAF" />
          <Parada o="1" c="#A3304E" />
        </radialGradient>
      </defs>
      <g filter={url(g.grano)}>
        <ellipse cx="108" cy="150" rx="96" ry="12" fill={url(g.sombra)} />
        <path d="M18 132 A88 18 0 0 0 198 132 L198 136 A88 18 0 0 1 18 136 Z" fill="#E4DADE" />
        <ellipse cx="108" cy="132" rx="90" ry="18" fill={url(g.plato)} />
        <ellipse cx="108" cy="132" rx="78" ry="14.5" fill="none" stroke={url(g.oro)} strokeWidth="1.4" />
        <ellipse cx="104" cy="128" rx="62" ry="10" fill={url(g.sombra)} />

        {/* Tenedor dorado. */}
        <g transform="translate(176 126) rotate(-14)">
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

        {/* Cara de arriba glaseada, con borde de crema y frambuesa. */}
        <path d={`M${A[0]} ${A[1]} L${P[0]} ${P[1]} L${B[0]} ${B[1]} Q 112 30 ${A[0]} ${A[1]} Z`} fill={url(g.glaseado)} />
        {[[66, 58], [80, 51], [96, 46], [112, 44], [128, 44], [142, 47]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r="5.2" fill="#FFFaf8" />
            <path d="M-3.5 .5 C -3.5 -4 3.5 -4 3.5 0 C 3.5 3 -1.5 3.5 -1.5 0" fill="none" style={{ stroke: T.rosa }} strokeWidth="1" />
          </g>
        ))}
        <g transform="translate(104 64)">
          {[[0, 0], [-3, -2], [3, -2], [-2, 2.5], [2.5, 2.5], [0, -4.5], [-4.5, 1], [4.5, 1]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.6" fill={url(g.fram)} />
          ))}
          <path d="M-2 -7 l2 -3 l2 3" fill="none" stroke="#6F8B5F" strokeWidth="1.2" />
        </g>
        <path d="M118 70 l7 -3 l-2 6 z" fill={url(g.oro)} />
      </g>
    </svg>
  );
}

// SDXL: dl_cajita
// Cajita de pastelería rosa a rayas con cinta lila de satén y moño, y un
// sello dorado al frente.
export function DlCajita({ className = "" }) {
  const g = useIds("oro", "sombra", "grano", "frente", "lado", "tapa", "cinta", "rayas");
  return (
    <svg className={className} viewBox="0 0 220 170" aria-hidden="true">
      <defs>
        <OroLineal id={g.oro} />
        <Sombra id={g.sombra} />
        <Grano id={g.grano} />
        <linearGradient id={g.frente} x1="0" y1="0" x2="1" y2="1">
          <Parada o="0" c={mezcla(T.claro, "#fff", 55)} />
          <Parada o="1" c={T.claro} />
        </linearGradient>
        <linearGradient id={g.lado} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c={mezcla(T.rosa, T.claro, 55)} />
          <Parada o="1" c={T.rosa} />
        </linearGradient>
        <linearGradient id={g.tapa} x1="0" y1="0" x2="1" y2="1">
          <Parada o="0" c="#fff" />
          <Parada o="1" c={mezcla(T.claro, "#fff", 60)} />
        </linearGradient>
        <linearGradient id={g.cinta} x1="0" y1="0" x2="1" y2="0">
          <Parada o="0" c={mezcla(T.lila, T.tinta, 75)} />
          <Parada o=".45" c={mezcla(T.lila, "#fff", 70)} />
          <Parada o="1" c={T.lila} />
        </linearGradient>
        <pattern id={g.rayas} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="6" height="12" fill="#fff" fillOpacity=".5" />
        </pattern>
      </defs>
      <g filter={url(g.grano)}>
        <ellipse cx="112" cy="152" rx="92" ry="10" fill={url(g.sombra)} />
        {/* Caja: frente a rayas, lado y tapa. */}
        <path d="M44 72 L134 72 L134 146 L44 146 Z" fill={url(g.frente)} />
        <path d="M44 72 L134 72 L134 146 L44 146 Z" fill={url(g.rayas)} />
        <path d="M134 72 L172 56 L172 128 L134 146 Z" fill={url(g.lado)} />
        <path d="M134 72 L172 56 L172 128 L134 146 Z" fill={url(g.rayas)} opacity=".6" />
        {/* Tapa con borde que sobresale. */}
        <path d="M40 70 L136 70 L136 84 L40 84 Z" style={{ fill: T.rosa }} />
        <path d="M40 70 L136 70 L136 73 L40 73 Z" fill="#fff" fillOpacity=".35" />
        <path d="M136 70 L176 53 L176 67 L136 84 Z" style={{ fill: mezcla(T.rosa, T.oscuro, 70) }} />
        <path d="M40 70 L80 53 L176 53 L136 70 Z" fill={url(g.tapa)} />
        {/* Cinta: vertical al frente y al lado, cruzada sobre la tapa. */}
        <path d="M84 70 L94 70 L94 146 L84 146 Z" fill={url(g.cinta)} />
        <path d="M152 61 L160 58 L160 133 L152 137 Z" fill={url(g.cinta)} />
        <path d="M84 70 L94 70 L134 53 L124 53 Z" fill={url(g.cinta)} />
        <path d="M58 62 L154 62 L150 64 L54 64 Z" fill={url(g.cinta)} opacity=".95" />
        {/* Moño. */}
        <g transform="translate(108 60)">
          <path d="M-2 0 C -6 12 -14 20 -22 26 L-16 27 L-14 33 C -8 24 -3 14 0 2 Z" fill={url(g.cinta)} />
          <path d="M2 0 C 6 12 12 20 20 25 L14 27 L13 33 C 7 24 3 14 0 2 Z" fill={url(g.cinta)} />
          <path d="M-2 -2 C -18 -22 -40 -18 -36 -6 C -33 4 -16 4 -2 2 Z" fill={url(g.cinta)} />
          <path d="M2 -2 C 18 -22 40 -18 36 -6 C 33 4 16 4 2 2 Z" fill={url(g.cinta)} />
          <path d="M-6 -3 C -16 -11 -26 -12 -30 -8 M6 -3 C 16 -11 26 -12 30 -8" fill="none" style={{ stroke: mezcla(T.lila, T.tinta, 60) }} strokeWidth=".9" opacity=".7" />
          <path d="M-28 -12 C -24 -16 -18 -16 -14 -14 M14 -14 C 20 -17 26 -15 28 -12" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="0" cy="0" rx="6" ry="5" fill={url(g.cinta)} />
          <ellipse cx="-1.5" cy="-1.5" rx="2.4" ry="1.6" fill="#fff" opacity=".55" />
        </g>
        {/* Sello dorado al frente. */}
        <g transform="translate(64 118)">
          <circle r="11" fill={url(g.oro)} />
          <circle r="8" fill="none" stroke="#FFF6DA" strokeOpacity=".8" strokeWidth=".8" />
          <path d="M-4 2 C -4 -4 4 -4 4 2 M-3 2 L3 2" fill="none" stroke={ORO.sombra} strokeWidth="1" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

// ---------- Ornamentos (leen el tema) ----------

// Toldo festoneado de pastelería, a rayas rosa y blanco, con barra dorada.
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
          <Parada o="1" c={T.oscuro} a=".22" />
        </linearGradient>
        <Grano id={g.grano} fuerza={0.06} />
      </defs>
      <g filter={url(g.grano)}>
        {Array.from({ length: n }, (_, i) => {
          const x = i * ancho;
          const d = `M${x} 8 H${x + ancho} V58 A15 15 0 0 1 ${x} 58 Z`;
          return (
            <g key={i}>
              <path d={d} transform="translate(0 3)" style={{ fill: T.oscuro }} opacity=".14" />
              <path d={d} style={{ fill: i % 2 ? T.blanco : T.rosa }} />
              <path d={d} fill={url(g.pliegue)} />
              <path d={d} fill={url(g.sombra)} />
              <path d={`M${x + ancho} 58 A15 15 0 0 1 ${x} 58`} fill="none" style={{ stroke: i % 2 ? T.rosa : T.claro }} strokeWidth="1.2" opacity=".9" />
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
      <path d="M22 2 H194 Q198 2 198 6 V74 Q198 78 194 78 H22 L2 40 Z" style={{ fill: T.blanco }} stroke={ORO.medio} strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
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
  const g = useIds("oro", "m");
  return (
    <svg className={className} viewBox="0 0 200 24" aria-hidden="true">
      <defs><OroLineal id={g.oro} /></defs>
      <path d="M8 12 H82 M118 12 H192" stroke={url(g.oro)} strokeWidth="1.2" />
      <circle cx="6" cy="12" r="2" fill={ORO.medio} />
      <circle cx="194" cy="12" r="2" fill={ORO.medio} />
      <Macaron x={100} y={13} r={9} color={T.rosa} id={g.m} />
    </svg>
  );
}

// Macaron suelto y pequeño (viñetas del programa).
export function DlMacaronSuelto({ className = "", color = T.rosa }) {
  const g = useIds("m");
  return (
    <svg className={className} viewBox="0 0 40 30" aria-hidden="true">
      <Macaron x={20} y={17} r={14} color={color} id={g.m} />
    </svg>
  );
}
