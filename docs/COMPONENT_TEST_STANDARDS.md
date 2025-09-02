# Component Test Standards & Guidelines

## 🎯 Overview

This document defines the enhanced testing standards for component tests in the Herit application, incorporating efficiency improvements and best practices developed during the systematic test repair project.

## 📋 Test Quality Checklist

### ✅ **REQUIRED: Before Any Test Implementation**

- [ ] **Use shared test utilities** from `cypress/support/test-utils.ts`
- [ ] **Import TestUtils** instead of creating custom mock data
- [ ] **Use `.as()` aliases** for all Cypress stubs for better debugging
- [ ] **Follow naming conventions** for data-testid attributes
- [ ] **Include integration scenarios** where applicable
- [ ] **Test error states and edge cases** beyond happy path

### ✅ **REQUIRED: Test File Structure**

```typescript
// CORRECT: Enhanced test structure
import React from "react";
import { TestUtils } from "../../../../cypress/support/test-utils";

// Test-specific component (if needed)
function ComponentForTesting({ ... }) {
  // Minimal logic, use TestUtils for mock data
}

describe("ComponentName", () => {
  // Use shared mock data
  const mockData = TestUtils.createMockPersonalInfo();
  const callbacks = TestUtils.createMockCallbacks();

  beforeEach(() => {
    // Reset stubs
    Object.values(callbacks).forEach(stub => stub.reset?.());
  });

  describe("Core Functionality", () => {
    // Primary user scenarios
  });

  describe("Error States", () => {
    // Error handling and edge cases
  });

  describe("Accessibility", () => {
    // A11y testing with TestUtils
  });

  describe("Integration Scenarios", () => {
    // Component interaction testing
  });
});
```

## 🛠️ Mandatory Utility Usage

### **1. Mock Data Creation**

```typescript
// ❌ FORBIDDEN: Custom mock data
const mockUser = {
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  // ... 20 more lines
};

// ✅ REQUIRED: Use TestUtils
const mockUser = TestUtils.createMockPersonalInfo();
const customUser = TestUtils.createMockPersonalInfo({
  first_name: "Jane" // Only override what's needed
});
```

### **2. Callback Management**

```typescript
// ❌ FORBIDDEN: Individual stubs
const onClick = cy.stub();
const onSubmit = cy.stub();
const onChange = cy.stub();

// ✅ REQUIRED: Use centralized callbacks
const callbacks = TestUtils.createMockCallbacks();
// Automatically creates onClick, onSubmit, onChange, etc. with .as() aliases
```

### **3. Responsive Testing**

```typescript
// ❌ FORBIDDEN: Manual viewport iteration
const viewports = [{ width: 320, height: 568 }];
viewports.forEach(({ width, height }) => {
  cy.viewport(width, height);
  // ... test logic
});

// ✅ REQUIRED: Use TestUtils
TestUtils.testResponsiveLayout((viewport) => {
  cy.get('[data-testid="component"]').should("be.visible");
  // Additional viewport-specific assertions
});
```

### **4. Accessibility Testing**

```typescript
// ❌ FORBIDDEN: Manual accessibility checks
cy.get('button').should("be.visible");
cy.get('[tabindex]').should("exist");

// ✅ REQUIRED: Use TestUtils
TestUtils.testAccessibility('[data-testid="component"]');
```

## 📊 Test Coverage Requirements

### **1. Core Functionality (Required)**
- Component renders without errors
- All interactive elements respond to user actions
- State changes update UI correctly
- Props changes reflect in component behavior

### **2. Error States (Required)**
- Network failures are handled gracefully
- Invalid prop combinations don't crash component
- Loading states display correctly
- Error messages are user-friendly

### **3. Edge Cases (Required)**
- Empty/null data doesn't break component
- Extremely long text doesn't break layout
- Rapid user interactions don't cause issues
- Component cleanup happens properly

### **4. Integration Scenarios (Enhanced)**
- Parent-child component communication
- State synchronization between components
- Event propagation works correctly
- Context changes affect component properly

## 🚀 Performance Standards

### **Render Performance**
```typescript
// REQUIRED: Measure render times for heavy components
TestUtils.measureRenderTime('[data-testid="component"]', 2000); // Max 2s
```

### **Animation Performance**
```typescript
// REQUIRED: Test animations complete properly
TestUtils.waitForAnimation('[data-testid="animated-element"]');
```

## 🔒 Security Standards

### **XSS Prevention**
```typescript
// REQUIRED: Test with potentially malicious input
const maliciousData = TestUtils.createMockPersonalInfo({
  first_name: '<script>alert("xss")</script>'
});

cy.mount(<Component data={maliciousData} />);
cy.get('script').should("not.exist");
```

### **Input Sanitization**
```typescript
// REQUIRED: Verify dangerous content is sanitized
TestUtils.testFormValidation('[data-testid="form"]', [
  { field: 'email', invalidValue: 'javascript:alert(1)', expectedError: 'Invalid email' }
]);
```

## 🎨 Data-TestId Standards

### **Naming Convention**
```typescript
// REQUIRED: Semantic, descriptive names
data-testid="login-form"           ✅
data-testid="signup-button"        ✅
data-testid="error-message-email"  ✅
data-testid="loading-spinner"      ✅

data-testid="div-123"              ❌
data-testid="button-a"             ❌
data-testid="component"            ❌
```

### **Required Elements**
- **All buttons**: `data-testid="[action]-button"`
- **All forms**: `data-testid="[form-name]-form"`
- **All inputs**: `data-testid="input-[field-name]"`
- **All error states**: `data-testid="error-[context]"`
- **All loading states**: `data-testid="loading-[context]"`

