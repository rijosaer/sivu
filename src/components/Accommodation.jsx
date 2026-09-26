export default function Accommodation({ hoteles }) {
  return (
    <section className="px-6 py-16 max-w-lg mx-auto">
      <p className="font-mono text-xs tracking-widest2 uppercase mb-4 text-center text-gold-dark">
        Alojamiento
      </p>
      <h2 className="font-display text-3xl text-center mb-10 text-gold-dark">
        Para nuestros invitados de fuera
      </h2>

      <div className="space-y-4">
        {hoteles.map((h) => (
          <a
            key={h.nombre}
            href={h.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="block border border-gold/30 px-5 py-4 transition-colors hover:bg-gold/5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-lg">{h.nombre}</span>
              <span className="font-mono text-[10px] tracking-widest2 uppercase text-gold-dark">
                {h.distancia}
              </span>
            </div>
            <p className="text-sm text-ink-light mt-1">{h.nota}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
