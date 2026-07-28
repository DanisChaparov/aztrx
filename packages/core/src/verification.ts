export interface VerificationInput {
  status: "active" | "completed" | "broken";
  distractionEventCount: number;
  /** True/false only known when a repo is linked; null means no repo is linked so this signal is skipped. */
  githubActivityDetected: boolean | null;
}

/** Small number of brief tab-switches shouldn't tank an otherwise honest session. */
const DISTRACTION_TOLERANCE = 1;

export function isSessionVerified(input: VerificationInput): boolean {
  if (input.status !== "completed") return false;
  if (input.distractionEventCount > DISTRACTION_TOLERANCE) return false;
  if (input.githubActivityDetected === false) return false;
  return true;
}
