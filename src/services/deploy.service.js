import { QuickbaseClient } from '../api/client.js';
import { SchemaService } from './schema.service.js';
import chalk from 'chalk';
import ora from 'ora';

export class DeployService {
    constructor(client = new QuickbaseClient()) {
        this.client = client;
        this.schemaService = new SchemaService();
    }

    async deployApp(appName, options = {}) {
        const spinner = ora(`Deploying app: ${appName}`).start();

        try {
            // Load local schema
            const localSchema = this.schemaService.loadAppSchema(appName);

            let app;
            let isNewApp = false;

            // Check if app exists
            if (localSchema.id) {
                try {
                    app = await this.client.getApp(localSchema.id);
                    spinner.text = `Found existing app: ${app.name}`;
                } catch (error) {
                    if (error.response?.status === 404) {
                        isNewApp = true;
                    } else {
                        throw error;
                    }
                }
            } else {
                isNewApp = true;
            }

            // Create or update app
            if (isNewApp) {
                spinner.text = `Creating new app: ${localSchema.name}`;
                const createData = {
                    name: localSchema.name,
                    description: localSchema.description,
                    dateFormat: localSchema.dateFormat,
                    timeZone: localSchema.timeZone,
                    variables: localSchema.variables
                };
                app = await this.client.createApp(createData);

                // Update local schema with app ID
                localSchema.id = app.id;
                this.schemaService.saveAppSchema(appName, localSchema);

                spinner.succeed(`Created app: ${app.name} (${app.id})`);
            } else {
                spinner.text = `Updating app: ${app.name}`;
                const updateData = {
                    name: localSchema.name,
                    description: localSchema.description,
                    dateFormat: localSchema.dateFormat,
                    timeZone: localSchema.timeZone,
                    variables: localSchema.variables
                };
                await this.client.updateApp(app.id, updateData);
                spinner.succeed(`Updated app: ${app.name}`);
            }

            // Deploy tables
            await this.deployTables(app.id, localSchema.tables);

            // Deploy roles
            if (localSchema.roles) {
                await this.deployRoles(app.id, localSchema.roles);
            }

            // Deploy webhooks
            if (localSchema.webhooks) {
                await this.deployWebhooks(app.id, localSchema.webhooks);
            }

            spinner.succeed(`Successfully deployed app: ${appName}`);
            return app;

        } catch (error) {
            spinner.fail(`Failed to deploy app: ${error.message}`);
            throw error;
        }
    }

    async deployTables(appId, tables) {
        const spinner = ora('Deploying tables').start();

        try {
            // Get existing tables
            const existingTables = await this.client.getTables(appId);
            const existingTableMap = new Map(existingTables.map(t => [t.name, t]));

            for (const tableSchema of tables) {
                const existingTable = existingTableMap.get(tableSchema.name);

                if (existingTable) {
                    spinner.text = `Updating table: ${tableSchema.name}`;
                    await this.updateTable(existingTable.id, tableSchema);
                } else {
                    spinner.text = `Creating table: ${tableSchema.name}`;
                    const newTable = await this.createTable(appId, tableSchema);
                    tableSchema.id = newTable.id;
                }
            }

            spinner.succeed('Successfully deployed tables');
        } catch (error) {
            spinner.fail(`Failed to deploy tables: ${error.message}`);
            throw error;
        }
    }

    async createTable(appId, tableSchema) {
        const createData = {
            name: tableSchema.name,
            description: tableSchema.description,
            singleRecordName: tableSchema.singleRecordName,
            pluralRecordName: tableSchema.pluralRecordName
        };

        const table = await this.client.createTable(appId, createData);

        // Create fields
        await this.deployFields(table.id, tableSchema.fields);

        // Create reports
        if (tableSchema.reports) {
            await this.deployReports(table.id, tableSchema.reports);
        }

        return table;
    }

    async updateTable(tableId, tableSchema) {
        const updateData = {
            name: tableSchema.name,
            description: tableSchema.description,
            singleRecordName: tableSchema.singleRecordName,
            pluralRecordName: tableSchema.pluralRecordName
        };

        await this.client.updateTable(tableId, updateData);

        // Update fields
        await this.deployFields(tableId, tableSchema.fields);

        // Update reports
        if (tableSchema.reports) {
            await this.deployReports(tableId, tableSchema.reports);
        }
    }

    async deployFields(tableId, fields) {
        const existingFields = await this.client.getFields(tableId);
        const existingFieldMap = new Map(existingFields.map(f => [f.label, f]));

        for (const fieldSchema of fields) {
            const existingField = existingFieldMap.get(fieldSchema.label);

            if (existingField) {
                // Update field
                const updateData = {
                    label: fieldSchema.label,
                    required: fieldSchema.required,
                    unique: fieldSchema.unique,
                    appearsByDefault: fieldSchema.appearsByDefault,
                    findEnabled: fieldSchema.findEnabled,
                    properties: fieldSchema.properties
                };
                await this.client.updateField(existingField.id, tableId, updateData);
            } else {
                // Create field
                const createData = {
                    label: fieldSchema.label,
                    fieldType: fieldSchema.fieldType,
                    required: fieldSchema.required,
                    unique: fieldSchema.unique,
                    appearsByDefault: fieldSchema.appearsByDefault,
                    findEnabled: fieldSchema.findEnabled,
                    properties: fieldSchema.properties
                };
                const newField = await this.client.createField(tableId, createData);
                fieldSchema.id = newField.id;
            }
        }
    }

    async deployReports(tableId, reports) {
        const existingReports = await this.client.getReports(tableId);
        const existingReportMap = new Map(existingReports.map(r => [r.name, r]));

        for (const reportSchema of reports) {
            const existingReport = existingReportMap.get(reportSchema.name);

            const reportData = {
                name: reportSchema.name,
                description: reportSchema.description,
                type: reportSchema.type,
                query: reportSchema.query
            };

            if (existingReport) {
                await this.client.updateReport(existingReport.id, tableId, reportData);
            } else {
                await this.client.createReport(tableId, reportData);
            }
        }
    }

    async deployRoles(appId, roles) {
        // Role management would be implemented here
        // The Quickbase API has limited role management capabilities
        console.log(chalk.yellow('Role deployment not yet implemented'));
    }

    async deployWebhooks(appId, webhooks) {
        const existingEvents = await this.client.getAppEvents(appId);
        const existingEventMap = new Map(existingEvents.map(e => [e.name, e]));

        for (const webhookSchema of webhooks) {
            const existingEvent = existingEventMap.get(webhookSchema.name);

            const eventData = {
                name: webhookSchema.name,
                description: webhookSchema.description,
                isActive: webhookSchema.isActive,
                tableId: webhookSchema.tableId,
                eventTypes: webhookSchema.eventTypes,
                url: webhookSchema.url,
                headers: webhookSchema.headers
            };

            if (existingEvent) {
                // Update webhook
                await this.client.deleteAppEvent(appId, existingEvent.id);
                await this.client.createAppEvent(appId, eventData);
            } else {
                // Create webhook
                await this.client.createAppEvent(appId, eventData);
            }
        }
    }
}