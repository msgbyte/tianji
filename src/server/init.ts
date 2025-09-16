import { version } from '@tianji/shared';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';

axios.defaults.headers.common['User-Agent'] = `tianji/${version}`;

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

(BigInt.prototype as any).toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};

export {};
