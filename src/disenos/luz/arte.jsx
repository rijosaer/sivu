import { useId } from "react";

// Arte de «Luz de bautizo», todo en SVG con aspecto semi-realista: capas de
// degradados, sombras suaves, hojas con nervadura y un grano fino. Cada pieza
// lleva encima su nombre SDXL por si luego se cambia por un .webp pintado.
// Los colores de marca salen del tema (oro, oro claro, oro oscuro, olivo);
// la cera, la llama, la piedra y el agua llevan sus colores naturales.

const tema = (v, a) => (a == null ? `rgb(var(--color-${v}))` : `rgb(var(--color-${v}) / ${a})`);
const mezcla = (a, pa, b) => `color-mix(in srgb, ${a} ${pa}%, ${b})`;
const Stop = ({ o, c, a = 1 }) => <stop offset={o} style={{ stopColor: c, stopOpacity: a }} />;

// Ids únicos por instancia (las piezas se repiten en la página).
function useIds(...nombres) {
  const base = useId().replace(/:/g, "");
  return Object.fromEntries(nombres.map((n) => [n, `lb${base}${n}`]));
}

// Grano de papel pintado: ruido fino pegado solo dentro de la forma.
function Grano({ id, fuerza = 0.16, semilla = 3 }) {
  return (
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={semilla} result="ruido" />
      <feColorMatrix in="ruido" type="matrix" values={`0 0 0 0 .32  0 0 0 0 .27  0 0 0 0 .2  ${fuerza} 0 0 0 0`} result="grano" />
      <feComposite in="grano" in2="SourceGraphic" operator="in" result="dentro" />
      <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="dentro" /></feMerge>
    </filter>
  );
}

/* ---------- Rama de olivo (se usa sola y dentro de la vela) ---------- */

// Hoja lanceolada apuntando a +x, con nervio central.
const hoja = (L, w) =>
  `M0 0 C ${L * 0.22} ${-w} ${L * 0.62} ${-w * 0.95} ${L} 0 C ${L * 0.64} ${w * 0.78} ${L * 0.24} ${w * 0.86} 0 0 Z`;
const nervio = (L, w) => `M${L * 0.04} 0 Q ${L * 0.5} ${-w * 0.12} ${L * 0.94} ${-w * 0.02}`;

// Tallo de 0,0 a 130,-6 con una curva suave; las hojas se reparten alternadas.
const TALLO = { cx: 64, cy: -16, x: 130, y: -6 };
function enTallo(t) {
  const u = 1 - t;
  return {
    x: 2 * u * t * TALLO.cx + t * t * TALLO.x,
    y: 2 * u * t * TALLO.cy + t * t * TALLO.y,
    ang: (Math.atan2(2 * u * (TALLO.cy) + 2 * t * (TALLO.y - TALLO.cy), 2 * u * TALLO.cx + 2 * t * (TALLO.x - TALLO.cx)) * 180) / Math.PI,
  };
}
const HOJAS = [
  { t: 0.1, lado: -1, L: 40, w: 7.5, enves: false },
  { t: 0.18, lado: 1, L: 42, w: 8, enves: true },
  { t: 0.32, lado: -1, L: 40, w: 7.5, enves: false },
  { t: 0.42, lado: 1, L: 38, w: 7, enves: false },
  { t: 0.55, lado: -1, L: 34, w: 6.5, enves: true },
  { t: 0.64, lado: 1, L: 32, w: 6.2, enves: false },
  { t: 0.76, lado: -1, L: 27, w: 5.6, enves: false },
  { t: 0.84, lado: 1, L: 24, w: 5, enves: true },
].map((h) => ({ ...h, ...enTallo(h.t) }));
const OLIVAS = [
  { t: 0.26, lado: 1, d: 12 },
  { t: 0.48, lado: -1, d: 11 },
  { t: 0.5, lado: 1, d: 15 },
].map((o) => ({ ...o, ...enTallo(o.t) }));

function RamaOlivo({ ids }) {
  const punta = enTallo(1);
  return (
    <g filter={`url(#${ids.grano})`}>
      <path d={`M-6 3 Q ${TALLO.cx} ${TALLO.cy} ${TALLO.x} ${TALLO.y}`} fill="none" stroke="#6E6A4C" strokeWidth="2.1" strokeLinecap="round" />
      <path d={`M-6 3 Q ${TALLO.cx} ${TALLO.cy} ${TALLO.x} ${TALLO.y}`} fill="none" stroke="#A9A27A" strokeWidth=".7" strokeLinecap="round" transform="translate(0 -.6)" />
      {HOJAS.map((h, i) => {
        const giro = h.ang + h.lado * (38 - h.t * 14);
        return (
          <g key={i} transform={`translate(${h.x} ${h.y}) rotate(${giro})`}>
            {/* sombra suave de la hoja sobre lo que tenga detrás */}
            <path d={hoja(h.L, h.w)} transform="translate(1.4 2.2)" fill="#2F3526" opacity=".14" filter={`url(#${ids.difusa})`} />
            <path d={hoja(h.L, h.w)} fill={`url(#${h.enves ? ids.enves : ids.haz})`} />
            <path d={hoja(h.L, h.w)} fill={`url(#${ids.brillo})`} opacity=".55" />
            <path d={nervio(h.L, h.w)} fill="none" stroke={h.enves ? "#F2F1E6" : "#C9D3BC"} strokeWidth=".8" strokeLinecap="round" opacity=".85" />
          </g>
        );
      })}
      <g transform={`translate(${punta.x} ${punta.y}) rotate(${punta.ang - 4})`}>
        <path d={hoja(22, 4.8)} fill={`url(#${ids.haz})`} />
        <path d={nervio(22, 4.8)} fill="none" stroke="#C9D3BC" strokeWidth=".7" opacity=".8" />
      </g>
      {OLIVAS.map((o, i) => {
        const r = o.ang + o.lado * 90;
        const dx = Math.cos((r * Math.PI) / 180) * o.d;
        const dy = Math.sin((r * Math.PI) / 180) * o.d;
        return (
          <g key={i}>
            <path d={`M${o.x} ${o.y} Q ${o.x + dx * 0.4} ${o.y + dy * 0.7} ${o.x + dx * 0.8} ${o.y + dy * 0.8}`} fill="none" stroke="#6E6A4C" strokeWidth="1" />
            <ellipse cx={o.x + dx} cy={o.y + dy} rx="4.6" ry="6" transform={`rotate(${r - 90} ${o.x + dx} ${o.y + dy})`} fill={`url(#${ids.oliva})`} />
            <ellipse cx={o.x + dx - 1.4} cy={o.y + dy - 2} rx="1.3" ry="2" fill="#fff" opacity=".55" transform={`rotate(${r - 90} ${o.x + dx} ${o.y + dy})`} />
          </g>
        );
      })}
    </g>
  );
}

