# MasterClaw Chat Skill

Connect any OpenClaw agent to MasterClawInterface dashboard via Socket.IO.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start the Skill

```bash
npm start
```

Or with environment variable:
```bash
MASTERCLAW_URL=https://web-production-e0d96.up.railway.app npm start
```

## Configuration

Create a `.env` file:

```env
MASTERCLAW_URL=https://web-production-e0d96.up.railway.app
AGENT_NAME=OpenClaw Agent
```

| Variable | Description | Default |
|----------|-------------|---------|
| `MASTERCLAW_URL` | MasterClawInterface backend URL | `http://localhost:3001` |
| `AGENT_NAME` | Display name for the agent | `OpenClaw Agent` |

## How It Works

```
┌─────────────────┐      Socket.IO       ┌──────────────────┐
│  Vercel Frontend │◄───────────────────►│  Railway Backend  │
│  (Dashboard)     │                     │  (Express API)    │
└─────────────────┘                     └──────────────────┘
                                                ▲
                                                │ Socket.IO
                                                │
                                         ┌──────────────────┐
│  Chat Skill      │
│  (This Agent)    │
└──────────────────┘
```

## Production Deployment

### Using Systemd (Linux)

1. Copy the service file:
```bash
sudo cp masterclaw-chat.service /etc/systemd/system/
sudo systemctl daemon-reload
```

2. Edit the service file with your paths:
```bash
sudo nano /etc/systemd/system/masterclaw-chat.service
```

3. Enable and start:
```bash
sudo systemctl enable masterclaw-chat
sudo systemctl start masterclaw-chat
sudo systemctl status masterclaw-chat
```

### Using PM2

```bash
npm install -g pm2
pm2 start index.js --name masterclaw-chat
pm2 save
pm2 startup
```

### Using Docker

```bash
docker build -t masterclaw-chat .
docker run -d \
  -e MASTERCLAW_URL=https://web-production-e0d96.up.railway.app \
  --name masterclaw-chat \
  masterclaw-chat
```

## Customizing Responses

Edit the `chat:message` handler in `index.js`:

```javascript
socket.on('chat:message', (data) => {
  const { message, conversationId, timestamp } = data;
  
  // TODO: Replace with your OpenClaw integration
  // Example:
  // const response = await openclawAgent.chat(message);
  
  const response = {
    type: 'assistant',
    content: `🤖 OpenClaw received: "${message}"`,
    agent: config.agentName,
    conversationId,
    timestamp: Date.now()
  };
  
  socket.emit('chat:response', response);
});
```

## Troubleshooting

### "No agent connected" in dashboard
- Check skill is running: `ps aux | grep 'node index.js'`
- Verify backend URL is correct
- Check logs: `tail -f /tmp/chat-skill.log`

### Connection refused
- Ensure MasterClawInterface backend is running
- Check firewall rules
- Verify URL format (http/https, not ws/wss)

### Skill not registering
- Check backend logs for errors
- Ensure `skill:register` event is being sent
- Verify skill object has required fields

## Files

- `index.js` - Main skill implementation
- `skill.json` - Skill metadata
- `package.json` - Dependencies
- `masterclaw-chat.service` - Systemd service file
- `Dockerfile` - Docker build configuration

## License

MIT
