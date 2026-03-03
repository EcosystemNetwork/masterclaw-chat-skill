FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV MASTERCLAW_URL=https://web-production-e0d96.up.railway.app
ENV AGENT_NAME=OpenClaw Agent

CMD ["node", "index.js"]
