import type { AgentTool } from "@kenkaiiii/gg-agent";
import { createReadTool } from "./read.js";
import { createWriteTool } from "./write.js";
import { createEditTool } from "./edit.js";
import { createBashTool } from "./bash.js";
import { createFindTool } from "./find.js";
import { createGrepTool } from "./grep.js";
import { createLsTool } from "./ls.js";
import { createSubAgentTool } from "./subagent.js";
import type { AgentDefinition } from "../core/agents.js";

export interface CreateToolsOptions {
  agents?: AgentDefinition[];
  provider?: string;
  model?: string;
}

export function createTools(cwd: string, opts?: CreateToolsOptions): AgentTool[] {
  const readFiles = new Set<string>();
  const tools: AgentTool[] = [
    createReadTool(cwd, readFiles),
    createWriteTool(cwd, readFiles),
    createEditTool(cwd, readFiles),
    createBashTool(cwd),
    createFindTool(cwd),
    createGrepTool(cwd),
    createLsTool(cwd),
  ];

  if (opts?.agents && opts.agents.length > 0 && opts.provider && opts.model) {
    tools.push(createSubAgentTool(cwd, opts.agents, opts.provider, opts.model));
  }

  return tools;
}

export { createReadTool } from "./read.js";
export { createWriteTool } from "./write.js";
export { createEditTool } from "./edit.js";
export { createBashTool } from "./bash.js";
export { createFindTool } from "./find.js";
export { createGrepTool } from "./grep.js";
export { createLsTool } from "./ls.js";
