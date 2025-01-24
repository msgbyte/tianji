export type StoreType = 'app-store' | 'google-play';

interface TianjiConfig {
  baseUrl: string;
  workspaceId: string;
  surveyId: string;
}

export interface Config {
  tianji: TianjiConfig;
  apps: (
    | {
        appId: string;
        publisherKey: string;
        store: 'google-play';
      }
    | {
        appId: string;
        regions: string[] | false;
        store: 'app-store';
      }
  )[];
  verbose?: boolean;
  dryRun?: boolean;
  interval?: number;
}

export interface AppstoreConfig {
  tianji: TianjiConfig;
  appId: string;
  regions: string[] | true;
  store: 'app-store';
  verbose?: boolean;
  dryRun?: boolean;
  interval?: number;
}

export interface GooglePlayConfig {
  tianji: TianjiConfig;
  appId: string;
  publisherKey: string | object;
  store: 'google-play';
  verbose?: boolean;
  dryRun?: boolean;
  interval?: number;
}

export interface AppInformation {
  appName: string;
  appIcon: string;
  appLink?: string;
  region?: string;
}

export interface Review {
  id: string;
  author: string;
  version: string;
  versionCode?: number;
  osVersion?: number;
  device?: string;
  title?: string;
  text: string;
  rating: number;
  link: string;
  storeName: 'Google Play' | 'App Store';
}
