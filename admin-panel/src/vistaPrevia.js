import { useEffect, useState } from "react";
import { api } from "./api";

// Token para que la vista previa abra la invitación aunque el evento sea
// «solo con enlace personal» (sin él, el sitio respondería «no encontrada»).
// null mientras llega; "" si no se pudo pedir (la previa sigue intentándolo
// como enlace general).
export function useTokenVista() {
  const [token, setToken] = useState(null);
  useEffect(() => {
    let vivo = true;
    api
      .tokenVista()
      .then((r) => vivo && setToken(r.token || ""))
      .catch(() => vivo && setToken(""));
    return () => {
      vivo = false;
    };
  }, []);
  return token;
}

export const conVista = (url, token) => (token ? `${url}&vista=${encodeURIComponent(token)}` : url);
