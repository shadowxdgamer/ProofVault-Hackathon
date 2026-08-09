import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const apiKey = "grvSec_sandbox_c74b3cbf5a00457693226a839221fc0fc74b3cbf5a00akVTbp";

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@gravvfi/mcp"],
    env: { ...process.env, GRAVV_API_KEY: apiKey }
  });

  const client = new Client({
    name: "test-client",
    version: "1.0.0"
  }, {
    capabilities: { tools: {} }
  });

  await client.connect(transport);
  
  const custRes = await client.callTool({ name: 'listCustomers', arguments: {} });
  console.log("Customers:");
  console.log(custRes.content[0].text);

  const accRes = await client.callTool({ name: 'listAccounts', arguments: {} });
  console.log("Accounts:");
  console.log(accRes.content[0].text);

  process.exit(0);
}

main().catch(console.error);
