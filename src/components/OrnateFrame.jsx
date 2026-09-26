import { useDecor } from "../theme/DecorContext";

export default function OrnateFrame({ children, className = "" }) {
  const { frame } = useDecor();
  return (
    <div className={`relative ${className}`}>
      <img
        src={frame}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
      />
      <div className="relative flex items-center justify-center h-full px-10 sm:px-12 text-center">
        {children}
      </div>
    </div>
  );
}