function DefsOlivo({ ids }) {
  return (
    <>
      <linearGradient id={ids.haz} x1="0" y1="-1" x2="0" y2="1" gradientUnits="objectBoundingBox">
        <Stop o="0" c={mezcla(tema("seal"), 55, "#42503A")} />
        <Stop o=".55" c={mezcla(tema("seal"), 80, "#55634A")} />
        <Stop o="1" c={mezcla(tema("seal"), 70, "#E9EDE0")} />
      </linearGradient>
      <linearGradient id={ids.enves} x1="0" y1="0" x2="1" y2="1">
        <Stop o="0" c="#DCE3D3" />
        <Stop o=".6" c={mezcla(tema("seal"), 45, "#E7EBDF")} />
        <Stop o="1" c={mezcla(tema("seal"), 70, "#7F8F72")} />
      </linearGradient>
      <linearGradient id={ids.brillo} x1="0" y1="0" x2="1" y2="0">
        <Stop o="0" c="#fff" a="0" />
        <Stop o=".45" c="#fff" a=".35" />
        <Stop o="1" c="#fff" a="0" />
      </linearGradient>
      <radialGradient id={ids.oliva} cx=".35" cy=".3" r=".8">
        <Stop o="0" c="#A3AE6A" />
        <Stop o=".55" c="#6C7840" />
        <Stop o="1" c="#3F4824" />
      </radialGradient>
      <filter id={ids.difusa} x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="1.4" /></filter>
      <Grano id={ids.grano} fuerza={0.12} semilla={7} />
    </>
  );
}

const IDS_OLIVO = ["haz", "enves", "brillo", "oliva", "difusa", "grano"];

// SDXL: lb_olivo
export function LbOlivo({ className = "", style }) {
  const ids = useIds(...IDS_OLIVO);
  return (
    <svg className={className} style={style} viewBox="-12 -46 156 84" aria-hidden="true" focusable="false">
      <defs><DefsOlivo ids={ids} /></defs>
      <RamaOlivo ids={ids} />
    </svg>
  );
}

/* ---------- Vela bautismal con ramito de olivo (la cinta va aparte) ---------- */

// SDXL: lb_vela
export function LbVela({ className = "", style }) {
  const ids = useIds(
    "cera", "cerasup", "luzcera", "borde", "oro", "orov", "plato", "platoin", "sombra", "difusa", "grano",
    ...IDS_OLIVO.map((n) => `o${n}`),
  );
  const olivo = Object.fromEntries(IDS_OLIVO.map((n) => [n, ids[`o${n}`]]));
  // Cuerpo de la vela: x 64–136, de y 78 a y 500.
  return (
    <svg className={className} style={style} viewBox="0 0 200 540" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={ids.cera} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c="#D9CDB3" />
          <Stop o=".12" c="#EDE5D2" />
          <Stop o=".34" c="#FFFDF7" />
          <Stop o=".5" c="#FBF6EA" />
          <Stop o=".78" c="#EAE0CA" />
          <Stop o="1" c="#CDBF9F" />
        </linearGradient>
        <linearGradient id={ids.cerasup} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c="#fff" a=".0" />
          <Stop o=".75" c="#8A7A5A" a="0" />
          <Stop o="1" c="#7A6A4A" a=".22" />
        </linearGradient>
        {/* luz cálida que la llama deja en la parte alta de la cera */}
        <radialGradient id={ids.luzcera} cx=".5" cy="0" r=".5" gradientTransform="translate(0 0) scale(1 1.2)">
          <Stop o="0" c="#FFE7B0" a=".95" />
          <Stop o=".45" c="#FFEBC4" a=".35" />
          <Stop o="1" c="#FFF4DE" a="0" />
        </radialGradient>
        <radialGradient id={ids.borde} cx=".5" cy=".5" r=".55">
          <Stop o="0" c="#E6DBC2" />
          <Stop o=".7" c="#F6F0E2" />
          <Stop o="1" c="#FFFDF8" />
        </radialGradient>
        <linearGradient id={ids.oro} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c={tema("gold-dark")} />
          <Stop o=".3" c={tema("gold")} />
          <Stop o=".45" c={mezcla(tema("gold-light"), 70, "#fff")} />
          <Stop o=".62" c={tema("gold")} />
          <Stop o="1" c={tema("gold-dark")} />
        </linearGradient>
        <linearGradient id={ids.orov} x1="0" y1="0" x2="1" y2="1">
          <Stop o="0" c={mezcla(tema("gold-light"), 60, "#fff")} />
          <Stop o=".45" c={tema("gold")} />
          <Stop o="1" c={tema("gold-dark")} />
        </linearGradient>
        <linearGradient id={ids.plato} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c={tema("gold-dark")} />
          <Stop o=".28" c={tema("gold")} />
          <Stop o=".42" c={mezcla(tema("gold-light"), 60, "#fff")} />
          <Stop o=".6" c={tema("gold")} />
          <Stop o="1" c={mezcla(tema("gold-dark"), 80, "#000")} />
        </linearGradient>
        <radialGradient id={ids.platoin} cx=".5" cy=".4" r=".6">
          <Stop o="0" c={mezcla(tema("gold-dark"), 70, "#000")} a=".55" />
          <Stop o="1" c={tema("gold")} a="0" />
        </radialGradient>
        <radialGradient id={ids.sombra} cx=".5" cy=".5" r=".5">
          <Stop o="0" c="#3B3A33" a=".28" />
          <Stop o="1" c="#3B3A33" a="0" />
        </radialGradient>
        <filter id={ids.difusa} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" /></filter>
        <Grano id={ids.grano} fuerza={0.14} />
        <DefsOlivo ids={olivo} />
      </defs>

      {/* sombra en la mesa */}
      <ellipse cx="104" cy="522" rx="92" ry="13" fill={`url(#${ids.sombra})`} />

      {/* palmatoria de bronce */}
      <g filter={`url(#${ids.grano})`}>
        <path d="M30 506 C 30 520 170 520 170 506 L 166 500 C 160 510 40 510 34 500 Z" fill={`url(#${ids.plato})`} />
        <ellipse cx="100" cy="500" rx="66" ry="12" fill={`url(#${ids.plato})`} />
        <ellipse cx="100" cy="499" rx="56" ry="8.5" fill={`url(#${ids.platoin})`} />
        <path d="M44 497 C 70 492 130 492 156 497" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1" />
      </g>

      {/* cuerpo de cera */}
      <g filter={`url(#${ids.grano})`}>
        <path d="M64 80 L64 498 C 64 506 136 506 136 498 L136 80 Z" fill={`url(#${ids.cera})`} />
        <path d="M64 80 L64 498 C 64 506 136 506 136 498 L136 80 Z" fill={`url(#${ids.cerasup})`} />
        {/* gotas de cera que bajaron del borde */}
        <path d="M118 82 C 119 96 121 104 121 112 C 121 119 115 119 115 112 C 115 104 116 96 114 84 Z" fill={`url(#${ids.cera})`} />
        <path d="M117 90 C 118 100 119 106 119 111" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M74 84 C 75 92 76 97 76 101 C 76 106 71 106 71 101 C 71 96 72 91 71 85 Z" fill={`url(#${ids.cera})`} />
        {/* luz de la llama sobre la cera (se enciende con la clase lb-encendida) */}
        <path className="lb-vela-luz" d="M64 80 L64 300 L136 300 L136 80 Z" fill={`url(#${ids.luzcera})`} />
        {/* boca de la vela con el pozo de cera derretida */}
        <ellipse cx="100" cy="80" rx="36" ry="7.5" fill={`url(#${ids.borde})`} />
        <ellipse cx="100" cy="80.5" rx="29" ry="5" fill="#E9DFC8" />
        <ellipse cx="100" cy="81" rx="24" ry="3.6" fill="#F3ECDD" />
        <path d="M65 80 C 70 85 130 85 135 80" fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="1" />
      </g>

      {/* mecha */}
      <path d="M100 81 C 100 74 101 68 99.4 61" fill="none" stroke="#3A3128" strokeWidth="2.6" strokeLinecap="round" />
      <circle className="lb-vela-brasa" cx="99.4" cy="61" r="1.8" fill="#E8913A" />

      {/* filetes dorados y cruz en relieve */}
      <g filter={`url(#${ids.grano})`}>
        <path d="M64 128 C 64 133 136 133 136 128" fill="none" stroke={`url(#${ids.oro})`} strokeWidth="2.4" />
        <path d="M64 135 C 64 140 136 140 136 135" fill="none" stroke={`url(#${ids.oro})`} strokeWidth=".9" />
        <path d="M64 460 C 64 465 136 465 136 460" fill="none" stroke={`url(#${ids.oro})`} strokeWidth=".9" />
        <path d="M64 467 C 64 472 136 472 136 467" fill="none" stroke={`url(#${ids.oro})`} strokeWidth="2.4" />
        {/* cruz: sombra, cuerpo y luz */}
        <path d="M96.5 166 h7 v20 h15 v7 h-15 v37 h-7 v-37 h-15 v-7 h15 z" fill="#5A4A2A" opacity=".18" transform="translate(1.2 1.6)" filter={`url(#${ids.difusa})`} />
        <path d="M96.5 166 h7 v20 h15 v7 h-15 v37 h-7 v-37 h-15 v-7 h15 z" fill={`url(#${ids.orov})`} />
        <path d="M97.6 167.5 v19.6 M83 187.2 h13.5" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth=".8" />
        <circle cx="100" cy="189.5" r="15" fill="none" stroke={`url(#${ids.oro})`} strokeWidth=".8" opacity=".8" />
        {/* espigas finas a los lados de la cruz */}
        <path d="M86 214 C 80 206 79 196 82 188 M114 214 C 120 206 121 196 118 188" fill="none" stroke={tema("gold")} strokeWidth=".8" opacity=".7" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} fill={tema("gold")} opacity=".7">
            <ellipse cx={81.2 + i * 0.2} cy={208 - i * 6} rx="1.4" ry="2.6" transform={`rotate(-30 ${81.2 + i * 0.2} ${208 - i * 6})`} />
            <ellipse cx={118.8 - i * 0.2} cy={208 - i * 6} rx="1.4" ry="2.6" transform={`rotate(30 ${118.8 - i * 0.2} ${208 - i * 6})`} />
          </g>
        ))}
      </g>

      {/* ramito de olivo que asoma bajo la cinta de raso (la cinta va encima, en LbCinta) */}
      <g transform="translate(96 330) rotate(-152) scale(.62)"><RamaOlivo ids={olivo} /></g>
      <g transform="translate(104 332) rotate(-24) scale(.7)"><RamaOlivo ids={olivo} /></g>

    </svg>
  );
}

