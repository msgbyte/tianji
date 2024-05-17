import React from 'react';

export const HomepageFlags: React.FC = React.memo(() => {
  return (
    <div className="flex flex-wrap gap-2">
      <img src="/img/flags/en.png" className="w-8" title="en" />
      <img src="/img/flags/de.png" className="w-8" title="de" />
      <img src="/img/flags/fr.png" className="w-8" title="fr" />
      <img src="/img/flags/jp.png" className="w-8" title="jp" />
      <img src="/img/flags/pl.png" className="w-8" title="pl" />
      <img src="/img/flags/pt.png" className="w-8" title="pt" />
      <img src="/img/flags/ru.png" className="w-8" title="ru" />
      <img src="/img/flags/zh.png" className="w-8" title="zh" />
    </div>
  );
});
HomepageFlags.displayName = 'HomepageFlags';
