// Iconos de la navegación y de los botones. Van dibujados aquí y no como
// archivos ni librería: son trazos simples y así no se suma una dependencia ni
// una petición más por icono. Los logos de marcas (WhatsApp) no se dibujan a
// mano: un intento aproximado se nota, y el botón se entiende igual con el
// texto «Enviar por WhatsApp».
//
// Todos comparten caja de 24, trazo de 1.6 y `currentColor`, para que hereden
// el color del texto y se vean parejos a cualquier tamaño.
const TRAZOS = {
  // «mas» y «volver» ya se usaban en varias pantallas sin estar dibujados (no
  // salía nada); los demás son del panel nuevo: pestañas del evento y menú.
  mas: <path d="M12 5v14M5 12h14" />,
  volver: <path d="M15 18l-6-6 6-6" />,
  flecha: <path d="M9 6l6 6-6 6" />,
  cerrar: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  inicio: <path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5z" />,
  envio: (
    <>
      <path d="M21 3L10 14" />
      <path d="M21 3l-7 18-4-7-7-4 18-7z" />
    </>
  ),
  respuesta: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.7 2.7L16 9.8" />
    </>
  ),
  regalo: (
    <>
      <rect x="3.5" y="8" width="17" height="4" rx="1" />
      <path d="M5 12v7.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V12M12 8v12.5" />
      <path d="M12 8C10.5 4.5 7 4.5 7 6.5S10 8 12 8zM12 8c1.5-3.5 5-3.5 5-1.5S14 8 12 8z" />
    </>
  ),
  personas: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
      <path d="M15.5 5.2a3 3 0 0 1 0 5.6M17 14.6c1.9.5 3.1 2 3.5 4.4" />
    </>
  ),
  colapsar: <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />,
  expandir: <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  resumen: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  sobre: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  lista: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="3.8" cy="6" r="1" />
      <circle cx="3.8" cy="12" r="1" />
      <circle cx="3.8" cy="18" r="1" />
    </>
  ),
  chat: (
    <>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12Z" />
      <path d="M9 11h6M9 14.5h3.5" />
    </>
  ),
  texto: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h4" />
    </>
  ),
  flor: (
    <>
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 9.6c0-2.4-1-3.9 0-5.6 1 1.7 0 3.2 0 5.6ZM14.4 12c2.4 0 3.9-1 5.6 0-1.7 1-3.2 0-5.6 0ZM12 14.4c0 2.4 1 3.9 0 5.6-1-1.7 0-3.2 0-5.6ZM9.6 12c-2.4 0-3.9 1-5.6 0 1.7-1 3.2 0 5.6 0Z" />
    </>
  ),
  paleta: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.5-1-1.8-1-2.8 0-.8.7-1.4 1.6-1.4H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7Z" />
      <circle cx="8" cy="10" r="1" />
      <circle cx="12" cy="7.5" r="1" />
      <circle cx="16" cy="10" r="1" />
    </>
  ),
  campana: (
    <>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z" />
      <path d="M10.5 19a1.8 1.8 0 0 0 3 0" />
    </>
  ),
  "campana-off": (
    <>
      <path d="M18 8.5a6 6 0 0 0-9.2-5.1M6.2 6.3A6 6 0 0 0 6 8.5c0 5-2 6.5-2 6.5h12" />
      <path d="M10.5 19a1.8 1.8 0 0 0 3 0M3 3l18 18" />
    </>
  ),
  mas: <path d="M12 5v14M5 12h14" />,
  buscar: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  enlace: (
    <>
      <path d="M10 13.5a4 4 0 0 0 5.7.4l2.8-2.8a4 4 0 0 0-5.7-5.7l-1.4 1.4" />
      <path d="M14 10.5a4 4 0 0 0-5.7-.4l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.4-1.4" />
    </>
  ),
  ojo: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  descargar: (
    <>
      <path d="M12 4v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4 19h16" />
    </>
  ),
  copiar: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </>
  ),
  persona: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  llave: (
    <>
      <circle cx="8" cy="15" r="4.5" />
      <path d="m11.2 11.8 8.3-8.3M17 7l2.5 2.5M14 10l2 2" />
    </>
  ),
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  ajustes: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  volver: <path d="M14.5 6 8.5 12l6 6" />,
  salir: (
    <>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" />
    </>
  ),
};

export default function Icono({ nombre, className = "w-4 h-4" }) {
  const trazo = TRAZOS[nombre];
  if (!trazo) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {trazo}
    </svg>
  );
}
