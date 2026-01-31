import { trpc } from '@/api/trpc';
import { ErrorTip } from '@/components/ErrorTip';
import { HTMLRender } from '@/components/HTMLRender';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { createFileRoute } from '@tanstack/react-router';
import { Helmet } from 'react-helmet';
import { useTranslation } from '@i18next-toolkit/react';

export const Route = createFileRoute('/p/$slug')({
  component: PageComponent,
});

function PageComponent() {
  const { slug } = Route.useParams<{ slug: string }>();
  const { t } = useTranslation();

  const { data: pageInfo, isLoading } = trpc.page.getPageInfo.useQuery({
    slug,
  });

  if (!slug) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>{t('Loading...')}</title>
        </Helmet>
        <Loading />
      </>
    );
  }

  if (!pageInfo) {
    return <NotFoundTip />;
  }

  if (pageInfo.type !== 'static') {
    return <NotFoundTip />;
  }

  const htmlContent = (pageInfo.payload as { html?: string })?.html ?? '';

  return (
    <>
      <Helmet>
        <title>{pageInfo.title}</title>
      </Helmet>
      <HTMLRender
        html={htmlContent}
        className="h-screen w-screen"
        title={pageInfo.title}
        useTianjiTheme={false}
      />
    </>
  );
}
