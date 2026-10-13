import { Suspense, lazy, useEffect, useState } from "react";
import { api } from "../api";
import { ir } from "../ruta";
import Marco from "../ui/Marco";
const Hoy = lazy(() => import("./Hoy"));
const Clientes = lazy(() => import("./Clientes"));
const Eventos = lazy(() => import("./Produccion"));
const Configuracion = lazy(() => import("./Configuracion"));

// Lo que ve el dueño de Sivú al entrar: el negocio completo en cuatro
// pantallas. «Eventos» junta lo que antes eran «Eventos» y «Producción» (la
// misma lista vista dos veces); los mensajes de los invitados ahora viven
// dentro de cada evento (Invitados → WhatsApp).

const TABS = [
  { key: "hoy", label: "Hoy", icono: "sol", descripcion: "Lo que hay que hacer hoy y cómo va el negocio." },
  { key: "clientes", label: "Clientes", icono: "persona", descripcion: "Quién escribió, a quién cotizaste y quién firmó." },
  { key: "eventos", label: "Eventos", icono: "calendario", descripcion: "Cada evento contratado: etapa, datos y pagos." },
  { key: "configuracion", label: "Configuración", icono: "ajustes", descripcion: "Textos, horario, avisos, precios y pagos." },
];

// Direcciones de antes: siguen funcionando.
const ANTES = { produccion: "eventos", mensajes: "eventos" };

export default function PanelDueno({ tramos = [], onElegir, onSalir }) {
  const pedida = ANTES[tramos[0]] || tramos[0];
  const tab = TABS.some((t) => t.key === pedida) ? pedida : "hoy";
  const sub = tramos[1] || null;
  const [tablero, setTablero] = useState(null);

  useEffect(() => {
    if (ANTES[tramos[0]]) ir(`/${ANTES[tramos[0]]}`, { reemplazar: true });
  }, [tramos[0]]);

  const irA = (t) => ir(`/${ANTES[t] || t}`);

  const cargarTablero = () => api.crm.tablero().then(setTablero).catch(() => {});
  useEffect(() => {
    cargarTablero();
    const t = setInterval(cargarTablero, 30000);
    return () => clearInterval(t);
  }, []);

  const contador = {
    hoy: tablero?.pagosPorConfirmar || 0,
    clientes: tablero ? tablero.hoy.sinContactar + tablero.hoy.sinLeer + tablero.hoy.seguimientos : 0,
    eventos: tablero ? tablero.hoy.atrasados.length + tablero.hoy.saldos.length : 0,
  };
  const actual = TABS.find((t) => t.key === tab);

  return (
    <Marco
      items={TABS.map((t) => ({ ...t, contador: contador[t.key] }))}
      activo={tab}
      onIr={irA}
      onSalir={onSalir}
      titulo={actual.label}
      descripcion={actual.descripcion}
    >
      <Suspense fallback={<p className="text-sm text-ink-tenue">Cargando...</p>}>
        {tab === "hoy" && <Hoy tablero={tablero} irA={irA} onCambio={cargarTablero} />}
        {tab === "clientes" && (
          <Clientes
            conteos={tablero?.conteos}
            onCambio={cargarTablero}
            onIrAProduccion={() => irA("eventos")}
            abierto={sub ? Number(sub) : null}
            onAbrir={(id) => ir(id ? `/clientes/${id}` : "/clientes")}
          />
        )}
        {tab === "eventos" && <Eventos onElegirEvento={onElegir} />}
        {tab === "configuracion" && <Configuracion seccion={sub} />}
      </Suspense>
    </Marco>
  );
}
