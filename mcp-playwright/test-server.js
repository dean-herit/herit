#!/usr/bin/env node

// Simple test to verify the MCP server works
import { spawn } from 'child_process';

console.log('🧪 Testing Playwright MCP Server\n');

const server = spawn('node', ['src/index.js'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'inherit'],
});

// Send a test request to list tools
const testRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {},
};

server.stdin.write(JSON.stringify(testRequest) + '\n');

let buffer = '';
server.stdout.on('data', (data) => {
  buffer += data.toString();
  
  // Try to parse complete JSON messages
  const lines = buffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (line) {
      try {
        const response = JSON.parse(line);
        console.log('✅ Server Response Received:');
        console.log(JSON.stringify(response, null, 2));
        
        if (response.result && response.result.tools) {
          console.log('\n📋 Available Tools:');
          response.result.tools.forEach(tool => {
            console.log(`  - ${tool.name}: ${tool.description}`);
          });
          console.log('\n🎉 MCP Server is working correctly!');
          process.exit(0);
        }
      } catch (e) {
        // Not a complete JSON message yet
      }
    }
  }
  buffer = lines[lines.length - 1];
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Timeout after 5 seconds
setTimeout(() => {
  console.error('❌ Test timed out');
  server.kill();
  process.exit(1);
}, 5000);