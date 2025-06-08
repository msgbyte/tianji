import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import { useEventWithLoading } from '@/hooks/useEvent';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { LuCode } from 'react-icons/lu';

const addFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }).max(100),
  modelApiKey: z.string().nullish(),
  customModelBaseUrl: z.string().url().or(z.literal('')).nullish(),
  customModelName: z.string().nullish(),
  customModelInputPrice: z.number().nullish(),
  customModelOutputPrice: z.number().nullish(),
});

export type AIGatewayEditFormValues = z.infer<typeof addFormSchema>;

interface AIGatewayEditFormProps {
  defaultValues?: AIGatewayEditFormValues;
  onSubmit: (values: AIGatewayEditFormValues) => Promise<void>;
}
export const AIGatewayEditForm: React.FC<AIGatewayEditFormProps> = React.memo(
  (props) => {
    const { t } = useTranslation();

    const form = useForm<AIGatewayEditFormValues>({
      resolver: zodResolver(addFormSchema),
      defaultValues: props.defaultValues ?? {
        name: 'New Gateway',
        modelApiKey: '',
        customModelBaseUrl: '',
        customModelName: '',
        customModelInputPrice: 0,
        customModelOutputPrice: 0,
      },
    });

    const [handleSubmit, isLoading] = useEventWithLoading(
      async (values: AIGatewayEditFormValues) => {
        await props.onSubmit({ ...values });
        form.reset();
      }
    );

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card>
            <CardContent className="space-y-2 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Application Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('Application Name to Display')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="modelApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Model API Key')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        'Optional, Model API Key which user can use to request model with their own api key in tianji, if not set, use the api key in the header'
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Model Settings - Collapsible Section */}
              <Collapsible className="w-full">
                <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border p-3 text-left">
                  {t('Custom Model Settings')}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 p-3">
                  <Alert>
                    <LuCode />
                    <AlertTitle>
                      {t('Custom Model Settings only work in custom route.')}
                    </AlertTitle>
                    <AlertDescription>
                      {t('Check usage tab for detail about how to use it.')}
                    </AlertDescription>
                  </Alert>
                  <FormField
                    control={form.control}
                    name="customModelBaseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Custom Model Base URL')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://api.example.com/v1"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription>
                          {t(
                            'Optional, Custom base URL for the AI model API. If set, requests will be made to this URL instead of the default provider URL.'
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customModelName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Custom Model Name')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="gpt-4o-mini"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription>
                          {t(
                            'Optional, Custom model name to use when making API requests. If set, this name will be used instead of the default model name.'
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customModelInputPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('Custom Model Input Price (USD per 1M tokens)')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.01"
                            {...field}
                            value={field.value ?? 0}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(Number(value));
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          {t(
                            'Optional, Custom pricing for input tokens cost calculation. Price per 1 million input tokens in USD.'
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customModelOutputPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('Custom Model Output Price (USD per 1M tokens)')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.03"
                            {...field}
                            value={field.value ?? 0}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(Number(value));
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          {t(
                            'Optional, Custom pricing for output tokens cost calculation. Price per 1 million output tokens in USD.'
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>
            </CardContent>

            <CardFooter>
              <Button type="submit" loading={isLoading}>
                {props.defaultValues ? t('Update') : t('Create')}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    );
  }
);
AIGatewayEditForm.displayName = 'AIGatewayEditForm';
