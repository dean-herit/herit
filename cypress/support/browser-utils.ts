/**
 * Cross-browser testing utilities for handling browser-specific behaviors
 */

export type SupportedBrowser = "chrome" | "firefox" | "edge" | "webkit";

export const getBrowserInfo = (): {
  name: SupportedBrowser;
  version: string;
} => {
  const userAgent = Cypress.browser.name;
  const version = Cypress.browser.version;

  // Map Cypress browser names to our supported browsers
  let browserName: SupportedBrowser = "chrome"; // default

  if (userAgent.includes("firefox")) {
    browserName = "firefox";
  } else if (userAgent.includes("edge")) {
    browserName = "edge";
  } else if (userAgent.includes("webkit") || userAgent.includes("safari")) {
    browserName = "webkit";
  }

  return { name: browserName, version };
};

export const browserSpecificWait = (browser: SupportedBrowser) => {
  const waitTimes = {
    chrome: 100,
    firefox: 200,
    edge: 150,
    webkit: 300,
  };

  return cy.wait(waitTimes[browser] || 100);
};

export const browserSpecificViewport = (browser: SupportedBrowser) => {
  // Some browsers have different rendering behaviors at different sizes
  const viewports = {
    chrome: { width: 1280, height: 720 },
    firefox: { width: 1280, height: 720 },
    edge: { width: 1280, height: 720 },
    webkit: { width: 1280, height: 800 }, // Safari needs more height for some elements
  };

  const viewport = viewports[browser] || viewports.chrome;
  return cy.viewport(viewport.width, viewport.height);
};

export const handleCookieConsent = (browser: SupportedBrowser) => {
  // Different browsers may handle cookie dialogs differently
  if (browser === "firefox") {
    // Firefox might need special handling for cookie consent
    cy.get("body").then(($body) => {
      if ($body.find('[data-testid*="cookie-consent"]').length > 0) {
        cy.get('[data-testid*="accept-cookies"]').click();
      }
    });
  }
};

export const browserSpecificClick = (
  selector: string,
  browser: SupportedBrowser,
) => {
  if (browser === "webkit") {
    // WebKit/Safari sometimes needs force clicks
    return cy.get(selector).click({ force: true });
  }
  return cy.get(selector).click();
};

export const browserSpecificType = (
  selector: string,
  text: string,
  browser: SupportedBrowser,
) => {
  if (browser === "firefox") {
    // Firefox sometimes needs slower typing
    return cy.get(selector).clear().type(text, { delay: 50 });
  }
  return cy.get(selector).clear().type(text);
};

export const skipOnBrowser = (
  browsers: SupportedBrowser[],
  testName: string,
) => {
  const currentBrowser = getBrowserInfo().name;
  if (browsers.includes(currentBrowser)) {
    cy.log(`Skipping test "${testName}" on ${currentBrowser}`);
    return true;
  }
  return false;
};

export const runOnlyOnBrowser = (
  browsers: SupportedBrowser[],
  testName: string,
) => {
  const currentBrowser = getBrowserInfo().name;
  if (!browsers.includes(currentBrowser)) {
    cy.log(`Skipping test "${testName}" - only runs on ${browsers.join(", ")}`);
    return true;
  }
  return false;
};

// Browser-specific CSS selectors that might differ
export const getBrowserSpecificSelector = (
  base: string,
  browser: SupportedBrowser,
): string => {
  const browserSelectors = {
    chrome: base,
    firefox: base,
    edge: base,
    webkit: base, // Safari might need different selectors for some elements
  };

  return browserSelectors[browser] || base;
};

// Handle file uploads which can behave differently across browsers
export const browserSpecificFileUpload = (
  selector: string,
  filePath: string,
  browser: SupportedBrowser,
) => {
  if (browser === "webkit") {
    // WebKit/Safari file upload handling
    return cy.get(selector).selectFile(filePath, { force: true });
  }
  return cy.get(selector).selectFile(filePath);
};

// Handle form submissions which can vary by browser
export const browserSpecificSubmit = (
  formSelector: string,
  browser: SupportedBrowser,
) => {
  if (browser === "firefox") {
    // Firefox sometimes needs explicit form submission
    return cy.get(formSelector).submit();
  }
  return cy.get(formSelector).within(() => {
    cy.get('[type="submit"]').click();
  });
};

declare global {
  namespace Cypress {
    interface Chainable {
      getBrowserInfo(): Chainable<{ name: SupportedBrowser; version: string }>;
      browserSpecificWait(browser: SupportedBrowser): Chainable<void>;
      browserSpecificViewport(browser: SupportedBrowser): Chainable<void>;
      skipOnBrowser(
        browsers: SupportedBrowser[],
        testName: string,
      ): Chainable<boolean>;
      runOnlyOnBrowser(
        browsers: SupportedBrowser[],
        testName: string,
      ): Chainable<boolean>;
    }
  }
}

// Register custom commands
Cypress.Commands.add("getBrowserInfo", getBrowserInfo);
Cypress.Commands.add("browserSpecificWait", browserSpecificWait);
Cypress.Commands.add("browserSpecificViewport", browserSpecificViewport);
Cypress.Commands.add("skipOnBrowser", skipOnBrowser);
Cypress.Commands.add("runOnlyOnBrowser", runOnlyOnBrowser);
