import { useDecor } from "../theme/DecorContext";

export default function MarbleColumn({ className = "", side = "left" }) {
  const { column } = useDecor();
  return (
    <img
      src={column}
      alt=""
      aria-hidden="true"
      className={`${className} object-contain object-bottom`}
      style={{ transform: side === "right" ? "scaleX(-1)" : "none" }}
      loading="lazy"
    />
  );
}
