import { useEffect, useRef, useState } from "react";

export default function MusicToggle({ src, titulo }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // Arranca sola al cargar. Los navegadores bloquean la reproducción con
  // sonido hasta que hay un gesto del usuario (sobre todo en el celular), así
  // que si el intento directo falla, se queda esperando el primer toque en
  // cualquier parte —por ejemplo el de "Abrir invitación"— y ahí empieza.
  useEffect(() => {
    if (!src) return;
    const audio = audioRef.current;
    if (!audio) return;

    // En el editor del panel no debe sonar nada.
    if (new URLSearchParams(window.location.search).get("editor") === "1") return;

    let cancelado = false;
    const eventos = ["pointerdown", "keydown", "touchstart"];

    const reproducir = () =>
      audio
        .play()
        .then(() => {
          if (!cancelado) setPlaying(true);
        })
        .catch(() => {});

    const alGesto = () => {
      quitarEscuchas();
      reproducir();
    };
    const quitarEscuchas = () =>
      eventos.forEach((e) => window.removeEventListener(e, alGesto));

    audio
      .play()
      .then(() => {
        if (!cancelado) setPlaying(true);
      })
      .catch(() => {
        // Bloqueado: esperar el primer gesto.
        eventos.forEach((e) => window.addEventListener(e, alGesto, { passive: true }));
      });

    return () => {
      cancelado = true;
      quitarEscuchas();
    };
  }, [src]);

  if (!src) return null;

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <>
      <audio ref={audioRef} src={src} loop />
      <button
        onClick={toggle}
        title={titulo}
        aria-label={playing ? "Pausar música" : "Reproducir música"}
        className="fixed bottom-5 right-5 z-[60] w-12 h-12 rounded-full bg-gold-dark text-paper flex items-center justify-center shadow-lg hover:bg-gold transition-colors border border-gold/40"
      >
        <span className={`text-lg ${playing ? "" : "opacity-70"}`}>{playing ? "❚❚" : "♪"}</span>
      </button>
    </>
  );
}
