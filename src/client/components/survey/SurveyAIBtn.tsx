import { DateRange } from 'react-day-picker';
import { useCurrentWorkspaceId } from '@/store/user';
import { useTranslation } from '@i18next-toolkit/react';
import React, { useState } from 'react';
import dayjs from 'dayjs';
import { trpc } from '@/api/trpc';
import { useEventWithLoading } from '@/hooks/useEvent';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { LuBot } from 'react-icons/lu';
import { DatePicker } from '../DatePicker';
import { Select as AntdSelect } from 'antd';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useWatch } from '@/hooks/useWatch';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface SurveyAIBtnProps {
  surveyId: string;
}
export const SurveyAIBtn: React.FC<SurveyAIBtnProps> = React.memo((props) => {
  const { surveyId } = props;
  const workspaceId = useCurrentWorkspaceId();
  const [date, setDate] = useState<DateRange | undefined>({
    from: dayjs().subtract(1, 'week').toDate(),
    to: dayjs().toDate(),
  });
  const { t } = useTranslation();
  const [category, setCategory] = useState<string[]>([]);
  const [resultText, setResultText] = useState<string[]>([]);
  const [contentField, setContentField] = useState<string>();
  const [skipExised, setSkipExised] = useState(true);

  const { data: info } = trpc.survey.get.useQuery({
    workspaceId,
    surveyId,
  });
  const { data: aiCategoryList } = trpc.survey.aiCategoryList.useQuery({
    workspaceId,
    surveyId,
  });

  useWatch([aiCategoryList], () => {
    if (aiCategoryList) {
      setCategory(
        aiCategoryList.filter((item) => item.name !== null).map((c) => c.name!)
      );
    }
  });

  const classifySurveyMutation = trpc.ai.classifySurvey.useMutation();

  const [handleStart, loading] = useEventWithLoading(async () => {
    const startAt = date?.from?.valueOf();
    const endAt = date?.to?.valueOf();

    if (!contentField) {
      toast(t('Content Field required'));
      return;
    }

    if (!startAt || !endAt) {
      toast(t('Date range is required'));
      return;
    }

    try {
      const { analysisCount, processedCount, categorys, effectCount } =
        await classifySurveyMutation.mutateAsync({
          workspaceId,
          surveyId,
          startAt,
          endAt,
          skipExised,
          payloadContentField: contentField,
          suggestionCategory: category,
        });

      setCategory(categorys);

      setResultText([
        t('Analysis Count: {{num}}', { num: analysisCount }),
        t('Processed Count: {{num}}', { num: processedCount }),
        t('Category count: {{num}}', { num: categorys.length }),
        t('Effect Count: {{num}}', { num: effectCount }),
      ]);
    } catch (err) {
      toast(String(err));
    }
  });

  return (
    <Dialog modal={false}>
      <DialogTrigger asChild>
        <Button Icon={LuBot} size="icon" variant="outline" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('AI Summary')}</DialogTitle>
          <DialogDescription>{t('Summary Content with AI')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-3">
          <div className="opacity-50">
            {t('Step 1: Please select content field')}
          </div>

          <Select value={contentField} onValueChange={setContentField}>
            <SelectTrigger>
              <SelectValue placeholder="Please Select Content Field" />
            </SelectTrigger>
            <SelectContent>
              {info?.payload.items.map((item) => (
                <SelectItem key={item.name} value={item.name}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="opacity-50">
            {t('Step 2: Please select analysis range')}
          </div>
          <DatePicker value={date} onChange={setDate} />

          <div className="opacity-50">
            {t('Step 3: Please provide some suggestion category')}
          </div>
          <AntdSelect
            mode="tags"
            className="w-full"
            placeholder="Input some category"
            value={category}
            onChange={setCategory}
            maxTagCount={2}
          />

          <div className="opacity-50">{t('Step 4: Run!')}</div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={skipExised}
              onCheckedChange={(checked) => setSkipExised(Boolean(checked))}
            />
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {t('Skip already parse record.')}
            </label>
          </div>

          <Button loading={loading} onClick={handleStart}>
            {t('Run')}
          </Button>

          {resultText.length > 0 && (
            <Alert>
              <LuBot className="h-4 w-4" />
              <AlertTitle>{t('AI Classify completed!')}</AlertTitle>
              <AlertDescription className="text-xs">
                {resultText.map((t, i) => (
                  <div key={i}>{t}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
SurveyAIBtn.displayName = 'SurveyAIBtn';
