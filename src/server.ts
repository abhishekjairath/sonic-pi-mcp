#!/usr/bin/env bun

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client } from "node-osc";
import { z } from "zod";

// Add type definitions for the parameters
interface PlayNoteParams {
  note: number;
  synth?: string;
  sustain?: number;
  cutoff?: number;
}

interface RunCodeParams {
  code: string;
}

class SonicPiMCPServer {
  private server: McpServer;
  private oscClient: Client;

  constructor() {
    this.server = new McpServer({
      name: "Sonic Pi MCP",
      version: "0.1.0"
    });

    // Initialize OSC client
    try {
      this.oscClient = new Client('127.0.0.1', 4560);
    } catch (error) {
      console.error('Failed to initialize OSC client:', error);
      process.exit(1);
    }

    this.registerTools();
  }

  private registerTools() {
    // Add play_note tool
    this.server.tool(
      "play_note",
      {
        note: z.number().min(0).max(127).describe("MIDI note number (0-127)"),
        synth: z.string().optional().describe("Synth to use (e.g. :saw, :beep, :prophet)"),
        sustain: z.number().optional().describe("Note duration in seconds"),
        cutoff: z.number().optional().describe("Filter cutoff frequency")
      },
      async ({ note, synth = ":beep", sustain = 1, cutoff = 100 }: PlayNoteParams) => {
        try {
          const code = `
            use_synth ${synth}
            play ${note}, sustain: ${sustain}, cutoff: ${cutoff}
          `;
          this.oscClient.send('/run-code', code);
          return {
            content: [{ 
              type: "text", 
              text: `Playing note ${note} with synth ${synth} (sustain: ${sustain}s, cutoff: ${cutoff})`
            }]
          };
        } catch (error) {
          console.error('Error in play_note:', error);
          throw new Error('Failed to play note');
        }
      }
    );

    // Add run_code tool
    this.server.tool(
      "run_code",
      {
        code: z.string().describe("Sonic Pi code to execute")
      },
      async ({ code }: RunCodeParams) => {
        try {
          this.oscClient.send('/run-code', code);
          return {
            content: [{ 
              type: "text", 
              text: "Code executed successfully" 
            }]
          };
        } catch (error) {
          console.error('Error in run_code:', error);
          throw new Error('Failed to execute code');
        }
      }
    );
  }

  async start() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Sonic Pi MCP Server started');
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Start the server
const server = new SonicPiMCPServer();
server.start();