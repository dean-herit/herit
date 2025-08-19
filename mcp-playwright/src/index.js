#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PlaywrightMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'playwright-visual-testing',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.browser = null;
    this.context = null;
    this.page = null;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    this.setupTools();
    this.setupErrorHandling();
  }

  setupTools() {
    // Tool: List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'navigate',
          description: 'Navigate to a page in the application',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'The path to navigate to (e.g., "/dashboard", "/login")',
              },
              waitForSelector: {
                type: 'string',
                description: 'Optional selector to wait for after navigation',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'screenshot',
          description: 'Take a screenshot of the current page or specific component',
          inputSchema: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'Filename for the screenshot (without extension)',
              },
              componentId: {
                type: 'string',
                description: 'Optional component ID to highlight before screenshot',
              },
              fullPage: {
                type: 'boolean',
                description: 'Whether to capture the full page (default: true)',
              },
            },
            required: ['filename'],
          },
        },
        {
          name: 'click',
          description: 'Click an element by selector or component ID',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector or component ID to click',
              },
              isComponentId: {
                type: 'boolean',
                description: 'Whether the selector is a component ID (default: false)',
              },
            },
            required: ['selector'],
          },
        },
        {
          name: 'get_components',
          description: 'Get all components on the current page',
          inputSchema: {
            type: 'object',
            properties: {
              visibleOnly: {
                type: 'boolean',
                description: 'Only return visible components (default: true)',
              },
            },
          },
        },
        {
          name: 'visual_mode',
          description: 'Toggle visual development mode',
          inputSchema: {
            type: 'object',
            properties: {
              enabled: {
                type: 'boolean',
                description: 'Enable or disable visual mode',
              },
            },
            required: ['enabled'],
          },
        },
      ],
    }));

    // Tool: Call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      // Ensure browser is initialized
      if (!this.browser && name !== 'visual_mode') {
        await this.initBrowser();
      }

      switch (name) {
        case 'navigate':
          return await this.navigate(args);
        case 'screenshot':
          return await this.screenshot(args);
        case 'click':
          return await this.click(args);
        case 'get_components':
          return await this.getComponents(args);
        case 'visual_mode':
          return await this.toggleVisualMode(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async initBrowser() {
    if (this.browser) return;
    
    console.error('Initializing Playwright browser...');
    this.browser = await chromium.launch({
      headless: false,
      devtools: true,
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    
    this.page = await this.context.newPage();
    
    // Enable visual dev mode by default
    await this.page.addInitScript(() => {
      localStorage.setItem('visualDevMode', 'true');
    });
    
    console.error('Browser initialized successfully');
  }

  async navigate({ path, waitForSelector }) {
    const url = `${this.baseUrl}${path}`;
    console.error(`Navigating to: ${url}`);
    
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    
    if (waitForSelector) {
      await this.page.waitForSelector(waitForSelector, { timeout: 10000 });
    }
    
    // Wait for React hydration
    await this.page.waitForTimeout(1000);
    
    return {
      content: [
        {
          type: 'text',
          text: `Successfully navigated to ${path}`,
        },
      ],
    };
  }

  async screenshot({ filename, componentId, fullPage = true }) {
    const screenshotPath = join(process.cwd(), 'tests', 'screenshots', `${filename}.png`);
    
    // Highlight component if specified
    if (componentId) {
      await this.page.evaluate((id) => {
        const element = document.querySelector(`[data-component-id="${id}"]`);
        if (element) {
          element.style.outline = '3px solid #FF1CF7';
          element.style.outlineOffset = '2px';
        }
      }, componentId);
      
      await this.page.waitForTimeout(500); // Let highlight render
    }
    
    await this.page.screenshot({
      path: screenshotPath,
      fullPage,
    });
    
    // Remove highlight
    if (componentId) {
      await this.page.evaluate((id) => {
        const element = document.querySelector(`[data-component-id="${id}"]`);
        if (element) {
          element.style.outline = '';
          element.style.outlineOffset = '';
        }
      }, componentId);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Screenshot saved to ${screenshotPath}`,
        },
      ],
    };
  }

  async click({ selector, isComponentId = false }) {
    const actualSelector = isComponentId 
      ? `[data-component-id="${selector}"]`
      : selector;
    
    console.error(`Clicking: ${actualSelector}`);
    
    await this.page.click(actualSelector);
    await this.page.waitForTimeout(500); // Wait for any animations
    
    return {
      content: [
        {
          type: 'text',
          text: `Clicked element: ${selector}`,
        },
      ],
    };
  }

  async getComponents({ visibleOnly = true }) {
    const components = await this.page.evaluate((onlyVisible) => {
      const elements = Array.from(document.querySelectorAll('[data-component-id]'));
      return elements
        .filter(el => !onlyVisible || el.offsetParent !== null)
        .map(el => ({
          id: el.getAttribute('data-component-id'),
          category: el.getAttribute('data-component-category') || 'unknown',
          visible: el.offsetParent !== null,
          bounds: el.getBoundingClientRect(),
        }));
    }, visibleOnly);
    
    return {
      content: [
        {
          type: 'text',
          text: `Found ${components.length} components:\n${components.map(c => 
            `- ${c.id} (${c.category}) ${c.visible ? '✓' : '✗'}`
          ).join('\n')}`,
        },
      ],
    };
  }

  async toggleVisualMode({ enabled }) {
    if (!this.page) {
      await this.initBrowser();
    }
    
    await this.page.evaluate((isEnabled) => {
      localStorage.setItem('visualDevMode', isEnabled ? 'true' : 'false');
      
      // Trigger storage event to update UI
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'visualDevMode',
        newValue: isEnabled ? 'true' : 'false',
        oldValue: isEnabled ? 'false' : 'true',
      }));
    }, enabled);
    
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    
    return {
      content: [
        {
          type: 'text',
          text: `Visual development mode ${enabled ? 'enabled' : 'disabled'}`,
        },
      ],
    };
  }

  setupErrorHandling() {
    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  async cleanup() {
    if (this.browser) {
      console.error('Closing browser...');
      await this.browser.close();
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Playwright MCP Server running on stdio');
  }
}

// Start the server
const server = new PlaywrightMCPServer();
server.run().catch(console.error);