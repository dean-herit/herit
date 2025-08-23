/**
 * ESLint Rule: require-component-attributes
 * 
 * Enforces that React components have required data-component-id and 
 * data-component-category attributes for visual development mode.
 * 
 * This rule helps maintain consistency and enables the visual debugging
 * system to properly identify and highlight components.
 */

const REQUIRED_ATTRIBUTES = ['data-component-id', 'data-component-category'];

const VALID_CATEGORIES = [
  'ui',
  'layout', 
  'navigation',
  'input',
  'feedback',
  'data-display',
  'business',
  'authentication'
];

// Components that should be exempt from this rule
const EXEMPTED_COMPONENTS = [
  // Framework components
  'html',
  'head', 
  'body',
  'main',
  'div',
  'span',
  'p',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'img',
  'svg',
  'path',
  // Next.js components
  'Image',
  'Link',
  'Script',
  // Layout components that are too generic
  'Fragment',
  // HeroUI base components (wrapped by our custom components)
  'Button',
  'Input', 
  'Card',
  'CardBody',
  'CardHeader',
  // Dev/utility components
  'ErrorBoundary'
];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require data-component-id and data-component-category attributes on custom React components',
      category: 'Best Practices',
      recommended: true
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          exemptedComponents: {
            type: 'array',
            items: { type: 'string' }
          },
          requireCategory: {
            type: 'boolean',
            default: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingComponentId: 'Custom components should have a data-component-id attribute for visual debugging',
      missingComponentCategory: 'Custom components should have a data-component-category attribute for visual debugging',
      invalidCategory: 'data-component-category must be one of: {{validCategories}}',
      bothMissing: 'Custom components should have both data-component-id and data-component-category attributes for visual debugging'
    }
  },

  create(context) {
    const options = context.options[0] || {};
    const exemptedComponents = [...EXEMPTED_COMPONENTS, ...(options.exemptedComponents || [])];
    const requireCategory = options.requireCategory !== false;

    function isCustomComponent(node) {
      // Check if it's a JSX element
      if (node.type !== 'JSXElement' && node.type !== 'JSXSelfClosingElement') {
        return false;
      }

      const elementName = node.openingElement.name.name;
      
      // Skip exempted components
      if (exemptedComponents.includes(elementName)) {
        return false;
      }

      // Custom components start with uppercase
      if (!/^[A-Z]/.test(elementName)) {
        return false;
      }

      return true;
    }

    function hasAttribute(node, attributeName) {
      const attributes = node.openingElement.attributes;
      return attributes.some(attr => 
        attr.type === 'JSXAttribute' && 
        attr.name.name === attributeName
      );
    }

    function getAttributeValue(node, attributeName) {
      const attributes = node.openingElement.attributes;
      const attr = attributes.find(attr => 
        attr.type === 'JSXAttribute' && 
        attr.name.name === attributeName
      );
      
      if (attr && attr.value && attr.value.type === 'Literal') {
        return attr.value.value;
      }
      return null;
    }

    function checkComponentAttributes(node) {
      if (!isCustomComponent(node)) {
        return;
      }

      const hasComponentId = hasAttribute(node, 'data-component-id');
      const hasComponentCategory = hasAttribute(node, 'data-component-category');

      // Check for missing attributes
      if (!hasComponentId && !hasComponentCategory) {
        context.report({
          node: node.openingElement,
          messageId: 'bothMissing',
          fix(fixer) {
            const elementName = node.openingElement.name.name;
            const componentId = elementName.replace(/([A-Z])/g, '-$1')
              .toLowerCase()
              .replace(/^-/, '');
            
            const lastAttribute = node.openingElement.attributes[node.openingElement.attributes.length - 1];
            const insertPosition = lastAttribute ? lastAttribute.range[1] : node.openingElement.name.range[1];
            
            return fixer.insertTextAfterRange(
              [insertPosition, insertPosition],
              `\n        data-component-id="${componentId}"\n        data-component-category="ui"`
            );
          }
        });
      } else {
        // Check individual attributes
        if (!hasComponentId) {
          context.report({
            node: node.openingElement,
            messageId: 'missingComponentId',
            fix(fixer) {
              const elementName = node.openingElement.name.name;
              const componentId = elementName.replace(/([A-Z])/g, '-$1')
                .toLowerCase()
                .replace(/^-/, '');
              
              const lastAttribute = node.openingElement.attributes[node.openingElement.attributes.length - 1];
              const insertPosition = lastAttribute ? lastAttribute.range[1] : node.openingElement.name.range[1];
              
              return fixer.insertTextAfterRange(
                [insertPosition, insertPosition],
                `\n        data-component-id="${componentId}"`
              );
            }
          });
        }

        if (!hasComponentCategory && requireCategory) {
          context.report({
            node: node.openingElement,
            messageId: 'missingComponentCategory',
            fix(fixer) {
              const lastAttribute = node.openingElement.attributes[node.openingElement.attributes.length - 1];
              const insertPosition = lastAttribute ? lastAttribute.range[1] : node.openingElement.name.range[1];
              
              return fixer.insertTextAfterRange(
                [insertPosition, insertPosition],
                `\n        data-component-category="ui"`
              );
            }
          });
        }
      }

      // Validate category value if present
      if (hasComponentCategory && requireCategory) {
        const categoryValue = getAttributeValue(node, 'data-component-category');
        if (categoryValue && !VALID_CATEGORIES.includes(categoryValue)) {
          context.report({
            node: node.openingElement,
            messageId: 'invalidCategory',
            data: {
              validCategories: VALID_CATEGORIES.join(', ')
            }
          });
        }
      }
    }

    return {
      JSXElement: checkComponentAttributes,
      JSXSelfClosingElement: checkComponentAttributes
    };
  }
};