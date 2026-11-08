import { version as packageJsonVersion } from '@tianji/shared';

export const isDev = import.meta.env.MODE === 'development';
export const version = import.meta.env.VITE_VERSION || packageJsonVersion;

export const anonymousTelemetryUrl = `https://app.tianji.dev/telemetry/cm3pzndpk0001thybosby3rhz/cmw7pq488f1cetzsvk0wb5mey.gif?name=tianji-oss&url=${window.location.origin}&v=${version}`;
