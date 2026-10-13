import { Suspense, lazy, useEffect, useState } from "react";
import { ir, useRuta } from "./ruta";
import Login from "./pages/Login";

// Cada pantalla se descarga solo cuando se abre: el panel arranca liviano.
const PanelDueno = lazy(() => import("./dueno/PanelDueno"));
const Resumen = lazy(() => import("./pages/Resumen"));
const Invitados = lazy(() => import("./pages/Invitados"));
const Lista = lazy(() => import("./pages/Lista"));
const Contenido = lazy(() => import("./pages/Contenido"));
const Tema = lazy(() => import("./pages/Tema"));
const Decoraciones = lazy(() => import("./pages/Decoraciones"));
const WhatsappEvento = lazy(() => import("./pages/WhatsappEvento"));
const AjustesEvento = lazy(() => import("./pages/AjustesEvento"));

const Cargando = () => <p className="text-sm text-ink-tenue">Cargando...</p>;
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
import { NOMBRE_TIPO_EVENTO } from "./tiposEvento";
import { vocabulario } from "./vocabulario";
import { PendientesProvider, usePendientes } from "./estado/Pendientes";
import { ToastProvider } from "./ui/Toast";
import { useAvisos } from "./notificaciones/useAvisos";
import Icono from "./ui/Icono";
import Marco, { SubNav } from "./ui/Marco";
import { PERMISO_CLIENTE } from "./permisos";

// Cada evento en cuatro pantallas, agrupadas por la pregunta que responden:
// ¿cómo va? (Resumen), ¿a quién invito? (Invitados), ¿cómo se ve? (Invitación)
// y ¿quién entra y qué recibe? (Ajustes, solo el dueño). Las que tienen varias
// partes llevan pestañas internas; cada una con su dirección:
// /evento/12/invitados/personas.
const PANTALLAS = [
  {
    key: "resumen",
    label: "Resumen",
    icono: "resumen",
    descripcion: null,
    partes: [["", "", Resumen]],
  },
  {
    key: "invitados",
    label: "Invitados",
    icono: "sobre",
    descripcion: "Enlaces, lista de personas y WhatsApp.",
    partes: [
      ["invitaciones", "Invitaciones", Invitados],
      ["personas", "Lista de personas", Lista],
      ["whatsapp", "WhatsApp", WhatsappEvento],
    ],
  },
  {
    key: "invitacion",
    label: "Invitación",
    icono: "flor",
    descripcion: "Lo que ven tus invitados.",
    partes: [
      ["textos", "Textos", Contenido],
      ["diseno", "Diseño", Decoraciones, "dueno"],
      ["colores", "Colores", Tema, "dueno"],
    ],
  },
  {
    key: "ajustes",
    label: "Ajustes",
    icono: "ajustes",
    descripcion: "Acceso del cliente, permisos y avisos.",
    soloDueno: true,
    partes: [["", "", AjustesEvento]],
  },
];

// Direcciones y atajos viejos (/evento/12/lista, irA("mensajes")...) a su
// lugar nuevo.
const ANTES = {
  lista: ["invitados", "personas"],
  respuestas: ["invitados", "whatsapp"],
  mensajes: ["invitados", "whatsapp"],
  contenido: ["invitacion", "textos"],
  decoracion: ["invitacion", "diseno"],
  tema: ["invitacion", "colores"],
};

// Qué pantallas ve quien entra. El dueño, todas. El cliente: Resumen e
// Invitados, y de la invitación solo los textos si su paquete lo permite.
function pantallasPara(dueno, permiso) {
  return PANTALLAS.filter((p) => dueno || !p.soloDueno)
    .map((p) => ({ ...p, partes: p.partes.filter((x) => dueno || x[3] !== "dueno") }))
    .filter((p) => dueno || p.key !== "invitacion" || permiso === "textos");
}

