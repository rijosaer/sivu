import { useCallback, useEffect, useRef, useState } from "react";
import { api, getInvitacionActual } from "../api";
import { useToast } from "../ui/Toast";

// Un pequeño acorde de dos notas hecho con Web Audio, sin archivo de sonido.
// El AudioContext debe crearse/reanudarse tras un gesto del usuario (la
// campana), porque los navegadores bloquean el sonido automático.
function chime(ctx) {
  if (!ctx) return;
  const ahora = ctx.currentTime;
  [880, 1174.66].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gan = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = ahora + i * 0.14;
    gan.gain.setValueAtTime(0, t);
    gan.gain.linearRampToValueAtTime(0.22, t + 0.02);
    gan.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gan).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

function textoNovedad(n) {
  const quien = n.familia || n.invitacion || "Alguien";
  if (n.tipo === "apertura") return { icono: "📬", texto: `${quien} abrió su invitación`, tono: "info" };
  if (n.estado === "confirmado")
    return { icono: "💚", texto: `${n.nombre || quien} confirmó que asiste`, tono: "ok" };
  return { icono: "💛", texto: `${n.nombre || quien} no podrá asistir`, tono: "info" };
}

// Avisos en tiempo real mientras el panel está abierto: sondea las novedades
// (respuestas y aperturas) y, por cada una nueva, muestra un toast, suena un
// chime y lanza una notificación del navegador (si se dio permiso).
// Clave estable de un evento, para no avisar dos veces del mismo. Incluye el
// momento: cada visita nueva (o cada respuesta) es un evento distinto, pero el
// mismo evento repetido por precisión de tiempo se filtra.
function claveEvento(n) {
  return `${n.tipo === "apertura" ? "a" : "r"}:${n.codigo}:${n.nombre || ""}:${n.cuando}`;
}

export function useAvisos() {
  const toast = useToast();
  const [activo, setActivo] = useState(() => localStorage.getItem("avisos") === "1");
  const audioRef = useRef(null);
  const desdeRef = useRef(null);
  const vistosRef = useRef(new Set());

  const activar = useCallback(async () => {
    // Gesto del usuario: desbloquear audio y pedir permiso de notificación.
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && !audioRef.current) audioRef.current = new AC();
      await audioRef.current?.resume();
      chime(audioRef.current); // pitido de prueba, confirma que se oye
    } catch {
      /* sin audio disponible: los toasts igual funcionan */
    }
    if ("Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        /* ignora */
      }
    }
    localStorage.setItem("avisos", "1");
    setActivo(true);
    toast("Avisos activados: te avisaré al confirmar o abrir una invitación");
  }, [toast]);

  const desactivar = useCallback(() => {
    localStorage.removeItem("avisos");
    setActivo(false);
  }, []);

  useEffect(() => {
    if (!activo) return;
    let cancelado = false;

    // Arranca marcando como vistas todas las novedades existentes, para no
    // avisar de lo viejo, y deja el cursor en la más reciente.
    (async () => {
      try {
        const r = await api.novedades(null);
        if (cancelado) return;
        r.forEach((n) => vistosRef.current.add(claveEvento(n)));
        desdeRef.current = r[0]?.cuando || new Date().toISOString();
      } catch {
        if (!cancelado) desdeRef.current = new Date().toISOString();
      }
    })();

    const id = setInterval(async () => {
      try {
        const lote = await api.novedades(desdeRef.current);
        if (lote.length) desdeRef.current = lote[0].cuando; // avanza el cursor
        // Se descartan las ya vistas: el cursor puede volver a traer un evento
        // por diferencias de precisión de tiempo entre milisegundos y micros.
        const frescas = lote.filter((n) => !vistosRef.current.has(claveEvento(n)));
        if (!frescas.length) return;
        frescas.forEach((n) => vistosRef.current.add(claveEvento(n)));
        // De la más antigua a la más nueva, para leerlas en orden.
        for (const n of [...frescas].reverse()) {
          const { icono, texto, tono } = textoNovedad(n);
          toast(`${icono} ${texto}`, tono);
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(getInvitacionActual()?.nombre || "Sivú", { body: texto });
            } catch {
              /* ignora */
            }
          }
        }
        chime(audioRef.current);
      } catch {
        /* reintenta en el próximo ciclo */
      }
    }, 20000);

    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [activo, toast]);

  return { activo, activar, desactivar };
}
