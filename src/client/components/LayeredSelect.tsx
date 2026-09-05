import React from 'react';
import { DismissableLayer } from '@radix-ui/react-dismissable-layer';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { Select, type SelectProps } from 'antd';

export const LayeredSelect = Object.assign(
  function LayeredSelect<ValueType = unknown>({
    open: openProp,
    defaultOpen = false,
    onDropdownVisibleChange,
    ...props
  }: SelectProps<ValueType>) {
    const [open, setOpen] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen,
      onChange: onDropdownVisibleChange,
    });

    return (
      <>
        <Select
          getPopupContainer={(trigger) => trigger.parentElement!}
          {...props}
          open={open}
          onDropdownVisibleChange={setOpen}
        />
        {/* Ant freezes hidden popup content, so keep the Escape layer outside it. */}
        {open && (
          <DismissableLayer
            hidden
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              setOpen(false);
            }}
          />
        )}
      </>
    );
  },
  { Option: Select.Option, OptGroup: Select.OptGroup }
);
