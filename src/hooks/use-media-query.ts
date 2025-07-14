"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook for tracking the state of a media query.
 * @param query The media query string to watch.
 * @returns `true` if the media query matches, otherwise `false`.
 */
export const useMediaQuery = (query: string): boolean => {
  // Initialize state to `false` to ensure server and client initial render match.
  // This prevents hydration errors.
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    const media = window.matchMedia(query);
    
    // Update state with the initial match.
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => {
      setMatches(media.matches);
    };

    // Use the modern addEventListener method
    media.addEventListener('change', listener);
    
    // Cleanup function to remove the listener
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};
