# Herit Component Tests Repair Plan

## Overview

**Total Component Tests:** 38 files (removed Apple & GitHub Sign-In)  
**Current Status:** 34 stub tests, 4 working tests  
**Goal:** 38 fully functional component tests with meaningful assertions

## Test Status Categories

### 🟢 WORKING TESTS (7/38)

Tests that are fully implemented and passing all assertions.

- [ ] ✅ `app/components/beneficiaries/BeneficiaryCard.cy.tsx` - **COMPLETE** (12 tests passing)
- [ ] ✅ `app/components/ui/ErrorBoundary.cy.tsx` - Basic tests passing (4 tests)
- [ ] ✅ `app/components/beneficiaries/BeneficiaryList.cy.tsx` - Basic tests passing (4 tests)
- [ ] ✅ `app/components/auth/LoginForm.cy.tsx` - **COMPLETE** (8 tests passing)
- [ ] ✅ `app/components/auth/EmailLoginForm.cy.tsx` - **COMPLETE** (9 tests passing)
- [ ] ✅ `app/components/auth/EmailSignupForm.cy.tsx` - **COMPLETE** (12 tests passing)
- [ ] ✅ `app/components/auth/GoogleSignInButton.cy.tsx` - **COMPLETE** (9 tests passing)

### 🚧 STUB TESTS (31/38)

Auto-generated test stubs with commented-out assertions that need full implementation.

## Priority Repair Order

### 🟥 CRITICAL PRIORITY - Authentication & Core Flow

These tests cover essential user authentication and onboarding flows.

1. - [ ] `app/components/auth/LoginForm.cy.tsx` - **FIX BROKEN** - Auth mocking issues
2. - [ ] `app/components/auth/EmailLoginForm.cy.tsx` - Login form functionality
3. - [ ] `app/components/auth/EmailSignupForm.cy.tsx` - Signup form functionality
4. - [ ] `app/components/auth/GoogleSignInButton.cy.tsx` - OAuth integration
5. - [ ] `app/components/auth/ProtectedRoute.cy.tsx` - Route protection
6. - [ ] `app/components/auth/AuthErrorHandler.cy.tsx` - Error handling

### 🟧 HIGH PRIORITY - Onboarding Flow

Critical path for new user completion.

9. - [ ] `app/(auth)/onboarding/components/PersonalInfoStep.cy.tsx` - Personal info collection
10. - [ ] `app/(auth)/onboarding/components/SignatureStep.cy.tsx` - Signature capture
11. - [ ] `app/(auth)/onboarding/components/SignatureStamp.cy.tsx` - Signature validation
12. - [ ] `app/components/auth/SignatureCanvas.cy.tsx` - Canvas functionality
13. - [ ] `app/(auth)/onboarding/components/LegalConsentStep.cy.tsx` - Legal consent
14. - [ ] `app/(auth)/onboarding/components/VerificationStep.cy.tsx` - KYC verification

### 🟨 HIGH PRIORITY - Dashboard & Core Features

Main application functionality.

15. - [ ] `app/(dashboard)/dashboard/DashboardClient.cy.tsx` - Main dashboard
16. - [ ] `app/(dashboard)/will/WillClient.cy.tsx` - Will management
17. - [ ] `app/components/beneficiaries/BeneficiaryForm.cy.tsx` - Add/edit beneficiaries
18. - [ ] `app/components/beneficiaries/BeneficiaryPhotoInput.cy.tsx` - Photo upload
19. - [ ] `app/components/documents/DocumentManager.cy.tsx` - Document handling
20. - [ ] `app/components/documents/DocumentUploadZone.cy.tsx` - File uploads

### 🟡 MEDIUM PRIORITY - Rules & Advanced Features

Estate planning rules and complex features.

21. - [ ] `app/(dashboard)/rules/components/CreateRuleModal.cy.tsx` - Rule creation
22. - [ ] `app/(dashboard)/rules/components/EditRuleModal.cy.tsx` - Rule editing
23. - [ ] `app/(dashboard)/rules/components/ViewRuleModal.cy.tsx` - Rule viewing
24. - [ ] `app/(dashboard)/rules/components/RuleConditionsDisplay.cy.tsx` - Conditions display

### 🟢 MEDIUM PRIORITY - Shared Components

Reusable components across the application.

