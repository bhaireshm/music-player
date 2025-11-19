'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Box, Center, Loader, Text } from '@mantine/core';

interface InfiniteScrollProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  children: React.ReactNode;
  threshold?: number; // Distance from bottom to trigger load (in pixels)
}

export default function InfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  children,
  threshold = 300,
}: InfiniteScrollProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver, threshold]);

  return (
    <>
      {children}
      
      <Box ref={observerTarget} py="md">
        {loading && (
          <Center>
            <Loader size="sm" type="dots" />
          </Center>
        )}
        {!hasMore && !loading && (
          <Center>
            <Text size="sm" c="dimmed">
              No more items to load
            </Text>
          </Center>
        )}
      </Box>
    </>
  );
}
