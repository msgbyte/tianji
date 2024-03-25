import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/style';
import { useUserInfo } from '@/store/user';
import { RiRocket2Fill } from 'react-icons/ri';

interface WorkspaceSwitcherProps {
  isCollapsed: boolean;
}
export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = React.memo(
  (props) => {
    const userInfo = useUserInfo();

    if (!userInfo) {
      return null;
    }

    return (
      <Select value={userInfo.currentWorkspace.id}>
        <SelectTrigger
          className={cn(
            'flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
            props.isCollapsed &&
              'flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden'
          )}
          aria-label="Select workspace"
        >
          <SelectValue placeholder="Select workspace">
            <RiRocket2Fill />

            <span className={cn('ml-2', props.isCollapsed && 'hidden')}>
              {userInfo.currentWorkspace.name}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {userInfo.workspaces.map((w) => (
            <SelectItem key={w.workspace.id} value={w.workspace.id}>
              <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
                <RiRocket2Fill />
                {w.workspace.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);
WorkspaceSwitcher.displayName = 'WorkspaceSwitcher';
