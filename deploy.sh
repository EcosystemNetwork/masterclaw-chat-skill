#!/bin/bash
# Deploy script for MasterClaw Chat Skill

set -e

echo "🦞 Deploying MasterClaw Chat Skill..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env - please edit it with your settings"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for PM2
if command -v pm2 &> /dev/null; then
    echo "🚀 Starting with PM2..."
    pm2 delete masterclaw-chat 2>/dev/null || true
    pm2 start index.js --name masterclaw-chat
    pm2 save
    echo "✅ Deployed with PM2"
    echo "   View logs: pm2 logs masterclaw-chat"
    echo "   Monitor: pm2 monit"
    
# Check for Docker
elif command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Starting with Docker..."
    docker-compose down 2>/dev/null || true
    docker-compose up -d --build
    echo "✅ Deployed with Docker"
    echo "   View logs: docker-compose logs -f"
    
# Fallback to nohup
else
    echo "📝 Starting with nohup..."
    pkill -f 'node index.js' 2>/dev/null || true
    sleep 1
    nohup node index.js > /tmp/masterclaw-chat.log 2>&1 &
    sleep 2
    echo "✅ Started with nohup"
    echo "   View logs: tail -f /tmp/masterclaw-chat.log"
fi

echo ""
echo "🎉 MasterClaw Chat Skill is running!"
echo "   Backend: https://web-production-e0d96.up.railway.app"
echo "   Dashboard: https://offmarketproperties.xyz/dashboard"
