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
    label: 'Español',
    key: 'es-ES',
  },
  {
    label: 'Français',
    key: 'fr-FR',
  },
  {
    label: 'Indonesia',
    key: 'id-ID',
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
    label: 'Türkçe',
    key: 'tr-TR',
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
