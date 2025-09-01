#!/bin/bash

# Script to run all Cypress component tests and collect results
echo "# Cypress Component Test Results" > test-results.md
echo "Generated on: $(date)" >> test-results.md
echo "" >> test-results.md

# Array of all test files
tests=(
    "app/_lib/providers.cy.tsx"
    "app/_lib/QueryProvider.cy.tsx"
    "app/components/ui/theme-switch.cy.tsx"
    "app/components/ui/icons.cy.tsx"
    "app/components/ui/VerticalSteps.cy.tsx"
    "app/components/ui/ErrorBoundary.cy.tsx"
    "app/components/branding/HeritLogo.cy.tsx"
    "app/components/auth/AuthErrorHandler.cy.tsx"
    "app/components/auth/LoginForm.cy.tsx"
    "app/components/auth/EmailLoginForm.cy.tsx"
    "app/components/auth/SignatureCanvas.cy.tsx"
    "app/components/auth/GithubSignInButton.cy.tsx"
    "app/components/auth/ProtectedRoute.cy.tsx"
    "app/components/auth/EmailSignupForm.cy.tsx"
    "app/components/auth/AppleSignInButton.cy.tsx"
    "app/components/auth/GoogleSignInButton.cy.tsx"
    "app/components/layout/LayoutWrapper.cy.tsx"
    "app/components/layout/navbar-user-menu.cy.tsx"
    "app/components/layout/navbar.cy.tsx"
    "app/components/beneficiaries/BeneficiaryList.cy.tsx"
    "app/components/beneficiaries/BeneficiaryForm.cy.tsx"
    "app/components/beneficiaries/BeneficiaryPhotoInput.cy.tsx"
    "app/components/shared/SharedPersonalInfoFormProvider.cy.tsx"
    "app/components/shared/SharedPersonalInfoForm.cy.tsx"
    "app/components/shared/SharedPhotoUpload.cy.tsx"
    "app/components/dashboard/DashboardLayout.cy.tsx"
    "app/components/examples/counter.cy.tsx"
    "app/components/documents/DocumentManager.cy.tsx"
    "app/components/documents/DocumentUploadZone.cy.tsx"
    "app/components/pages/HomePageClient.cy.tsx"
    "app/(auth)/onboarding/components/SignatureStep.cy.tsx"
    "app/(auth)/onboarding/components/SignatureStamp.cy.tsx"
    "app/(auth)/onboarding/components/PersonalInfoStep.cy.tsx"
    "app/(auth)/onboarding/components/LegalConsentStep.cy.tsx"
    "app/(auth)/onboarding/components/VerificationStep.cy.tsx"
    "app/(dashboard)/dashboard/DashboardClient.cy.tsx"
    "app/(dashboard)/will/WillClient.cy.tsx"
    "app/(dashboard)/rules/components/EditRuleModal.cy.tsx"
    "app/(dashboard)/rules/components/ViewRuleModal.cy.tsx"
    "app/(dashboard)/rules/components/CreateRuleModal.cy.tsx"
    "app/(dashboard)/rules/components/RuleConditionsDisplay.cy.tsx"
    "app/components/beneficiaries/BeneficiaryCard.cy.tsx"
)

# Counters
total=0
passed=0
failed=0
timeout=0
zero_tests=0

echo "## Summary" >> test-results.md
echo "" >> test-results.md

# Detailed results
echo "## Detailed Results" >> test-results.md
echo "" >> test-results.md

for test in "${tests[@]}"; do
    echo "Running $test..."
    total=$((total + 1))
    
    # Run test with 30 second timeout
    timeout 30 npx cypress run --component --spec "$test" --headless > temp_result.txt 2>&1
    exit_code=$?
    
    # Parse results
    if [ $exit_code -eq 124 ]; then
        # Timeout
        timeout=$((timeout + 1))
        echo "⏰ **TIMEOUT**: \`$test\`" >> test-results.md
        echo "- Test exceeded 30 second timeout" >> test-results.md
        echo "" >> test-results.md
    elif grep -q "✔  All specs passed!" temp_result.txt; then
        # All tests passed
        passed=$((passed + 1))
        test_count=$(grep -o "[0-9]\+ passing" temp_result.txt | head -1 | grep -o "[0-9]\+")
        echo "✅ **PASS**: \`$test\`" >> test-results.md
        echo "- Tests: $test_count passing, 0 failing" >> test-results.md
        echo "" >> test-results.md
    elif grep -q "0 passing" temp_result.txt && grep -q "0 failing" temp_result.txt; then
        # No tests found
        zero_tests=$((zero_tests + 1))
        echo "🚫 **NO TESTS**: \`$test\`" >> test-results.md
        echo "- File contains 0 tests" >> test-results.md
        echo "" >> test-results.md
    else
        # Tests failed
        failed=$((failed + 1))
        passing_count=$(grep -o "[0-9]\+ passing" temp_result.txt | head -1 | grep -o "[0-9]\+" || echo "0")
        failing_count=$(grep -o "[0-9]\+ failing" temp_result.txt | head -1 | grep -o "[0-9]\+" || echo "0")
        
        echo "❌ **FAIL**: \`$test\`" >> test-results.md
        echo "- Tests: $passing_count passing, $failing_count failing" >> test-results.md
        
        # Extract error details
        if grep -q "Error:" temp_result.txt; then
            echo "- **Error Details:**" >> test-results.md
            grep -A 5 "Error:" temp_result.txt | head -10 | sed 's/^/  /' >> test-results.md
        fi
        echo "" >> test-results.md
    fi
    
    rm -f temp_result.txt
done

# Generate summary
echo "## Test Summary" >> test-results-summary.md
echo "" >> test-results-summary.md
echo "**Total Tests:** $total" >> test-results-summary.md
echo "" >> test-results-summary.md
echo "| Status | Count | Percentage |" >> test-results-summary.md
echo "|--------|-------|------------|" >> test-results-summary.md
echo "| ✅ Pass | $passed | $((passed * 100 / total))% |" >> test-results-summary.md
echo "| ❌ Fail | $failed | $((failed * 100 / total))% |" >> test-results-summary.md
echo "| ⏰ Timeout | $timeout | $((timeout * 100 / total))% |" >> test-results-summary.md
echo "| 🚫 No Tests | $zero_tests | $((zero_tests * 100 / total))% |" >> test-results-summary.md

# Combine results
cat test-results-summary.md test-results.md > final-test-report.md

echo "Complete! Results saved to final-test-report.md"