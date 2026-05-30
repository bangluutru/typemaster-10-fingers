import { useSyncExternalStore } from 'react';

export type ThemeType = 'light' | 'dark' | 'kid';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type PracticeMode = 'accuracy' | 'speed' | 'free';

export interface AppSettings {
  theme: ThemeType;
  soundEnabled: boolean;
  handsEnabled: boolean;
  backspaceEnabled: boolean;
  practiceMode: PracticeMode;
  fontSize: FontSize;
  keyboardLayout: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  soundEnabled: true,
  handsEnabled: true,
  backspaceEnabled: true,
  practiceMode: 'accuracy',
  fontSize: 'lg',
  keyboardLayout: 'qwerty',
};

// Vanilla store implementation optimized specifically for AppSettings
const createSettingsStore = (initialState: AppSettings, localStorageKey: string) => {
  let state = initialState;
  
  try {
    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
      state = { ...initialState, ...JSON.parse(saved) };
      applyThemeClass(state.theme);
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }

  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (updater: Partial<AppSettings> | ((prev: AppSettings) => AppSettings)) => {
      const nextState = typeof updater === 'function' 
        ? (updater as Function)(state) 
        : { ...state, ...updater };
      
      state = nextState;
      
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(state));
      } catch (e) {
        console.error('Failed to save settings', e);
      }

      if (nextState.theme) {
        applyThemeClass(nextState.theme);
      }

      listeners.forEach((l) => l());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
};

function applyThemeClass(theme: ThemeType) {
  if (typeof document !== 'undefined') {
    const body = document.body;
    body.classList.remove('dark', 'kid');
    if (theme === 'dark') body.classList.add('dark');
    if (theme === 'kid') body.classList.add('kid');
  }
}

const settingsStore = createSettingsStore(DEFAULT_SETTINGS, 'typemaster_settings');

export const useSettings = () => {
  const state = useSyncExternalStore(settingsStore.subscribe, settingsStore.getState);
  
  const setSettings = (updater: Partial<AppSettings> | ((prev: AppSettings) => AppSettings)) => {
    settingsStore.setState(updater);
  };

  return [state, setSettings] as const;
};
