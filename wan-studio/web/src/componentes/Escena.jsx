// Vista previa animada de un preset (ver .escena en index.css).
export default function Escena({ animacion, className = "" }) {
  return (
    <div className={`escena ${className}`} aria-hidden="true">
      <div className={`mundo anim-${animacion || "respirar"}`}>
        <div className="sujeto" />
      </div>
    </div>
  );
}
