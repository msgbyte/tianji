import { version } from '@tianji/shared';
import axios from 'axios';

axios.defaults.headers.common['User-Agent'] = `tianji/${version}`;

(BigInt.prototype as any).toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};

export {};
