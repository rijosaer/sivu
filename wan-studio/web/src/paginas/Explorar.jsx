import Escena from "../componentes/Escena.jsx";

const CATEGORIAS = [
  ["camara", "Movimientos de cámara"],
  ["efecto", "Efectos"],
  ["libre", "Libre"],
];

export default function Explorar({ catalogo }) {
  return (
    <>
      <section className="py-12 sm:py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-acento">Wan 2.2 · código abierto</p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Convierte una foto en una toma de cine.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-tenue">
          Elige un movimiento de cámara o un efecto, sube tu imagen y listo. Todo lo que ves aquí también está
          disponible por API.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#/crear" className="boton-acento px-6 py-3 text-base">
            Empezar a crear
          </a>
          <a href="#/api" className="boton-suave px-6 py-3 text-base">
            Ver la API
          </a>
        </div>
      </section>

      {CATEGORIAS.map(([cat, titulo]) => {
        const presets = catalogo.presets.filter((p) => p.categoria === cat);
        if (!presets.length) return null;
        return (
          <section key={cat} className="mb-12">
            <h2 className="mb-4 text-xl font-semibold">{titulo}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {presets.map((p) => (
                <a
                  key={p.id}
                  href={`#/crear?preset=${p.id}`}
                  className="group overflow-hidden rounded-2xl border border-borde bg-panel transition hover:-translate-y-0.5 hover:border-acento/60"
                >
                  <Escena animacion={p.animacion} />
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">{p.nombre}</h3>
                      {!p.modos.includes("i2v") && (
                        <span className="rounded-md bg-borde px-2 py-0.5 text-xs text-tenue">Solo texto</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-tenue">{p.descripcion}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
