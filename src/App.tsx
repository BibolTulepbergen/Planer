import { useState } from 'react'
import {
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material'
import './App.css'
interface AppProps {
  mode: 'light' | 'dark'
  setMode: (mode: 'light' | 'dark') => void
  onResetToSystem?: () => void
}

function App({ mode, setMode, onResetToSystem }: AppProps) {
  const theme = useTheme()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const toggleTheme = () => {
    setMode(mode === 'light' ? 'dark' : 'light')
  }

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open)
  }

  const menuItems = [
    { text: 'Главная', icon: <HomeIcon /> },
    { text: 'Профиль', icon: <PersonIcon /> },
    { text: 'Настройки', icon: <SettingsIcon /> },
  ]

  const handleResetToSystem = () => {
    if (onResetToSystem) {
      onResetToSystem()
    }
    setDrawerOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation - AppBar */}
      <AppBar position="sticky" sx={{ mb: 2 }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MUI Демонстрация
          </Typography>
          <IconButton color="inherit" aria-label="toggle theme" onClick={toggleTheme}>
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <IconButton color="inherit" aria-label="notifications">
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer navigation */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '280px', sm: '320px', md: '360px' },
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">Меню</Typography>
          <IconButton onClick={toggleDrawer(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider sx={{ my: 1 }} />
          <ListItem disablePadding>
            <ListItemButton onClick={handleResetToSystem}>
              <ListItemIcon>
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </ListItemIcon>
              <ListItemText 
                primary="Следовать системной теме" 
                secondary="Автоматическое переключение"
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Empty main content area to keep layout structure */}
      <Box sx={{ flex: 1 }} />
    </Box>
  )
}

export default App
