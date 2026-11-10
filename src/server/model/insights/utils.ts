import { processGroupedTimeSeriesData } from '@tianji/shared';
import {
  EVENT_COLUMNS,
  FILTER_COLUMNS,
  SESSION_COLUMNS,
} from '../../utils/const.js';

// Builtin properties use the metric prefix and an explicit source in queries.
export const insightsWebsiteBuiltinFields = [
  ...SESSION_COLUMNS,
  ...EVENT_COLUMNS,
].map((name) => ({
  name: `$${name}`,
  column: FILTER_COLUMNS[name as keyof typeof FILTER_COLUMNS] ?? name,
  table: SESSION_COLUMNS.includes(name) ? 'WebsiteSession' : 'WebsiteEvent',
}));

export const insightsApplicationBuiltinFields = [
  ...[
    'os',
    'language',
    'version',
    'sdkVersion',
    'country',
    'region',
    'city',
  ].map((name) => ({
    name: `$${name}`,
    column: name === 'region' ? 'subdivision1' : name,
    table: 'ApplicationSession',
  })),
  { name: '$screenName', column: 'screenName', table: 'ApplicationEvent' },
  { name: '$event', column: 'eventName', table: 'ApplicationEvent' },
];

export const insightsSurveyBuiltinFields = [
  'aiCategory',
  'aiTranslation',
  'browser',
  'os',
  'language',
];

export {
  /**
   * @deprecated please direct import from `@tianji/shared`
   */
  processGroupedTimeSeriesData,
};
