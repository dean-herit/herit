#!/usr/bin/env npx tsx

/**
 * Enhanced API Test Generator
 * Generates comprehensive backend tests using AI-powered analysis
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { BackendAnalyzer, RouteAnalysis } from './backend-analyzer';
import { ApiTestTemplates, TestGenerationOptions } from './api-test-templates';
import { BackendComplianceValidator, ComplianceResult } from './backend-compliance-validator';

interface ApiRouteInfo {
  name: string;
  path: string;
  directory: string;
  hasExistingTest: boolean;
  testPath?: string;
  analysis?: RouteAnalysis;
  compliance?: ComplianceResult;
}

interface GenerationStats {
  totalRoutes: number;
  testsGenerated: number;
  testsUpgraded: number;
  testsSkipped: number;
  averageCompliance: number;
  highPriorityRoutes: number;
}

// =============================================================================
// ROUTE DISCOVERY
// =============================================================================

async function discoverApiRoutes(): Promise<ApiRouteInfo[]> {
  console.log('🔍 Scanning for API routes...');
  
  const routePaths = await glob('app/api/**/route.ts', { 
    ignore: ['node_modules/**', '.next/**'],
    absolute: true 
  });
  
  console.log(`📊 Found ${routePaths.length} API routes`);
  
  return routePaths.map(filePath => {
    const name = path.basename(path.dirname(filePath));
    const directory = path.dirname(filePath);
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Generate test path
    const testDir = directory.replace('app/api', 'tests/api');
    const testPath = path.join(testDir, `${name}.test.ts`);
    
    return {
      name,
      path: filePath,
      directory,
      hasExistingTest: fs.existsSync(testPath),
      testPath,
    };
  });
}

// =============================================================================
// COMMAND LINE PARSING
// =============================================================================

interface CliOptions {
  missingOnly: boolean;
  upgrade: boolean;
  pattern?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  dryRun: boolean;
  verbose: boolean;
  compliance: boolean;
  force: boolean;
}

function parseCliOptions(): CliOptions {
  const args = process.argv.slice(2);
  
  return {
    missingOnly: args.includes('--missing-only'),
    upgrade: args.includes('--upgrade'),
    pattern: args.find(arg => arg.startsWith('--pattern='))?.split('=')[1],
    priority: args.find(arg => arg.startsWith('--priority='))?.split('=')[1] as any,
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    compliance: args.includes('--compliance'),
    force: args.includes('--force'),
  };
}

function printUsage() {
  console.log(`
🚀 Enhanced API Test Generator
==============================

Usage: npm run generate:api-test [options]

Options:
  --missing-only        Only generate tests for routes without existing tests
  --upgrade            Upgrade existing tests to enhanced standards
  --pattern=PATTERN    Only process routes matching pattern (glob)
  --priority=LEVEL     Only process routes with specific priority (critical|high|medium|low)
  --dry-run           Show what would be generated without creating files
  --verbose, -v       Show detailed output
  --compliance        Run compliance validation after generation
  --force             Overwrite existing tests without backup
  --help, -h          Show this help message

Examples:
  npm run generate:api-test --missing-only
  npm run generate:api-test --pattern="**/auth/**"
  npm run generate:api-test --priority=critical --upgrade
  npm run generate:api-test --dry-run --verbose
`);
}

// =============================================================================
// TEST GENERATION
// =============================================================================

async function generateEnhancedTest(route: ApiRouteInfo, options: CliOptions): Promise<string> {
  console.log(`  🔍 Analyzing ${route.name}...`);
  
  // Analyze the route
  route.analysis = BackendAnalyzer.analyzeRoute(route.path);
  
  if (options.verbose) {
    console.log(`    📊 Route: ${route.analysis.routePath}`);
    console.log(`    📊 Methods: ${route.analysis.httpMethods.join(', ')}`);
    console.log(`    📊 Auth: ${route.analysis.authentication}`);
    console.log(`    📊 Complexity: ${route.analysis.complexity}/10`);
    console.log(`    📊 Priority: ${route.analysis.testPriority}`);
  }
  
  // Generate test content
  const testOptions: TestGenerationOptions = {
    routeAnalysis: route.analysis,
    includeAdvancedTests: true,
    useTestUtils: true,
    includeMocks: route.analysis.externalServices.length > 0,
    includePerformanceTests: route.analysis.complexity > 3,
  };
  
  const testContent = ApiTestTemplates.generateEnhancedApiTest(testOptions);
  
  // Validate compliance
  route.compliance = BackendComplianceValidator.validateTestCompliance(testContent);
  
  console.log(`    ✨ Generated enhanced test with ${Object.keys(route.compliance.sections).length} sections`);
  console.log(`    📊 Compliance score: ${route.compliance.score}%`);
  
  return testContent;
}

