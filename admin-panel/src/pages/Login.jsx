import { useState } from "react";
import { api, setInvitacionActual, setEventoFijo } from "../api";
import Icono from "../ui/Icono";

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [verClave, setVerClave] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      // La API deja la sesión en una cookie HttpOnly; aquí no llega ningún token.
      const { invitacion } = await api.login(usuario, password);
      // Un cliente entra directo a su evento; el dueño elige en "Tus eventos".
      setEventoFijo(Boolean(invitacion));
      if (invitacion) setInvitacionActual(invitacion);
      onLogin(invitacion);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_38rem] bg-lienzo">
      {/* La marca: en la computadora ocupa la mitad; en el celular, una franja. */}
      <div className="barra-lateral !flex !flex-col relative overflow-hidden px-8 sm:px-14 py-8 lg:py-14 justify-between">
        <p className="marca-firma !text-[2.6rem] lg:!text-[3.6rem] !text-oro">Sivú</p>
        <div className="hidden lg:block max-w-[30rem]">
          <p className="font-display text-[2.6rem] leading-[1.1] text-white">Todo tu evento, en un solo lugar.</p>
          <p className="text-[16px] text-[#E9D5CB] mt-3">Invitados, envíos, respuestas y regalos. Sin perderte.</p>
        </div>
        <p className="hidden lg:block text-[13px] text-oro">heysivu.com</p>
        <span aria-hidden="true" className="absolute -right-24 top-16 w-[26rem] h-[26rem] rounded-full border border-oro/25" />
        <span aria-hidden="true" className="absolute right-10 -bottom-32 w-80 h-80 rounded-full border border-oro/20" />
      </div>

      <div className="flex items-center justify-center px-6 py-10">
        <form onSubmit={handleSubmit} className="tarjeta w-full max-w-[26rem] p-8">
          <h1 className="font-display text-[1.9rem] font-medium text-ink leading-tight">Entra a tu panel</h1>
          <p className="text-[14.5px] text-ink-suave mt-1 mb-6">Dueño o cliente: es el mismo lugar.</p>

          <label className="block mb-4">
            <span className="block text-[14px] font-medium text-ink mb-1.5">Usuario</span>
            <input
              className="campo !py-3 !text-[15px]"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="ej. boda-maite"
              autoFocus
              autoComplete="username"
              autoCapitalize="none"
            />
          </label>

          <label className="block mb-5">
            <span className="block text-[14px] font-medium text-ink mb-1.5">Contraseña</span>
            <span className="relative block">
              <input
                type={verClave ? "text" : "password"}
                className="campo !py-3 !text-[15px] pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setVerClave((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full text-ink-suave hover:bg-lienzo"
                aria-label={verClave ? "Ocultar la contraseña" : "Ver la contraseña"}
              >
                <Icono nombre="ojo" className="w-[18px] h-[18px]" />
              </button>
            </span>
          </label>

          {error && <p className="text-red-700 text-[14px] mb-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{error}</p>}

          <button disabled={cargando} className="boton-primario w-full !py-3 !text-[15px]">
            {cargando ? "Entrando..." : "Entrar"}
          </button>

          <p className="mt-5 text-[13.5px] text-ink-suave leading-relaxed bg-lienzo rounded-xl px-4 py-3">
            ¿Eres cliente? Usa el usuario y la contraseña que te enviamos por WhatsApp. ¿La olvidaste? Escríbenos y te damos una nueva.
          </p>
        </form>
      </div>
    </div>
  );
}