/* ---------- Llama ---------- */

// SDXL: lb_llama
export function LbLlama({ className = "", style }) {
  const ids = useIds("aura", "fuego", "nucleo", "azul", "suave", "fino");
  const exterior = "M30 6 C 35 30 47 52 46 76 C 45 94 38 104 30 104 C 22 104 15 94 14 76 C 13 52 25 30 30 6 Z";
  const interior = "M30 40 C 33 56 39 68 38 82 C 37 94 34 99 30 99 C 26 99 23 94 22 82 C 21 68 27 56 30 40 Z";
  return (
    <svg className={className} style={style} viewBox="0 0 60 130" aria-hidden="true" focusable="false" overflow="visible">
      <defs>
        <radialGradient id={ids.aura} cx=".5" cy=".5" r=".5">
          <Stop o="0" c="#FFE9B8" a=".85" />
          <Stop o=".4" c="#FFDFA0" a=".35" />
          <Stop o="1" c="#FFE6B5" a="0" />
        </radialGradient>
        <radialGradient id={ids.fuego} cx=".5" cy=".78" r=".62" fx=".5" fy=".82">
          <Stop o="0" c="#FFFFFF" />
          <Stop o=".28" c="#FFF7DA" />
          <Stop o=".55" c="#FFD98A" />
          <Stop o=".8" c="#F6AE4A" />
          <Stop o="1" c="#E5822F" a=".85" />
        </radialGradient>
        <radialGradient id={ids.nucleo} cx=".5" cy=".75" r=".6">
          <Stop o="0" c="#FFFFFF" />
          <Stop o=".7" c="#FFFBEA" />
          <Stop o="1" c="#FFF0C2" a=".6" />
        </radialGradient>
        <radialGradient id={ids.azul} cx=".5" cy=".5" r=".5">
          <Stop o="0" c="#6E92D0" a=".75" />
          <Stop o="1" c="#9DB7E6" a="0" />
        </radialGradient>
        <filter id={ids.suave} x="-50%" y="-30%" width="200%" height="160%"><feGaussianBlur stdDeviation="1.6" /></filter>
        <filter id={ids.fino} x="-20%" y="-10%" width="140%" height="120%"><feGaussianBlur stdDeviation=".6" /></filter>
      </defs>
      <circle className="lb-llama-aura" cx="30" cy="74" r="44" fill={`url(#${ids.aura})`} />
      <g className="lb-llama-fuego">
        <path d={exterior} fill="#F2A54A" opacity=".55" filter={`url(#${ids.suave})`} transform="translate(0 -2) scale(1.04 1.02)" style={{ transformOrigin: "30px 104px" }} />
        <path d={exterior} fill={`url(#${ids.fuego})`} filter={`url(#${ids.fino})`} />
        <path d={interior} fill={`url(#${ids.nucleo})`} filter={`url(#${ids.fino})`} />
        <ellipse cx="30" cy="99" rx="7" ry="6" fill={`url(#${ids.azul})`} />
      </g>
    </svg>
  );
}

