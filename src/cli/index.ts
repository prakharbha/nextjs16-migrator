#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { migrateCommand } from './commands/migrate';
import { rollbackCommand } from './commands/rollback';
import { analyzeCommand } from './commands/analyze';
const version = '1.0.0';

const program = new Command();

program
  .name('nextjs16-migrator')
  .description(chalk.blue.bold('🚀 Superior Next.js 14/15 → 16 Migration Tool'))
  .version(version)
  .addHelpText('before', `
${chalk.blue.bold('Next.js 16 Migration Tool')}
${chalk.gray('The safest, most comprehensive way to migrate to Next.js 16')}

${chalk.yellow('✨ Features:')}
${chalk.green('•')} Automatic backups & one-command rollback
${chalk.green('•')} Interactive CLI with progress indicators  
${chalk.green('•')} Dry-run mode to preview changes
${chalk.green('•')} Performance analysis & detailed reports
${chalk.green('•')} CI/CD integration & batch processing

${chalk.yellow('📚 Documentation:')}
${chalk.blue('•')} https://github.com/nandann-creative/nextjs16-migrator
${chalk.blue('•')} Video tutorials available in docs/videos/

`);

// Migrate command
program
  .command('migrate')
  .description('Migrate your Next.js project to version 16')
  .option('-d, --dry-run', 'Preview changes without applying them')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('--no-backup', 'Skip creating backups (not recommended)')
  .option('--performance', 'Include performance analysis')
  .option('--batch', 'Batch mode for CI/CD (non-interactive)')
  .action(async (options) => {
    const spinner = ora('Initializing migration...').start();
    
    try {
      await migrateCommand(options);
      spinner.succeed(chalk.green('Migration completed successfully!'));
    } catch (error) {
      spinner.fail(chalk.red('Migration failed'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Rollback command
program
  .command('rollback')
  .description('Rollback to the previous state before migration')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (options) => {
    const spinner = ora('Rolling back migration...').start();
    
    try {
      await rollbackCommand(options);
      spinner.succeed(chalk.green('Rollback completed successfully!'));
    } catch (error) {
      spinner.fail(chalk.red('Rollback failed'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Analyze command
program
  .command('analyze')
  .description('Analyze your project for Next.js 16 compatibility')
  .option('--performance', 'Include performance analysis')
  .option('--detailed', 'Show detailed analysis report')
  .action(async (options) => {
    const spinner = ora('Analyzing project...').start();
    
    try {
      await analyzeCommand(options);
      spinner.succeed(chalk.green('Analysis completed!'));
    } catch (error) {
      spinner.fail(chalk.red('Analysis failed'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Interactive mode (default)
program
  .command('interactive')
  .description('Start interactive migration wizard')
  .action(async () => {
    console.log(chalk.blue.bold('\n🚀 Next.js 16 Migration Wizard\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🔍 Analyze project compatibility', value: 'analyze' },
          { name: '🚀 Start migration', value: 'migrate' },
          { name: '↩️  Rollback previous migration', value: 'rollback' },
          { name: '📚 View documentation', value: 'docs' },
          { name: '❌ Exit', value: 'exit' }
        ]
      }
    ]);

    switch (answers.action) {
      case 'analyze':
        await analyzeCommand({ detailed: true });
        break;
      case 'migrate':
        await migrateCommand({});
        break;
      case 'rollback':
        await rollbackCommand({});
        break;
      case 'docs':
        console.log(chalk.blue('\n📚 Documentation:'));
        console.log(chalk.gray('• GitHub: https://github.com/nandann-creative/nextjs16-migrator'));
        console.log(chalk.gray('• Video tutorials: docs/videos/'));
        console.log(chalk.gray('• Troubleshooting: docs/troubleshooting.md'));
        break;
      case 'exit':
        console.log(chalk.gray('Goodbye! 👋'));
        break;
    }
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.gray('See --help for available commands.'));
  process.exit(1);
});

// Parse arguments
program.parse();

// If no command provided, show interactive mode
if (!process.argv.slice(2).length) {
  // Run interactive mode directly
  import('./commands/interactive').then(module => module.interactiveCommand());
}
