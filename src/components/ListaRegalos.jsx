import Divider from "./Divider";

// Mesa de regalos / lista de regalos: complementa a "sobres" (lluvia de
// sobres, ya existente) para los eventos donde además —o en cambio— tiene
// sentido dar el enlace de una tienda (baby shower, XV, cumpleaños). Cada
// enlace es {tienda, url}; "datosTransferencia" es un texto libre opcional
// para quien prefiera dar una transferencia o un regalo en efectivo.
export default function ListaRegalos({ titulo, texto, enlaces, datosTransferencia }) {
  const lista = (enlaces || []).filter((e) => e?.url);
  const transferencia = (datosTransferencia || "").trim();

  return (
    <section className="relative px-6 py-16 max-w-lg mx-auto text-center overflow-hidden">
      <p className="font-mono text-xs tracking-widest2 uppercase text-gold-dark mb-4">
        Con cariño
      </p>
      <h2 className="font-display text-3xl mb-4 text-gold-dark">{titulo || "Mesa de regalos"}</h2>
      <Divider className="mb-8" />

      {texto && (
        <p className="font-body text-ink/70 text-sm leading-relaxed max-w-sm mx-auto mb-8">{texto}</p>
      )}

      {lista.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {lista.map((e, i) => (
            <a
              key={i}
              href={e.url}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 font-mono text-xs tracking-widest2 uppercase border border-gold/50 text-gold-dark hover:bg-gold hover:text-paper transition-colors"
            >
              {e.tienda || "Ver lista"}
            </a>
          ))}
        </div>
      )}

      {transferencia && (
        <div className="border border-gold/40 bg-gold/5 px-6 py-6 text-left max-w-sm mx-auto">
          <p className="font-mono text-[10px] tracking-widest2 uppercase text-gold-dark mb-2 text-center">
            Datos para transferencia
          </p>
          <p className="font-body text-ink-light text-sm leading-relaxed whitespace-pre-line text-center">
            {transferencia}
          </p>
        </div>
      )}
    </section>
  );
}
