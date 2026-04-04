import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { seedDefaultSkills } from "./core/skills.js";
import { seedDefaultAgents } from "./core/agents.js";
import { seedDefaultCommands } from "./core/custom-commands.js";

export const APP_NAME = "mragentix";
export const VERSION = "4.2.53";

export interface AppPaths {
  agentDir: string;
  sessionsDir: string;
  settingsFile: string;
  authFile: string;
  telegramFile: string;
  logFile: string;
  skillsDir: string;
  commandsDir: string;
  extensionsDir: string;
  agentsDir: string;
}

export function getAppPaths(): AppPaths {
  const agentDir = path.join(os.homedir(), ".mragentix");
  return {
    agentDir,
    sessionsDir: path.join(agentDir, "sessions"),
    settingsFile: path.join(agentDir, "settings.json"),
    authFile: path.join(agentDir, "auth.json"),
    telegramFile: path.join(agentDir, "telegram.json"),
    logFile: path.join(agentDir, "debug.log"),
    skillsDir: path.join(agentDir, "skills"),
    commandsDir: path.join(agentDir, "commands"),
    extensionsDir: path.join(agentDir, "extensions"),
    agentsDir: path.join(agentDir, "agents"),
  };
}

export async function ensureAppDirs(): Promise<AppPaths> {
  const paths = getAppPaths();
  await fs.mkdir(paths.agentDir, { recursive: true });
  await fs.mkdir(paths.sessionsDir, { recursive: true });
  await fs.mkdir(paths.skillsDir, { recursive: true });
  await fs.mkdir(paths.commandsDir, { recursive: true });
  await fs.mkdir(paths.extensionsDir, { recursive: true });
  await fs.mkdir(paths.agentsDir, { recursive: true });

  // Seed bundled defaults (only copies missing files — won't overwrite user edits)
  await seedDefaultSkills(paths.skillsDir);
  await seedDefaultAgents(paths.agentsDir);
  await seedDefaultCommands(paths.commandsDir);

  return paths;
}
