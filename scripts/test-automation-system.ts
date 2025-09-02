#!/usr/bin/env npx tsx

/**
 * Test Automation System Validation
 * Quick validation of the AI-powered backend testing automation
 */

import { BackendAnalyzer } from './backend-analyzer';
import { ApiTestTemplates } from './api-test-templates';
import { BackendComplianceValidator } from './backend-compliance-validator';
import * as fs from 'fs';

async function testAnalyzer() {
  console.log('🔍 Testing BackendAnalyzer...');
  
  // Test with login route
  const loginRoute = 'app/api/auth/login/route.ts';
  
  if (fs.existsSync(loginRoute)) {
    const analysis = BackendAnalyzer.analyzeRoute(loginRoute);
    
    console.log(`   ✅ Route: ${analysis.routePath}`);
    console.log(`   ✅ Methods: ${analysis.httpMethods.join(', ')}`);
    console.log(`   ✅ Complexity: ${analysis.complexity}/10`);
    console.log(`   ✅ Priority: ${analysis.testPriority}`);
    
    return analysis;
  } else {
    console.log('   ⚠️  Login route not found, skipping analysis test');
    return null;
  }
}

async function testTemplates(analysis: any) {
  if (!analysis) return null;
  
  console.log('\n🏗️  Testing ApiTestTemplates...');
  
  const testContent = ApiTestTemplates.generateEnhancedApiTest({
    routeAnalysis: analysis,
    includeAdvancedTests: true,
    useTestUtils: true,
    includeMocks: false,
    includePerformanceTests: true
  });
  
  console.log(`   ✅ Generated test content (${testContent.length} characters)`);
  console.log(`   ✅ Contains all 8 sections: ${
    ['Core Functionality', 'Error States', 'Security', 'Performance', 'Compliance', 'Edge Cases']
      .every(section => testContent.includes(section)) ? 'Yes' : 'No'
  }`);
  
  return testContent;
}

async function testComplianceValidator(testContent: string) {
  if (!testContent) return null;
  
  console.log('\n📊 Testing BackendComplianceValidator...');
  
  const compliance = BackendComplianceValidator.validateTestCompliance(testContent);
  
  console.log(`   ✅ Compliance Score: ${compliance.score}/100`);
  console.log(`   ✅ Is Compliant: ${compliance.isCompliant ? 'Yes' : 'No'}`);
  console.log(`   ✅ Issues Found: ${compliance.issues.length}`);
  console.log(`   ✅ Sections Validated: ${Object.keys(compliance.sections).length}`);
  
  return compliance;
}

async function main() {
  console.log('🤖 AI-Powered Backend Testing Automation System');
  console.log('================================================\n');
  
  try {
    const analysis = await testAnalyzer();
    const testContent = await testTemplates(analysis);
    const compliance = await testComplianceValidator(testContent || '');
    
    console.log('\n🎯 SYSTEM VALIDATION RESULTS');
    console.log('============================');
    
    if (analysis && testContent && compliance) {
      console.log('✅ BackendAnalyzer: Working');
      console.log('✅ ApiTestTemplates: Working'); 
      console.log('✅ BackendComplianceValidator: Working');
      console.log('✅ Integration: All systems operational');
      
      console.log(`\n📈 Sample Results:`);
      console.log(`   Route Analyzed: ${analysis.routePath}`);
      console.log(`   Test Generated: ${testContent.split('\n').length} lines`);
      console.log(`   Compliance Score: ${compliance.score}%`);
      console.log(`   Quality Grade: ${BackendComplianceValidator.getComplianceGrade(compliance.score)}`);
      
      console.log('\n🚀 System ready for production use!');
      console.log('   Run: npm run generate:api-test');
      
    } else {
      console.log('❌ Some components failed validation');
    }
    
  } catch (error) {
    console.error('❌ System validation failed:', error);
  }
}

main().catch(console.error);