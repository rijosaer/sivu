import { Suspense, lazy, useEffect, useState } from "react";
import Icono from "./Icono";
import { iniciales, leerRecientes } from "../estado/recientes";
import { fechaBonita } from "../estado/Evento";

const Buscador = lazy(() => import("./Buscador"));

// El marco de todo el panel del dueño: un solo menú que NUNCA cambia, entres
// donde entres (antes, al abrir un evento, el menú se cambiaba por otro y uno
// perdía el camino de vuelta). Se puede encoger a solo íconos y lo recuerda.
// En el celular el menú pasa a una barra abajo con las 4 puertas de siempre.

export function Firma({ claro = true, chica = false }) {
  return (
    <span className="flex flex-col">
      <span className={`marca-firma ${claro ? "" : "!text-marca-dark"} ${chica ? "!text-[1.7rem]" : ""}`}>Sivú</span>
      <span className="marca-de">panel</span>
    </span>
  );
}

export const SECCIONES = [
  { key: "hoy", label: "Hoy", icono: "sol" },
  { key: "clientes", label: "Clientes", icono: "persona" },
  { key: "eventos", label: "Eventos", icono: "calendario" },
  { key: "mensajes", label: "Mensajes", icono: "chat" },
  { key: "disenos", label: "Diseños", icono: "flor" },
];

const CLAVE_COLAPSADO = "sivu-menu-colapsado";

function useRecientes() {
  const [lista, setLista] = useState(leerRecientes);
  useEffect(() => {
    const cambiar = () => setLista(leerRecientes());
    window.addEventListener("sivu-recientes", cambiar);
    window.addEventListener("storage", cambiar);
    return () => {
      window.removeEventListener("sivu-recientes", cambiar);
      window.removeEventListener("storage", cambiar);
    };
  }, []);
  return lista;
}

function useColapsado() {
  const [colapsado, setColapsado] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_COLAPSADO) === "1";
    } catch {
      return false;
    }
  });
  const cambiar = () =>
    setColapsado((v) => {
      try {
        localStorage.setItem(CLAVE_COLAPSADO, v ? "0" : "1");
      } catch {
        /* sin almacenamiento: igual se colapsa mientras dure la página */
      }
      return !v;
    });
  return [colapsado, cambiar];
}