## 🧪 Integration Testing Patterns

### **Component Communication**
```typescript
describe("Integration Scenarios", () => {
  it("should synchronize state between parent and child", () => {
    TestUtils.testStateSync(
      '[data-testid="parent-component"]',
      '[data-testid="child-component"]',
      () => cy.get('[data-testid="parent-input"]').type('test'),
      () => cy.get('[data-testid="child-display"]').should('contain', 'test')
    );
  });
});
```

### **Error Recovery**
```typescript
describe("Error Recovery", () => {
  it("should recover from network errors", () => {
    TestUtils.testErrorRecoveryFlow(
      '[data-testid="component"]',
      () => cy.intercept('POST', '/api/save', { forceNetworkError: true }),
      () => cy.get('[data-testid="retry-button"]').click(),
      () => cy.get('[data-testid="success-message"]').should('be.visible')
    );
  });
});
```

## 📈 Quality Metrics

### **Test Quality Score Calculation**

| Category | Weight | Criteria |
|----------|--------|----------|
| **Coverage** | 25% | Core functionality, errors, edge cases covered |
| **Integration** | 25% | Component interactions tested |
| **Performance** | 15% | Render times measured, animations tested |
| **Accessibility** | 15% | Keyboard nav, screen reader support |
| **Security** | 10% | XSS prevention, input sanitization |
| **Maintainability** | 10% | Uses shared utilities, clear naming |

**Target Score: 8.5+/10**

### **Automated Quality Checks**

```typescript
// REQUIRED: Include in every test file
describe("Quality Checks", () => {
  it("should meet performance standards", () => {
    TestUtils.measureRenderTime('[data-testid="component"]', 2000);
  });

  it("should be accessible", () => {
    TestUtils.testAccessibility();
  });

  it("should handle responsive layouts", () => {
    TestUtils.testResponsiveLayout(() => {
      cy.get('[data-testid="component"]').should('be.visible');
    });
  });
});
```

## 🚨 Anti-Patterns to Avoid

### **❌ Testing Implementation Details**
```typescript
// WRONG: Testing internal state
cy.get('[data-testid="component"]').should("have.class", "internal-state-class");

// CORRECT: Testing user-visible behavior
cy.get('[data-testid="success-message"]').should("be.visible");
```

### **❌ Over-Mocking**
```typescript
// WRONG: Mocking everything
cy.stub(window, 'fetch').returns(Promise.resolve({
  json: () => Promise.resolve({ data: 'mock' })
}));

// CORRECT: Use MSW for API mocking or test with real endpoints
cy.intercept('GET', '/api/data', { fixture: 'data.json' });
```

### **❌ Test Coupling**
```typescript
// WRONG: Tests depend on each other
it("should login", () => { /* login logic */ });
it("should show dashboard", () => { 
  // Assumes previous test logged in
});

// CORRECT: Independent tests
beforeEach(() => {
  // Setup fresh state for each test
});
```

## 📝 Test Documentation

### **Required Comments**
```typescript
describe("ComponentName", () => {
  // REQUIRED: Brief description of component purpose
  // This component handles user signature creation with 3 methods

  describe("Core Functionality", () => {
    it("should create template signature", () => {
      // REQUIRED: Explain complex test scenarios
      // Tests the full signature creation flow from method selection
      // through font selection to final confirmation
    });
  });
});
```

## 🔄 Continuous Improvement

### **Monthly Review Process**
1. **Analyze test metrics** - Performance, coverage, failure rates
2. **Update shared utilities** - Add new common patterns
3. **Review test quality scores** - Target improvements
4. **Update this document** - Incorporate learnings

### **Test Health Monitoring**
- **Flaky test detection** - Tests that fail intermittently
- **Performance regression** - Tests taking longer over time
- **Coverage gaps** - Untested code paths
- **Integration gaps** - Component interaction blind spots

## 🎯 Implementation Priority

### **Phase 1: Foundation (Completed)**
- ✅ Shared test utilities created
- ✅ Integration testing framework
- ✅ Enhanced test patterns documented

### **Phase 2: Migration (Current)**
- 🔄 Refactor existing component tests
- 🔄 Apply new standards to all tests
- 📋 Update CI/CD pipeline integration

### **Phase 3: Advanced (Future)**
- 📋 Visual regression testing
- 📋 Performance benchmarking
- 📋 Real device testing
- 📋 A11y automation

---

## 📚 Quick Reference

### **Essential Imports**
```typescript
import { TestUtils } from "../../../../cypress/support/test-utils";
import { IntegrationUtils } from "../../../../cypress/support/integration-utils";
```

### **Common Patterns**
```typescript
// Mock data
const mockData = TestUtils.createMockPersonalInfo();
const callbacks = TestUtils.createMockCallbacks();

// Responsive testing
TestUtils.testResponsiveLayout((viewport) => { /* assertions */ });

// Accessibility
TestUtils.testAccessibility('[data-testid="component"]');

// Form validation
TestUtils.testFormValidation('[data-testid="form"]', validationCases);

// Error states
TestUtils.testErrorStates('ComponentName', errorScenarios);
```

### **Quality Gates**
- **All tests must use TestUtils** for mock data
- **All interactive elements must have data-testid**
- **All components must include accessibility testing**
- **All forms must include validation testing**
- **All loading states must be tested**
- **All error conditions must be tested**

This document ensures consistent, high-quality component testing across the entire application while maximizing efficiency and maintainability.