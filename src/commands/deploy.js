import { Command } from 'commander';
import { DeployService } from '../services/deploy.service.js';
import chalk from 'chalk';

export function deployCommand(program) {
    program
        .command('deploy [app-name]')
        .description('Deploy an app to Quickbase')
        .option('-f, --force', 'Force deployment without confirmation')
        .option('-d, --dry-run', 'Show what would be deployed without making changes')
        .action(async (appName, options) => {
            try {
                const deployService = new DeployService();

                if (options.dryRun) {
                    console.log(chalk.yellow('🔍 Dry run mode - no changes will be made\n'));
                }

                if (appName) {
                    await deployService.deployApp(appName, options);
                } else {
                    // Deploy all apps
                    console.log(chalk.blue('Deploying all apps...'));
                    // Implementation for deploying all apps
                }
            } catch (error) {
                console.error(chalk.red(`Deployment failed: ${error.message}`));
                process.exit(1);
            }
        });
}