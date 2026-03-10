import type { Provider } from "@kenkaiiii/gg-ai";
import type { MCPServerConfig } from "./types.js";

export const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [
  { name: "grep", url: "https://mcp.grep.app" },
];

/**
 * Get MCP servers for a specific provider.
 * GLM models get the Z.ai vision MCP server for image support.
 */
export function getMCPServers(provider: Provider, apiKey?: string): MCPServerConfig[] {
  const servers = [...DEFAULT_MCP_SERVERS];

  if (provider === "glm" && apiKey) {
    servers.push({
      name: "zai_vision",
      command: "npx",
      args: ["-y", "@z_ai/mcp-server"],
      env: {
        Z_AI_API_KEY: apiKey,
        Z_AI_MODE: "ZAI",
      },
      timeout: 60_000,
    });
  }

  return servers;
}
