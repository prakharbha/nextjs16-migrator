import chalk from 'chalk';
import ora from 'ora';
import { ProjectAnalyzer } from '../../analyzers/compatibility';
import { PerformanceAnalyzer } from '../../analyzers/performance';

export interface AnalyzeOptions {
  performance?: boolean;
  detailed?: boolean;
}

export async function analyzeCommand(options: AnalyzeOptions): Promise<void> {
  const spinner = ora('Analyzing project...').start();
  
  try {
    // Project compatibility analysis
    spinner.text = 'Checking Next.js 16 compatibility...';
    const analyzer = new ProjectAnalyzer();
    const analysis = await analyzer.analyze();
    
    spinner.succeed(chalk.green('Analysis completed!'));
    
    // Display compatibility results
    console.log(chalk.blue('\n🔍 Compatibility Analysis:'));
    
    if (analysis.isCompatible) {
      console.log(chalk.green('✅ Project is compatible with Next.js 16'));
    } else {
      console.log(chalk.red('❌ Project has compatibility issues'));
      console.log(chalk.yellow('\nIssues found:'));
      analysis.issues.forEach(issue => {
        console.log(chalk.red(`• ${issue}`));
      });
    }

    // Show files that will be transformed
    console.log(chalk.blue('\n📁 Files to be transformed:'));
    analysis.filesToTransform.forEach(file => {
      console.log(chalk.gray(`• ${file.path} (${file.type})`));
    });

    // Performance analysis (if requested)
    if (options.performance) {
      spinner.start('Running performance analysis...');
      const perfAnalyzer = new PerformanceAnalyzer();
      const performance = await perfAnalyzer.analyze();
      
      spinner.succeed(chalk.green('Performance analysis completed!'));
      
      console.log(chalk.blue('\n📊 Performance Metrics:'));
      console.log(chalk.gray(`• Build time: ${performance.buildTime}ms`));
      console.log(chalk.gray(`• Bundle size: ${performance.bundleSize}KB`));
      console.log(chalk.gray(`• Core Web Vitals: ${performance.coreWebVitals.status}`));
      
      if (performance.coreWebVitals.lcp) {
        console.log(chalk.gray(`  - LCP: ${performance.coreWebVitals.lcp}ms`));
      }
      if (performance.coreWebVitals.fid) {
        console.log(chalk.gray(`  - FID: ${performance.coreWebVitals.fid}ms`));
      }
      if (performance.coreWebVitals.cls) {
        console.log(chalk.gray(`  - CLS: ${performance.coreWebVitals.cls}`));
      }
    }

    // Detailed analysis (if requested)
    if (options.detailed) {
      console.log(chalk.blue('\n📋 Detailed Analysis:'));
      console.log(chalk.gray(`• Next.js version: ${analysis.currentVersion}`));
      console.log(chalk.gray(`• Target version: 16.0.0`));
      console.log(chalk.gray(`• Migration complexity: ${analysis.complexity}`));
      console.log(chalk.gray(`• Estimated migration time: ${analysis.estimatedTime}`));
      
      if (analysis.recommendations.length > 0) {
        console.log(chalk.yellow('\n💡 Recommendations:'));
        analysis.recommendations.forEach(rec => {
          console.log(chalk.gray(`• ${rec}`));
        });
      }
    }

    // Next steps
    if (analysis.isCompatible) {
      console.log(chalk.blue('\n🚀 Ready to migrate!'));
      console.log(chalk.gray('Run "nextjs16-migrator migrate" to start the migration.'));
    } else {
      console.log(chalk.yellow('\n⚠️  Fix compatibility issues before migrating.'));
      console.log(chalk.gray('See docs/troubleshooting.md for help.'));
    }

  } catch (error) {
    spinner.fail(chalk.red('Analysis failed'));
    throw error;
  }
}
