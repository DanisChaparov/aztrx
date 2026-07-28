import type { FocusSession } from "@focus-forge/core";

const app = document.getElementById("app")!;
const WEB_APP_URL = "http://localhost:3000";
const DURATIONS = [25, 50, 90];

function sendMessage<T = any>(message: Record<string, unknown>): Promise<T> {
  return chrome.runtime.sendMessage(message);
}

function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function renderSignedOut() {
  app.innerHTML = `
    <h1>Upstream</h1>
    <p>Sign in on the web app first, then reopen this popup — it connects automatically.</p>
    <a href="${WEB_APP_URL}/login" target="_blank">Open Upstream →</a>
  `;
}

let countdownTimer: ReturnType<typeof setInterval> | undefined;

function renderActiveSession(session: FocusSession, streak: number) {
  if (countdownTimer) clearInterval(countdownTimer);

  app.innerHTML = `
    <h1>Upstream</h1>
    <div class="timer" id="timer">--:--</div>
    <div class="row">
      <button class="primary" id="complete">I'm done</button>
      <button id="abandon">Give up</button>
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
    document.getElementById("complete")!.setAttribute("disabled", "true");
    const { result } = await sendMessage({ type: "COMPLETE_SESSION", sessionId: session.id });
    renderResult(result);
  });
  document.getElementById("abandon")!.addEventListener("click", async () => {
    await sendMessage({ type: "ABANDON_SESSION", sessionId: session.id });
    init();
  });
}

function renderResult(result: { verified: boolean }) {
  if (countdownTimer) clearInterval(countdownTimer);
  app.innerHTML = `
    <h1>Upstream</h1>
    <p>${result.verified ? "Verified ✓ — nice work." : "Session completed, but not verified."}</p>
    <button class="primary" id="again">Start another</button>
  `;
  document.getElementById("again")!.addEventListener("click", init);
}

function renderIdle(streak: number) {
  let selected = DURATIONS[0];

  app.innerHTML = `
    <h1>Upstream</h1>
    <div class="row" id="durations">
      ${DURATIONS.map((d) => `<button data-d="${d}" class="${d === selected ? "selected" : ""}">${d}m</button>`).join("")}
    </div>
    <button class="primary" id="start">Start focus session</button>
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
    const startBtn = document.getElementById("start") as HTMLButtonElement;
    startBtn.disabled = true;
    startBtn.textContent = "Starting…";
    const { session, error } = await sendMessage({
      type: "START_SESSION",
      projectId: null,
      plannedDurationMin: selected,
    });
    if (error) {
      startBtn.disabled = false;
      startBtn.textContent = "Start focus session";
      return;
    }
    renderActiveSession(session, streak);
  });
}

async function init() {
  app.innerHTML = "<p>Loading…</p>";
  const state = await sendMessage<{ signedIn: boolean; session: FocusSession | null; streak: number }>({
    type: "GET_STATE",
  });

  if (!state.signedIn) return renderSignedOut();
  if (state.session) return renderActiveSession(state.session, state.streak);
  return renderIdle(state.streak);
}

init();
