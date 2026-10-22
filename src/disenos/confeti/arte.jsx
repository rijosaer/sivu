import { useId } from "react";

// Arte de «Confeti», todo en SVG semi-realista: látex con brillo, madera con
// veta, glaseado y cinta satinada. Capas de degradados, sombras suaves y un
// grano fino para que no se vean planos. Los colores de marca salen del tema
// (--color-gold = durazno, --color-gold-light = rubor, --color-gold-dark =
// terracota, --color-seal = oro); la madera, el metal y la llama son fijos.
// Cada pieza lleva su nombre SDXL por si luego se cambia por un .webp pintado.

const C = {
  durazno: "rgb(var(--color-gold))",
  claro: "rgb(var(--color-gold-light))",
  oscuro: "rgb(var(--color-gold-dark))",
  oro: "rgb(var(--color-seal))",
  tinta: "rgb(var(--color-ink))",
};
const mezcla = (a, b, p) => `color-mix(in srgb, ${a} ${p}%, ${b})`;

// Tonos de globo: base, luz (brillo) y sombra, siempre derivados del tema.
const TONOS = {
  durazno: { base: C.durazno, luz: mezcla(C.durazno, "white", 30), sombra: mezcla(C.oscuro, C.tinta, 85) },
  rubor: { base: mezcla(C.durazno, C.claro, 55), luz: mezcla(C.claro, "white", 45), sombra: mezcla(C.durazno, C.oscuro, 55) },
  crema: { base: mezcla(C.claro, "white", 55), luz: "white", sombra: mezcla(C.claro, C.durazno, 40) },
  oro: { base: C.oro, luz: mezcla(C.oro, "white", 25), sombra: mezcla(C.oro, C.tinta, 62) },
};

// Grano fino sobre la forma (solo donde hay pintura).
function Grano({ id, fuerza = 0.12, frecuencia = 0.9 }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency={frecuencia} numOctaves="2" seed="7" result="t" />
      <feColorMatrix in="t" type="matrix" values={`0 0 0 0 .32  0 0 0 0 .2  0 0 0 0 .16  0 0 0 ${fuerza} 0`} result="g" />
      <feComposite in="g" in2="SourceAlpha" operator="in" result="gc" />
      <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="gc" /></feMerge>
    </filter>
  );
}

const CUERPO_GLOBO = "M100 8 C 151 8 184 50 184 103 C 184 160 142 205 104 213 L 96 213 C 58 205 16 160 16 103 C 16 50 49 8 100 8 Z";

