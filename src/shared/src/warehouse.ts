import { z } from 'zod';

export const dateTypeSchema = z.enum([
  'timestamp', // for example: 1739203200
  'timestampMs', // for example: 1739203200000
  'date', // for example: 2025-08-01
  'datetime', // for example: 2025-08-01 00:00:00
]);

export const warehouseLongTableInsightsApplicationSchema = z.object({
  databaseUrl: z.string().optional(),
  name: z.string(),
  type: z.literal('longTable'), // long table
  eventTable: z.object({
    name: z.string(),
    eventNameField: z.string(),
    sessionIdField: z.string().optional(),
    createdAtField: z.string(),
    createdAtFieldType: dateTypeSchema.default('timestampMs'),
    dateBasedCreatedAtField: z.string().optional(), // for improve performance, treat as date type
  }),
  eventParametersTable: z.object({
    name: z.string(),
    eventNameField: z.string(),
    paramsNameField: z.string(),
    paramsValueField: z.string(),
    paramsValueNumberField: z.string().optional(),
    paramsValueStringField: z.string().optional(),
    paramsValueDateField: z.string().optional(),
    createdAtField: z.string(),
    createdAtFieldType: dateTypeSchema.default('timestampMs'),
    dateBasedCreatedAtField: z.string().optional(), // for improve performance, treat as date type
  }),
});

export const warehouseWideTableInsightsApplicationSchema = z.object({
  databaseUrl: z.string().optional(),
  name: z.string(),
  type: z.literal('wideTable'), // wide table
  tableName: z.string(),
  fields: z.array(
    z.object({
      name: z.string(),
      type: z.string().default('string'),
    })
  ),
  distinctField: z.string(),
  createdAtField: z.string(),
  createdAtFieldType: dateTypeSchema.default('timestampMs'),
  dateBasedCreatedAtField: z.string().optional(), // for improve performance, treat as date type
});

export const warehouseInsightsApplicationSchema = z.union([
  warehouseLongTableInsightsApplicationSchema,
  warehouseWideTableInsightsApplicationSchema,
]);

export type WarehouseInsightsApplication = z.infer<
  typeof warehouseInsightsApplicationSchema
>;

export const warehouseConfigSchema = z.object({
  enabled: z.boolean(),
  defaultDatabaseUrl: z.string().optional(),
  applications: z.array(warehouseInsightsApplicationSchema).default([]),
});

export type WarehouseConfig = z.infer<typeof warehouseConfigSchema>;

// Convert Zod schema to JSON Schema for Monaco Editor
export function getWarehouseConfigJsonSchema() {
  return {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        description: 'Enable warehouse functionality',
      },
      defaultDatabaseUrl: {
        type: 'string',
        description:
          'Default database connection URL for all applications (optional)',
      },
      applications: {
        type: 'array',
        description: 'List of warehouse applications',
        items: {
          oneOf: [
            {
              type: 'object',
              title: 'Long Table Application',
              properties: {
                databaseUrl: {
                  type: 'string',
                  description: 'Database connection URL (optional)',
                },
                name: {
                  type: 'string',
                  description: 'Application name',
                },
                type: {
                  type: 'string',
                  enum: ['longTable'],
                  description: 'Application type',
                },
                eventTable: {
                  type: 'object',
                  required: ['name', 'eventNameField', 'createdAtField'],
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Event table name',
                    },
                    eventNameField: {
                      type: 'string',
                      description: 'Event name field',
                    },
                    sessionIdField: {
                      type: 'string',
                      description: 'Session ID field (optional)',
                    },
                    createdAtField: {
                      type: 'string',
                      description: 'Created at field',
                    },
                    createdAtFieldType: {
                      type: 'string',
                      enum: ['timestamp', 'timestampMs', 'date', 'datetime'],
                      default: 'timestampMs',
                      description: 'Created at field type',
                    },
                    dateBasedCreatedAtField: {
                      type: 'string',
                      description:
                        'Date-based created at field (optional, for performance)',
                    },
                  },
                },
                eventParametersTable: {
                  type: 'object',
                  required: [
                    'name',
                    'eventNameField',
                    'paramsNameField',
                    'paramsValueField',
                    'createdAtField',
                  ],
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Event parameters table name',
                    },
                    eventNameField: {
                      type: 'string',
                      description: 'Event name field',
                    },
                    paramsNameField: {
                      type: 'string',
                      description: 'Parameter name field',
                    },
                    paramsValueField: {
                      type: 'string',
                      description: 'Parameter value field',
                    },
                    paramsValueNumberField: {
                      type: 'string',
                      description: 'Parameter value number field (optional)',
                    },
                    paramsValueStringField: {
                      type: 'string',
                      description: 'Parameter value string field (optional)',
                    },
                    paramsValueDateField: {
                      type: 'string',
                      description: 'Parameter value date field (optional)',
                    },
                    createdAtField: {
                      type: 'string',
                      description: 'Created at field',
                    },
                    createdAtFieldType: {
                      type: 'string',
                      enum: ['timestamp', 'timestampMs', 'date', 'datetime'],
                      default: 'timestampMs',
                      description: 'Created at field type',
                    },
                    dateBasedCreatedAtField: {
                      type: 'string',
                      description:
                        'Date-based created at field (optional, for performance)',
                    },
                  },
                },
              },
              required: ['name', 'type', 'eventTable', 'eventParametersTable'],
            },
            {
              type: 'object',
              title: 'Wide Table Application',
              properties: {
                databaseUrl: {
                  type: 'string',
                  description: 'Database connection URL (optional)',
                },
                name: {
                  type: 'string',
                  description: 'Application name',
                },
                type: {
                  type: 'string',
                  enum: ['wideTable'],
                  description: 'Application type',
                },
                tableName: {
                  type: 'string',
                  description: 'Table name',
                },
                fields: {
                  type: 'array',
                  description: 'Fields configuration',
                  items: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                      name: {
                        type: 'string',
                        description: 'Field name',
                      },
                      type: {
                        type: 'string',
                        default: 'string',
                        description: 'Field type',
                      },
                    },
                  },
                },
                distinctField: {
                  type: 'string',
                  description: 'Distinct field for counting unique values',
                },
                createdAtField: {
                  type: 'string',
                  description: 'Created at field',
                },
                createdAtFieldType: {
                  type: 'string',
                  enum: ['timestamp', 'timestampMs', 'date', 'datetime'],
                  default: 'timestampMs',
                  description: 'Created at field type',
                },
                dateBasedCreatedAtField: {
                  type: 'string',
                  description:
                    'Date-based created at field (optional, for performance)',
                },
              },
              required: [
                'name',
                'type',
                'tableName',
                'fields',
                'distinctField',
                'createdAtField',
              ],
            },
          ],
        },
      },
    },
    required: ['enabled'],
  };
}

