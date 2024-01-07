import { useEffect, useState } from 'react';

interface WindowScreenSize {
  width: number;
  height: number;
}

function getWindowSize(): WindowScreenSize {
  return {
    width: window.screen.width,
    height: window.screen.height,
  };
}

export function useWindowSize(): WindowScreenSize {
  const [size, setSize] = useState(getWindowSize());

  useEffect(() => {
    const handleResize = () => {
      setSize(getWindowSize());
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}
