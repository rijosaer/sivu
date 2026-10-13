// /cotizacion/<token> y /datos/<token>: páginas del negocio de Sivú que se le
// mandan a un cliente (su cotización y el formulario con los datos de su
// evento). Viven aparte de las invitaciones para no cargarlas en cada visita.
export function paginaNegocio() {
  const [primero, segundo] = window.location.pathname.split("/").filter(Boolean);
  if ((primero === "cotizacion" || primero === "datos") && segundo) return { pagina: primero, token: segundo };
  return null;
}
