import React, { useState } from 'react';
import { useWatch } from '../hooks/useWatch';
import { Input } from './ui/input';
import { useEvent } from '@/hooks/useEvent';
import { cn } from '@/utils/style';

interface EditableTextProps {
  className?: string;
  defaultValue: string;
  onSave: (text: string) => void;
}
export const EditableText: React.FC<EditableTextProps> = React.memo((props) => {
  const [text, setText] = useState(props.defaultValue);
  const [editing, setEditing] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useWatch([props.defaultValue], () => {
    setText(props.defaultValue);
  });

  const handleClick = useEvent(() => {
    setEditing(true);
  });

  return (
    <div className={cn('cursor-text', props.className)}>
      {editing ? (
        <Input
          ref={inputRef}
          autoFocus={true}
          type="text"
          className="h-[1.5em] border-none p-0 text-base shadow-none focus-visible:ring-0"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            setEditing(false);
            props.onSave(text);
          }}
        />
      ) : (
        <span onClick={handleClick}>{text}</span>
      )}
    </div>
  );
});
EditableText.displayName = 'EditableText';
