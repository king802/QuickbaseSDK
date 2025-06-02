import {QuickbaseClient} from '../api/client.js';
import {SchemaService} from './schema.service.js';
import chalk from 'chalk';
import ora from 'ora';

export class PullService {
    constructor(client = new QuickbaseClient()) {
        this.client = client;
        this.schemaService = new SchemaService();
    }

    async pullApp(appId, appName) {
        const spinner = ora(`Pulling app: ${appId}`).start();

        try {
            // Get app details
            const app = await this.client.getApp(appId);
            spinner.text = `Found app: ${app.name}`;

            // Get tables
            const tables = await this.client.getTables(appId);
            spinner.text = `Found ${tables.length} tables`;

            // Build schema
            const schema = {
                id: app.id,
                name: app.name,
                description: app.description,
                dateFormat: app.dateFormat || 'MM-DD-YYYY',
                timeZone: app.timeZone || 'US/Eastern',
                variables: app.variables || {},
                tables: []
            };

            // Pull each table
            for (const table of tables) {
                spinner.text = `Pulling table: ${table.name}`;
                const tableSchema = await this.pullTable(table.id, appId);
                schema.tables.push(tableSchema);
            }

            // Pull webhooks
            try {
                const events = await this.client.getAppEvents(appId);
                if (events.length > 0) {
                    schema.webhooks = events.map(e => ({
                        name: e.name,
                        description: e.description,
                        isActive: e.isActive,
                        tableId: e.tableId,
                        eventTypes: e.eventTypes,
                        url: e.url,
                        headers: e.headers
                    }));
                }
            } catch (error) {
                // Webhooks might not be available
                console.log(chalk.yellow('\nNote: Unable to pull webhooks (this is normal if webhooks are not configured)'));
            }

            // Save schema
            const savedSchema = this.schemaService.saveAppSchema(appName || app.name, schema);

            spinner.succeed(`Successfully pulled app: ${app.name}`);
            return savedSchema;

        } catch (error) {
            spinner.fail(`Failed to pull app: ${error.message}`);
            throw error;
        }
    }

    async pullTable(tableId, appId) {
        // Get table details
        const table = await this.client.getTable(tableId);

        // Get fields
        const fields = await this.client.getFields(tableId);

        // Get reports - handle gracefully if they fail
        let reports = [];
        try {
            reports = await this.client.getReports(tableId, appId);
        } catch (error) {
            console.log(chalk.yellow(`\nNote: Unable to pull reports for table ${table.name}`));
            if (error.response) {
                console.log(chalk.yellow(`API Error: ${error.response.data?.description || error.message}`));
            }
        }

        // Extract relationships from table metadata
        let relationships = [];
        if (table.relationships) {
            relationships = table.relationships;
        }

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

        // Only add reports if we have any
        if (reports.length > 0) {
            tableSchema.reports = reports.map(r => ({
                name: r.name,
                description: r.description,
                type: r.type,
                query: r.query
            }));
        }

        // Only add relationships if we have any
        if (relationships.length > 0) {
            tableSchema.relationships = relationships.map(r => ({
                name: r.name,
                parentTable: r.parentTable,
                lookupFieldIds: r.lookupFieldIds,
                summaryFields: r.summaryFields
            }));
        }

        return tableSchema;
    }
}