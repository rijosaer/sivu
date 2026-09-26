import Divider from "./Divider";

// Cada entrada viene del panel como { nombre, color } o, cuando es una gama
// entera, como { nombre, colores: [...] }. Lo segundo existe porque hay
// códigos de vestimenta que no son "estos cuatro colores" sino "toda la
// gama pastel", y pintar veinte círculos sueltos para decir eso es peor.
export default function DressCode({ dressCode }) {
  const permitidos = dressCode.permitidos || [];
  const evitar = dressCode.evitar || [];

  return (
    <section className="relative px-6 py-20 max-w-xl mx-auto text-center overflow-hidden">
      <p className="font-mono text-xs tracking-widest2 uppercase text-gold-dark mb-4">
        Código de vestimenta
      </p>
      <h2 className="font-display text-3xl mb-4 text-gold-dark">{dressCode.titulo}</h2>
      <Divider className="mb-12" />

      <div className="grid grid-cols-2">
        <div className="pr-6 sm:pr-10 border-r border-gold/20">
          <p className="font-mono text-[10px] tracking-widest2 uppercase text-gold-dark mb-4">
            Permitidos
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {permitidos.map((c, i) => (
              <Swatch key={`${c.nombre}-${i}`} {...c} ok />
            ))}
          </div>
        </div>
        <div className="pl-6 sm:pl-10">
          <p className="font-mono text-[10px] tracking-widest2 uppercase text-seal mb-4">Evitar</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {evitar.map((c, i) => (
              <Swatch key={`${c.nombre}-${i}`} {...c} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Swatch({ nombre, color, colores, ok }) {
  const lista = (Array.isArray(colores) ? colores : []).filter(Boolean);
  const esGama = lista.length > 1;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        // La gama se dibuja alargada a propósito: un círculo con degradado se
        // lee como "un color raro", y una franja se lee como "un rango".
        className={`h-9 rounded-full border border-gold/30 relative ${esGama ? "w-24" : "w-9"}`}
        style={
          esGama
            ? { backgroundImage: `linear-gradient(90deg, ${lista.join(", ")})` }
            : { backgroundColor: lista[0] || color || "#ccc" }
        }
      >
        {!ok && (
          <span className="absolute inset-0 flex items-center justify-center text-seal text-lg leading-none">
            ×
          </span>
        )}
      </div>
      <span className="text-[11px] text-ink/70">{nombre}</span>
    </div>
  );
}
