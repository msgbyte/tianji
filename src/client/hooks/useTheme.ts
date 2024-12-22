import { useColorSchema } from '@/store/settings';
import { theme, ThemeConfig } from 'antd';
import { useEffect, useMemo } from 'react';
import { colord } from 'colord';
import twColors from 'tailwindcss/colors';

const THEME_CONFIG = 'tianji.theme';

const THEME_COLORS = {
  light: {
    primary: '#2680eb',
    gray50: '#ffffff',
    gray75: '#fafafa',
    gray100: '#f5f5f5',
    gray200: '#eaeaea',
    gray300: '#e1e1e1',
    gray400: '#cacaca',
    gray500: '#b3b3b3',
    gray600: '#8e8e8e',
    gray700: '#6e6e6e',
    gray800: '#4b4b4b',
    gray900: '#2c2c2c',
    green400: twColors.green['400'],
    green500: twColors.green['500'],
    green600: twColors.green['600'],
  },
  dark: {
    primary: '#2680eb',
    gray50: '#252525',
    gray75: '#2f2f2f',
    gray100: '#323232',
    gray200: '#3e3e3e',
    gray300: '#4a4a4a',
    gray400: '#5a5a5a',
    gray500: '#6e6e6e',
    gray600: '#909090',
    gray700: '#b9b9b9',
    gray800: '#e3e3e3',
    gray900: '#ffffff',
    green400: twColors.green['600'],
    green500: twColors.green['500'],
    green600: twColors.green['400'],
  },
};

type ValidTheme = keyof typeof THEME_COLORS;

function isValidTheme(theme: string | null): theme is ValidTheme {
  if (!theme) {
    return false;
  }
  return ['light', 'dark'].includes(theme);
}

export function useTheme() {
  const defaultTheme: ValidTheme =
    typeof window !== 'undefined'
      ? window?.matchMedia('(prefers-color-scheme: dark)')?.matches
        ? 'dark'
        : 'light'
      : 'light';
  const customTheme = window.localStorage.getItem(THEME_CONFIG);
  const theme = isValidTheme(customTheme) ? customTheme : defaultTheme;

  const primaryColor = useMemo(
    () => colord(THEME_COLORS[theme].primary),
    [theme]
  );
  const healthColor = useMemo(
    () => colord(THEME_COLORS[theme].green400),
    [theme]
  );

  const colors = useMemo(
    () => ({
      theme: {
        ...THEME_COLORS[theme],
      },
      chart: {
        error: twColors.red[500],
        text: THEME_COLORS[theme].gray700,
        line: THEME_COLORS[theme].gray200,
        pv: primaryColor.alpha(0.4).toRgbString(),
        uv: primaryColor.alpha(0.6).toRgbString(),
        monitor: healthColor.alpha(0.8).toRgbString(),
        default: primaryColor.alpha(0.8).toRgbString(),
      },
      map: {
        baseColor: THEME_COLORS[theme].primary,
        fillColor: THEME_COLORS[theme].gray100,
        strokeColor: THEME_COLORS[theme].primary,
        hoverColor: THEME_COLORS[theme].primary,
      },
    }),
    []
  );

  function saveTheme(value: string) {
    window.localStorage.setItem(THEME_CONFIG, value);
  }

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const url = new URL(window?.location?.href);
    const theme = url.searchParams.get('theme');

    if (theme && ['light', 'dark'].includes(theme)) {
      saveTheme(theme);
    }
  }, []);

  return { theme, saveTheme, colors };
}

export function useAntdTheme(): ThemeConfig {
  const colorScheme = useColorSchema();
  const algorithm =
    colorScheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm;

  return {
    algorithm,
  };
}
