# Sonic Pi MCP
[![smithery badge](https://smithery.ai/badge/@abhishekjairath/sonic-pi-mcp)](https://smithery.ai/server/@abhishekjairath/sonic-pi-mcp)

A Model Context Protocol (MCP) server that allows AI assistants to interact with Sonic Pi through OSC messages. This enables AI tools like Claude and Cursor to create music and control Sonic Pi programmatically.

## Features

- Play individual notes with customizable synth parameters
- Execute arbitrary Sonic Pi code
- Works with any MCP-compatible client (Claude Desktop, Cursor, etc.)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Sonic Pi](https://sonic-pi.net/) (v4.0 or higher)
- An MCP-compatible client (Cursor, Claude Desktop, etc.)

## Sonic Pi Configuration

Before using the MCP server, you need to add the following code to your Sonic Pi buffer. This code handles the OSC messages sent by the server:

```ruby
# Required Sonic Pi configuration
# Add this to a buffer in Sonic Pi and run it

live_loop :code_runner do
  use_real_time
  code = sync "/osc*/run-code"
  
  # Since we receive the code as a string, we can use eval to execute it
  # The code comes as the first element of the message
  begin
    eval(code[0].to_s)
  rescue Exception => e
    puts "Error executing code: #{e.message}"
  end
end

```

Make sure this code is running in Sonic Pi before using the MCP server.


## Integration with Clients

#### Cursor

Add to `~/.cursor/mcpServers.json`:
```json
{
  "mcpServers": {
    "sonic_pi_mcp": {
      "name": "Sonic Pi MCP",
      "command": "npx",
      "args": ["-y", "sonic-pi-mcp", "start"],
      "transport": {
        "type": "stdio"
      }
    }
  }
}
```

#### Claude Desktop

Add to Claude's MCP configuration:
```json
{
  "mcpServers": {
    "sonic_pi_mcp": {
      "command": "npx",
      "args": ["-y", "sonic-pi-mcp", "start"]
    }
  }
}
```

## Available Tools

### play_note

Plays a single note with customizable parameters.

Parameters:
- `note` (required): MIDI note number (0-127)
- `synth` (optional): Synth to use (e.g., ":saw", ":beep", ":prophet")
- `sustain` (optional): Note duration in seconds (default: 1)
- `cutoff` (optional): Filter cutoff frequency (default: 100)

Example:
```typescript
// Play middle C with saw wave synth
{
  "name": "play_note",
  "parameters": {
    "note": 60,
    "synth": ":saw",
    "sustain": 0.5,
    "cutoff": 80
  }
}
```

### run_code

Executes arbitrary Sonic Pi code.

Parameters:
- `code` (required): Sonic Pi code to execute

Example:
```typescript
{
  "name": "run_code",
  "parameters": {
    "code": "use_synth :prophet\nplay_pattern_timed [60, 64, 67], [0.5]"
  }
}
```

## Example Usage

Here are some example interactions using the MCP tools:

### Simple Melody
```typescript
// Play a C major arpeggio
{
  "code": `
    use_synth :piano
    play_pattern_timed [60, 64, 67, 72], [0.25], release: 0.1
  `
}
```

### Complex Pattern
```typescript
// Create a rhythmic pattern
{
  "code": `
    live_loop :rhythm do
      use_synth :tb303
      play choose(chord(:C3, :minor)), release: 0.2, cutoff: rrand(60, 120)
      sleep 0.25
    end
  `
}
```

## Troubleshooting

1. **No Sound**
   - Ensure Sonic Pi is running
   - Check that the OSC handler code is running in Sonic Pi
   - Verify Sonic Pi is listening on port 4560 (default)

2. **Connection Errors**
   - Check if another instance of the server is running
   - Restart Sonic Pi
   - Ensure no other applications are using port 4560

3. **Code Execution Errors**
   - Check the Sonic Pi log window for error messages
   - Verify the syntax of your Sonic Pi code
   - Ensure all required synths and samples are available

## Development

```bash
# Clone the repository
git clone https://github.com/abhishekjairath/sonic-pi-mcp.git
cd sonic-pi-mcp

# Install dependencies
npm install

# Build
npm run build

# Install MCP Inspector globally (for testing)
npm install -g @modelcontextprotocol/inspector

# Start Sonic Pi and run the OSC handler code (see Sonic Pi Configuration section)

# Start the server in one terminal
npm run dev

# In another terminal, start the MCP Inspector
mcp-inspector
```

### Testing with MCP Inspector

1. Open your browser and navigate to http://localhost:3000
2. In the MCP Inspector UI, configure the connection:
   - Command: `node`
   - Arguments: `dist/server.mjs`
   - Working Directory: `/path/to/your/sonic-pi-mcp` (use your actual project path)
   - Transport Type: stdio

3. Test the `play_note` tool:
```json
{
  "name": "play_note",
  "parameters": {
    "note": 60,
    "synth": ":beep",
    "sustain": 0.5
  }
}
```

4. Test the `run_code` tool:
```json
{
  "name": "run_code",
  "parameters": {
    "code": "use_synth :prophet\nplay_pattern_timed scale(:c4, :major), [0.25]"
  }
}
```

5. Check the Sonic Pi log window for any error messages or output

### Troubleshooting Development Issues

1. **Build Errors**
   - Run `npm run build` and check for TypeScript errors
   - Ensure all dependencies are installed correctly
   - Check `tsconfig.json` for proper configuration

2. **MCP Inspector Connection Issues**
   - Verify the server is running (`npm run dev`)
   - Check that the working directory path is correct
   - Ensure no other instances of the server are running

3. **OSC Communication Issues**
   - Confirm Sonic Pi is running and the OSC handler code is active
   - Check the server logs for connection errors
   - Verify port 4560 is available and not blocked

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 