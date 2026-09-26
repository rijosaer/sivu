import { useDecor } from "../theme/DecorContext";

const CORNER_STYLES = {
  "top-left": { top: 0, left: 0, transform: "" },
  "top-right": { top: 0, right: 0, transform: "scaleX(-1)" },
  "bottom-left": { bottom: 0, left: 0, transform: "scaleY(-1)" },
  "bottom-right": { bottom: 0, right: 0, transform: "scale(-1, -1)" },
};

// Esquina decorativa: filigrana dorada + ramillete floral. Usa la imagen
// de fábrica o la que se haya subido desde el panel (pestaña Decoración).
export default function Corner({ corner = "top-left", size = 150, flowers = true, className = "" }) {
  const { scrollwork, bouquet } = useDecor();
  const pos = CORNER_STYLES[corner];

  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none ${className}`}
      style={{
        top: pos.top,
        left: pos.left,
        right: pos.right,
        bottom: pos.bottom,
        width: size,
        height: size * 1.3,
        transform: pos.transform,
      }}
    >
      <img
        src={scrollwork}
        alt=""
        className="absolute inset-0 w-full h-full object-contain object-left-top opacity-90"
      />
      {flowers && (
        <img
          src={bouquet}
          alt=""
          className="absolute"
          style={{ width: "55%", height: "55%", bottom: "2%", left: "6%" }}
        />
      )}
    </div>
  );
}
