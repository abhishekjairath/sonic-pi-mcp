# Optional: run MCP in a container with host networking so OSC reaches Sonic Pi on the host.
FROM oven/bun:latest AS builder
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/bin ./bin
COPY sonic-pi-queue.rb README.md LICENSE ./
CMD ["node", "bin/cli.mjs"]
