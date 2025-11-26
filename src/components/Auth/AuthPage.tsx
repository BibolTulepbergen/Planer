import { useState } from 'react';
import { Box } from '@mui/material';
import { Login } from './Login';
import { Register } from './Register';
import { ForgotPassword } from './ForgotPassword';

export const AuthPage = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>('login');

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const handleForgotPassword = () => {
    setMode('forgot-password');
  };

  const handleBackToLogin = () => {
    setMode('login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      {mode === 'login' ? (
        <Login onToggleMode={toggleMode} onForgotPassword={handleForgotPassword} />
      ) : mode === 'register' ? (
        <Register onToggleMode={toggleMode} />
      ) : (
        <ForgotPassword onToggleMode={handleBackToLogin} />
      )}
    </Box>
  );
};

