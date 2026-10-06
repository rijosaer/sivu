// Mapa ilustrativo del diseño «Gala», llevado desde public/modelos/corporativo.html.
export function Mapa() {
  return (
    <svg viewBox="0 0 342 200" role="img" aria-label="Mapa ilustrativo de la zona del salón">
      <rect width="342" height="200" fill="#111113"/>
      <g stroke="rgba(243,241,236,.07)" strokeWidth="1">
        <path d="M0 20h342M0 40h342M0 60h342M0 80h342M0 100h342M0 120h342M0 140h342M0 160h342M0 180h342"/>
        <path d="M20 0v200M40 0v200M60 0v200M80 0v200M100 0v200M120 0v200M140 0v200M160 0v200M180 0v200M200 0v200M220 0v200M240 0v200M260 0v200M280 0v200M300 0v200M320 0v200"/>
      </g>
      <g fill="#1C1C1F">
        <rect x="20" y="20" width="80" height="40" rx="2"/><rect x="120" y="20" width="40" height="60" rx="2"/>
        <rect x="220" y="20" width="100" height="40" rx="2"/><rect x="20" y="120" width="60" height="60" rx="2"/>
        <rect x="240" y="120" width="80" height="60" rx="2"/><rect x="100" y="140" width="100" height="40" rx="2"/>
      </g>
      <path d="M0 100 H130 Q150 100 160 110 L196 146 Q206 156 226 156 H342" stroke="#F3F1EC" strokeOpacity=".5" strokeWidth="3" fill="none" strokeDasharray="2 8" strokeLinecap="round"/>
      <circle className="pin-pulse" cx="196" cy="96" r="20" fill="#D4FF3A" fillOpacity=".35"/>
      <circle cx="196" cy="96" r="9" fill="#D4FF3A"/>
      <circle cx="196" cy="96" r="3.5" fill="#0A0A0B"/>
    </svg>
  );
}
