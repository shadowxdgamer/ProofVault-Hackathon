import express from 'express';
import cors from 'cors';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const app = express();
app.use(cors());
app.use(express.json());

let mcpClient = null;

async function getMcpClient() {
  if (mcpClient) return mcpClient;

  // Use the API key if provided by the user in their environment
  const apiKey = process.env.GRAVV_API_KEY || 'grvSec_sandbox_c74b3cbf5a00457693226a839221fc0fc74b3cbf5a00akVTbp';

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@gravvfi/mcp"],
    env: { ...process.env, GRAVV_API_KEY: apiKey }
  });

  const client = new Client({
    name: "proof-vault-backend",
    version: "1.0.0"
  }, {
    capabilities: { tools: {} }
  });

  await client.connect(transport);
  mcpClient = client;
  return mcpClient;
}

app.post('/api/gravv/vault', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // In a real scenario, we would use the exact tool name provided by the MCP.
    // For this demonstration, we'll try to find a relevant tool for creating an escrow/vault.
    const client = await getMcpClient();
    const toolsResult = await client.listTools();
    
    // Proceed with the tools
    const tools = toolsResult.tools || [];
    const targetTool = tools.find(t => t.name === 'createPaymentLink');

    if (targetTool) {
      // Get an account
      const accountsRes = await client.callTool({ name: 'listAccounts', arguments: {} });
      const accountsJson = JSON.parse(accountsRes.content[0].text);
      const firstAccount = accountsJson.data?.items?.[0];
      
      const accountId = firstAccount?.id;
      let customerId = firstAccount?.customer_id;

      if (!accountId) {
        throw new Error("Could not find a valid account in the sandbox to attach the payment link to.");
      }

      if (!customerId) {
        const customersRes = await client.callTool({ name: 'listCustomers', arguments: {} });
        const customersJson = JSON.parse(customersRes.content[0].text);
        customerId = customersJson.data?.items?.[0]?.id;
      }

      if (!customerId) {
        throw new Error("Could not find a valid customer in the sandbox.");
      }

      // Call the tool to create a payment link
      const result = await client.callTool({
        name: targetTool.name,
        arguments: {
          payer_name: title || "Startup Pitch Sponsor",
          settlement_account_id: accountId,
          supported_networks: ["polygon"],
          customer_id: customerId
        }
      });
      
      // Extract the returned link_url
      const resultData = JSON.parse(result.content[0].text);
      const linkUrl = resultData.link_url || `http://localhost:5173/vault/generated-via-mcp`;

      return res.json({ 
        success: true, 
        result: result,
        link: linkUrl
      });
    } else {
      // Fallback if tool isn't found
      const randomId = Math.random().toString(36).substring(2, 9);
      return res.json({ 
        success: true, 
        link: `http://localhost:5173/vault/${randomId}`,
        message: "MCP Tool not found, falling back to simulated link."
      });
    }

  } catch (error) {
    console.error("Error creating vault via MCP:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`ProofVault Backend running on port ${PORT}`);
});
