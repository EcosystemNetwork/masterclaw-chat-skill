#!/usr/bin/env node
/**
 * MasterClaw Chat Skill
 * Connects OpenClaw agent to MasterClawInterface dashboard
 */

import { io } from 'socket.io-client';
import readline from 'readline';

const config = {
  masterclawUrl: process.env.MASTERCLAW_URL || 'wss://web-production-e0d96.up.railway.app',
  fallbackUrl: process.env.MASTERCLAW_FALLBACK_URL || 'ws://147.224.9.9:3001',
  agentName: process.env.AGENT_NAME || 'OpenClaw Agent',
  agentId: process.env.AGENT_ID || `oc-${Date.now()}`,
  autoReconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10
};

class MasterClawChatSkill {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.currentConversation = [];
    this.rl = null;
  }

  async start() {
    console.log('🦞 MasterClaw Chat Skill Starting...');
    console.log(`Agent: ${config.agentName} (${config.agentId})`);
    console.log(`Target: ${config.masterclawUrl}`);
    console.log('');

    // Try primary URL first, then fallback
    await this.connect(config.masterclawUrl);
    
    if (!this.isConnected && config.fallbackUrl) {
      console.log('⚠️  Primary failed, trying fallback...');
      await this.connect(config.fallbackUrl);
    }

    if (!this.isConnected) {
      console.error('❌ Could not connect to MasterClawInterface');
      process.exit(1);
    }

    // Start CLI for local interaction
    this.startCLI();
  }

  connect(url) {
    return new Promise((resolve) => {
      console.log(`🔗 Connecting to ${url}...`);

      // Normalize URL for Socket.IO
      let socketUrl = url;
      if (url.startsWith('ws://')) {
        socketUrl = url.replace('ws://', 'http://');
      } else if (url.startsWith('wss://')) {
        socketUrl = url.replace('wss://', 'https://');
      }

      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        path: '/socket.io',
        reconnection: config.autoReconnect,
        reconnectionAttempts: config.maxReconnectAttempts,
        reconnectionDelay: config.reconnectInterval,
        withCredentials: true,
        auth: {
          sessionId: config.agentId,
          agentName: config.agentName
        }
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to MasterClawInterface');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Register as a chat skill provider
        this.registerSkill();
        resolve(true);
      });

      this.socket.on('connect_error', (err) => {
        console.log(`❌ Connection error: ${err.message}`);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= 3) {
          resolve(false);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`🔌 Disconnected: ${reason}`);
        this.isConnected = false;
      });

      // Handle incoming chat messages from dashboard
      this.socket.on('chat:message', (data) => {
        this.handleChatMessage(data);
      });

      // Handle skill invocation
      this.socket.on('skill:invoke', (data) => {
        this.handleSkillInvoke(data);
      });

      // Timeout fallback
      setTimeout(() => {
        if (!this.isConnected) {
          resolve(false);
        }
      }, 10000);
    });
  }

  registerSkill() {
    const skill = {
      trigger: 'chat',
      name: config.agentName,
      id: config.agentId,
      description: 'OpenClaw agent for MasterClawInterface',
      status: 'active',
      capabilities: ['chat', 'text-generation', 'task-assistance'],
      socketId: this.socket.id
    };

    this.socket.emit('skill:register', skill, (response) => {
      if (response?.success) {
        console.log('✅ Skill registered successfully');
        console.log('💬 Ready to receive messages from dashboard');
        console.log('');
      } else {
        console.error('❌ Skill registration failed:', response?.error);
      }
    });
  }

  handleChatMessage(data) {
    const { message, userId, conversationId, timestamp } = data;
    
    console.log(`\n📨 [${new Date(timestamp).toLocaleTimeString()}] User: ${message}`);
    
    // Store in conversation history
    this.currentConversation.push({
      role: 'user',
      content: message,
      timestamp
    });

    // Here you would integrate with your actual OpenClaw agent logic
    // For now, echo back a response
    const response = this.generateResponse(message);
    
    this.sendResponse(response, conversationId);
  }

  handleSkillInvoke(data) {
    const { skill, action, params, requestId } = data;
    console.log(`🔧 Skill invoked: ${action}`, params);
    
    // Handle different actions
    switch (action) {
      case 'chat':
        this.handleChatMessage({
          message: params.message,
          userId: params.userId,
          conversationId: params.conversationId,
          timestamp: Date.now()
        });
        break;
      
      case 'status':
        this.socket.emit('skill:response', {
          requestId,
          status: 'active',
          agent: config.agentName,
          connected: this.isConnected,
          conversationLength: this.currentConversation.length
        });
        break;
      
      default:
        this.socket.emit('skill:response', {
          requestId,
          error: `Unknown action: ${action}`
        });
    }
  }

  generateResponse(userMessage) {
    // TODO: Integrate with actual OpenClaw agent
    // This is a placeholder - replace with your agent's logic
    
    const responses = [
      `I received: "${userMessage}"`,
      `Processing your request: ${userMessage}`,
      `OpenClaw agent responding to: ${userMessage}`,
      `You said: "${userMessage}" - I'm an OpenClaw agent connected to MasterClawInterface!`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  sendResponse(text, conversationId) {
    if (!this.isConnected) {
      console.error('❌ Cannot send response: not connected');
      return;
    }

    const response = {
      type: 'assistant',
      content: text,
      agent: config.agentName,
      agentId: config.agentId,
      conversationId,
      timestamp: Date.now()
    };

    this.socket.emit('chat:response', response, (ack) => {
      if (ack?.success) {
        console.log(`📤 Sent: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      } else {
        console.error('❌ Failed to send response:', ack?.error);
      }
    });

    // Also store locally
    this.currentConversation.push({
      role: 'assistant',
      content: text,
      timestamp: Date.now()
    });
  }

  startCLI() {
    console.log('🖥️  Starting CLI (type "/quit" to exit)');
    console.log('');

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'Agent > '
    });

    this.rl.prompt();

    this.rl.on('line', (line) => {
      const trimmed = line.trim();
      
      if (trimmed === '/quit') {
        this.shutdown();
        return;
      }

      if (trimmed === '/status') {
        console.log({
          connected: this.isConnected,
          socketId: this.socket?.id,
          conversationLength: this.currentConversation.length,
          agentName: config.agentName
        });
      }

      if (trimmed === '/history') {
        console.log('\n--- Conversation History ---');
        this.currentConversation.forEach((msg, i) => {
          console.log(`${i + 1}. [${msg.role}] ${msg.content.substring(0, 80)}...`);
        });
        console.log('');
      }

      if (trimmed.startsWith('/send ')) {
        const message = trimmed.substring(6);
        this.sendResponse(message, 'manual');
      }

      this.rl.prompt();
    });

    this.rl.on('close', () => {
      this.shutdown();
    });
  }

  shutdown() {
    console.log('\n👋 Shutting down...');
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    if (this.rl) {
      this.rl.close();
    }
    
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received');
  process.exit(0);
});

// Start the skill
const skill = new MasterClawChatSkill();
skill.start().catch(err => {
  console.error('Failed to start skill:', err);
  process.exit(1);
});
