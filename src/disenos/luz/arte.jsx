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

/* ---------- Vela bautismal con cinta y ramito de olivo ---------- */

// SDXL: lb_vela
export function LbVela({ className = "", style }) {
  const ids = useIds(
    "cera", "cerasup", "luzcera", "borde", "oro", "orov", "cinta", "cintav", "pliegue", "plato", "platoin", "sombra", "difusa", "grano",
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
        <linearGradient id={ids.cinta} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c="#FFFFFF" />
          <Stop o=".45" c={mezcla(tema("gold-light"), 45, "#fff")} />
          <Stop o="1" c={mezcla(tema("gold-light"), 85, tema("gold"))} />
        </linearGradient>
        <linearGradient id={ids.cintav} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c={mezcla(tema("gold-light"), 80, tema("gold"))} />
          <Stop o=".35" c="#FFFFFF" />
          <Stop o=".7" c={mezcla(tema("gold-light"), 50, "#fff")} />
          <Stop o="1" c={mezcla(tema("gold-light"), 75, tema("gold"))} />
        </linearGradient>
        <linearGradient id={ids.pliegue} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c={tema("gold-dark")} a=".35" />
          <Stop o="1" c={tema("gold-dark")} a="0" />
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

      {/* cinta: vuelta alrededor de la vela */}
      <g filter={`url(#${ids.grano})`}>
        <path d="M64 318 C 64 326 136 326 136 318 L136 334 C 136 342 64 342 64 334 Z" fill={`url(#${ids.cinta})`} />
        <path d="M64 318 C 64 326 136 326 136 318" fill="none" stroke={tema("gold")} strokeWidth=".8" opacity=".9" />
        <path d="M64 334 C 64 342 136 342 136 334" fill="none" stroke={tema("gold")} strokeWidth=".8" opacity=".9" />
        <path d="M64 326 C 64 333 136 333 136 326" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".7" />
      </g>

      {/* ramito de olivo metido en el lazo */}
      <g transform="translate(96 330) rotate(-152) scale(.62)"><RamaOlivo ids={olivo} /></g>
      <g transform="translate(104 332) rotate(-24) scale(.7)"><RamaOlivo ids={olivo} /></g>

      {/* lazo */}
      <g filter={`url(#${ids.grano})`}>
        {/* colas */}
        <path d="M96 334 C 92 360 82 384 74 414 L 84 408 L 88 420 C 96 390 102 362 102 336 Z" fill={`url(#${ids.cintav})`} />
        <path d="M104 334 C 110 362 120 386 132 410 L 121 407 L 119 420 C 108 392 100 364 99 336 Z" fill={`url(#${ids.cintav})`} />
        <path d="M97 344 C 94 366 88 388 81 410" fill="none" stroke={tema("gold-dark")} strokeOpacity=".22" strokeWidth="1.2" />
        <path d="M104 346 C 109 368 116 388 125 406" fill="none" stroke={tema("gold-dark")} strokeOpacity=".22" strokeWidth="1.2" />
        {/* lazadas */}
        <path d="M98 326 C 82 304 56 300 52 314 C 48 330 72 340 98 332 Z" fill={`url(#${ids.cinta})`} />
        <path d="M102 326 C 118 304 144 300 148 314 C 152 330 128 340 102 332 Z" fill={`url(#${ids.cinta})`} />
        <path d="M98 328 C 86 316 68 312 60 316 C 70 324 84 328 98 330 Z" fill={`url(#${ids.pliegue})`} />
        <path d="M102 328 C 114 316 132 312 140 316 C 130 324 116 328 102 330 Z" fill={`url(#${ids.pliegue})`} />
        <path d="M56 312 C 60 306 70 304 80 308 M144 312 C 140 306 130 304 120 308" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity=".9" />
        <path d="M98 326 C 82 304 56 300 52 314 C 48 330 72 340 98 332 Z M102 326 C 118 304 144 300 148 314 C 152 330 128 340 102 332 Z" fill="none" stroke={tema("gold")} strokeWidth=".7" opacity=".7" />
        {/* nudo */}
        <path d="M93 322 Q 100 318 107 322 L 108 336 Q 100 340 92 336 Z" fill={`url(#${ids.cintav})`} stroke={tema("gold")} strokeWidth=".6" />
        <path d="M95 325 Q 100 323 104 325" fill="none" stroke="#fff" strokeWidth="1" />
      </g>
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

/* ---------- Pila bautismal con agua ---------- */

// SDXL: lb_pila
export function LbPila({ className = "", style }) {
  const ids = useIds("piedra", "piedrav", "agua", "brillo", "oro", "concha", "sombra", "grano");
  return (
    <svg className={className} style={style} viewBox="0 0 200 178" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={ids.piedra} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c="#CFC7B6" />
          <Stop o=".25" c="#EEE9DE" />
          <Stop o=".45" c="#FFFFFF" />
          <Stop o=".7" c="#ECE6D9" />
          <Stop o="1" c="#C2B9A6" />
        </linearGradient>
        <linearGradient id={ids.piedrav} x1="0" y1="0" x2="0" y2="1">
          <Stop o="0" c="#fff" a="0" />
          <Stop o="1" c="#6E6553" a=".22" />
        </linearGradient>
        <radialGradient id={ids.agua} cx=".42" cy=".38" r=".7">
          <Stop o="0" c="#F3FAF9" />
          <Stop o=".45" c="#CFE4E5" />
          <Stop o=".85" c="#A7C9CE" />
          <Stop o="1" c="#8FB4BA" />
        </radialGradient>
        <linearGradient id={ids.brillo} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c="#fff" a="0" />
          <Stop o=".5" c="#fff" a=".9" />
          <Stop o="1" c="#fff" a="0" />
        </linearGradient>
        <linearGradient id={ids.oro} x1="0" y1="0" x2="1" y2="0">
          <Stop o="0" c={tema("gold-dark")} />
          <Stop o=".35" c={tema("gold")} />
          <Stop o=".5" c={mezcla(tema("gold-light"), 60, "#fff")} />
          <Stop o=".7" c={tema("gold")} />
          <Stop o="1" c={tema("gold-dark")} />
        </linearGradient>
        <radialGradient id={ids.concha} cx=".5" cy=".9" r="1">
          <Stop o="0" c={mezcla(tema("gold-light"), 50, "#fff")} />
          <Stop o=".6" c={tema("gold")} />
          <Stop o="1" c={tema("gold-dark")} />
        </radialGradient>
        <radialGradient id={ids.sombra} cx=".5" cy=".5" r=".5">
          <Stop o="0" c="#3B3A33" a=".25" />
          <Stop o="1" c="#3B3A33" a="0" />
        </radialGradient>
        <Grano id={ids.grano} fuerza={0.18} semilla={5} />
      </defs>
      <ellipse cx="100" cy="166" rx="84" ry="10" fill={`url(#${ids.sombra})`} />
      <g filter={`url(#${ids.grano})`}>
        {/* base escalonada */}
        <path d="M44 150 L 156 150 L 160 162 C 160 168 40 168 40 162 Z" fill={`url(#${ids.piedra})`} />
        <path d="M44 150 L 156 150 L 160 162 C 160 168 40 168 40 162 Z" fill={`url(#${ids.piedrav})`} />
        <ellipse cx="100" cy="150" rx="56" ry="6" fill="#F6F2EA" />
        <path d="M58 142 L 142 142 L 146 150 C 146 155 54 155 54 150 Z" fill={`url(#${ids.piedra})`} />
        <ellipse cx="100" cy="142" rx="42" ry="4.5" fill="#F7F3EC" />
        {/* columna */}
        <path d="M78 98 C 86 110 86 126 76 142 L 124 142 C 114 126 114 110 122 98 Z" fill={`url(#${ids.piedra})`} />
        <path d="M78 98 C 86 110 86 126 76 142 L 124 142 C 114 126 114 110 122 98 Z" fill={`url(#${ids.piedrav})`} />
        <path d="M92 104 C 94 116 94 128 90 140 M108 104 C 106 116 106 128 110 140" stroke="#D3CBBB" strokeWidth=".8" fill="none" />
        <path d="M80 120 C 92 124 108 124 120 120" stroke={`url(#${ids.oro})`} strokeWidth="1.6" fill="none" />
        {/* copa */}
        <path d="M14 54 C 18 88 58 104 100 104 C 142 104 182 88 186 54 Z" fill={`url(#${ids.piedra})`} />
        <path d="M14 54 C 18 88 58 104 100 104 C 142 104 182 88 186 54 Z" fill={`url(#${ids.piedrav})`} />
        {/* gallones tallados en la copa */}
        {[-62, -42, -21, 0, 21, 42, 62].map((dx) => (
          <path key={dx} d={`M${100 + dx} 70 C ${100 + dx * 0.98} 82 ${100 + dx * 0.9} 92 ${100 + dx * 0.78} 100`} stroke="#D6CEBE" strokeWidth=".9" fill="none" />
        ))}
        <path d="M18 70 C 50 80 150 80 182 70" stroke={`url(#${ids.oro})`} strokeWidth="1.4" fill="none" />
        {/* borde de la copa */}
        <ellipse cx="100" cy="54" rx="88" ry="17" fill="#F4EFE5" />
        <ellipse cx="100" cy="54" rx="88" ry="17" fill="none" stroke={`url(#${ids.oro})`} strokeWidth="1.6" />
        {/* agua */}
        <ellipse cx="100" cy="55.5" rx="78" ry="12.5" fill={`url(#${ids.agua})`} />
        <ellipse cx="100" cy="53" rx="78" ry="10" fill="none" stroke="#5E7C80" strokeOpacity=".18" strokeWidth="2" />
        <g className="lb-ondas" fill="none" stroke="#fff" strokeLinecap="round">
          <ellipse cx="86" cy="56" rx="22" ry="3.6" strokeWidth=".9" opacity=".8" />
          <ellipse cx="86" cy="56" rx="36" ry="6" strokeWidth=".7" opacity=".5" />
          <ellipse cx="86" cy="56" rx="50" ry="8.4" strokeWidth=".5" opacity=".3" />
        </g>
        <path d="M40 51 C 60 47 84 46 104 47" stroke={`url(#${ids.brillo})`} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* concha bautismal apoyada en el borde */}
        <g transform="translate(150 40) rotate(18)">
          <path d="M0 18 C -16 14 -20 -2 -12 -12 C -6 -18 6 -18 12 -12 C 20 -2 16 14 0 18 Z" fill={`url(#${ids.concha})`} />
          {[-10, -5, 0, 5, 10].map((a) => (
            <path key={a} d={`M0 16 L ${a * 1.2} -14`} stroke={tema("gold-dark")} strokeOpacity=".5" strokeWidth=".7" />
          ))}
          <path d="M-5 16 L 5 16 L 3 20 L -3 20 Z" fill={tema("gold-dark")} />
        </g>
      </g>
    </svg>
  );
}
