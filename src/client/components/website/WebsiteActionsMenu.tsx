import { useTranslation } from '@i18next-toolkit/react';
import {
  LuChartLine,
  LuEllipsisVertical,
  LuShare2,
} from 'react-icons/lu';
import { TbBuildingLighthouse } from 'react-icons/tb';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WebsiteActionsMenuProps {
  onRetention: () => void;
  onLighthouse: () => void;
  onShare?: () => void;
}

export function WebsiteActionsMenu(props: WebsiteActionsMenuProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          Icon={LuEllipsisVertical}
          aria-label={t('More')}
          title={t('More')}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={props.onRetention}>
          <LuChartLine className="mr-2" />
          {t('Visitor retention')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={props.onLighthouse}>
          <TbBuildingLighthouse className="mr-2" />
          {t('Website Lighthouse Reports')}
        </DropdownMenuItem>
        {props.onShare ? (
          <DropdownMenuItem onSelect={props.onShare}>
            <LuShare2 className="mr-2" />
            {t('Share')}
          </DropdownMenuItem>
        ) : (
          <SimpleTooltip
            content={t('Public share is disabled for this website')}
            tooltipProps={{ delayDuration: 0 }}
          >
            <div>
              <DropdownMenuItem disabled>
                <LuShare2 className="mr-2" />
                {t('Share')}
              </DropdownMenuItem>
            </div>
          </SimpleTooltip>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
