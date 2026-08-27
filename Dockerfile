# syntax=docker/dockerfile:1

# auth-service starts via ts-node (see package.json "start"), so there is no
# separate build step. The full node image ships the toolchain bcrypt needs
# to compile its native addon if no prebuilt binary matches the platform.
FROM node:20 AS runtime
WORKDIR /app
ENV NODE_ENV=production

# No package-lock.json in this repo (pnpm-managed), so use npm install. Dev
# deps are required at runtime because "start" runs the TypeScript directly
# through ts-node.
# --include=dev because "start" runs via ts-node (a devDependency) and
# NODE_ENV=production would otherwise make npm skip dev deps.
COPY package.json ./
RUN npm install --include=dev && npm cache clean --force

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]
