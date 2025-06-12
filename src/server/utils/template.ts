import { template, templateSettings } from 'lodash-es';

const templateRegex = /{{([\s\S]+?)}}/g;
templateSettings.interpolate = templateRegex;

/**
 * @example
 *
 * buildTemplate('hello {{ user }}!', { user: 'mustache' })
 * => 'hello mustache!'
 */
export function formatString(raw: string, variable: Record<string, string>) {
  return template(raw)(variable);
}

export function hasTemplateRegex(raw: string) {
  return templateRegex.test(raw);
}
