# Sonic Pi MCP

A Model Context Protocol server for Sonic Pi that allows AI assistants to interact with Sonic Pi through a standardized interface.

## Prerequisites

- Node.js 18 or higher
- Sonic Pi running and accepting OSC messages on port 4560
- Cursor IDE with MCP support

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sonic-pi-mcp.git
cd sonic-pi-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Development Mode

To run the server in development mode with hot reloading:

```bash
npm run dev
```

### Production Mode

To run the server in production mode:

```bash
npm run build
npm start
```

### Integration with Cursor

The MCP server configuration is automatically set up in Cursor. The server will be available in the MCP settings under "Sonic Pi MCP".

## Available Tools

### play_note

Plays a single note in Sonic Pi.

Example:
```typescript
{
  "name": "play_note",
  "parameters": {
    "note": 60  // Middle C
  }
}
```

### run_code

Runs arbitrary Sonic Pi code.

Example:
```typescript
{
  "name": "run_code",
  "parameters": {
    "code": "use_synth :saw\nplay 60\nsleep 0.5\nplay 67"
  }
}
```

## Development

### Project Structure

```
sonic-pi-mcp/
├── src/
│   └── server.ts
├── dist/
├── package.json
└── tsconfig.json
```

### Testing

Run the test suite:

```bash
npm test
```

### Linting

Check code style:

```bash
npm run lint
```

## Troubleshooting

1. **Connection Issues**: Ensure Sonic Pi is running and accepting OSC messages on port 4560.
2. **Module Errors**: Run `npm install` to ensure all dependencies are installed.
3. **TypeScript Errors**: Make sure you have built the project using `npm run build`.

## License

MIT 