FROM oven/bun:1.1.38 AS base
WORKDIR /app

COPY package.json bunfig.toml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN bun install

COPY apps/web apps/web
COPY packages/shared packages/shared

EXPOSE 3000
CMD ["bun", "--filter", "@ndi/web", "dev"]
