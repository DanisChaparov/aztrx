/** Synthesized two-tone chime — no audio asset needed, works the moment a session ends. */
export function playChime(): void {
  try {
    const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();

    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.35); // A5
    playTone(1318.5, now + 0.18, 0.45); // E6

    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Audio is a nice-to-have — never let it break the session-complete flow.
  }
}

/** Foreground browser notification — only needs Notification permission, not a full push subscription. */
export function notifySessionEnd(title: string, body: string): void {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    new Notification(title, { body, icon: "/icon.svg" });
  } catch {
    // Same — best-effort only.
  }
}
