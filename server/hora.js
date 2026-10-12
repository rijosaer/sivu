// La hora del negocio es la de Colombia, sin importar dónde corra el servidor
// (Railway corre en UTC).
export const ZONA_BOGOTA = "America/Bogota";

export function ahoraEnBogota() {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: ZONA_BOGOTA, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date()).map((p) => [p.type, p.value])
  );
  return { fecha: `${partes.year}-${partes.month}-${partes.day}`, hora: Number(partes.hour) };
}
