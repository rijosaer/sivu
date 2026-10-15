import { useCallback, useEffect, useState } from "react";
import { alVencerSesion, api, guardarToken, haySesion } from "./api.js";
import Nav from "./componentes/Nav.jsx";
import Explorar from "./paginas/Explorar.jsx";
import Crear from "./paginas/Crear.jsx";
import Biblioteca from "./paginas/Biblioteca.jsx";
import ApiDocs from "./paginas/ApiDocs.jsx";
import Entrar from "./paginas/Entrar.jsx";

// Rutas con hash (#/crear?preset=orbita): no hace falta configurar nada en el
// servidor para que funcionen al recargar.
function leerRuta() {
  const [ruta, consulta = ""] = window.location.hash.replace(/^#\/?/, "").split("?");
  return { pagina: ruta || "explorar", consulta: new URLSearchParams(consulta) };
}

const ir = (destino) => {
  window.location.hash = `#/${destino}`;
};

export default function App() {
  const [ruta, setRuta] = useState(leerRuta);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(haySesion());
  const [catalogo, setCatalogo] = useState(null);

  useEffect(() => {
    const cambio = () => {
      setRuta(leerRuta());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", cambio);
    return () => window.removeEventListener("hashchange", cambio);
  }, []);

  const refrescarUsuario = useCallback(async () => {
    if (!haySesion()) return;
    try {
      const { usuario } = await api("/api/auth/yo");
      setUsuario(usuario);
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    alVencerSesion(() => setUsuario(null));
    refrescarUsuario();
    api("/v1/presets").then(setCatalogo).catch(() => setCatalogo({ presets: [], opciones: null }));
  }, [refrescarUsuario]);

  const entrar = ({ token, usuario }) => {
    guardarToken(token);
    setUsuario(usuario);
  };
  const salir = () => {
    guardarToken(null);
    setUsuario(null);
    ir("explorar");
  };

  const { pagina, consulta } = ruta;
  const necesitaSesion = ["crear", "biblioteca", "api"].includes(pagina);

  let contenido;
  if (cargando || !catalogo) {
    contenido = <p className="py-24 text-center text-tenue">Cargando…</p>;
  } else if (pagina === "entrar" || (necesitaSesion && !usuario)) {
    contenido = <Entrar alEntrar={entrar} />;
  } else if (pagina === "crear") {
    contenido = (
      <Crear catalogo={catalogo} usuario={usuario} presetInicial={consulta.get("preset")} alCambiarCreditos={refrescarUsuario} />
    );
  } else if (pagina === "biblioteca") {
    contenido = <Biblioteca alCambiarCreditos={refrescarUsuario} />;
  } else if (pagina === "api") {
    contenido = <ApiDocs catalogo={catalogo} />;
  } else {
    contenido = <Explorar catalogo={catalogo} />;
  }

  return (
    <div className="min-h-screen">
      <Nav pagina={pagina} usuario={usuario} alSalir={salir} />
      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">{contenido}</main>
    </div>
  );
}
