import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const apiKey = "grvSec_sandbox_c74b3cbf5a00457693226a839221fc0fc74b3cbf5a00akVTbp";

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@gravvfi/mcp"],
    env: { ...process.env, GRAVV_API_KEY: apiKey }
  });

  const client = new Client({ name: "test", version: "1" }, { capabilities: { tools: {} } });
  await client.connect(transport);
  
  const accRes = await client.callTool({ name: 'listAccounts', arguments: {} });
  const accountId = JSON.parse(accRes.content[0].text).data.items[0].id;
  const customerId = JSON.parse(accRes.content[0].text).data.items[0].customer_id;

  const result = await client.callTool({
    name: 'createPaymentLink',
    arguments: {
      payer_name: "Startup Pitch Sponsor",
      settlement_account_id: accountId,
      supported_networks: ["polygon"],
      customer_id: customerId
    }
  });
  console.log(JSON.stringify(JSON.parse(result.content[0].text), null, 2));
  process.exit(0);
}

main().catch(console.error);
