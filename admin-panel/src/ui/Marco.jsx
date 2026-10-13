import Icono from "./Icono";

// El marco de todas las pantallas: barra lateral en vino con la firma de Sivú
// y el contenido sobre crema. Lo usan tanto el panel del negocio (Hoy,
// Clientes, Eventos, Configuración) como cada evento (Resumen, Invitados,
// Invitación, Ajustes), para que pasar de uno a otro no se sienta como
// cambiar de aplicación.

export function Firma({ claro = true }) {
  return (
    <span className="flex flex-col">
      <span className={`marca-firma ${claro ? "" : "!text-marca-dark"}`}>Sivú</span>
      <span className="marca-de">invitaciones</span>
    </span>
  );
}

export default function Marco({ items, activo, onIr, arriba, titulo, descripcion, acciones, onSalir, children }) {
  return (
    <div className="min-h-screen panel-lienzo lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="barra-lateral">
        <div className="px-6 pt-7 pb-5 hidden lg:block">
          <Firma />
        </div>
        {arriba}
        <nav aria-label="Navegación principal" className="navegacion-panel">
          {items.map((t) => (
            <button
              key={t.key}
              onClick={() => onIr(t.key)}
              aria-current={activo === t.key ? "page" : undefined}
              className={`enlace-nav ${activo === t.key ? "enlace-nav-activo" : ""}`}
            >
              <Icono nombre={t.icono} className="icono-nav" />
              <span>{t.label}</span>
              {t.contador > 0 && <span className="contador-nav">{t.contador}</span>}
              {t.punto && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-oro" title={t.punto} />}
            </button>
          ))}
        </nav>
        {onSalir && (
          <button
            onClick={onSalir}
            className="hidden lg:flex items-center gap-2 mt-auto mx-3 mb-5 px-3 py-2 text-left text-xs text-[#C9A9A0] hover:text-white transition-colors"
          >
            <Icono nombre="salir" className="w-4 h-4" />
            Cerrar sesión
          </button>
        )}
      </aside>

      <div className="min-w-0 flex flex-col">
        <header className="cabecera-panel">
          <div className="flex items-center gap-4 min-w-0">
            <div className="lg:hidden">
              <Firma claro={false} />
            </div>
            <div className="hidden lg:block min-w-0">
              <h1 className="text-sm font-semibold text-ink truncate">{titulo}</h1>
              {descripcion && <p className="text-[11px] text-ink-tenue truncate">{descripcion}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {acciones}
            {onSalir && (
              <button onClick={onSalir} className="lg:hidden boton-texto !no-underline" title="Cerrar sesión">
                <Icono nombre="salir" className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 w-full max-w-[76rem] mx-auto px-5 py-8 sm:px-10 sm:py-10">{children}</main>
      </div>
    </div>
  );
}

// Pestañas internas de una pantalla. `opciones` es [[clave, nombre], ...].
export function SubNav({ opciones, activo, onIr }) {
  if (opciones.length < 2) return null;
  return (
    <div className="subnav" role="tablist">
      {opciones.map(([k, t]) => (
        <button
          key={k}
          role="tab"
          aria-selected={activo === k}
          onClick={() => onIr(k)}
          className={`subnav-item ${activo === k ? "subnav-activo" : ""}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
