
'use client';

// A simple hook to manage the user's Gemini API key in localStorage.
// This is not a true React "hook" in the sense of managing state,
// but a collection of utility functions that can be used in client components.

import { useCallback } from 'react';

const API_KEY_STORAGE_KEY = 'user_gemini_api_key';

/**
 * Provides functions to get, set, and clear the user's Gemini API key
 * from the browser's localStorage.
 */
export function useUserApiKey() {
  const getApiKey = useCallback((): string | null => {
    // localStorage is only available on the client.
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  }, []);

  const setApiKey = useCallback((key: string): void => {
    if (typeof window !== 'undefined') {
      if (!key) {
        // If the key is empty, remove it instead of storing an empty string.
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      } else {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
      }
    }
  }, []);

  const clearApiKey = useCallback((): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }, []);

  return { getApiKey, setApiKey, clearApiKey };
}
