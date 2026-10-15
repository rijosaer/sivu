import { useId } from "react";

// Arte de «Osito», todo en SVG semi-realista: capas de degradados, sombras
// suaves, curvas orgánicas y un grano fino. Cada pieza lleva encima el nombre
// con que se pintaría en SDXL para poder cambiarla luego por un .webp.
// Los colores de marca salen del tema (--color-gold = beige, --color-seal =
// salvia, etc.); la madera, el verde del eucalipto y el rubor son fijos.

// Ids únicos por instancia (las piezas se repiten en la página).
function useUid() {
  return `os${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

const C = {
  papel: "rgb(var(--color-paper))",
  tinta: "rgb(var(--color-ink))",
  beige: "rgb(var(--color-gold))",
  claro: "rgb(var(--color-gold-light))",
  oscuro: "rgb(var(--color-gold-dark))",
  blanco: "rgb(var(--color-marble))",
  salvia: "rgb(var(--color-seal))",
};
const mezcla = (a, b, p) => `color-mix(in srgb, ${a} ${p}%, ${b})`;

// Una parada de degradado que puede leer variables CSS.
function P({ o, c, a = 1 }) {
  return <stop offset={o} style={{ stopColor: c, stopOpacity: a }} />;
}

// Grano fino: ruido fractal teñido, solo dentro de la forma.
function Grano({ id, fuerza = 0.5, freq = 0.95, semilla = 4 }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2" seed={semilla} stitchTiles="stitch" result="r" />
      <feColorMatrix in="r" type="matrix" values={`0 0 0 0 .32  0 0 0 0 .26  0 0 0 0 .2  ${fuerza} 0 0 0 ${-fuerza * 0.42}`} result="g" />
      <feComposite in="g" in2="SourceGraphic" operator="in" result="gc" />
      <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="gc" /></feMerge>
    </filter>
  );
}

function Difuso({ id, d = 4 }) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={d} />
    </filter>
  );
}

// Tonos de pintura para cubos, nubes de fieltro y globos.
const TONOS = {
  beige: { base: C.beige, luz: mezcla(C.beige, "white", 62), sombra: mezcla(C.beige, C.oscuro, 55) },
  salvia: { base: C.salvia, luz: mezcla(C.salvia, "white", 62), sombra: mezcla(C.salvia, C.tinta, 72) },
  claro: { base: C.claro, luz: mezcla(C.claro, "white", 50), sombra: mezcla(C.claro, C.beige, 55) },
  blanco: { base: mezcla(C.blanco, C.claro, 80), luz: C.blanco, sombra: mezcla(C.claro, C.beige, 70) },
};

// SDXL: os_osito
// Osito de peluche beige sentado de frente, con lazo salvia en el cuello.
export function OsOsito({ className = "" }) {
  const u = useUid();
  const piel = `${u}p`, claro = `${u}c`, lazo = `${u}l`, pelo = `${u}f`, sombra = `${u}s`, cuerpo = `${u}k`, cara = `${u}g`;
  const brazo = "M88 134 C 64 140 46 164 48 188 C 50 203 68 207 77 196 C 88 182 98 160 102 146 Z";
  const pierna = "M70 194 C 44 198 28 220 38 238 C 48 252 88 250 102 232 C 108 218 98 198 70 194 Z";
  const oreja = <><circle cx="74" cy="36" r="22" fill={`url(#${piel})`} /><circle cx="75" cy="38" r="12.5" fill={`url(#${claro})`} /></>;
  return (
    <svg className={className} viewBox="0 0 240 256" aria-hidden="true">
      <defs>
        <radialGradient id={piel} cx=".36" cy=".28" r=".85">
          <P o="0" c={mezcla(C.beige, "white", 45)} />
          <P o=".5" c={C.beige} />
          <P o="1" c={mezcla(C.oscuro, C.beige, 70)} />
        </radialGradient>
        <radialGradient id={claro} cx=".4" cy=".32" r=".8">
          <P o="0" c={mezcla(C.claro, "white", 40)} />
          <P o="1" c={mezcla(C.claro, C.beige, 62)} />
        </radialGradient>
        <linearGradient id={lazo} x1="0" y1="0" x2="0" y2="1">
          <P o="0" c={mezcla(C.salvia, "white", 70)} />
          <P o="1" c={mezcla(C.salvia, C.tinta, 78)} />
        </linearGradient>
        <filter id={pelo} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="3.4" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="1.7" numOctaves="2" seed="9" result="t2" />
          <feColorMatrix in="t2" type="matrix" values="0 0 0 0 .3  0 0 0 0 .22  0 0 0 0 .14  .75 0 0 0 -.3" result="g" />
          <feComposite in="g" in2="d" operator="in" result="gc" />
          <feMerge><feMergeNode in="d" /><feMergeNode in="gc" /></feMerge>
        </filter>
        <Difuso id={sombra} d={5} />
        <clipPath id={cuerpo}><path d="M120 116 C 160 116 184 150 184 190 C 184 224 158 238 120 238 C 82 238 56 224 56 190 C 56 150 80 116 120 116 Z" /></clipPath>
        <clipPath id={cara}><path d="M120 22 C 156 22 178 46 178 78 C 178 112 154 134 120 134 C 86 134 62 112 62 78 C 62 46 84 22 120 22 Z" /></clipPath>
      </defs>

      <ellipse cx="120" cy="246" rx="92" ry="9" style={{ fill: C.oscuro }} opacity=".22" filter={`url(#${sombra})`} />

      <g filter={`url(#${pelo})`}>
        {/* Orejas detrás de la cabeza */}
        {oreja}
        <g transform="translate(240 0) scale(-1 1)">{oreja}</g>

        {/* Cuerpo con panza más clara y sombra de la cabeza */}
        <path d="M120 116 C 160 116 184 150 184 190 C 184 224 158 238 120 238 C 82 238 56 224 56 190 C 56 150 80 116 120 116 Z" fill={`url(#${piel})`} />
        <g clipPath={`url(#${cuerpo})`}>
          <ellipse cx="120" cy="118" rx="58" ry="20" style={{ fill: C.oscuro }} opacity=".35" filter={`url(#${sombra})`} />
          <ellipse cx="120" cy="188" rx="36" ry="38" fill={`url(#${claro})`} />
          <ellipse cx="120" cy="188" rx="31" ry="33" fill="none" style={{ stroke: C.oscuro }} strokeOpacity=".35" strokeWidth="1.1" strokeDasharray="3 3" />
        </g>

        {/* Piernas con almohadillas */}
        {[0, 1].map((lado) => (
          <g key={lado} transform={lado ? "translate(240 0) scale(-1 1)" : undefined}>
            <path d={pierna} fill={`url(#${piel})`} />
            <ellipse cx="50" cy="230" rx="14" ry="16" transform="rotate(28 50 230)" fill={`url(#${claro})`} />
            <ellipse cx="50" cy="230" rx="10" ry="12" transform="rotate(28 50 230)" fill="none" style={{ stroke: C.oscuro }} strokeOpacity=".3" strokeDasharray="2.4 2.4" />
          </g>
        ))}

        {/* Brazos */}
        {[0, 1].map((lado) => (
          <g key={lado} transform={lado ? "translate(240 0) scale(-1 1)" : undefined}>
            <path d="M100 150 C 92 168 84 186 76 196" fill="none" style={{ stroke: C.oscuro }} strokeOpacity=".28" strokeWidth="6" filter={`url(#${sombra})`} />
            <path d={brazo} fill={`url(#${piel})`} />
            <ellipse cx="60" cy="193" rx="10" ry="8" fill={`url(#${claro})`} opacity=".85" />
          </g>
        ))}

        {/* Cabeza */}
        <path d="M120 22 C 156 22 178 46 178 78 C 178 112 154 134 120 134 C 86 134 62 112 62 78 C 62 46 84 22 120 22 Z" fill={`url(#${piel})`} />
        <g clipPath={`url(#${cara})`}>
          <ellipse cx="146" cy="120" rx="50" ry="22" style={{ fill: C.oscuro }} opacity=".18" filter={`url(#${sombra})`} />
          <ellipse cx="102" cy="40" rx="26" ry="14" fill="white" opacity=".22" filter={`url(#${sombra})`} />
        </g>
        <path d="M120 24 C 121 40 121 58 120 78" fill="none" style={{ stroke: C.oscuro }} strokeOpacity=".3" strokeWidth="1.1" strokeDasharray="3 3" />
        <ellipse cx="120" cy="101" rx="28" ry="21" fill={`url(#${claro})`} />
      </g>

      {/* Cara: fuera del filtro de pelo para que quede nítida */}
      <ellipse cx="86" cy="100" rx="10" ry="6" fill="#E3A99A" opacity=".35" filter={`url(#${sombra})`} />
      <ellipse cx="154" cy="100" rx="10" ry="6" fill="#E3A99A" opacity=".35" filter={`url(#${sombra})`} />
      {[98, 142].map((x) => (
        <g key={x}>
          <circle cx={x} cy="77" r="6" style={{ fill: C.tinta }} />
          <circle cx={x - 1.8} cy="74.8" r="1.9" fill="white" opacity=".9" />
        </g>
      ))}
      <path d="M109 91 C 109 84 131 84 131 91 C 131 97 124 101 120 101 C 116 101 109 97 109 91 Z" style={{ fill: C.tinta }} />
      <ellipse cx="116" cy="88.5" rx="4" ry="2" fill="white" opacity=".45" />
      <path d="M120 101 L 120 107 M 111 108 C 115 113 119 111 120 107 C 121 111 125 113 129 108" fill="none" style={{ stroke: C.tinta }} strokeWidth="1.6" strokeLinecap="round" />

      {/* Lazo salvia */}
      <g>
        <path d="M118 140 L 108 162 L 114 160 L 117 166 L 121 142 Z M122 140 L 132 162 L 126 160 L 123 166 L 119 142 Z" fill={`url(#${lazo})`} />
        <path d="M120 138 C 104 124 88 126 90 140 C 92 154 108 150 120 140 Z" fill={`url(#${lazo})`} />
        <path d="M120 138 C 136 124 152 126 150 140 C 148 154 132 150 120 140 Z" fill={`url(#${lazo})`} />
        <path d="M117 138 C 108 132 98 132 96 138 M123 138 C 132 132 142 132 144 138" fill="none" stroke="white" strokeOpacity=".35" strokeWidth="1.2" />
        <ellipse cx="120" cy="139" rx="6.5" ry="5.5" fill={`url(#${lazo})`} />
        <ellipse cx="118.6" cy="137.4" rx="2.4" ry="1.6" fill="white" opacity=".4" />
      </g>
    </svg>
  );
}

const NUBE = "M28 104 C 6 104 2 76 22 70 C 18 46 46 34 64 46 C 72 18 116 10 130 38 C 146 22 180 30 178 58 C 202 58 214 96 190 104 Z";

// SDXL: os_nube
// Nube esponjosa (mar de nubes) o, con `fieltro`, nube de fieltro cosida.
export function OsNube({ className = "", fieltro = false, tono = "blanco", style }) {
  const u = useUid();
  const g = `${u}g`, s = `${u}s`, h = `${u}h`, f = `${u}f`, k = `${u}k`;
  const t = TONOS[tono] || TONOS.blanco;
  return (
    <svg className={className} style={style} viewBox="0 0 220 112" aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <P o="0" c={fieltro ? t.luz : "#fff"} />
          <P o=".55" c={fieltro ? t.base : mezcla(C.blanco, C.papel, 55)} />
          <P o="1" c={fieltro ? t.sombra : mezcla(C.claro, C.papel, 70)} />
        </linearGradient>
        <Difuso id={s} d={fieltro ? 2 : 6} />
        <filter id={h} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency={fieltro ? 1.2 : 0.035} numOctaves="2" seed="5" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale={fieltro ? 1.6 : 7} xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation={fieltro ? 0.2 : 0.7} />
        </filter>
        <Grano id={f} fuerza={fieltro ? 0.75 : 0.35} freq={fieltro ? 1.4 : 0.9} />
        <clipPath id={k}><path d={NUBE} /></clipPath>
      </defs>
      <g filter={`url(#${f})`}>
        <g filter={`url(#${h})`}>
          <path d={NUBE} fill={`url(#${g})`} />
          <g clipPath={`url(#${k})`}>
            <ellipse cx="70" cy="104" rx="60" ry="16" style={{ fill: fieltro ? t.sombra : C.claro }} opacity=".55" filter={`url(#${s})`} />
            <ellipse cx="160" cy="102" rx="46" ry="14" style={{ fill: fieltro ? t.sombra : C.claro }} opacity=".5" filter={`url(#${s})`} />
            <ellipse cx="96" cy="40" rx="24" ry="12" fill="white" opacity=".85" filter={`url(#${s})`} />
            <ellipse cx="150" cy="48" rx="16" ry="8" fill="white" opacity=".7" filter={`url(#${s})`} />
            <ellipse cx="44" cy="62" rx="14" ry="8" fill="white" opacity=".6" filter={`url(#${s})`} />
            {!fieltro && <path d="M62 72 C 80 66 92 76 104 70 M128 64 C 140 60 152 70 164 66" fill="none" style={{ stroke: C.claro }} strokeWidth="5" opacity=".55" filter={`url(#${s})`} />}
          </g>
        </g>
        {fieltro && (
          <path d={NUBE} transform="translate(110 64) scale(.84) translate(-110 -64)" fill="none" style={{ stroke: C.oscuro }} strokeOpacity=".45" strokeWidth="1.8" strokeDasharray="4 4" strokeLinecap="round" />
        )}
      </g>
    </svg>
  );
}

// Piezas de fieltro del móvil (luna y estrella) con costura.
const LUNA = "M42 6 C 22 8 8 24 8 38 C 8 54 22 62 38 62 C 48 62 56 57 60 50 C 38 52 24 38 30 20 C 32 14 37 9 42 6 Z";
const ESTRELLA = "M32 6 L 39.5 22.5 L 57 24.5 L 44 36.5 L 47.5 54 L 32 45 L 16.5 54 L 20 36.5 L 7 24.5 L 24.5 22.5 Z";
function Fieltro({ forma, tono }) {
  const u = useUid();
  const g = `${u}g`, f = `${u}f`;
  const t = TONOS[tono] || TONOS.claro;
  const d = forma === "luna" ? LUNA : ESTRELLA;
  return (
    <svg viewBox="0 0 64 66" aria-hidden="true">
      <defs>
        <radialGradient id={g} cx=".35" cy=".3" r=".9">
          <P o="0" c={t.luz} />
          <P o=".6" c={t.base} />
          <P o="1" c={t.sombra} />
        </radialGradient>
        <Grano id={f} fuerza={0.8} freq={1.5} semilla={7} />
      </defs>
      <g filter={`url(#${f})`}>
        <path d={d} fill={`url(#${g})`} stroke={`url(#${g})`} strokeWidth="5" strokeLinejoin="round" />
        <path d={d} transform="translate(32 34) scale(.78) translate(-32 -34)" fill="none" style={{ stroke: C.oscuro }} strokeOpacity=".5" strokeWidth="1.6" strokeDasharray="3 3" strokeLinecap="round" />
      </g>
      {forma === "luna" && (
        <g style={{ fill: C.tinta }} opacity=".75">
          <path d="M20 36 C 22 39 26 39 28 36" fill="none" style={{ stroke: C.tinta }} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

// Cuenta de madera natural.
function Cuenta({ r = 6 }) {
  const u = useUid();
  return (
    <svg viewBox="0 0 20 20" width={r * 2} height={r * 2} aria-hidden="true">
      <defs>
        <radialGradient id={u} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#F1DDBF" />
          <stop offset=".55" stopColor="#CFA877" />
          <stop offset="1" stopColor="#8E6A43" />
        </radialGradient>
      </defs>
      <circle cx="10" cy="10" r="9.5" fill={`url(#${u})`} />
    </svg>
  );
}

// Aro de madera visto en 3D (tres capas para darle grosor).
function Aro() {
  const u = useUid();
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <linearGradient id={u} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E9CFA6" />
          <stop offset=".5" stopColor="#C49A68" />
          <stop offset="1" stopColor="#9A7349" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="none" stroke={`url(#${u})`} strokeWidth="6" />
    </svg>
  );
}

const COLGANTES = [
  { forma: "nube", tono: "blanco", hilo: 46 },
  { forma: "estrella", tono: "claro", hilo: 78 },
  { forma: "luna", tono: "beige", hilo: 56 },
  { forma: "nube", tono: "salvia", hilo: 84 },
  { forma: "estrella", tono: "salvia", hilo: 40 },
  { forma: "nube", tono: "claro", hilo: 66 },
];

// SDXL: os_movil
// Móvil de cuna de madera: vara desde el techo, aro con dos travesaños y
// colgantes de fieltro (nubes, luna y estrellas) que giran en 3D real.
export function OsMovil({ girando = false, className = "" }) {
  return (
    <div className={`os-movil ${girando ? "is-girando" : ""} ${className}`} aria-hidden="true">
      <span className="os-movil-vara" />
      <span className="os-movil-perilla"><Cuenta r={9} /></span>
      <div className="os-movil-escena">
        <div className="os-movil-inclina">
          <div className="os-movil-carrusel">
            {[-2, 0, 2].map((y) => <div key={y} className="os-movil-aro" style={{ "--y": `${y}px` }}><Aro /></div>)}
            <span className="os-movil-barra" style={{ "--b": "0deg" }} />
            <span className="os-movil-barra" style={{ "--b": "90deg" }} />
            {COLGANTES.map((c, i) => (
              <div key={i} className="os-movil-colgante" style={{ "--a": `${(360 / COLGANTES.length) * i}deg` }}>
                <div className="os-movil-cara">
                  <div className="os-movil-pieza" style={{ "--hilo": `${c.hilo}px`, "--retraso": `${-i * 0.7}s` }}>
                    <span className="os-movil-hilo" />
                    <span className="os-movil-cuenta"><Cuenta r={4} /></span>
                    {c.forma === "nube"
                      ? <OsNube fieltro tono={c.tono} className="os-movil-nube" />
                      : <span className={`os-movil-fieltro os-movil-${c.forma}`}><Fieltro forma={c.forma} tono={c.tono} /></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// SDXL: os_cubo
// Cubo de juguete de madera pintado en vista 3/4. La cara frontal lleva un
// panel rehundido con el ícono (children, en caja de 24×24) o una letra.
export function OsCubo({ tono = "beige", letra, children, className = "" }) {
  const u = useUid();
  const fr = `${u}a`, lado = `${u}b`, tapa = `${u}c`, madera = `${u}d`, f = `${u}e`, s = `${u}f`, panel = `${u}g`;
  const t = TONOS[tono] || TONOS.beige;
  const tintaIcono = tono === "claro" || tono === "blanco" ? C.oscuro : "#FFFDF8";
  const FRENTE = "M14 46 L 86 58 L 86 128 L 14 116 Z";
  const LADO = "M86 58 L 126 40 L 126 110 L 86 128 Z";
  const TAPA = "M14 46 L 86 58 L 126 40 L 54 28 Z";
  return (
    <svg className={className} viewBox="0 0 140 146" aria-hidden="true">
      <defs>
        <linearGradient id={fr} x1="0" y1="0" x2="1" y2="1">
          <P o="0" c={t.luz} />
          <P o=".45" c={t.base} />
          <P o="1" c={mezcla(t.base, t.sombra, 55)} />
        </linearGradient>
        <linearGradient id={lado} x1="0" y1="0" x2="1" y2="1">
          <P o="0" c={mezcla(t.base, t.sombra, 40)} />
          <P o="1" c={t.sombra} />
        </linearGradient>
        <linearGradient id={tapa} x1="0" y1="1" x2="1" y2="0">
          <P o="0" c={t.luz} />
          <P o="1" c={mezcla(t.luz, "white", 60)} />
        </linearGradient>
        <linearGradient id={madera} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4E3C6" />
          <stop offset=".5" stopColor="#DDBB8C" />
          <stop offset="1" stopColor="#B48A5A" />
        </linearGradient>
        <linearGradient id={panel} x1="0" y1="0" x2="0" y2="1">
          <P o="0" c={mezcla(t.base, t.sombra, 50)} a={0.55} />
          <P o=".25" c={t.base} a={0} />
          <P o="1" c="white" a={0.25} />
        </linearGradient>
        <Grano id={f} fuerza={0.55} freq={1.1} />
        <Difuso id={s} d={4} />
      </defs>

      <ellipse cx="72" cy="128" rx="58" ry="9" style={{ fill: C.oscuro }} opacity=".28" filter={`url(#${s})`} />

      <g filter={`url(#${f})`}>
        {/* Cantos de madera natural redondeados */}
        <path d={`${FRENTE} ${LADO} ${TAPA}`} fill={`url(#${madera})`} stroke={`url(#${madera})`} strokeWidth="9" strokeLinejoin="round" />
        <path d={TAPA} fill={`url(#${tapa})`} stroke={`url(#${tapa})`} strokeWidth="2" strokeLinejoin="round" />
        <path d="M30 42 C 54 46 80 42 104 40 M40 36 C 60 39 84 36 108 35" fill="none" stroke="#A9825A" strokeOpacity=".22" strokeWidth=".9" />
        <path d={LADO} fill={`url(#${lado})`} stroke={`url(#${lado})`} strokeWidth="2" strokeLinejoin="round" />
        <path d={FRENTE} fill={`url(#${fr})`} stroke={`url(#${fr})`} strokeWidth="2" strokeLinejoin="round" />
        {/* Brillo del canto superior y sombra del canto lateral */}
        <path d="M14 45 L 86 57 L 126 39" fill="none" stroke="white" strokeOpacity=".55" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M86 59 L 86 127" fill="none" style={{ stroke: C.oscuro }} strokeOpacity=".22" strokeWidth="2" />

        {/* Cara frontal en coordenadas locales de 72×70 */}
        <g transform="matrix(1 .1667 0 1 14 46)">
          <rect x="7" y="7" width="58" height="56" rx="7" fill={`url(#${panel})`} />
          <rect x="7" y="7" width="58" height="56" rx="7" fill="none" stroke="white" strokeOpacity=".5" strokeWidth="1.2" />
          {letra ? (
            <>
              <text x="36.8" y="54.8" textAnchor="middle" fontSize="48" fontWeight="700" style={{ fill: C.tinta, fontFamily: "var(--f-titulos, Georgia, serif)" }} opacity=".18">{letra}</text>
              <text x="36" y="54" textAnchor="middle" fontSize="48" fontWeight="700" style={{ fill: tintaIcono, fontFamily: "var(--f-titulos, Georgia, serif)" }}>{letra}</text>
            </>
          ) : (
            <g transform="translate(17 16) scale(1.6)" style={{ color: tintaIcono }}>
              <g transform="translate(.5 .7)" style={{ color: C.tinta }} opacity=".3">{children}</g>
              {children}
            </g>
          )}
        </g>
        {/* Cara lateral: un panel rehundido sin ícono */}
        <g transform="matrix(1 -.45 0 1 86 58)">
          <rect x="6" y="7" width="28" height="56" rx="6" fill="none" stroke="white" strokeOpacity=".25" strokeWidth="1.1" />
        </g>
      </g>
    </svg>
  );
}

// SDXL: os_coche
// Coche de bebé con capota plisada beige, canasta clara y ruedas finas.
export function OsCoche({ className = "" }) {
  const u = useUid();
  const capota = `${u}a`, canasta = `${u}b`, f = `${u}c`, s = `${u}d`, rueda = `${u}e`;
  const Rueda = ({ x }) => (
    <g>
      <circle cx={x} cy="156" r="19" fill="none" stroke={`url(#${rueda})`} strokeWidth="5" />
      <circle cx={x} cy="156" r="15.5" fill="none" style={{ stroke: C.claro }} strokeWidth="1" opacity=".7" />
      <path d={Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `M${x} 156 L ${(x + Math.cos(a) * 15).toFixed(1)} ${(156 + Math.sin(a) * 15).toFixed(1)}`; }).join(" ")} style={{ stroke: C.oscuro }} strokeWidth="1.1" opacity=".75" />
      <circle cx={x} cy="156" r="3.5" style={{ fill: C.beige }} />
    </g>
  );
  return (
    <svg className={className} viewBox="0 0 220 184" aria-hidden="true">
      <defs>
        <radialGradient id={capota} cx=".3" cy=".25" r="1">
          <P o="0" c={mezcla(C.beige, "white", 55)} />
          <P o=".6" c={C.beige} />
          <P o="1" c={C.oscuro} />
        </radialGradient>
        <linearGradient id={canasta} x1="0" y1="0" x2="0" y2="1">
          <P o="0" c={C.blanco} />
          <P o=".6" c={mezcla(C.claro, C.blanco, 60)} />
          <P o="1" c={C.claro} />
        </linearGradient>
        <linearGradient id={rueda} x1="0" y1="0" x2="1" y2="1">
          <P o="0" c={mezcla(C.tinta, "white", 70)} />
          <P o="1" c={C.tinta} />
        </linearGradient>
        <Grano id={f} fuerza={0.5} />
        <Difuso id={s} d={4} />
      </defs>
      <ellipse cx="112" cy="176" rx="84" ry="6" style={{ fill: C.oscuro }} opacity=".25" filter={`url(#${s})`} />
      <g filter={`url(#${f})`}>
        {/* Chasis y manubrio */}
        <path d="M66 156 L 98 128 L 156 156 M156 156 L 124 128 L 66 156 M176 100 L 196 54" fill="none" style={{ stroke: C.oscuro }} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M190 52 C 194 46 204 46 208 52" fill="none" style={{ stroke: C.tinta }} strokeWidth="7" strokeLinecap="round" />
        <Rueda x={66} />
        <Rueda x={156} />
        {/* Canasta */}
        <path d="M30 92 L 184 92 C 184 128 156 142 108 142 C 60 142 30 128 30 92 Z" fill={`url(#${canasta})`} />
        <path d="M34 104 C 60 112 150 112 180 104" fill="none" style={{ stroke: C.beige }} strokeWidth="1.4" strokeDasharray="3 3" opacity=".8" />
        <path d="M44 128 C 80 140 140 140 170 126" fill="none" style={{ stroke: C.claro }} strokeWidth="6" opacity=".8" filter={`url(#${s})`} />
        <path d="M28 92 L 186 92" style={{ stroke: C.beige }} strokeWidth="5" strokeLinecap="round" />
        {/* Capota plisada */}
        <path d="M36 92 C 36 46 72 16 118 16 L 120 92 Z" fill={`url(#${capota})`} />
        <path d="M118 18 L 46 64 M118 18 L 66 34 M118 18 L 92 20 M118 18 L 38 86" fill="none" style={{ stroke: C.oscuro }} strokeWidth="1.3" opacity=".35" />
        <path d="M118 18 L 54 52 M118 18 L 80 25" fill="none" stroke="white" strokeWidth="1.4" opacity=".4" />
        <path d="M36 92 C 36 46 72 16 118 16" fill="none" style={{ stroke: C.oscuro }} strokeWidth="2" opacity=".5" />
        {/* Pompón salvia */}
        <circle cx="118" cy="16" r="7" style={{ fill: C.salvia }} />
        <circle cx="116" cy="14" r="2.4" fill="white" opacity=".45" />
      </g>
    </svg>
  );
}

// SDXL: os_ropita
// Body de bebé colgado con pinzas de madera en un cordel.
export function OsRopita({ className = "" }) {
  const u = useUid();
  const tela = `${u}a`, f = `${u}b`, s = `${u}c`, k = `${u}d`;
  const BODY = "M58 22 C 66 32 94 32 102 22 L 126 30 L 146 56 L 128 68 L 120 60 L 120 110 C 120 122 106 132 94 134 L 94 142 L 66 142 L 66 134 C 54 132 40 122 40 110 L 40 60 L 32 68 L 14 56 L 34 30 Z";
  const Pinza = ({ x }) => (
    <g>
      <rect x={x - 3.5} y="8" width="7" height="24" rx="2" fill="#D7B585" />
      <rect x={x - 3.5} y="8" width="3" height="24" rx="1.5" fill="#F0DDBC" opacity=".8" />
      <rect x={x - 4} y="16" width="8" height="3" rx="1" fill="#9B7650" opacity=".7" />
    </g>
  );
  return (
    <svg className={className} viewBox="0 0 160 150" aria-hidden="true">
      <defs>
        <radialGradient id={tela} cx=".45" cy=".35" r=".85">
          <P o="0" c={C.blanco} />
          <P o=".7" c={mezcla(C.claro, C.blanco, 45)} />
          <P o="1" c={C.claro} />
        </radialGradient>
        <Grano id={f} fuerza={0.6} freq={1.3} />
        <Difuso id={s} d={3} />
        <clipPath id={k}><path d={BODY} /></clipPath>
      </defs>
      <path d="M0 14 C 50 22 110 22 160 14" fill="none" style={{ stroke: C.oscuro }} strokeWidth="1.2" opacity=".6" />
      <g filter={`url(#${f})`}>
        <path d={BODY} fill={`url(#${tela})`} />
        <g clipPath={`url(#${k})`}>
          <path d="M60 60 C 64 84 58 104 66 128 M100 60 C 96 80 104 102 96 128" fill="none" style={{ stroke: C.beige }} strokeWidth="5" opacity=".35" filter={`url(#${s})`} />
          <path d="M40 60 L 40 110" style={{ stroke: C.beige }} strokeWidth="6" opacity=".25" filter={`url(#${s})`} />
        </g>
        <path d="M58 22 C 66 32 94 32 102 22" fill="none" style={{ stroke: C.salvia }} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M14 56 L 32 68 M146 56 L 128 68" style={{ stroke: C.salvia }} strokeWidth="3.5" strokeLinecap="round" />
        <path d={BODY} fill="none" style={{ stroke: C.beige }} strokeWidth="1" opacity=".6" />
        {/* Corazoncito bordado */}
        <path d="M80 70 C 76 64 68 66 70 72 C 71 76 80 82 80 82 C 80 82 89 76 90 72 C 92 66 84 64 80 70 Z" style={{ fill: C.salvia }} opacity=".85" />
        {[72, 80, 88].map((x) => <circle key={x} cx={x} cy="138" r="2" style={{ fill: C.beige }} />)}
      </g>
      <Pinza x={50} />
      <Pinza x={110} />
    </svg>
  );
}

// Pampas: penachos hechos de cientos de hebras finas a lo largo de un tallo.
const azar = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
function hebras(p0, c, p1, semilla, desde = 0.42) {
  const punto = (t) => [
    (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t ** 2 * p1[0],
    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t ** 2 * p1[1],
  ];
  const tangente = (t) => {
    const x = 2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]);
    const y = 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1]);
    const l = Math.hypot(x, y) || 1;
    return [x / l, y / l];
  };
  let d = "";
  const n = 230;
  for (let i = 0; i < n; i++) {
    const t = desde + ((1 - desde) * i) / n;
    const [x, y] = punto(t);
    const [tx, ty] = tangente(t);
    const lado = i % 2 ? 1 : -1;
    const k = (t - desde) / (1 - desde);
    const largo = (5 + 15 * Math.sin(Math.PI * Math.min(1, k * 1.1))) * (0.55 + 0.6 * azar(semilla + i));
    const abre = 0.35 + 0.75 * azar(semilla + i + 999);
    const nx = -ty * lado * abre, ny = tx * lado * abre;
    const ex = x + nx * largo + tx * largo, ey = y + ny * largo + ty * largo;
    const cx = x + nx * largo * 0.8 + tx * largo * 0.2, cy = y + ny * largo * 0.8 + ty * largo * 0.2;
    d += `M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }
  const nubes = [0.2, 0.45, 0.7, 0.9].map((k) => punto(desde + (1 - desde) * k));
  return { d, tallo: `M${p0[0]} ${p0[1]} Q${c[0]} ${c[1]} ${p1[0]} ${p1[1]}`, nubes };
}
const PENACHOS = [
  hebras([58, 262], [60, 150], [38, 22], 1),
  hebras([62, 262], [76, 170], [92, 48], 300),
  hebras([56, 262], [44, 200], [14, 98], 600, 0.48),
];
const HOJAS_EUCALIPTO = [
  [70, 236, 11, -30], [84, 222, 12, 20], [78, 204, 10.5, -40], [94, 192, 11.5, 25],
  [88, 174, 10, -35], [102, 164, 10.5, 30], [98, 148, 9, -20], [108, 138, 8, 10],
];

// SDXL: os_pampas
// Ramillete de pampas beige con una rama de eucalipto.
export function OsPampas({ className = "", espejo = false }) {
  const u = useUid();
  const pluma = `${u}a`, hoja = `${u}b`, f = `${u}c`, s = `${u}d`;
  return (
    <svg className={className} viewBox="0 0 124 264" aria-hidden="true" style={espejo ? { transform: "scaleX(-1)" } : undefined}>
      <defs>
        <linearGradient id={pluma} x1="0" y1="1" x2="0" y2="0">
          <P o="0" c={C.beige} />
          <P o=".5" c={mezcla(C.claro, C.beige, 60)} />
          <P o="1" c={mezcla(C.claro, "white", 60)} />
        </linearGradient>
        <radialGradient id={hoja} cx=".35" cy=".3" r=".9">
          <stop offset="0" stopColor="#C9D6C6" />
          <stop offset=".6" stopColor="#97AE9B" />
          <stop offset="1" stopColor="#6F8B7A" />
        </radialGradient>
        <Grano id={f} fuerza={0.4} />
        <Difuso id={s} d={5} />
      </defs>
      {/* Volumen suave detrás de cada penacho */}
      {PENACHOS.map((p, i) => p.nubes.map(([x, y], j) => <circle key={`${i}-${j}`} cx={x} cy={y} r={[11, 15, 13, 8][j]} style={{ fill: C.claro }} opacity=".75" filter={`url(#${s})`} />))}
      {/* Eucalipto */}
      <g filter={`url(#${f})`}>
        <path d="M64 262 C 74 230 90 196 110 134" fill="none" stroke="#7F6A55" strokeWidth="1.6" strokeLinecap="round" />
        {HOJAS_EUCALIPTO.map(([x, y, r, g], i) => (
          <g key={i} transform={`rotate(${g} ${x} ${y})`}>
            <ellipse cx={x} cy={y} rx={r} ry={r * 0.92} fill={`url(#${hoja})`} />
            <path d={`M${x - r * 0.8} ${y} Q ${x} ${y - 1.5} ${x + r * 0.8} ${y}`} fill="none" stroke="#E8EFE6" strokeOpacity=".5" strokeWidth=".8" />
            <ellipse cx={x - r * 0.3} cy={y - r * 0.35} rx={r * 0.4} ry={r * 0.22} fill="white" opacity=".25" />
          </g>
        ))}
      </g>
      <g filter={`url(#${f})`}>
        {PENACHOS.map((p, i) => <path key={`t${i}`} d={p.tallo} fill="none" style={{ stroke: C.oscuro }} strokeWidth="1.4" opacity=".7" />)}
        {PENACHOS.map((p, i) => <path key={`a${i}`} d={p.d} fill="none" style={{ stroke: C.beige }} strokeWidth="1.3" strokeLinecap="round" opacity=".35" />)}
        {PENACHOS.map((p, i) => <path key={`b${i}`} d={p.d} fill="none" stroke={`url(#${pluma})`} strokeWidth=".8" strokeLinecap="round" opacity=".85" transform="translate(-.6 -.8)" />)}
      </g>
    </svg>
  );
}

// SDXL: os_globo
// Globo mate beige o salvia con brillo suave y cordel ondulado.
export function OsGlobo({ tono = "beige", className = "", style }) {
  const u = useUid();
  const g = `${u}a`, f = `${u}b`, s = `${u}c`;
  const t = TONOS[tono] || TONOS.beige;
  return (
    <svg className={className} style={style} viewBox="0 0 80 220" aria-hidden="true">
      <defs>
        <radialGradient id={g} cx=".36" cy=".3" r=".85">
          <P o="0" c={mezcla(t.luz, "white", 60)} />
          <P o=".45" c={t.base} />
          <P o="1" c={t.sombra} />
        </radialGradient>
        <Grano id={f} fuerza={0.35} />
        <Difuso id={s} d={3} />
      </defs>
      <path d="M40 92 C 34 120 48 140 40 166 C 34 186 44 204 40 220" fill="none" style={{ stroke: C.oscuro }} strokeWidth="1" opacity=".6" />
      <g filter={`url(#${f})`}>
        <path d="M40 4 C 62 4 76 24 76 46 C 76 70 58 88 40 90 C 22 88 4 70 4 46 C 4 24 18 4 40 4 Z" fill={`url(#${g})`} />
        <path d="M36 90 L 44 90 L 46 96 L 34 96 Z" style={{ fill: t.sombra }} />
        <ellipse cx="26" cy="28" rx="9" ry="14" transform="rotate(25 26 28)" fill="white" opacity=".45" filter={`url(#${s})`} />
      </g>
    </svg>
  );
}

// Sobre pequeño para la lluvia de sobres.
export function OsSobre({ className = "", style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 40 28" aria-hidden="true">
      <rect x="1" y="1" width="38" height="26" rx="3" style={{ fill: C.blanco, stroke: C.beige }} strokeWidth="1.2" />
      <path d="M2 3 L 20 16 L 38 3" fill="none" style={{ stroke: C.beige }} strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="20" cy="16" r="3.2" style={{ fill: C.salvia }} />
    </svg>
  );
}
