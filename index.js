#!/usr/bin/env node
import { io } from 'socket.io-client';

const config = {
  masterclawUrl: process.env.MASTERCLAW_URL || 'http://localhost:3001',
  agentName: process.env.AGENT_NAME || 'OpenClaw Agent'
};

console.log('🦞 MasterClaw Chat Skill Starting...');
console.log(`Agent: ${config.agentName}`);
console.log(`Target: ${config.masterclawUrl}\n`);

let socketUrl = config.masterclawUrl;
if (socketUrl.startsWith('ws://')) socketUrl = socketUrl.replace('ws://', 'http://');
if (socketUrl.startsWith('wss://')) socketUrl = socketUrl.replace('wss://', 'https://');

const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  path: '/socket.io',
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 5000,
  withCredentials: true
});

socket.on('connect', () => {
  console.log('✅ Connected! Socket ID:', socket.id);
  
  // Register skill
  const skill = {
    name: config.agentName,
    description: 'OpenClaw AI agent for chat',
    trigger: 'chat',
    parameters: [{ name: 'message', type: 'string', required: true }],
    socketId: socket.id
  };
  
  console.log('📡 Registering skill...');
  socket.emit('skill:register', skill);
  console.log('✅ Skill registration sent');
  console.log('💬 Ready for messages!');
  console.log('Press Ctrl+C to exit\n');
});

socket.on('skill:registered', (skill) => {
  console.log('✅ Confirmed: Skill registered as', skill.trigger);
});

socket.on('chat:message', (data) => {
  const { message, conversationId, timestamp } = data;
  console.log(`\n📨 [${new Date(timestamp).toLocaleTimeString()}] User: ${message}`);
  
  // Simple echo response
  const response = {
    type: 'assistant',
    content: `🤖 OpenClaw received: "${message}"`,
    agent: config.agentName,
    conversationId,
    timestamp: Date.now()
  };
  
  socket.emit('chat:response', response);
  console.log('📤 Response sent');
});

socket.on('connect_error', (err) => {
  console.log('❌ Connection error:', err.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Keep alive
setInterval(() => {
  if (socket.connected) {
    socket.emit('ping');
  }
}, 30000);

console.log('🔗 Connecting...');
