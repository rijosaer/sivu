// Ilustraciones del diseño «Ensueño» (acuarela menta y durazno), llevadas
// tal cual desde la maqueta public/modelos/xv.html. Son SVG con filtros de
// acuarela definidos una sola vez en <Defs> y reutilizados con <use>.

export function Defs({ monograma = "XV" }) {
  return (
      <svg className="defs" aria-hidden="true" focusable="false">
        <defs>
          <filter id="wc" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="3" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="8" xChannelSelector="R" yChannelSelector="G" result="d"/>
            <feGaussianBlur in="d" stdDeviation="0.7" result="b"/>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8" result="grain"/>
            <feColorMatrix in="grain" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.1 1.3" result="grainA"/>
            <feComposite in="b" in2="grainA" operator="in"/>
          </filter>
          <filter id="wc-wash" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="11" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="46" xChannelSelector="R" yChannelSelector="G" result="d"/>
            <feGaussianBlur in="d" stdDeviation="5" result="b"/>
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="4" result="grain"/>
            <feColorMatrix in="grain" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -0.9 1.25" result="grainA"/>
            <feComposite in="b" in2="grainA" operator="in"/>
          </filter>
          <filter id="wc-cloud" x="-30%" y="-40%" width="160%" height="180%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="21" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" result="d"/>
            <feGaussianBlur in="d" stdDeviation="2.4"/>
          </filter>
          <filter id="wc-line" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="5" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4"/>
          </filter>
          <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#B9853A"/>
            <stop offset=".45" stopColor="#EBCF93"/>
            <stop offset=".7" stopColor="#C9974A"/>
            <stop offset="1" stopColor="#E2BE7A"/>
          </linearGradient>

          {/* ramita: eucalipto + peonía durazno */}
          <symbol id="sprig" viewBox="0 0 160 160">
            <g filter="url(#wc)">
              <path d="M20 150 C50 120 70 90 120 40" fill="none" stroke="#7CC2A9" strokeWidth="2.5"/>
              <path d="M60 110 C70 90 90 80 104 74" fill="none" stroke="#7CC2A9" strokeWidth="2"/>
              <g fill="#9FD5C0">
                <ellipse cx="38" cy="128" rx="11" ry="8" transform="rotate(-30 38 128)"/>
                <ellipse cx="56" cy="104" rx="11" ry="8" transform="rotate(20 56 104)"/>
                <ellipse cx="74" cy="96" rx="10" ry="7" transform="rotate(-40 74 96)"/>
                <ellipse cx="96" cy="66" rx="10" ry="7" transform="rotate(30 96 66)"/>
                <ellipse cx="114" cy="52" rx="9" ry="6" transform="rotate(-20 114 52)"/>
              </g>
              <g fill="#B9E3D3">
                <ellipse cx="46" cy="116" rx="9" ry="6" transform="rotate(50 46 116)"/>
                <ellipse cx="86" cy="80" rx="9" ry="6" transform="rotate(60 86 80)"/>
                <ellipse cx="106" cy="76" rx="8" ry="6" transform="rotate(-10 106 76)"/>
                <ellipse cx="124" cy="38" rx="8" ry="5" transform="rotate(40 124 38)"/>
              </g>
            </g>
            <g filter="url(#wc)">
              <circle cx="62" cy="128" r="22" fill="#F8CDB5"/>
              <circle cx="54" cy="122" r="15" fill="#F7C2A6"/>
              <circle cx="70" cy="124" r="14" fill="#F4B393"/>
              <circle cx="62" cy="132" r="12" fill="#F7C2A6"/>
              <circle cx="62" cy="126" r="7" fill="#E09A78"/>
              <circle cx="94" cy="98" r="9" fill="#F8CDB5"/>
              <circle cx="94" cy="98" r="4" fill="#F4B393"/>
            </g>
            <g fill="#D9A95B"><circle cx="30" cy="108" r="2"/><circle cx="118" cy="62" r="1.8"/><circle cx="82" cy="140" r="1.6"/></g>
          </symbol>

          {/* escudo con laureles y XV */}
          <symbol id="crest" viewBox="0 0 132 92">
            <g fill="none" stroke="url(#gold)" strokeWidth="1.6" strokeLinecap="round">
              <path d="M38 82 C16 68 12 40 26 16"/>
              <path d="M94 82 C116 68 120 40 106 16"/>
            </g>
            <g fill="url(#gold)">
              <ellipse cx="24" cy="66" rx="6" ry="3" transform="rotate(-50 24 66)"/>
              <ellipse cx="18" cy="52" rx="6" ry="3" transform="rotate(-70 18 52)"/>
              <ellipse cx="18" cy="38" rx="6" ry="3" transform="rotate(-95 18 38)"/>
              <ellipse cx="22" cy="25" rx="5.5" ry="2.8" transform="rotate(-115 22 25)"/>
              <ellipse cx="32" cy="74" rx="5" ry="2.6" transform="rotate(10 32 74)"/>
              <ellipse cx="108" cy="66" rx="6" ry="3" transform="rotate(50 108 66)"/>
              <ellipse cx="114" cy="52" rx="6" ry="3" transform="rotate(70 114 52)"/>
              <ellipse cx="114" cy="38" rx="6" ry="3" transform="rotate(95 114 38)"/>
              <ellipse cx="110" cy="25" rx="5.5" ry="2.8" transform="rotate(115 110 25)"/>
              <ellipse cx="100" cy="74" rx="5" ry="2.6" transform="rotate(-10 100 74)"/>
            </g>
            <path d="M66 4 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="url(#gold)"/>
            <text x="66" y="70" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontWeight="600" fontSize="40" fill="#2E6B5C" letterSpacing="2">{monograma}</text>
          </symbol>

          {/* adorno divisor dorado */}
          <symbol id="ornament" viewBox="0 0 220 28">
            <g fill="none" stroke="url(#gold)" strokeWidth="1.4" strokeLinecap="round">
              <path d="M4 16 C30 6 60 24 92 14"/>
              <path d="M216 16 C190 6 160 24 128 14"/>
              <path d="M96 14 C100 6 106 6 110 14 C114 6 120 6 124 14"/>
            </g>
            <path d="M110 6 l4 8 -4 8 -4 -8 z" fill="url(#gold)"/>
            <g fill="#9FD5C0"><ellipse cx="80" cy="12" rx="5" ry="2.5" transform="rotate(-20 80 12)"/><ellipse cx="140" cy="12" rx="5" ry="2.5" transform="rotate(20 140 12)"/></g>
          </symbol>

          {/* pétalo */}
          <symbol id="petal" viewBox="0 0 14 14"><path d="M7 1 C12 4 12 10 7 13 C2 10 2 4 7 1 Z" fill="#F7C2A6" fillOpacity=".85"/></symbol>

          {/* viñetas pintadas */}
          <symbol id="v-cal" viewBox="0 0 56 56">
            <g filter="url(#wc-wash)" opacity=".7"><circle cx="28" cy="30" r="22" fill="#DCF1E8"/></g>
            <g filter="url(#wc)"><rect x="14" y="16" width="28" height="26" rx="3" fill="#F8CDB5"/><rect x="14" y="16" width="28" height="8" rx="3" fill="#E09A78"/></g>
            <g fill="none" stroke="#2E6B5C" strokeWidth="1.5" strokeLinecap="round"><path d="M20 12v8M36 12v8"/><path d="M20 31h4M26 31h4M32 31h4M20 37h4M26 37h4"/></g>
          </symbol>
          <symbol id="v-clock" viewBox="0 0 56 56">
            <g filter="url(#wc-wash)" opacity=".7"><circle cx="28" cy="28" r="22" fill="#FCE6DA"/></g>
            <g filter="url(#wc)"><circle cx="28" cy="29" r="15" fill="#9FD5C0"/></g>
            <g fill="none" stroke="#2E6B5C" strokeWidth="1.6" strokeLinecap="round"><circle cx="28" cy="29" r="15"/><path d="M28 21v8l6 4"/></g>
          </symbol>
          <symbol id="v-dress" viewBox="0 0 56 56">
            <g filter="url(#wc-wash)" opacity=".7"><circle cx="28" cy="30" r="22" fill="#DCF1E8"/></g>
            <g filter="url(#wc)"><path d="M23 10 h10 l-2 10 l11 26 h-28 l11 -26 z" fill="#F4B393"/></g>
            <g fill="none" stroke="#A9512F" strokeWidth="1.3" strokeLinecap="round" strokeOpacity=".7"><path d="M23 10 h10 M25 20 h6 M20 34 q8 4 16 0"/></g>
          </symbol>
          <symbol id="v-castle" viewBox="0 0 56 56">
            <g filter="url(#wc-wash)" opacity=".7"><circle cx="28" cy="30" r="22" fill="#FCE6DA"/></g>
            <g filter="url(#wc)">
              <rect x="16" y="24" width="8" height="20" fill="#9FD5C0"/><path d="M14 26 L20 12 L26 26 Z" fill="#F4B393"/>
              <rect x="32" y="24" width="8" height="20" fill="#9FD5C0"/><path d="M30 26 L36 12 L42 26 Z" fill="#F4B393"/>
              <rect x="22" y="30" width="12" height="14" fill="#7CC2A9"/>
            </g>
            <path d="M26 44 v-5 a2 2 0 0 1 4 0 v5" fill="#2E6B5C" fillOpacity=".6"/>
          </symbol>
          <symbol id="v-pin" viewBox="0 0 56 56">
            <g filter="url(#wc-wash)" opacity=".7"><circle cx="28" cy="30" r="22" fill="#DCF1E8"/></g>
            <g filter="url(#wc)"><path d="M28 46 C28 46 16 33 16 24 A12 12 0 0 1 40 24 C40 33 28 46 28 46 Z" fill="#E09A78"/></g>
            <circle cx="28" cy="24" r="4.5" fill="#fff"/>
          </symbol>
        </defs>
      </svg>
  );
}

export function LavadoPortada() {
  return (
      <svg className="bleed" style={{ top: 0 }} viewBox="0 0 390 300" aria-hidden="true">
        <g filter="url(#wc-wash)" opacity=".55"><circle cx="40" cy="60" r="110" fill="#DCF1E8"/><circle cx="360" cy="220" r="100" fill="#FCE6DA"/></g>
      </svg>
  );
}

export function SobreFondo() {
  return (
      <svg className="env-layer env-back" viewBox="0 0 320 240" preserveAspectRatio="none" aria-hidden="true">
        <rect x="4" y="4" width="312" height="232" rx="10" fill="#FCE6DA" stroke="rgba(31,58,52,.18)"/>
        <g opacity=".55">
          <use href="#sprig" x="-20" y="-10" width="120" height="120"/>
          <use href="#sprig" x="220" y="-10" width="120" height="120" transform="translate(540 0) scale(-1 1)"/>
        </g>
      </svg>
  );
}

export function SobreFrente() {
  return (
      <svg className="env-layer env-front" viewBox="0 0 320 240" preserveAspectRatio="none" aria-hidden="true">
        <path d="M4 96 L160 176 L316 96 V226 Q316 236 306 236 H14 Q4 236 4 226 Z" fill="#FFFFFF" stroke="rgba(31,58,52,.18)" strokeWidth="1.2"/>
        <g filter="url(#wc-wash)" opacity=".6">
          <circle cx="50" cy="220" r="60" fill="#A8DCC8"/>
          <circle cx="280" cy="230" r="54" fill="#F7C2A6"/>
        </g>
        <path d="M4 96 L160 176 L316 96" fill="none" stroke="rgba(31,58,52,.18)" strokeWidth="1.2"/>
      </svg>
  );
}

export function SobreSolapa() {
  return (
      <svg className="env-flap" viewBox="0 0 320 140" preserveAspectRatio="none" aria-hidden="true">
        <path d="M4 4 H316 L160 136 Z" fill="#FFFFFF" stroke="rgba(31,58,52,.2)" strokeWidth="1.2" strokeLinejoin="round"/>
        <g filter="url(#wc)" opacity=".8"><path d="M24 8 H296 L160 122 Z" fill="#DCF1E8"/></g>
        <path d="M30 10 H290 L160 118 Z" fill="none" stroke="url(#gold)" strokeWidth="1.2"/>
      </svg>
  );
}

export function LavadoHero() {
  return (
      <svg className="bleed" style={{ top: 0 }} viewBox="0 0 390 520" aria-hidden="true" data-parallax="0.08">
        <g filter="url(#wc-wash)" opacity=".5">
          <circle cx="20" cy="120" r="130" fill="#DCF1E8"/>
          <circle cx="380" cy="60" r="110" fill="#FCE6DA"/>
          <circle cx="360" cy="460" r="120" fill="#DCF1E8"/>
        </g>
      </svg>
  );
}

export function Palacio() {
  return (
      <svg className="art" viewBox="0 0 340 440" role="img" aria-label="Ilustración en acuarela de un archipiélago de islas flotantes con un palacio de torres y cúpulas, puentes, escalinata, faroles, cascadas de nubes y una luna">
        <rect width="340" height="440" fill="#FFFFFF"/>
        <g filter="url(#wc-wash)" opacity=".75">
          <circle cx="60" cy="40" r="140" fill="#DCF1E8"/>
          <circle cx="300" cy="120" r="110" fill="#E8F5EF"/>
          <circle cx="170" cy="460" r="170" fill="#FCE6DA"/>
        </g>
        {/* luna */}
        <circle cx="258" cy="78" r="34" fill="#FCE6DA" filter="url(#glow)" opacity=".9"/>
        <path filter="url(#wc)" d="M266 52 A28 28 0 1 0 266 106 A22 22 0 1 1 266 52 Z" fill="#F4C9A0"/>
        {/* estrellas */}
        <g fill="#D9A95B">
          <path className="twinkle" d="M60 60 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z"/>
          <path className="twinkle d1" d="M200 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z"/>
          <path className="twinkle d2" d="M300 170 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z"/>
          <path className="twinkle d3" d="M30 210 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z"/>
          <path className="twinkle d1" d="M150 30 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z"/>
        </g>

        {/* isla lejana izquierda */}
        <g className="float slower">
          <g filter="url(#wc)">
            <rect x="40" y="128" width="14" height="36" fill="#B9E3D3"/>
            <path d="M37 130 L47 102 L57 130 Z" fill="#F8CDB5"/>
            <rect x="56" y="142" width="10" height="22" fill="#CFEDE1"/>
            <path d="M54 144 C54 136 61 134 61 126 C61 134 68 136 68 144 Z" fill="#F8CDB5"/>
          </g>
          <g filter="url(#wc-cloud)">
            <ellipse cx="54" cy="170" rx="34" ry="10" fill="#FCE6DA"/>
            <ellipse cx="52" cy="166" rx="32" ry="9" fill="#FFFFFF"/>
          </g>
          <path filter="url(#wc-cloud)" d="M50 174 C48 186 54 196 50 210" stroke="#FFFFFF" strokeWidth="7" fill="none" strokeLinecap="round" opacity=".9"/>
        </g>

        {/* isla derecha con pabellón de cúpula */}
        <g className="float slow">
          <g filter="url(#wc)">
            <rect x="270" y="236" width="44" height="34" fill="#9FD5C0"/>
            <path d="M272 238 A20 20 0 0 1 312 238 Z" fill="#F4B393"/>
            <path d="M292 218 V206" stroke="#D9A95B" strokeWidth="2"/>
            <rect x="264" y="230" width="7" height="40" fill="#B9E3D3"/><path d="M262 232 L267.5 216 L273 232 Z" fill="#F8CDB5"/>
            <rect x="313" y="230" width="7" height="40" fill="#B9E3D3"/><path d="M311 232 L316.5 216 L322 232 Z" fill="#F8CDB5"/>
          </g>
          <path filter="url(#wc)" d="M286 270 V258 A6 6 0 0 1 298 258 V270 Z" fill="#2E6B5C" fillOpacity=".5"/>
          <g filter="url(#wc-cloud)">
            <ellipse cx="292" cy="276" rx="44" ry="11" fill="#FCE6DA"/>
            <ellipse cx="292" cy="272" rx="42" ry="10" fill="#FFFFFF"/>
          </g>
          <path filter="url(#wc-cloud)" d="M300 282 C298 296 304 306 300 322" stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round" opacity=".9"/>
        </g>

        {/* puente con faroles */}
        <g>
          <path filter="url(#wc-line)" d="M236 300 Q258 276 272 268" fill="none" stroke="url(#gold)" strokeWidth="2"/>
          <path filter="url(#wc-line)" d="M236 306 Q258 282 272 274" fill="none" stroke="#7CC2A9" strokeWidth="2"/>
          <g stroke="#B9853A" strokeWidth="1">
            <path d="M246 290 v8 M256 282 v8 M265 276 v8"/>
          </g>
          <g fill="#F4C9A0">
            <circle cx="246" cy="300" r="6" filter="url(#glow)" opacity=".8"/>
            <circle cx="256" cy="292" r="6" filter="url(#glow)" opacity=".8"/>
            <circle cx="265" cy="286" r="6" filter="url(#glow)" opacity=".8"/>
          </g>
          <g fill="#E8B060">
            <rect x="243.5" y="297" width="5" height="6" rx="1.5"/>
            <rect x="253.5" y="289" width="5" height="6" rx="1.5"/>
            <rect x="262.5" y="283" width="5" height="6" rx="1.5"/>
          </g>
        </g>

        {/* palacio principal */}
        <g className="float">
          <g transform="translate(30 80) scale(.82)">
            <g filter="url(#wc)">
              <rect x="78" y="200" width="20" height="130" fill="#CFEDE1"/>
              <path d="M74 202 L88 158 L102 202 Z" fill="#F8CDB5"/>
              <rect x="262" y="190" width="20" height="140" fill="#CFEDE1"/>
              <path d="M258 192 C258 172 272 168 272 150 C272 168 286 172 286 192 Z" fill="#F8CDB5"/>
              <rect x="96" y="250" width="168" height="90" fill="#B9E3D3"/>
              <rect x="108" y="160" width="30" height="180" fill="#9FD5C0"/>
              <path d="M102 162 L123 98 L144 162 Z" fill="#F4B393"/>
              <rect x="222" y="150" width="30" height="190" fill="#9FD5C0"/>
              <path d="M216 152 C216 128 237 122 237 92 C237 122 258 128 258 152 Z" fill="#F4B393"/>
              <rect x="140" y="180" width="80" height="160" fill="#7CC2A9" fillOpacity=".9"/>
              <rect x="160" y="96" width="40" height="100" fill="#9FD5C0"/>
              <path d="M152 98 L180 22 L208 98 Z" fill="#F4B393"/>
              <path d="M180 22 V8 L196 13 L180 18 Z" fill="#D9A95B"/>
            </g>
            <g filter="url(#wc)" fill="#2E6B5C" fillOpacity=".5">
              <path d="M174 140 V126 A6 6 0 0 1 186 126 V140 Z"/>
              <circle cx="180" cy="162" r="6"/>
              <path d="M117 210 V196 A6 6 0 0 1 129 196 V210 Z"/>
              <path d="M117 250 V236 A6 6 0 0 1 129 236 V250 Z"/>
              <path d="M231 200 V186 A6 6 0 0 1 243 186 V200 Z"/>
              <path d="M231 240 V226 A6 6 0 0 1 243 226 V240 Z"/>
              <path d="M156 232 V216 A6 6 0 0 1 168 216 V232 Z"/>
              <path d="M192 232 V216 A6 6 0 0 1 204 216 V232 Z"/>
            </g>
            <g fill="#F4C9A0" opacity=".7">
              <circle cx="180" cy="162" r="3"/>
              <circle cx="123" cy="203" r="2.5"/>
              <circle cx="237" cy="193" r="2.5"/>
            </g>
            <path filter="url(#wc)" d="M166 340 V300 A14 14 0 0 1 194 300 V340 Z" fill="#E09A78"/>
            <g filter="url(#wc-line)" fill="none" stroke="#2E6B5C" strokeOpacity=".38" strokeWidth=".9" strokeLinejoin="round">
              <path d="M102 162 L123 98 L144 162 M108 162 V340 M138 162 V250"/>
              <path d="M216 152 C216 128 237 122 237 92 C237 122 258 128 258 152 M222 152 V340 M252 152 V250"/>
              <path d="M152 98 L180 22 L208 98 M160 98 V180 M200 98 V180"/>
              <path d="M140 180 H220 M96 250 H108 M252 250 H264 M74 202 L88 158 L102 202 M258 192 C258 172 272 168 272 150 C272 168 286 172 286 192"/>
              <path d="M96 250 V246 H102 V250 M252 250 V246 H258 V250 M140 180 V174 H148 V180 M212 180 V174 H220 V180 M176 180 V174 H184 V180"/>
            </g>
            {/* guirnalda dorada */}
            <path d="M108 262 Q130 276 152 262 Q180 280 208 262 Q230 276 252 262" fill="none" stroke="url(#gold)" strokeWidth="1.6"/>
          </g>
          {/* nube base del palacio */}
          <g filter="url(#wc-cloud)">
            <g fill="#FCE6DA" fillOpacity=".95">
              <ellipse cx="130" cy="368" rx="62" ry="20"/>
              <ellipse cx="184" cy="374" rx="78" ry="22"/>
              <ellipse cx="236" cy="366" rx="56" ry="18"/>
            </g>
            <g fill="#FFFFFF">
              <ellipse cx="128" cy="360" rx="60" ry="20"/>
              <ellipse cx="182" cy="366" rx="76" ry="22"/>
              <ellipse cx="234" cy="358" rx="54" ry="18"/>
            </g>
          </g>
          {/* cascadas de nube */}
          <g filter="url(#wc-cloud)" stroke="#FFFFFF" fill="none" strokeLinecap="round" opacity=".95">
            <path d="M150 380 C146 398 156 410 150 432" strokeWidth="10"/>
            <path d="M206 384 C210 400 200 414 206 436" strokeWidth="8"/>
          </g>
          {/* escalinata */}
          <g filter="url(#wc)">
            <rect x="156" y="380" width="22" height="4" fill="#F8CDB5"/>
            <rect x="146" y="388" width="22" height="4" fill="#F8CDB5"/>
            <rect x="136" y="396" width="22" height="4" fill="#F8CDB5"/>
            <rect x="126" y="404" width="22" height="4" fill="#F8CDB5"/>
          </g>
        </g>

        {/* nubes delanteras */}
        <g filter="url(#wc-cloud)">
          <g fill="#DCF1E8" fillOpacity=".8"><ellipse cx="40" cy="430" rx="70" ry="22"/><ellipse cx="310" cy="432" rx="70" ry="22"/></g>
          <g fill="#FFFFFF"><ellipse cx="36" cy="424" rx="66" ry="20"/><ellipse cx="306" cy="426" rx="66" ry="20"/><ellipse cx="170" cy="442" rx="90" ry="18"/></g>
        </g>
        {/* pájaros */}
        <g fill="none" stroke="#2E6B5C" strokeOpacity=".5" strokeWidth="1.2" strokeLinecap="round">
          <path d="M110 70 q5 -5 10 0 q5 -5 10 0"/>
          <path d="M136 88 q4 -4 8 0 q4 -4 8 0"/>
        </g>
      </svg>
  );
}

export function LavadoCuenta() {
  return (
      <svg className="bleed" style={{ top: "-40px" }} viewBox="0 0 390 260" aria-hidden="true" data-parallax="0.05">
        <g filter="url(#wc-wash)" opacity=".5"><circle cx="380" cy="80" r="110" fill="#DCF1E8"/><circle cx="10" cy="200" r="90" fill="#FCE6DA"/></g>
      </svg>
  );
}

export function LavadoDetalles() {
  return (
      <svg className="bleed" style={{ top: "40px" }} viewBox="0 0 390 420" aria-hidden="true" data-parallax="0.06">
        <g filter="url(#wc-wash)" opacity=".45"><circle cx="0" cy="120" r="120" fill="#A8DCC8"/><circle cx="390" cy="320" r="120" fill="#F7C2A6"/></g>
      </svg>
  );
}

export function Islas() {
  return (
      <svg className="art divider-art" viewBox="0 0 390 150" role="img" aria-label="Ilustración en acuarela de tres islas de nubes con torres y una cúpula">
        <g filter="url(#wc-wash)" opacity=".45">
          <circle cx="80" cy="80" r="60" fill="#A8DCC8"/><circle cx="310" cy="70" r="60" fill="#F7C2A6"/>
        </g>
        <g className="float slow">
          <g filter="url(#wc)">
            <rect x="64" y="60" width="18" height="48" fill="#9FD5C0"/><path d="M60 62 L73 26 L86 62 Z" fill="#F4B393"/>
            <rect x="84" y="78" width="12" height="30" fill="#CFEDE1"/><path d="M82 80 C82 70 90 68 90 58 C90 68 98 70 98 80 Z" fill="#F8CDB5"/>
          </g>
          <g filter="url(#wc-cloud)"><ellipse cx="80" cy="114" rx="40" ry="11" fill="#FCE6DA"/><ellipse cx="78" cy="110" rx="38" ry="10" fill="#fff"/></g>
        </g>
        <path d="M104 100 Q140 80 160 96" fill="none" stroke="url(#gold)" strokeWidth="1.6"/>
        <path d="M228 96 Q250 80 288 98" fill="none" stroke="url(#gold)" strokeWidth="1.6"/>
        <g className="float">
          <g filter="url(#wc)">
            <rect x="164" y="74" width="60" height="44" fill="#9FD5C0"/>
            <path d="M168 76 A26 26 0 0 1 220 76 Z" fill="#F4B393"/>
            <path d="M194 50 V36" stroke="#D9A95B" strokeWidth="2"/>
            <rect x="152" y="64" width="10" height="54" fill="#B9E3D3"/><path d="M150 66 L157 44 L164 66 Z" fill="#F8CDB5"/>
            <rect x="226" y="64" width="10" height="54" fill="#B9E3D3"/><path d="M224 66 L231 44 L238 66 Z" fill="#F8CDB5"/>
          </g>
          <path filter="url(#wc)" d="M186 118 V100 A8 8 0 0 1 202 100 V118 Z" fill="#2E6B5C" fillOpacity=".45"/>
          <g filter="url(#wc-cloud)"><ellipse cx="194" cy="124" rx="62" ry="14" fill="#FCE6DA"/><ellipse cx="194" cy="120" rx="60" ry="13" fill="#fff"/></g>
        </g>
        <g className="float slower">
          <g filter="url(#wc)">
            <rect x="296" y="54" width="16" height="56" fill="#9FD5C0"/><path d="M292 56 C292 40 304 36 304 22 C304 36 316 40 316 56 Z" fill="#F4B393"/>
            <rect x="314" y="72" width="14" height="38" fill="#CFEDE1"/><path d="M311 74 L321 50 L331 74 Z" fill="#F8CDB5"/>
          </g>
          <g filter="url(#wc-cloud)"><ellipse cx="312" cy="116" rx="40" ry="11" fill="#FCE6DA"/><ellipse cx="310" cy="112" rx="38" ry="10" fill="#fff"/></g>
        </g>
        <g fill="#D9A95B">
          <path className="twinkle" d="M130 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z"/>
          <path className="twinkle d2" d="M262 124 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z"/>
          <path className="twinkle d1" d="M24 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z"/>
        </g>
      </svg>
  );
}

export function Mapa() {
  return (
      <svg className="art" viewBox="0 0 342 170" role="img" aria-label="Mapa ilustrativo en acuarela de la zona del salón">
        <rect width="342" height="170" fill="#FFFFFF"/>
        <g filter="url(#wc-wash)" opacity=".5">
          <circle cx="60" cy="130" r="70" fill="#A8DCC8"/>
          <circle cx="300" cy="40" r="60" fill="#DCF1E8"/>
        </g>
        <g filter="url(#wc)" fill="none" stroke="#B9E3D3" strokeWidth="10" strokeLinecap="round">
          <path d="M-10 60 C80 50 160 80 352 64"/><path d="M120 -10 C130 60 110 120 130 180"/><path d="M250 -10 C240 70 260 120 245 180"/>
        </g>
        <g filter="url(#wc)" fill="#9FD5C0"><circle cx="300" cy="120" r="12"/><circle cx="316" cy="132" r="9"/><circle cx="60" cy="30" r="10"/></g>
        <path filter="url(#wc-line)" d="M20 140 C90 120 140 120 186 92" fill="none" stroke="#2E6B5C" strokeOpacity=".55" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round"/>
        <circle cx="186" cy="70" r="22" fill="#FCE6DA" filter="url(#glow)"/>
        <g filter="url(#wc)">
          <path d="M186 96 C186 96 172 80 172 70 A14 14 0 0 1 200 70 C200 80 186 96 186 96 Z" fill="#E09A78"/>
        </g>
        <circle cx="186" cy="70" r="5" fill="#FFFFFF"/>
        <path d="M300 18 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="url(#gold)"/>
      </svg>
  );
}

export function LavadoRegalo() {
  return (
      <svg className="bleed" style={{ top: "20px" }} viewBox="0 0 390 380" aria-hidden="true" data-parallax="0.06">
        <g filter="url(#wc-wash)" opacity=".5"><circle cx="390" cy="80" r="120" fill="#FCE6DA"/><circle cx="0" cy="320" r="110" fill="#DCF1E8"/></g>
      </svg>
  );
}

export function SobreRegalo() {
  return (
      <svg className="env-ill" viewBox="0 0 120 84" aria-hidden="true">
        <g filter="url(#wc)">
          <rect x="6" y="14" width="108" height="64" rx="6" fill="#FCE6DA"/>
          <path d="M6 18 L60 52 L114 18 Z" fill="#F8CDB5"/>
        </g>
        <path d="M8 76 L46 44 M112 76 L74 44" stroke="#E09A78" strokeWidth="1.2" fill="none" opacity=".7"/>
        <circle cx="60" cy="50" r="10" fill="#A9512F"/>
        <path d="M60 55 s-5 -3 -5 -6 a2.6 2.6 0 0 1 5 -1 a2.6 2.6 0 0 1 5 1 c0 3 -5 6 -5 6 z" fill="#FFF4EC"/>
        <use href="#sprig" x="78" y="-6" width="44" height="44"/>
      </svg>
  );
}
