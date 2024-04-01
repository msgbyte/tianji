import { ColorSchemeSwitcher } from '@/components/ColorSchemeSwitcher';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { useEvent } from '@/hooks/useEvent';
import { useSettingsStore } from '@/store/settings';
import { useUserInfo } from '@/store/user';
import { languages } from '@/utils/constants';
import { useTranslation, setLanguage } from '@i18next-toolkit/react';
import { useNavigate } from '@tanstack/react-router';
import React from 'react';
import { LuMoreVertical } from 'react-icons/lu';

interface UserConfigProps {
  isCollapsed: boolean;
}
export const UserConfig: React.FC<UserConfigProps> = React.memo((props) => {
  const userInfo = useUserInfo();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const colorScheme = useSettingsStore((state) => state.colorScheme);

  const handleChangeColorSchema = useEvent((colorScheme) => {
    useSettingsStore.setState({
      colorScheme,
    });
  });

  const avatar = (
    <Avatar>
      <AvatarFallback>
        {(userInfo?.username ?? '').substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );

  const name = <div className="flex-1">{userInfo?.username ?? ''}</div>;

  const more = (
    <Button variant="outline" size="icon">
      <LuMoreVertical />
    </Button>
  );

  return (
    <div className="flex items-center gap-2 p-2">
      <DropdownMenu>
        {props.isCollapsed ? (
          <>
            <DropdownMenuTrigger asChild={true} className="cursor-pointer">
              {avatar}
            </DropdownMenuTrigger>
          </>
        ) : (
          <>
            {avatar}

            {name}

            <DropdownMenuTrigger asChild={true} className="cursor-pointer">
              {more}
            </DropdownMenuTrigger>
          </>
        )}

        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() =>
              navigate({
                to: '/settings/profile',
              })
            }
          >
            {t('Profile')}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() =>
              navigate({
                to: '/settings/notifications',
              })
            }
          >
            {t('Notifications')}
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t('Language')}</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={i18n.language}
                  onValueChange={setLanguage}
                >
                  {languages.map((language) => (
                    <DropdownMenuRadioItem
                      key={language.key}
                      value={language.key}
                    >
                      {language.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t('Theme')}</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={colorScheme}
                  onValueChange={handleChangeColorSchema}
                >
                  <DropdownMenuRadioItem value={'dark'}>
                    {t('Dark')}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={'light'}>
                    {t('Light')}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
UserConfig.displayName = 'UserConfig';
