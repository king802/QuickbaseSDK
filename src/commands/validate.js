import { Command } from 'commander';
import { SchemaService } from '../services/schema.service.js';
import chalk from 'chalk';

export function validateCommand(program) {
    program
        .command('validate [app-name]')
        .description('Validate app schema')
        .action(async (appName) => {
            try {
                const schemaService = new SchemaService();

                if (appName) {
                    const schema = schemaService.loadAppSchema(appName);
                    const validation = schemaService.validateSchema(schema);

                    if (validation.valid) {
                        console.log(chalk.green(`✅ ${appName} schema is valid`));
                    } else {
                        console.log(chalk.red(`❌ ${appName} schema has errors:`));
                        console.log(validation.errors);
                    }
                } else {
                    // Validate all apps
                    console.log(chalk.blue('Validating all app schemas...'));
                    // Implementation for validating all apps
                }
            } catch (error) {
                console.error(chalk.red(`Validation failed: ${error.message}`));
                process.exit(1);
            }
        });
}
