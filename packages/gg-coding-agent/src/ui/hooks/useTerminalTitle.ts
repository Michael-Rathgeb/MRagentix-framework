import { useEffect, useState } from "react";
import { useStdout } from "ink";
import type { ActivityPhase } from "./useAgentLoop.js";

const SPINNER_FRAMES = [
  "\u280B",
  "\u2819",
  "\u2839",
  "\u2838",
  "\u283C",
  "\u2834",
  "\u2826",
  "\u2827",
  "\u2807",
  "\u280F",
];
const SPINNER_INTERVAL = 80;

function getTitleText(phase: ActivityPhase, isRunning: boolean): string {
  if (!isRunning) return "GG Coder";
  switch (phase) {
    case "thinking":
      return "Thinking...";
    case "generating":
      return "Generating...";
    case "tools":
      return "Running tools...";
    case "waiting":
      return "Thinking...";
    default:
      return "GG Coder";
  }
}

export function useTerminalTitle(phase: ActivityPhase, isRunning: boolean): void {
  const { stdout } = useStdout();

  const [spinnerFrame, setSpinnerFrame] = useState(0);

  // Spinner animation while running
  useEffect(() => {
    if (!isRunning) {
      setSpinnerFrame(0);
      return;
    }
    const timer = setInterval(() => {
      setSpinnerFrame((f) => (f + 1) % SPINNER_FRAMES.length);
    }, SPINNER_INTERVAL);
    return () => clearInterval(timer);
  }, [isRunning]);

  // Write terminal title
  useEffect(() => {
    if (!stdout) return;
    const text = getTitleText(phase, isRunning);
    const title = isRunning ? `${SPINNER_FRAMES[spinnerFrame]} ${text}` : text;
    stdout.write(`\x1b]0;${title}\x07`);
  }, [stdout, phase, isRunning, spinnerFrame]);

  // Reset title on unmount
  useEffect(() => {
    return () => {
      stdout?.write(`\x1b]0;GG Coder\x07`);
    };
  }, [stdout]);
}
