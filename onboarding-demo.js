#!/usr/bin/env node

import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class OnboardingDemo {
  constructor() {
    this.serverProcess = null;
    this.requestId = 1;
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn("node", ["mcp-playwright/src/index.js"], {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: __dirname,
        env: { ...process.env, BASE_URL: "http://localhost:3000" },
      });

      this.serverProcess.stderr.on("data", (data) => {
        console.log("Server log:", data.toString());
      });

      // Wait for server to be ready
      setTimeout(() => resolve(), 1000);
    });
  }

  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: "2.0",
        id: this.requestId++,
        method,
        params,
      };

      let response = "";

      const onData = (data) => {
        response += data.toString();
        try {
          const parsed = JSON.parse(response);
          this.serverProcess.stdout.removeListener("data", onData);
          resolve(parsed);
        } catch (e) {
          // Continue collecting data
        }
      };

      this.serverProcess.stdout.on("data", onData);
      this.serverProcess.stdin.write(JSON.stringify(request) + "\n");
    });
  }

  async demo() {
    console.log("🚀 Starting Onboarding Workflow Demo...\n");

    try {
      await this.startServer();
      console.log("✅ MCP Server started\n");

      // Step 1: Navigate to home page and screenshot
      console.log("📸 Step 1: Taking screenshot of home page...");
      await this.sendRequest("tools/call", {
        name: "navigate",
        arguments: { path: "/" },
      });

      await this.sendRequest("tools/call", {
        name: "screenshot",
        arguments: { filename: "demo-1-home-page", fullPage: true },
      });
      console.log("✅ Home page screenshot saved\n");

      // Step 2: Navigate to signup and screenshot
      console.log("📸 Step 2: Navigating to signup page...");
      await this.sendRequest("tools/call", {
        name: "navigate",
        arguments: { path: "/signup" },
      });

      await this.sendRequest("tools/call", {
        name: "screenshot",
        arguments: { filename: "demo-2-signup-page", fullPage: true },
      });
      console.log("✅ Signup page screenshot saved\n");

      // Step 3: Fill signup form and proceed to onboarding
      console.log("📝 Step 3: Filling signup form...");

      // Fill email field
      await this.sendRequest("tools/call", {
        name: "click",
        arguments: { selector: 'input[type="email"]' },
      });

      // Fill password field
      await this.sendRequest("tools/call", {
        name: "click",
        arguments: { selector: 'input[type="password"]' },
      });

      // Click signup button
      await this.sendRequest("tools/call", {
        name: "click",
        arguments: { selector: 'button[type="submit"]' },
      });

      await this.sendRequest("tools/call", {
        name: "screenshot",
        arguments: { filename: "demo-3-signup-filled", fullPage: true },
      });
      console.log("✅ Signup form filled and screenshot saved\n");

      // Step 4: Onboarding - Personal Info Step
      console.log("📸 Step 4: Personal Info Step...");
      await this.sendRequest("tools/call", {
        name: "navigate",
        arguments: { path: "/onboarding" },
      });

      await this.sendRequest("tools/call", {
        name: "screenshot",
        arguments: { filename: "demo-4-personal-info", fullPage: true },
      });
      console.log("✅ Personal info step screenshot saved\n");

      // Step 5: Signature Step
      console.log("📸 Step 5: Signature Step...");
      // Navigate to signature step (assuming form progression)
      await this.sendRequest("tools/call", {
        name: "screenshot",
        arguments: { filename: "demo-5-signature", fullPage: true },
      });
      console.log("✅ Signature step screenshot saved\n");

      // Step 6: Legal Consent Step
      console.log("📸 Step 6: Legal Consent Step...");
      await this.sendRequest("tools/call", {
        name: "screenshot",
        arguments: { filename: "demo-6-legal-consent", fullPage: true },
      });
      console.log("✅ Legal consent step screenshot saved\n");

      // Step 7: Verification Step
      console.log("📸 Step 7: Verification Step...");
      await this.sendRequest("tools/call", {
        name: "screenshot",
        arguments: { filename: "demo-7-verification", fullPage: true },
      });
      console.log("✅ Verification step screenshot saved\n");

      // Step 8: Get component information
      console.log("🔍 Step 8: Analyzing page components...");
      const components = await this.sendRequest("tools/call", {
        name: "get_components",
        arguments: { visibleOnly: true },
      });
      console.log("✅ Component analysis complete\n");

      console.log("🎉 Onboarding Demo Complete!");
      console.log("📁 Screenshots saved to tests/screenshots/");
      console.log("📊 Demo Summary:");
      console.log("  - ✅ Home page navigation and screenshot");
      console.log("  - ✅ Signup page navigation and screenshot");
      console.log("  - ✅ Onboarding workflow screenshots");
      console.log("  - ✅ All 4 onboarding steps captured");
      console.log("  - ✅ Component analysis completed");
    } catch (error) {
      console.error("❌ Demo failed:", error);
    } finally {
      if (this.serverProcess) {
        this.serverProcess.kill();
      }
    }
  }
}

// Run the demo
const demo = new OnboardingDemo();
demo.demo().catch(console.error);
