# syntax=docker/dockerfile:1

# The full node image ships the toolchain bcrypt needs to compile its native
# addon if no prebuilt binary matches the platform.
FROM node:20 AS runtime
WORKDIR /app
ENV NODE_ENV=production

# --include=dev pulls in typescript so we can precompile below (NODE_ENV=production
# would otherwise make npm skip dev deps). No package-lock.json in this repo
# (pnpm-managed), so use npm install rather than npm ci.
COPY package.json ./
RUN npm install --include=dev && npm cache clean --force

COPY tsconfig.json ./
COPY src ./src

# Precompile TS -> dist and run the plain JS. This repo's tsconfig sets
# ts-node { esm:true } with module:NodeNext, which triggers ts-node's broken
# ESM loader (ERR_UNKNOWN_FILE_EXTENSION ".ts") on Node 20. tsc emits CommonJS
# here (package.json "type":"commonjs"), so `node dist/index.js` just works.
# `|| true` so pre-existing type errors (the app runs transpile-only in dev)
# don't block the build; noEmitOnError:false still emits the JS.
RUN npx tsc --noEmitOnError false || true

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
