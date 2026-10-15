import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api.js";

const EN_CURSO = new Set(["en_cola", "procesando"]);

// Lista de generaciones del usuario. Mientras alguna siga en curso, se
// consulta cada 2 s; cuando una termina, avisa (p. ej. para refrescar
// créditos, que se devuelven si falla).
export function useGeneraciones({ limite = 20, alTerminar } = {}) {
  const [lista, setLista] = useState([]);
  const [siguiente, setSiguiente] = useState(null);
  const [error, setError] = useState("");
  const [cargado, setCargado] = useState(false);
  const previas = useRef(new Map());
  const avisar = useRef(alTerminar);
  avisar.current = alTerminar;

  const cargar = useCallback(async () => {
    try {
      const datos = await api(`/v1/generaciones?limite=${limite}`);
      let alguna = false;
      for (const g of datos.generaciones) {
        const antes = previas.current.get(g.id);
        if (antes && EN_CURSO.has(antes) && !EN_CURSO.has(g.estado)) alguna = true;
        previas.current.set(g.id, g.estado);
      }
      if (alguna) avisar.current?.();
      // Conserva las páginas ya cargadas con "Cargar más".
      setLista((actual) => {
        const nuevas = new Set(datos.generaciones.map((g) => g.id));
        const viejas = actual.slice(limite).filter((g) => !nuevas.has(g.id));
        return [...datos.generaciones, ...viejas];
      });
      setSiguiente((s) => s ?? datos.siguiente);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setCargado(true);
    }
  }, [limite]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const hayEnCurso = lista.some((g) => EN_CURSO.has(g.estado));
  useEffect(() => {
    if (!hayEnCurso) return;
    const t = setInterval(cargar, 2000);
    return () => clearInterval(t);
  }, [hayEnCurso, cargar]);

  const cargarMas = async () => {
    if (!siguiente) return;
    const datos = await api(`/v1/generaciones?limite=${limite}&antes=${encodeURIComponent(siguiente)}`);
    setLista((actual) => [...actual, ...datos.generaciones.filter((g) => !actual.some((a) => a.id === g.id))]);
    setSiguiente(datos.siguiente);
  };

  const quitar = (id) => setLista((actual) => actual.filter((g) => g.id !== id));

  return { lista, cargado, error, recargar: cargar, cargarMas, haySiguiente: !!siguiente, quitar };
}
