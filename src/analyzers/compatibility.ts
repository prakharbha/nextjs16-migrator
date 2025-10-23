import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export interface ProjectAnalysis {
  isCompatible: boolean;
  currentVersion: string;
  filesToTransform: FileToTransform[];
  issues: string[];
  recommendations: string[];
  complexity: 'low' | 'medium' | 'high';
  estimatedTime: string;
}

export interface FileToTransform {
  path: string;
  type: 'middleware' | 'config' | 'component' | 'api' | 'other';
  transformations: string[];
}

export class ProjectAnalyzer {
  async analyze(): Promise<ProjectAnalysis> {
    const analysis: ProjectAnalysis = {
      isCompatible: true,
      currentVersion: 'unknown',
      filesToTransform: [],
      issues: [],
      recommendations: [],
      complexity: 'low',
      estimatedTime: '5-10 minutes'
    };

    // Analyze package.json
    await this.analyzePackageJson(analysis);
    
    // Find files that need transformation
    await this.findFilesToTransform(analysis);
    
    // Check for compatibility issues
    await this.checkCompatibility(analysis);
    
    // Calculate complexity and estimated time
    this.calculateComplexity(analysis);
    
    return analysis;
  }

  private async analyzePackageJson(analysis: ProjectAnalysis): Promise<void> {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!await fs.pathExists(packageJsonPath)) {
      analysis.issues.push('No package.json found');
      analysis.isCompatible = false;
      return;
    }
    
    const packageJson = await fs.readJson(packageJsonPath);
    
    // Check Next.js version
    const nextVersion = packageJson.dependencies?.next || packageJson.devDependencies?.next;
    if (nextVersion) {
      analysis.currentVersion = nextVersion;
      
      // Check if version is compatible for migration
      const version = this.parseVersion(nextVersion);
      if (version.major < 14) {
        analysis.issues.push(`Next.js version ${nextVersion} is too old. Need version 14+ for migration to 16.`);
        analysis.isCompatible = false;
      }
    } else {
      analysis.issues.push('Next.js not found in dependencies');
      analysis.isCompatible = false;
    }
    
    // Check for problematic dependencies
    const problematicDeps = [
      'next-amp',
      'next-pwa',
      'next-seo'
    ];
    
    for (const dep of problematicDeps) {
      if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
        analysis.issues.push(`Dependency ${dep} may not be compatible with Next.js 16`);
        analysis.recommendations.push(`Consider updating or removing ${dep}`);
      }
    }
  }

  private async findFilesToTransform(analysis: ProjectAnalysis): Promise<void> {
    const patterns = [
      'middleware.ts',
      'middleware.js',
      'next.config.js',
      'next.config.ts',
      'next.config.mjs',
      'pages/**/*.tsx',
      'pages/**/*.jsx',
      'pages/**/*.ts',
      'pages/**/*.js',
      'app/**/*.tsx',
      'app/**/*.jsx',
      'app/**/*.ts',
      'app/**/*.js',
      'components/**/*.tsx',
      'components/**/*.jsx',
      'lib/**/*.ts',
      'lib/**/*.js',
      'utils/**/*.ts',
      'utils/**/*.js'
    ];
    
    for (const pattern of patterns) {
      const files = await glob(pattern, { cwd: process.cwd() });
      
      for (const file of files) {
        const fileAnalysis = await this.analyzeFile(file);
        if (fileAnalysis.transformations.length > 0) {
          analysis.filesToTransform.push(fileAnalysis);
        }
      }
    }
  }

  private async analyzeFile(filePath: string): Promise<FileToTransform> {
    const fullPath = path.join(process.cwd(), filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    const fileToTransform: FileToTransform = {
      path: filePath,
      type: this.getFileType(filePath),
      transformations: []
    };
    
    // Check for middleware.ts → proxy.ts transformation
    if (filePath === 'middleware.ts' || filePath === 'middleware.js') {
      fileToTransform.transformations.push('middleware-to-proxy');
    }
    
    // Check for cache API usage
    if (content.includes('revalidateTag') && !content.includes('cacheLife')) {
      fileToTransform.transformations.push('update-revalidate-tag');
    }
    
    if (content.includes('revalidateTag(') && !content.includes('revalidateTag(')) {
      fileToTransform.transformations.push('add-cache-life-profile');
    }
    
    // Check for next/image usage
    if (content.includes('next/image') || content.includes('next/legacy/image')) {
      fileToTransform.transformations.push('update-next-image');
    }
    
    // Check for async params usage
    if (content.includes('params') && !content.includes('await params')) {
      fileToTransform.transformations.push('make-params-async');
    }
    
    if (content.includes('searchParams') && !content.includes('await searchParams')) {
      fileToTransform.transformations.push('make-search-params-async');
    }
    
    // Check for cookies/headers usage
    if ((content.includes('cookies()') || content.includes('headers()')) && !content.includes('await cookies()') && !content.includes('await headers()')) {
      fileToTransform.transformations.push('make-cookies-headers-async');
    }
    
    return fileToTransform;
  }

  private getFileType(filePath: string): FileToTransform['type'] {
    if (filePath.includes('middleware') || filePath.includes('proxy')) {
      return 'middleware';
    }
    if (filePath.includes('next.config')) {
      return 'config';
    }
    if (filePath.includes('pages/api') || filePath.includes('app/api')) {
      return 'api';
    }
    if (filePath.includes('components') || filePath.includes('pages') || filePath.includes('app')) {
      return 'component';
    }
    return 'other';
  }

  private async checkCompatibility(analysis: ProjectAnalysis): Promise<void> {
    // Check for AMP usage
    const ampFiles = await glob('**/*.amp.*', { cwd: process.cwd() });
    if (ampFiles.length > 0) {
      analysis.issues.push('AMP support has been removed in Next.js 16');
      analysis.recommendations.push('Remove AMP files and configurations');
    }
    
    // Check for experimental PPR usage
    const configFiles = await glob('next.config.*', { cwd: process.cwd() });
    for (const configFile of configFiles) {
      const content = await fs.readFile(path.join(process.cwd(), configFile), 'utf-8');
      if (content.includes('experimental.ppr')) {
        analysis.issues.push('experimental.ppr flag has been removed in Next.js 16');
        analysis.recommendations.push('Use cacheComponents configuration instead');
      }
    }
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 20) {
      analysis.issues.push(`Node.js ${nodeVersion} is not supported. Next.js 16 requires Node.js 20.9+`);
      analysis.isCompatible = false;
    }
  }

  private calculateComplexity(analysis: ProjectAnalysis): void {
    const fileCount = analysis.filesToTransform.length;
    const issueCount = analysis.issues.length;
    
    if (fileCount > 50 || issueCount > 5) {
      analysis.complexity = 'high';
      analysis.estimatedTime = '30-60 minutes';
    } else if (fileCount > 20 || issueCount > 2) {
      analysis.complexity = 'medium';
      analysis.estimatedTime = '15-30 minutes';
    } else {
      analysis.complexity = 'low';
      analysis.estimatedTime = '5-15 minutes';
    }
  }

  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const match = version.match(/(\d+)\.(\d+)\.(\d+)/);
    if (match) {
      return {
        major: parseInt(match[1]),
        minor: parseInt(match[2]),
        patch: parseInt(match[3])
      };
    }
    return { major: 0, minor: 0, patch: 0 };
  }
}
