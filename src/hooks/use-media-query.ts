"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook for tracking the state of a media query.
 * @param query The media query string to watch.
 * @returns `true` if the media query matches, otherwise `false`.
 */
export const useMediaQuery = (query: string): boolean => {
  // Get the initial value on the client-side
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Safari < 14 does not support addEventListener, so we use the deprecated addListener as a fallback.
    if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', listener);
    } else {
        mediaQueryList.addListener(listener);
    }

    // Initial check in case the value changed between render and effect
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener('change', listener);
      } else {
          mediaQueryList.removeListener(listener);
      }
    };
  }, [query, matches]);

  return matches;
};
