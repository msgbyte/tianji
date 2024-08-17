import React, { useState } from 'react';
import { cn } from '@/utils/style';
import { setUserInfo, useUserInfo } from '@/store/user';
import { LuPlusCircle } from 'react-icons/lu';
import { useTranslation } from '@i18next-toolkit/react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useEvent, useEventWithLoading } from '@/hooks/useEvent';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { trpc } from '@/api/trpc';
import { showErrorToast } from '@/utils/error';
import { first, upperCase } from 'lodash-es';

interface WorkspaceSwitcherProps {
  isCollapsed: boolean;
}
export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = React.memo(
  (props) => {
    const userInfo = useUserInfo();
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);
    const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const createWorkspaceMutation = trpc.workspace.create.useMutation({
      onSuccess: (userInfo) => {
        setUserInfo(userInfo);
      },
    });
    const switchWorkspaceMutation = trpc.workspace.switch.useMutation({
      onSuccess: (userInfo) => {
        setUserInfo(userInfo);
      },
    });

    const handleSwitchWorkspace = useEvent(
      async (workspace: { id: string; name: string }) => {
        setOpen(false);

        if (userInfo?.currentWorkspace.id === workspace.id) {
          return;
        }

        try {
          await switchWorkspaceMutation.mutateAsync({
            workspaceId: workspace.id,
          });
        } catch (err) {
          showErrorToast(err);
        }
      }
    );

    const [handleCreateNewWorkspace, isCreateLoading] = useEventWithLoading(
      async () => {
        try {
          await createWorkspaceMutation.mutateAsync({
            name: newWorkspaceName,
          });

          setShowNewWorkspaceDialog(false);
        } catch (err) {
          showErrorToast(err);
        }
      }
    );

    if (!userInfo) {
      return null;
    }

    const currentWorkspace = userInfo.currentWorkspace;

    return (
      <Dialog
        open={showNewWorkspaceDialog}
        onOpenChange={setShowNewWorkspaceDialog}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                'w-full justify-between',
                props.isCollapsed &&
                  'flex h-9 w-9 items-center justify-center p-0'
              )}
            >
              <Avatar
                className={cn('h-5 w-5', props.isCollapsed ? '' : 'mr-2')}
              >
                <AvatarImage
                  src={`https://avatar.vercel.sh/${currentWorkspace.name}.png`}
                  alt={currentWorkspace.name}
                  className="grayscale"
                />
                <AvatarFallback>
                  {upperCase(first(currentWorkspace.name))}
                </AvatarFallback>
              </Avatar>

              <span className={cn(props.isCollapsed && 'hidden')}>
                {currentWorkspace.name}
              </span>

              <CaretSortIcon
                className={cn(
                  'ml-auto h-4 w-4 shrink-0 opacity-50',
                  props.isCollapsed && 'hidden'
                )}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandList>
                <CommandEmpty>{t('No workspace found.')}</CommandEmpty>
                <CommandGroup key="workspace" heading={t('Workspace')}>
                  {userInfo.workspaces.map(({ workspace }) => (
                    <CommandItem
                      key={workspace.id}
                      onSelect={() => {
                        handleSwitchWorkspace(workspace);
                      }}
                      className="text-sm"
                    >
                      <Avatar className="mr-2 h-5 w-5">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${workspace.name}.png`}
                          alt={workspace.name}
                          className="grayscale"
                        />
                        <AvatarFallback>
                          {upperCase(first(workspace.name))}
                        </AvatarFallback>
                      </Avatar>

                      {workspace.name}

                      <CheckIcon
                        className={cn(
                          'ml-auto h-4 w-4',
                          currentWorkspace.id === workspace.id
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>

              <CommandSeparator />

              <CommandList>
                <CommandGroup key="create">
                  <DialogTrigger asChild>
                    <CommandItem
                      aria-selected="false"
                      onSelect={() => {
                        setOpen(false);
                        setShowNewWorkspaceDialog(true);
                      }}
                    >
                      <LuPlusCircle className="mr-2" size={20} />
                      {t('Create Workspace')}
                    </CommandItem>
                  </DialogTrigger>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Create Workspace')}</DialogTitle>
            <DialogDescription>
              {t('Create a new workspace to cooperate with team members.')}
            </DialogDescription>
          </DialogHeader>
          <div>
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <Label>{t('Workspace Name')}</Label>
                <Input
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewWorkspaceDialog(false)}
            >
              {t('Cancel')}
            </Button>
            <Button
              loading={isCreateLoading}
              onClick={handleCreateNewWorkspace}
            >
              {t('Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    // return (
    //   <Select value={userInfo.currentWorkspace.id}>
    //     <SelectTrigger
    //       className={cn(
    //         'flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
    //         props.isCollapsed &&
    //           'flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden'
    //       )}
    //       aria-label="Select workspace"
    //     >
    //       <SelectValue placeholder="Select workspace">
    //         <RiRocket2Fill />

    //         <span className={cn('ml-2', props.isCollapsed && 'hidden')}>
    //           {userInfo.currentWorkspace.name}
    //         </span>
    //       </SelectValue>
    //     </SelectTrigger>
    //     <SelectContent>
    //       {userInfo.workspaces.map((w) => (
    //         <SelectItem key={w.workspace.id} value={w.workspace.id}>
    //           <div className="[&_svg]:text-foreground flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0">
    //             <RiRocket2Fill />
    //             {w.workspace.name}
    //           </div>
    //         </SelectItem>
    //       ))}

    //       <SelectSeparator />

    //       <SelectItem
    //         value="create"
    //         onClick={() => console.log('aa')}
    //         onSelect={() => console.log('bbb')}
    //       >
    //         <div className="[&_svg]:text-foreground flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0">
    //           <LuPlus />
    //           {t('Create Workspace')}
    //         </div>
    //       </SelectItem>
    //     </SelectContent>
    //   </Select>
    // );
  }
);
WorkspaceSwitcher.displayName = 'WorkspaceSwitcher';
