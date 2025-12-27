import { trpc } from '@/api/trpc';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/p/$slug')({
  component: PageComponent,
});

function PageComponent() {
  const { slug } = Route.useParams<{ slug: string }>();

  const { data: pageInfo, isLoading } = trpc.page.getPageInfo.useQuery({
    slug,
  });

  if (!slug) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!pageInfo) {
    return <NotFoundTip />;
  }

  if (pageInfo.type !== 'static') {
    return <NotFoundTip />;
  }

  const htmlContent = (pageInfo.payload as { html?: string })?.html ?? '';

  return (
    <iframe
      srcDoc={htmlContent}
      className="h-screen w-screen border-0 bg-white"
      title={pageInfo.title}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
    />
  );
}
