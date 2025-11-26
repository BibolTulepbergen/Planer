import { StrictMode, useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';
import App from './App.tsx';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/Auth/AuthPage';
import { EmailVerification } from './components/Auth/EmailVerification';
import './index.css';

// Theme storage key
const THEME_STORAGE_KEY = 'app-theme-preference';
const MANUAL_THEME_KEY = 'app-theme-manual';

// Get system theme
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Get initial theme
const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const isManual = localStorage.getItem(MANUAL_THEME_KEY) === 'true';
    if (isManual) {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    }
  }
  return getSystemTheme();
};

// Create theme function
const createAppTheme = (mode: 'light' | 'dark') => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
    typography: {
      fontFamily:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });
};

const AppWrapper = () => {
  const [mode, setMode] = useState<'light' | 'dark'>(getInitialTheme);
  const [isManual, setIsManual] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(MANUAL_THEME_KEY) === 'true';
    }
    return false;
  });
  const { user, loading } = useAuth();

  // Create theme based on current mode
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // Save theme to localStorage
  const handleSetMode = (newMode: 'light' | 'dark', manual: boolean = false) => {
    setMode(newMode);
    setIsManual(manual);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
      localStorage.setItem(MANUAL_THEME_KEY, manual.toString());
    }
  };

  // Reset to system theme
  const handleResetToSystem = () => {
    const systemTheme = getSystemTheme();
    setMode(systemTheme);
    setIsManual(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, systemTheme);
      localStorage.setItem(MANUAL_THEME_KEY, 'false');
    }
  };

  // Listen to system theme changes
  useEffect(() => {
    if (isManual) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (!isManual) {
        const newMode = e.matches ? 'dark' : 'light';
        setMode(newMode);
        if (typeof window !== 'undefined') {
          localStorage.setItem(THEME_STORAGE_KEY, newMode);
        }
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [isManual]);

  // Wrap everything in ThemeProvider with dynamic theme
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {loading ? (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
          }}
        >
          <CircularProgress />
        </Box>
      ) : !user ? (
        <AuthPage />
      ) : !user.emailVerified ? (
        <EmailVerification />
      ) : (
        <App
          mode={mode}
          setMode={(newMode) => handleSetMode(newMode, true)}
          onResetToSystem={handleResetToSystem}
        />
      )}
    </ThemeProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  </StrictMode>
);
