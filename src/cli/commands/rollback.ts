import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { BackupManager } from '../../utils/backup';

export interface RollbackOptions {
  yes?: boolean;
}

export async function rollbackCommand(options: RollbackOptions): Promise<void> {
  const spinner = ora('Checking for available backups...').start();
  
  try {
    const backupManager = new BackupManager();
    const backups = await backupManager.listBackups();
    
    if (backups.length === 0) {
      spinner.fail(chalk.red('No backups found'));
      console.log(chalk.yellow('No migration backups available to rollback to.'));
      return;
    }

    spinner.stop();
    
    // Show available backups
    console.log(chalk.blue('\n📋 Available Backups:'));
    backups.forEach((backup, index) => {
      console.log(chalk.gray(`${index + 1}. ${backup.id} - ${backup.timestamp} (${backup.description})`));
    });

    let selectedBackup;
    if (options.yes) {
      // Use most recent backup
      selectedBackup = backups[0];
    } else {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'backup',
          message: 'Which backup would you like to restore?',
          choices: backups.map(backup => ({
            name: `${backup.id} - ${backup.timestamp}`,
            value: backup
          }))
        }
      ]);
      selectedBackup = answer.backup;
    }

    // Confirmation
    if (!options.yes) {
      const confirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Are you sure you want to restore from backup ${selectedBackup.id}?`,
          default: false
        }
      ]);

      if (!confirm.proceed) {
        console.log(chalk.yellow('Rollback cancelled.'));
        return;
      }
    }

    // Execute rollback
    spinner.start('Restoring from backup...');
    await backupManager.restoreBackup(selectedBackup.id);
    
    spinner.succeed(chalk.green('Rollback completed successfully!'));
    console.log(chalk.blue('\n✅ Project restored to previous state'));
    console.log(chalk.gray(`Restored from backup: ${selectedBackup.id}`));

  } catch (error) {
    spinner.fail(chalk.red('Rollback failed'));
    throw error;
  }
}
