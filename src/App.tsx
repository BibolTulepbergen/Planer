import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Modal,
  Avatar,
  Badge,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  Paper,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Info as InfoIcon,
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
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

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

      {/* Drawer */}
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

      {/* Main Content */}
      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
            mb: { xs: 3, md: 4 },
            textAlign: 'center',
          }}
        >
          Демонстрация MUI компонентов
        </Typography>

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Card Component */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" gutterBottom>
                  Card компонент
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Это пример карточки Material-UI. Карточки используются для
                  отображения контента и действий по одной теме.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: { xs: 1, md: 2 } }}>
                <Button 
                  size={isDesktop ? 'medium' : 'small'} 
                  onClick={() => setModalOpen(true)}
                >
                  Подробнее
                </Button>
                <Button size={isDesktop ? 'medium' : 'small'}>Действие</Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Avatar with Badge */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: { xs: 2, md: 3 },
              }}
            >
              <Typography variant="h6" gutterBottom>
                Avatar с Badge
              </Typography>
              <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3, md: 4 }, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={3}
                  color="primary"
                >
                  <Avatar
                    sx={{ width: { xs: 56, sm: 64, md: 80 }, height: { xs: 56, sm: 64, md: 80 } }}
                    alt="User"
                    src="/static/images/avatar/1.jpg"
                  >
                    U
                  </Avatar>
                </Badge>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <NotificationsIcon sx={{ fontSize: { xs: 16, md: 20 }, color: 'white' }} />
                  }
                  color="error"
                >
                  <Avatar
                    sx={{ width: { xs: 56, sm: 64, md: 80 }, height: { xs: 56, sm: 64, md: 80 } }}
                    alt="User"
                  >
                    A
                  </Avatar>
                </Badge>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color="success"
                >
                  <Avatar
                    sx={{ width: { xs: 56, sm: 64, md: 80 }, height: { xs: 56, sm: 64, md: 80 } }}
                    alt="User"
                  >
                    O
                  </Avatar>
                </Badge>
              </Box>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Различные варианты аватаров с бейджами
              </Typography>
            </Paper>
          </Grid>

          {/* Additional Card for Desktop */}
          <Grid item xs={12} sm={6} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" gutterBottom>
                  Дополнительная карточка
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  На больших экранах доступно больше места для контента. Эта карточка видна только на desktop.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: { xs: 1, md: 2 } }}>
                <Button size={isDesktop ? 'medium' : 'small'}>Действие 1</Button>
                <Button size={isDesktop ? 'medium' : 'small'}>Действие 2</Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Navigation Example */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Typography variant="h6" gutterBottom>
                Навигация
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Используйте кнопку меню в верхней панели для открытия бокового
                меню (Drawer). Также в верхней панели есть пример навигации с
                уведомлениями.
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 1, md: 2 },
                  flexWrap: 'wrap',
                  mt: 2,
                }}
              >
                {menuItems.map((item) => (
                  <Button
                    key={item.text}
                    variant="outlined"
                    startIcon={item.icon}
                    size={isDesktop ? 'medium' : 'small'}
                  >
                    {item.text}
                  </Button>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Drawer Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InfoIcon color="primary" />
                  <Typography variant="h6">Drawer компонент</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Drawer (боковое меню) открывается при нажатии на иконку меню в
                  верхней панели. Это типичный паттерн для мобильных приложений.
                </Typography>
                <Button
                  variant="contained"
                  onClick={toggleDrawer(true)}
                  startIcon={<MenuIcon />}
                  size={isDesktop ? 'medium' : 'small'}
                >
                  Открыть Drawer
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400, md: 500 },
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: { xs: 2, sm: 4, md: 5 },
            maxHeight: { xs: '90vh', sm: 'auto' },
            overflow: 'auto',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography id="modal-title" variant="h6" component="h2">
              Modal компонент
            </Typography>
            <IconButton
              size="small"
              onClick={() => setModalOpen(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography id="modal-description" sx={{ mt: 2, mb: 2 }}>
            Это пример модального окна Material-UI. Модальные окна используются
            для отображения важной информации или действий, требующих внимания
            пользователя.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button variant="contained" onClick={() => setModalOpen(false)}>
              ОК
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  )
}

export default App
