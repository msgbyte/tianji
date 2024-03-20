import { trpc } from '@/api/trpc';
import { CommonList } from '@/components/CommonList';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutV2 } from '@/pages/LayoutV2';
import { useCurrentWorkspaceId } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';
import { LuSearch } from 'react-icons/lu';

export const Route = createFileRoute('/website')({
  beforeLoad: routeAuthBeforeLoad,
  component: WebsiteComponent,
});

function WebsiteComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const { data = [] } = trpc.website.all.useQuery({
    workspaceId,
  });

  const items = data.map((item) => ({
    id: item.id,
    title: item.name,
    content: item.domain,
    tags: [],
    href: `/website/${item.id}`,
  }));

  return (
    <LayoutV2
      list={
        <Tabs defaultValue="all">
          <div className="flex items-center px-4 py-2">
            <h1 className="text-xl font-bold">Website</h1>
            <TabsList className="ml-auto">
              <TabsTrigger
                value="all"
                className="text-zinc-600 dark:text-zinc-200"
              >
                All mail
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="text-zinc-600 dark:text-zinc-200"
              >
                Unread
              </TabsTrigger>
            </TabsList>
          </div>
          <Separator />
          <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <form>
              <div className="relative">
                <LuSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" className="pl-8" />
              </div>
            </form>
          </div>
          <TabsContent value="all" className="m-0">
            <CommonList items={items} />
          </TabsContent>
          <TabsContent value="unread" className="m-0">
            <CommonList items={items} />
          </TabsContent>
        </Tabs>
      }
    />
  );
}
