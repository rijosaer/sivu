import { Suspense, lazy, useEffect, useState } from "react";
import { ir, useRuta } from "./ruta";
import Login from "./pages/Login";

// Cada pantalla se descarga solo cuando se abre: el panel arranca liviano.
const PanelDueno = lazy(() => import("./dueno/PanelDueno"));
const InicioEvento = lazy(() => import("./pages/InicioEvento"));
const Invitados = lazy(() => import("./pages/Invitados"));
const Envios = lazy(() => import("./pages/Envios"));
const Respuestas = lazy(() => import("./pages/Respuestas"));
const Regalos = lazy(() => import("./pages/Regalos"));
const Contenido = lazy(() => import("./pages/Contenido"));
const Tema = lazy(() => import("./pages/Tema"));
const Decoraciones = lazy(() => import("./pages/Decoraciones"));
const AjustesEvento = lazy(() => import("./pages/AjustesEvento"));

const Cargando = () => <p className="text-sm text-ink-tenue">Cargando...</p>;
import {
  api,
  comprobarSesion,
  cerrarSesion,
  setEventoFijo,
  getInvitacionActual,
  setInvitacionActual,
  clearInvitacionActual,
  actualizarSitioBase,
  esEventoFijo,
} from "./api";
import { PendientesProvider, usePendientes } from "./estado/Pendientes";
import { EventoProvider } from "./estado/Evento";
import { ToastProvider } from "./ui/Toast";
import { useAvisos } from "./notificaciones/useAvisos";
import Icono from "./ui/Icono";
import Marco, { SubNav, Firma } from "./ui/Marco";
import CabeceraEvento, { PESTANAS_EVENTO } from "./ui/CabeceraEvento";
import { PERMISO_CLIENTE } from "./permisos";

// Cada evento es un espacio de trabajo con sus pasos en el orden real del
// trabajo: Inicio · 1 Invitación · 2 Invitados · 3 Envíos · 4 Respuestas, y
// aparte Regalos y Ajustes. Cada cosa vive en UN solo lugar (antes WhatsApp
// salía en tres sitios y los regalos estaban escondidos dentro de Invitados).
// Direcciones: /evento/12/envios, /evento/12/invitacion/colores...
const PANTALLAS = {
  inicio: [["", "", InicioEvento]],
  invitacion: [
    ["textos", "Textos", Contenido],
    ["diseno", "Fondo y adornos", Decoraciones, "dueno"],
    ["colores", "Colores y letras", Tema, "dueno"],
  ],
  invitados: [["", "", Invitados]],
  envios: [["", "", Envios]],
  respuestas: [["", "", Respuestas]],
  regalos: [["", "", Regalos]],
  ajustes: [["", "", AjustesEvento, "dueno"]],
};

// Direcciones y atajos viejos (/evento/12/resumen, irA("lista")...) a su
// lugar nuevo, para que los enlaces guardados sigan sirviendo.
const ANTES = {
  resumen: ["inicio"],
  lista: ["respuestas"],
  personas: ["respuestas"],
  respuestas: ["respuestas"],
  mensajes: ["envios"],
  whatsapp: ["envios"],
  contenido: ["invitacion", "textos"],
  decoracion: ["invitacion", "diseno"],
  tema: ["invitacion", "colores"],
};
const ANTES_INVITADOS = { personas: ["respuestas"], regalos: ["regalos"], whatsapp: ["envios"], invitaciones: ["invitados"] };