/* ---------- Paloma ---------- */

// SDXL: lb_paloma
export function LbPaloma({ className = "", style, ramita = false }) {
  const ids = useIds("cuerpo", "ala", "alalejos", "pico", "sombra", "grano", ...IDS_OLIVO.map((n) => `o${n}`));
  const olivo = Object.fromEntries(IDS_OLIVO.map((n) => [n, ids[`o${n}`]]));
  return (
    <svg className={className} style={style} viewBox="0 0 120 92" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={ids.cuerpo} cx=".62" cy=".35" r=".75">
          <Stop o="0" c="#FFFFFF" />
          <Stop o=".6" c="#F7F4EC" />
          <Stop o="1" c="#D9D3C5" />
        </radialGradient>
        <linearGradient id={ids.ala} x1=".2" y1="1" x2=".8" y2="0">
          <Stop o="0" c="#E9E4D8" />
          <Stop o=".45" c="#FFFFFF" />
          <Stop o="1" c="#F4F0E6" />
        </linearGradient>
        <linearGradient id={ids.alalejos} x1="0" y1="1" x2="1" y2="0">
          <Stop o="0" c="#CFC8B8" />
          <Stop o="1" c="#ECE7DC" />
        </linearGradient>
        <linearGradient id={ids.pico} x1="0" y1="0" x2="1" y2="1">
          <Stop o="0" c={tema("gold-light")} />
          <Stop o="1" c={tema("gold")} />
        </linearGradient>
        <filter id={ids.sombra} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#5A5242" floodOpacity=".22" />
        </filter>
        <Grano id={ids.grano} fuerza={0.1} semilla={11} />
        <DefsOlivo ids={olivo} />
      </defs>
      <g filter={`url(#${ids.sombra})`}>
        <g filter={`url(#${ids.grano})`}>
          {/* ala de atrás */}
          <path d="M60 44 C 58 30 62 16 72 6 C 74 16 78 22 80 28 C 84 18 92 12 102 10 C 96 20 90 30 80 42 Z" fill={`url(#${ids.alalejos})`} />
          {/* cuerpo y cola */}
          <path d="M22 54 C 32 44 52 40 70 43 C 78 37 86 33 94 35 C 101 36 105 40 105 44 L 112 46.5 L 104.5 48.5 C 101 54 92 58 82 58 C 68 64 48 66 34 62 L 8 70 C 6 66 10 62 14 60 L 4 60 C 8 56 15 55 22 54 Z" fill={`url(#${ids.cuerpo})`} />
          <path d="M8 70 L 26 61 M4 60 L 24 58 M12 66 L 28 60" stroke="#D8D1C2" strokeWidth=".8" fill="none" />
          <path d="M36 61 C 52 63 70 60 82 56" stroke="#DCD5C7" strokeWidth=".9" fill="none" />
          {/* ala de adelante con plumas largas */}
          <path d="M50 48 C 44 34 44 18 50 4 C 56 14 58 20 60 24 C 60 14 64 8 70 2 C 72 12 72 20 72 26 C 76 18 82 14 88 12 C 86 22 82 32 76 40 C 70 48 60 52 50 48 Z" fill={`url(#${ids.ala})`} />
          <path d="M54 44 C 50 34 49 22 51 10 M60 42 C 59 34 60 26 62 18 M66 41 C 67 34 68 28 70 8 M71 40 C 75 32 80 24 86 15" stroke="#DAD3C3" strokeWidth=".8" fill="none" strokeLinecap="round" />
          <path d="M52 47 C 60 49 68 47 74 42" stroke="#E3DDCF" strokeWidth="1" fill="none" />
          {/* cabeza */}
          <circle cx="97.2" cy="40.2" r="1.5" fill="#3B3A33" />
          <circle cx="97.6" cy="39.8" r=".45" fill="#fff" />
          <path d="M104.5 43 L 112 46.5 L 104.5 48.5 C 105.5 46.5 105.5 45 104.5 43 Z" fill={`url(#${ids.pico})`} />
        </g>
        {ramita && <g transform="translate(108 47) rotate(118) scale(.24)"><RamaOlivo ids={olivo} /></g>}
      </g>
    </svg>
  );
}


/* ---------- Cinta de raso con el nombre del invitado ---------- */

// La cinta cruza la vela por delante (curva de cilindro) y sus dos puntas se
// doblan hacia atrás en cola de golondrina, como un recordatorio de bautizo.
// El nombre va escrito sobre la curva de la cinta.
// SDXL: lb_cinta
export function LbCinta({ texto = "", className = "", style }) {
  const ids = useIds("raso", "rasoh", "atras", "sombra", "grano", "linea");
  const largo = Math.max(texto.length, 6);
  const tam = Math.min(27, Math.max(14, 250 / (largo * 0.46)));
  const banda = "M30 27 Q170 57 310 27 L310 61 Q170 91 30 61 Z";
  const espejo = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${340 - +x} ${y}`);
  const cola = "M48 46 L6 46 L19 63 L6 80 L48 80 Z";
  const pliegue = "M30 61 L48 80 L48 62 Z";
  return (
    <svg className={className} style={style} viewBox="0 0 340 100" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={ids.raso} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c="#FFFFFF" />
          <Stop o=".32" c={mezcla(tema("gold-light"), 40, "#fff")} />
          <Stop o=".55" c="#FFFFFF" />
          <Stop o=".8" c={mezcla(tema("gold-light"), 60, "#fff")} />
          <Stop o="1" c={mezcla(tema("gold-light"), 85, tema("gold"))} />
        </linearGradient>
        <linearGradient id={ids.rasoh} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c={tema("gold")} a=".35" />
          <Stop o=".22" c={tema("gold")} a="0" />
          <Stop o=".78" c={tema("gold")} a="0" />
          <Stop o="1" c={tema("gold")} a=".35" />
        </linearGradient>
        <linearGradient id={ids.atras} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c={mezcla(tema("gold-light"), 70, tema("gold"))} />
          <Stop o=".5" c={mezcla(tema("gold-light"), 55, "#fff")} />
          <Stop o="1" c={mezcla(tema("gold-light"), 60, tema("gold"))} />
        </linearGradient>
        <filter id={ids.sombra} x="-10%" y="-30%" width="120%" height="170%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.6" floodColor="#5A4A2A" floodOpacity=".22" />
        </filter>
        <Grano id={ids.grano} fuerza={0.07} semilla={13} />
        <path id={ids.linea} d="M30 47 Q170 77 310 47" />
      </defs>
      <g filter={`url(#${ids.sombra})`}>
        <g filter={`url(#${ids.grano})`}>
          {/* colas dobladas hacia atrás */}
          <path d={cola} fill={`url(#${ids.atras})`} />
          <path d={espejo(cola)} fill={`url(#${ids.atras})`} />
          <path d={pliegue} fill={tema("gold-dark")} opacity=".45" />
          <path d={espejo(pliegue)} fill={tema("gold-dark")} opacity=".45" />
          {/* frente de la cinta */}
          <path d={banda} fill={`url(#${ids.raso})`} />
          <path d={banda} fill={`url(#${ids.rasoh})`} />
          {/* brillo del raso */}
          <path d="M40 44 Q170 74 300 44" fill="none" stroke="#fff" strokeWidth="2.2" opacity=".75" strokeLinecap="round" />
          {/* pespunte dorado */}
          <path d="M33 31.5 Q170 61.5 307 31.5 M33 56.5 Q170 86.5 307 56.5" fill="none" stroke={tema("gold")} strokeWidth=".8" strokeDasharray="2.4 2.6" opacity=".9" />
        </g>
      </g>
      {texto && (
        <text className="lb-cinta-texto" fontSize={tam} fill={tema("gold-dark")}>
          <textPath href={`#${ids.linea}`} startOffset="50%" textAnchor="middle">{texto}</textPath>
        </text>
      )}
    </svg>
  );
}

