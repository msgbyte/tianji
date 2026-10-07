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
