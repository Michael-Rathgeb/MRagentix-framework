import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface AgentDefinition {
  name: string;
  description: string;
  tools: string[];
  systemPrompt: string;
  source: "global" | "project" | "bundled";
}

/**
 * Get the path to the bundled defaults/agents directory shipped with the package.
 */
function getBundledAgentsDir(): string {
  // From src/core/agents.ts → ../../defaults/agents
  return path.resolve(__dirname, "..", "..", "defaults", "agents");
}

/**
 * Seed bundled default agents into the global agents directory.
 * Only copies files that don't already exist (won't overwrite user customizations).
 */
export async function seedDefaultAgents(globalAgentsDir: string): Promise<void> {
  const bundledDir = getBundledAgentsDir();
  let bundledFiles: string[];
  try {
    bundledFiles = await fs.readdir(bundledDir);
  } catch {
    return; // No bundled defaults available
  }

  await fs.mkdir(globalAgentsDir, { recursive: true });

  for (const file of bundledFiles) {
    if (!file.endsWith(".md")) continue;
    const destPath = path.join(globalAgentsDir, file);
    try {
      await fs.access(destPath);
      // File already exists — don't overwrite user customizations
    } catch {
      // File doesn't exist — copy the bundled default
      const srcPath = path.join(bundledDir, file);
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Discover agent definitions from bundled defaults, global, and project-local directories.
 * Priority: project > global > bundled (later entries with the same name win).
 */
export async function discoverAgents(options: {
  globalAgentsDir: string;
  projectDir?: string;
}): Promise<AgentDefinition[]> {
  const agentMap = new Map<string, AgentDefinition>();

  // 1. Bundled default agents (shipped with the package)
  const bundledDir = getBundledAgentsDir();
  const bundledAgents = await loadAgentsFromDir(bundledDir, "bundled");
  for (const a of bundledAgents) agentMap.set(a.name, a);

  // 2. Global agents: ~/.mragentix/agents/*.md (override bundled)
  const globalAgents = await loadAgentsFromDir(options.globalAgentsDir, "global");
  for (const a of globalAgents) agentMap.set(a.name, a);

  // 3. Project agents: {cwd}/.mragentix/agents/*.md (override global)
  if (options.projectDir) {
    const projectAgentsDir = path.join(options.projectDir, ".mragentix", "agents");
    const projectAgents = await loadAgentsFromDir(projectAgentsDir, "project");
    for (const a of projectAgents) agentMap.set(a.name, a);
  }

  return Array.from(agentMap.values());
}

async function loadAgentsFromDir(
  dir: string,
  source: "global" | "project" | "bundled",
): Promise<AgentDefinition[]> {
  const agents: AgentDefinition[] = [];
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return agents;
  }

  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const filePath = path.join(dir, file);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const agent = parseAgentFile(content, source);
      if (!agent.name) {
        agent.name = path.basename(file, ".md");
      }
      agents.push(agent);
    } catch {
      // Skip unreadable files
    }
  }

  return agents;
}

/**
 * Parse an agent definition file with frontmatter.
 *
 * ```markdown
 * ---
 * name: scout
 * description: Fast codebase recon that returns compressed context
 * tools: read, grep, find, ls, bash
 * ---
 *
 * You are a scout. Quickly investigate a codebase...
 * ```
 */
export function parseAgentFile(raw: string, source: "global" | "project" | "bundled"): AgentDefinition {
  let name = "";
  let description = "";
  let tools: string[] = [];
  let systemPrompt = raw;

  if (raw.startsWith("---")) {
    const endIndex = raw.indexOf("---", 3);
    if (endIndex !== -1) {
      const frontmatter = raw.slice(3, endIndex).trim();
      systemPrompt = raw.slice(endIndex + 3).trim();

      for (const line of frontmatter.split("\n")) {
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) continue;
        const key = line.slice(0, colonIndex).trim().toLowerCase();
        const value = line.slice(colonIndex + 1).trim();

        if (key === "name") name = value;
        else if (key === "description") description = value;
        else if (key === "tools") {
          tools = value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }
      }
    }
  }

  return { name, description, tools, systemPrompt, source };
}
