import type { FocusSession } from "@aztrx/core";
import { MASCOT_STYLES, mascotSvg, type MascotMood } from "./mascot";

interface AztrxBridge {
  openSignIn: () => Promise<void>;
  getState: () => Promise<{ signedIn: boolean; session: FocusSession | null; streak: number }>;
  startSession: (plannedDurationMin: number) => Promise<{ session?: FocusSession; error?: string }>;
  completeSession: (sessionId: string) => Promise<{ verified: boolean }>;
  abandonSession: (sessionId: string) => Promise<void>;
  onStateChanged: (callback: (state: { signedIn: boolean; session: FocusSession | null; streak: number }) => void) => void;
}

declare global {
  interface Window {
    aztrx: AztrxBridge;
  }
}

const app = document.getElementById("app")!;
const DURATIONS = [25, 50, 90];

// The mascot's animations live in a stylesheet injected once, rather than being
// re-parsed every time a mood changes.
const mascotStyle = document.createElement("style");
mascotStyle.textContent = MASCOT_STYLES;
document.head.appendChild(mascotStyle);

function mascot(mood: MascotMood, size = 84): string {
  return `<div class="mascot-wrap">${mascotSvg(mood, size)}</div>`;
}

document.getElementById("close")!.addEventListener("click", () => window.close());

function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function renderSignedOut() {
  app.innerHTML = `
    ${mascot("asleep")}
    <p>Sign in from your browser to connect this widget.</p>
    <button class="action primary" id="signin">Sign in</button>
  `;
  document.getElementById("signin")!.addEventListener("click", () => window.aztrx.openSignIn());
}

let countdownTimer: ReturnType<typeof setInterval> | undefined;

function renderActiveSession(session: FocusSession, streak: number) {
  if (countdownTimer) clearInterval(countdownTimer);
  app.innerHTML = `
    ${mascot("focused", 68)}
    <div class="timer" id="timer">--:--</div>
    <div class="row">
      <button class="action primary" id="complete">I'm done</button>
      <button class="action" id="abandon">Give up</button>
    </div>
    <div class="streak">🔥 ${streak} day streak</div>
  `;

  const timerEl = document.getElementById("timer")!;
  const tick = () => {
    const totalMs = session.plannedDurationMin * 60 * 1000;
    const elapsedMs = Date.now() - new Date(session.startedAt).getTime();
    timerEl.textContent = formatClock((totalMs - elapsedMs) / 1000);
  };
  tick();
  countdownTimer = setInterval(tick, 1000);

  document.getElementById("complete")!.addEventListener("click", async () => {
    const result = await window.aztrx.completeSession(session.id);
    renderResult(result.verified);
  });
  document.getElementById("abandon")!.addEventListener("click", async () => {
    await window.aztrx.abandonSession(session.id);
    init();
  });
}

function renderResult(verified: boolean) {
  if (countdownTimer) clearInterval(countdownTimer);
  app.innerHTML = `
    ${mascot(verified ? "celebrating" : "alarmed")}
    <p>${verified ? "Verified — nice work." : "Session completed, but not verified."}</p>
    <button class="action primary" id="again">Start another</button>
  `;
  document.getElementById("again")!.addEventListener("click", init);
}

function renderIdle(streak: number) {
  let selected = DURATIONS[0];
  app.innerHTML = `
    ${mascot("asleep", 72)}
    <div class="row" id="durations">
      ${DURATIONS.map((d) => `<button class="action ${d === selected ? "selected" : ""}" data-d="${d}">${d}m</button>`).join("")}
    </div>
    <button class="action primary" id="start">Start focus session</button>
    <div class="streak">🔥 ${streak} day streak</div>
  `;

  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("#durations button"));
  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      selected = Number(btn.dataset.d);
      buttons.forEach((b) => b.classList.toggle("selected", b === btn));
    });
  }

  document.getElementById("start")!.addEventListener("click", async () => {
    const { session, error } = await window.aztrx.startSession(selected);
    if (error || !session) return;
    renderActiveSession(session, streak);
  });
}

async function init() {
  app.innerHTML = "<p>Loading…</p>";
  const state = await window.aztrx.getState();
  if (!state.signedIn) return renderSignedOut();
  if (state.session) return renderActiveSession(state.session, state.streak);
  return renderIdle(state.streak);
}

window.aztrx.onStateChanged((state) => {
  // Only refresh when idle/signed-out to avoid clobbering an in-progress countdown UI.
  if (!state.session) init();
});

init();