// Un globo de látex (sin cuerda), dibujado en un cuadro de 200 × 230.
// `clase` va en el grupo del látex (para reventarlo sin tocar la cuerda).
function Globo({ uid, tono = "durazno", clase }) {
  const t = TONOS[tono] || TONOS.durazno;
  const id = (s) => `${uid}-${s}`;
  return (
    <g className={clase}>
      <defs>
        <radialGradient id={id("c")} cx=".36" cy=".28" r=".82">
          <stop offset="0" style={{ stopColor: t.luz }} />
          <stop offset=".38" style={{ stopColor: t.base }} />
          <stop offset=".82" style={{ stopColor: mezcla(t.base, t.sombra, 45) }} />
          <stop offset="1" style={{ stopColor: t.sombra }} />
        </radialGradient>
        {/* Luz que atraviesa el látex por abajo a la derecha */}
        <radialGradient id={id("t")} cx=".68" cy=".86" r=".42">
          <stop offset="0" stopColor="#fff" stopOpacity=".42" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("b")} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".55" stopColor="#fff" stopOpacity=".45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("n")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: t.base }} />
          <stop offset="1" style={{ stopColor: t.sombra }} />
        </linearGradient>
        <Grano id={id("g")} fuerza={0.1} />
      </defs>
      <g filter={`url(#${id("g")})`}>
        <path d={CUERPO_GLOBO} fill={`url(#${id("c")})`} />
        <path d={CUERPO_GLOBO} fill={`url(#${id("t")})`} />
        {/* Nudo */}
        <path d="M91 226 Q 100 210 109 226 Q 100 231 91 226 Z" fill={`url(#${id("n")})`} />
        <path d="M95 213 L 105 213 L 103 219 L 97 219 Z" style={{ fill: t.sombra }} />
      </g>
      {/* Brillo principal (ventana reflejada) y un destello pequeño */}
      <ellipse cx="66" cy="62" rx="20" ry="34" transform="rotate(32 66 62)" fill={`url(#${id("b")})`} />
      <ellipse cx="58" cy="52" rx="5" ry="9" transform="rotate(32 58 52)" fill="#fff" opacity=".85" />
      <path d="M150 150 C 158 136 162 122 162 108" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

// Cuerda ondulada que baja del nudo (100, 228) hasta (100, 228 + largo).
function trazoCuerda(largo) {
  const fin = 228 + largo;
  let d = "M100 228";
  let y = 228;
  let i = 0;
  while (y < fin - 0.5) {
    const paso = Math.min(48, fin - y);
    const s = i % 2 ? 1 : -1;
    d += ` C ${100 + 7 * s} ${(y + paso * 0.33).toFixed(1)} ${100 - 7 * s} ${(y + paso * 0.66).toFixed(1)} 100 ${(y + paso).toFixed(1)}`;
    y += paso;
    i++;
  }
  return d;
}

// SDXL: cf_globo
// `largo` = largo de la cuerda (en unidades del globo de 200 de ancho); la
// cuerda termina justo en el borde inferior del SVG, centrada.
export function CfGlobo({ tono = "durazno", cuerda = true, largo = 100, className = "", claseLatex, claseCuerda, style }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg className={className} style={style} viewBox={`0 0 200 ${cuerda ? 228 + largo : 232}`} aria-hidden="true">
      {cuerda && (
        <path
          className={claseCuerda}
          d={trazoCuerda(largo)}
          fill="none" strokeWidth="1.4" strokeLinecap="round"
          style={{ stroke: mezcla(C.oscuro, C.tinta, 70) }} opacity=".75"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <Globo uid={uid} tono={tono} clase={claseLatex} />
    </svg>
  );
}

// SDXL: cf_etiqueta_kraft
// Etiqueta de cartón kraft, de las de colgar en un regalo: esquinas de arriba
// cortadas, ojal reforzado con un anillo más oscuro y un nudo de cabuya. El
// kraft es color natural (fijo); la fibra sale de un ruido alargado.
export function CfKraft({ className = "" }) {
  const uid = useId().replace(/:/g, "");
  const id = (s) => `${uid}-${s}`;
  const forma = "M34 4 L 176 4 Q 180 4 183 7 L 203 30 Q 206 33 206 38 L 206 198 Q 206 206 198 206 L 12 206 Q 4 206 4 198 L 4 38 Q 4 33 7 30 L 27 7 Q 30 4 34 4 Z";
  return (
    <svg className={className} viewBox="0 0 210 212" aria-hidden="true">
      <defs>
        <linearGradient id={id("k")} x1="0" y1="0" x2=".35" y2="1">
          <stop offset="0" stopColor="#D9B88F" />
          <stop offset=".5" stopColor="#CDA77A" />
          <stop offset="1" stopColor="#BE966A" />
        </linearGradient>
        <radialGradient id={id("luz")} cx=".3" cy=".25" r=".8">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("anillo")} cx=".45" cy=".4" r=".6">
          <stop offset="0" stopColor="#B88E61" />
          <stop offset="1" stopColor="#9F774D" />
        </radialGradient>
        {/* Fibra del cartón: ruido estirado + grano fino */}
        <filter id={id("fibra")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".9 .05" numOctaves="2" seed="4" result="f" />
          <feColorMatrix in="f" type="matrix" values="0 0 0 0 .35  0 0 0 0 .22  0 0 0 0 .1  0 0 0 .28 0" result="fc" />
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="9" result="p" />
          <feColorMatrix in="p" type="matrix" values="0 0 0 0 .3  0 0 0 0 .2  0 0 0 0 .1  0 0 0 .16 0" result="pc" />
          <feMerge result="m"><feMergeNode in="SourceGraphic" /><feMergeNode in="fc" /><feMergeNode in="pc" /></feMerge>
          <feComposite in="m" in2="SourceAlpha" operator="in" />
        </filter>
        <mask id={id("ojal")}>
          <rect width="210" height="212" fill="#fff" />
          <circle cx="105" cy="24" r="5.4" fill="#000" />
        </mask>
      </defs>
      <g>
        <g mask={`url(#${id("ojal")})`}>
          <path d={forma} fill={`url(#${id("k")})`} filter={`url(#${id("fibra")})`} />
          <path d={forma} fill={`url(#${id("luz")})`} />
          {/* Borde un poco más oscuro, como cartón cortado */}
          <path d={forma} fill="none" stroke="#9C7348" strokeOpacity=".35" strokeWidth="1.2" />
          <circle cx="105" cy="24" r="12" fill={`url(#${id("anillo")})`} />
          <circle cx="105" cy="24" r="12" fill="none" stroke="#7E5A36" strokeOpacity=".35" strokeWidth=".8" />
        </g>
      </g>
      {/* Nudo de cabuya en el ojal */}
      <g fill="none" strokeLinecap="round">
        <path d="M105 24 C 96 18 90 12 96 8 C 101 5 104 12 105 24" stroke="#8C6A45" strokeWidth="2.2" />
        <path d="M105 24 C 114 18 120 12 114 8 C 109 5 106 12 105 24" stroke="#8C6A45" strokeWidth="2.2" />
        <path d="M105 24 C 101 30 97 36 92 40 M105 24 C 108 31 112 36 117 39" stroke="#8C6A45" strokeWidth="1.8" />
        <path d="M97 9 C 99 8 101 10 102 13 M113 9 C 111 8 109 10 108 13" stroke="#E6CDA8" strokeOpacity=".7" strokeWidth=".8" />
      </g>
      <circle cx="105" cy="24" r="3" fill="#7A5733" />
    </svg>
  );
}

// SDXL: cf_alfiler
// Alfiler de costura con cabeza de perla (del tema) y aguja de acero. La
// punta queda a la derecha; la cabeza, centrada en (16, 15).
export function CfAlfiler({ className = "" }) {
  const uid = useId().replace(/:/g, "");
  const id = (s) => `${uid}-${s}`;
  return (
    <svg className={className} viewBox="0 0 140 30" aria-hidden="true">
      <defs>
        <linearGradient id={id("acero")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBFBFA" />
          <stop offset=".45" stopColor="#C9C7C3" />
          <stop offset="1" stopColor="#6F6B66" />
        </linearGradient>
        <radialGradient id={id("perla")} cx=".36" cy=".32" r=".75">
          <stop offset="0" style={{ stopColor: mezcla(C.durazno, "white", 25) }} />
          <stop offset=".5" style={{ stopColor: mezcla(C.durazno, C.oscuro, 55) }} />
          <stop offset="1" style={{ stopColor: mezcla(C.oscuro, C.tinta, 70) }} />
        </radialGradient>
        <filter id={id("s")} x="-10%" y="-40%" width="125%" height="200%">
          <feDropShadow dx="1" dy="3" stdDeviation="1.8" floodColor="#5a3a28" floodOpacity=".3" />
        </filter>
      </defs>
      <g filter={`url(#${id("s")})`}>
        {/* Aguja que se afila hasta la punta */}
        <path d="M24 13.6 L 126 14.2 L 139 15 L 126 15.8 L 24 16.4 Z" fill={`url(#${id("acero")})`} />
        <path d="M26 14.3 L 124 14.7" stroke="#fff" strokeOpacity=".8" strokeWidth=".5" />
        {/* Cabeza de perla */}
        <circle cx="16" cy="15" r="12.5" fill={`url(#${id("perla")})`} />
        <ellipse cx="11.5" cy="10" rx="4.2" ry="2.8" transform="rotate(-30 11.5 10)" fill="#fff" opacity=".8" />
        <circle cx="21" cy="21" r="3" fill="#fff" opacity=".18" />
      </g>
    </svg>
  );
}

// Moño de cinta satinada (racimo y regalo). Centro en (0, 0).
function Mono({ uid, escala = 1, x = 0, y = 0 }) {
  const id = (s) => `${uid}-${s}`;
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <defs>
        <linearGradient id={id("m")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: mezcla(C.oro, "white", 35) }} />
          <stop offset=".45" style={{ stopColor: C.oro }} />
          <stop offset="1" style={{ stopColor: mezcla(C.oro, C.tinta, 62) }} />
        </linearGradient>
        <linearGradient id={id("mi")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: mezcla(C.oro, C.tinta, 55) }} />
          <stop offset="1" style={{ stopColor: mezcla(C.oro, C.tinta, 75) }} />
        </linearGradient>
      </defs>
      {/* Colas */}
      <path d="M-3 4 C -10 18 -18 30 -24 44 L -16 42 L -13 50 C -7 36 -2 20 2 6 Z" fill={`url(#${id("m")})`} />
      <path d="M3 4 C 10 18 17 30 22 46 L 14 43 L 10 51 C 6 36 2 20 -2 6 Z" fill={`url(#${id("m")})`} />
      {/* Lazos con su sombra interior */}
      <path d="M-2 -2 C -14 -22 -38 -24 -40 -10 C -42 4 -20 8 -2 3 Z" fill={`url(#${id("m")})`} />
      <path d="M-6 -1 C -16 -12 -30 -13 -32 -7 C -24 -2 -14 0 -6 1 Z" fill={`url(#${id("mi")})`} opacity=".6" />
      <path d="M2 -2 C 14 -22 38 -24 40 -10 C 42 4 20 8 2 3 Z" fill={`url(#${id("m")})`} />
      <path d="M6 -1 C 16 -12 30 -13 32 -7 C 24 -2 14 0 6 1 Z" fill={`url(#${id("mi")})`} opacity=".6" />
      <path d="M-34 -14 C -28 -20 -18 -19 -10 -12" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M34 -14 C 28 -20 18 -19 10 -12" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="0" cy="0" rx="7" ry="8" fill={`url(#${id("m")})`} />
      <path d="M-3 -4 Q 0 -6 3 -4" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

// SDXL: cf_ramo
// Racimo de cinco globos con las cuerdas atadas por un moño dorado.
export function CfRamo({ className = "" }) {
  const uid = useId().replace(/:/g, "");
  // [tono, x, y, escala, giro]: los de atrás primero.
  const globos = [
    ["oro", 62, 70, 0.5, -16],
    ["crema", 198, 60, 0.5, 14],
    ["rubor", 92, 120, 0.56, -8],
    ["durazno", 130, 64, 0.66, 2],
    ["oro", 172, 128, 0.48, 12],
  ];
  const nudo = { x: 130, y: 300 };
  return (
    <svg className={className} viewBox="0 0 260 340" aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-s`} cx=".5" cy=".5" r=".5">
          <stop offset="0" style={{ stopColor: C.oscuro }} stopOpacity=".2" />
          <stop offset="1" style={{ stopColor: C.oscuro }} stopOpacity="0" />
        </radialGradient>
      </defs>
      {globos.map(([, x, y, e, g], i) => {
        // Punta del nudo de cada globo, ya girada y escalada.
        const r = (g * Math.PI) / 180;
        const px = x + (-Math.sin(r) * 128) * e;
        const py = y + Math.cos(r) * 128 * e;
        return (
          <path key={`c${i}`} d={`M${px.toFixed(1)} ${py.toFixed(1)} Q ${((px + nudo.x) / 2 + (i % 2 ? 8 : -8)).toFixed(1)} ${((py + nudo.y) / 2).toFixed(1)} ${nudo.x} ${nudo.y}`}
            fill="none" strokeWidth="1.1" style={{ stroke: mezcla(C.oscuro, C.tinta, 70) }} opacity=".6" />
        );
      })}
      <path d={`M${nudo.x} ${nudo.y} C 124 312 136 322 128 338`} fill="none" strokeWidth="1.1" style={{ stroke: mezcla(C.oscuro, C.tinta, 70) }} opacity=".6" />
      {globos.map(([tono, x, y, e, g], i) => (
        // El globo mide 200 × 230 con el nudo en (100, 228): se centra en (x, y).
        <g key={i} transform={`translate(${x} ${y}) rotate(${g}) scale(${e}) translate(-100 -100)`}>
          <Globo uid={`${uid}-${i}`} tono={tono} />
        </g>
      ))}
      <Mono uid={`${uid}-mono`} x={nudo.x} y={nudo.y} escala={0.5} />
    </svg>
  );
}

// SDXL: cf_pinza
// Pinza de madera de las de tender ropa, vista de frente, con su resorte.
export function CfPinza({ className = "" }) {
  const uid = useId().replace(/:/g, "");
  const id = (s) => `${uid}-${s}`;
  return (
    <svg className={className} viewBox="0 0 26 64" aria-hidden="true">
      <defs>
        <linearGradient id={id("m")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C99F6E" />
          <stop offset=".35" stopColor="#EBD2AC" />
          <stop offset=".7" stopColor="#DDBB8C" />
          <stop offset="1" stopColor="#B0814F" />
        </linearGradient>
        <linearGradient id={id("r")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9E6E1" />
          <stop offset=".5" stopColor="#9C9893" />
          <stop offset="1" stopColor="#5E5A55" />
        </linearGradient>
        <filter id={id("f")} x="-40%" y="-20%" width="180%" height="150%">
          <feDropShadow dx="0.6" dy="1.6" stdDeviation="1.2" floodColor="#5a3a28" floodOpacity=".32" />
        </filter>
        <Grano id={id("g")} fuerza={0.16} frecuencia={1.3} />
      </defs>
      <g filter={`url(#${id("f")})`}>
        <g filter={`url(#${id("g")})`}>
          {/* Dos mitades de madera, con la muesca donde entra el resorte */}
          <path d="M3 3 Q 3 1 5 1 L 11.6 1 Q 12.4 1 12.4 2 L 12.4 26 Q 11 28 12.4 30 L 12.4 62 Q 12.4 63 11.4 63 L 6 63 Q 4 63 4 61 L 3.4 30 Q 2 28 3.2 26 Z" fill={`url(#${id("m")})`} />
          <path d="M13.6 2 Q 13.6 1 14.4 1 L 21 1 Q 23 1 23 3 L 22.8 26 Q 24 28 22.6 30 L 22 61 Q 22 63 20 63 L 14.6 63 Q 13.6 63 13.6 62 L 13.6 30 Q 15 28 13.6 26 Z" fill={`url(#${id("m")})`} />
        </g>
        {/* Veta de la madera */}
        <path d="M6 6 C 7 18 5.4 34 6.6 58 M9.4 4 C 10 16 9 40 10 60 M17 5 C 17.6 22 16.4 40 17.4 60 M20 8 C 20.4 20 19.6 44 20.2 58" fill="none" stroke="#8A5D33" strokeOpacity=".22" strokeWidth=".55" />
        <path d="M12.4 2 L 12.4 62 M13.6 2 L 13.6 62" stroke="#7A5230" strokeOpacity=".35" strokeWidth=".5" />
        {/* Resorte de metal */}
        <rect x="1.6" y="25" width="22.8" height="6" rx="3" fill={`url(#${id("r")})`} />
        <path d="M4 25.6 L 5 30.4 M7.4 25.6 L 8.4 30.4 M10.8 25.6 L 11.8 30.4 M14.2 25.6 L 15.2 30.4 M17.6 25.6 L 18.6 30.4 M21 25.6 L 22 30.4" stroke="#4A4642" strokeOpacity=".55" strokeWidth=".6" />
        <path d="M3 26.4 L 23 26.4" stroke="#fff" strokeOpacity=".7" strokeWidth=".7" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// SDXL: cf_pastel
// Pastel de dos pisos con glaseado durazno que chorrea, perlas doradas,
// chispas y tres velas encendidas.
export function CfPastel({ className = "" }) {
  const uid = useId().replace(/:/g, "");
  const id = (s) => `${uid}-${s}`;
  const crema = mezcla(C.claro, "white", 45);
  const chispas = [
    [52, 160, -30, "oro"], [72, 172, 20, "durazno"], [96, 158, 60, "oro"], [118, 176, -10, "oscuro"], [140, 162, 35, "oro"], [160, 174, -50, "durazno"],
    [72, 108, 15, "oro"], [92, 116, -40, "durazno"], [112, 104, 70, "oro"], [130, 114, -15, "oscuro"],
  ];
  const tonoChispa = { oro: C.oro, durazno: C.durazno, oscuro: C.oscuro };
  const piso = (x1, x2, arriba, abajo, r) => `M${x1} ${arriba} L ${x1} ${abajo} A ${(x2 - x1) / 2} ${r} 0 0 0 ${x2} ${abajo} L ${x2} ${arriba} Z`;
  const goteo = (x1, x2, y, r, gotas) => {
    // Borde del glaseado: sigue la elipse del piso y baja en gotas redondeadas.
    const ancho = x2 - x1;
    let d = `M${x1} ${y}`;
    gotas.forEach(([p, largo], i) => {
      const cx = x1 + ancho * p;
      const prev = i === 0 ? x1 : x1 + ancho * ((gotas[i - 1][0] + p) / 2);
      const sig = x1 + ancho * (i === gotas.length - 1 ? 1 : (p + gotas[i + 1][0]) / 2);
      const curva = (xx) => y + r * Math.sqrt(Math.max(0, 1 - ((xx - (x1 + x2) / 2) / (ancho / 2)) ** 2));
      d += ` Q ${((prev + cx) / 2).toFixed(1)} ${curva((prev + cx) / 2).toFixed(1)} ${(cx - 5).toFixed(1)} ${curva(cx - 5).toFixed(1)}`;
      d += ` C ${(cx - 5).toFixed(1)} ${(curva(cx) + largo).toFixed(1)} ${(cx + 5).toFixed(1)} ${(curva(cx) + largo).toFixed(1)} ${(cx + 5).toFixed(1)} ${curva(cx + 5).toFixed(1)}`;
      d += ` Q ${((cx + sig) / 2).toFixed(1)} ${curva((cx + sig) / 2).toFixed(1)} ${sig.toFixed(1)} ${curva(sig).toFixed(1)}`;
    });
    d += ` L ${x2} ${y - 2} A ${ancho / 2} ${r} 0 0 0 ${x1} ${y - 2} Z`;
    return d;
  };
  return (
    <svg className={className} viewBox="0 0 200 222" aria-hidden="true">
      <defs>
        {/* Cilindro: luz a la izquierda, sombra en los costados */}
        <linearGradient id={id("p")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: mezcla(C.claro, C.durazno, 55) }} />
          <stop offset=".28" style={{ stopColor: crema }} />
          <stop offset=".62" style={{ stopColor: mezcla(C.claro, "white", 70) }} />
          <stop offset="1" style={{ stopColor: mezcla(C.durazno, C.oscuro, 70) }} />
        </linearGradient>
        <linearGradient id={id("gl")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: mezcla(C.durazno, C.oscuro, 70) }} />
          <stop offset=".3" style={{ stopColor: mezcla(C.durazno, "white", 80) }} />
          <stop offset=".7" style={{ stopColor: C.durazno }} />
          <stop offset="1" style={{ stopColor: mezcla(C.oscuro, C.tinta, 85) }} />
        </linearGradient>
        <radialGradient id={id("tapa")} cx=".4" cy=".35" r=".8">
          <stop offset="0" style={{ stopColor: mezcla(C.durazno, "white", 55) }} />
          <stop offset="1" style={{ stopColor: C.durazno }} />
        </radialGradient>
        <linearGradient id={id("oro")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: mezcla(C.oro, "white", 40) }} />
          <stop offset=".5" style={{ stopColor: C.oro }} />
          <stop offset="1" style={{ stopColor: mezcla(C.oro, C.tinta, 60) }} />
        </linearGradient>
        <linearGradient id={id("plato")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" style={{ stopColor: mezcla(C.claro, C.durazno, 60) }} />
        </linearGradient>
        <radialGradient id={id("llama")} cx=".5" cy=".7" r=".6">
          <stop offset="0" stopColor="#FFFBEA" />
          <stop offset=".45" stopColor="#FFD77A" />
          <stop offset="1" stopColor="#F2994A" stopOpacity=".2" />
        </radialGradient>
        <radialGradient id={id("halo")} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#FFE3A3" stopOpacity=".55" />
          <stop offset="1" stopColor="#FFE3A3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("vela")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: mezcla(C.claro, C.durazno, 40) }} />
          <stop offset=".4" stopColor="#FFFCF8" />
          <stop offset="1" style={{ stopColor: mezcla(C.claro, C.durazno, 30) }} />
        </linearGradient>
        <radialGradient id={id("sombra")} cx=".5" cy=".5" r=".5">
          <stop offset="0" style={{ stopColor: C.oscuro }} stopOpacity=".3" />
          <stop offset="1" style={{ stopColor: C.oscuro }} stopOpacity="0" />
        </radialGradient>
        <Grano id={id("g")} fuerza={0.11} />
      </defs>

      <ellipse cx="100" cy="206" rx="92" ry="13" fill={`url(#${id("sombra")})`} />
      {/* Plato con borde dorado */}
      <ellipse cx="100" cy="196" rx="84" ry="15" fill={`url(#${id("oro")})`} />
      <ellipse cx="100" cy="193" rx="82" ry="13" fill={`url(#${id("plato")})`} />

      <g filter={`url(#${id("g")})`}>
        {/* Piso de abajo */}
        <path d={piso(36, 164, 140, 186, 12)} fill={`url(#${id("p")})`} />
        <path d={goteo(36, 164, 140, 12, [[0.08, 14], [0.22, 24], [0.38, 11], [0.52, 20], [0.68, 13], [0.82, 22], [0.94, 10]])} fill={`url(#${id("gl")})`} />
        <ellipse cx="100" cy="139" rx="64" ry="11.5" fill={`url(#${id("tapa")})`} />
        {/* Piso de arriba */}
        <path d={piso(60, 140, 92, 136, 9)} fill={`url(#${id("p")})`} />
        <path d={goteo(60, 140, 92, 9, [[0.12, 12], [0.32, 20], [0.55, 10], [0.76, 17], [0.92, 9]])} fill={`url(#${id("gl")})`} />
        <ellipse cx="100" cy="91" rx="40" ry="8.5" fill={`url(#${id("tapa")})`} />
      </g>

      {/* Perlas doradas en la base de cada piso */}
      {Array.from({ length: 15 }, (_, i) => {
        const a = Math.PI * (i / 14);
        return <circle key={`b${i}`} cx={100 - Math.cos(a) * 62} cy={184 + Math.sin(a) * 11.5} r="3.2" fill={`url(#${id("oro")})`} />;
      })}
      {Array.from({ length: 11 }, (_, i) => {
        const a = Math.PI * (i / 10);
        return <circle key={`a${i}`} cx={100 - Math.cos(a) * 39} cy={134 + Math.sin(a) * 8.5} r="2.6" fill={`url(#${id("oro")})`} />;
      })}

      {/* Chispas de azúcar */}
      {chispas.map(([x, y, g, t], i) => (
        <rect key={`c${i}`} x={x - 3} y={y - 1} width="6" height="2.2" rx="1.1" transform={`rotate(${g} ${x} ${y})`} style={{ fill: tonoChispa[t] }} opacity=".85" />
      ))}

      {/* Brillo del glaseado */}
      <path d="M48 145 C 50 156 50 166 49 178" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" />
      <path d="M68 97 C 69 106 69 116 68 128" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2.4" strokeLinecap="round" />

      {/* Velas con su llama */}
      {[[80, 60], [100, 54], [120, 60]].map(([x, alto], i) => (
        <g key={`v${i}`}>
          <rect x={x - 3.2} y={alto} width="6.4" height={92 - alto + 2} rx="1.6" fill={`url(#${id("vela")})`} />
          {[0, 1, 2, 3].map((k) => (
            <path key={k} d={`M${x - 3.2} ${alto + 6 + k * 7.5} L ${x + 3.2} ${alto + 2 + k * 7.5}`} strokeWidth="2.2" style={{ stroke: k % 2 ? C.oro : C.durazno }} opacity=".85" />
          ))}
          <path d={`M${x} ${alto} L ${x} ${alto - 4}`} stroke="#4A3A34" strokeWidth="1" />
          <circle cx={x} cy={alto - 10} r="12" fill={`url(#${id("halo")})`} className="cf-llama-halo" />
          <path className="cf-llama" d={`M${x} ${alto - 20} C ${x + 5} ${alto - 12} ${x + 5} ${alto - 5} ${x} ${alto - 3} C ${x - 5} ${alto - 5} ${x - 5} ${alto - 12} ${x} ${alto - 20} Z`} fill={`url(#${id("llama")})`} />
        </g>
      ))}
    </svg>
  );
}

// SDXL: cf_regalo
// Caja de regalo color rubor con tapa, cinta satinada dorada y moño.
export function CfRegalo({ className = "" }) {
  const uid = useId().replace(/:/g, "");
  const id = (s) => `${uid}-${s}`;
  return (
    <svg className={className} viewBox="0 0 200 196" aria-hidden="true">
      <defs>
        <linearGradient id={id("caja")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: mezcla(C.claro, C.durazno, 40) }} />
          <stop offset=".35" style={{ stopColor: mezcla(C.claro, "white", 70) }} />
          <stop offset="1" style={{ stopColor: mezcla(C.durazno, C.oscuro, 72) }} />
        </linearGradient>
        <linearGradient id={id("tapa")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: mezcla(C.claro, C.durazno, 55) }} />
          <stop offset=".35" style={{ stopColor: mezcla(C.claro, "white", 55) }} />
          <stop offset="1" style={{ stopColor: mezcla(C.durazno, C.oscuro, 60) }} />
        </linearGradient>
        <linearGradient id={id("cinta")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: mezcla(C.oro, C.tinta, 70) }} />
          <stop offset=".4" style={{ stopColor: mezcla(C.oro, "white", 50) }} />
          <stop offset=".6" style={{ stopColor: C.oro }} />
          <stop offset="1" style={{ stopColor: mezcla(C.oro, C.tinta, 65) }} />
        </linearGradient>
        <linearGradient id={id("cintaH")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: mezcla(C.oro, "white", 45) }} />
          <stop offset="1" style={{ stopColor: mezcla(C.oro, C.tinta, 70) }} />
        </linearGradient>
        <linearGradient id={id("sl")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: C.oscuro }} stopOpacity=".35" />
          <stop offset="1" style={{ stopColor: C.oscuro }} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id("sombra")} cx=".5" cy=".5" r=".5">
          <stop offset="0" style={{ stopColor: C.oscuro }} stopOpacity=".3" />
          <stop offset="1" style={{ stopColor: C.oscuro }} stopOpacity="0" />
        </radialGradient>
        <Grano id={id("g")} fuerza={0.12} />
      </defs>
      <ellipse cx="100" cy="184" rx="86" ry="10" fill={`url(#${id("sombra")})`} />
      <g filter={`url(#${id("g")})`}>
        <path d="M40 96 L 160 96 L 158 178 Q 158 182 154 182 L 46 182 Q 42 182 42 178 Z" fill={`url(#${id("caja")})`} />
        {/* Sombra que proyecta la tapa */}
        <rect x="40" y="96" width="120" height="14" fill={`url(#${id("sl")})`} />
        <rect x="88" y="96" width="24" height="86" fill={`url(#${id("cinta")})`} />
        <path d="M30 76 Q 30 72 34 72 L 166 72 Q 170 72 170 76 L 170 96 Q 170 100 166 100 L 34 100 Q 30 100 30 96 Z" fill={`url(#${id("tapa")})`} />
        <rect x="86" y="72" width="28" height="28" fill={`url(#${id("cinta")})`} />
        <path d="M34 73.5 L 166 73.5" stroke="#fff" strokeOpacity=".6" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <path d="M48 112 C 49 136 49 156 48 172" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="3" strokeLinecap="round" />
      {/* Moño grande */}
      <g transform="translate(100 64)">
        <path d="M-4 6 C -12 22 -22 34 -30 46 L -20 44 L -17 54 C -8 40 -2 24 2 8 Z" fill={`url(#${id("cinta")})`} />
        <path d="M4 6 C 12 22 22 34 30 46 L 20 44 L 17 54 C 8 40 2 24 -2 8 Z" fill={`url(#${id("cinta")})`} />
        <path d="M-3 0 C -18 -34 -58 -40 -60 -14 C -62 6 -30 12 -3 6 Z" fill={`url(#${id("cintaH")})`} />
        <path d="M-8 2 C -22 -16 -44 -20 -48 -10 C -36 -2 -20 2 -8 4 Z" style={{ fill: mezcla(C.oro, C.tinta, 55) }} opacity=".55" />
        <path d="M3 0 C 18 -34 58 -40 60 -14 C 62 6 30 12 3 6 Z" fill={`url(#${id("cintaH")})`} />
        <path d="M8 2 C 22 -16 44 -20 48 -10 C 36 -2 20 2 8 4 Z" style={{ fill: mezcla(C.oro, C.tinta, 55) }} opacity=".55" />
        <path d="M-52 -20 C -44 -30 -28 -30 -16 -18" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" />
        <path d="M50 -22 C 42 -30 30 -29 20 -20" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="1.6" strokeLinecap="round" />
        <ellipse cx="0" cy="2" rx="10" ry="11" fill={`url(#${id("cinta")})`} />
        <path d="M-5 -4 Q 0 -7 5 -4" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

