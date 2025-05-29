import { QuickbaseClient } from '../api/client.js';
import { SchemaService } from './schema.service.js';
import { PullService } from './pull.service.js';
import chalk from 'chalk';

export class DiffService {
  constructor(client = new QuickbaseClient()) {
    this.client = client;
    this.schemaService = new SchemaService();
    this.pullService = new PullService(client);
  }

  async diffApp(appName) {
    // Load local schema
    const localSchema = this.schemaService.loadAppSchema(appName);

    if (!localSchema.id) {
      console.log(chalk.yellow('App has not been deployed yet'));
      return;
    }

    // Pull remote schema
    console.log(chalk.blue('Pulling remote schema...'));
    const remoteSchema = await this.pullService.pullApp(localSchema.id, '_temp_remote');

    // Compare schemas
    const differences = this.compareSchemas(localSchema, remoteSchema);

    // Display differences
    this.displayDifferences(differences);

    return differences;
  }

  compareSchemas(local, remote) {
    const differences = {
      app: this.compareObjects(local, remote, ['tables', 'webhooks', 'roles']),
      tables: {
        added: [],
        removed: [],
        modified: []
      },
      fields: {},
      reports: {},
      webhooks: {
        added: [],
        removed: [],
        modified: []
      }
    };

    // Compare tables
    const localTables = new Map(local.tables.map(t => [t.name, t]));
    const remoteTables = new Map(remote.tables.map(t => [t.name, t]));

    // Find added tables
    for (const [name, table] of localTables) {
      if (!remoteTables.has(name)) {
        differences.tables.added.push(table);
      }
    }

    // Find removed tables
    for (const [name, table] of remoteTables) {
      if (!localTables.has(name)) {
        differences.tables.removed.push(table);
      }
    }

    // Find modified tables
    for (const [name, localTable] of localTables) {
      const remoteTable = remoteTables.get(name);
      if (remoteTable) {
        const tableDiff = this.compareTables(localTable, remoteTable);
        if (tableDiff.hasChanges) {
          differences.tables.modified.push({
            name,
            changes: tableDiff
          });
          differences.fields[name] = tableDiff.fields;
          differences.reports[name] = tableDiff.reports;
        }
      }
    }

    // Compare webhooks
    if (local.webhooks || remote.webhooks) {
      const localWebhooks = new Map((local.webhooks || []).map(w => [w.name, w]));
      const remoteWebhooks = new Map((remote.webhooks || []).map(w => [w.name, w]));

      for (const [name, webhook] of localWebhooks) {
        if (!remoteWebhooks.has(name)) {
          differences.webhooks.added.push(webhook);
        } else {
          const remoteWebhook = remoteWebhooks.get(name);
          const webhookDiff = this.compareObjects(webhook, remoteWebhook);
          if (Object.keys(webhookDiff).length > 0) {
            differences.webhooks.modified.push({ name, changes: webhookDiff });
          }
        }
      }

      for (const [name, webhook] of remoteWebhooks) {
        if (!localWebhooks.has(name)) {
          differences.webhooks.removed.push(webhook);
        }
      }
    }

    return differences;
  }

  compareTables(local, remote) {
    const changes = {
      hasChanges: false,
      properties: this.compareObjects(local, remote, ['fields', 'reports', 'relationships']),
      fields: {
        added: [],
        removed: [],
        modified: []
      },
      reports: {
        added: [],
        removed: [],
        modified: []
      }
    };

    if (Object.keys(changes.properties).length > 0) {
      changes.hasChanges = true;
    }

    // Compare fields
    const localFields = new Map(local.fields.map(f => [f.label, f]));
    const remoteFields = new Map(remote.fields.map(f => [f.label, f]));

    for (const [label, field] of localFields) {
      if (!remoteFields.has(label)) {
        changes.fields.added.push(field);
        changes.hasChanges = true;
      } else {
        const remoteField = remoteFields.get(label);
        const fieldDiff = this.compareObjects(field, remoteField, ['id']);
        if (Object.keys(fieldDiff).length > 0) {
          changes.fields.modified.push({ label, changes: fieldDiff });
          changes.hasChanges = true;
        }
      }
    }

    for (const [label, field] of remoteFields) {
      if (!localFields.has(label)) {
        changes.fields.removed.push(field);
        changes.hasChanges = true;
      }
    }

    // Compare reports
    if (local.reports || remote.reports) {
      const localReports = new Map((local.reports || []).map(r => [r.name, r]));
      const remoteReports = new Map((remote.reports || []).map(r => [r.name, r]));

      for (const [name, report] of localReports) {
        if (!remoteReports.has(name)) {
          changes.reports.added.push(report);
          changes.hasChanges = true;
        } else {
          const remoteReport = remoteReports.get(name);
          const reportDiff = this.compareObjects(report, remoteReport);
          if (Object.keys(reportDiff).length > 0) {
            changes.reports.modified.push({ name, changes: reportDiff });
            changes.hasChanges = true;
          }
        }
      }

      for (const [name, report] of remoteReports) {
        if (!localReports.has(name)) {
          changes.reports.removed.push(report);
          changes.hasChanges = true;
        }
      }
    }

    return changes;
  }

