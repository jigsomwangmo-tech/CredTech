FROM oven/bun:1.1.38 AS base
WORKDIR /app

COPY package.json bunfig.toml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN bun install

COPY apps/api apps/api
COPY packages/db packages/db
COPY packages/shared packages/shared

EXPOSE 4000
CMD ["bun", "--filter", "@ndi/api", "start"]
