import { useState } from "react";

export default function Gallery({ fotos, titulo = "Nuestras fotos", subtitulo = "Los novios" }) {
  const [activa, setActiva] = useState(null);

  return (
    <section className="relative py-16 overflow-hidden">
      <p className="font-mono text-xs tracking-widest2 uppercase mb-4 text-center text-gold-dark">
        {titulo}
      </p>
      <h2 className="font-display text-3xl text-center mb-8 text-gold-dark">{subtitulo}</h2>
      <div className="flex gap-4 overflow-x-auto px-6 snap-x snap-mandatory pb-4">
        {fotos.map((src, i) => (
          <button
            key={i}
            onClick={() => setActiva(src)}
            className="shrink-0 snap-center"
            aria-label={`Ver fotografía ${i + 1} en grande`}
          >
            <img
              src={src}
              alt={`Fotografía ${i + 1} de la pareja`}
              loading="lazy"
              className="h-64 sm:h-80 w-52 sm:w-64 object-cover border-2 border-gold/40 shadow-[4px_4px_0_0_rgba(184,146,74,0.15)]"
            />
          </button>
        ))}
      </div>

      {activa && (
        <div
          className="fixed inset-0 z-[70] bg-ink/90 flex items-center justify-center px-6"
          onClick={() => setActiva(null)}
        >
          <img src={activa} alt="Fotografía ampliada" className="max-h-[85vh] max-w-full object-contain shadow-2xl" />
          <button
            onClick={() => setActiva(null)}
            className="absolute top-5 right-5 text-paper font-mono text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}
    </section>
  );
}
