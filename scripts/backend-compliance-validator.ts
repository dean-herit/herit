/**
 * Backend Compliance Validator
 * Validates generated backend tests against enhanced standards and provides scoring
 */

export interface ComplianceIssue {
  type: 'error' | 'warning' | 'suggestion';
  section: string;
  message: string;
  fix?: string;
  line?: number;
}

export interface SectionCompliance {
  present: boolean;
  quality: number; // 0-100
  testCount: number;
  issues: ComplianceIssue[];
}

export interface ComplianceResult {
  isCompliant: boolean;
  score: number; // 0-100
  maxScore: number;
  issues: ComplianceIssue[];
  sections: {
    [key: string]: SectionCompliance;
  };
  recommendations: string[];
}

export interface BackendComplianceRules {
  requiredSections: string[];
  testUtilsUsage: boolean;
  authenticationTests: boolean;
  securityTests: boolean;
  performanceTests: boolean;
  databaseTests: boolean;
  errorHandlingTests: boolean;
  minimumTestsPerSection: number;
  expectedImports: string[];
}

export class BackendComplianceValidator {
  private static readonly DEFAULT_RULES: BackendComplianceRules = {
    requiredSections: [
      'Core Functionality',
      'Error States',
      'Security',
      'Performance',
      'Database Integrity',
      'Integration Scenarios',
      'Compliance',
      'Edge Cases'
    ],
    testUtilsUsage: true,
    authenticationTests: true,
    securityTests: true,
    performanceTests: true,
    databaseTests: true,
    errorHandlingTests: true,
    minimumTestsPerSection: 1,
    expectedImports: [
      'BackendTestUtils',
      'describe',
      'it',
      'expect',
      'beforeEach',
      'afterEach',
      'vi'
    ]
  };