// Qué pestañas ve quien entra. El dueño, todas. El cliente: lo de su evento,
// y de la invitación solo los textos si su paquete lo permite.
function pestanasPara(dueno, permiso, regalos) {
  return PESTANAS_EVENTO.map((p) => p.key).filter((k) => {
    if (k === "ajustes") return dueno;
    if (k === "regalos") return regalos;
    if (k === "invitacion") return dueno || permiso === "textos";
    return true;
  });
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

// Solo algunos diseños dibujan los regalos por invitado: lo dice el servidor.
function useRegalosDisponibles(eventoId) {
  const [disponibles, setDisponibles] = useState(false);
  useEffect(() => {
    let vivo = true;
    api
      .regalos()
      .then((r) => vivo && setDisponibles(Boolean(r.disponible)))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [eventoId]);
  return disponibles;
}

// El cliente no ve el negocio de Sivú: solo su evento, con la firma arriba y,
// en el celular, sus pasos como pestañas abajo.
function MarcoCliente({ onSalir, activo, visibles, onIr, children }) {
  const ABAJO = [
    ["inicio", "Inicio", "inicio"],
    ["invitados", "Invitados", "personas"],
    ["envios", "Envíos", "envio"],
    ["respuestas", "Respuestas", "respuesta"],
  ].filter(([k]) => visibles.includes(k));
  return (
    <div className="min-h-screen panel-lienzo pb-24 lg:pb-0">
      <div className="flex items-center justify-between px-5 sm:px-10 py-3 bg-marca-noche">
        <Firma />
        <button onClick={onSalir} className="text-[13px] text-[#E9D5CB] hover:text-white flex items-center gap-1.5">
          <Icono nombre="salir" className="w-4 h-4" />
          Salir
        </button>
      </div>
      {children}
      <nav className="barra-inferior" style={{ gridTemplateColumns: `repeat(${ABAJO.length}, minmax(0, 1fr))` }} aria-label="Pasos de tu evento">
        {ABAJO.map(([k, t, ic]) => (
          <button key={k} onClick={() => onIr(k)} className={`puerta ${activo === k ? "puerta-activa" : ""}`}>
            <span className="puerta-icono">
              <Icono nombre={ic} className="w-[22px] h-[22px]" />
            </span>
            {t}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Cascara({ onSalir, evento, onCambiarEvento, onAbrirEvento, tramos, usuario }) {
  const dueno = !esEventoFijo();
  const permiso = usePermisoCliente(dueno);
  const { hayPendientes, seccionesPendientes } = usePendientes();
  const avisos = useAvisos();
  const regalos = useRegalosDisponibles(evento.id);
  const visibles = pestanasPara(dueno, permiso, regalos);

  let [clave, sub] = [tramos[2] || "inicio", tramos[3] || ""];
  if (clave === "invitados" && ANTES_INVITADOS[sub]) [clave, sub] = ANTES_INVITADOS[sub];
  else if (ANTES[clave]) [clave, sub] = ANTES[clave];
  if (!visibles.includes(clave)) clave = "inicio";
  const partes = PANTALLAS[clave].filter((x) => dueno || x[3] !== "dueno");
  const parte = partes.find((x) => x[0] === sub) || partes[0];
  const [, , Componente] = parte;

  const irA = (destino, subDestino) => {
    let [k, s] = (destino === "invitados" && ANTES_INVITADOS[subDestino]) || ANTES[destino] || [destino, subDestino];
    if (!visibles.includes(k)) k = "inicio";
    ir(`/evento/${evento.id}/${k}${s ? `/${s}` : ""}`);
  };

  if (!permiso) return <div className="min-h-screen panel-lienzo" />;

  const acciones = (
    <>
      {hayPendientes && (
        <button
          onClick={() => irA("invitacion", "textos")}
          className="hidden md:inline-flex chip-franja !bg-oro !text-marca-noche"
          title={`Sin publicar: ${seccionesPendientes.join(", ")}`}
        >
          {seccionesPendientes.length} sin publicar
        </button>
      )}
      <button
        onClick={avisos.activo ? avisos.desactivar : avisos.activar}
        title={avisos.activo ? "Avisos con sonido activados: suena cuando alguien responde o abre su invitación" : "Activar avisos con sonido al recibir respuestas"}
        aria-label="Avisos con sonido"
        className={`grid place-items-center w-9 h-9 rounded-full border transition-colors ${avisos.activo ? "bg-oro text-marca-noche border-oro" : "border-current opacity-80 hover:opacity-100"}`}
      >
        <Icono nombre={avisos.activo ? "campana" : "campana-off"} className="w-4 h-4" />
      </button>
    </>
  );

  const contenido = (
    <EventoProvider evento={evento}>
      <CabeceraEvento
        visibles={visibles}
        activo={clave}
        onIr={(k) => irA(k)}
        onVolver={dueno ? onCambiarEvento : null}
        hayPendientes={hayPendientes}
        acciones={acciones}
      />
      <div className="contenido-evento">
        <SubNav opciones={partes.map(([k, t]) => [k, t])} activo={parte[0]} onIr={(k) => irA(clave, k)} />
        <Suspense fallback={<Cargando />}>
          <Componente key={`${clave}/${parte[0]}`} irA={irA} />
        </Suspense>
      </div>
    </EventoProvider>
  );

  if (!dueno) {
    return (
      <MarcoCliente onSalir={onSalir} activo={clave} visibles={visibles} onIr={(k) => irA(k)}>
        {contenido}
      </MarcoCliente>
    );
  }
  return (
    <Marco activo="eventos" onIr={(k) => ir(`/${k}`)} onSalir={onSalir} eventoActual={evento.id} onAbrirEvento={onAbrirEvento} usuario={usuario} completo>
      {contenido}
    </Marco>
  );
}

export default function App() {
  // null = preguntando a la API si hay sesión (la cookie no se puede leer
  // desde aquí); true/false = la respuesta.
  const [logueado, setLogueado] = useState(null);
  const tramos = useRuta();
  // El evento que se está editando: lo dice la dirección (/evento/12/...).
  // Si es el mismo que quedó guardado, se usa sin pedirlo otra vez.
  const [evento, setEvento] = useState(() => {
    const actual = getInvitacionActual();
    if (actual) actualizarSitioBase(actual.slug);
    return actual;
  });
  const [errorEvento, setErrorEvento] = useState("");
  const [usuario, setUsuario] = useState("");

  useEffect(() => {
    let vivo = true;
    comprobarSesion().then((sesion) => {
      if (!vivo) return;
      if (sesion) {
        setUsuario(sesion.usuario || "");
        // El evento de un cliente lo dice el servidor, no lo que haya quedado
        // guardado en este navegador.
        setEventoFijo(Boolean(sesion.invitacion));
        if (sesion.invitacion) {
          setInvitacionActual(sesion.invitacion);
          actualizarSitioBase(sesion.invitacion.slug);
          setEvento({
            id: String(sesion.invitacion.id),
            slug: sesion.invitacion.slug,
            nombre: sesion.invitacion.nombre,
            tipo_evento: sesion.invitacion.tipo_evento,
          });
        }
      }
      setLogueado(Boolean(sesion));
    });
    return () => {
      vivo = false;
    };
  }, []);

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
        ir(`/evento/${propio.id}/${enEvento ? tramos[2] || "inicio" : "inicio"}`, { reemplazar: true });
      }
    } else if (!tramos.length) {
      ir("/hoy", { reemplazar: true });
    }
  }, [logueado, tramos.join("/")]);

  function elegirEvento(inv) {
    setInvitacionActual(inv);
    actualizarSitioBase(inv.slug);
    setEvento({ id: String(inv.id), slug: inv.slug, nombre: inv.nombre, tipo_evento: inv.tipo_evento });
    ir(`/evento/${inv.id}/inicio`);
  }

  function cambiarEvento() {
    clearInvitacionActual();
    actualizarSitioBase(null);
    setEvento(null);
    ir("/eventos");
  }

  async function salir() {
    await cerrarSesion();
    clearInvitacionActual();
    setEvento(null);
    setLogueado(false);
    ir("/", { reemplazar: true });
  }

  let contenido;
  if (logueado === null) {
    contenido = <div className="min-h-screen panel-lienzo" />;
  } else if (!logueado) {
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
          <Cascara evento={evento} tramos={tramos} onCambiarEvento={cambiarEvento} onAbrirEvento={elegirEvento} onSalir={salir} usuario={usuario} />
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
        <PanelDueno tramos={tramos} onElegir={elegirEvento} onSalir={salir} usuario={usuario} />
      </Suspense>
    );
  }

  return <ToastProvider>{contenido}</ToastProvider>;
}
