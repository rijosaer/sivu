import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { ir } from "../ruta";
import Icono from "./Icono";
import { fechaBonita } from "../estado/Evento";

// Buscar en todo (Ctrl K): eventos, clientes y cosas que hacer, desde una sola
// caja. Es el atajo para no tener que recordar en qué menú vive cada cosa.

const sinTildes = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const ACCIONES = [
  { titulo: "Crear un evento nuevo", sub: "Asistente paso a paso", icono: "mas", ruta: "/eventos?nuevo=1" },
  { titulo: "Ver lo de hoy", sub: "Pendientes y pagos por confirmar", icono: "sol", ruta: "/hoy" },
  { titulo: "Mensajes de WhatsApp", sub: "Clientes e invitados", icono: "chat", ruta: "/mensajes" },
  { titulo: "Configuración › Planes y extras", sub: "Precios y lo que incluye cada plan", icono: "ajustes", ruta: "/configuracion/planes" },
  { titulo: "Configuración › Métodos de pago", sub: "Nequi, Daviplata, cuentas", icono: "ajustes", ruta: "/configuracion/pagos" },
  { titulo: "Diseños", sub: "Catálogo y variantes", icono: "flor", ruta: "/disenos" },
];

function Resaltado({ texto, q }) {
  if (!q) return texto;
  const i = sinTildes(texto).indexOf(sinTildes(q));
  if (i < 0) return texto;
  return (
    <>
      {texto.slice(0, i)}
      <mark className="bg-transparent text-marca font-semibold">{texto.slice(i, i + q.length)}</mark>
      {texto.slice(i + q.length)}
    </>
  );
}

export default function Buscador({ onCerrar, onAbrirEvento }) {
  const [q, setQ] = useState("");
  const [eventos, setEventos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [indice, setIndice] = useState(0);
  const entrada = useRef(null);

  useEffect(() => {
    entrada.current?.focus();
    api.listarInvitaciones().then((l) => setEventos(l.filter((e) => !e.es_plantilla))).catch(() => {});
    api.crm?.prospectos?.({}).then((l) => setClientes(Array.isArray(l) ? l : l?.prospectos || [])).catch(() => {});
  }, []);

  const grupos = useMemo(() => {
    const t = sinTildes(q.trim());
    const coincide = (...campos) => !t || campos.some((c) => sinTildes(c).includes(t));
    const ev = eventos
      .filter((e) => coincide(e.nombre, e.slug))
      .slice(0, t ? 6 : 4)
      .map((e) => ({
        titulo: e.nombre,
        sub: [e.fecha_evento ? fechaBonita(e.fecha_evento) : null, e.invitados ? `${e.invitados} invitaciones` : null].filter(Boolean).join(" · "),
        icono: "calendario",
        abrir: () => onAbrirEvento(e),
      }));
    const cl = t
      ? clientes
          .filter((c) => coincide(c.nombre, c.telefono, c.evento))
          .slice(0, 5)
          .map((c) => ({ titulo: c.nombre || c.telefono, sub: [c.evento, c.estado].filter(Boolean).join(" · "), icono: "persona", ruta: `/clientes/${c.id}` }))
      : [];
    const ac = ACCIONES.filter((a) => coincide(a.titulo, a.sub)).slice(0, t ? 4 : 3);
    return [
      ["Eventos", ev],
      ["Clientes", cl],
      ["Hacer algo", ac],
    ].filter(([, l]) => l.length);
  }, [q, eventos, clientes, onAbrirEvento]);

  const todos = grupos.flatMap(([, l]) => l);
  useEffect(() => setIndice(0), [q]);

  function abrir(r) {
    if (!r) return;
    onCerrar();
    if (r.abrir) r.abrir();
    else ir(r.ruta);
  }

  function tecla(e) {
    if (e.key === "Escape") onCerrar();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndice((i) => Math.min(i + 1, todos.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndice((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") abrir(todos[indice]);
  }

  let n = -1;
  return (
    <div className="fixed inset-0 z-[60] bg-ink/45 flex items-start justify-center px-4 pt-[12vh]" onClick={onCerrar}>
      <div className="w-full max-w-[40rem] bg-paper rounded-2xl shadow-flotante overflow-hidden" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Buscar en el panel">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-borde">
          <Icono nombre="buscar" className="w-5 h-5 text-marca" />
          <input
            ref={entrada}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={tecla}
            placeholder="Busca un evento, un cliente o lo que quieras hacer"
            className="flex-1 !border-0 !outline-none !bg-transparent text-[17px] font-display text-ink placeholder:text-ink-tenue placeholder:font-sans placeholder:text-[15px]"
          />
          <kbd className="text-[11px] px-2 py-0.5 rounded bg-lienzo text-ink-suave">Esc</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!todos.length && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-semibold text-ink">No encontramos «{q}»</p>
              <p className="ayuda mt-1">Prueba con otra palabra o con parte del nombre.</p>
            </div>
          )}
          {grupos.map(([titulo, lista]) => (
            <div key={titulo} className="mb-1">
              <p className="px-3 pt-3 pb-1.5 text-[11px] uppercase tracking-[.14em] text-ink-tenue font-semibold">{titulo}</p>
              {lista.map((r) => {
                n += 1;
                const sel = n === indice;
                const yo = n;
                return (
                  <button
                    key={`${titulo}-${r.titulo}`}
                    onMouseEnter={() => setIndice(yo)}
                    onClick={() => abrir(r)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${sel ? "bg-marca-suave" : "hover:bg-lienzo"}`}
                  >
                    <span className={`grid place-items-center w-8 h-8 rounded-lg ${sel ? "bg-paper text-marca" : "bg-lienzo text-ink-suave"}`}>
                      <Icono nombre={r.icono} className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink truncate">
                        <Resaltado texto={r.titulo} q={q.trim()} />
                      </span>
                      {r.sub && <span className="block text-xs text-ink-suave truncate">{r.sub}</span>}
                    </span>
                    {sel && <span className="text-xs text-marca shrink-0">Enter ↵</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex gap-5 px-5 py-2.5 bg-lienzo text-xs text-ink-suave">
          <span>↑ ↓ para moverte</span>
          <span>Enter para abrir</span>
          <span className="hidden sm:inline">Esc para cerrar</span>
        </div>
      </div>
    </div>
  );
}
