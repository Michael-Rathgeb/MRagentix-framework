import React from "react";
import { Text, Box } from "ink";
import { useTheme } from "../theme/theme.js";

export interface SubAgentInfo {
  toolCallId: string;
  task: string;
  agentName: string;
  status: "running" | "done" | "error" | "aborted";
  toolUseCount: number;
  tokenUsage: { input: number; output: number };
  currentActivity?: string;
  result?: string;
  durationMs?: number;
}

interface SubAgentPanelProps {
  agents: SubAgentInfo[];
  expanded?: boolean;
  aborted?: boolean;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

export function SubAgentPanel({ agents, expanded = false, aborted = false }: SubAgentPanelProps) {
  const theme = useTheme();

  if (agents.length === 0) return null;

  const runningCount = agents.filter((a) => a.status === "running").length;
  const allDone = runningCount === 0;
  const isActive = !allDone && !aborted;

  // Header text
  const headerText = aborted
    ? `${agents.length} agent${agents.length !== 1 ? "s" : ""} interrupted`
    : allDone
      ? `${agents.length} agent${agents.length !== 1 ? "s" : ""} completed`
      : `Running ${runningCount} agent${runningCount !== 1 ? "s" : ""}…`;

  return (
    <Box marginTop={1}>
      <Text color={theme.primary}>{"⏺ "}</Text>
      <Box flexDirection="column" flexShrink={1}>
        {/* Header */}
        <Text bold>{headerText}</Text>

        {/* Agent list */}
        {agents.map((agent, i) => {
          const isLast = i === agents.length - 1;
          const connector = isLast ? "└─" : "├─";
          const subConnector = isLast ? "   " : "│  ";
          const totalTokens = agent.tokenUsage.input + agent.tokenUsage.output;

          const statusColor =
            agent.status === "done"
              ? theme.success
              : agent.status === "error" || agent.status === "aborted"
                ? theme.error
                : undefined;

          const taskDisplay = agent.task.length > 50 ? agent.task.slice(0, 47) + "…" : agent.task;

          return (
            <Box key={agent.toolCallId} flexDirection="column">
              {/* Agent summary line */}
              <Box>
                <Text color={theme.textDim}>{connector} </Text>
                <Text bold={agent.status === "running" && !aborted} color={statusColor}>
                  {taskDisplay}
                </Text>
                <Text color={theme.textDim}>
                  {" · "}
                  {agent.toolUseCount} tool use{agent.toolUseCount !== 1 ? "s" : ""}
                  {" · "}
                  {formatTokens(totalTokens)} tokens
                  {agent.durationMs != null ? ` · ${formatDuration(agent.durationMs)}` : ""}
                </Text>
              </Box>

              {/* Current activity (only when actively running) */}
              {isActive && agent.status === "running" && agent.currentActivity && (
                <Box>
                  <Text color={theme.textDim}>
                    {subConnector}⎿ {agent.currentActivity}
                  </Text>
                </Box>
              )}

              {/* Result preview (when expanded and done) */}
              {expanded && agent.status !== "running" && agent.result && (
                <Box>
                  <Text color={theme.textDim}>
                    {subConnector}⎿ {agent.result.split("\n")[0]?.slice(0, 80)}
                    {(agent.result.split("\n").length > 1 || agent.result.length > 80) && "…"}
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
