import fs from 'fs-extra';
import path from 'path';
import jscodeshift, { API, FileInfo, Options } from 'jscodeshift';
import { ProjectAnalysis, FileToTransform } from '../analyzers/compatibility';

export interface MigrationResult {
  successful: number;
  failed: number;
  changes: Change[];
  errors: Error[];
}

export interface Change {
  file: string;
  description: string;
  type: 'transformation' | 'creation' | 'deletion';
}

export interface Error {
  file: string;
  message: string;
  line?: number;
}

export class MigrationEngine {
  private transformations: Map<string, (fileInfo: FileInfo, api: API, options: Options) => string> = new Map();

  constructor() {
    this.initializeTransformations();
  }

  private initializeTransformations(): void {
    this.transformations.set('middleware-to-proxy', this.transformMiddlewareToProxy.bind(this));
    this.transformations.set('update-revalidate-tag', this.updateRevalidateTag.bind(this));
    this.transformations.set('add-cache-life-profile', this.addCacheLifeProfile.bind(this));
    this.transformations.set('update-next-image', this.updateNextImage.bind(this));
    this.transformations.set('make-params-async', this.makeParamsAsync.bind(this));
    this.transformations.set('make-search-params-async', this.makeSearchParamsAsync.bind(this));
    this.transformations.set('make-cookies-headers-async', this.makeCookiesHeadersAsync.bind(this));
  }

  async previewChanges(): Promise<Change[]> {
    const analyzer = new (await import('../analyzers/compatibility')).ProjectAnalyzer();
    const analysis = await analyzer.analyze();
    
    const changes: Change[] = [];
    
    for (const file of analysis.filesToTransform) {
      for (const transformation of file.transformations) {
        changes.push({
          file: file.path,
          description: this.getTransformationDescription(transformation),
          type: 'transformation'
        });
      }
    }
    
    return changes;
  }

  async migrate(): Promise<MigrationResult> {
    const analyzer = new (await import('../analyzers/compatibility')).ProjectAnalyzer();
    const analysis = await analyzer.analyze();
    
    const result: MigrationResult = {
      successful: 0,
      failed: 0,
      changes: [],
      errors: []
    };
    
    for (const file of analysis.filesToTransform) {
      try {
        const fileResult = await this.transformFile(file);
        result.successful++;
        result.changes.push(...fileResult.changes);
      } catch (error) {
        result.failed++;
        result.errors.push({
          file: file.path,
          message: error.message
        });
      }
    }
    
    return result;
  }

  private async transformFile(fileToTransform: FileToTransform): Promise<{ changes: Change[] }> {
    const changes: Change[] = [];
    const filePath = path.join(process.cwd(), fileToTransform.path);
    
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${fileToTransform.path}`);
    }
    
    const source = await fs.readFile(filePath, 'utf-8');
    let transformedSource = source;
    
    for (const transformation of fileToTransform.transformations) {
      const transformer = this.transformations.get(transformation);
      if (transformer) {
        const fileInfo: FileInfo = {
          path: filePath,
          source: transformedSource
        };
        
        const api = jscodeshift.withParser('tsx') as any;
        const options: Options = {};
        
        try {
          transformedSource = transformer(fileInfo, api, options);
          changes.push({
            file: fileToTransform.path,
            description: this.getTransformationDescription(transformation),
            type: 'transformation'
          });
        } catch (error) {
          throw new Error(`Transformation ${transformation} failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    // Write transformed file
    if (transformedSource !== source) {
      await fs.writeFile(filePath, transformedSource);
    }
    
    return { changes };
  }

  // Transformation implementations
  private transformMiddlewareToProxy(fileInfo: FileInfo, api: API, options: Options): string {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);
    
    // Rename middleware.ts to proxy.ts
    // This is handled at the file system level
    
