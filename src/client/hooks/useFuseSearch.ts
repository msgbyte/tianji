import Fuse, { IFuseOptions } from 'fuse.js';
import { useMemo, useState } from 'react';

export function useFuseSearch<T>(
  source: T[],
  options: IFuseOptions<T>
): {
  searchText: string;
  setSearchText: (text: string) => void;
  searchResult: T[] | undefined;
} {
  const [searchText, setSearchText] = useState('');

  const fuse = useMemo(() => new Fuse(source, options), [source, options]);

  const searchResult = useMemo(
    () =>
      searchText ? fuse.search(searchText).map((item) => item.item) : undefined,
    [fuse, searchText]
  );

  return {
    searchText,
    setSearchText,
    searchResult,
  };
}
