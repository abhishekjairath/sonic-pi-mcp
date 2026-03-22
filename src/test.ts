import { Client } from "node-osc";
import { getOscCodePath, getOscHost, getOscPort } from "./config.ts";

const host = getOscHost();
const port = getOscPort();
const codePath = getOscCodePath();

async function testConnection(): Promise<void> {
  console.error(`Testing OSC to Sonic Pi at ${host}:${port} (${codePath})`);

  const client = new Client(host, port);

  const testCode = `
print "sonic-pi-mcp test"
use_synth :beep
play 60
sleep 0.5
play 64
`;

  try {
    client.send(codePath, testCode);
    console.error("OSC message sent.");
    await new Promise((r) => setTimeout(r, 1500));
    client.close();
    console.error("Done.");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

void testConnection();