    // Transform the function export
    root.find(j.ExportDefaultDeclaration)
      .forEach(path => {
        const declaration = path.value.declaration;
        if (j.FunctionDeclaration.check(declaration)) {
          // Change function name from middleware to proxy
          if (declaration.id?.name === 'middleware') {
            declaration.id.name = 'proxy';
          }
        } else if (j.FunctionExpression.check(declaration)) {
          // Handle anonymous function exports
          const newFunction = j.functionDeclaration(
            j.identifier('proxy'),
            declaration.params,
            declaration.body
          );
          path.value.declaration = newFunction;
        }
      });
    
    return root.toSource();
  }

  private updateRevalidateTag(fileInfo: FileInfo, api: API, options: Options): string {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);
    
    // Find revalidateTag calls and add cacheLife profile
    root.find(j.CallExpression)
      .filter(path => {
        const callee = path.value.callee;
        return j.Identifier.check(callee) && callee.name === 'revalidateTag';
      })
      .forEach(path => {
        const args = path.value.arguments;
        if (args.length === 1) {
          // Add 'max' as second argument for SWR behavior
          args.push(j.literal('max'));
        }
      });
    
    return root.toSource();
  }

  private addCacheLifeProfile(fileInfo: FileInfo, api: API, options: Options): string {
    // This is handled by updateRevalidateTag
    return fileInfo.source;
  }

  private updateNextImage(fileInfo: FileInfo, api: API, options: Options): string {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);
    
    // Replace next/legacy/image with next/image
    root.find(j.ImportDeclaration)
      .filter(path => {
        const source = path.value.source;
        return j.Literal.check(source) && source.value === 'next/legacy/image';
      })
      .forEach(path => {
        path.value.source = j.literal('next/image');
      });
    
    return root.toSource();
  }

  private makeParamsAsync(fileInfo: FileInfo, api: API, options: Options): string {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);
    
    // Find params usage and make it async
    root.find(j.Identifier)
      .filter(path => path.value.name === 'params')
      .forEach(path => {
        const parent = path.parent;
        if (j.MemberExpression.check(parent.value)) {
          // Replace params.something with (await params).something
          const memberExpression = j.memberExpression(
            j.awaitExpression(j.identifier('params')),
            parent.value.property,
            parent.value.computed
          );
          j(parent).replaceWith(memberExpression);
        }
      });
    
    return root.toSource();
  }

  private makeSearchParamsAsync(fileInfo: FileInfo, api: API, options: Options): string {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);
    
    // Find searchParams usage and make it async
    root.find(j.Identifier)
      .filter(path => path.value.name === 'searchParams')
      .forEach(path => {
        const parent = path.parent;
        if (j.MemberExpression.check(parent.value)) {
          // Replace searchParams.something with (await searchParams).something
          const memberExpression = j.memberExpression(
            j.awaitExpression(j.identifier('searchParams')),
            parent.value.property,
            parent.value.computed
          );
          j(parent).replaceWith(memberExpression);
        }
      });
    
    return root.toSource();
  }

  private makeCookiesHeadersAsync(fileInfo: FileInfo, api: API, options: Options): string {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);
    
    // Find cookies() and headers() calls and make them async
    root.find(j.CallExpression)
      .filter(path => {
        const callee = path.value.callee;
        if (j.Identifier.check(callee)) {
          return callee.name === 'cookies' || callee.name === 'headers';
        }
        return false;
      })
      .forEach(path => {
        const callee = path.value.callee;
        if (j.Identifier.check(callee)) {
          path.value.callee = j.awaitExpression(callee);
        }
      });
    
    return root.toSource();
  }

  private getTransformationDescription(transformation: string): string {
    const descriptions: Record<string, string> = {
      'middleware-to-proxy': 'Convert middleware.ts to proxy.ts',
      'update-revalidate-tag': 'Update revalidateTag calls with cacheLife profile',
      'add-cache-life-profile': 'Add cacheLife profile to revalidateTag',
      'update-next-image': 'Update next/image imports and usage',
      'make-params-async': 'Make params usage async',
      'make-search-params-async': 'Make searchParams usage async',
      'make-cookies-headers-async': 'Make cookies/headers usage async'
    };
    
    return descriptions[transformation] || transformation;
  }
}
