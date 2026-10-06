// /plantillas/<diseño> abre la demostración pública de ese diseño (Demo.jsx).
// Vive aparte para que el punto de entrada no cargue la demo en cada visita.
export function disenoDeDemo() {
  const [primero, segundo] = window.location.pathname.split("/").filter(Boolean);
  return primero === "plantillas" ? segundo || "" : null;
}
