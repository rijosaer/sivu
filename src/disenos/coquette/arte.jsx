// Ilustraciones de «Coquette», todas en vector y con el mismo trazo:
// relleno rosa plano, contorno fino rosa oscuro y un brillo blanco, como
// papelería coquette. Los colores salen de variables CSS (--lazo, --lazo-osc,
// --trazo, --perla), así que siguen el tema del panel.

// Moño de dos lazos con colas en punta de flecha.
export function DibujoLazo() {
  return (
    <g className="cq-dib">
      <path className="f-lazo" d="M110 72 C 120 96 136 120 158 144 L 139 141 L 134 159 C 114 132 100 106 95 80 Z" />
      <path className="f-lazo" d="M90 72 C 80 96 64 120 42 144 L 61 141 L 66 159 C 86 132 100 106 105 80 Z" />
      <path className="f-lazo-osc sin-trazo" d="M97 82 C 92 104 82 126 64 150 L 66 158 C 84 134 96 110 101 86 Z M103 82 C 108 104 118 126 136 150 L 134 158 C 116 134 104 110 99 86 Z" />
      <path className="f-lazo" d="M94 60 C 72 22 22 14 14 44 C 8 70 40 92 94 76 Z" />
      <path className="f-lazo" d="M106 60 C 128 22 178 14 186 44 C 192 70 160 92 106 76 Z" />
      <path className="f-lazo-osc sin-trazo" d="M94 62 C 78 46 56 44 46 54 C 58 66 78 72 94 72 Z" />
      <path className="f-lazo-osc sin-trazo" d="M106 62 C 122 46 144 44 154 54 C 142 66 122 72 106 72 Z" />
      <path className="pliegue" d="M30 40 C 44 34 62 42 76 52 M170 40 C 156 34 138 42 124 52 M60 132 C 72 118 82 102 88 88 M140 132 C 128 118 118 102 112 88" />
      <path className="brillo" d="M24 38 C 28 30 38 26 48 28 M152 28 C 160 27 168 30 172 36" />
      <path className="f-lazo" d="M88 56 Q 100 50 112 56 L 114 78 Q 100 84 86 78 Z" />
      <path className="brillo brillo-fino" d="M92 61 Q 96 58 101 58" />
    </g>
  );
}

export function Lazo({ className = "" }) {
  return (
    <svg className={`cq-lazo ${className}`} viewBox="0 0 200 160" aria-hidden="true">
      <DibujoLazo />
    </svg>
  );
}

function Perla({ x, y, r }) {
  return (
    <g>
      <circle className="f-lazo-claro" cx={x} cy={y} r={r} />
      <circle className="f-perla sin-trazo" cx={x - r * 0.12} cy={y - r * 0.12} r={r * 0.78} />
      <circle className="f-blanco sin-trazo" cx={x - r * 0.38} cy={y - r * 0.38} r={r * 0.28} />
    </g>
  );
}

const CORAZON = "M12 20.5 C 5 15.5 1.5 11.5 1.5 7.2 A 5.2 5.2 0 0 1 12 5 A 5.2 5.2 0 0 1 22.5 7.2 C 22.5 11.5 19 15.5 12 20.5 Z";

export function Corazon({ className = "" }) {
  return (
    <svg className={`cq-corazon ${className}`} viewBox="0 0 24 22" aria-hidden="true">
      <g className="cq-dib">
        <path className="f-lazo" d={CORAZON} />
        <path className="brillo brillo-fino" d="M5 8.5 C 5 7 6 6 7.5 6" />
      </g>
    </svg>
  );
}

// Tiara con perlas en las puntas y un corazón al centro.
export function Tiara({ className = "" }) {
  return (
    <svg className={`cq-tiara ${className}`} viewBox="0 0 160 84" aria-hidden="true">
      <g className="cq-dib">
        <path className="f-blanco" d="M14 74 C 26 60 30 46 34 32 C 44 46 52 52 60 52 C 64 40 72 26 80 12 C 88 26 96 40 100 52 C 108 52 116 46 126 32 C 130 46 134 60 146 74 Q 80 62 14 74 Z" />
        <path className="pliegue" d="M26 68 Q 80 58 134 68" />
        <path className="f-lazo" transform="translate(71 34) scale(.75)" d={CORAZON} />
        <Perla x={34} y={28} r={6} />
        <Perla x={80} y={9} r={7} />
        <Perla x={126} y={28} r={6} />
        <Perla x={60} y={48} r={4} />
        <Perla x={100} y={48} r={4} />
      </g>
    </svg>
  );
}

// Perlas a lo largo de un trazo: contorno, sombra rosada, perla y brillo son
// cuatro pasadas del mismo punteado (puntos redondos), corridas un poco
// arriba a la izquierda para que cada perla tenga volumen.
function HiloPerlas({ d, paso = 2.1, grosor = 8, ...resto }) {
  const base = { d, pathLength: 100, fill: "none", strokeDasharray: `0 ${paso}`, strokeLinecap: "round", ...resto };
  return (
    <g>
      <path {...base} className="hilo-contorno" strokeWidth={grosor + 1.8} />
      <path {...base} className="hilo-sombra" strokeWidth={grosor} />
      <path {...base} className="hilo-perla" strokeWidth={grosor * 0.74} transform={`translate(${-grosor * 0.1} ${-grosor * 0.1})`} />
      <path {...base} className="hilo-brillo" strokeWidth={grosor * 0.28} transform={`translate(${-grosor * 0.27} ${-grosor * 0.27})`} />
    </g>
  );
}

export function MarcoPerlas() {
  return (
    <svg className="cq-camafeo-perlas" viewBox="0 0 240 320" aria-hidden="true">
      <HiloPerlas d="M120 8 A 112 152 0 1 1 119.9 8 Z" paso={1.72} grosor={11} />
    </svg>
  );
}

export function Collar() {
  return (
    <svg className="cq-collar" viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true">
      <HiloPerlas d="M-10 8 Q 200 92 410 8" paso={1.9} grosor={9} />
      <g className="cq-dib" transform="translate(178 34) scale(.22)"><DibujoLazo /></g>
    </svg>
  );
}

// Guirnalda de perlas colgada de tres moños (portada y pie).
export function Guirnalda({ className = "" }) {
  return (
    <svg className={`cq-guirnalda ${className}`} viewBox="0 0 400 110" aria-hidden="true">
      <HiloPerlas d="M24 20 Q 112 96 200 20" paso={2.3} grosor={8} />
      <HiloPerlas d="M200 20 Q 288 96 376 20" paso={2.3} grosor={8} />
      {[24, 200, 376].map((x) => (
        <g key={x} transform={`translate(${x - 26} 0) scale(.26)`}><DibujoLazo /></g>
      ))}
    </svg>
  );
}
