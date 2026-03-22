#!/usr/bin/env node
/**
 * CLI entry for npm: runs the bundled MCP server in-process so stdio stays connected.
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, "..", "dist", "server.mjs");

await import(pathToFileURL(serverPath).href);
