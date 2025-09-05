import fs from "fs";
import path from "path";

/**
 * Custom ESLint plugin to enforce Storybook and Cypress compliance for React components
 * Ensures every component has corresponding .stories.tsx and .cy.tsx files
 */

const ruleName = "require-component-tests";
const storyRuleName = "require-storybook-story";
const cypressRuleName = "require-cypress-test";
const testIdRuleName = "require-testid-attributes";
const exportRuleName = "require-named-export";
const enhancedTestStructureRuleName = "require-enhanced-test-structure";
const testUtilsRuleName = "require-test-utils-import";
const aiGeneratedTestRuleName = "prefer-ai-generated-tests";

export default {
  meta: {
    name: "eslint-plugin-storybook-cypress-compliance",
    version: "1.0.0",
  },
  rules: {
    [ruleName]: {
      meta: {
        type: "problem",
        docs: {
          description:
            "Enforce that React components have both Storybook stories and Cypress tests",
          category: "Testing",
        },
        fixable: null,
        schema: [],
        messages: {
          missingStory:
            "Component '{{componentName}}' is missing a Storybook story file: {{storyPath}}",
          missingCypress:
            "Component '{{componentName}}' is missing a Cypress test file: {{cypressPath}}",
        },
      },
      create(context) {
        return {
          Program(node) {
            const filename = context.getFilename();

            // Only check .tsx component files, skip test files and stories
            if (
              !filename.endsWith(".tsx") ||
              filename.includes(".test.") ||
              filename.includes(".spec.") ||
              filename.includes(".stories.") ||
              filename.includes(".cy.")
            ) {
              return;
            }

            // Skip non-component files (pages, layouts, etc.)
            if (
              filename.includes("/app/") &&
              !filename.includes("/components/")
            ) {
              return;
            }

            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText();

            // Check if file exports a React component (has JSX and export)
            const hasJSX = /<[A-Za-z]/.test(text);
            const hasExport =
              /export\s+(default\s+)?(?:function|const|class)/.test(text);

            if (!hasJSX || !hasExport) {
              return;
            }

            const componentName = path.basename(filename, ".tsx");
            const dir = path.dirname(filename);

            const storyPath = path.join(dir, `${componentName}.stories.tsx`);
            const cypressPath = path.join(dir, `${componentName}.cy.tsx`);

            // Check if story file exists
            if (!fs.existsSync(storyPath)) {
              context.report({
                node,
                messageId: "missingStory",
                data: {
                  componentName,
                  storyPath: path.relative(process.cwd(), storyPath),
                },
              });
            }

            // Check if Cypress test exists
            if (!fs.existsSync(cypressPath)) {
              context.report({
                node,
                messageId: "missingCypress",
                data: {
                  componentName,
                  cypressPath: path.relative(process.cwd(), cypressPath),
                },
              });
            }
          },
        };
      },
    },

    [testIdRuleName]: {
      meta: {
        type: "problem",
        docs: {
          description: "Enforce data-testid attributes on interactive elements",
          category: "Testing",
        },
        fixable: "code",
        schema: [],
        messages: {
          missingTestId:
            "Interactive element should have a data-testid attribute for testing",
        },
      },
      create(context) {
        const interactiveElements = new Set([
          "button",
          "input",
          "select",
          "textarea",
          "a",
          "form",
        ]);

        const interactiveProps = new Set([
          "onClick",
          "onPress",
          "onSubmit",
          "onChange",
          "onFocus",
          "onBlur",
        ]);

        return {
          JSXElement(node) {
            const elementName = node.openingElement.name.name;
            const attributes = node.openingElement.attributes;

            // Check if element is interactive
            const isInteractiveElement = interactiveElements.has(elementName);
            const hasInteractiveProps = attributes.some(
              (attr) =>
                attr.type === "JSXAttribute" &&
                interactiveProps.has(attr.name.name),
            );

            if (isInteractiveElement || hasInteractiveProps) {
              // Check if data-testid exists
              const hasTestId = attributes.some(
                (attr) =>
                  attr.type === "JSXAttribute" &&
                  attr.name.name === "data-testid",
              );

              if (!hasTestId) {
                context.report({
                  node: node.openingElement,
                  messageId: "missingTestId",
                  fix(fixer) {
                    const lastAttribute = attributes[attributes.length - 1];
                    const testId = `${elementName}-${Math.random().toString(36).substr(2, 9)}`;

                    if (lastAttribute) {
                      return fixer.insertTextAfter(
                        lastAttribute,
                        ` data-testid="${testId}"`,
                      );
                    } else {
                      return fixer.insertTextAfter(
                        node.openingElement.name,
                        ` data-testid="${testId}"`,
                      );
                    }
                  },
                });
              }
            }
          },
        };
      },
    },

    [exportRuleName]: {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Enforce named exports for React components to improve testability",
          category: "Testing",
        },
        fixable: null,
        schema: [],
        messages: {
          preferNamedExport:
            "Prefer named exports over default exports for React components to improve testability",
        },
      },
      create(context) {
        return {
          ExportDefaultDeclaration(node) {
            const filename = context.getFilename();

            // Only check component files
            if (
              !filename.endsWith(".tsx") ||
              filename.includes(".stories.") ||
              filename.includes(".cy.")
            ) {
              return;
            }

            context.report({
              node,
              messageId: "preferNamedExport",
            });
          },
        };
      },
    },

    [enhancedTestStructureRuleName]: {
      meta: {
        type: "problem",
        docs: {
          description: "Enforce 8-section enhanced test structure in Cypress component tests with V2 schema compliance",
          category: "Testing",
        },
        fixable: null,
        schema: [],
        messages: {
          missingTestSection: "Cypress test is missing required section: '{{section}}'",
          useAiGeneration: "Consider using 'npm run generate:test' to create enhanced 8-section tests with AI analysis",
          missingV2SchemaCompliance: "Test should include V2 schema validation patterns (discriminated unions, specific_fields)",
          missingRealAuthPatterns: "Test should use real authentication patterns instead of complex mocks",
        },
      },
      create(context) {
        return {
          Program(node) {
            const filename = context.getFilename();

            // Only check .cy.tsx files
            if (!filename.endsWith(".cy.tsx")) {
              return;
            }

            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText();

            // Required 8-section structure from Item 1 automation
            const requiredSections = [
              "Core Functionality",
              "Error States", 
              "Accessibility",
              "Performance",
              "Responsive Design",
              "Integration Scenarios",
              "Edge Cases",
              "Security"
            ];

            const missingSections = requiredSections.filter(section => {
              const sectionRegex = new RegExp(`describe\\s*\\(\\s*["'\`]${section}["'\`]`, 'i');
              return !sectionRegex.test(text);
            });

            // Check for V2 schema compliance patterns
            const hasV2Patterns = [
              /specific_fields/.test(text),
              /discriminated.union|asset_type.*irish_|individual_stock_holding|irish_bank_account/.test(text),
              /data\.data\./.test(text), // Response format pattern
            ].some(Boolean);

            // Check for real auth patterns (learned from Hail Mary project)
            const hasRealAuthPatterns = [
              /TestAuthManager|setupAuthenticatedTest/.test(text),
              /createAuthenticatedRequest/.test(text),
              /real.auth|JWT.token/.test(text),
            ].some(Boolean);

            // Report missing sections
            if (missingSections.length > 0) {
              // Check if this might be a legacy test that needs AI upgrade
              const hasBasicDescribe = /describe\s*\(\s*["'`]/.test(text);
              
              if (hasBasicDescribe && missingSections.length >= 6) {
                // Suggest AI generation for heavily incomplete tests
                context.report({
                  node,
                  messageId: "useAiGeneration",
                });
              } else {
                // Report specific missing sections
                missingSections.forEach(section => {
                  context.report({
                    node,
                    messageId: "missingTestSection",
                    data: { section },
                  });
                });
              }
            }

            // Check V2 schema compliance for form/data-related tests
            if (filename.includes("Form") || filename.includes("Asset") || filename.includes("Beneficiar")) {
              if (!hasV2Patterns) {
                context.report({
                  node,
                  messageId: "missingV2SchemaCompliance",
                });
              }
            }

            // Check auth patterns for protected components
            if (filename.includes("Auth") || filename.includes("Login") || filename.includes("Dashboard")) {
              if (!hasRealAuthPatterns && /auth|login|session/.test(text.toLowerCase())) {
                context.report({
                  node,
                  messageId: "missingRealAuthPatterns",
                });
              }
            }
          },
        };
      },
    },

    [testUtilsRuleName]: {
      meta: {
        type: "suggestion",
        docs: {
          description: "Enforce TestUtils import in Cypress component tests for standardization",
          category: "Testing",
        },
        fixable: "code",
        schema: [],
        messages: {
          missingTestUtils: "Cypress tests should import TestUtils for standardized patterns (85% code reuse)",
          incorrectTestUtilsPath: "TestUtils import path should be relative to cypress/support/test-utils",
        },
      },
      create(context) {
        return {
          Program(node) {
            const filename = context.getFilename();

            // Only check .cy.tsx files
            if (!filename.endsWith(".cy.tsx")) {
              return;
            }

            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText();

            // Check for TestUtils import
            const hasTestUtilsImport = /import\s+.*TestUtils.*from\s+["'`].*test-utils["'`]/.test(text);
            
            if (!hasTestUtilsImport) {
              context.report({
                node,
                messageId: "missingTestUtils",
                fix(fixer) {
                  // Calculate relative path to test-utils
                  const relativePath = path.relative(
                    path.dirname(filename), 
                    path.join(process.cwd(), "cypress/support")
                  );
                  const importPath = path.join(relativePath, "test-utils").replace(/\\/g, '/');
                  const importStatement = `import { TestUtils } from "${importPath.startsWith('.') ? importPath : './' + importPath}";\n`;
                  
                  // Find the last import statement to insert after
                  const importMatches = [...text.matchAll(/^import\s+.*$/gm)];
                  if (importMatches.length > 0) {
                    const lastImport = importMatches[importMatches.length - 1];
                    const lastImportEnd = lastImport.index + lastImport[0].length;
                    return fixer.insertTextAfterRange([lastImportEnd, lastImportEnd], '\n' + importStatement);
                  } else {
                    // Insert at the beginning if no imports found
                    return fixer.insertTextBefore(node, importStatement + '\n');
                  }
                },
              });
            }
          },
        };
      },
    },

    [aiGeneratedTestRuleName]: {
      meta: {
        type: "suggestion",
        docs: {
          description: "Suggest using AI-powered test generation for optimal test quality with V2 schema patterns",
          category: "Testing",
        },
        fixable: null,
        schema: [],
        messages: {
          suggestAiGeneration: "Consider using 'npm run generate:tests:upgrade' to enhance this test with AI-powered 8-section structure and compliance validation",
          outdatedTestPattern: "This test appears to use outdated patterns. Run 'npm run test:compliance' to get a quality score and improvement suggestions",
          missingHailMaryLessons: "Test missing patterns learned from Hail Mary project: V2 schema compliance, real auth, field name corrections",
        },
      },
      create(context) {
        return {
          Program(node) {
            const filename = context.getFilename();

            // Only check .cy.tsx files
            if (!filename.endsWith(".cy.tsx")) {
              return;
            }

            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText();

            // Check for indicators that this might be a legacy test
            const legacyPatterns = [
              // Missing AI generation comment header
              !/Enhanced standards compliance with 8-section structure/.test(text),
              // Missing TestUtils usage
              !/TestUtils\./.test(text),
              // Simple test structure (less than 4 describe blocks)
              (text.match(/describe\s*\(/g) || []).length < 4,
              // Missing performance testing
              !/Performance/.test(text),
              // Missing accessibility testing
              !/Accessibility/.test(text),
            ];

            // Check for Hail Mary project lessons (learned from divine victory)
            const hailMaryPatterns = [
              // V2 schema patterns
              !/specific_fields|discriminated.union|asset_type.*irish_/.test(text),
              // Real authentication (no mocks)
              !/TestAuthManager|setupAuthenticatedTest|createAuthenticatedRequest/.test(text) && /mock.*auth|vi\.mock.*auth/.test(text),
              // Response format expectations
              !/data\.data\.|response\.data\.data/.test(text),
              // Field name corrections
              !/asset_type.*:|ticker_symbol|stockbroker/.test(text) && /type.*:|stock_symbol|irish_broker/.test(text),
              // POST validation patterns
              !/POST.*validation|400.*error|enum.*values/.test(text),
            ];

            const legacyIndicators = legacyPatterns.filter(Boolean).length;
            const hailMaryIndicators = hailMaryPatterns.filter(Boolean).length;

            if (legacyIndicators >= 3) {
              // High confidence this is a legacy test
              context.report({
                node,
                messageId: "suggestAiGeneration",
              });
            } else if (legacyIndicators >= 1) {
              // Some indicators present
              context.report({
                node,
                messageId: "outdatedTestPattern",
              });
            }

            // Check for missing Hail Mary project lessons
            if (hailMaryIndicators >= 2 && (filename.includes("Asset") || filename.includes("Auth") || filename.includes("Form"))) {
              context.report({
                node,
                messageId: "missingHailMaryLessons",
              });
            }
          },
        };
      },
    },
  },
};
