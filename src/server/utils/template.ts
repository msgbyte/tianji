const templateRegex = /{{\s*([A-Za-z_][A-Za-z0-9_]*)\s*}}/g;
const templateDetectorRegex = /{{\s*[A-Za-z_][A-Za-z0-9_]*\s*}}/;

/**
 * @example
 *
 * buildTemplate('hello {{ user }}!', { user: 'mustache' })
 * => 'hello mustache!'
 */
export function formatString(raw: string, variable: Record<string, unknown>) {
  return raw.replace(templateRegex, (_, key: string) => {
    const value = variable[key];
    return value === null || value === undefined ? '' : String(value);
  });
}

export function hasTemplateRegex(raw: string) {
  return templateDetectorRegex.test(raw);
}