async function createTestFile(route: ApiRouteInfo, content: string, options: CliOptions): Promise<void> {
  if (!route.testPath) return;
  
  const testDir = path.dirname(route.testPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Create backup if file exists and not forced
  if (route.hasExistingTest && !options.force) {
    const backupPath = route.testPath.replace('.test.ts', '.test.backup.ts');
    fs.copyFileSync(route.testPath, backupPath);
    console.log(`    💾 Created backup: ${path.relative(process.cwd(), backupPath)}`);
  }
  
  // Write test file
  fs.writeFileSync(route.testPath, content, 'utf-8');
  
  const relativePath = path.relative(process.cwd(), route.testPath);
  console.log(`    ✅ ${route.hasExistingTest ? 'Upgraded' : 'Created'}: ${relativePath}`);
}

// =============================================================================
// FILTERING & VALIDATION
// =============================================================================

function filterRoutes(routes: ApiRouteInfo[], options: CliOptions): ApiRouteInfo[] {
  let filtered = routes;
  
  // Filter by missing only
  if (options.missingOnly) {
    filtered = filtered.filter(route => !route.hasExistingTest);
    console.log(`🔍 Filtering to missing tests only: ${filtered.length} routes`);
  }
  
  // Filter by pattern
  if (options.pattern) {
    const pattern = new RegExp(options.pattern.replace(/\*/g, '.*'));
    filtered = filtered.filter(route => pattern.test(route.path));
    console.log(`🔍 Filtering by pattern "${options.pattern}": ${filtered.length} routes`);
  }
  
  // Filter by priority (requires analysis)
  if (options.priority) {
    filtered = filtered.filter(route => {
      if (!route.analysis) {
        route.analysis = BackendAnalyzer.analyzeRoute(route.path);
      }
      return route.analysis.testPriority === options.priority;
    });
    console.log(`🔍 Filtering by priority "${options.priority}": ${filtered.length} routes`);
  }
  
  return filtered;
}

function validateExistingTest(route: ApiRouteInfo): ComplianceResult | null {
  if (!route.hasExistingTest || !route.testPath) return null;
  
  try {
    const testContent = fs.readFileSync(route.testPath, 'utf-8');
    return BackendComplianceValidator.validateTestCompliance(testContent);
  } catch (error) {
    console.warn(`⚠️  Could not validate existing test for ${route.name}: ${error}`);
    return null;
  }
}

// =============================================================================
// REPORTING & STATISTICS
// =============================================================================

function generateStats(routes: ApiRouteInfo[], results: { route: ApiRouteInfo; generated: boolean; upgraded: boolean }[]): GenerationStats {
  const totalRoutes = routes.length;
  const testsGenerated = results.filter(r => r.generated && !r.upgraded).length;
  const testsUpgraded = results.filter(r => r.upgraded).length;
  const testsSkipped = totalRoutes - testsGenerated - testsUpgraded;
  
  const complianceScores = routes
    .map(r => r.compliance?.score)
    .filter(score => score !== undefined) as number[];
  
  const averageCompliance = complianceScores.length > 0 
    ? Math.round(complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length)
    : 0;
  
  const highPriorityRoutes = routes.filter(r => 
    r.analysis && ['critical', 'high'].includes(r.analysis.testPriority)
  ).length;
  
  return {
    totalRoutes,
    testsGenerated,
    testsUpgraded,
    testsSkipped,
    averageCompliance,
    highPriorityRoutes,
  };
}

function printSummaryReport(stats: GenerationStats, routes: ApiRouteInfo[]) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 GENERATION SUMMARY REPORT');
  console.log('='.repeat(50));
  
  console.log(`📋 Total API Routes: ${stats.totalRoutes}`);
  console.log(`✨ Tests Generated: ${stats.testsGenerated}`);
  console.log(`🔧 Tests Upgraded: ${stats.testsUpgraded}`);
  console.log(`⏭️  Tests Skipped: ${stats.testsSkipped}`);
  console.log(`📊 Average Compliance: ${stats.averageCompliance}%`);
  console.log(`🎯 High Priority Routes: ${stats.highPriorityRoutes}`);
  
  // Show compliance distribution
  const complianceGrades = routes
    .filter(r => r.compliance)
    .map(r => BackendComplianceValidator.getComplianceGrade(r.compliance!.score));
  
  if (complianceGrades.length > 0) {
    console.log('\n📈 Compliance Distribution:');
    const gradeCounts = complianceGrades.reduce((acc, grade) => {
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(gradeCounts).forEach(([grade, count]) => {
      console.log(`   ${grade}: ${count} tests`);
    });
  }
  
  // Show low-compliance routes
  const lowComplianceRoutes = routes.filter(r => r.compliance && r.compliance.score < 85);
  if (lowComplianceRoutes.length > 0) {
    console.log('\n⚠️  Routes needing attention:');
    lowComplianceRoutes.forEach(route => {
      console.log(`   ${route.analysis?.routePath}: ${route.compliance?.score}%`);
    });
  }
}

function printDetailedReport(routes: ApiRouteInfo[], options: CliOptions) {
  if (!options.verbose && !options.compliance) return;
  
  console.log('\n' + '='.repeat(50));
  console.log('🔍 DETAILED ANALYSIS REPORT');
  console.log('='.repeat(50));
  
  routes.forEach(route => {
    if (!route.analysis) return;
    
    console.log(`\n📍 ${route.analysis.routePath}`);
    console.log(`   Methods: ${route.analysis.httpMethods.join(', ')}`);
    console.log(`   Auth: ${route.analysis.authentication}`);
    console.log(`   Complexity: ${route.analysis.complexity}/10`);
    console.log(`   Priority: ${route.analysis.testPriority}`);
    console.log(`   DB Ops: ${route.analysis.databaseOperations.length}`);
    console.log(`   External Services: ${route.analysis.externalServices.length}`);
    
    if (route.compliance && options.compliance) {
      console.log(`   Compliance: ${route.compliance.score}% (${BackendComplianceValidator.getComplianceGrade(route.compliance.score)})`);
      
      if (route.compliance.issues.length > 0) {
        const errorCount = route.compliance.issues.filter(i => i.type === 'error').length;
        const warningCount = route.compliance.issues.filter(i => i.type === 'warning').length;
        console.log(`   Issues: ${errorCount} errors, ${warningCount} warnings`);
      }
    }
  });
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  const options = parseCliOptions();
  
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    return;
  }
  
  console.log('🚀 Enhanced API Test Generator');
  console.log('===============================');
  
  try {
    // Discover routes
    const allRoutes = await discoverApiRoutes();
    
    if (allRoutes.length === 0) {
      console.log('❌ No API routes found. Make sure you\'re in the project root.');
      return;
    }
    
    // Filter routes based on options
    const routes = filterRoutes(allRoutes, options);
    
    if (routes.length === 0) {
      console.log('ℹ️  No routes match the specified criteria.');
      return;
    }
    
    console.log('');
    
    const results: { route: ApiRouteInfo; generated: boolean; upgraded: boolean }[] = [];
    
    // Process each route
    for (const route of routes) {
      console.log(`📝 Processing ${route.name}...`);
      
      try {
        // Check if we should skip this route
        if (options.missingOnly && route.hasExistingTest) {
          console.log('    ℹ️  Test already exists');
          results.push({ route, generated: false, upgraded: false });
          continue;
        }
        
        // Validate existing test if upgrading
        if (options.upgrade && route.hasExistingTest) {
          console.log('    🔍 Validating existing test...');
          const existingCompliance = validateExistingTest(route);
          
          if (existingCompliance && existingCompliance.score >= 90) {
            console.log('    ✅ Test already meets enhanced standards');
            route.compliance = existingCompliance;
            results.push({ route, generated: false, upgraded: false });
            continue;
          }
          
          console.log('    ⚠️  Test compliance: ${existingCompliance?.score || 0}% (needs upgrade)');
          console.log('    🔧 Upgrading existing test to enhanced standards...');
        }
        
        // Generate test content
        const testContent = await generateEnhancedTest(route, options);
        
        if (options.dryRun) {
          console.log('    👁️  Dry run - test content ready');
        } else {
          await createTestFile(route, testContent, options);
        }
        
        const wasUpgrade = options.upgrade && route.hasExistingTest;
        results.push({ 
          route, 
          generated: !wasUpgrade, 
          upgraded: wasUpgrade 
        });
        
        console.log(`    🏆 Enhanced standards achieved!`);
        
      } catch (error) {
        console.error(`    ❌ Failed to process ${route.name}: ${error}`);
        results.push({ route, generated: false, upgraded: false });
      }
      
      console.log('');
    }
    
    // Generate reports
    const stats = generateStats(allRoutes, results);
    printSummaryReport(stats, routes);
    printDetailedReport(routes, options);
    
    // Final compliance check
    if (options.compliance && !options.dryRun) {
      const lowComplianceCount = routes.filter(r => r.compliance && r.compliance.score < 85).length;
      
      if (lowComplianceCount > 0) {
        console.log(`\n⚠️  ${lowComplianceCount} routes have compliance issues. Run with --upgrade to fix.`);
        process.exit(1);
      } else {
        console.log('\n✅ All generated tests meet enhanced standards!');
      }
    }
    
    console.log('\n🎉 Generation complete!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);