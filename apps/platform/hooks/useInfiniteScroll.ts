import { useCallback, useEffect, useRef, useState } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  rootMargin?: string; // Intersection Observer root margin
  enabled?: boolean; // Whether infinite scroll is enabled
}

interface UseInfiniteScrollReturn {
  loadMoreRef: (node: HTMLElement | null) => void;
  isNearEnd: boolean;
}

/**
 * Custom hook for implementing infinite scroll functionality
 * Uses Intersection Observer API for efficient scroll detection
 * 
 * @param hasNextPage - Whether there are more items to load
 * @param isFetchingNextPage - Whether currently fetching next page
 * @param fetchNextPage - Function to fetch next page
 * @param options - Configuration options
 * @returns Object with loadMoreRef and isNearEnd flag
 */
export function useInfiniteScroll(
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
  fetchNextPage: () => void,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const {
    threshold = 100,
    rootMargin = '100px',
    enabled = true
  } = options;

  const [isNearEnd, setIsNearEnd] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLElement | null) => {
      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Don't observe if conditions aren't met
      if (!enabled || isFetchingNextPage || !hasNextPage || !node) {
        return;
      }

      // Create new observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting) {
            setIsNearEnd(true);
            fetchNextPage();
          } else {
            setIsNearEnd(false);
          }
        },
        {
          threshold: 0.1,
          rootMargin,
        }
      );

      // Start observing
      observerRef.current.observe(node);
    },
    [enabled, isFetchingNextPage, hasNextPage, fetchNextPage, rootMargin]
  );

  // Fallback scroll listener for browsers without Intersection Observer
  useEffect(() => {
    if (!enabled || hasNextPage === false || isFetchingNextPage) {
      return;
    }

    // Fallback for older browsers
    if (!window.IntersectionObserver) {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;
        
        if (isNearBottom) {
          setIsNearEnd(true);
          fetchNextPage();
        } else {
          setIsNearEnd(false);
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [enabled, hasNextPage, isFetchingNextPage, fetchNextPage, threshold]);

  // Cleanup observer on unmount
  useEffect(() => {
    const observer = observerRef.current;
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  return {
    loadMoreRef,
    isNearEnd,
  };
}