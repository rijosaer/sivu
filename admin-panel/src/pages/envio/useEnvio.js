import { useCallback, useEffect, useMemo, useState } from "react";
import { api, SITIO_BASE } from "../../api";
import { armarMensaje, diasHasta, normalizarTelefono, plazoCerrado, telefonoValido } from "../../whatsapp";

// Lo que necesitan los envíos (uno por uno, automático, recordatorios): la
// lista de invitaciones, las plantillas de los mensajes y las fechas que
// rellenan {dias} y {dias_limite}. Antes vivía dentro de Invitados; ahora lo
// comparten Invitados y Envíos para que el mensaje salga igual desde ambos.

function claveTema(tema, clave) {
  if (Array.isArray(tema)) return tema.find((x) => x.clave === clave)?.valor;
  return tema?.[clave];
}

export function cuposDe(invitacion) {
  const total = invitacion.tipo === "cupos" ? invitacion.cupos || 0 : 0;
  const usados = (invitacion.miembros || []).filter((m) => m.es_acompanante).length;
  return { total, usados, libres: total - usados };
}

export const sinTildes = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export default function useEnvio() {
  const [lista, setLista] = useState(null);
  const [plantilla, setPlantilla] = useState("");
  const [recordatorio, setRecordatorio] = useState("");
  const [fechas, setFechas] = useState({});

  const cargar = useCallback(async () => {
    const [invs, tema, secciones] = await Promise.all([api.invitados(), api.tema(), api.secciones().catch(() => [])]);
    setLista(invs);
    setFechas(secciones.find((s) => s.tipo === "informacion_boda")?.contenido || {});
    setPlantilla(claveTema(tema, "whatsapp-plantilla") || "Hola {nombre}, te compartimos tu invitación: {enlace}");
    setRecordatorio(claveTema(tema, "whatsapp-recordatorio") || "Hola {nombre}, te recordamos confirmar tu asistencia ({plazo}): {enlace}");
  }, []);

  useEffect(() => {
    cargar().catch(() => setLista([]));
  }, [cargar]);

  const recargarLista = useCallback(async () => setLista(await api.invitados()), []);

  const grupos = useMemo(
    () => [...new Set((lista || []).map((i) => (i.grupo || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    [lista]
  );

  // Mensajes listos para enviar: misma plantilla, mismo enlace, solo al número
  // principal. `grupo` ("" = todos) recorta a quién va.
  const armarItems = useCallback(
    (tipo, grupo = "") => {
      const cuenta = { dias: diasHasta(fechas.fecha), diasLimite: diasHasta(fechas.fechaLimiteConfirmacion) };
      const cerrado = plazoCerrado(cuenta.diasLimite);
      return (lista || [])
        .filter((i) => !grupo || sinTildes(i.grupo) === sinTildes(grupo))
        .filter((i) => telefonoValido(i.telefono))
        .filter((i) =>
          tipo === "invitacion" ? !i.enviado_en : !cerrado && i.enviado_en && i.miembros.some((m) => m.estado === "pendiente")
        )
        .reverse() // la lista va de la más nueva a la más vieja; se envía en el orden en que se crearon
        .map((i) => ({
          invitado_id: i.id,
          nombre: i.nombre,
          telefono: normalizarTelefono(i.telefono),
          texto: armarMensaje(tipo === "invitacion" ? plantilla : recordatorio, {
            nombre: i.familia || i.nombre,
            enlace: `${SITIO_BASE}?i=${i.codigo}`,
            cupos: cuposDe(i).total,
            ...cuenta,
          }),
        }));
    },
    [lista, plantilla, recordatorio, fechas]
  );

  return { lista, grupos, plantilla, recordatorio, fechas, armarItems, recargar: cargar, recargarLista };
}