  private static extractSections(testContent: string): { [key: string]: string } {
    const sections: { [key: string]: string } = {};
    const lines = testContent.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for section start
      const sectionMatch = line.match(/describe\s*\(\s*["'`]([^"'`]+)["'`]/);
      if (sectionMatch) {
        // Save previous section if exists
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n');
        }
        
        // Start new section
        currentSection = sectionMatch[1];
        currentContent = [line];
      } else if (currentSection) {
        currentContent.push(line);
        
        // Check for section end (closing brace with minimal indentation)
        if (line.trim() === '});' && line.indexOf('}') <= 2) {
          sections[currentSection] = currentContent.join('\n');
          currentSection = '';
          currentContent = [];
        }
      }
    }

    // Save last section if exists
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n');
    }

    return sections;
  }

  private static validateSection(
    sectionName: string, 
    content: string, 
    rules: BackendComplianceRules
  ): SectionCompliance {
    const issues: ComplianceIssue[] = [];
    let quality = 100;
    const testCount = (content.match(/it\s*\(/g) || []).length;

    // Check minimum test count
    if (testCount < rules.minimumTestsPerSection) {
      issues.push({
        type: 'warning',
        section: sectionName,
        message: `Section has ${testCount} tests, minimum ${rules.minimumTestsPerSection} required`,
        fix: `Add more test cases to ${sectionName} section`
      });
      quality -= 20;
    }

    // Section-specific validations
    switch (sectionName) {
      case 'Core Functionality':
        if (!content.includes('response.status')) {
          issues.push({
            type: 'error',
            section: sectionName,
            message: 'Core functionality tests must validate HTTP status codes',
            fix: 'Add expect(response.status).toBe(200) or similar assertions'
          });
          quality -= 30;
        }
        break;

      case 'Security':
        if (!content.includes('authentication') && !content.includes('401')) {
          issues.push({
            type: 'error',
            section: sectionName,
            message: 'Security tests must include authentication validation',
            fix: 'Add tests for unauthorized access (401 responses)'
          });
          quality -= 25;
        }
        
        if (!content.includes('injection') && !content.includes('XSS')) {
          issues.push({
            type: 'warning',
            section: sectionName,
            message: 'Security tests should include injection/XSS prevention tests',
            fix: 'Add tests for SQL injection and XSS prevention'
          });
          quality -= 15;
        }
        break;

      case 'Performance':
        if (!content.includes('responseTime') && !content.includes('performance')) {
          issues.push({
            type: 'error',
            section: sectionName,
            message: 'Performance tests must measure response time',
            fix: 'Add response time measurements using measureApiResponseTime'
          });
          quality -= 30;
        }
        break;

      case 'Database Integrity':
        if (!content.includes('transaction') && !content.includes('audit')) {
          issues.push({
            type: 'warning',
            section: sectionName,
            message: 'Database tests should validate transactions and audit logs',
            fix: 'Add transaction rollback and audit logging tests'
          });
          quality -= 20;
        }
        break;

      case 'Error States':
        if (!content.includes('400') && !content.includes('error')) {
          issues.push({
            type: 'error',
            section: sectionName,
            message: 'Error handling tests must validate error status codes',
            fix: 'Add tests for 400, 404, 500 error responses'
          });
          quality -= 25;
        }
        break;
    }

    // Check for BackendTestUtils usage
    if (rules.testUtilsUsage && !content.includes('BackendTestUtils')) {
      issues.push({
        type: 'warning',
        section: sectionName,
        message: 'Section should use BackendTestUtils for consistency',
        fix: 'Replace manual mocking with BackendTestUtils methods'
      });
      quality -= 15;
    }

    return {
      present: true,
      quality: Math.max(0, quality),
      testCount,
      issues
    };
  }

  private static validateImports(testContent: string, rules: BackendComplianceRules): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const importSection = testContent.split('\n').slice(0, 20).join('\n');

    rules.expectedImports.forEach(expectedImport => {
      if (!importSection.includes(expectedImport)) {
        issues.push({
          type: 'warning',
          section: 'imports',
          message: `Missing expected import: ${expectedImport}`,
          fix: `Add import for ${expectedImport}`
        });
      }
    });

    return issues;
  }

  private static validateTestStructure(testContent: string): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    // Check for proper describe/it nesting
    const describeMatches = testContent.match(/describe\s*\(/g) || [];
    const itMatches = testContent.match(/it\s*\(/g) || [];

    if (describeMatches.length === 0) {
      issues.push({
        type: 'error',
        section: 'structure',
        message: 'Test file must contain at least one describe block',
        fix: 'Wrap tests in describe blocks'
      });
    }

    if (itMatches.length === 0) {
      issues.push({
        type: 'error',
        section: 'structure',
        message: 'Test file must contain at least one test case',
        fix: 'Add it() test cases'
      });
    }

    // Check for setup/teardown
    if (!testContent.includes('beforeEach') && !testContent.includes('beforeAll')) {
      issues.push({
        type: 'suggestion',
        section: 'structure',
        message: 'Consider adding setup hooks (beforeEach/beforeAll)',
        fix: 'Add beforeEach for test data setup'
      });
    }

    return issues;
  }

  private static calculateOverallScore(sections: { [key: string]: SectionCompliance }): number {
    const sectionScores = Object.values(sections);
    if (sectionScores.length === 0) return 0;

    const totalScore = sectionScores.reduce((sum, section) => sum + section.quality, 0);
    return Math.round(totalScore / sectionScores.length);
  }

  private static generateRecommendations(result: ComplianceResult): string[] {
    const recommendations: string[] = [];

    if (result.score < 70) {
      recommendations.push('Consider regenerating tests with enhanced templates');
    }

    if (result.score < 85) {
      recommendations.push('Review and fix compliance issues before committing');
    }

    const missingSections = Object.entries(result.sections)
      .filter(([_, section]) => !section.present)
      .map(([name, _]) => name);

    if (missingSections.length > 0) {
      recommendations.push(`Add missing sections: ${missingSections.join(', ')}`);
    }

    const lowQualitySections = Object.entries(result.sections)
      .filter(([_, section]) => section.present && section.quality < 70)
      .map(([name, _]) => name);

    if (lowQualitySections.length > 0) {
      recommendations.push(`Improve quality in: ${lowQualitySections.join(', ')}`);
    }

    return recommendations;
  }

  static validateTestCompliance(
    testContent: string, 
    rules: BackendComplianceRules = this.DEFAULT_RULES
  ): ComplianceResult {
    const allIssues: ComplianceIssue[] = [];
    const sections: { [key: string]: SectionCompliance } = {};

    // Extract sections from test content
    const extractedSections = this.extractSections(testContent);

    // Validate each required section
    rules.requiredSections.forEach(sectionName => {
      if (extractedSections[sectionName]) {
        sections[sectionName] = this.validateSection(
          sectionName, 
          extractedSections[sectionName], 
          rules
        );
        allIssues.push(...sections[sectionName].issues);
      } else {
        sections[sectionName] = {
          present: false,
          quality: 0,
          testCount: 0,
          issues: [{
            type: 'error',
            section: sectionName,
            message: `Missing required section: ${sectionName}`,
            fix: `Add ${sectionName} describe block with appropriate tests`
          }]
        };
        allIssues.push(...sections[sectionName].issues);
      }
    });

    // Validate imports
    const importIssues = this.validateImports(testContent, rules);
    allIssues.push(...importIssues);

    // Validate structure
    const structureIssues = this.validateTestStructure(testContent);
    allIssues.push(...structureIssues);

    // Calculate overall score
    const score = this.calculateOverallScore(sections);
    const isCompliant = score >= 85 && allIssues.filter(i => i.type === 'error').length === 0;

    const result: ComplianceResult = {
      isCompliant,
      score,
      maxScore: 100,
      issues: allIssues,
      sections,
      recommendations: []
    };

    result.recommendations = this.generateRecommendations(result);

    return result;
  }

  static generateComplianceReport(result: ComplianceResult): string {
    const report: string[] = [];
    
    report.push('='.repeat(60));
    report.push('BACKEND TEST COMPLIANCE REPORT');
    report.push('='.repeat(60));
    report.push('');
    
    report.push(`Overall Score: ${result.score}/100 ${result.isCompliant ? '✅' : '❌'}`);
    report.push(`Compliance Status: ${result.isCompliant ? 'PASSED' : 'FAILED'}`);
    report.push('');
    
    // Section breakdown
    report.push('Section Analysis:');
    report.push('-'.repeat(40));
    
    Object.entries(result.sections).forEach(([name, section]) => {
      const status = section.present ? `${section.quality}%` : 'MISSING';
      const emoji = section.present ? (section.quality >= 80 ? '✅' : section.quality >= 60 ? '⚠️' : '❌') : '❌';
      report.push(`${emoji} ${name}: ${status} (${section.testCount} tests)`);
    });
    
    report.push('');
    
    // Issues summary
    const errorCount = result.issues.filter(i => i.type === 'error').length;
    const warningCount = result.issues.filter(i => i.type === 'warning').length;
    const suggestionCount = result.issues.filter(i => i.type === 'suggestion').length;
    
    report.push(`Issues: ${errorCount} errors, ${warningCount} warnings, ${suggestionCount} suggestions`);
    report.push('');
    
    // Detailed issues
    if (result.issues.length > 0) {
      report.push('Detailed Issues:');
      report.push('-'.repeat(40));
      
      result.issues.forEach((issue, index) => {
        const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : '💡';
        report.push(`${index + 1}. ${icon} [${issue.section}] ${issue.message}`);
        if (issue.fix) {
          report.push(`   Fix: ${issue.fix}`);
        }
        report.push('');
      });
    }
    
    // Recommendations
    if (result.recommendations.length > 0) {
      report.push('Recommendations:');
      report.push('-'.repeat(40));
      
      result.recommendations.forEach((rec, index) => {
        report.push(`${index + 1}. ${rec}`);
      });
      report.push('');
    }
    
    return report.join('\n');
  }

  static getComplianceGrade(score: number): string {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  static isTestFileCompliant(testContent: string): boolean {
    const result = this.validateTestCompliance(testContent);
    return result.isCompliant;
  }

  static suggestImprovements(testContent: string): string[] {
    const result = this.validateTestCompliance(testContent);
    return [
      ...result.recommendations,
      ...result.issues.filter(i => i.fix).map(i => i.fix!)
    ];
  }
}