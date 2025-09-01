const fs = require("fs");
const path = require("path");

/**
 * Custom ESLint plugin to enforce Storybook and Cypress compliance for React components
 * Ensures every component has corresponding .stories.tsx and .cy.tsx files
 */

const ruleName = "require-component-tests";
const storyRuleName = "require-storybook-story";
const cypressRuleName = "require-cypress-test";
const testIdRuleName = "require-testid-attributes";
const exportRuleName = "require-named-export";

module.exports = {
  meta: {
    name: "eslint-plugin-storybook-cypress-compliance",
    version: "1.0.0"
  },
  rules: {
    [ruleName]: {
      meta: {
        type: "problem",
        docs: {
          description: "Enforce that React components have both Storybook stories and Cypress tests",
          category: "Testing",
        },
        fixable: null,
        schema: [],
        messages: {
          missingStory: "Component '{{componentName}}' is missing a Storybook story file: {{storyPath}}",
          missingCypress: "Component '{{componentName}}' is missing a Cypress test file: {{cypressPath}}",
        },
      },
      create(context) {
        return {
          Program(node) {
            const filename = context.getFilename();
            
            // Only check .tsx component files, skip test files and stories
            if (!filename.endsWith('.tsx') || 
                filename.includes('.test.') || 
                filename.includes('.spec.') ||
                filename.includes('.stories.') ||
                filename.includes('.cy.')) {
              return;
            }

            // Skip non-component files (pages, layouts, etc.)
            if (filename.includes('/app/') && !filename.includes('/components/')) {
              return;
            }

            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText();
            
            // Check if file exports a React component (has JSX and export)
            const hasJSX = /<[A-Za-z]/.test(text);
            const hasExport = /export\s+(default\s+)?(?:function|const|class)/.test(text);
            
            if (!hasJSX || !hasExport) {
              return;
            }

            const componentName = path.basename(filename, '.tsx');
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
          missingTestId: "Interactive element should have a data-testid attribute for testing",
        },
      },
      create(context) {
        const interactiveElements = new Set([
          'button', 'input', 'select', 'textarea', 'a', 'form'
        ]);
        
        const interactiveProps = new Set([
          'onClick', 'onPress', 'onSubmit', 'onChange', 'onFocus', 'onBlur'
        ]);

        return {
          JSXElement(node) {
            const elementName = node.openingElement.name.name;
            const attributes = node.openingElement.attributes;
            
            // Check if element is interactive
            const isInteractiveElement = interactiveElements.has(elementName);
            const hasInteractiveProps = attributes.some(attr => 
              attr.type === 'JSXAttribute' && interactiveProps.has(attr.name.name)
            );
            
            if (isInteractiveElement || hasInteractiveProps) {
              // Check if data-testid exists
              const hasTestId = attributes.some(attr => 
                attr.type === 'JSXAttribute' && attr.name.name === 'data-testid'
              );
              
              if (!hasTestId) {
                context.report({
                  node: node.openingElement,
                  messageId: "missingTestId",
                  fix(fixer) {
                    const lastAttribute = attributes[attributes.length - 1];
                    const testId = `${elementName}-${Math.random().toString(36).substr(2, 9)}`;
                    
                    if (lastAttribute) {
                      return fixer.insertTextAfter(lastAttribute, ` data-testid="${testId}"`);
                    } else {
                      return fixer.insertTextAfter(node.openingElement.name, ` data-testid="${testId}"`);
                    }
                  }
                });
              }
            }
          }
        };
      },
    },

    [exportRuleName]: {
      meta: {
        type: "suggestion",
        docs: {
          description: "Enforce named exports for React components to improve testability",
          category: "Testing",
        },
        fixable: null,
        schema: [],
        messages: {
          preferNamedExport: "Prefer named exports over default exports for React components to improve testability",
        },
      },
      create(context) {
        return {
          ExportDefaultDeclaration(node) {
            const filename = context.getFilename();
            
            // Only check component files
            if (!filename.endsWith('.tsx') || filename.includes('.stories.') || filename.includes('.cy.')) {
              return;
            }
            
            context.report({
              node,
              messageId: "preferNamedExport",
            });
          }
        };
      },
    }
  }
};