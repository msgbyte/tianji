import { setupI18nInstance } from '@i18next-toolkit/react';

export const languages = [
  {
    label: 'English',
    key: 'en',
  },
  {
    label: 'Deutsch',
    key: 'de-DE',
  },
  {
    label: 'Français',
    key: 'fr-FR',
  },
  {
    label: '日本語',
    key: 'ja-JP',
  },
  {
    label: 'Polski',
    key: 'pl-PL',
  },
  {
    label: 'Português',
    key: 'pt-PT',
  },
  {
    label: 'Русский',
    key: 'ru-RU',
  },
  {
    label: '简体中文',
    key: 'zh-CN',
  },
];

export function initI18N() {
  setupI18nInstance({
    supportedLngs: languages.map((l) => l.key),
  });
}
