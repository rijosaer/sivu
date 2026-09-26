import Divider from "./Divider";

// "Padres y padrinos": módulo genérico para XV años, bautizos y bodas.
// "grupos" es una lista libre de {etiqueta, personas: [...]} para que cubra
// tanto un bautizo (Padres / Padrinos) como unos XV años, que suelen tener
// varias categorías de padrinos (de honor, de lazo, de cojín...).
export default function PadresPadrinos({ titulo, grupos }) {
  const lista = (grupos || []).filter((g) => g?.personas?.length);
  if (!lista.length) return null;

  return (
    <section className="relative px-6 py-16 max-w-lg mx-auto text-center overflow-hidden">
      <p className="font-mono text-xs tracking-widest2 uppercase text-gold-dark mb-4">
        Con cariño
      </p>
      <h2 className="font-display text-3xl mb-8 text-gold-dark">{titulo || "Padres y padrinos"}</h2>
      <Divider className="mb-10" />

      <div className="space-y-9">
        {lista.map((g, i) => (
          <div key={i}>
            <p className="font-mono text-[10px] tracking-widest2 uppercase text-gold-dark/70 mb-3">
              {g.etiqueta}
            </p>
            <div className="space-y-1.5">
              {g.personas.filter(Boolean).map((p, j) => (
                <p key={j} className="font-body text-ink/80 leading-snug">
                  {p}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
