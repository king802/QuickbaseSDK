import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

dotenv.config();

export const config = {
    quickbase: {
        realm: process.env.QB_REALM,
        userToken: process.env.QB_USER_TOKEN,
        apiUrl: 'https://api.quickbase.com/v1'
    },
    paths: {
        root: process.cwd(),
        apps: join(process.cwd(), 'apps'),
        schemas: join(process.cwd(), 'schemas'),
        migrations: join(process.cwd(), 'migrations'),
        config: join(process.cwd(), 'quickbase.config.js')
    }
};

export function loadProjectConfig() {
    const configPath = config.paths.config;
    if (existsSync(configPath)) {
        return import(configPath).then(m => m.default);
    }
    return {};
}
