import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { BackupManager } from '../../utils/backup';
import { ProjectAnalyzer } from '../../analyzers/compatibility';
import { MigrationEngine } from '../../transformers/engine';
import { PerformanceAnalyzer } from '../../analyzers/performance';
import { ReportGenerator } from '../../utils/reporting';

export interface MigrateOptions {
  dryRun?: boolean;
  yes?: boolean;
  backup?: boolean;
  performance?: boolean;
  batch?: boolean;
}

export async function migrateCommand(options: MigrateOptions): Promise<void> {
  const spinner = ora('Initializing migration...').start();
  
  try {
    // Step 1: Project Analysis
    spinner.text = 'Analyzing project structure...';
    const analyzer = new ProjectAnalyzer();
    const analysis = await analyzer.analyze();
    
    if (!analysis.isCompatible) {
      spinner.fail(chalk.red('Project is not compatible with Next.js 16'));
      console.log(chalk.yellow('Issues found:'));
      analysis.issues.forEach((issue: string) => {
        console.log(chalk.red(`• ${issue}`));
      });
      return;
    }

    // Step 2: Backup Creation
    if (options.backup !== false) {
      spinner.text = 'Creating backup...';
      const backupManager = new BackupManager();
      const backupId = await backupManager.createBackup();
      console.log(chalk.green(`✓ Backup created: ${backupId}`));
    }

    // Step 3: Confirmation (unless batch mode or --yes)
    if (!options.batch && !options.yes) {
      spinner.stop();
      
      const confirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Ready to migrate ${analysis.filesToTransform.length} files?`,
          default: true
        }
      ]);

      if (!confirm.proceed) {
        console.log(chalk.yellow('Migration cancelled.'));
        return;
      }

      spinner.start('Starting migration...');
    }

    // Step 4: Performance Analysis (if requested)
    let performanceBaseline;
    if (options.performance) {
      spinner.text = 'Running performance analysis...';
      const perfAnalyzer = new PerformanceAnalyzer();
      performanceBaseline = await perfAnalyzer.analyze();
    }

    // Step 5: Migration Execution
    spinner.text = 'Executing transformations...';
    const migrationEngine = new MigrationEngine();
    
    if (options.dryRun) {
      spinner.text = 'Generating dry-run report...';
      const changes = await migrationEngine.previewChanges();
      
      spinner.succeed(chalk.green('Dry-run completed!'));
      console.log(chalk.blue('\n📋 Changes that would be made:'));
      
      changes.forEach((change: any) => {
        console.log(chalk.gray(`• ${change.file}: ${change.description}`));
      });
      
      console.log(chalk.yellow('\n💡 Run without --dry-run to apply these changes.'));
      return;
    }

    // Execute actual migration
    const results = await migrationEngine.migrate();
    
    // Step 6: Post-migration Analysis
    spinner.text = 'Running post-migration analysis...';
    const postAnalysis = await analyzer.analyze();
    
    // Step 7: Performance Comparison (if requested)
    let performanceComparison;
    if (options.performance && performanceBaseline) {
      spinner.text = 'Comparing performance...';
      const perfAnalyzer = new PerformanceAnalyzer();
      const postPerformance = await perfAnalyzer.analyze();
      performanceComparison = {
        before: performanceBaseline,
        after: postPerformance,
        improvement: {
          buildTime: ((performanceBaseline.buildTime - postPerformance.buildTime) / performanceBaseline.buildTime) * 100,
          bundleSize: ((performanceBaseline.bundleSize - postPerformance.bundleSize) / performanceBaseline.bundleSize) * 100,
          coreWebVitals: postPerformance.coreWebVitals
        }
      };
    }

    // Step 8: Generate Report
    spinner.text = 'Generating migration report...';
    const reportGenerator = new ReportGenerator();
    const report = await reportGenerator.generateReport({
      timestamp: new Date().toISOString(),
      projectName: 'Next.js Project',
      analysis,
      results,
      performanceComparison,
      backupId: options.backup !== false ? 'backup-id' : undefined
    });

    spinner.succeed(chalk.green('Migration completed successfully!'));
    
    // Display summary
    console.log(chalk.blue('\n🎉 Migration Summary:'));
    console.log(chalk.green(`✓ ${results.successful} files migrated successfully`));
    if (results.failed > 0) {
      console.log(chalk.yellow(`⚠ ${results.failed} files had issues`));
    }
    
    if (performanceComparison) {
      console.log(chalk.blue('\n📊 Performance Improvements:'));
      console.log(chalk.green(`• Build time: ${performanceComparison.improvement.buildTime.toFixed(1)}% faster`));
      console.log(chalk.green(`• Bundle size: ${performanceComparison.improvement.bundleSize.toFixed(1)}% smaller`));
    }

    console.log(chalk.blue('\n📄 Detailed report saved to: migration-report.html'));
    console.log(chalk.gray('Run "nextjs16-migrator rollback" if you need to undo changes.'));

  } catch (error) {
    spinner.fail(chalk.red('Migration failed'));
    throw error;
  }
}
