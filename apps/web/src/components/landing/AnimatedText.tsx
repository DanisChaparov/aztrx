/**
 * Reveals a line of copy word-by-word.
 *
 * Each word gets its own span with an inline `animationDelay` derived from its
 * index, so the whole line resolves as one sweep rather than a single block
 * fade. `startIndex` lets a multi-line heading keep one continuous cadence
 * across separate <AnimatedText> calls instead of restarting per line.
 */
export function AnimatedText({
  text,
  startDelay = 0,
  step = 0.06,
  startIndex = 0,
  className,
}: {
  text: string;
  startDelay?: number;
  step?: number;
  startIndex?: number;
  className?: string;
}) {
  return (
    <span className={className}>
      {text.split(" ").map((word, i) => (
        <span
          // Words repeat within a line, so the index has to be part of the key.
          key={`${word}-${i}`}
          className="animate-fade-in-up inline-block whitespace-pre"
          style={{ animationDelay: `${startDelay + (startIndex + i) * step}s` }}
        >
          {word}{" "}
        </span>
      ))}
    </span>
  );
}