// Default warehouse config
export const defaultWarehouseConfig = {
  enabled: false,
  defaultDatabaseUrl: undefined as string | undefined,
  applications: [] as WarehouseInsightsApplication[],
};

// Example warehouse config for documentation
export const exampleWarehouseConfig = {
  enabled: true,
  defaultDatabaseUrl: 'mysql://root:password@localhost:3306/default_db',
  applications: [
    {
      name: 'Analytics App',
      type: 'longTable',
      databaseUrl: 'mysql://root:password@localhost:3306/example',
      eventTable: {
        name: 'events',
        eventNameField: 'event_name',
        sessionIdField: 'session_id',
        createdAtField: 'created_at',
        createdAtFieldType: 'timestampMs',
        dateBasedCreatedAtField: 'date',
      },
      eventParametersTable: {
        name: 'event_parameters',
        eventNameField: 'event_name',
        paramsNameField: 'param_name',
        paramsValueField: 'param_value',
        paramsValueNumberField: 'param_value_number',
        paramsValueStringField: 'param_value_string',
        createdAtField: 'created_at',
        createdAtFieldType: 'timestampMs',
      },
    },
    {
      name: 'User Metrics',
      type: 'wideTable',
      databaseUrl: 'mysql://root:password@localhost:3306/example',
      tableName: 'user_metrics',
      fields: [
        { name: 'user_id', type: 'string' },
        { name: 'action', type: 'string' },
        { name: 'count', type: 'number' },
      ],
      distinctField: 'user_id',
      createdAtField: 'timestamp',
      createdAtFieldType: 'timestamp',
    },
  ] as WarehouseInsightsApplication[],
} as const;

// Validation function
export function validateWarehouseConfig(config: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    if (typeof config !== 'object' || config === null) {
      errors.push('Config must be an object');
      return { isValid: false, errors };
    }

    if (typeof config.enabled !== 'boolean') {
      errors.push('enabled must be a boolean');
    }

    if (
      config.defaultDatabaseUrl !== undefined &&
      typeof config.defaultDatabaseUrl !== 'string'
    ) {
      errors.push('defaultDatabaseUrl must be a string if provided');
    }

    if (config.applications && Array.isArray(config.applications)) {
      config.applications.forEach((app: any, index: number) => {
        try {
          warehouseInsightsApplicationSchema.parse(app);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(`Application ${index}: ${error.message}`);
          }
        }
      });
    } else if (config.applications !== undefined) {
      errors.push('applications must be an array');
    }

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    errors.push('Invalid JSON structure');
    return { isValid: false, errors };
  }
}
