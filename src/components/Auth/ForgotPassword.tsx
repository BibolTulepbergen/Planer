import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Link,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

interface ForgotPasswordProps {
  onToggleMode: () => void;
}

export const ForgotPassword = ({ onToggleMode }: ForgotPasswordProps) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      let errorMessage = 'Failed to send password reset email';
      
      // Handle Firebase Auth errors
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later';
          break;
        default:
          errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Сброс пароля
      </Typography>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Введите ваш email и мы отправим вам ссылку для сброса пароля
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Письмо со ссылкой для сброса пароля отправлено на ваш email. Проверьте почту.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          margin="normal"
          autoComplete="email"
          disabled={success}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading || success}
          sx={{ mt: 3, mb: 2 }}
        >
          {loading ? 'Отправка...' : 'Отправить ссылку'}
        </Button>

        <Typography align="center">
          Вспомнили пароль?{' '}
          <Link
            component="button"
            type="button"
            onClick={onToggleMode}
            sx={{ cursor: 'pointer' }}
          >
            Войти
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};

