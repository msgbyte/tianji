import { useTranslation } from '@i18next-toolkit/react';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { LuBot } from 'react-icons/lu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { SurveyAISummary } from './SurveyAISummary';

interface SurveyAIBtnProps {
  surveyId: string;
}
export const SurveyAIBtn: React.FC<SurveyAIBtnProps> = React.memo((props) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <Dialog modal={false} open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button Icon={LuBot} size="icon" variant="outline" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList>
            <TabsTrigger value="summary">{t('AI Summary')}</TabsTrigger>
          </TabsList>
          <TabsContent value="summary">
            <DialogHeader>
              <DialogDescription>
                {t('Summary Content with AI')}
              </DialogDescription>
            </DialogHeader>

            <SurveyAISummary surveyId={props.surveyId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});
SurveyAIBtn.displayName = 'SurveyAIBtn';
