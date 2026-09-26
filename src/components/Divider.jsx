import { useDecor } from "../theme/DecorContext";

export default function Divider({ className = "" }) {
  const { divider } = useDecor();
  return (
    <img
      src={divider}
      alt=""
      aria-hidden="true"
      className={`mx-auto ${className}`}
      style={{ width: 140, height: "auto" }}
      loading="lazy"
    />
  );
}
