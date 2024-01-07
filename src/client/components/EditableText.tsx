import { Input } from 'antd';
import clsx from 'clsx';
import React, { useState } from 'react';
import { useWatch } from '../hooks/useWatch';

interface EditableTextProps {
  className?: string;
  enable?: boolean;
  defaultValue: string;
  onSave: (text: string) => void;
}
export const EditableText: React.FC<EditableTextProps> = React.memo((props) => {
  const [text, setText] = useState(props.defaultValue);
  const enable = props.enable ?? true;

  useWatch([props.defaultValue], () => {
    setText(props.defaultValue);
  });

  return (
    <>
      {enable ? (
        <Input
          className={clsx(
            props.className,
            'border-0 p-0 outline-0 !shadow-none rounded-none'
          )}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => props.onSave(e.target.value)}
        />
      ) : (
        <span className={props.className}>{text}</span>
      )}
    </>
  );
});
EditableText.displayName = 'EditableText';
