import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSkillFile } from "./skills.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface CustomCommand {
  name: string;
  description: string;
  prompt: string;
  filePath: string;
}

/**
 * Get the path to the bundled defaults/commands directory shipped with the package.
 */
function getBundledCommandsDir(): string {
  // From src/core/custom-commands.ts → ../../defaults/commands
  return path.resolve(__dirname, "..", "..", "defaults", "commands");
}

/**
 * Seed bundled default commands into the global commands directory.
 * Only copies files that don't already exist (won't overwrite user customizations).
 */
export async function seedDefaultCommands(globalCommandsDir: string): Promise<void> {
  const bundledDir = getBundledCommandsDir();
  let bundledFiles: string[];
  try {
    bundledFiles = await fs.readdir(bundledDir);
  } catch {
    return; // No bundled defaults available
  }

  await fs.mkdir(globalCommandsDir, { recursive: true });

  for (const file of bundledFiles) {
    if (!file.endsWith(".md")) continue;
    const destPath = path.join(globalCommandsDir, file);
    try {
      await fs.access(destPath);
      // File already exists — don't overwrite user customizations
    } catch {
      const srcPath = path.join(bundledDir, file);
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Load custom slash commands from multiple sources.
 * Priority: project > global > bundled (later entries with the same name win).
 *
 * Sources:
 * 1. Bundled defaults shipped with the package
 * 2. Global: ~/.mragentix/commands/*.md
 * 3. Project: {cwd}/.mragentix/commands/*.md
 */
export async function loadCustomCommands(
  cwd: string,
  globalCommandsDir?: string,
): Promise<CustomCommand[]> {
  const commandMap = new Map<string, CustomCommand>();

  // 1. Bundled defaults
  const bundledDir = getBundledCommandsDir();
  const bundled = await loadCommandsFromDir(bundledDir);
  for (const cmd of bundled) commandMap.set(cmd.name, cmd);

  // 2. Global commands: ~/.mragentix/commands/*.md
  if (globalCommandsDir) {
    const global = await loadCommandsFromDir(globalCommandsDir);
    for (const cmd of global) commandMap.set(cmd.name, cmd);
  }

  // 3. Project commands: {cwd}/.mragentix/commands/*.md
  const projectDir = path.join(cwd, ".mragentix", "commands");
  const project = await loadCommandsFromDir(projectDir);
  for (const cmd of project) commandMap.set(cmd.name, cmd);

  return Array.from(commandMap.values());
}

async function loadCommandsFromDir(dir: string): Promise<CustomCommand[]> {
  const commands: CustomCommand[] = [];

  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return commands;
  }

  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const filePath = path.join(dir, file);

    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const parsed = parseSkillFile(raw, "project");
      const name = parsed.name || path.basename(file, ".md");
      commands.push({
        name,
        description: parsed.description || `Custom command from ${file}`,
        prompt: parsed.content,
        filePath,
      });
    } catch {
      // Skip unreadable files
    }
  }

  return commands;
}
