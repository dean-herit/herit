/**
 * Backend Analyzer - AST Analysis Engine for API Routes
 * Analyzes Next.js App Router API routes to understand structure and generate intelligent tests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type AuthRequirement = 'required' | 'optional' | 'none';

export interface DatabaseOperation {
  type: 'select' | 'insert' | 'update' | 'delete' | 'transaction';
  table?: string;
  hasAuditLog: boolean;
}

export interface ValidationSchema {
  field: string;
  type: string;
  required: boolean;
  validation?: string;
}

export interface ResponseType {
  status: number;
  type: 'json' | 'text' | 'stream' | 'redirect';
  schema?: any;
}

export interface ErrorPattern {
  type: string;
  status: number;
  message?: string;
}

export interface RouteAnalysis {
  routePath: string;
  fileName: string;
  httpMethods: HttpMethod[];
  authentication: AuthRequirement;
  databaseOperations: DatabaseOperation[];
  externalServices: string[];
  requestValidation: ValidationSchema[];
  responseTypes: ResponseType[];
  errorHandling: ErrorPattern[];
  hasRateLimiting: boolean;
  hasAuditLogging: boolean;
  complexity: number; // 1-10 scale
  testPriority: 'critical' | 'high' | 'medium' | 'low';
}

export class BackendAnalyzer {
  private static extractRoutePath(filePath: string): string {
    // Convert file path to route path
    // app/api/auth/login/route.ts -> /api/auth/login
    const relativePath = filePath.replace(/\\/g, '/');
    const match = relativePath.match(/app\/api(.*)\/route\.(ts|js)/);
    if (match) {
      return `/api${match[1]}`;
    }
    return '/api/unknown';
  }

  private static detectHttpMethods(sourceFile: ts.SourceFile): HttpMethod[] {
    const methods: HttpMethod[] = [];
    const methodNames = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) {
        const text = node.getText();
        methodNames.forEach(method => {
          if (text.includes(`export async function ${method}`) || 
              text.includes(`export const ${method}`) ||
              text.includes(`export function ${method}`)) {
            methods.push(method as HttpMethod);
          }
        });
      }
    });

    return methods.length > 0 ? methods : ['GET'];
  }

  private static detectAuthentication(sourceFile: ts.SourceFile): AuthRequirement {
    const sourceText = sourceFile.getText();
    
    // Check for auth patterns
    if (sourceText.includes('validateSession') || 
        sourceText.includes('getServerSession') ||
        sourceText.includes('requireAuth') ||
        sourceText.includes('jwt.verify')) {
      
      // Check if auth is conditional
      if (sourceText.includes('if (') && sourceText.includes('session')) {
        return 'optional';
      }
      return 'required';
    }
    
    return 'none';
  }

  private static detectDatabaseOperations(sourceFile: ts.SourceFile): DatabaseOperation[] {
    const operations: DatabaseOperation[] = [];
    const sourceText = sourceFile.getText();

    // Detect Drizzle ORM operations
    const patterns = [
      { regex: /db\.select/g, type: 'select' as const },
      { regex: /db\.insert/g, type: 'insert' as const },
      { regex: /db\.update/g, type: 'update' as const },
      { regex: /db\.delete/g, type: 'delete' as const },
      { regex: /db\.transaction/g, type: 'transaction' as const },
    ];

    patterns.forEach(({ regex, type }) => {
      if (regex.test(sourceText)) {
        operations.push({
          type,
          hasAuditLog: sourceText.includes('audit') || sourceText.includes('logUserAction')
        });
      }
    });

    // Check for raw SQL
    if (sourceText.includes('sql`') || sourceText.includes('db.execute')) {
      operations.push({
        type: 'select',
        hasAuditLog: sourceText.includes('audit_events')
      });
    }

    return operations;
  }

  private static detectExternalServices(sourceFile: ts.SourceFile): string[] {
    const services: string[] = [];
    const sourceText = sourceFile.getText();

    const servicePatterns = [
      { pattern: /stripe\./gi, service: 'stripe' },
      { pattern: /vercel\.blob/gi, service: 'vercel-blob' },
      { pattern: /sendEmail|emailService/gi, service: 'email' },
      { pattern: /fetch\(['"`]http/gi, service: 'external-api' },
      { pattern: /redis\./gi, service: 'redis' },
      { pattern: /s3\./gi, service: 'aws-s3' },
    ];

    servicePatterns.forEach(({ pattern, service }) => {
      if (pattern.test(sourceText)) {
        services.push(service);
      }
    });

    return [...new Set(services)];
  }

  private static detectRequestValidation(sourceFile: ts.SourceFile): ValidationSchema[] {
    const validations: ValidationSchema[] = [];
    const sourceText = sourceFile.getText();

    // Check for Zod schemas
    if (sourceText.includes('z.object') || sourceText.includes('zod')) {
      // Basic Zod detection
      const zodMatches = sourceText.match(/(\w+):\s*z\.(string|number|boolean|date|email)/g);
      if (zodMatches) {
        zodMatches.forEach(match => {
          const [field, type] = match.split(':').map(s => s.trim());
          validations.push({
            field,
            type: type.replace('z.', ''),
            required: !match.includes('.optional()')
          });
        });
      }
    }

    // Check for manual validation
    if (sourceText.includes('request.json()') || sourceText.includes('await req.json()')) {
      // Detect field checks
      const fieldChecks = sourceText.match(/body\.(\w+)/g);
      if (fieldChecks) {
        fieldChecks.forEach(check => {
          const field = check.replace('body.', '');
          if (!validations.find(v => v.field === field)) {
            validations.push({
              field,
              type: 'unknown',
              required: sourceText.includes(`!body.${field}`)
            });
          }
        });
      }
    }

    return validations;
  }

  private static detectErrorHandling(sourceFile: ts.SourceFile): ErrorPattern[] {
    const errors: ErrorPattern[] = [];
    const sourceText = sourceFile.getText();

    // Common error patterns
    const errorPatterns = [
      { regex: /NextResponse\.json\([^,]+,\s*{\s*status:\s*400/g, type: 'validation', status: 400 },
      { regex: /NextResponse\.json\([^,]+,\s*{\s*status:\s*401/g, type: 'authentication', status: 401 },
      { regex: /NextResponse\.json\([^,]+,\s*{\s*status:\s*403/g, type: 'authorization', status: 403 },
      { regex: /NextResponse\.json\([^,]+,\s*{\s*status:\s*404/g, type: 'not_found', status: 404 },
      { regex: /NextResponse\.json\([^,]+,\s*{\s*status:\s*500/g, type: 'server_error', status: 500 },
    ];

    errorPatterns.forEach(({ regex, type, status }) => {
      if (regex.test(sourceText)) {
        errors.push({ type, status });
      }
    });

    // Check for try-catch blocks
    if (sourceText.includes('try {') && sourceText.includes('catch')) {
      if (!errors.find(e => e.status === 500)) {
        errors.push({ type: 'exception', status: 500 });
      }
    }

    return errors;
  }

  private static calculateComplexity(analysis: Partial<RouteAnalysis>): number {
    let complexity = 1;

    // Add complexity based on features
    if (analysis.httpMethods && analysis.httpMethods.length > 1) complexity += 1;
    if (analysis.authentication === 'required') complexity += 2;
    if (analysis.authentication === 'optional') complexity += 1;
    if (analysis.databaseOperations && analysis.databaseOperations.length > 0) {
      complexity += Math.min(analysis.databaseOperations.length, 3);
    }
    if (analysis.externalServices && analysis.externalServices.length > 0) {
      complexity += analysis.externalServices.length * 2;
    }
    if (analysis.requestValidation && analysis.requestValidation.length > 3) complexity += 1;
    if (analysis.errorHandling && analysis.errorHandling.length > 2) complexity += 1;

    return Math.min(complexity, 10);
  }

  private static determineTestPriority(analysis: Partial<RouteAnalysis>): 'critical' | 'high' | 'medium' | 'low' {
    const routePath = analysis.routePath || '';
    
    // Critical routes
    if (routePath.includes('/auth') || 
        routePath.includes('/payment') ||
        routePath.includes('/stripe')) {
      return 'critical';
    }

    // High priority routes
    if (routePath.includes('/api/assets') ||
        routePath.includes('/api/beneficiaries') ||
        routePath.includes('/api/will') ||
        analysis.authentication === 'required') {
      return 'high';
    }

    // Medium priority
    if (analysis.databaseOperations && analysis.databaseOperations.length > 0) {
      return 'medium';
    }

    return 'low';
  }

  static analyzeRoute(filePath: string): RouteAnalysis {
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const routePath = this.extractRoutePath(filePath);
    const httpMethods = this.detectHttpMethods(sourceFile);
    const authentication = this.detectAuthentication(sourceFile);
    const databaseOperations = this.detectDatabaseOperations(sourceFile);
    const externalServices = this.detectExternalServices(sourceFile);
    const requestValidation = this.detectRequestValidation(sourceFile);
    const errorHandling = this.detectErrorHandling(sourceFile);

    const partialAnalysis = {
      routePath,
      httpMethods,
      authentication,
      databaseOperations,
      externalServices,
      requestValidation,
      errorHandling,
    };

    const analysis: RouteAnalysis = {
      routePath,
      fileName: path.basename(filePath),
      httpMethods,
      authentication,
      databaseOperations,
      externalServices,
      requestValidation,
      responseTypes: [{ status: 200, type: 'json' }], // Default, can be enhanced
      errorHandling,
      hasRateLimiting: sourceCode.includes('rateLimit') || sourceCode.includes('rateLimiter'),
      hasAuditLogging: sourceCode.includes('audit') || sourceCode.includes('logUserAction'),
      complexity: this.calculateComplexity(partialAnalysis),
      testPriority: this.determineTestPriority(partialAnalysis),
    };

    return analysis;
  }

  static getRouteDescription(analysis: RouteAnalysis): string {
    const parts: string[] = [];
    
    // Build description based on route path
    const pathParts = analysis.routePath.split('/').filter(p => p && p !== 'api');
    if (pathParts.length > 0) {
      parts.push(pathParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '));
    }

    // Add method info
    if (analysis.httpMethods.length > 0) {
      parts.push(`(${analysis.httpMethods.join(', ')})`);
    }

    // Add key features
    const features: string[] = [];
    if (analysis.authentication === 'required') features.push('Auth Required');
    if (analysis.databaseOperations.length > 0) features.push('Database');
    if (analysis.externalServices.length > 0) features.push('External Services');
    
    if (features.length > 0) {
      parts.push(`- ${features.join(', ')}`);
    }

    return parts.join(' ');
  }
}