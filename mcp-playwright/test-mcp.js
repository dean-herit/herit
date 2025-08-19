#!/usr/bin/env node

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing MCP server...');

const server = spawn('node', [join(__dirname, 'src', 'index.js')], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, BASE_URL: 'http://localhost:3000' }
});

// Send a list tools request
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list'
};

server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  lines.forEach(line => {
    try {
      const parsed = JSON.parse(line);
      console.log('Response:', JSON.stringify(parsed, null, 2));
      
      if (parsed.result && parsed.result.tools) {
        console.log('\nAvailable tools:');
        parsed.result.tools.forEach(tool => {
          console.log(`- ${tool.name}: ${tool.description}`);
        });
        process.exit(0);
      }
    } catch (e) {
      // Not JSON, likely a log message
    }
  });
});

server.stderr.on('data', (data) => {
  console.log('Server log:', data.toString());
});

// Wait for server to start then send request
setTimeout(() => {
  console.log('Sending list tools request...');
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 1000);

setTimeout(() => {
  console.log('Test timeout - killing server');
  server.kill();
  process.exit(1);
}, 5000);