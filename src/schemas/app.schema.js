import { z } from 'zod';

export const FieldTypeEnum = z.enum([
    'text',
    'text-multiple-choice',
    'text-multi-line',
    'rich-text',
    'numeric',
    'currency',
    'percent',
    'rating',
    'date',
    'datetime',
    'timestamp',
    'timeofday',
    'duration',
    'checkbox',
    'email',
    'phone',
    'url',
    'user',
    'multiuser',
    'address',
    'dblink',
    'file',
    'recordid',
    'predecessor',
    'lookup',
    'summary',
    'formula'
]);

export const FieldSchema = z.object({
    id: z.number().optional(),
    label: z.string(),
    fieldType: FieldTypeEnum,
    required: z.boolean().default(false),
    unique: z.boolean().default(false),
    appearsByDefault: z.boolean().default(true),
    findEnabled: z.boolean().default(true),
    properties: z.record(z.any()).optional(),
    permissions: z.object({
        role: z.string(),
        permissions: z.array(z.string())
    }).array().optional()
});

export const TableSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    singleRecordName: z.string().optional(),
    pluralRecordName: z.string().optional(),
    fields: z.array(FieldSchema),
    relationships: z.array(z.object({
        name: z.string(),
        parentTable: z.string(),
        lookupFieldIds: z.array(z.number()).optional(),
        summaryFields: z.array(z.object({
            label: z.string(),
            summaryFunction: z.enum(['sum', 'avg', 'min', 'max', 'count']),
            whereClause: z.string().optional()
        })).optional()
    })).optional(),
    reports: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        type: z.enum(['table', 'summary', 'chart', 'calendar', 'timeline']),
        query: z.object({
            where: z.string().optional(),
            groupBy: z.array(z.object({
                fieldId: z.number(),
                grouping: z.string()
            })).optional(),
            sortBy: z.array(z.object({
                fieldId: z.number(),
                order: z.enum(['ASC', 'DESC'])
            })).optional(),
            select: z.array(z.number()).optional()
        })
    })).optional(),
    forms: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        elements: z.array(z.any())
    })).optional()
});

export const AppSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    dateFormat: z.string().default('MM-DD-YYYY'),
    timeZone: z.string().default('US/Eastern'),
    variables: z.record(z.string()).optional(),
    tables: z.array(TableSchema),
    roles: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        access: z.array(z.object({
            table: z.string(),
            permissions: z.array(z.string())
        }))
    })).optional(),
    webhooks: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
        tableId: z.string(),
        eventTypes: z.array(z.string()),
        url: z.string(),
        headers: z.record(z.string()).optional()
    })).optional()
});