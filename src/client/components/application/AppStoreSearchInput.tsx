import React, { useState } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuSearch } from 'react-icons/lu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { trpc } from '@/api/trpc';
import { Avatar } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { useCurrentWorkspaceId } from '@/store/user';
import { useDebounce } from 'ahooks';

interface AppStoreSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  storeType: 'appstore' | 'googleplay';
  placeholder?: string;
}

interface AppInfo {
  id?: string;
  appId: string;
  title: string;
  icon: string;
}

export const AppStoreSearchInput: React.FC<AppStoreSearchInputProps> = ({
  value,
  onChange,
  storeType,
  placeholder,
}) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const workspaceId = useCurrentWorkspaceId();

  const keyword = useDebounce(searchKeyword);

  const { data: searchResults = [], isLoading } =
    trpc.application.storeAppSearch.useQuery(
      {
        workspaceId,
        keyword,
        storeType,
      },
      {
        enabled: keyword.length > 0 && isDialogOpen,
      }
    );

  const handleSearch = () => {
    setIsDialogOpen(true);
    setSearchKeyword('');
  };

  const handleSelectApp = (app: AppInfo) => {
    if (storeType === 'appstore') {
      onChange(`id${app.id}`);
    } else {
      onChange(app.appId);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="flex w-full">
      <Input
        className="rounded-r-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />

      <Popover open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <PopoverTrigger asChild>
          <Button
            className="rounded-l-none border-l-0"
            type="button"
            variant="outline"
            size="icon"
            onClick={handleSearch}
            title={t('Search')}
          >
            <LuSearch className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-4" align="end">
          <div className="mb-2 font-medium">
            {storeType === 'appstore'
              ? t('Search App Store')
              : t('Search Google Play')}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder={t('Enter app name or keywords')}
                className="flex-1"
                autoFocus
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <Spinner />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {searchResults.map((app) => (
                    <div
                      key={app.appId}
                      className="flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      onClick={() => handleSelectApp(app)}
                    >
                      <Avatar className="h-10 w-10 rounded-lg">
                        <img src={app.icon} alt={app.title} />
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="font-medium">{app.title}</div>
                        <div className="text-xs text-zinc-500">{app.appId}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : keyword.length > 0 ? (
                <div className="text-center text-zinc-500">
                  {t('No results found')}
                </div>
              ) : null}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
