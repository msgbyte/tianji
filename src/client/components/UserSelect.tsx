import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/style';

export interface UserSelectOption {
  id: string;
  username: string;
  nickname?: string | null;
  avatar?: string | null;
}

interface UserSelectProps {
  users: UserSelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function UserIdentity({ user }: { user: UserSelectOption }) {
  const name = user.nickname ?? user.username;

  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar className="h-6 w-6">
        {user.avatar && <AvatarImage src={user.avatar} alt={name} />}
        <AvatarFallback delayMs={user.avatar ? undefined : 0}>
          {name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{name}</span>
    </span>
  );
}

export const UserSelect: React.FC<UserSelectProps> = React.memo((props) => {
  const selectedUser = useMemo(
    () => props.users.find((user) => user.id === props.value),
    [props.users, props.value]
  );

  return (
    <Select
      value={props.value}
      onValueChange={props.onValueChange}
      disabled={props.disabled}
    >
      <SelectTrigger className={cn('h-10', props.className)}>
        <SelectValue placeholder={props.placeholder}>
          {selectedUser && <UserIdentity user={selectedUser} />}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {props.users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <UserIdentity user={user} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

UserSelect.displayName = 'UserSelect';
