import { Fragment } from "react";

/**
 * Reveals a line of copy word-by-word.
 *
 * Each word gets its own span with an inline `animationDelay` derived from its
 * index, so the whole line resolves as one sweep rather than a single block
 * fade. `startIndex` lets a multi-line heading keep one continuous cadence
 * across separate <AnimatedText> calls instead of restarting per line.
 *
 * The separating space is a real text node *between* the spans, not padding
 * inside them: adjacent inline-blocks with no whitespace between them give the
 * browser nowhere to break, which leaves the line overflowing on narrow screens.
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
  const words = text.split(" ");

  return (
    <span className={className}>
      {words.map((word, i) => (
        // Words repeat within a line, so the index has to be part of the key.
        <Fragment key={`${word}-${i}`}>
          <span
            className="animate-fade-in-up inline-block"
            style={{ animationDelay: `${startDelay + (startIndex + i) * step}s` }}
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
