import { version } from '@tianji/shared';

export const isDev = import.meta.env.MODE === 'development';

export const anonymousTelemetryUrl = `https://tianji.moonrailgun.com/telemetry/clnzoxcy10001vy2ohi4obbi0/cltg3op5n007lrw4gvr3p8syj.gif?name=tianji-oss&url=${window.location.origin}&v=${version}`;
