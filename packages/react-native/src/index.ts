import packageJson from '../package.json';
import {
  initApplication as _initApplication,
  ApplicationTrackingOptions,
  identifyApplicationUser,
} from 'tianji-client-sdk';
import { Platform } from 'react-native';
import { getVersion, getSystemVersion } from 'react-native-device-info';

export * from 'tianji-client-sdk';

export function initApplication(_options: ApplicationTrackingOptions) {
  _initApplication(_options);

  identifyApplicationUser({
    os: Platform.OS,
    osVersion: getSystemVersion(),
    version: getVersion(),
    sdkVersion: packageJson.version,
  });
}
