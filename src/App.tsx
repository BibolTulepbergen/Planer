import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  Typography,
  Container,
  Avatar,
  Button,
  ListSubheader,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarMonthIcon,
  DateRange as DateRangeIcon,
  Event as EventIcon,
  Share as ShareIcon,
  Label as LabelIcon,
  Settings as SettingsIcon,
  Archive as ArchiveIcon,
  Close as CloseIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { TasksProvider } from './context/TasksContext';
import { useAuth } from './context/AuthContext';
import { TodayPage } from './pages/TodayPage';
import { WeekPage } from './pages/WeekPage';
import { MonthPage } from './pages/MonthPage';
import { CalendarPage } from './pages/CalendarPage';
import { SharedPage } from './pages/SharedPage';
import { TagsPage } from './pages/TagsPage';
import { ArchivePage } from './pages/ArchivePage';
import { SettingsPage } from './pages/SettingsPage';
import './App.css';

interface AppProps {
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
  onResetToSystem?: () => void;
}

const AppContent = ({ mode, setMode, onResetToSystem }: AppProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const toggleTheme = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const handleLogout = async () => {
    try {
      setDrawerOpen(false);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return '?';
    const email = user.email;
    return email.charAt(0).toUpperCase();
  };

  // Get avatar color based on email
  const getAvatarColor = () => {
    if (!user?.email) return '#757575';
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ff9800', '#ff5722'];
    const index = user.email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const menuItems = [
    { 
      group: 'Планирование', 
      items: [
        { text: 'Сегодня', icon: <TodayIcon />, path: '/app/today' },
        { text: 'Неделя', icon: <DateRangeIcon />, path: '/app/week' },
        { text: 'Месяц', icon: <CalendarMonthIcon />, path: '/app/month' },
        { text: 'Календарь', icon: <EventIcon />, path: '/app/calendar' },
      ]
    },
    { 
      group: 'Совместная работа', 
      items: [
        { text: 'Расшаренные', icon: <ShareIcon />, path: '/app/shared' },
        { text: 'Теги', icon: <LabelIcon />, path: '/app/tags' },
      ]
    },
    { 
      group: 'Прочее', 
      items: [
        { text: 'Архив', icon: <ArchiveIcon />, path: '/app/archive' },
        { text: 'Настройки', icon: <SettingsIcon />, path: '/app/settings' },
      ]
    },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleResetToSystem = () => {
    if (onResetToSystem) {
      onResetToSystem();
    }
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar position="sticky">
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
            Planer
          </Typography>
          <IconButton color="inherit" aria-label="toggle theme" onClick={toggleTheme}>
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '280px', sm: '300px' },
          },
        }}
      >
        {/* Header with close button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            p: 1,
            minHeight: 48,
          }}
        >
          <IconButton onClick={toggleDrawer(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* User Profile Section */}
        <Box
          sx={{
            px: 2,
            pb: 2,
            pt: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar
            sx={{
              width: 72,
              height: 72,
              bgcolor: getAvatarColor(),
              fontSize: '2rem',
              fontWeight: 600,
            }}
          >
            {getUserInitials()}
          </Avatar>
          
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                wordBreak: 'break-word',
                color: 'text.primary',
                fontWeight: 500,
              }}
            >
              {user?.email || 'Пользователь'}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            fullWidth
            size="small"
            sx={{ mt: 0.5 }}
          >
            Выйти
          </Button>
        </Box>

        <Divider sx={{ mb: 1 }} />

        {/* Menu Items with Groups */}
        <List sx={{ px: 1 }}>
          {menuItems.map((group, groupIndex) => (
            <Box key={group.group}>
              <ListSubheader
                sx={{
                  bgcolor: 'transparent',
                  lineHeight: '32px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {group.group}
              </ListSubheader>
              {group.items.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={location.pathname === item.path}
                    onClick={() => handleNavigate(item.path)}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'primary.contrastText',
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.95rem',
                        fontWeight: location.pathname === item.path ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {groupIndex < menuItems.length - 1 && <Box sx={{ my: 1 }} />}
            </Box>
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        {/* Theme Toggle at Bottom */}
        <Divider sx={{ mt: 1, mb: 1 }} />
        <List sx={{ px: 1, pb: 2 }}>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={handleResetToSystem}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </ListItemIcon>
              <ListItemText
                primary="Системная тема"
                secondary="Автоматическое переключение"
                primaryTypographyProps={{ fontSize: '0.9rem' }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Main content */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
        <Routes>
          <Route path="/app/today" element={<TodayPage />} />
          <Route path="/app/week" element={<WeekPage />} />
          <Route path="/app/month" element={<MonthPage />} />
          <Route path="/app/calendar" element={<CalendarPage />} />
          <Route path="/app/shared" element={<SharedPage />} />
          <Route path="/app/tags" element={<TagsPage />} />
          <Route path="/app/archive" element={<ArchivePage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/app/today" replace />} />
        </Routes>
      </Container>
    </Box>
  );
};

function App(props: AppProps) {
  return (
    <BrowserRouter>
      <TasksProvider>
        <AppContent {...props} />
      </TasksProvider>
    </BrowserRouter>
  );
}

export default App;
