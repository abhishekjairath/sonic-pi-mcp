import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "node-osc";
import { z } from "zod";
import {
  getOscCodePath,
  getOscHost,
  getOscPort,
  getOscStopAllPath,
} from "./config.js";
import { DJ_SESSION_GUIDE } from "./dj-session-guide.js";

const SERVER_VERSION = "2.0.0";

function sendCode(client: Client, path: string, code: string): void {
  client.send(path, code);
}

function sendStopAll(client: Client, path: string): void {
  client.send(path);
}

class SonicPiMCPServer {
  private server: McpServer;
  private oscClient: Client;
  private readonly oscCodePath: string;
  private readonly oscStopAllPath: string;

  constructor() {
    const host = getOscHost();
    const port = getOscPort();
    this.oscCodePath = getOscCodePath();
    this.oscStopAllPath = getOscStopAllPath();

    this.server = new McpServer({
      name: "Sonic Pi MCP",
      version: SERVER_VERSION,
    });

    try {
      this.oscClient = new Client(host, port);
    } catch (error) {
      console.error("Failed to initialize OSC client:", error);
      process.exit(1);
    }

    this.registerResources();
    this.registerPrompts();
    this.registerTools();
  }

  private registerResources(): void {
    this.server.resource(
      "dj-session-guide",
      "sonicpi://v2/dj-session",
      {
        description:
          "How to run long natural-language DJ sets with Sonic Pi: session arc, naming live_loops, vocabulary, and tools.",
        mimeType: "text/markdown",
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: DJ_SESSION_GUIDE,
          },
        ],
      }),
    );
  }

  private registerPrompts(): void {
    this.server.prompt(
      "next_performance_segment",
      "Frame the next Sonic Pi code block for a long NL DJ session (taste, arc, transitions).",
      {
        user_intent: z
          .string()
          .describe(
            "What the user asked for in natural language (genre, tempo, energy, change).",
          ),
        section_hint: z
          .string()
          .optional()
          .describe(
            "Optional: e.g. warm-up, build, peak, cooldown, bridge, or genre transition.",
          ),
      },
      async (args) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: [
                "Read resource sonicpi://v2/dj-session if available.",
                "",
                `User intent: ${args.user_intent}`,
                args.section_hint ? `Section hint: ${args.section_hint}` : "",
                "",
                "Respond with valid Sonic Pi Ruby for the next segment, then call queue_segment with that code.",
              ]
                .filter(Boolean)
                .join("\n"),
            },
          },
        ],
      }),
    );
  }

  private registerTools(): void {
    const codeSchema = {
      code: z
        .string()
        .describe(
          "Full Sonic Pi (Ruby) source for the next segment. Use named live_loops; prefer use_bpm when tempo matters.",
        ),
    };

    const playSchema = {
      note: z.number().min(0).max(127).describe("MIDI note number (0-127)"),
      synth: z
        .string()
        .optional()
        .describe("Synth name (e.g. :beep, :saw, :prophet)"),
      sustain: z.number().optional().describe("Note length in seconds"),
      cutoff: z.number().optional().describe("Filter cutoff frequency"),
    };

    this.server.tool(
      "queue_segment",
      "Push the next music segment to Sonic Pi. Use with the v2 DJ session runner for crossfaded handoffs. Prefer this over ad-hoc snippets for long sets.",
      codeSchema,
      async ({ code }) => {
        await this.sendCodeAsync(code);
        return {
          content: [
            {
              type: "text",
              text: "Segment queued to Sonic Pi (OSC).",
            },
          ],
        };
      },
    );

    this.server.tool(
      "run_code",
      "Alias of queue_segment for compatibility. Sends Sonic Pi code over OSC to the session runner.",
      codeSchema,
      async ({ code }) => {
        await this.sendCodeAsync(code);
        return {
          content: [
            {
              type: "text",
              text: "Code sent to Sonic Pi (OSC).",
            },
          ],
        };
      },
    );

    this.server.tool(
      "stop_all",
      "Hard stop: stop all running Sonic Pi jobs (like the Stop button). Use sparingly; prefer queue_segment for musical transitions.",
      {},
      async () => {
        await this.sendStopAllAsync();
        return {
          content: [
            {
              type: "text",
              text: "Sent stop-all OSC to Sonic Pi.",
            },
          ],
        };
      },
    );

    this.server.tool(
      "play_note",
      "Play a single test note (quick sanity check). Not for full DJ segments—use queue_segment for those.",
      playSchema,
      async ({ note, synth = ":beep", sustain = 1, cutoff = 100 }) => {
        const snippet = `
use_synth ${synth}
play ${note}, sustain: ${sustain}, cutoff: ${cutoff}
`;
        await this.sendCodeAsync(snippet);
        return {
          content: [
            {
              type: "text",
              text: `Playing note ${note} with ${synth} (sustain ${sustain}s, cutoff ${cutoff}).`,
            },
          ],
        };
      },
    );
  }

  private sendCodeAsync(code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        sendCode(this.oscClient, this.oscCodePath, code);
        resolve();
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  private sendStopAllAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        sendStopAll(this.oscClient, this.oscStopAllPath);
        resolve();
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(
      `Sonic Pi MCP v${SERVER_VERSION} (OSC ${getOscHost()}:${getOscPort()} code:${this.oscCodePath})`,
    );
  }
}

process.on("SIGINT", () => {
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});

const server = new SonicPiMCPServer();

(async () => {
  try {
    await server.start();
  } catch (error) {
    console.error("Failed to start MCP server (stdio):", error);
    process.exit(1);
  }
})();