/* ---------- Velita votiva en vaso de vidrio esmerilado ---------- */

// SDXL: lb_votiva
export function LbVotiva({ className = "", style }) {
  const ids = useIds("aura", "vidrio", "vidriof", "dentro", "cera", "fuego", "nucleo", "sombra", "difusa");
  const vaso = "M9 44 L55 44 L52.5 92 Q32 98 11.5 92 Z";
  return (
    <svg className={className} style={style} viewBox="0 0 64 100" aria-hidden="true" focusable="false" overflow="visible">
      <defs>
        <radialGradient id={ids.aura} cx=".5" cy=".5" r=".5">
          <Stop o="0" c="#FFE7B4" a=".9" />
          <Stop o=".45" c="#FFE2A6" a=".3" />
          <Stop o="1" c="#FFE9BE" a="0" />
        </radialGradient>
        <linearGradient id={ids.vidrio} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c={mezcla(tema("gold-light"), 70, tema("gold"))} />
          <Stop o=".25" c={mezcla(tema("gold-light"), 55, "#fff")} />
          <Stop o=".55" c="#FFFBF1" />
          <Stop o="1" c={mezcla(tema("gold-light"), 75, tema("gold"))} />
        </linearGradient>
        <linearGradient id={ids.vidriof} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c="#FFFFFF" a=".25" />
          <Stop o=".6" c={mezcla(tema("gold-light"), 50, "#fff")} a=".55" />
          <Stop o="1" c={mezcla(tema("gold-light"), 80, tema("gold"))} a=".7" />
        </linearGradient>
        <radialGradient id={ids.dentro} cx=".5" cy=".18" r=".7">
          <Stop o="0" c="#FFE0A0" a=".95" />
          <Stop o=".5" c="#FFEBC6" a=".4" />
          <Stop o="1" c="#FFF4DE" a="0" />
        </radialGradient>
        <linearGradient id={ids.cera} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c="#E3D6BB" />
          <Stop o=".4" c="#FFFBF2" />
          <Stop o="1" c="#D9CAA9" />
        </linearGradient>
        <radialGradient id={ids.fuego} cx=".5" cy=".8" r=".65">
          <Stop o="0" c="#FFFFFF" />
          <Stop o=".3" c="#FFF5D6" />
          <Stop o=".6" c="#FFD685" />
          <Stop o="1" c="#EE9A3E" a=".9" />
        </radialGradient>
        <radialGradient id={ids.nucleo} cx=".5" cy=".7" r=".6">
          <Stop o="0" c="#FFFFFF" />
          <Stop o="1" c="#FFF3CF" a=".7" />
        </radialGradient>
        <radialGradient id={ids.sombra} cx=".5" cy=".5" r=".5">
          <Stop o="0" c="#3B3A33" a=".3" />
          <Stop o="1" c="#3B3A33" a="0" />
        </radialGradient>
        <filter id={ids.difusa} x="-50%" y="-30%" width="200%" height="160%"><feGaussianBlur stdDeviation=".7" /></filter>
      </defs>
      <ellipse cx="32" cy="96" rx="26" ry="4" fill={`url(#${ids.sombra})`} />
      <circle className="lb-votiva-aura" cx="32" cy="40" r="32" fill={`url(#${ids.aura})`} />
      {/* pared trasera del vaso con la luz de adentro */}
      <path d={vaso} fill={`url(#${ids.vidrio})`} />
      <path d={vaso} fill={`url(#${ids.dentro})`} />
      {/* cera y mecha */}
      <path d="M14.5 60 L49.5 60 L48.6 90 Q32 94 15.4 90 Z" fill={`url(#${ids.cera})`} opacity=".9" />
      <ellipse cx="32" cy="60" rx="17.5" ry="3.4" fill="#FBF4E4" />
      <path d="M32 60 L32 53.5" stroke="#3A3128" strokeWidth="1.4" strokeLinecap="round" />
      {/* llama */}
      <g className="lb-votiva-llama">
        <path d="M32 24 C 35 33 39 41 38.5 47.5 C 38 52.5 35.5 55 32 55 C 28.5 55 26 52.5 25.5 47.5 C 25 41 29 33 32 24 Z" fill={`url(#${ids.fuego})`} filter={`url(#${ids.difusa})`} />
        <path d="M32 37 C 33.6 43 35.4 47 35 50.5 C 34.7 53 33.4 54 32 54 C 30.6 54 29.3 53 29 50.5 C 28.6 47 30.4 43 32 37 Z" fill={`url(#${ids.nucleo})`} />
      </g>
      {/* frente esmerilado, brillos y filete dorado */}
      <path d={vaso} fill={`url(#${ids.vidriof})`} />
      <path d="M14.5 48 L17.6 48 L16.6 89 L14.4 88 Z" fill="#fff" opacity=".6" />
      <path d="M47.5 48 L49 48 L48 88 L46.8 88.6 Z" fill="#fff" opacity=".35" />
      <path d="M12.3 84 Q32 89.5 51.7 84" fill="none" stroke={tema("gold")} strokeWidth="1.3" />
      <path d="M12.6 80.5 Q32 86 51.4 80.5" fill="none" stroke={tema("gold")} strokeWidth=".6" opacity=".8" />
      <ellipse cx="32" cy="44" rx="23" ry="3.6" fill="none" stroke="#fff" strokeWidth="1.3" opacity=".9" />
      <ellipse cx="32" cy="44.6" rx="23" ry="3.6" fill="none" stroke={tema("gold")} strokeWidth=".5" opacity=".6" />
    </svg>
  );
}

