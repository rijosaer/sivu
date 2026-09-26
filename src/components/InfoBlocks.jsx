import Divider from "./Divider";

export function GiftEnvelope({ texto }) {
  return (
    <section className="px-6 py-16 max-w-lg mx-auto text-center border-t border-gold/25">
      <p className="font-mono text-xs tracking-widest2 uppercase text-gold-dark mb-4">
        Lluvia de sobres
      </p>
      <Divider className="mb-6" />
      <div className="border border-gold/40 bg-gold/5 px-6 py-8 relative">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-paper px-3 font-mono text-[10px] tracking-widest2 uppercase text-gold-dark">
          Con cariño
        </span>
        <p className="font-body italic text-ink-light leading-relaxed">{texto}</p>
      </div>
    </section>
  );
}

// Se muestra como una nota, no como una lista numerada: el "01, 02, 03"
// hacía parecer que había un orden o una prioridad que no existe.
// La nota va primero como párrafo y debajo los elementos como viñetas: los dos
// se ven, cada uno existe si tiene contenido.
export function ImportantInfo({ items, nota }) {
  const puntos = (items || []).filter(Boolean);
  const textoNota = typeof nota === "string" ? nota.trim() : "";
  if (!textoNota && !puntos.length) return null;

  return (
    <section className="px-6 py-16 max-w-lg mx-auto">
      <p className="font-mono text-xs tracking-widest2 uppercase text-gold-dark mb-4 text-center">
        Información importante
      </p>
      <Divider className="mb-6" />

      <div className="border border-gold/40 bg-gold/5 px-6 py-7">
        {textoNota && (
          <p className="font-body text-ink-light text-sm leading-relaxed whitespace-pre-line">
            {textoNota}
          </p>
        )}
        {puntos.length > 0 && (
          <ul className={`space-y-3 ${textoNota ? "mt-5 pt-5 border-t border-gold/25" : ""}`}>
            {puntos.map((item, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="mt-[0.45rem] w-1.5 h-1.5 rounded-full bg-gold-dark/50 shrink-0" />
                <span className="text-ink-light text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function Faq({ items }) {
  return (
    <section className="px-6 py-16 max-w-lg mx-auto">
      <p className="font-mono text-xs tracking-widest2 uppercase text-gold-dark mb-4 text-center">
        Preguntas frecuentes
      </p>
      <div className="divide-y divide-gold/20">
        {items.map((f, i) => (
          <details key={i} className="py-4 group">
            <summary className="cursor-pointer font-body font-medium list-none flex justify-between items-center">
              {f.p}
              <span className="text-gold-dark group-open:rotate-45 transition-transform font-mono">+</span>
            </summary>
            <p className="mt-2 text-sm text-ink-light leading-relaxed">{f.r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
