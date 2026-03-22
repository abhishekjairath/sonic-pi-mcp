# Sonic Pi MCP

Model Context Protocol (MCP) server for **[Sonic Pi](https://sonic-pi.net/)**. Describe music in natural language in your LLM client; the model generates Sonic Pi code and this server sends it over **OSC**. Use the included **queue runner** in Sonic Pi for crossfades between segments.

## Features

- **`queue_segment`** — send the next full musical segment (named `live_loop`s, `use_bpm`, etc.).
- **`run_code`** — same as `queue_segment` (compatibility).
- **`stop_all`** — hard stop via OSC (`/stop-all-jobs`), like Sonic Pi’s Stop.
- **`play_note`** — quick test note.
- **Resource** — DJ session craft, vocabulary, and tool usage (read from the MCP client).
- **Prompt** `next_performance_segment` — help frame the next block for longer sets.
- **Env** — `OSC_HOST`, `OSC_PORT`, `OSC_CODE_PATH`, `OSC_STOP_ALL_PATH`.

## Prerequisites

- [Sonic Pi](https://sonic-pi.net/) v4.x  
- [Node.js](https://nodejs.org/) 18+ (`npx` / `node`)  
- An MCP-capable client (Cursor, Claude Desktop, VS Code with MCP, etc.)

Optional: [Bun](https://bun.sh) for local development (`bun run dev`).

## One-time Sonic Pi setup (queue runner)

1. Open Sonic Pi.  
2. Copy **[sonic-pi-queue.rb](sonic-pi-queue.rb)** into a buffer.  
3. Press **Run** and leave it running.

The buffer listens on the default OSC port and crossfades between segments sent by the MCP.

## Install the MCP server

```bash
npx -y sonic-pi-mcp
```

Point your client at this command over **stdio** (see below).

### Cursor

Use **`~/.cursor/mcp.json`** and/or **`.cursor/mcp.json`** in a project:

```json
{
  "mcpServers": {
    "sonic_pi_mcp": {
      "command": "npx",
      "args": ["-y", "sonic-pi-mcp"]
    }
  }
}
```

**Local clone** (after `npm install` or `bun install` and `bun run build`):

```json
{
  "mcpServers": {
    "sonic_pi_mcp": {
      "command": "node",
      "args": ["/absolute/path/to/sonic-pi-mcp/bin/cli.mjs"]
    }
  }
}
```

**Bun without building** — some clients ignore `cwd`; use an **absolute** path to `src/server.ts`, or use the launcher:

```json
{
  "mcpServers": {
    "sonic_pi_mcp": {
      "command": "/absolute/path/to/sonic-pi-mcp/bin/mcp-dev.sh",
      "args": []
    }
  }
}
```

Run `chmod +x bin/mcp-dev.sh` once. The script changes into the repo and runs `bun run src/server.ts`.

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (paths differ on Windows):

```json
{
  "mcpServers": {
    "sonic_pi_mcp": {
      "command": "npx",
      "args": ["-y", "sonic-pi-mcp"]
    }
  }
}
```

For a **local clone**, prefer **`bin/mcp-dev.sh`** (see above) if you see `Module not found "src/server.ts"` or **`spawn bunx ENOENT`**. Remove and re-add the MCP in the app if an old definition is cached.

### VS Code

Configure your MCP extension to run `npx` with `-y` and `sonic-pi-mcp`, **stdio** transport, per the extension’s docs.

## Environment variables

| Variable | Default | Meaning |
| -------- | ------- | ------- |
| `OSC_HOST` | `127.0.0.1` | Sonic Pi host |
| `OSC_PORT` | `4560` | Sonic Pi OSC port |
| `OSC_CODE_PATH` | `/run-code` | OSC path for code (must match your Sonic Pi buffer) |
| `OSC_STOP_ALL_PATH` | `/stop-all-jobs` | Hard stop path |

Allow **incoming OSC** in Sonic Pi if you connect from another machine; set `OSC_HOST` accordingly.

## Development

```bash
git clone https://github.com/abhishekjairath/sonic-pi-mcp.git
cd sonic-pi-mcp
bun install   # or npm install
bun run build
bun run dev
```

OSC smoke test (Sonic Pi + runner running):

```bash
bun run test
```

### MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

Use `node` with argument `bin/cli.mjs` and this directory as the working directory (after `bun run build`).

## Troubleshooting

- **No sound** — Sonic Pi open? Queue buffer running? Port **4560** reachable?  
- **Nothing happens** — OSC enabled in Sonic Pi; `OSC_HOST` / `OSC_PORT` match.  
- **Layers pile up** — Use **`queue_segment`** with **named** `live_loop`s; use **`stop_all`** only for a full reset.  
- **`Module not found "src/server.ts"` (Claude)** — Use **`bin/mcp-dev.sh`** as `command` with empty `args`, or absolute paths; don’t rely on `cwd` alone.  
- **`resources/list` / `prompts/list` → Method not found** — You’re on an older build that only exposed tools. Reinstall/restart the MCP from this repo or npm so resources and prompts are registered.  
- **Ruby errors in Sonic Pi log** — The generated code failed to parse or run; fix the snippet (brackets, samples, syntax) and send again. The queue runner prints a code snippet on failure.

## License

MIT — see [LICENSE](LICENSE).
