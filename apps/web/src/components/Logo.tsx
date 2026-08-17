/**
 * Aztrx wordmark — the page logo. Lowercase with the terminal "x" in accent blue.
 * `size` is the font-size in px; pass `className` for the surrounding type style
 * (font family, weight, color).
 */
export function Logo({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`tracking-tight ${className}`}
      style={{ fontSize: size, lineHeight: 1 }}
    >
      aztr<span style={{ color: "#3B82F6" }}>x</span>
    </span>
  );
}
