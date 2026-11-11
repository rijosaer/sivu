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
          <p className="rp-regalo">{regalo.regalo}</p>
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

      {regalo.tipo === "lista" && (
        <ul className="rp-opciones">
          {opciones.map((o) => (
            <li key={o.id} className={`rp-opcion ${o.mia ? "rp-opcion-mia" : ""} ${!o.libre && !o.mia ? "rp-opcion-ocupada" : ""}`}>
              <div>
                <p className="rp-opcion-nombre">{o.nombre}</p>
                {o.detalle && <p className="rp-opcion-detalle">{o.detalle}</p>}
                {o.mia && <p className="rp-opcion-detalle">Apartado por ti</p>}
              </div>
              {o.mia ? (
                <button className="rp-btn" type="button" disabled={ocupado} onClick={() => elegir(null)}>
                  Quitar
                </button>
              ) : o.libre ? (
                <button className="rp-btn" type="button" disabled={ocupado} onClick={() => elegir(o.id)}>
                  Apartar
                </button>
              ) : (
                <span className="rp-opcion-estado">Ya lo apartaron</span>
              )}
            </li>
          ))}
        </ul>
      )}
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
