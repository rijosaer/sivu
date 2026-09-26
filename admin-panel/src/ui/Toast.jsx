import { createContext, useCallback, useContext, useRef, useState } from "react";

// Avisos flotantes ("toast"). Reemplazan los textos sueltos de "Guardado" que
// aparecían y desaparecían en cada tarjeta. Uno los dispara con useToast().
const ToastContext = createContext({ toast: () => {} });

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);

  const quitar = useCallback((id) => setItems((xs) => xs.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (mensaje, tipo = "ok") => {
      const id = ++idRef.current;
      setItems((xs) => [...xs, { id, mensaje, tipo }]);
      setTimeout(() => quitar(id), 3200);
    },
    [quitar]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed z-[100] bottom-4 right-4 flex flex-col gap-2 max-w-[92vw]">
        {items.map((t) => (
          <button
            key={t.id}
            onClick={() => quitar(t.id)}
            role="status"
            className={`text-left px-4 py-2.5 rounded-md shadow-lg text-sm text-white transition-opacity ${
              t.tipo === "error"
                ? "bg-red-600"
                : t.tipo === "info"
                  ? "bg-marca-dark"
                  : "bg-emerald-600"
            }`}
          >
            {t.mensaje}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext).toast;
}
