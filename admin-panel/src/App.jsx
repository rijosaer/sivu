import { useEffect, useState } from "react";
import { ir, useRuta } from "./ruta";
import Login from "./pages/Login";
import Resumen from "./pages/Resumen";
import Invitados from "./pages/Invitados";
import Lista from "./pages/Lista";
import Mensajes from "./pages/Mensajes";
import Contenido from "./pages/Contenido";
import Tema from "./pages/Tema";
import Decoraciones from "./pages/Decoraciones";
import {
  api,
  hasToken,
  clearToken,
  SITIO_BASE,
  getInvitacionActual,
  setInvitacionActual,
  clearInvitacionActual,
  actualizarSitioBase,
  esEventoFijo,
} from "./api";
import PanelDueno from "./dueno/PanelDueno";
import RespuestasInvitados from "./pages/RespuestasInvitados";
import { NOMBRE_TIPO_EVENTO } from "./tiposEvento";
import { vocabulario } from "./vocabulario";
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
    key: "respuestas",
    label: "Respuestas WhatsApp",
    icono: "chat",
    titulo: "Respuestas por WhatsApp",
    descripcion: "Lo que los invitados le escribieron al WhatsApp de Sivú.",
    Componente: RespuestasInvitados,
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
      <span className="marca-sello">c.</span>
      <span>
        <span className="block text-[15px] font-semibold tracking-[-.03em] text-ink">Sivú</span>
        <span className="block text-[10px] uppercase tracking-[.1em] whitespace-nowrap text-ink-tenue mt-0.5">
          invitaciones digitales
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

function Cascara({ onSalir, evento, onCambiarEvento, tab: tabRuta }) {
  const tab = TABS.some((t) => t.key === tabRuta) ? tabRuta : "resumen";
  const setTab = (t) => ir(`/evento/${evento.id}/${t}`);
  const { hayPendientes, seccionesPendientes } = usePendientes();
  const avisos = useAvisos();
  const actual = TABS.find((t) => t.key === tab);
  const { Componente } = actual;
  const descripcion = tab === "resumen" ? vocabulario(evento.tipo_evento).resumen : actual.descripcion;

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
          {!esEventoFijo() && (
            <button onClick={onCambiarEvento} className="mt-2 text-[11px] boton-texto">
              Cambiar evento
            </button>
          )}
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
              <p className="text-[11px] text-ink-tenue truncate">{descripcion}</p>
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
  const tramos = useRuta();
  // El evento que se está editando: lo dice la dirección (/evento/12/...).
  // Si es el mismo que quedó guardado, se usa sin pedirlo otra vez.
  const [evento, setEvento] = useState(() => {
    const actual = getInvitacionActual();
    if (actual) actualizarSitioBase(actual.slug);
    return actual;
  });
  const [errorEvento, setErrorEvento] = useState("");

  const enEvento = tramos[0] === "evento" && tramos[1];
  const idRuta = enEvento ? String(tramos[1]) : null;

  // Entrar por enlace (o recargar) a un evento distinto del guardado.
  useEffect(() => {
    if (!logueado || !idRuta || String(evento?.id) === idRuta) return;
    let vivo = true;
    setErrorEvento("");
    api
      .obtenerInvitacion(idRuta)
      .then((inv) => {
        if (!vivo) return;
        setInvitacionActual(inv);
        actualizarSitioBase(inv.slug);
        setEvento({ id: String(inv.id), slug: inv.slug, nombre: inv.nombre, tipo_evento: inv.tipo_evento });
      })
      .catch(() => vivo && setErrorEvento("No encontramos ese evento o no tienes acceso a él."));
    return () => {
      vivo = false;
    };
  }, [logueado, idRuta]);

  // Direcciones viejas o vacías: a donde corresponde según quién entra.
  useEffect(() => {
    if (!logueado) return;
    if (esEventoFijo()) {
      const propio = getInvitacionActual();
      if (propio && (!enEvento || idRuta !== String(propio.id))) {
        ir(`/evento/${propio.id}/${enEvento ? tramos[2] || "resumen" : "resumen"}`, { reemplazar: true });
      }
    } else if (!tramos.length) {
      ir("/hoy", { reemplazar: true });
    }
  }, [logueado, tramos.join("/")]);

  function elegirEvento(inv) {
    setInvitacionActual(inv);
    actualizarSitioBase(inv.slug);
    setEvento({ id: String(inv.id), slug: inv.slug, nombre: inv.nombre, tipo_evento: inv.tipo_evento });
    ir(`/evento/${inv.id}/resumen`);
  }

  function cambiarEvento() {
    clearInvitacionActual();
    actualizarSitioBase(null);
    setEvento(null);
    ir("/eventos");
  }

  function salir() {
    clearToken();
    clearInvitacionActual();
    setEvento(null);
    setLogueado(false);
    ir("/", { reemplazar: true });
  }

  let contenido;
  if (!logueado) {
    contenido = (
      <Login
        onLogin={(inv) => {
          setLogueado(true);
          if (inv) elegirEvento(inv);
          else if (!tramos.length || tramos[0] === "evento") ir("/hoy", { reemplazar: true });
        }}
      />
    );
  } else if (enEvento) {
    contenido =
      evento && String(evento.id) === idRuta ? (
        <PendientesProvider key={evento.id}>
          <Cascara evento={evento} tab={tramos[2]} onCambiarEvento={cambiarEvento} onSalir={salir} />
        </PendientesProvider>
      ) : (
        <div className="min-h-screen grid place-items-center text-sm text-ink-tenue px-6 text-center">
          {errorEvento ? (
            <div>
              <p className="mb-3">{errorEvento}</p>
              <button className="boton-secundario" onClick={() => ir("/eventos")}>
                Ver mis eventos
              </button>
            </div>
          ) : (
            "Cargando evento..."
          )}
        </div>
      );
  } else {
    contenido = <PanelDueno tramos={tramos} onElegir={elegirEvento} onSalir={salir} />;
  }

  return <ToastProvider>{contenido}</ToastProvider>;
}
