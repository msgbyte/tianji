import { useTranslation } from '@i18next-toolkit/react';
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { WebsiteVisitorMap } from './WebsiteVisitorMap';
import { LuMap } from 'react-icons/lu';

interface WebsiteVisitorMapBtnProps {
  websiteId: string;
}
export const WebsiteVisitorMapBtn: React.FC<WebsiteVisitorMapBtnProps> =
  React.memo((props) => {
    const { t } = useTranslation();

    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" Icon={LuMap}>
            {t('Vistor Map')}
          </Button>
        </SheetTrigger>

        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>{t('Vistor Map')}</SheetTitle>
          </SheetHeader>

          <WebsiteVisitorMap websiteId={props.websiteId} />
        </SheetContent>
      </Sheet>
    );
  });
WebsiteVisitorMapBtn.displayName = 'WebsiteVisitorMapBtn';
