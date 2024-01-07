import { useWindowSize } from './useWindowSize';

export function useIsMobile(): boolean {
  const { width } = useWindowSize();

  return width <= 768;
}
