import { template, templateSettings } from 'lodash-es';

templateSettings.interpolate = /{{([\s\S]+?)}}/g;

/**
 * @example
 *
 * buildTemplate('hello {{ user }}!', { user: 'mustache' })
 * => 'hello mustache!'
 */
export function formatString(raw: string, variable: Record<string, string>) {
  return template(raw)(variable);
}
