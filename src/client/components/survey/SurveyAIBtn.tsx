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
import { DatePicker, DatePickerRange } from '../DatePicker';
import { Select as AntdSelect, Checkbox } from 'antd';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useWatch } from '@/hooks/useWatch';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type RunStrategy = 'skipExist' | 'skipInSuggest' | 'rebuildAll';
type LanguageStrategy = 'default' | 'user';

interface SurveyAIBtnProps {
  surveyId: string;
}
export const SurveyAIBtn: React.FC<SurveyAIBtnProps> = React.memo((props) => {
  const { surveyId } = props;
  const workspaceId = useCurrentWorkspaceId();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<DatePickerRange | undefined>({
    from: dayjs().subtract(1, 'week').toDate(),
    to: dayjs().toDate(),
  });
  const { t } = useTranslation();
  const [category, setCategory] = useState<string[]>([]);
  const [resultText, setResultText] = useState<string[]>([]);
  const [contentField, setContentField] = useState<string>();
  const [runStrategy, setRunStrategy] = useState<RunStrategy>('skipExist');
  const [languageStrategy, setLanguageStrategy] =
    useState<LanguageStrategy>('default');

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

    setResultText([]);

    try {
      await classifySurveyMutation.mutateAsync({
        workspaceId,
        surveyId,
        startAt,
        endAt,
        runStrategy,
        languageStrategy,
        payloadContentField: contentField,
        suggestionCategory: category,
      });

      toast(t('Task has been queued'));
      setOpen(false);
    } catch (err) {
      toast(String(err));
    }
  });

  return (
    <Dialog modal={false} open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button Icon={LuBot} size="icon" variant="outline" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('AI Summary')}</DialogTitle>
          <DialogDescription>{t('Summary Content with AI')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-3">
          <div className="text-xs opacity-50">
            {t('Step 1: Please select content field')}
          </div>

          <Select value={contentField} onValueChange={setContentField}>
            <SelectTrigger>
              <SelectValue placeholder={t('Please Select Content Field')} />
            </SelectTrigger>
            <SelectContent>
              {info?.payload.items.map((item) => (
                <SelectItem key={item.name} value={item.name}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-xs opacity-50">
            {t('Step 2: Please select analysis range')}
          </div>
          <DatePicker className="w-full" value={date} onChange={setDate} />

          <div className="text-xs opacity-50">
            {t('Step 3: Please provide some suggestion category')}
          </div>
          <AntdSelect
            mode="tags"
            className="w-full"
            placeholder={t('Input some category')}
            value={category}
            onChange={setCategory}
            maxTagCount={2}
          />

          <div className="text-xs opacity-50">
            {t('Step 4: Select run strategy')}
          </div>
          <div className="flex flex-col items-start space-x-2">
            <Select
              value={runStrategy}
              onValueChange={(val) => setRunStrategy(val as RunStrategy)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('please select some strategy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skipExist">
                  {t('Skip Exist Record')}
                </SelectItem>
                <SelectItem value="skipInSuggest">
                  {t('Skip Already in Suggestion Record')}
                </SelectItem>
                <SelectItem value="rebuildAll">
                  {t('Recategory All')}
                </SelectItem>
              </SelectContent>
            </Select>

            <div>
              <Checkbox
                checked={languageStrategy === 'user'}
                onChange={(e) =>
                  setLanguageStrategy(e.target.checked ? 'user' : 'default')
                }
              >
                {t('Use User Language')}
              </Checkbox>
            </div>
          </div>

          <div className="text-xs opacity-50">{t('Step 5: Run!')}</div>
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
