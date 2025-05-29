import { Command } from 'commander';
import { DiffService } from '../services/diff.service.js';
import chalk from 'chalk';

export function diffCommand(program) {
    program
        .command('diff <app-name>')
        .description('Compare local and remote app schemas')
        .action(async (appName) => {
            try {
                const diffService = new DiffService();
                await diffService.diffApp(appName);
            } catch (error) {
                console.error(chalk.red(`Diff failed: ${error.message}`));
                process.exit(1);
            }
        });
}