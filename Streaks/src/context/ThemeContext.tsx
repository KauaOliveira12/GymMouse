import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkPalette, lightPalette, ThemePalette } from '../theme/palette';
import { createChatStyles, createStyles, AppStyles, ChatStyles } from '../screens/styles';

const TEMA_ESCURO_KEY = '@streaks:tema-escuro';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
  palette: ThemePalette;
  styles: AppStyles;
  chatStyles: ChatStyles;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(TEMA_ESCURO_KEY).then((valor) => {
      if (valor === 'true') setIsDark(true);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((atual) => {
      const proximo = !atual;
      AsyncStorage.setItem(TEMA_ESCURO_KEY, String(proximo));
      return proximo;
    });
  }, []);

  const palette = isDark ? darkPalette : lightPalette;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const chatStyles = useMemo(() => createChatStyles(palette), [palette]);

  const value = useMemo(
    () => ({ isDark, toggleTheme, palette, styles, chatStyles }),
    [isDark, toggleTheme, palette, styles, chatStyles]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return ctx;
}
