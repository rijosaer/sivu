import { useEffect, useRef, useState } from "react";

// Piezas que comparten los diseños alternativos (Ensueño, Gala…): fechas en la
// zona horaria del evento, cuenta regresiva, pases del invitado, fuentes y la
// aparición suave de los bloques al hacer scroll.

export const ZONA = "America/Bogota";

// Toda la portada abre la invitación con un toque, no solo el objeto (sello,
// globo, velas, cinta…): quien no le atina al punto exacto igual entra. Los
// botones y enlaces de la portada siguen haciendo lo suyo (y no abren dos veces).
export function alTocarPortada(abrir) {
  return (e) => {
    if (!e.target.closest("button, a, input, select, textarea, label")) abrir();
  };
}

export function partesFecha(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const f = (o) => new Intl.DateTimeFormat("es-CO", { timeZone: ZONA, ...o }).format(d);
  const hora = f({ hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s?a\.?\s?m\.?/i, " a. m.")
    .replace(/\s?p\.?\s?m\.?/i, " p. m.");
  return {
    fecha: d,
    dia: f({ day: "numeric" }),
    diaDos: f({ day: "2-digit" }),
    semana: f({ weekday: "long" }),
    semanaCorta: f({ weekday: "short" }).replace(".", ""),
    mes: f({ month: "long" }),
    mesCorto: f({ month: "short" }).replace(".", ""),
    mesNum: f({ month: "2-digit" }),
    anio: f({ year: "numeric" }),
    anioCorto: f({ year: "2-digit" }),
    hora,
    hora24: f({ hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

export function limiteLegible(fecha) {
  if (!fecha) return null;
  const d = new Date(`${fecha}T00:00:00-05:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: ZONA });
}

// Días, horas, minutos y segundos que faltan; null si ya pasó o no hay fecha.
export function useCuentaRegresiva(fecha) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!fecha) return null;
  const resta = fecha.getTime() - ahora;
  if (resta <= 0) return null;
  const s = Math.floor(resta / 1000);
  const dos = (n) => String(n).padStart(2, "0");
  return {
    dias: String(Math.floor(s / 86400)),
    horas: dos(Math.floor((s % 86400) / 3600)),
    min: dos(Math.floor((s % 3600) / 60)),
    seg: dos(s % 60),
  };
}

// Cuántos pases tiene la invitación personal (0 si se abre sin código).
export function pasesDe(invitacion) {
  if (!invitacion) return 0;
  if (invitacion.tipo === "cupos") return (invitacion.cupos || 0) + 1;
  return (invitacion.miembros || []).filter((m) => !m.es_acompanante).length || 1;
}

export function useFuentes(href) {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => link.remove();
  }, [href]);
}

// Agrega `claseVisto` a cada elemento con `selector` cuando entra en pantalla.
export function useAparecer(dep, selector, claseVisto) {
  const ref = useRef(null);
  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    const els = raiz.querySelectorAll(selector);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add(claseVisto));
      return;
    }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add(claseVisto); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [dep, selector, claseVisto]);
  return ref;
}

// Enlace de «Agregar al calendario» (Google Calendar), con 5 horas de evento.
export function enlaceCalendario({ titulo, fecha, lugar, detalle }) {
  if (!fecha) return null;
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const fin = new Date(fecha.getTime() + 5 * 3600 * 1000);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: titulo || "Evento",
    dates: `${fmt(fecha)}/${fmt(fin)}`,
    location: lugar || "",
    details: detalle || "",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
