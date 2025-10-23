import { useEffect, useState, RefObject } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

const useResizeObserver = (ref: RefObject<HTMLElement>): Dimensions | null => {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  useEffect(() => {
    const observeTarget = ref.current;
    if (!observeTarget) {
      return;
    }

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(observeTarget);

    return () => {
      resizeObserver.unobserve(observeTarget);
    };
  }, [ref]);

  return dimensions;
};

export default useResizeObserver;
