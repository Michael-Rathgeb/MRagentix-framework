import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface Skill {
  name: string;
  description: string;
  content: string;
  source: string;
}

/**
 * Get the path to the bundled defaults/skills directory shipped with the package.
 */
function getBundledSkillsDir(): string {
  // From src/core/skills.ts → ../../defaults/skills
  return path.resolve(__dirname, "..", "..", "defaults", "skills");
}

/**
 * Seed bundled default skills into the global skills directory.
 * Only copies files that don't already exist (won't overwrite user customizations).
 */
export async function seedDefaultSkills(globalSkillsDir: string): Promise<void> {
  const bundledDir = getBundledSkillsDir();
  let bundledFiles: string[];
  try {
    bundledFiles = await fs.readdir(bundledDir);
  } catch {
    return; // No bundled defaults available
  }

  await fs.mkdir(globalSkillsDir, { recursive: true });

  for (const file of bundledFiles) {
    if (!file.endsWith(".md")) continue;
    const destPath = path.join(globalSkillsDir, file);
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
 * Discover skills from bundled defaults, global, and project-local skill directories.
 * Priority: project > global > bundled (later entries with the same name win).
 */
export async function discoverSkills(options: {
  globalSkillsDir: string;
  projectDir?: string;
}): Promise<Skill[]> {
  const skillMap = new Map<string, Skill>();

  // 1. Bundled default skills (shipped with the package)
  const bundledDir = getBundledSkillsDir();
  const bundledSkills = await loadSkillsFromDir(bundledDir, "bundled");
  for (const s of bundledSkills) skillMap.set(s.name, s);

  // 2. Global skills: ~/.mragentix/skills/*.md (override bundled)
  const globalSkills = await loadSkillsFromDir(options.globalSkillsDir, "global");
  for (const s of globalSkills) skillMap.set(s.name, s);

  // 3. Project skills: {cwd}/.mragentix/skills/*.md (override global)
  if (options.projectDir) {
    const projectSkillsDir = path.join(options.projectDir, ".mragentix", "skills");
    const projectSkills = await loadSkillsFromDir(projectSkillsDir, "project");
    for (const s of projectSkills) skillMap.set(s.name, s);
  }

  return Array.from(skillMap.values());
}

async function loadSkillsFromDir(dir: string, source: string): Promise<Skill[]> {
  const skills: Skill[] = [];

  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return skills;
  }

  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const filePath = path.join(dir, file);

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const skill = parseSkillFile(content, source);
      if (!skill.name) {
        skill.name = path.basename(file, ".md");
      }
      skills.push(skill);
    } catch {
      // Skip unreadable files
    }
  }

  return skills;
}

/**
 * Parse a skill file with optional frontmatter.
 * Supports simple key: value frontmatter between --- delimiters.
 */
export function parseSkillFile(raw: string, source: string): Skill {
  let name = "";
  let description = "";
  let content = raw;

  // Check for frontmatter
  if (raw.startsWith("---")) {
    const endIndex = raw.indexOf("---", 3);
    if (endIndex !== -1) {
      const frontmatter = raw.slice(3, endIndex).trim();
      content = raw.slice(endIndex + 3).trim();

      for (const line of frontmatter.split("\n")) {
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) continue;
        const key = line.slice(0, colonIndex).trim().toLowerCase();
        const value = line.slice(colonIndex + 1).trim();
        if (key === "name") name = value;
        else if (key === "description") description = value;
      }
    }
  }

  return { name, description, content, source };
}

/**
 * Format skills as a summary list for the system prompt.
 * Only includes names and descriptions — full content is loaded on-demand via the skill tool.
 */
export function formatSkillsForPrompt(skills: Skill[]): string {
  if (skills.length === 0) return "";

  const list = skills
    .map((s) => `- **${s.name}**${s.description ? `: ${s.description}` : ""}`)
    .join("\n");

  return (
    `## Skills\n\n` +
    `The following skills are available. Use the **skill** tool to invoke a skill when needed:\n\n` +
    list
  );
}
