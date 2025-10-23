import chalk from 'chalk';
import inquirer from 'inquirer';
import { analyzeCommand } from './analyze';
import { migrateCommand } from './migrate';
import { rollbackCommand } from './rollback';

export async function interactiveCommand(): Promise<void> {
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
}
