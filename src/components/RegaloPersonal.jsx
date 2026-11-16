import { useState } from "react";
import "./RegaloPersonal.css";
import { reservarRegalo } from "../api/site";

// El regalo que le toca a este invitado, sea cual sea el diseño. Lo arma el
// servidor según lo que el panel le asignó (ver server/routes/regalos.js):
//   sobres      → mensaje y datos para aportar, con botón de copiar.
//   especifico  → el regalo pensado para esa persona y dónde comprarlo.
//   lista       → opciones para apartar; lo que aparta otro sale ocupado.
//   enlace      → botón a la tienda.
// Se viste con los colores y letras del tema del evento (variables del tema),
// así que sirve igual en un diseño claro que en uno oscuro. Los diseños que lo
// llevan dentro de la página lo ponen con su propio título; los demás lo
// muestran desde el botón flotante (RegaloFlotante).

// «https://www.mercadolibre.com.co/...» → «Mercado Libre».
const TIENDAS = {
  mercadolibre: "Mercado Libre", falabella: "Falabella", exito: "Éxito", amazon: "Amazon",
  homecenter: "Homecenter", alkosto: "Alkosto", ktronix: "Ktronix", jumbo: "Jumbo",
  tiendasjumbo: "Jumbo", olimpica: "Olímpica", temu: "Temu", shein: "Shein", ikea: "IKEA",
};
export function nombreTienda(url) {
  try {
    const raiz = new URL(url).hostname.replace(/^www\./, "").split(".")[0];
    return TIENDAS[raiz] || raiz.charAt(0).toUpperCase() + raiz.slice(1);
  } catch {
    return "la tienda";
  }
}

