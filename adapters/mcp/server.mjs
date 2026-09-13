import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.mjs";

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== "--workspace") {
  console.error("Usage: node adapters/mcp/server.mjs --workspace /absolute/project/path");
  process.exit(1);
}

try {
  const server = new McpServer({ name: "learn", version: "1.0.0" });
  await registerTools(server, args[1]);
  await server.connect(new StdioServerTransport());
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
