import { Command } from 'commander';
import { PullService } from '../services/pull.service.js';
import chalk from 'chalk';

export function pullCommand(program) {
    program
        .command('pull <app-id> [app-name]')
        .description('Pull an existing app from Quickbase')
        .option('-o, --overwrite', 'Overwrite existing local schema')
        .action(async (appId, appName, options) => {
            try {
                const pullService = new PullService();
                await pullService.pullApp(appId, appName);
            } catch (error) {
                console.error(chalk.red(`Pull failed: ${error.message}`));
                process.exit(1);
            }
        });
}