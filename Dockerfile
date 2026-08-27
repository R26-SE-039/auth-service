FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

# Compile TypeScript to JavaScript in dist/
RUN npx tsc

EXPOSE 3001

CMD ["node", "dist/index.js"]
