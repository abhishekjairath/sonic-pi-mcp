#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, '..', 'dist', 'server.mjs');

const args = process.argv.slice(2);
const command = args[0] || 'start';

switch (command) {
  case 'start':
    spawn('node', [serverPath], { stdio: 'inherit' });
    break;
  
  case 'dev':
    // For development with inspector
    spawn('node', [serverPath, '--dev'], { stdio: 'inherit' });
    break;

  default:
    console.log(`
Usage: sonic-pi-mcp <command>

Commands:
  start     Start the MCP server (default)
  dev       Start in development mode with inspector

For use with Cursor:
Add to mcpServers.json:
{
  "mcpServers": {
    "sonic_pi_mcp": {
      "name": "Sonic Pi MCP",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/sonic-pi", "start"],
      "transport": {
        "type": "stdio"
      }
    }
  }
}

For use with Claude Desktop:
Run: npx @modelcontextprotocol/sonic-pi start
    `);
} 