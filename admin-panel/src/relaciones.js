// A qué invitación pertenece cada persona, dicho sin repetirse.
//
// El problema: en una invitación individual la persona *es* la invitación, así
// que el nombre salía dos veces seguidas ("Carlos Rodríguez · Carlos
// Rodríguez"); y en una de pareja la invitación se llama "Carlos y Ana", que
// vuelve a contener el nombre de quien está en esa fila. Ninguna de las dos
// añade nada.
//
// La regla: la columna dice lo que la fila todavía no dice. Si la invitación se
// llama como la persona, se muestra con quién más viene; si no, se muestra el
// nombre de la invitación, que ahí sí informa (una familia, o de quién es el
// cupo que ocupa).

function unirNombres(nombres) {
  if (nombres.length <= 1) return nombres[0] || "";
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

// Cierto cuando el título de la invitación no aporta nada frente al nombre de
// la persona: o es el mismo, o lo contiene (el "Carlos y Ana" de las parejas).
export function tituloRedundante(nombrePersona, nombreInvitacion) {
  const persona = (nombrePersona || "").trim();
  const invitacion = (nombreInvitacion || "").trim();
  if (!persona || !invitacion) return false;
  return invitacion === persona || invitacion.includes(persona);
}

// Texto para la columna "Invitación". `companeros` son las otras personas de
// esa misma invitación. Devuelve "" cuando no hay nada que agregar.
export function contextoDe(nombrePersona, nombreInvitacion, companeros = []) {
  const otros = companeros.map((n) => (n || "").trim()).filter(Boolean);
  if (tituloRedundante(nombrePersona, nombreInvitacion)) {
    return otros.length ? `con ${unirNombres(otros)}` : "";
  }
  return nombreInvitacion || "";
}

// Cierto cuando una invitación cubre a una sola persona que además le da
// nombre: en las listas agrupadas y en las tarjetas se pinta en una sola línea
// en vez de un encabezado con una fila idéntica debajo.
//
// `total` son los miembros reales de la invitación; `personas` puede llegar
// recortado por el filtro de estado. Sin mirar el total, una pareja donde solo
// uno respondió se colapsaba como si fuera individual: ese único chip quedaba
// junto al título "Fulano y Esposo", pareciendo el estado de los dos y
// escondiendo a quien faltaba.
export function esUnaSolaPersona(grupo) {
  const total = grupo.total ?? grupo.personas.length;
  return (
    total === 1 &&
    grupo.personas.length === 1 &&
    tituloRedundante(grupo.personas[0].nombre, grupo.invitacion)
  );
}
