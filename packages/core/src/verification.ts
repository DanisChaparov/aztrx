export interface VerificationInput {
  status: "active" | "completed" | "broken";
  distractionEventCount: number;
  /** True/false only known when a repo is linked; null means no repo is linked so this signal is skipped. */
  githubActivityDetected: boolean | null;
  /** True when local git commits or tool activity was detected. Used for tool-tracked
   *  sessions where no GitHub repo is linked — verifies via editor/AI tool usage. */
  localActivityDetected: boolean | null;
}

/** Small number of brief tab-switches shouldn't tank an otherwise honest session. */
const DISTRACTION_TOLERANCE = 1;

export function isSessionVerified(input: VerificationInput): boolean {
  if (input.status !== "completed") return false;
  if (input.distractionEventCount > DISTRACTION_TOLERANCE) return false;
  // Tool-tracked mode: local activity (editor usage, AI prompts) is a valid signal.
  if (input.localActivityDetected === true) return true;
  // GitHub mode: need commit activity.
  if (input.githubActivityDetected === false) return false;
  return true;
}
