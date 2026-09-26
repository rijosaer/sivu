import { useState } from "react";
import Login from "./pages/Login";
import Resumen from "./pages/Resumen";
import Invitados from "./pages/Invitados";
import Lista from "./pages/Lista";
import Mensajes from "./pages/Mensajes";
import Contenido from "./pages/Contenido";
import Tema from "./pages/Tema";
import Decoraciones from "./pages/Decoraciones";
import {
  hasToken,
  clearToken,
  SITIO_BASE,
  getInvitacionActual,
  clearInvitacionActual,
  actualizarSitioBase,
} from "./api";
import SelectorEventos from "./pages/SelectorEventos";
import { NOMBRE_TIPO_EVENTO } from "./tiposEvento";
import { PendientesProvider, usePendientes } from "./estado/Pendientes";
import { ToastProvider } from "./ui/Toast";
import { useAvisos } from "./notificaciones/useAvisos";
import Icono from "./ui/Icono";

// Las pantallas van agrupadas por la pregunta que responde cada una: "¿a quién
// invito y cómo va?" contra "¿cómo se ve la invitación?". Antes eran cinco
// entradas sueltas y dos de ellas (la lista de personas y los mensajes de
// WhatsApp) vivían escondidas dentro de otra pantalla, así que no había manera
// de saber que existían.
const TABS = [
  {
    key: "resumen",
    label: "Resumen",
    icono: "resumen",
    titulo: "Resumen",
    descripcion: "Cómo va la boda de un vistazo.",
    Componente: Resumen,
  },
  {
    grupo: "Invitados",
    key: "invitados",
    label: "Invitaciones",
    icono: "sobre",
    titulo: "Invitaciones",
    descripcion: "Crea los enlaces, envíalos por WhatsApp y sigue quién responde.",
    Componente: Invitados,
  },
  {
    grupo: "Invitados",
    key: "lista",
    label: "Lista de personas",
    icono: "lista",
    titulo: "Lista de personas",
    descripcion: "Quién asiste, con qué restricción. Para exportar o imprimir.",
    Componente: Lista,
  },
  {
    grupo: "Invitados",
    key: "mensajes",
    label: "Mensajes",
    icono: "chat",
    titulo: "Mensajes de WhatsApp",
    descripcion: "Los textos con los que invitas, recuerdas y das la noticia.",
    Componente: Mensajes,
  },
  {
    grupo: "La invitación",
    key: "contenido",
    label: "Contenido",
    icono: "texto",
    titulo: "Contenido",
    descripcion: "Los textos y secciones que ven tus invitados.",
    Componente: Contenido,
  },
  {
    grupo: "La invitación",
    key: "decoracion",
    label: "Diseño",
    icono: "flor",
    titulo: "Diseño",
    descripcion: "Coloca las decoraciones sobre la invitación.",
    Componente: Decoraciones,
  },
  {
    grupo: "La invitación",
    key: "tema",
    label: "Colores",
    icono: "paleta",
    titulo: "Colores",
    descripcion: "La paleta de la invitación.",
    Componente: Tema,
  },
];

function Marca() {
  return (
    <div className="flex items-center gap-3">
      <span className="marca-sello">e.</span>
      <span>
        <span className="block text-[15px] font-semibold tracking-[-.03em] text-ink">eventa</span>
        <span className="block text-[10px] uppercase tracking-[.16em] text-ink-tenue mt-0.5">
          event management
        </span>
      </span>
    </div>
  );
}

function Navegacion({ tab, onCambiar, hayPendientes }) {
  return (
    <nav aria-label="Navegación principal" className="navegacion-panel">
      {TABS.map((t, i) => {
        // El encabezado del grupo se escribe una sola vez, al empezar cada uno.
        const abreGrupo = t.grupo && t.grupo !== TABS[i - 1]?.grupo;
        const pendiente = t.key === "contenido" && hayPendientes;
        return (
          <div key={t.key} className="contents">
            {abreGrupo && <p className="grupo-nav">{t.grupo}</p>}
            <button
              onClick={() => onCambiar(t.key)}
              aria-current={tab === t.key ? "page" : undefined}
              className={`enlace-nav ${tab === t.key ? "enlace-nav-activo" : ""}`}
            >
              <Icono nombre={t.icono} className="icono-nav" />
              <span>{t.label}</span>
              {pendiente && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500"
                  title="Cambios sin publicar"
                />
              )}
            </button>
          </div>
        );
      })}
    </nav>
  );
}