  compareObjects(local, remote, ignoreKeys = []) {
    const differences = {};
    const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const key of allKeys) {
      if (ignoreKeys.includes(key)) continue;

      const localValue = local[key];
      const remoteValue = remote[key];

      if (localValue === undefined && remoteValue !== undefined) {
        differences[key] = { type: 'removed', value: remoteValue };
      } else if (localValue !== undefined && remoteValue === undefined) {
        differences[key] = { type: 'added', value: localValue };
      } else if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
        differences[key] = { type: 'modified', local: localValue, remote: remoteValue };
      }
    }

    return differences;
  }

  displayDifferences(differences) {
    console.log(chalk.bold('\n📊 Schema Differences\n'));

    // App changes
    if (Object.keys(differences.app).length > 0) {
      console.log(chalk.yellow('App Configuration:'));
      for (const [key, diff] of Object.entries(differences.app)) {
        this.displayDiff(key, diff);
      }
      console.log();
    }

    // Table changes
    if (differences.tables.added.length > 0) {
      console.log(chalk.green('New Tables:'));
      differences.tables.added.forEach(t => console.log(`  + ${t.name}`));
      console.log();
    }

    if (differences.tables.removed.length > 0) {
      console.log(chalk.red('Removed Tables:'));
      differences.tables.removed.forEach(t => console.log(`  - ${t.name}`));
      console.log();
    }

    if (differences.tables.modified.length > 0) {
      console.log(chalk.yellow('Modified Tables:'));
      differences.tables.modified.forEach(t => {
        console.log(`  ~ ${t.name}`);

        // Show field changes
        const fieldChanges = differences.fields[t.name];
        if (fieldChanges) {
          if (fieldChanges.added.length > 0) {
            console.log(chalk.green('    New Fields:'));
            fieldChanges.added.forEach(f => console.log(`      + ${f.label} (${f.fieldType})`));
          }
          if (fieldChanges.removed.length > 0) {
            console.log(chalk.red('    Removed Fields:'));
            fieldChanges.removed.forEach(f => console.log(`      - ${f.label}`));
          }
          if (fieldChanges.modified.length > 0) {
            console.log(chalk.yellow('    Modified Fields:'));
            fieldChanges.modified.forEach(f => console.log(`      ~ ${f.label}`));
          }
        }
      });
      console.log();
    }

    // Webhook changes
    if (differences.webhooks.added.length > 0 ||
        differences.webhooks.removed.length > 0 ||
        differences.webhooks.modified.length > 0) {
      console.log(chalk.bold('Webhooks:'));

      if (differences.webhooks.added.length > 0) {
        console.log(chalk.green('  New:'));
        differences.webhooks.added.forEach(w => console.log(`    + ${w.name}`));
      }

      if (differences.webhooks.removed.length > 0) {
        console.log(chalk.red('  Removed:'));
        differences.webhooks.removed.forEach(w => console.log(`    - ${w.name}`));
      }

      if (differences.webhooks.modified.length > 0) {
        console.log(chalk.yellow('  Modified:'));
        differences.webhooks.modified.forEach(w => console.log(`    ~ ${w.name}`));
      }
    }
  }

  displayDiff(key, diff) {
    if (diff.type === 'added') {
      console.log(chalk.green(`  + ${key}: ${JSON.stringify(diff.value)}`));
    } else if (diff.type === 'removed') {
      console.log(chalk.red(`  - ${key}: ${JSON.stringify(diff.value)}`));
    } else if (diff.type === 'modified') {
      console.log(chalk.yellow(`  ~ ${key}:`));
      console.log(chalk.red(`    - ${JSON.stringify(diff.remote)}`));
      console.log(chalk.green(`    + ${JSON.stringify(diff.local)}`));
    }
  }
}
