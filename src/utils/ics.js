// Genera un archivo .ics (formato estándar de calendario) para que el
// invitado pueda agendar el evento con un clic, sin depender de ninguna
// API externa (funciona con Google Calendar, Apple Calendar, Outlook, etc.)

function toICSDate(dateStr) {
  const d = new Date(dateStr);
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function downloadICS({ titulo, descripcion, ubicacion, inicio, duracionHoras = 4 }) {
  const dtStart = toICSDate(inicio);
  const fin = new Date(new Date(inicio).getTime() + duracionHoras * 60 * 60 * 1000).toISOString();
  const dtEnd = toICSDate(fin);
  const dtStamp = toICSDate(new Date().toISOString());

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Invitacion Boda//ES",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@invitacion-boda`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${titulo}`,
    `DESCRIPTION:${descripcion}`,
    `LOCATION:${ubicacion}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "boda.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
