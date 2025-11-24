import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Email as EmailIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

export const EmailVerification = () => {
  const { user, logout, resendVerificationEmail } = useAuth();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleResendEmail = async () => {
    setSending(true);
    setError('');
    setMessage('');

    try {
      await resendVerificationEmail();
      setMessage('Письмо отправлено! Проверьте вашу почту.');
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError('Слишком много запросов. Попробуйте позже.');
      } else {
        setError('Не удалось отправить письмо. Попробуйте позже.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    setError('');
    setMessage('');

    try {
      // Reload user to get fresh email verification status
      await user?.reload();
      
      if (user?.emailVerified) {
        // Force page reload to update auth state
        window.location.reload();
      } else {
        setError('Email еще не подтвержден. Проверьте почту.');
      }
    } catch (err) {
      setError('Не удалось проверить статус. Попробуйте позже.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <EmailIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Подтвердите ваш email
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Мы отправили письмо с подтверждением на адрес:
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>
            {user?.email}
          </Typography>
        </Box>

        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            • Откройте письмо и нажмите на ссылку подтверждения
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            • После подтверждения вы автоматически вернетесь на сайт
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            • Проверьте папку "Спам", если письмо не пришло
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Или нажмите "Я подтвердил email" после подтверждения
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={handleCheckVerification}
          disabled={checking}
          startIcon={checking ? <CircularProgress size={20} /> : <RefreshIcon />}
          sx={{ mb: 2 }}
        >
          {checking ? 'Проверка...' : 'Я подтвердил email'}
        </Button>

        <Button
          fullWidth
          variant="outlined"
          onClick={handleResendEmail}
          disabled={sending}
          sx={{ mb: 2 }}
        >
          {sending ? 'Отправка...' : 'Отправить письмо повторно'}
        </Button>

        <Button
          fullWidth
          variant="text"
          onClick={handleLogout}
          color="inherit"
        >
          Выйти
        </Button>
      </Paper>
    </Box>
  );
};
