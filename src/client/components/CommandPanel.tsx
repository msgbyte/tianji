import React, { useEffect, useState } from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LuActivitySquare,
  LuAreaChart,
  LuBellDot,
  LuFilePieChart,
  LuKanbanSquare,
  LuKeyRound,
  LuMonitorDot,
  LuSearch,
  LuServer,
  LuUserCircle2,
  LuWifi,
} from 'react-icons/lu';
import { RiSurveyLine } from 'react-icons/ri';

import { NavigateOptions, useNavigate } from '@tanstack/react-router';
import { useEvent } from '@/hooks/useEvent';
import { useCommandState } from 'cmdk';
import { useTranslation } from '@i18next-toolkit/react';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface CommandPanelProps {
  isCollapsed: boolean;
}
export const CommandPanel: React.FC<CommandPanelProps> = React.memo((props) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleJump = useEvent((options: NavigateOptions) => {
    return () => {
      setOpen(false);
      navigate(options);
    };
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      {props.isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              Icon={LuSearch}
              onClick={() => setOpen(true)}
            />
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-4">
            {t('Search and quick jump')}
            <span className="ml-1 rounded bg-black/10 px-1 py-0.5">
              ctrl + k
            </span>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          className="w-full !justify-between"
          variant="secondary"
          size="sm"
          Icon={LuSearch}
          onClick={() => setOpen(true)}
        >
          <span className="rounded bg-black/10 px-1 py-0.5">ctrl + k</span>
        </Button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command loop={true}>
          <CommandInput placeholder={t('Type a command or search...')} />
          <CommandList>
            <CommandEmpty>{t('No results found.')}</CommandEmpty>
            <CommandPanelSearchGroup handleJump={handleJump} />
            <CommandGroup heading={t('Suggestions')}>
              <CommandItem
                onSelect={handleJump({
                  to: '/website',
                })}
              >
                <LuAreaChart className="mr-2 h-4 w-4" />
                {t('Website')}
              </CommandItem>
              <CommandItem
                onSelect={handleJump({
                  to: '/monitor',
                })}
              >
                <LuMonitorDot className="mr-2 h-4 w-4" />
                {t('Monitor')}
              </CommandItem>
              <CommandItem
                onSelect={handleJump({
                  to: '/server',
                })}
              >
                <LuServer className="mr-2 h-4 w-4" />
                {t('Servers')}
              </CommandItem>
              <CommandItem
                onSelect={handleJump({
                  to: '/telemetry',
                })}
              >
                <LuWifi className="mr-2 h-4 w-4" />
                {t('Telemetry')}
              </CommandItem>
              <CommandItem
                onSelect={handleJump({
                  to: '/page',
                })}
              >
                <LuFilePieChart className="mr-2 h-4 w-4" />
                {t('Pages')}
              </CommandItem>
              <CommandItem
                onSelect={handleJump({
                  to: '/survey',
                })}
              >
                <RiSurveyLine className="mr-2 h-4 w-4" />
                {t('Survey')}
              </CommandItem>
              <CommandItem
                onSelect={handleJump({
                  to: '/feed',
                })}
              >
                <LuActivitySquare className="mr-2 h-4 w-4" />
                {t('Feed')}
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t('Settings')}>
              <CommandItem
                onSelect={handleJump({
                  to: '/settings/profile',
                })}
              >
                <LuUserCircle2 className="mr-2 h-4 w-4" />
                <span>{t('Profile')}</span>
              </CommandItem>
              <CommandItem
                onSelect={handleJump({
                  to: '/settings/notifications',
                })}
              >
                <LuBellDot className="mr-2 h-4 w-4" />
                <span>{t('Notifications')}</span>
              </CommandItem>
              <CommandItem
                onSelect={handleJump({
                  to: '/settings/apiKey',
                })}
              >
                <LuKeyRound className="mr-2 h-4 w-4" />
                <span>{t('Api Key')}</span>
              </CommandItem>
              <CommandItem
                onSelect={handleJump({
                  to: '/settings/usage',
                })}
              >
                <LuKanbanSquare className="mr-2 h-4 w-4" />
                <span>{t('Usage')}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
});
CommandPanel.displayName = 'CommandPanel';

interface CommandPanelSearchGroupProps {
  handleJump: (options: NavigateOptions) => () => void;
}
export const CommandPanelSearchGroup: React.FC<CommandPanelSearchGroupProps> =
  React.memo((props) => {
    const handleJump = props.handleJump;
    const search = useCommandState((state) => state.search);
    const workspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation();
    const { data: websites = [] } = trpc.website.all.useQuery({
      workspaceId,
    });
    const { data: monitors = [] } = trpc.monitor.all.useQuery({
      workspaceId,
    });
    const { data: telemetryList = [] } = trpc.telemetry.all.useQuery({
      workspaceId,
    });
    const { data: pages = [] } = trpc.monitor.getAllPages.useQuery({
      workspaceId,
    });
    const { data: surveys = [] } = trpc.survey.all.useQuery({
      workspaceId,
    });
    const { data: feedChannels = [] } = trpc.feed.channels.useQuery({
      workspaceId,
    });

    if (!search) {
      return null;
    }

    return (
      <CommandGroup heading={t('Search')}>
        {websites.map((w) => (
          <CommandItem
            key={w.id}
            value={w.id}
            keywords={[w.name, w.id]}
            onSelect={handleJump({
              to: '/website/$websiteId',
              params: {
                websiteId: w.id,
              },
            })}
          >
            <LuFilePieChart className="mr-2 h-4 w-4" />
            {w.name}
          </CommandItem>
        ))}
        {monitors.map((m) => (
          <CommandItem
            key={m.id}
            value={m.id}
            keywords={[m.name, m.id]}
            onSelect={handleJump({
              to: '/monitor/$monitorId',
              params: {
                monitorId: m.id,
              },
            })}
          >
            <LuMonitorDot className="mr-2 h-4 w-4" />
            {m.name}
          </CommandItem>
        ))}
        {telemetryList.map((t) => (
          <CommandItem
            key={t.id}
            value={t.id}
            keywords={[t.name, t.id]}
            onSelect={handleJump({
              to: '/telemetry/$telemetryId',
              params: {
                telemetryId: t.id,
              },
            })}
          >
            <LuWifi className="mr-2 h-4 w-4" />
            {t.name}
          </CommandItem>
        ))}
        {pages.map((p) => (
          <CommandItem
            key={p.id}
            value={p.id}
            keywords={[p.title, p.id]}
            onSelect={handleJump({
              to: '/page/$slug',
              params: {
                slug: p.slug,
              },
            })}
          >
            <LuFilePieChart className="mr-2 h-4 w-4" />
            {p.title}
          </CommandItem>
        ))}
        {surveys.map((s) => (
          <CommandItem
            key={s.id}
            value={s.id}
            keywords={[s.name, s.id]}
            onSelect={handleJump({
              to: '/survey/$surveyId',
              params: {
                surveyId: s.id,
              },
            })}
          >
            <RiSurveyLine className="mr-2 h-4 w-4" />
            {s.name}
          </CommandItem>
        ))}
        {feedChannels.map((channel) => (
          <CommandItem
            key={channel.id}
            value={channel.id}
            keywords={[channel.name, channel.id]}
            onSelect={handleJump({
              to: '/feed/$channelId',
              params: {
                channelId: channel.id,
              },
            })}
          >
            <LuActivitySquare className="mr-2 h-4 w-4" />
            {channel.name}
          </CommandItem>
        ))}
      </CommandGroup>
    );
  });
CommandPanelSearchGroup.displayName = 'CommandPanelSearchGroup';
