import { useMemo, type CSSProperties } from "react";

const COLORS = ["#f97316", "#fb923c", "#34d399", "#60a5fa", "#f472b6", "#facc15"];

type ConfettiPieceStyle = CSSProperties & { "--drift"?: string };

/** Dependency-free confetti burst — mount it briefly (e.g. 2s) over a "verified!" result. */
export function Confetti({ count = 40 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1.4 + Math.random() * 0.8,
        color: COLORS[i % COLORS.length],
        drift: (Math.random() - 0.5) * 120,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes ff-confetti-fall {
          0% { transform: translate(0, -10px) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--drift), 260px) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((p) => {
        const style: ConfettiPieceStyle = {
          position: "absolute",
          left: `${p.left}%`,
          top: 0,
          width: 8,
          height: 8,
          backgroundColor: p.color,
          borderRadius: 2,
          "--drift": `${p.drift}px`,
          animation: `ff-confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
        };
        return <span key={p.id} style={style} />;
      })}
    </div>
  );
}
