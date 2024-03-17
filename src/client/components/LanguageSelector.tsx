import React from 'react';
import { setLanguage, useTranslation } from '@i18next-toolkit/react';
import { Button, Dropdown } from 'antd';
import { LuLanguages } from 'react-icons/lu';
import { CountryFlag } from './CountryFlag';

export const LanguageSelector: React.FC = React.memo(() => {
  const { i18n } = useTranslation();

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        selectedKeys: [i18n.language],
        items: [
          {
            label: 'English',
            key: 'en',
            itemIcon: <CountryFlag code="en" />,
          },
          {
            label: 'Deutsch',
            key: 'de',
            itemIcon: <CountryFlag code="de" />,
          },
          {
            label: 'Français',
            key: 'fr',
            itemIcon: <CountryFlag code="fr" />,
          },
          {
            label: '日本語',
            key: 'jp',
            itemIcon: <CountryFlag code="jp" />,
          },
          {
            label: 'Русский',
            key: 'ru',
            itemIcon: <CountryFlag code="ru" />,
          },
          {
            label: '简体中文',
            key: 'zh',
            itemIcon: <CountryFlag code="zh" />,
          },
        ],
        onClick: (info) => {
          setLanguage(info.key);
        },
      }}
    >
      <Button
        icon={<LuLanguages className="anticon" />}
        shape="circle"
        size="large"
      />
    </Dropdown>
  );
});
LanguageSelector.displayName = 'LanguageSelector';
