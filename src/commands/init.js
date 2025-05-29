import { Command } from 'commander';
import inquirer from 'inquirer';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { config } from '../config/index.js';

export function initCommand(program) {
    program
        .command('init')
        .description('Initialize a new Quickbase development project')
        .action(async () => {
            console.log(chalk.bold('🚀 Initializing Quickbase Development Project\n'));

            // Check if already initialized
            if (existsSync(join(process.cwd(), 'quickbase.config.js'))) {
                const { overwrite } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'overwrite',
                        message: 'Project already initialized. Overwrite existing configuration?',
                        default: false
                    }
                ]);

                if (!overwrite) {
                    console.log(chalk.yellow('Initialization cancelled'));
                    return;
                }
            }

            // Gather project information
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'projectName',
                    message: 'Project name:',
                    default: 'my-quickbase-app'
                },
                {
                    type: 'input',
                    name: 'realm',
                    message: 'Quickbase realm (e.g., company.quickbase.com):',
                    validate: (input) => {
                        if (!input) return 'Realm is required';
                        if (!input.includes('.quickbase.com')) return 'Realm must end with .quickbase.com';
                        return true;
                    }
                },
                {
                    type: 'password',
                    name: 'userToken',
                    message: 'Quickbase user token:',
                    validate: (input) => {
                        if (!input) return 'User token is required';
                        return true;
                    }
                }
            ]);

            // Create project structure
            const dirs = ['apps', 'schemas', 'migrations', 'scripts'];
            dirs.forEach(dir => {
                const path = join(process.cwd(), dir);
                if (!existsSync(path)) {
                    mkdirSync(path, { recursive: true });
                }
            });

            // Create config file
            const configContent = `export default {
  projectName: '${answers.projectName}',
  quickbase: {
    realm: '${answers.realm}',
    userToken: process.env.QB_USER_TOKEN || '${answers.userToken}'
  },
  deploy: {
    concurrent: 5,
    retries: 3,
    timeout: 30000
  },
  validation: {
    strict: true,
    allowUnknownFields: false
  }
};
`;

            writeFileSync(join(process.cwd(), 'quickbase.config.js'), configContent);

            // Create .env file
            const envContent = `QB_REALM=${answers.realm}
QB_USER_TOKEN=${answers.userToken}
`;

            writeFileSync(join(process.cwd(), '.env'), envContent);

            // Create .gitignore
            const gitignoreContent = `.env
node_modules/
.DS_Store
*.log
.quickbase-cache/
`;

            writeFileSync(join(process.cwd(), '.gitignore'), gitignoreContent);

            // Create example app schema
            const exampleSchema = `name: Example App
description: This is an example Quickbase application
dateFormat: MM-DD-YYYY
timeZone: US/Eastern

tables:
  - name: Contacts
    description: Store contact information
    singleRecordName: Contact
    pluralRecordName: Contacts
    fields:
      - label: First Name
        fieldType: text
        required: true
      - label: Last Name
        fieldType: text
        required: true
      - label: Email
        fieldType: email
        unique: true
      - label: Phone
        fieldType: phone
      - label: Company
        fieldType: text
      - label: Notes
        fieldType: rich-text
      - label: Created Date
        fieldType: datetime
        appearsByDefault: true
    reports:
      - name: All Contacts
        type: table
        query:
          sortBy:
            - fieldId: 2
              order: ASC
      - name: Recent Contacts
        type: table
        query:
          where: "{7.OAF.'7 days'}"
          sortBy:
            - fieldId: 7
              order: DESC

  - name: Companies
    description: Store company information
    singleRecordName: Company
    pluralRecordName: Companies
    fields:
      - label: Company Name
        fieldType: text
        required: true
        unique: true
      - label: Industry
        fieldType: text
      - label: Website
        fieldType: url
      - label: Address
        fieldType: address
      - label: Notes
        fieldType: rich-text
`;

            writeFileSync(join(process.cwd(), 'apps', 'example-app.yaml'), exampleSchema);

            // Create README
            const readmeContent = `# ${answers.projectName}

This is a Quickbase development project managed with quickbase-devtools.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Configure your environment:
   - Edit \`.env\` with your Quickbase credentials
   - Modify \`quickbase.config.js\` as needed

3. Create or modify app schemas in the \`apps/\` directory

4. Deploy your apps:
   \`\`\`bash
   npm run deploy example-app
   \`\`\`

## Commands

- \`npm run init\` - Initialize a new project
- \`npm run deploy [app-name]\` - Deploy an app to Quickbase
- \`npm run pull [app-id] [app-name]\` - Pull an existing app from Quickbase
- \`npm run validate [app-name]\` - Validate an app schema
- \`npm run diff [app-name]\` - Compare local and remote schemas

## Project Structure

- \`apps/\` - Application schema files (YAML)
- \`schemas/\` - Reusable schema components
- \`migrations/\` - Database migration scripts
- \`scripts/\` - Custom automation scripts
`;

            writeFileSync(join(process.cwd(), 'README.md'), readmeContent);

            console.log(chalk.green('\n✅ Project initialized successfully!\n'));
            console.log(chalk.cyan('Next steps:'));
            console.log('1. Review and modify the example app schema in apps/example-app.yaml');
            console.log('2. Run "npm install" to install dependencies');
            console.log('3. Run "npm run deploy example-app" to deploy the example app');
        });
}