import Divider from "./Divider";

export default function Menu({ menu }) {
  return (
    <section className="px-6 py-16 max-w-lg mx-auto text-center">
      <p className="font-mono text-xs tracking-widest2 uppercase mb-4 text-gold-dark">Menú</p>
      <h2 className="font-display text-3xl mb-4 text-gold-dark">Qué vamos a compartir</h2>
      <Divider className="mb-6" />
      <p className="text-sm text-ink/60 mb-10">{menu.nota}</p>

      <div className="grid sm:grid-cols-3 gap-8 text-left">
        {menu.opciones.map((grupo) => (
          <div key={grupo.tipo}>
            <p className="font-mono text-[10px] tracking-widest2 uppercase mb-3 text-center text-gold-dark">
              {grupo.tipo}
            </p>
            <ul className="space-y-1.5 text-center">
              {grupo.items.map((item) => (
                <li key={item} className="text-sm text-ink-light">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
