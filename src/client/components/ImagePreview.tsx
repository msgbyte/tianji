import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Image } from 'antd';

interface ImagePreviewProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ImagePreview({
  src,
  alt,
  width,
  height,
  className,
}: ImagePreviewProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="focus-visible:ring-ring inline-flex cursor-zoom-in rounded focus-visible:ring-2"
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
            preview={false}
          />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1000]" />
        <Dialog.Content
          className="fixed inset-0 z-[1000]"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          {/* Keep Ant's viewer inside Radix's focus and dismissal layer. */}
          <Image
            src={src}
            alt={alt}
            wrapperStyle={{ display: 'none' }}
            preview={{
              visible: true,
              getContainer: false,
              keyboard: false,
              focusTriggerAfterClose: false,
              onVisibleChange: setOpen,
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
