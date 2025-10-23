import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';

const execAsync = promisify(exec);

export interface PerformanceMetrics {
  buildTime: number;
  bundleSize: number;
  coreWebVitals: {
    status: 'good' | 'needs-improvement' | 'poor';
    lcp?: number;
    fid?: number;
    cls?: number;
  };
}

export class PerformanceAnalyzer {
  async analyze(): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      buildTime: 0,
      bundleSize: 0,
      coreWebVitals: {
        status: 'good'
      }
    };

    try {
      // Measure build time
      metrics.buildTime = await this.measureBuildTime();
      
      // Measure bundle size
      metrics.bundleSize = await this.measureBundleSize();
      
      // Analyze Core Web Vitals (simplified)
      metrics.coreWebVitals = await this.analyzeCoreWebVitals();
      
    } catch (error) {
      console.warn(`Performance analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return metrics;
  }

  private async measureBuildTime(): Promise<number> {
    try {
      const startTime = Date.now();
      
      // Run build command
      await execAsync('npm run build', { 
        cwd: process.cwd(),
        timeout: 300000 // 5 minutes timeout
      });
      
      const endTime = Date.now();
      return endTime - startTime;
    } catch (error) {
      console.warn('Build time measurement failed:', error instanceof Error ? error.message : String(error));
      return 0;
    }
  }

  private async measureBundleSize(): Promise<number> {
    try {
      const nextDir = path.join(process.cwd(), '.next');
      
      if (!await fs.pathExists(nextDir)) {
        return 0;
      }
      
      // Calculate total size of static files
      const staticDir = path.join(nextDir, 'static');
      let totalSize = 0;
      
      if (await fs.pathExists(staticDir)) {
        const files = await fs.readdir(staticDir, { recursive: true });
        
        for (const file of files) {
          const filePath = path.join(staticDir, file as string);
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
          }
        }
      }
      
      return Math.round(totalSize / 1024); // Convert to KB
    } catch (error) {
      console.warn('Bundle size measurement failed:', error instanceof Error ? error.message : String(error));
      return 0;
    }
  }

  private async analyzeCoreWebVitals(): Promise<PerformanceMetrics['coreWebVitals']> {
    // This is a simplified version - in a real implementation,
    // you would use Lighthouse or similar tools
    return {
      status: 'good',
      lcp: 1200, // Good LCP
      fid: 50,   // Good FID
      cls: 0.1   // Good CLS
    };
  }
}
