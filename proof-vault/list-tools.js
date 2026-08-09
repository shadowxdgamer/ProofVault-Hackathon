import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@gravvfi/mcp"],
    env: { ...process.env, GRAVV_API_KEY: "dummy_key_for_inspection" }
  });

  const client = new Client({
    name: "gravvfi-mcp-client",
    version: "1.0.0"
  }, {
    capabilities: { tools: {} }
  });

  await client.connect(transport);
  
  const tools = await client.listTools();
  console.log(JSON.stringify(tools, null, 2));
  
  process.exit(0);
}

main().catch(console.error);
