import gfm from '@bytemd/plugin-gfm';
import { BytemdPlugin } from 'bytemd';
import externalLinks from 'rehype-external-links';

export const plugins: BytemdPlugin[] = [
  gfm(),
  {
    rehype: (p) =>
      p.use(externalLinks, {
        target: '_blank',
      }),
  },
];
