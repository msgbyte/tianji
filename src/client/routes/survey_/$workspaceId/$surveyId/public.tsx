import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { useEvent } from '@/hooks/useEvent';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loading } from '@/components/Loading';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { useThemeInit } from '@/store/settings';
import { DotPatternBackground } from '@/components/DotPatternBackground';
import { ColorSchemeSwitcher } from '@/components/ColorSchemeSwitcher';

export const Route = createFileRoute('/survey/$workspaceId/$surveyId/public')({
  component: PageComponent,
  parseParams: (params) => ({
    workspaceId: params.workspaceId,
    surveyId: params.surveyId,
  }),
});

function PageComponent() {
  const { workspaceId, surveyId } = Route.useParams();
  const { t } = useTranslation();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const colorScheme = useThemeInit();
  const isDark = colorScheme === 'dark';

  const { data: surveyInfo, isLoading } = trpc.survey.get.useQuery({
    workspaceId,
    surveyId,
  });

  const submitMutation = trpc.survey.submit.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success(t('Survey submitted successfully!'));
    },
    onError: defaultErrorHandler,
  });

  const formSchema = surveyInfo
    ? z.object(
        surveyInfo.payload.items.reduce(
          (acc, item) => {
            if (item.type === 'email') {
              acc[item.name] = z.string().email(t('Invalid email address'));
            } else if (item.type === 'imageUrl') {
              acc[item.name] = z
                .string()
                .url(t('Invalid URL'))
                .or(z.literal(''));
            } else {
              acc[item.name] = z.string().min(1, t('This field is required'));
            }
            return acc;
          },
          {} as Record<string, z.ZodTypeAny>
        )
      )
    : z.object({});

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      surveyInfo?.payload.items.reduce(
        (acc, item) => {
          acc[item.name] = '';
          return acc;
        },
        {} as Record<string, string>
      ) ?? {},
  });

  // Update form values when surveyInfo changes
  useEffect(() => {
    if (surveyInfo) {
      const defaultValues = surveyInfo.payload.items.reduce(
        (acc, item) => {
          acc[item.name] = '';
          return acc;
        },
        {} as Record<string, string>
      );
      form.reset(defaultValues);
    }
  }, [surveyInfo, form]);

  const handleSubmit = useEvent(async (values: Record<string, any>) => {
    await submitMutation.mutateAsync({
      workspaceId,
      surveyId,
      payload: values,
    });
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!surveyInfo) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>{t('Survey Not Found')}</CardTitle>
            <CardDescription>
              {t('The survey you are looking for does not exist.')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        {isDark && <DotPatternBackground />}

        <ColorSchemeSwitcher className="fixed right-4 top-4 z-50" />

        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="space-y-6 pb-8 pt-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50 dark:bg-green-900/30 dark:ring-green-900/20">
              <svg
                className="h-10 w-10 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="space-y-3">
              <CardTitle className="text-3xl font-bold tracking-tight">
                {t('Thank You!')}
              </CardTitle>
              <CardDescription className="text-base">
                {t('Your response has been successfully submitted.')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-12 text-center">
            <p className="text-muted-foreground text-sm">
              {t('We appreciate you taking the time to complete this survey.')}
            </p>
          </CardContent>
          <CardFooter className="bg-muted/20 border-t py-4">
            <p className="text-muted-foreground w-full text-center text-xs">
              {t('Powered by')} <span className="font-semibold">Tianji</span>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {isDark && <DotPatternBackground />}

      <ColorSchemeSwitcher className="fixed right-4 top-4 z-50" />

      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-3 pb-6">
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">
              {surveyInfo.name}
            </CardTitle>
            <Separator className="my-2" />
            <CardDescription className="text-base">
              {t(
                'Please fill out the form below. All fields marked with * are required.'
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {surveyInfo.payload.items.map((item, index) => (
                <FormField
                  key={item.name}
                  control={form.control}
                  name={item.name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        {index + 1}. {item.label}
                      </FormLabel>
                      <FormControl>
                        {item.type === 'select' && item.options ? (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue
                                placeholder={t('Select an option')}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {item.options.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : item.type === 'email' ? (
                          <>
                            <Input
                              type="email"
                              placeholder={t('your.email@example.com')}
                              className="h-11"
                              {...field}
                            />
                            <FormDescription>
                              {t('Please enter a valid email address')}
                            </FormDescription>
                          </>
                        ) : item.type === 'imageUrl' ? (
                          <>
                            <Input
                              type="url"
                              placeholder={t('https://example.com/image.jpg')}
                              className="h-11"
                              {...field}
                            />
                            <FormDescription>
                              {t('Please enter a valid image URL')}
                            </FormDescription>
                          </>
                        ) : (
                          <Textarea
                            placeholder={t('Enter your answer here...')}
                            className="min-h-[100px] resize-y"
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <div className="pt-4">
                <Button
                  type="submit"
                  className="h-12 w-full text-base font-semibold"
                  loading={submitMutation.isPending}
                >
                  {t('Submit Survey')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="bg-muted/20 border-t py-4">
          <p className="text-muted-foreground w-full text-center text-xs">
            {t('Powered by')} <span className="font-semibold">Tianji</span>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
