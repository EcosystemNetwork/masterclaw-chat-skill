# MasterClaw Chat Skill

Connect any OpenClaw agent to MasterClawInterface dashboard via Socket.IO.

## Quick Start

### 1. Start MasterClawInterface Backend

On your Oracle LFG instance (147.224.9.9):

```bash
ssh opc@147.224.9.9
cd ~/MasterClawInterface/backend
npm start
```

Backend runs on `http://147.224.9.9:3001`

### 2. Deploy Frontend to Vercel

The frontend needs to point to your Oracle backend:

```bash
# On Oracle instance
cd ~/MasterClawInterface/frontend
echo 'NEXT_PUBLIC_GATEWAY_URL=http://147.224.9.9:3001' > .env.production.local
npm run build

# Deploy to Vercel (from your local machine)
vercel --prod
```

### 3. Start This Chat Skill

```bash
# On Oracle instance
ssh opc@147.224.9.9
cd ~/masterclaw-chat-skill
export MASTERCLAW_URL='http://localhost:3001'
node index.js
```

Or use the Railway backend (if preferred):
```bash
export MASTERCLAW_URL='wss://web-production-e0d96.up.railway.app'
node index.js
```

### 4. Open Dashboard

Go to: https://masterclaw-interface.vercel.app/dashboard

Type a message in the chat box - it will route to your OpenClaw agent!

---

## How It Works

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Vercel Frontend │──────▶│  Oracle Backend  │◀─────│  OpenClaw Agent │
│  (React/Next.js) │      │  (Express/Socket)│      │  (This Skill)   │
└─────────────────┘      └──────────────────┘      └─────────────────┘
        │                                                    │
        │              Socket.IO 'chat:message'              │
        │◀───────────────────────────────────────────────────│
        │                                                    │
        │              Socket.IO 'chat:response'             │
        │───────────────────────────────────────────────────▶│
```

1. User types message in Vercel dashboard
2. Frontend sends to Oracle backend via Socket.IO
3. Backend routes to registered 'chat' skill (this agent)
4. Agent processes message and sends response
5. Response appears in dashboard

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MASTERCLAW_URL` | Backend URL | `wss://web-production-e0d96.up.railway.app` |
| `MASTERCLAW_FALLBACK_URL` | Fallback backend | `ws://147.224.9.9:3001` |
| `AGENT_NAME` | Display name | `OpenClaw Agent` |
| `AGENT_ID` | Unique ID | Auto-generated |

### Integrating Your OpenClaw Agent

Replace the `generateResponse()` method in `index.js` with your actual OpenClaw logic:

```javascript
generateResponse(userMessage) {
  // TODO: Replace with your OpenClaw agent integration
  // Example:
  // const response = await openclawAgent.chat(userMessage);
  // return response;
  
  return `OpenClaw received: ${userMessage}`;
}
```

---

## Troubleshooting

### "No agent connected" in dashboard
- Check skill is running: `ps aux | grep masterclaw-chat`
- Verify backend is running: `curl http://147.224.9.9:3001/health`
- Check skill logs: `tail -f /tmp/masterclaw-chat.log`

### CORS errors
- Backend CORS is pre-configured for Vercel domains
- Add your domain to `backend/src/index.js` ALLOWED_ORIGINS if needed

### Connection timeout
- Use `http://localhost:3001` when running skill on same server as backend
- Use `http://147.224.9.9:3001` when running skill remotely

---

## Architecture

This skill implements the **Federated Skill Pattern**:
- Registers as a 'chat' skill provider via Socket.IO
- Receives messages from MasterClawInterface backend
- Processes via OpenClaw agent
- Returns responses to dashboard

No API tokens or credentials stored - agents connect inbound.

---

## Files

- `index.js` - Main skill implementation
- `skill.json` - Skill metadata
- `package.json` - Dependencies

---

Built for Rex Deus by Deciple1 🜁
