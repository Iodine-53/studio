
'use client';

// A simple hook to manage various user API keys in localStorage.
import { useCallback } from 'react';

type ApiService = 'gemini';
const API_KEY_PREFIX = 'user_api_key';

const keyMap: Record<ApiService, string> = {
  gemini: `${API_KEY_PREFIX}_gemini`,
};


export function useUserApiKey(service: ApiService) {
  const storageKey = keyMap[service];

  const getApiKey = useCallback((): string | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(storageKey);
  }, [storageKey]);

  const setApiKey = useCallback((key: string): void => {
    if (typeof window !== 'undefined') {
      if (!key) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, key);
      }
    }
  }, [storageKey]);

  const clearApiKey = useCallback((): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return { getApiKey, setApiKey, clearApiKey };
}
