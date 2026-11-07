import React, { useMemo } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { CodeBlock } from '@/components/CodeBlock';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createArtifactPreview } from './preview';

export function ArtifactViewer({
  source,
  title,
}: {
  source: string;
  title: string;
}) {
  const { t } = useTranslation();
  const srcDoc = useMemo(() => createArtifactPreview(source), [source]);
  return (
    <Tabs defaultValue="preview" className="flex min-h-0 flex-1 flex-col">
      <TabsList className="mx-4 w-fit">
        <TabsTrigger value="preview">{t('Preview')}</TabsTrigger>
        <TabsTrigger value="source">{t('Source')}</TabsTrigger>
      </TabsList>
      <TabsContent value="preview" className="min-h-0 flex-1 overflow-hidden">
        <iframe
          title={title}
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          className="h-full w-full border-0 bg-white"
        />
      </TabsContent>
      <TabsContent
        value="source"
        className="min-h-0 flex-1 overflow-auto px-4 pb-4"
      >
        <CodeBlock code={source} />
      </TabsContent>
    </Tabs>
  );
}
