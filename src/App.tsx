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
  const { logout } = useAuth();

  const toggleTheme = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { text: 'Сегодня', icon: <TodayIcon />, path: '/app/today' },
    { text: 'Неделя', icon: <DateRangeIcon />, path: '/app/week' },
    { text: 'Месяц', icon: <CalendarMonthIcon />, path: '/app/month' },
    { text: 'Календарь', icon: <EventIcon />, path: '/app/calendar' },
    { text: 'Расшаренные', icon: <ShareIcon />, path: '/app/shared' },
    { text: 'Теги', icon: <LabelIcon />, path: '/app/tags' },
    { text: 'Настройки', icon: <SettingsIcon />, path: '/app/settings' },
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
            width: { xs: '280px', sm: '320px' },
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
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigate(item.path)}
              >
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
                primary="Системная тема"
                secondary="Автоматическое переключение"
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Выйти" />
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
