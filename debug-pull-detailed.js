import dotenv from 'dotenv';
import { QuickbaseClient } from './src/api/client.js';
import { SchemaService } from './src/services/schema.service.js';
import chalk from 'chalk';

dotenv.config();

async function debugPullDetailed() {
    const client = new QuickbaseClient();
    const schemaService = new SchemaService();
    const appId = 'bsmgdfskx';
    const appName = 'test';

    console.log(chalk.blue('Starting detailed pull debug...\n'));

    try {
        // Step 1: Get app details
        console.log(chalk.yellow('Step 1: Getting app details...'));
        const app = await client.getApp(appId);
        console.log(chalk.green('✅ App found:'), app.name);
        console.log('   ID:', app.id);
        console.log('   Created:', app.created);
        console.log('   Updated:', app.updated);

        // Step 2: Get tables
        console.log(chalk.yellow('\nStep 2: Getting tables...'));
        const tables = await client.getTables(appId);
        console.log(chalk.green('✅ Found'), tables.length, 'tables:');
        tables.forEach(table => {
            console.log(`   - ${table.name} (${table.id})`);
        });

        // Step 3: Build initial schema
        console.log(chalk.yellow('\nStep 3: Building schema...'));
        const schema = {
            id: app.id,
            name: app.name,
            description: app.description,
            dateFormat: app.dateFormat || 'MM-DD-YYYY',
            timeZone: app.timeZone || 'US/Eastern',
            variables: app.variables || {},
            tables: []
        };

        // Step 4: Process each table
        for (const [index, table] of tables.entries()) {
            console.log(chalk.yellow(`\nStep 4.${index + 1}: Processing table "${table.name}"...`));

            try {
                // Get fields
                console.log('   Getting fields...');
                const fields = await client.getFields(table.id);
                console.log(`   ✅ Found ${fields.length} fields`);

                // Build table schema
                const tableSchema = {
                    id: table.id,
                    name: table.name,
                    description: table.description,
                    singleRecordName: table.singleRecordName,
                    pluralRecordName: table.pluralRecordName,
                    fields: fields.map(f => ({
                        id: f.id,
                        label: f.label,
                        fieldType: f.fieldType,
                        required: f.required || false,
                        unique: f.unique || false,
                        appearsByDefault: f.appearsByDefault !== false,
                        findEnabled: f.findEnabled !== false,
                        properties: f.properties || {}
                    }))
                };

                schema.tables.push(tableSchema);
                console.log(chalk.green(`   ✅ Table "${table.name}" processed successfully`));

            } catch (error) {
                console.log(chalk.red(`   ❌ Error processing table: ${error.message}`));
            }
        }

        // Step 5: Save schema
        console.log(chalk.yellow('\nStep 5: Saving schema...'));
        const savedSchema = schemaService.saveAppSchema(appName, schema);
        console.log(chalk.green('✅ Schema saved to:'), `apps/${appName}.yaml`);

        console.log(chalk.green('\n🎉 Pull completed successfully!'));

    } catch (error) {
        console.error(chalk.red('\n❌ Error:'), error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

debugPullDetailed();