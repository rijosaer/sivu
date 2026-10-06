// Iconos de línea del diseño Jardín. Heredan el color del texto (currentColor).
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" };

export function Castillo({ className }) {
  return (
    <svg viewBox="0 0 64 56" className={className} aria-hidden="true" fill="currentColor">
      <path d="M8 56V30l-3-4h3v-8l3-7 3 7v8h3l-3 4v6h6V22l-3-4h3V9l3-8 3 8v9h3l-3 4v8h4V22l-3-4h3V9l3-8 3 8v9h3l-3 4v14h6v-6l-3-4h3v-8l3-7 3 7v8h3l-3 4v26H38V44a6 6 0 0 0-12 0v12z" />
    </svg>
  );
}

export function Corbata({ className }) {
  return (
    <svg viewBox="0 0 40 64" className={className} aria-hidden="true" fill="currentColor">
      <path d="M4 2l16 8L36 2v12L24 12l4 6-8 44-8-44 4-6-12 2z" />
    </svg>
  );
}

export function Vestido({ className }) {
  return (
    <svg viewBox="0 0 56 64" className={className} aria-hidden="true" fill="currentColor">
      <path d="M20 2h4l4 8 4-8h4l-2 14 4 6-2 4c8 10 14 22 16 38H0c2-16 8-28 16-38l-2-4 4-6z" />
    </svg>
  );
}

export function CalendarioCheck({ className }) {
  return (
    <svg viewBox="0 0 64 60" className={className} aria-hidden="true" {...base} strokeWidth="2.2">
      <rect x="4" y="8" width="48" height="40" rx="3" />
      <path d="M4 18h48M16 3v9M40 3v9" />
      {[0, 1, 2, 3].map((c) =>
        [0, 1, 2].map((f) => <path key={`${c}${f}`} d={`M${11 + c * 10} ${25 + f * 7}h5`} />)
      )}
      <circle cx="50" cy="46" r="10" fill="rgb(var(--color-paper))" />
      <path d="M45 46l4 4 7-8" />
    </svg>
  );
}

export function Sobre({ className }) {
  return (
    <svg viewBox="0 0 64 44" className={className} aria-hidden="true" fill="currentColor">
      <path d="M2 4h60v36H2z" opacity=".9" />
      <path d="M2 4l30 22L62 4" fill="none" stroke="rgb(var(--color-paper))" strokeWidth="3" />
      <path d="M2 40l22-18M62 40L40 22" fill="none" stroke="rgb(var(--color-paper))" strokeWidth="2" />
    </svg>
  );
}

export function Pin({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
    </svg>
  );
}

export function CheckCirculo({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth="2">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M7.5 12.5l3 3 6-6.5" />
    </svg>
  );
}

export function Corazon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.2 0 3.6 1.2 5.2 3 1.6-1.8 3-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export function Tiara({ className }) {
  return (
    <svg viewBox="0 0 120 52" className={className} aria-hidden="true" {...base} strokeWidth="1.6">
      <path d="M8 44c16-8 34-11 52-11s36 3 52 11" />
      <path d="M12 42l6-18 10 12 9-22 10 18 13-26 13 26 10-18 9 22 10-12 6 18" />
      <circle cx="60" cy="7" r="3.5" />
      <circle cx="37" cy="13" r="2.5" />
      <circle cx="83" cy="13" r="2.5" />
      <circle cx="18" cy="23" r="2" />
      <circle cx="102" cy="23" r="2" />
      <path d="M50 36c3-4 7-4 10 0 3-4 7-4 10 0" />
    </svg>
  );
}

export function Mariposa({ className }) {
  return (
    <svg viewBox="0 0 40 32" className={className} aria-hidden="true" {...base} strokeWidth="1">
      <path d="M20 8v18M20 8l-3-6M20 8l3-6" />
      <path d="M20 12C14 0 2 2 4 10c1 5 8 6 16 4M20 12c6-12 18-10 16-2-1 5-8 6-16 4" />
      <path d="M20 16c-6 0-12 4-10 9 2 4 8 1 10-5M20 16c6 0 12 4 10 9-2 4-8 1-10-5" />
    </svg>
  );
}

export function Play({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

export function Pausa({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
    </svg>
  );
}
