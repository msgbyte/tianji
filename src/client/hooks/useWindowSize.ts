import { useEffect, useState } from 'react';

interface WindowScreenSize {
  width: number;
  height: number;
}

function getWindowSize(): WindowScreenSize {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
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