25. - [ ] `app/components/shared/SharedPersonalInfoForm.cy.tsx` - Personal info form
26. - [ ] `app/components/shared/SharedPersonalInfoFormProvider.cy.tsx` - Form provider
27. - [ ] `app/components/shared/SharedPhotoUpload.cy.tsx` - Photo upload component

### 🔵 LOWER PRIORITY - Layout & Navigation

Visual and navigation components.

28. - [ ] `app/components/layout/navbar.cy.tsx` - Navigation bar
29. - [ ] `app/components/layout/navbar-user-menu.cy.tsx` - User menu
30. - [ ] `app/components/layout/LayoutWrapper.cy.tsx` - Layout wrapper
31. - [ ] `app/components/dashboard/DashboardLayout.cy.tsx` - Dashboard layout

### 🟣 LOWER PRIORITY - UI Components

Basic UI elements and utilities.

32. - [ ] `app/components/ui/VerticalSteps.cy.tsx` - Step indicator
33. - [ ] `app/components/ui/theme-switch.cy.tsx` - Theme switching
34. - [ ] `app/components/ui/icons.cy.tsx` - Icon components
35. - [ ] `app/components/branding/HeritLogo.cy.tsx` - Logo component

### 🔘 LOWEST PRIORITY - Infrastructure & Examples

Core infrastructure and example components.

36. - [ ] `app/_lib/QueryProvider.cy.tsx` - React Query setup
37. - [ ] `app/_lib/providers.cy.tsx` - Provider components
38. - [ ] `app/components/pages/HomePageClient.cy.tsx` - Home page
39. - [ ] `app/components/examples/counter.cy.tsx` - **DELETE** - Example component
40. - [ ] (Any additional test files discovered)

## Common Issues to Fix

### Import Path Issues

- ✅ **RESOLVED** - All `@/types/` imports have been fixed to `@/app/types/`
- Check for missing component imports
- Verify type imports are correct

### Stub Test Pattern (36 files need this)

All stub tests have this pattern that needs implementation:

```typescript
// CURRENT STUB PATTERN:
it("renders without crashing", () => {
  cy.mount(<Component />);
  // Basic rendering test
  // Add basic rendering assertions
  // cy.get('[data-testid*=""]').should("be.visible");
});
```

**NEEDS TO BECOME:**

```typescript
// PROPER IMPLEMENTATION:
it("renders without crashing", () => {
  cy.mount(<Component {...requiredProps} />);

  cy.get('[data-testid="component-name"]').should("be.visible");
  cy.contains("Expected Text").should("be.visible");
  // Actual meaningful assertions
});
```

### Authentication Test Issues

- Mock `useAuth` hook properly
- Mock authentication state
- Test login/logout flows
- Handle authentication redirects

### Component-Specific Requirements

**Forms:**

- Mock form validation (Zod schemas)
- Test form submission
- Test error states
- Test field validation

**Modals:**

- Test open/close behavior
- Test backdrop clicks
- Test escape key handling

**Data Components:**

- Mock API calls with MSW
- Test loading states
- Test error states
- Test data display

**File Uploads:**

- Mock file handling
- Test drag-and-drop
- Test file validation
- Test upload progress

## Implementation Strategy

### Phase 1: Fix Critical (Items 1-8)

Focus on authentication flow - most important for app functionality.

### Phase 2: Complete High Priority (Items 9-20)

Onboarding and core dashboard features.

### Phase 3: Advanced Features (Items 21-27)

Rules engine and shared components.

### Phase 4: Polish (Items 28-40)

Layout, UI components, and infrastructure.

## Success Metrics

- [ ] **Authentication Flow:** 8/8 tests passing with real user scenarios
- [ ] **Onboarding Flow:** 6/6 tests covering complete user journey
- [ ] **Core Features:** 6/6 tests for beneficiaries, documents, dashboard
- [ ] **Advanced Features:** 7/7 tests for rules and shared components
- [ ] **Infrastructure:** 13/13 tests for UI, layout, and supporting features

**Final Goal:** 40/40 component tests passing with meaningful assertions and real user interaction coverage.

## Notes

- Each test should follow the BeneficiaryCard.cy.tsx pattern as a reference
- Use `cypress-real-events` for realistic user interactions
- Include accessibility tests for all interactive components
- Test responsive layouts across mobile/tablet/desktop
- Mock external dependencies (APIs, auth, file uploads) properly
