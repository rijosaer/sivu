import { downloadICS } from "../utils/ics";

export default function AddToCalendar({ info, novios }) {
  function handleClick() {
    downloadICS({
      titulo: `Boda civil — ${novios.el} & ${novios.ella}`,
      descripcion: `Ceremonia civil de ${novios.el} y ${novios.ella}. ${info.direccion}`,
      ubicacion: `${info.lugar}, ${info.direccion}`,
      inicio: info.fecha,
    });
  }

  return (
    <button
      onClick={handleClick}
      className="px-5 py-2 font-mono text-xs tracking-widest2 uppercase transition-colors border border-gold/50 text-gold-dark hover:bg-gold hover:text-paper"
    >
      Agendar
    </button>
  );
}
