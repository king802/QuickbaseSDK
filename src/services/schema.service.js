import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { AppSchema } from '../schemas/app.schema.js';
import { config } from '../config/index.js';

export class SchemaService {
    constructor() {
        this.ensureDirectories();
    }

    ensureDirectories() {
        const dirs = [config.paths.apps, config.paths.schemas, config.paths.migrations];
        dirs.forEach(dir => {
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
        });
    }

    loadAppSchema(appName) {
        const schemaPath = join(config.paths.apps, `${appName}.yaml`);
        if (!existsSync(schemaPath)) {
            throw new Error(`App schema not found: ${appName}`);
        }

        const content = readFileSync(schemaPath, 'utf8');
        const schema = yaml.load(content);
        return AppSchema.parse(schema);
    }

    saveAppSchema(appName, schema) {
        const validated = AppSchema.parse(schema);
        const schemaPath = join(config.paths.apps, `${appName}.yaml`);
        const content = yaml.dump(validated, { indent: 2 });
        writeFileSync(schemaPath, content);
        return validated;
    }

    loadAllAppSchemas() {
        const apps = {};
        const appFiles = readdirSync(config.paths.apps).filter(f => f.endsWith('.yaml'));

        appFiles.forEach(file => {
            const appName = file.replace('.yaml', '');
            apps[appName] = this.loadAppSchema(appName);
        });

        return apps;
    }

    validateSchema(schema) {
        try {
            return { valid: true, data: AppSchema.parse(schema) };
        } catch (error) {
            return { valid: false, errors: error.errors };
        }
    }
}