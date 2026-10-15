const ENLACES = [
  ["explorar", "Explorar"],
  ["crear", "Crear"],
  ["biblioteca", "Biblioteca"],
  ["api", "API"],
];

export default function Nav({ pagina, usuario, alSalir }) {
  return (
    <header className="sticky top-0 z-20 border-b border-borde bg-fondo/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <a href="#/explorar" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-acento text-sm text-black">W</span>
          <span className="hidden sm:inline">Wan Studio</span>
        </a>
        <nav className="flex flex-1 gap-1 overflow-x-auto text-sm">
          {ENLACES.map(([id, texto]) => (
            <a
              key={id}
              href={`#/${id}`}
              className={`rounded-lg px-3 py-1.5 whitespace-nowrap ${
                pagina === id ? "bg-panel text-white" : "text-tenue hover:text-white"
              }`}
            >
              {texto}
            </a>
          ))}
        </nav>
        {usuario ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-lg border border-acento/40 bg-acento/10 px-2.5 py-1 font-semibold text-acento" title="Créditos disponibles">
              {usuario.creditos} cr
            </span>
            <button onClick={alSalir} className="text-tenue hover:text-white">
              Salir
            </button>
          </div>
        ) : (
          <a href="#/entrar" className="boton-acento py-1.5">
            Entrar
          </a>
        )}
      </div>
    </header>
  );
}
