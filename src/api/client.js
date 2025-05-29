import axios from 'axios';
import {config} from '../config/index.js';

export class QuickbaseClient {
    constructor(realm = config.quickbase.realm, userToken = config.quickbase.userToken) {
        this.realm = realm;
        this.userToken = userToken;
        this.apiUrl = config.quickbase.apiUrl;

        // Ensure realm doesn't have https://
        if (this.realm && this.realm.includes('https://')) {
            this.realm = this.realm.replace('https://', '');
        }

        this.axios = axios.create({
            baseURL: this.apiUrl,
            headers: {
                'QB-Realm-Hostname': this.realm,
                'Authorization': `QB-USER-TOKEN ${this.userToken}`,
                'Content-Type': 'application/json'
            }
        });

        // Add error interceptor for better error messages
        this.axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response) {
                    console.error('Quickbase API Error:', {
                        status: error.response.status,
                        message: error.response.data?.message || error.response.statusText,
                        description: error.response.data?.description
                    });
                }
                throw error;
            }
        );
    }

    // App Management
    async getApp(appId) {
        const response = await this.axios.get(`/apps/${appId}`);
        return response.data;
    }

    async createApp(data) {
        const response = await this.axios.post('/apps', data);
        return response.data;
    }

    async updateApp(appId, data) {
        const response = await this.axios.post(`/apps/${appId}`, data);
        return response.data;
    }

    async deleteApp(appId) {
        const response = await this.axios.delete(`/apps/${appId}`);
        return response.data;
    }

    // Table Management - Fixed parameter format
    async getTables(appId) {
        const response = await this.axios.get('/tables', {
            params: {appId}
        });
        return response.data;
    }

    async getTable(tableId) {
        const response = await this.axios.get(`/tables/${tableId}`);
        return response.data;
    }

    async createTable(appId, data) {
        const response = await this.axios.post('/tables', {
            ...data,
            appId
        });
        return response.data;
    }

    async updateTable(tableId, data) {
        const response = await this.axios.post(`/tables/${tableId}`, data);
        return response.data;
    }

    async deleteTable(tableId) {
        const response = await this.axios.delete(`/tables/${tableId}`);
        return response.data;
    }

    // Field Management - Fixed parameter format
    async getFields(tableId) {
        const response = await this.axios.get('/fields', {
            params: {tableId}
        });
        return response.data;
    }

    async getField(fieldId, tableId) {
        const response = await this.axios.get(`/fields/${fieldId}`, {
            params: {tableId}
        });
        return response.data;
    }

    async createField(tableId, data) {
        const response = await this.axios.post('/fields', {
            ...data,
            tableId
        });
        return response.data;
    }

    async updateField(fieldId, tableId, data) {
        const response = await this.axios.post(`/fields/${fieldId}`, {
            ...data,
            tableId
        });
        return response.data;
    }

    async deleteField(fieldId, tableId) {
        const response = await this.axios.delete(`/fields/${fieldId}`, {
            params: {tableId}
        });
        return response.data;
    }

    // Record Management
    async query(tableId, query) {
        const response = await this.axios.post('/records/query', {
            from: tableId,
            ...query
        });
        return response.data;
    }

    async createRecords(tableId, records) {
        const response = await this.axios.post('/records', {
            to: tableId,
            data: records
        });
        return response.data;
    }

    async updateRecords(tableId, records) {
        const response = await this.axios.post('/records', {
            to: tableId,
            data: records
        });
        return response.data;
    }

    async deleteRecords(tableId, query) {
        const response = await this.axios.delete('/records', {
            data: {
                from: tableId,
                where: query
            }
        });
        return response.data;
    }

    // Relationship Management
    async getRelationships(tableId) {
        const response = await this.axios.get('/relationships', {
            params: {tableId}
        });
        return response.data;
    }

    async createRelationship(parentTableId, data) {
        const response = await this.axios.post(`/tables/${parentTableId}/relationship`, data);
        return response.data;
    }

    async updateRelationship(relationshipId, tableId, data) {
        const response = await this.axios.post(`/tables/${tableId}/relationship/${relationshipId}`, data);
        return response.data;
    }

    async deleteRelationship(relationshipId, tableId) {
        const response = await this.axios.delete(`/tables/${tableId}/relationship/${relationshipId}`);
        return response.data;
    }

    // Report Management - Fixed parameter format
    async getReports(tableId, appId) {
        const response = await this.axios.get('/reports', {
            params: {tableId, appId}
        });
        return response.data;
    }

    async getReport(reportId, tableId, appId) {
        const response = await this.axios.get(`/reports/${reportId}`, {
            params: {tableId, appId}
        });
        return response.data;
    }

    async createReport(tableId, appId, data) {
        const response = await this.axios.post('/reports', {
            ...data,
            tableId,
            appId
        });
        return response.data;
    }

    async updateReport(reportId, tableId, appId, data) {
        const response = await this.axios.post(`/reports/${reportId}`, {
            ...data,
            tableId,
            appId
        });
        return response.data;
    }

    async deleteReport(reportId, tableId, appId) {
        const response = await this.axios.delete(`/reports/${reportId}`, {
            params: {tableId, appId}
        });
        return response.data;
    }

    // User Management
    async getUsers(accountId) {
        const response = await this.axios.get('/users', {
            params: {accountId}
        });
        return response.data;
    }

    async getUser(userId) {
        const response = await this.axios.get(`/users/${userId}`);
        return response.data;
    }

    // App Events (Webhooks)
    async getAppEvents(appId) {
        const response = await this.axios.get(`/apps/${appId}/events`);
        return response.data;
    }

    async createAppEvent(appId, data) {
        const response = await this.axios.post(`/apps/${appId}/events`, data);
        return response.data;
    }

    async deleteAppEvent(appId, eventId) {
        const response = await this.axios.delete(`/apps/${appId}/events/${eventId}`);
        return response.data;
    }
}