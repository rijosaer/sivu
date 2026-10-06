// Adornos vectoriales del diseño «Ensueño» (escudo XV con laureles, ornamento
// dorado, pétalos), llevados desde la maqueta public/modelos/xv.html. Las
// ilustraciones grandes son acuarelas pintadas (carpeta arte/).

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