/* ---------- Chispa y cerilla (el llamado a tocar) ---------- */

const estrella = (cx, cy, r) =>
  `M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r} Z`;

// SDXL: lb_chispa
export function LbChispa({ className = "", style }) {
  const ids = useIds("brillo");
  return (
    <svg className={className} style={style} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={ids.brillo} cx=".5" cy=".5" r=".5">
          <Stop o="0" c="#FFF6DC" a="1" />
          <Stop o=".4" c="#FFE1A0" a=".5" />
          <Stop o="1" c="#FFE1A0" a="0" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill={`url(#${ids.brillo})`} />
      <path d={estrella(20, 20, 13)} fill="#FFF8E6" />
      <path d={estrella(20, 20, 7)} fill="#fff" transform="rotate(45 20 20)" opacity=".9" />
    </svg>
  );
}

// SDXL: lb_cerilla
export function LbCerilla({ className = "", style }) {
  const ids = useIds("palo", "cabeza", "fuego", "aura", "difusa");
  return (
    <svg className={className} style={style} viewBox="0 0 132 48" aria-hidden="true" focusable="false" overflow="visible">
      <defs>
        <linearGradient id={ids.palo} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c="#F1DDB4" />
          <Stop o=".5" c="#DDBB82" />
          <Stop o="1" c="#B98E55" />
        </linearGradient>
        <radialGradient id={ids.cabeza} cx=".35" cy=".3" r=".8">
          <Stop o="0" c="#C9765A" />
          <Stop o=".5" c="#8E3A28" />
          <Stop o="1" c="#4E1E18" />
        </radialGradient>
        <radialGradient id={ids.fuego} cx=".5" cy=".8" r=".65">
          <Stop o="0" c="#FFFFFF" />
          <Stop o=".3" c="#FFF2C8" />
          <Stop o=".62" c="#FFC96E" />
          <Stop o="1" c="#E7792C" a=".9" />
        </radialGradient>
        <radialGradient id={ids.aura} cx=".5" cy=".5" r=".5">
          <Stop o="0" c="#FFE4A6" a=".9" />
          <Stop o="1" c="#FFE4A6" a="0" />
        </radialGradient>
        <filter id={ids.difusa} x="-50%" y="-30%" width="200%" height="160%"><feGaussianBlur stdDeviation=".6" /></filter>
      </defs>
      <g className="lb-cerilla-aura"><circle cx="17" cy="20" r="22" fill={`url(#${ids.aura})`} /></g>
      <path d="M22 25.4 L126 22.6 Q128.6 24.6 126.2 27.2 L22 31 Z" fill={`url(#${ids.palo})`} />
      <path d="M30 27 L118 24.6" stroke="#fff" strokeOpacity=".55" strokeWidth=".8" />
      <path d="M44 29 L96 27.6" stroke="#A47B45" strokeOpacity=".35" strokeWidth=".6" />
      <ellipse cx="17" cy="28" rx="9.5" ry="7.2" fill={`url(#${ids.cabeza})`} transform="rotate(-6 17 28)" />
      <ellipse cx="14" cy="25.4" rx="3" ry="1.8" fill="#fff" opacity=".35" />
      <g className="lb-cerilla-llama">
        <path d="M16 0 C 20.5 9 26 15 25.5 21.5 C 25 27.5 21 31 16.5 31 C 12 31 8.5 27.5 8 21.5 C 7.6 15 12 9 16 0 Z" fill={`url(#${ids.fuego})`} filter={`url(#${ids.difusa})`} />
      </g>
      <g className="lb-chispas" fill="#FFE7A8">
        <path d={estrella(4, 12, 4)} />
        <path d={estrella(30, 9, 3.2)} />
        <path d={estrella(2, 34, 2.6)} />
        <path d={estrella(33, 38, 2.2)} />
      </g>
    </svg>
  );
}

/* ---------- Pila bautismal de mármol con agua ---------- */

