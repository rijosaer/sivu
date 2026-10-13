import { useEffect, useState } from "react";
import { api } from "../api";
import { ir } from "../ruta";
import SelectorEventos from "../pages/SelectorEventos";
import Hoy from "./Hoy";
import Clientes from "./Clientes";
import Produccion from "./Produccion";
import MensajesInvitados from "./MensajesInvitados";
import Configuracion from "./Configuracion";

// Lo que ve el dueño de Sivú al entrar: el negocio completo. «Eventos» es la
// lista de siempre; lo demás (clientes potenciales, producción, mensajes y
// configuración) es lo que se atiende antes y después de cada contrato.

const TABS = [
  ["hoy", "Hoy"],
  ["clientes", "Clientes"],
  ["eventos", "Eventos"],
  ["produccion", "Producción"],
  ["mensajes", "Mensajes de invitados"],
  ["configuracion", "Configuración"],
];

export default function PanelDueno({ tramos = [], onElegir, onSalir }) {
  // La pestaña y el cliente abierto salen de la dirección: /clientes/25.
  const tab = TABS.some(([k]) => k === tramos[0]) ? tramos[0] : "hoy";
  const sub = tramos[1] || null;
  const [tablero, setTablero] = useState(null);

  const irA = (t) => ir(`/${t}`);

  const cargarTablero = () => api.crm.tablero().then(setTablero).catch(() => {});
  useEffect(() => {
    cargarTablero();
    const t = setInterval(cargarTablero, 30000);
    return () => clearInterval(t);
  }, []);

  const badge = {
    hoy: tablero?.pagosPorConfirmar || 0,
    clientes: tablero ? tablero.hoy.sinContactar + tablero.hoy.sinLeer + tablero.hoy.seguimientos : 0,
    produccion: tablero ? tablero.hoy.atrasados.length + tablero.hoy.saldos.length : 0,
  };

  return (
    <div className="min-h-screen panel-lienzo">
      <header className="bg-white border-b border-borde sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="marca-sello">c.</span>
            <span>
              <span className="block text-[15px] font-semibold tracking-[-.03em] text-ink">Sivú</span>
              <span className="block text-[10px] uppercase tracking-[.16em] text-ink-tenue mt-0.5">tu negocio</span>
            </span>
          </div>
          <button onClick={onSalir} className="boton-texto">
            Cerrar sesión
          </button>
        </div>
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 mt-3 flex gap-5 overflow-x-auto" aria-label="Secciones">
          {TABS.map(([k, t]) => (
            <button key={k} onClick={() => irA(k)} className={`pestana shrink-0 ${tab === k ? "pestana-activa" : ""}`}>
              {t}
              {badge[k] > 0 && (
                <span className="ml-1.5 text-[10px] font-semibold bg-amber-500 text-white rounded-full px-1.5 py-0.5 align-middle">
                  {badge[k]}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {tab === "hoy" && <Hoy tablero={tablero} irA={irA} onCambio={cargarTablero} />}
        {tab === "clientes" && (
          <Clientes
            conteos={tablero?.conteos}
            onCambio={cargarTablero}
            onIrAProduccion={() => irA("produccion")}
            abierto={sub ? Number(sub) : null}
            onAbrir={(id) => ir(id ? `/clientes/${id}` : "/clientes")}
          />
        )}
        {tab === "eventos" && <SelectorEventos onElegir={onElegir} onSalir={onSalir} incrustado />}
        {tab === "produccion" && <Produccion onElegirEvento={onElegir} />}
        {tab === "mensajes" && <MensajesInvitados />}
        {tab === "configuracion" && <Configuracion seccion={sub} />}
      </main>
    </div>
  );
}
