import { Suspense, lazy, useState } from "react";
import { esEventoFijo } from "../api";
import Icono from "../ui/Icono";
import useEnvio from "./envio/useEnvio";
import { useEvento } from "../estado/Evento";

const EnvioEnFila = lazy(() => import("./EnvioEnFila"));
const EnvioAutomatico = lazy(() => import("./EnvioAutomatico"));
const Mensajes = lazy(() => import("./Mensajes"));

// Todo lo de enviar por WhatsApp en un solo lugar. Antes estaba repartido:
// los botones en Invitados, los textos en Invitados → WhatsApp y los
// recordatorios mezclados. Aquí: cuánto va, las tres formas de enviar y el
// mensaje que recibe cada quien.

const ruta = () => window.location.pathname.split("/").filter(Boolean);

function Metodo({ icono, color, titulo, etiqueta, texto, detalle, boton, claseBoton, onClick, deshabilitado }) {
  return (
    <div className="tarjeta p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className={`grid place-items-center w-11 h-11 rounded-full ${color}`}>
          <Icono nombre={icono} className="w-5 h-5" />
        </span>
        <div>
          <p className="font-display text-xl text-ink leading-tight">{titulo}</p>
          <span className="text-[12.5px] text-ink-suave">{etiqueta}</span>
        </div>
      </div>
      <p className="text-[14px] text-ink-suave leading-relaxed">{texto}</p>
      <p className="text-[13px] text-ink bg-lienzo rounded-xl px-3 py-2">{detalle}</p>
      <span className="flex-1" />
      <button onClick={onClick} disabled={deshabilitado} className={`${claseBoton} !text-[13.5px] !py-2.5`}>
        {boton}
      </button>
    </div>
  );
}

export default function Envios() {
  const { lista, grupos, armarItems, recargarLista } = useEnvio();
  const { recargarResumen } = useEvento();
  const esDueno = !esEventoFijo();
  const [grupo, setGrupo] = useState("");
  // Abierto desde otra pantalla con /envios/uno o /envios/recordar.
  const [abierto, setAbierto] = useState(() => {
    const extra = ruta()[3];
    return extra === "uno" ? ["fila", "invitacion"] : extra === "recordar" ? ["fila", "recordatorio"] : null;
  });

  if (!lista) return <p className="text-sm text-ink-tenue">Cargando...</p>;

  const delGrupo = grupo ? lista.filter((i) => (i.grupo || "").trim() === grupo) : lista;
  const total = delGrupo.length;
  const enviadas = delGrupo.filter((i) => i.enviado_en).length;
  const porEnviar = armarItems("invitacion", grupo).length;
  const sinTelefono = delGrupo.filter((i) => !i.enviado_en).length - porEnviar;
  const porRecordar = armarItems("recordatorio", grupo).length;
  const pct = total ? Math.round((enviadas / total) * 100) : 0;
  const cambio = () => {
    recargarLista();
    recargarResumen?.();
  };
  const items = (tipo) => armarItems(tipo, grupo);

  if (!total) {
    return (
      <div className="vacio">
        <p className="font-display text-xl text-ink">Todavía no hay a quién enviar</p>
        <p className="ayuda mt-1">Primero agrega a tus invitados; luego aquí los envías por WhatsApp.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-5">
        <div className="min-w-[16rem]">
          <p className="font-display text-[1.5rem] leading-tight text-ink">
            {enviadas} de {total} invitaciones enviadas
          </p>
          <p className="text-[14px] text-ink-suave">
            {porEnviar ? `Quedan ${porEnviar} por enviar` : "No queda ninguna por enviar"}
            {sinTelefono > 0 ? ` · ${sinTelefono} sin teléfono` : ""}
            {porRecordar ? ` · ${porRecordar} ${porRecordar === 1 ? "espera" : "esperan"} recordatorio` : ""}
          </p>
        </div>
        <div className="flex-1 min-w-[12rem] h-2.5 rounded-full bg-borde overflow-hidden">
          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[15px] font-semibold text-emerald-700 tabular-nums">{pct} %</span>
        {grupos.length > 0 && (
          <select className="campo !w-auto !py-2 !text-[13.5px]" value={grupo} onChange={(e) => setGrupo(e.target.value)} aria-label="Grupo a enviar">
            <option value="">Todos los grupos</option>
            {grupos.map((g) => (
              <option key={g} value={g}>
                Solo {g}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={`grid gap-4 ${esDueno ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        <Metodo
          icono="envio"
          color="bg-emerald-50 text-emerald-700"
          titulo="Uno por uno"
          etiqueta="Desde tu WhatsApp"
          texto="Sivú abre cada chat con el mensaje listo. Tú solo tocas enviar. Ideal si eres tú quien manda las tarjetas."
          detalle={porEnviar ? `${porEnviar} ${porEnviar === 1 ? "pendiente" : "pendientes"}${grupo ? ` de ${grupo}` : ""}` : "No hay pendientes"}
          boton={porEnviar ? `Empezar con ${porEnviar === 1 ? "la que falta" : `las ${porEnviar}`}` : "Abrir"}
          claseBoton="boton-verde"
          onClick={() => setAbierto(["fila", "invitacion"])}
        />
        {esDueno && (
          <Metodo
            icono="ajustes"
            color="bg-marca-suave text-marca"
            titulo="Automático"
            etiqueta="Desde el número de Sivú"
            texto="Sivú las envía por ti, con pausas para cuidar el número. Puedes elegir el grupo arriba."
            detalle={porEnviar ? `A quién: ${porEnviar} sin enviar${grupo ? ` de ${grupo}` : ""}` : "No hay pendientes"}
            boton="Programar envío"
            claseBoton="boton-secundario"
            onClick={() => setAbierto(["auto", "invitacion"])}
          />
        )}
        <Metodo
          icono="campana"
          color="bg-oro-suave text-oro-oscuro"
          titulo="Recordatorios"
          etiqueta="Para quien no responde"
          texto="Un mensaje corto para quienes ya recibieron la invitación y no han confirmado."
          detalle={porRecordar ? `${porRecordar} ${porRecordar === 1 ? "invitación" : "invitaciones"} sin responder` : "Nadie espera recordatorio"}
          boton="Enviar recordatorio"
          claseBoton="boton-secundario"
          deshabilitado={!porRecordar}
          onClick={() => setAbierto([esDueno ? "auto" : "fila", "recordatorio"])}
        />
      </div>

      {abierto && (
        <Suspense fallback={<p className="text-sm text-ink-tenue">Cargando...</p>}>
          {grupo && <p className="ayuda -mb-3">Solo el grupo «{grupo}».</p>}
          {abierto[0] === "fila" ? (
            <EnvioEnFila key={abierto.join()} armarItems={items} tipoInicial={abierto[1]} onCambio={cambio} onCerrar={() => setAbierto(null)} />
          ) : (
            <EnvioAutomatico key={abierto.join()} armarItems={items} tipoInicial={abierto[1]} onCambio={cambio} onCerrar={() => setAbierto(null)} />
          )}
        </Suspense>
      )}

      <div className="separador" />
      <Suspense fallback={<p className="text-sm text-ink-tenue">Cargando...</p>}>
        <Mensajes />
      </Suspense>
    </div>
  );
}