function usePermisoCliente(dueno) {
  const [permiso, setPermiso] = useState(dueno ? "todo" : null);
  useEffect(() => {
    if (dueno) return;
    api
      .tema()
      .then((t) => setPermiso((Array.isArray(t) ? t.find((x) => x.clave === PERMISO_CLIENTE)?.valor : null) || "ver"))
      .catch(() => setPermiso("ver"));
  }, [dueno]);
  return permiso;
}

function Cascara({ onSalir, evento, onCambiarEvento, tramos }) {
  const dueno = !esEventoFijo();
  const permiso = usePermisoCliente(dueno);
  const { hayPendientes, seccionesPendientes } = usePendientes();
  const avisos = useAvisos();

  const visibles = pantallasPara(dueno, permiso);
  let [clave, sub] = [tramos[2] || "resumen", tramos[3] || ""];
  if (ANTES[clave]) [clave, sub] = ANTES[clave];
  const pantalla = visibles.find((p) => p.key === clave) || visibles[0];
  const parte = pantalla.partes.find((x) => x[0] === sub) || pantalla.partes[0];
  const [, , Componente] = parte;

  const irA = (destino, subDestino) => {
    let [k, s] = ANTES[destino] || [destino, subDestino];
    if (!visibles.some((p) => p.key === k)) k = "resumen";
    ir(`/evento/${evento.id}/${k}${s ? `/${s}` : ""}`);
  };

  if (!permiso) return <div className="min-h-screen panel-lienzo" />;

  const descripcion = pantalla.key === "resumen" ? vocabulario(evento.tipo_evento).resumen : pantalla.descripcion;

  return (
    <Marco
      items={visibles.map((p) => ({
        key: p.key,
        label: p.label,
        icono: p.icono,
        punto: p.key === "invitacion" && hayPendientes ? "Cambios sin publicar" : null,
      }))}
      activo={pantalla.key}
      onIr={(k) => irA(k)}
      onSalir={onSalir}
      titulo={pantalla.label}
      descripcion={descripcion}
      arriba={
        <div className="tarjeta-evento hidden lg:block">
          {dueno && (
            <button onClick={onCambiarEvento} className="flex items-center gap-1 text-[11px] text-[#C9A9A0] hover:text-white mb-2">
              <Icono nombre="volver" className="w-3.5 h-3.5" />
              Todos los eventos
            </button>
          )}
          <p className="font-display text-[17px] leading-tight text-white">{evento.nombre}</p>
          <p className="text-[11px] text-oro mt-1 uppercase tracking-[.14em]">
            {NOMBRE_TIPO_EVENTO[evento.tipo_evento] || "Evento"}
          </p>
        </div>
      }
      acciones={
        <>
          {hayPendientes && (
            <button
              onClick={() => irA("invitacion", "textos")}
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
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
              avisos.activo ? "border-marca-dark bg-marca-dark text-[#FBF3E4]" : "border-borde-fuerte text-ink-suave hover:text-ink"
            }`}
          >
            <Icono nombre={avisos.activo ? "campana" : "campana-off"} className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Avisos</span>
          </button>
          <a href={SITIO_BASE} target="_blank" rel="noreferrer" className="enlace-vista">
            Ver invitación ↗
          </a>
        </>
      }
    >
      {dueno && (
        <button onClick={onCambiarEvento} className="lg:hidden boton-texto mb-4">
          <Icono nombre="volver" className="w-3.5 h-3.5" />
          {evento.nombre}
        </button>
      )}
      <SubNav opciones={pantalla.partes.map(([k, t]) => [k, t])} activo={parte[0]} onIr={(k) => irA(pantalla.key, k)} />
      <Suspense fallback={<Cargando />}>
        <Componente key={`${pantalla.key}/${parte[0]}`} irA={irA} />
      </Suspense>
    </Marco>
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
          <Cascara evento={evento} tramos={tramos} onCambiarEvento={cambiarEvento} onSalir={salir} />
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
    contenido = (
      <Suspense fallback={<div className="min-h-screen panel-lienzo" />}>
        <PanelDueno tramos={tramos} onElegir={elegirEvento} onSalir={salir} />
      </Suspense>
    );
  }

  return <ToastProvider>{contenido}</ToastProvider>;
}