// Las cosas de un regalo, cada una con su cantidad y dónde comprarla.
// `clase` es el prefijo del diseño ("rp" común, "va" Valle).
export function ListaArticulos({ articulos, clase = "rp", conEnlaces = true }) {
  if (!articulos?.length) return null;
  return (
    <ul className={`${clase}-articulos`}>
      {articulos.map((a, i) => (
        <li key={i}>
          <span className={`${clase}-articulo-cant`}>{a.cantidad}</span>
          <span className={`${clase}-articulo-nombre`}>{a.nombre}</span>
          {conEnlaces && a.url && (
            <a className={`${clase}-articulo-enlace`} href={a.url} target="_blank" rel="noopener noreferrer">
              Ver en {nombreTienda(a.url)} ↗
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

// Lista de opciones para apartar, pensada para listas largas:
// - si el invitado ya eligió, ve SU regalo destacado y el resto queda detrás
//   de «Cambiar mi elección»;
// - si no, ve las primeras opciones libres y «Ver las N opciones»;
// - lo que ya apartaron otros no ocupa tarjetas: va en una línea discreta.
// `clase` es el prefijo del diseño ("rp" común, "va" Valle): mismas piezas,
// distinta ropa.
export function ListaOpciones({ opciones, ocupado, elegir, clase = "rp", visibles = 4 }) {
  const [verTodas, setVerTodas] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const mia = opciones.find((o) => o.mia);
  const libres = opciones.filter((o) => o.libre && !o.mia);
  const ocupadas = opciones.filter((o) => !o.libre && !o.mia);
  const c = (n) => `${clase}-${n}`;

  async function apartar(id) {
    await elegir(id);
    setCambiando(false);
    setVerTodas(false);
  }

  const tarjeta = (o) => (
    <li key={o.id} className={`${c("opcion")} ${o.mia ? c("opcion-mia") : ""}`}>
      <div className={c("opcion-cabeza")}>
        <div>
          <p className={c("opcion-nombre")}>{o.nombre}</p>
          {o.mia ? (
            <p className={c("opcion-cupos")}>Apartado por ti</p>
          ) : (
            o.personas > 1 && <p className={c("opcion-cupos")}>Quedan {o.quedan} de {o.personas}</p>
          )}
        </div>
        {o.mia ? (
          <button className={c("btn")} type="button" disabled={ocupado} onClick={() => elegir(null)}>
            Quitar
          </button>
        ) : (
          <button className={`${c("btn")} ${c("btn-lleno")}`} type="button" disabled={ocupado} onClick={() => apartar(o.id)}>
            Apartar
          </button>
        )}
      </div>
      {o.detalle && <p className={c("opcion-detalle")}>{o.detalle}</p>}
      <ListaArticulos articulos={o.articulos} clase={clase} />
      {o.url && (
        <a className={c("opcion-enlace")} href={o.url} target="_blank" rel="noopener noreferrer">
          Ver dónde comprarlo ↗
        </a>
      )}
    </li>
  );

  const ocupadasLinea = ocupadas.length > 0 && (
    <p className={c("elige-ocupadas")}>
      Ya apartados: {ocupadas.map((o) => o.nombre).join(", ")}.
    </p>
  );

  if (mia && !cambiando) {
    return (
      <div className={c("elige")}>
        <p className={c("elige-etiqueta")}>Tu regalo elegido</p>
        <ul className={c("opciones")}>{tarjeta(mia)}</ul>
        {libres.length > 0 && (
          <button type="button" className={c("elige-mas")} onClick={() => setCambiando(true)}>
            Cambiar mi elección
          </button>
        )}
      </div>
    );
  }

  const mostrar = verTodas ? libres : libres.slice(0, visibles);
  return (
    <div className={c("elige")}>
      {mia && (
        <>
          <p className={c("elige-etiqueta")}>Tu regalo elegido</p>
          <ul className={c("opciones")}>{tarjeta(mia)}</ul>
        </>
      )}
      <p className={c("elige-etiqueta")}>
        {libres.length === 0
          ? "Todas las opciones ya fueron apartadas"
          : mia
            ? "Elige otra opción"
            : libres.length === 1
              ? "1 opción disponible"
              : `${libres.length} opciones disponibles`}
      </p>
      {mostrar.length > 0 && <ul className={c("opciones")}>{mostrar.map(tarjeta)}</ul>}
      {libres.length > visibles && (
        <button type="button" className={c("elige-mas")} onClick={() => setVerTodas(!verTodas)}>
          {verTodas ? "Ver menos" : `Ver las ${libres.length} opciones`}
        </button>
      )}
      {mia && (
        <button type="button" className={c("elige-mas")} onClick={() => setCambiando(false)}>
          Dejar mi elección como está
        </button>
      )}
      {ocupadasLinea}
    </div>
  );
}

export function ContenidoRegalo({ regalo, slug, codigo, onAviso = () => {} }) {
  const [opciones, setOpciones] = useState(regalo.opciones || []);
  const [ocupado, setOcupado] = useState(false);

  async function elegir(opcionId) {
    setOcupado(true);
    try {
      setOpciones(await reservarRegalo(slug, codigo, opcionId));
      onAviso(opcionId === null ? "Quitaste tu regalo" : "¡Regalo apartado!");
    } catch (e) {
      if (e.opciones) setOpciones(e.opciones);
      onAviso(e.message);
    }
    setOcupado(false);
  }

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      onAviso("Datos copiados");
    } catch {
      onAviso("No se pudo copiar: mantén presionado el texto para copiarlo");
    }
  }

  return (
    <div className="rp">
      {regalo.texto && <p className="rp-texto">{regalo.texto}</p>}

      {regalo.tipo === "sobres" && regalo.datos && (
        <div className="rp-sobre">
          <p className="rp-etiqueta">Datos para tu aporte</p>
          <p className="rp-dato">{regalo.datos}</p>
          <button className="rp-btn" type="button" onClick={() => copiar(regalo.datos)}>
            Copiar datos
          </button>
        </div>
      )}

      {regalo.tipo === "especifico" && (
        <div className="rp-especifico">
          <p className="rp-etiqueta">Tu regalo</p>
          {regalo.regalo && <p className="rp-regalo">{regalo.regalo}</p>}
          <ListaArticulos articulos={regalo.articulos} />
          {regalo.url && (
            <a className="rp-btn rp-btn-lleno" href={regalo.url} target="_blank" rel="noopener noreferrer">
              Ver dónde comprarlo
            </a>
          )}
        </div>
      )}

      {regalo.tipo === "enlace" && (
        <p className="rp-botones">
          <a className="rp-btn rp-btn-lleno" href={regalo.url} target="_blank" rel="noopener noreferrer">
            {regalo.etiqueta || "Ver tienda"}
          </a>
        </p>
      )}

      {regalo.tipo === "lista" && <ListaOpciones opciones={opciones} ocupado={ocupado} elegir={elegir} />}
    </div>
  );
}

// Botón flotante «Tu regalo» y la hoja que se abre con él. Lo usa App para los
// diseños que no dibujan el regalo dentro de la página.
export default function RegaloFlotante({ regalo, slug, codigo }) {
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState("");

  function avisar(texto) {
    setAviso(texto);
    setTimeout(() => setAviso(""), 2400);
  }

  return (
    <>
      <button className="rp-flotante" type="button" onClick={() => setAbierto(true)} aria-haspopup="dialog">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="9" width="17" height="11.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M2.5 9h19M12 9v11.5M12 9c-1.5-3.5-6-4.5-6-1.8C6 8.8 9 9 12 9zm0 0c1.5-3.5 6-4.5 6-1.8C18 8.8 15 9 12 9z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        Tu regalo
      </button>
      {abierto && (
        <div
          className="rp-velo"
          role="dialog"
          aria-modal="true"
          aria-label={regalo.titulo || "Regalos"}
          onClick={(e) => e.target === e.currentTarget && setAbierto(false)}
          onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}
        >
          <div className="rp-hoja">
            <button className="rp-cerrar" type="button" onClick={() => setAbierto(false)} aria-label="Cerrar">
              ×
            </button>
            <h2 className="rp-titulo">{regalo.titulo || "Regalos"}</h2>
            <ContenidoRegalo regalo={regalo} slug={slug} codigo={codigo} onAviso={avisar} />
          </div>
        </div>
      )}
      <div className={`rp-aviso ${aviso ? "rp-aviso-visible" : ""}`} role="status" aria-live="polite">
        {aviso}
      </div>
    </>
  );
}
