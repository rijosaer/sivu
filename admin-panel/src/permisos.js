// Qué puede cambiar el cliente de un evento. Se guarda por evento (en sus
// ajustes de tema, clave «permiso-cliente») y lo decide el dueño en Ajustes
// del evento. Colores y diseño nunca: esos los define Sivú.
export const PERMISO_CLIENTE = "permiso-cliente";

export const PERMISOS = [
  {
    key: "ver",
    titulo: "Solo mira",
    paquete: "Paquete esencial",
    detalle: "Ve cómo van las confirmaciones y maneja sus invitados. No cambia nada de la invitación.",
  },
  {
    key: "textos",
    titulo: "Edita los textos",
    paquete: "Paquete de $200.000",
    detalle: "Además puede corregir los textos de la invitación. Colores y diseño siguen siendo de Sivú.",
  },
];