// Ctrl K (o ⌘K) abre el buscador desde cualquier pantalla.
function useAtajoBuscar(abrir) {
  useEffect(() => {
    const tecla = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        abrir();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [abrir]);
}

function CirculoEvento({ evento, activo }) {
  const c = evento.colores || {};
  return (
    <span
      className={`grid place-items-center w-[34px] h-[34px] rounded-full text-[10.5px] font-semibold shrink-0 border ${activo ? "border-oro border-2" : "border-white/30"}`}
      style={{ background: `linear-gradient(160deg, ${c.fondo || "#5C0F27"}, ${c.acento || "#9B1F3E"})`, color: c.texto || "#fff" }}
    >
      {iniciales(evento.nombre)}
    </span>
  );
}

function MenuLateral({ activo, contadores, onIr, onSalir, eventoActual, onAbrirEvento, onBuscar, colapsado, onColapsar, usuario }) {
  const recientes = useRecientes();
  const item = (s) => {
    const n = contadores?.[s.key] || 0;
    const actual = activo === s.key;
    return (
      <button
        key={s.key}
        onClick={() => onIr(s.key)}
        aria-current={actual ? "page" : undefined}
        title={colapsado ? `${s.label}${n ? ` · ${n}` : ""}` : undefined}
        className={`menu-item ${actual ? "menu-item-activo" : ""} ${colapsado ? "justify-center !px-0" : ""}`}
      >
        <Icono nombre={s.icono} className="icono-nav" />
        {!colapsado && <span>{s.label}</span>}
        {n > 0 && (colapsado ? <span className="contador-flotante">{n}</span> : <span className="contador-nav">{n}</span>)}
      </button>
    );
  };
  return (
    <aside className={`menu ${colapsado ? "menu-colapsado" : ""}`} aria-label="Menú del panel">
      <div className={`flex items-start pt-6 pb-4 ${colapsado ? "flex-col items-center gap-3 px-2" : "justify-between px-5"}`}>
        {colapsado ? <span className="font-firma text-[2.2rem] leading-none text-oro">S</span> : <Firma />}
        <button onClick={onColapsar} className="boton-menu" title={colapsado ? "Abrir el menú" : "Encoger el menú"} aria-label={colapsado ? "Abrir el menú" : "Encoger el menú"}>
          <Icono nombre={colapsado ? "expandir" : "colapsar"} className="w-4 h-4" />
        </button>
      </div>

      <div className={colapsado ? "px-3.5" : "px-4"}>
        <button onClick={onBuscar} className={`buscar-menu ${colapsado ? "justify-center !px-0" : ""}`} title="Buscar (Ctrl K)">
          <Icono nombre="buscar" className="w-4 h-4 opacity-80" />
          {!colapsado && (
            <>
              <span className="flex-1 text-left">Buscar…</span>
              <kbd className="text-[10.5px] px-1.5 py-0.5 rounded bg-white/10">Ctrl K</kbd>
            </>
          )}
        </button>
      </div>

      <nav className={`flex flex-col gap-0.5 mt-4 ${colapsado ? "px-3.5" : "px-3"}`}>{SECCIONES.map(item)}</nav>

      {recientes.length > 0 && (
        <div className={`mt-6 ${colapsado ? "px-3.5 flex flex-col items-center gap-2" : "px-3"}`}>
          {colapsado ? (
            <span className="block w-8 h-px bg-white/15 mb-1" />
          ) : (
            <p className="px-3 pb-2 text-[11px] uppercase tracking-[.16em] text-[#C9A9A0]">Eventos recientes</p>
          )}
          {recientes.slice(0, 3).map((e) => {
            const actual = String(eventoActual) === String(e.id);
            return colapsado ? (
              <button key={e.id} onClick={() => onAbrirEvento(e)} title={e.nombre} aria-label={`Abrir ${e.nombre}`}>
                <CirculoEvento evento={e} activo={actual} />
              </button>
            ) : (
              <button
                key={e.id}
                onClick={() => onAbrirEvento(e)}
                className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-white/[.07] ${actual ? "bg-white/[.08]" : ""}`}
              >
                <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: e.colores?.acento || "#E3A63E" }} />
                <span className="min-w-0">
                  <span className="block text-[13.5px] text-white truncate">{e.nombre}</span>
                  {e.fecha && <span className="block text-[12px] text-[#C9A9A0] truncate">{fechaBonita(e.fecha, false)}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className={`mt-auto pb-5 flex flex-col gap-1 ${colapsado ? "px-3.5 items-center" : "px-3"}`}>
        {item({ key: "configuracion", label: "Configuración", icono: "ajustes" })}
        <div className={`flex items-center gap-2.5 mt-2 ${colapsado ? "flex-col" : "px-3"}`}>
          <span className="grid place-items-center w-8 h-8 rounded-full bg-oro text-marca-noche text-xs font-bold shrink-0">
            {(usuario || "S").slice(0, 1).toUpperCase()}
          </span>
          {!colapsado && (
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] text-white truncate">{usuario || "Dueño"}</span>
              <span className="block text-[11.5px] text-[#C9A9A0]">Dueño · Sivú</span>
            </span>
          )}
          {onSalir && (
            <button onClick={onSalir} className="boton-menu" title="Cerrar sesión" aria-label="Cerrar sesión">
              <Icono nombre="salir" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

// Celular: arriba la firma y el buscador; abajo, siempre las mismas 4 puertas.
function BarrasMovil({ activo, contadores, onIr, onSalir, onBuscar }) {
  const [mas, setMas] = useState(false);
  const PUERTAS = [
    { key: "hoy", label: "Hoy", icono: "sol" },
    { key: "eventos", label: "Eventos", icono: "calendario" },
    { key: "mensajes", label: "Mensajes", icono: "chat" },
  ];
  const enMas = ["clientes", "disenos", "configuracion"].includes(activo);
  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-5 py-3 bg-lienzo/95 backdrop-blur border-b border-borde">
        <Firma claro={false} chica />
        <button onClick={onBuscar} className="boton-texto !no-underline p-2" aria-label="Buscar">
          <Icono nombre="buscar" className="w-5 h-5" />
        </button>
      </header>
      <nav className="barra-inferior" aria-label="Secciones">
        {PUERTAS.map((p) => (
          <button key={p.key} onClick={() => onIr(p.key)} className={`puerta ${activo === p.key ? "puerta-activa" : ""}`}>
            <span className="puerta-icono">
              <Icono nombre={p.icono} className="w-[22px] h-[22px]" />
              {contadores?.[p.key] > 0 && <span className="contador-flotante !-top-1 !-right-2">{contadores[p.key]}</span>}
            </span>
            {p.label}
          </button>
        ))}
        <button onClick={() => setMas(true)} className={`puerta ${enMas ? "puerta-activa" : ""}`}>
          <span className="puerta-icono">
            <Icono nombre="menu" className="w-[22px] h-[22px]" />
          </span>
          Más
        </button>
      </nav>
      {mas && (
        <div className="lg:hidden fixed inset-0 z-50 bg-ink/40 flex items-end" onClick={() => setMas(false)}>
          <div className="hoja-inferior" onClick={(e) => e.stopPropagation()}>
            <span className="block mx-auto w-10 h-1 rounded-full bg-borde-fuerte mb-4" />
            {[...SECCIONES.filter((s) => !PUERTAS.some((p) => p.key === s.key)), { key: "configuracion", label: "Configuración", icono: "ajustes" }].map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setMas(false);
                  onIr(s.key);
                }}
                className="w-full flex items-center gap-3 px-3 py-3.5 text-[16px] text-ink border-b border-borde"
              >
                <Icono nombre={s.icono} className="w-5 h-5 text-ink-suave" />
                {s.label}
                {contadores?.[s.key] > 0 && <span className="ml-auto insignia insignia-oro">{contadores[s.key]}</span>}
              </button>
            ))}
            {onSalir && (
              <button onClick={onSalir} className="w-full flex items-center gap-3 px-3 py-3.5 text-[16px] text-ink-suave">
                <Icono nombre="salir" className="w-5 h-5" />
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// `completo`: el contenido ocupa todo el ancho (el evento trae su propia
// cabecera); si no, va centrado con márgenes, como las pantallas del negocio.
export default function Marco({ activo, contadores, onIr, onSalir, eventoActual, onAbrirEvento, usuario, completo = false, children }) {
  const [colapsado, onColapsar] = useColapsado();
  const [buscando, setBuscando] = useState(false);
  useAtajoBuscar(() => setBuscando(true));
  return (
    <div className="min-h-screen panel-lienzo lg:flex">
      <MenuLateral
        activo={activo}
        contadores={contadores}
        onIr={onIr}
        onSalir={onSalir}
        eventoActual={eventoActual}
        onAbrirEvento={onAbrirEvento}
        onBuscar={() => setBuscando(true)}
        colapsado={colapsado}
        onColapsar={onColapsar}
        usuario={usuario}
      />
      <BarrasMovil activo={activo} contadores={contadores} onIr={onIr} onSalir={onSalir} onBuscar={() => setBuscando(true)} />
      <div className="flex-1 min-w-0 pb-24 lg:pb-0">
        {completo ? children : <main className="contenido-pagina">{children}</main>}
      </div>
      {buscando && (
        <Suspense fallback={null}>
          <Buscador onCerrar={() => setBuscando(false)} onIr={onIr} onAbrirEvento={onAbrirEvento} />
        </Suspense>
      )}
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