function Cascara({ onSalir, evento, onCambiarEvento }) {
  const [tab, setTab] = useState("resumen");
  const { hayPendientes, seccionesPendientes } = usePendientes();
  const avisos = useAvisos();
  const actual = TABS.find((t) => t.key === tab);
  const { Componente } = actual;

  return (
    <div className="min-h-screen panel-lienzo lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="barra-lateral">
        <div className="px-6 pt-7 pb-6 hidden lg:block">
          <Marca />
        </div>
        <div className="mx-4 mb-4 px-3 py-3 rounded-xl bg-[#f8f8f6] border border-borde hidden lg:block">
          <p className="text-[10px] uppercase tracking-[.12em] text-ink-tenue mb-1.5">
            Evento actual
          </p>
          <p className="text-xs font-semibold text-ink truncate">{evento.nombre}</p>
          <p className="text-[11px] text-ink-suave mt-0.5">
            {NOMBRE_TIPO_EVENTO[evento.tipo_evento] || "Evento"}
          </p>
          <button onClick={onCambiarEvento} className="mt-2 text-[11px] boton-texto">
            Cambiar evento
          </button>
        </div>

        <Navegacion tab={tab} onCambiar={setTab} hayPendientes={hayPendientes} />

        <button
          onClick={onSalir}
          className="hidden lg:block mt-auto mx-4 mb-5 px-3 py-2 text-left text-xs text-ink-tenue hover:text-red-600 transition-colors"
        >
          Cerrar sesión
        </button>
      </aside>

      <div className="min-w-0 flex flex-col">
        <header className="cabecera-panel">
          <div className="flex items-center gap-4 min-w-0">
            <div className="lg:hidden">
              <Marca />
            </div>
            {/* En escritorio la cabecera dice en qué pantalla estás y para qué
                sirve: el título grande de cada pantalla se apoya en esto. */}
            <div className="hidden lg:block min-w-0">
              <h1 className="text-sm font-semibold text-ink truncate">{actual.titulo}</h1>
              <p className="text-[11px] text-ink-tenue truncate">{actual.descripcion}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hayPendientes && (
              <button
                onClick={() => setTab("contenido")}
                className="hidden md:inline-flex insignia insignia-aviso hover:bg-amber-100 transition-colors"
                title={`Sin publicar: ${seccionesPendientes.join(", ")}`}
              >
                {seccionesPendientes.length} sin publicar
              </button>
            )}
            <button
              onClick={avisos.activo ? avisos.desactivar : avisos.activar}
              title={
                avisos.activo
                  ? "Avisos activados: suena cuando alguien responde o abre su invitación"
                  : "Activar avisos con sonido al recibir respuestas"
              }
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md border transition-colors ${
                avisos.activo
                  ? "border-ink bg-ink text-white"
                  : "border-borde-fuerte text-ink-suave hover:text-ink"
              }`}
            >
              <Icono nombre={avisos.activo ? "campana" : "campana-off"} className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Avisos</span>
            </button>
            <a href={SITIO_BASE} target="_blank" rel="noreferrer" className="enlace-vista">
              Ver invitación ↗
            </a>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[76rem] mx-auto px-5 py-8 sm:px-10 sm:py-10">
          <Componente irA={setTab} />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [logueado, setLogueado] = useState(hasToken());
  // El panel administra muchos eventos (multi-invitación): antes de entrar a
  // "editar" hay que elegir cuál. Se recuerda entre sesiones (localStorage),
  // así que quien entra todos los días a la misma boda no tiene que elegirla
  // cada vez.
  const [evento, setEvento] = useState(() => {
    const actual = getInvitacionActual();
    if (actual) actualizarSitioBase(actual.slug);
    return actual;
  });

  function elegirEvento(inv) {
    actualizarSitioBase(inv.slug);
    setEvento(inv);
  }

  function cambiarEvento() {
    clearInvitacionActual();
    actualizarSitioBase(null);
    setEvento(null);
  }

  return (
    <ToastProvider>
      {!logueado ? (
        <Login onLogin={() => setLogueado(true)} />
      ) : !evento ? (
        <SelectorEventos onElegir={elegirEvento} onSalir={() => { clearToken(); setLogueado(false); }} />
      ) : (
        <PendientesProvider>
          <Cascara
            evento={evento}
            onCambiarEvento={cambiarEvento}
            onSalir={() => {
              clearToken();
              setLogueado(false);
            }}
          />
        </PendientesProvider>
      )}
    </ToastProvider>
  );
}
