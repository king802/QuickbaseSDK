import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { deployCommand } from './commands/deploy.js';
import { pullCommand } from './commands/pull.js';
import { validateCommand } from './commands/validate.js';
import { diffCommand } from './commands/diff.js';

const program = new Command();

program
    .name('qb-dev')
    .description('Quickbase Development Tools - Build and maintain Quickbase apps as code')
    .version('1.0.0');

// Register commands
initCommand(program);
deployCommand(program);
pullCommand(program);
validateCommand(program);
diffCommand(program);

program.parse();