import { StrictMode, useState, useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import './index.css'
import App from './App.tsx'

// Ключ для localStorage
const THEME_STORAGE_KEY = 'app-theme-preference'
const MANUAL_THEME_KEY = 'app-theme-manual'

// Определение системной темы
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// Получение начальной темы (приоритет: localStorage > системная тема)
const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }
  }
  return getSystemTheme()
}

// Функция создания темы
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
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h4: {
        fontSize: '1.75rem',
        '@media (min-width: 600px)': {
          fontSize: '2.125rem',
        },
      },
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
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
  })
}

// Компонент-обертка для управления темой
function AppWithTheme() {
  const [mode, setMode] = useState<'light' | 'dark'>(getInitialTheme)
  const [isManual, setIsManual] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(MANUAL_THEME_KEY) === 'true'
    }
    return false
  })

  // Сохранение темы в localStorage
  const handleSetMode = (newMode: 'light' | 'dark', manual: boolean = false) => {
    setMode(newMode)
    setIsManual(manual)
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newMode)
      localStorage.setItem(MANUAL_THEME_KEY, manual.toString())
    }
  }

  // Сброс к системной теме
  const handleResetToSystem = () => {
    const systemTheme = getSystemTheme()
    setMode(systemTheme)
    setIsManual(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, systemTheme)
      localStorage.setItem(MANUAL_THEME_KEY, 'false')
    }
  }

  useEffect(() => {
    // Слушаем изменения системной темы только если тема не была установлена вручную
    if (isManual) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (!isManual) {
        const newMode = e.matches ? 'dark' : 'light'
        setMode(newMode)
        if (typeof window !== 'undefined') {
          localStorage.setItem(THEME_STORAGE_KEY, newMode)
        }
      }
    }

    // Современный способ
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      // Fallback для старых браузеров
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [isManual])

  const theme = useMemo(() => createAppTheme(mode), [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App 
        mode={mode} 
        setMode={(newMode) => handleSetMode(newMode, true)} 
        onResetToSystem={handleResetToSystem}
      />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithTheme />
  </StrictMode>,
)
