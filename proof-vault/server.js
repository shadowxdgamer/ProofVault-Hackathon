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
  const apiKey = process.env.GRAVV_API_KEY || '';

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
    
    // Fallback if the user hasn't set their GRAVV_API_KEY, the MCP will only return doc tools.
    if (!process.env.GRAVV_API_KEY) {
      console.warn("No GRAVV_API_KEY provided. Returning simulated payment link.");
      const randomId = Math.random().toString(36).substring(2, 9);
      return res.json({ 
        success: true, 
        link: `https://pay.gravv.fi/vault/simulated-${randomId}`,
        message: "Simulated due to missing GRAVV_API_KEY"
      });
    }

    // Try to find the escrow or vault creation tool
    const tools = toolsResult.tools || [];
    const targetTool = tools.find(t => 
      t.name.toLowerCase().includes('escrow') || 
      t.name.toLowerCase().includes('vault') ||
      t.name.toLowerCase().includes('create')
    );

    if (targetTool) {
      // Call the tool with sensible defaults based on the pitch
      const result = await client.callTool({
        name: targetTool.name,
        arguments: {
          project_title: title,
          description: description,
          amount: 500, // Example funding goal
          currency: "USDC"
        }
      });
      
      return res.json({ 
        success: true, 
        result: result,
        link: `https://pay.gravv.fi/vault/generated-via-mcp`
      });
    } else {
      // Fallback if tool isn't found
      const randomId = Math.random().toString(36).substring(2, 9);
      return res.json({ 
        success: true, 
        link: `https://pay.gravv.fi/vault/${randomId}`,
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