// SDXL: lb_pila
export function LbPila({ className = "", style }) {
  const ids = useIds("marmol", "sombreado", "agua", "reflejo", "oro", "sombra", "grano", "blando", "luz");
  const copa = "M18 58 C 22 88 62 106 110 106 C 158 106 198 88 202 58 Z";
  const pie = "M93 104 C 97 112 99 118 97 124 C 94 132 87 138 82 142 L138 142 C 133 138 126 132 123 124 C 121 118 123 112 127 104 Z";
  return (
    <svg className={className} style={style} viewBox="0 0 220 180" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={ids.marmol} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c="#D3CBBC" />
          <Stop o=".18" c="#ECE7DD" />
          <Stop o=".4" c="#FFFFFF" />
          <Stop o=".6" c="#F5F1EA" />
          <Stop o=".84" c="#DCD4C6" />
          <Stop o="1" c="#C8BEAC" />
        </linearGradient>
        <linearGradient id={ids.sombreado} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c="#fff" a="0" />
          <Stop o=".55" c="#fff" a="0" />
          <Stop o="1" c="#6E6553" a=".2" />
        </linearGradient>
        <radialGradient id={ids.agua} cx=".42" cy=".4" r=".7">
          <Stop o="0" c="#F6FCFB" />
          <Stop o=".4" c="#D6EAEA" />
          <Stop o=".8" c="#AFCFD3" />
          <Stop o="1" c="#94B8BE" />
        </radialGradient>
        <linearGradient id={ids.reflejo} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c="#fff" a="0" />
          <Stop o=".5" c="#fff" a=".95" />
          <Stop o="1" c="#fff" a="0" />
        </linearGradient>
        <linearGradient id={ids.oro} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c={tema("gold-dark")} />
          <Stop o=".35" c={tema("gold")} />
          <Stop o=".5" c={mezcla(tema("gold-light"), 60, "#fff")} />
          <Stop o=".7" c={tema("gold")} />
          <Stop o="1" c={tema("gold-dark")} />
        </linearGradient>
        <radialGradient id={ids.sombra} cx=".5" cy=".5" r=".5">
          <Stop o="0" c="#3B3A33" a=".24" />
          <Stop o="1" c="#3B3A33" a="0" />
        </radialGradient>
        <radialGradient id={ids.luz} cx=".5" cy=".5" r=".5">
          <Stop o="0" c="#FFF6DE" a=".9" />
          <Stop o="1" c="#FFF6DE" a="0" />
        </radialGradient>
        <filter id={ids.blando} x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="1.2" /></filter>
        <Grano id={ids.grano} fuerza={0.05} semilla={5} />
      </defs>
      <ellipse cx="110" cy="168" rx="86" ry="9" fill={`url(#${ids.sombra})`} />
      <g filter={`url(#${ids.grano})`}>
        {/* basa de dos escalones */}
        <path d="M50 152 L170 152 L174 162 Q110 171 46 162 Z" fill={`url(#${ids.marmol})`} />
        <path d="M50 152 L170 152 L174 162 Q110 171 46 162 Z" fill={`url(#${ids.sombreado})`} />
        <ellipse cx="110" cy="152" rx="60" ry="5" fill="#F7F4EE" />
        <path d="M64 142 L156 142 L160 151 Q110 157 60 151 Z" fill={`url(#${ids.marmol})`} />
        <ellipse cx="110" cy="142" rx="46" ry="4" fill="#F8F5EF" />
        {/* pie abalaustrado con nudo y anillo de oro */}
        <path d={pie} fill={`url(#${ids.marmol})`} />
        <path d={pie} fill={`url(#${ids.sombreado})`} />
        <ellipse cx="110" cy="124" rx="14.5" ry="3.6" fill={`url(#${ids.marmol})`} stroke={`url(#${ids.oro})`} strokeWidth="1" />
        <path d="M101 107 C 104 116 104 120 102 126 M119 107 C 116 116 116 120 118 126" stroke="#fff" strokeWidth=".9" opacity=".6" fill="none" />
        <ellipse cx="110" cy="104.5" rx="21" ry="4.4" fill="#EDE8DE" />
        {/* copa */}
        <path d={copa} fill={`url(#${ids.marmol})`} />
        <path d={copa} fill={`url(#${ids.sombreado})`} />
        {/* gallones muy suaves */}
        {[-64, -43, -21.5, 0, 21.5, 43, 64].map((dx) => (
          <path key={dx} d={`M${110 + dx} 74 C ${110 + dx * 0.97} 86 ${110 + dx * 0.88} 95 ${110 + dx * 0.74} 103`} stroke="#B9AF9C" strokeWidth=".7" opacity=".35" fill="none" />
        ))}
        {[-54, -32, -11, 11, 32, 54].map((dx) => (
          <path key={dx} d={`M${110 + dx} 75 C ${110 + dx * 0.97} 87 ${110 + dx * 0.88} 96 ${110 + dx * 0.74} 103`} stroke="#fff" strokeWidth="1.1" opacity=".5" fill="none" />
        ))}
        {/* vetas del mármol */}
        <path d="M34 72 C 46 78 50 86 66 92 C 74 95 78 99 86 100" stroke="#BDB4A3" strokeWidth=".55" opacity=".45" fill="none" />
        <path d="M150 80 C 160 82 168 78 182 74" stroke="#BDB4A3" strokeWidth=".5" opacity=".4" fill="none" />
        <path d="M70 158 C 84 160 96 156 110 160" stroke="#BDB4A3" strokeWidth=".45" opacity=".4" fill="none" />
        <path d="M24 70 C 60 81 160 81 196 70" stroke={`url(#${ids.oro})`} strokeWidth="1.1" fill="none" />
        {/* labio de la copa y agua */}
        <ellipse cx="110" cy="58" rx="92" ry="17" fill="#F7F3EC" />
        <ellipse cx="110" cy="58" rx="92" ry="17" fill="none" stroke={`url(#${ids.oro})`} strokeWidth=".9" />
        <ellipse cx="110" cy="59" rx="83.5" ry="12.8" fill="#D9D1C3" />
        <ellipse cx="110" cy="60.2" rx="82" ry="11.6" fill={`url(#${ids.agua})`} />
        <path d="M30 58 C 60 50 160 50 190 58" stroke="#6E6553" strokeOpacity=".16" strokeWidth="2.2" fill="none" filter={`url(#${ids.blando})`} />
      </g>
      {/* luz del arco reflejada en el agua */}
      <ellipse cx="104" cy="58" rx="28" ry="5" fill={`url(#${ids.luz})`} />
      <g className="lb-ondas" fill="none" stroke="#fff" strokeLinecap="round">
        <ellipse cx="104" cy="60" rx="14" ry="2.4" strokeWidth=".8" opacity=".85" />
        <ellipse cx="104" cy="60" rx="27" ry="4.4" strokeWidth=".6" opacity=".55" />
        <ellipse cx="104" cy="60" rx="41" ry="6.6" strokeWidth=".45" opacity=".3" />
      </g>
      <path d="M50 55.5 C 70 52.5 94 51.8 112 52.4" stroke={`url(#${ids.reflejo})`} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Concha bautismal con gota de agua y luz (cierre) ---------- */

// SDXL: lb_concha
export function LbConcha({ className = "", style }) {
  const ids = useIds("luz", "rayo", "nacar", "sombreado", "oro", "gota", "charco", "grano", "sombra");
  const H = { x: 110, y: 46 };
  const N = 9;
  const pt = (deg, r) => [H.x + Math.cos((deg * Math.PI) / 180) * r, H.y + Math.sin((deg * Math.PI) / 180) * r];
  const borde = [];
  for (let d = 28; d <= 152; d += 1) {
    const r = 70 + 7 * Math.abs(Math.sin(((d - 28) / 124) * Math.PI * N));
    borde.push(pt(d, r).map((v) => v.toFixed(1)).join(" "));
  }
  const concha = `M${H.x} ${H.y} L${borde.join(" L")} Z`;
  const costillas = Array.from({ length: N + 1 }, (_, k) => 28 + (k * 124) / N);
  const crestas = Array.from({ length: N }, (_, k) => 28 + ((k + 0.5) * 124) / N);
  return (
    <svg className={className} style={style} viewBox="0 0 220 236" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={ids.luz} cx=".5" cy=".5" r=".5">
          <Stop o="0" c="#FFF7E0" a="1" />
          <Stop o=".45" c={tema("gold-light")} a=".55" />
          <Stop o="1" c={tema("gold-light")} a="0" />
        </radialGradient>
        <linearGradient id={ids.rayo} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c="#fff" a=".85" />
          <Stop o="1" c="#fff" a="0" />
        </linearGradient>
        <radialGradient id={ids.nacar} cx=".5" cy=".95" r="1">
          <Stop o="0" c="#FFFFFF" />
          <Stop o=".35" c="#FBF6EC" />
          <Stop o=".7" c={mezcla(tema("gold-light"), 75, "#fff")} />
          <Stop o="1" c={tema("gold")} />
        </radialGradient>
        <linearGradient id={ids.sombreado} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c={tema("gold-dark")} a=".22" />
          <Stop o=".4" c={tema("gold-dark")} a="0" />
          <Stop o=".7" c="#fff" a=".2" />
          <Stop o="1" c={tema("gold-dark")} a=".2" />
        </linearGradient>
        <linearGradient id={ids.oro} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c={tema("gold-dark")} />
          <Stop o=".45" c={mezcla(tema("gold-light"), 55, "#fff")} />
          <Stop o="1" c={tema("gold-dark")} />
        </linearGradient>
        <radialGradient id={ids.gota} cx=".38" cy=".6" r=".7">
          <Stop o="0" c="#FFFFFF" />
          <Stop o=".5" c="#D7ECEE" />
          <Stop o="1" c="#8DB6BE" />
        </radialGradient>
        <radialGradient id={ids.charco} cx=".5" cy=".5" r=".5">
          <Stop o="0" c="#E3F1F1" a=".95" />
          <Stop o=".7" c="#B7D4D8" a=".5" />
          <Stop o="1" c="#B7D4D8" a="0" />
        </radialGradient>
        <filter id={ids.sombra} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#5A4A2A" floodOpacity=".2" />
        </filter>
        <Grano id={ids.grano} fuerza={0.06} semilla={17} />
      </defs>
      {/* luz que baja detrás de la concha */}
      <g className="lb-concha-luz">
        <circle cx="110" cy="92" r="96" fill={`url(#${ids.luz})`} />
        {[-38, -20, 0, 20, 38].map((a, i) => (
          <path key={a} d="M107 0 L113 0 L124 236 L96 236 Z" fill={`url(#${ids.rayo})`} opacity={i % 2 ? 0.35 : 0.55} transform={`rotate(${a} 110 0)`} />
        ))}
      </g>
      {/* agua que recibe la gota */}
      <ellipse cx="110" cy="214" rx="56" ry="8" fill={`url(#${ids.charco})`} />
      <ellipse className="lb-concha-onda" cx="110" cy="214" rx="20" ry="3.4" fill="none" stroke="#fff" strokeWidth="1.2" />
      <ellipse className="lb-concha-onda lb-concha-onda-2" cx="110" cy="214" rx="20" ry="3.4" fill="none" stroke="#fff" strokeWidth=".8" />
      {/* concha bocabajo, vertiendo */}
      <g filter={`url(#${ids.sombra})`}>
        <g filter={`url(#${ids.grano})`}>
          <path d={concha} fill={`url(#${ids.nacar})`} />
          <path d={concha} fill={`url(#${ids.sombreado})`} />
          {costillas.slice(1, -1).map((d) => {
            const [x, y] = pt(d, 72);
            return <path key={`c${d}`} d={`M${H.x} ${H.y + 4} L${x.toFixed(1)} ${y.toFixed(1)}`} stroke={tema("gold-dark")} strokeOpacity=".32" strokeWidth=".9" />;
          })}
          {crestas.map((d) => {
            const [x, y] = pt(d, 74);
            return <path key={`r${d}`} d={`M${H.x} ${H.y + 8} L${x.toFixed(1)} ${y.toFixed(1)}`} stroke="#fff" strokeOpacity=".7" strokeWidth="1.3" strokeLinecap="round" />;
          })}
          {[40, 56].map((r) => (
            <path key={r} d={`M${pt(30, r).join(" ")} A ${r} ${r} 0 0 1 ${pt(150, r).join(" ")}`} fill="none" stroke={tema("gold-dark")} strokeOpacity=".14" strokeWidth=".7" />
          ))}
          <path d={`M${H.x} ${H.y} L${borde.join(" L")}`} fill="none" stroke={tema("gold")} strokeWidth=".9" opacity=".8" />
          {/* orejas de la charnela */}
          <path d="M88 40 L132 40 L124 54 L96 54 Z" fill={`url(#${ids.oro})`} />
          <path d="M90 41.5 L130 41.5" stroke="#fff" strokeOpacity=".7" strokeWidth=".8" />
        </g>
      </g>
      {/* gota que cae del borde */}
      <g className="lb-concha-gota">
        <path d="M110 126 C 113.2 132 115.4 136 115.4 139.4 C 115.4 143 113 145.6 110 145.6 C 107 145.6 104.6 143 104.6 139.4 C 104.6 136 106.8 132 110 126 Z" fill={`url(#${ids.gota})`} stroke="#8DB6BE" strokeOpacity=".5" strokeWidth=".5" />
        <ellipse cx="108" cy="139" rx="1.4" ry="2.4" fill="#fff" opacity=".9" />
      </g>
    </svg>
  );
}

/* ---------- Campanita (botón de música) ---------- */

// SDXL: lb_campana
export function LbCampana({ className = "", style }) {
  const ids = useIds("oro", "boca");
  return (
    <svg className={className} style={style} viewBox="0 0 44 50" aria-hidden="true" focusable="false" overflow="visible">
      <defs>
        <linearGradient id={ids.oro} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c={tema("gold-dark")} />
          <Stop o=".3" c={tema("gold")} />
          <Stop o=".45" c={mezcla(tema("gold-light"), 55, "#fff")} />
          <Stop o=".65" c={tema("gold")} />
          <Stop o="1" c={tema("gold-dark")} />
        </linearGradient>
        <linearGradient id={ids.boca} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c={tema("gold")} />
          <Stop o="1" c={tema("gold-dark")} />
        </linearGradient>
      </defs>
      <g className="lb-campana-ondas" fill="none" stroke={tema("gold")} strokeWidth="1.4" strokeLinecap="round">
        <path d="M38 14 Q42 19 38 25" />
        <path d="M41.5 10 Q48 19 41.5 29" opacity=".6" />
        <path d="M6 14 Q2 19 6 25" />
        <path d="M2.5 10 Q-4 19 2.5 29" opacity=".6" />
      </g>
      <g className="lb-campana-cuerpo">
        <path d="M18.5 8.5 Q22 1.5 25.5 8.5" fill="none" stroke={tema("gold-dark")} strokeWidth="2" strokeLinecap="round" />
        <circle className="lb-campana-badajo" cx="22" cy="42.5" r="3.3" fill={`url(#${ids.boca})`} />
        <path d="M22 7 C 13 7 10.5 15 10.5 23 C 10.5 31 8.5 35 5 38.5 L 39 38.5 C 35.5 35 33.5 31 33.5 23 C 33.5 15 31 7 22 7 Z" fill={`url(#${ids.oro})`} />
        <path d="M4 37.5 Q22 41.5 40 37.5 L40 40 Q22 44.5 4 40 Z" fill={`url(#${ids.boca})`} />
        <path d="M16.5 12 C 14 17 14 26 13.4 32" stroke="#fff" strokeOpacity=".65" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
