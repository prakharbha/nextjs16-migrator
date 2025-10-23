import fs from 'fs-extra';
import path from 'path';
import { simpleGit, SimpleGit } from 'simple-git';
import chalk from 'chalk';

export interface Backup {
  id: string;
  timestamp: string;
  description: string;
  gitCommit?: string;
  filesBackup?: string;
}

export class BackupManager {
  private git: SimpleGit;
  private backupDir: string;

  constructor() {
    this.git = simpleGit();
    this.backupDir = path.join(process.cwd(), '.nextjs16-migrator', 'backups');
  }

  async createBackup(): Promise<string> {
    const backupId = `backup-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    console.log(chalk.blue(`Creating backup: ${backupId}`));
    
    // Ensure backup directory exists
    await fs.ensureDir(this.backupDir);
    
    // Create git backup
    const gitCommit = await this.createGitBackup(backupId);
    
    // Create file backup for non-git files
    const filesBackup = await this.createFilesBackup(backupId);
    
    // Save backup metadata
    const backup: Backup = {
      id: backupId,
      timestamp,
      description: 'Pre-migration backup',
      gitCommit,
      filesBackup
    };
    
    await this.saveBackupMetadata(backup);
    
    console.log(chalk.green(`✓ Backup created: ${backupId}`));
    if (gitCommit) {
      console.log(chalk.gray(`  Git commit: ${gitCommit}`));
    }
    
    return backupId;
  }

  private async createGitBackup(backupId: string): Promise<string | undefined> {
    try {
      // Check if we're in a git repository
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        console.log(chalk.yellow('⚠ Not in a git repository, skipping git backup'));
        return undefined;
      }

      // Check for uncommitted changes
      const status = await this.git.status();
      if (status.files.length > 0) {
        console.log(chalk.yellow('⚠ Uncommitted changes detected, committing them first...'));
        await this.git.add('.');
        await this.git.commit(`Auto-commit before Next.js 16 migration backup ${backupId}`);
      }

      // Create backup commit
      await this.git.add('.');
      const commit = await this.git.commit(`Next.js 16 migration backup: ${backupId}`);
      
      return commit.commit;
    } catch (error) {
      console.log(chalk.yellow(`⚠ Git backup failed: ${error.message}`));
      return undefined;
    }
  }

  private async createFilesBackup(backupId: string): Promise<string> {
    const backupPath = path.join(this.backupDir, backupId);
    await fs.ensureDir(backupPath);
    
    // Copy important files that might not be in git
    const filesToBackup = [
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'next.config.js',
      'next.config.ts',
      'tsconfig.json',
      'tailwind.config.js',
      'tailwind.config.ts',
      '.env.local',
      '.env',
      'middleware.ts',
      'proxy.ts'
    ];
    
    for (const file of filesToBackup) {
      const sourcePath = path.join(process.cwd(), file);
      if (await fs.pathExists(sourcePath)) {
        const destPath = path.join(backupPath, file);
        await fs.copy(sourcePath, destPath);
      }
    }
    
    return backupPath;
  }

  private async saveBackupMetadata(backup: Backup): Promise<void> {
    const metadataPath = path.join(this.backupDir, 'metadata.json');
    
    let metadata: Backup[] = [];
    if (await fs.pathExists(metadataPath)) {
      metadata = await fs.readJson(metadataPath);
    }
    
    metadata.unshift(backup); // Add to beginning of array
    
    // Keep only last 10 backups
    if (metadata.length > 10) {
      metadata = metadata.slice(0, 10);
    }
    
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
  }

  async listBackups(): Promise<Backup[]> {
    const metadataPath = path.join(this.backupDir, 'metadata.json');
    
    if (!await fs.pathExists(metadataPath)) {
      return [];
    }
    
    return await fs.readJson(metadataPath);
  }

  async restoreBackup(backupId: string): Promise<void> {
    const backups = await this.listBackups();
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }
    
    console.log(chalk.blue(`Restoring from backup: ${backupId}`));
    
    // Restore git state if available
    if (backup.gitCommit) {
      try {
        await this.git.reset(['--hard', backup.gitCommit]);
        console.log(chalk.green(`✓ Git state restored to commit: ${backup.gitCommit}`));
      } catch (error) {
        console.log(chalk.yellow(`⚠ Git restore failed: ${error.message}`));
      }
    }
    
    // Restore files if available
    if (backup.filesBackup && await fs.pathExists(backup.filesBackup)) {
      const files = await fs.readdir(backup.filesBackup);
      
      for (const file of files) {
        const sourcePath = path.join(backup.filesBackup, file);
        const destPath = path.join(process.cwd(), file);
        
        await fs.copy(sourcePath, destPath);
      }
      
      console.log(chalk.green(`✓ Files restored from backup`));
    }
  }

  async cleanup(): Promise<void> {
    const backups = await this.listBackups();
    
    // Keep only last 5 backups
    if (backups.length > 5) {
      const toDelete = backups.slice(5);
      
      for (const backup of toDelete) {
        if (backup.filesBackup && await fs.pathExists(backup.filesBackup)) {
          await fs.remove(backup.filesBackup);
        }
      }
      
      const updatedBackups = backups.slice(0, 5);
      const metadataPath = path.join(this.backupDir, 'metadata.json');
      await fs.writeJson(metadataPath, updatedBackups, { spaces: 2 });
      
      console.log(chalk.gray(`Cleaned up ${toDelete.length} old backups`));
    }
  }
}
