#!/usr/bin/env node

/**
 * Filter OpenAPI spec to GET-only endpoints and generate reference docs.
 *
 * Usage: node filter-openapi.cjs [input]
 *   input - path to full openapi.json (default: ../../../../website/static/openapi.json)
 *
 * Outputs (in ../references/):
 *   openapi-readonly.json - GET-only OpenAPI spec
 *   api-endpoints.md      - Human-readable endpoint reference grouped by service
 */

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2]
  || path.resolve(__dirname, '../../../website/static/openapi.json');
const refsDir = path.resolve(__dirname, '../references');
const jsonOutputPath = path.join(refsDir, 'openapi-readonly.json');
const mdOutputPath = path.join(refsDir, 'api-endpoints.md');

const spec = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

// --- Step 1: Filter to GET-only paths ---

const filteredPaths = {};
for (const [route, methods] of Object.entries(spec.paths || {})) {
  if (methods.get) {
    filteredPaths[route] = { get: methods.get };
  }
}

// --- Step 2: Collect referenced schemas (transitive) ---

const referencedSchemas = new Set();

function collectRefs(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach(collectRefs);
    return;
  }
  for (const [key, value] of Object.entries(obj)) {
    if (key === '$ref' && typeof value === 'string') {
      const match = value.match(/#\/components\/schemas\/(.+)/);
      if (match) referencedSchemas.add(match[1]);
    }
    collectRefs(value);
  }
}

collectRefs(filteredPaths);

let prevSize = 0;
const allSchemas = spec.components?.schemas || {};
while (referencedSchemas.size !== prevSize) {
  prevSize = referencedSchemas.size;
  for (const name of [...referencedSchemas]) {
    if (allSchemas[name]) {
      collectRefs(allSchemas[name]);
    }
  }
}

const filteredSchemas = {};
for (const name of referencedSchemas) {
  if (allSchemas[name]) {
    filteredSchemas[name] = allSchemas[name];
  }
}

// --- Step 3: Redact sensitive fields from response schemas ---

const sensitiveFields = [
  'modelApiKey', 'customModelBaseUrl', 'apiKey',
  'secret', 'token', 'password', 'credential',
];

function redactSensitiveProperties(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach(redactSensitiveProperties);
    return;
  }
  if (obj.properties && typeof obj.properties === 'object') {
    for (const field of sensitiveFields) {
      if (obj.properties[field]) {
        obj.properties[field] = {
          type: 'string',
          description: '[REDACTED] This field may contain sensitive data and should not be displayed.',
        };
      }
    }
  }
  for (const value of Object.values(obj)) {
    redactSensitiveProperties(value);
  }
}

redactSensitiveProperties(filteredSchemas);
redactSensitiveProperties(filteredPaths);

// --- Step 4: Write openapi-readonly.json ---

const output = {
  openapi: spec.openapi,
  info: {
    ...spec.info,
    title: spec.info?.title + ' (Read-Only)',
    description: 'Filtered OpenAPI spec containing only GET endpoints for safe read-only access.',
  },
  servers: spec.servers,
  paths: filteredPaths,
  components: {
    ...spec.components,
    schemas: filteredSchemas,
  },
};

if (output.components?.securitySchemes) {
  output.components.securitySchemes = spec.components.securitySchemes;
}

fs.mkdirSync(refsDir, { recursive: true });
fs.writeFileSync(jsonOutputPath, JSON.stringify(output, null, 2), 'utf-8');

// --- Step 5: Generate api-endpoints.md ---

const byTag = {};
for (const [route, methods] of Object.entries(filteredPaths)) {
  const op = methods.get;
  const tag = (op.tags && op.tags[0]) || 'Other';
  if (!byTag[tag]) byTag[tag] = [];

  const params = (op.parameters || []).map((p) => {
    let s = p.name;
    if (!p.required) s += '?';
    s += ` (${p.in})`;
    if (p.schema && p.schema.enum) s += ' enum:' + p.schema.enum.join('|');
    if (p.schema && p.schema.default !== undefined) s += ' default:' + p.schema.default;
    return s;
  });

  byTag[tag].push({
    path: route,
    summary: op.summary || op.operationId || '',
    params,
  });
}

const tagOrder = [
  'Website', 'Monitor', 'Survey', 'Telemetry', 'Billing',
  'Feed', 'Application', 'AIGateway', 'AI',
  'Worker', 'Page', 'Workspace', 'Global', 'AuditLog',
];

const sortedTags = [
  ...tagOrder.filter((t) => byTag[t]),
  ...Object.keys(byTag).filter((t) => !tagOrder.includes(t)),
];

let md = `# Tianji API Endpoints (GET-only)\n\n`;
md += `Base path: \`{TIANJI_BASE_URL}/open\`\n`;
md += `Auth: \`Authorization: Bearer {TIANJI_API_KEY}\`\n`;
md += `Timestamps: milliseconds since epoch (e.g. \`1704067200000\`)\n\n---\n`;

for (const tag of sortedTags) {
  const endpoints = byTag[tag];
  md += `\n## ${tag} (${endpoints.length})\n\n`;
  md += `| Endpoint | Summary | Key Params |\n`;
  md += `|----------|---------|------------|\n`;

  for (const ep of endpoints) {
    const nonPathParams = ep.params.filter((p) => !p.includes('(path)'));
    const paramStr = nonPathParams.length > 0
      ? nonPathParams.map((p) => `\`${p}\``).join(', ')
      : '\u2014';
    md += `| \`GET ${ep.path}\` | ${ep.summary} | ${paramStr} |\n`;
  }
}

fs.writeFileSync(mdOutputPath, md, 'utf-8');

// --- Summary ---

const endpointCount = Object.keys(filteredPaths).length;
const schemaCount = Object.keys(filteredSchemas).length;
console.log(`Filtered: ${endpointCount} GET endpoints, ${schemaCount} schemas`);
console.log(`Output:`);
console.log(`  ${jsonOutputPath}`);
console.log(`  ${mdOutputPath}`);
