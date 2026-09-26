export default function Transport({ opciones }) {
  return (
    <section className="px-6 py-16 max-w-lg mx-auto">
      <p className="font-mono text-xs tracking-widest2 uppercase mb-4 text-center text-gold-dark">
        Transporte
      </p>
      <h2 className="font-display text-3xl text-center mb-10 text-gold-dark">Cómo llegar</h2>

      <ul className="space-y-5">
        {opciones.map((op, i) => (
          <li key={i} className="flex gap-4 items-start">
            <span className="font-mono text-xs mt-0.5 shrink-0 text-gold-dark">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="font-body font-medium">{op.titulo}</p>
              <p className="text-sm text-ink-light leading-relaxed">{op.detalle}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
