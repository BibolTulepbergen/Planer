import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Alert,
} from '@mui/material';
import type { TaskWithTags, ShareTaskRequest, TaskShareAccess } from '../../types';

interface TaskShareDialogProps {
  open: boolean;
  task: TaskWithTags | null;
  onClose: () => void;
  onShare: (taskId: number, data: ShareTaskRequest) => Promise<void>;
}

export const TaskShareDialog = ({ open, task, onClose, onShare }: TaskShareDialogProps) => {
  const [email, setEmail] = useState('');
  const [access, setAccess] = useState<TaskShareAccess>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (loading) return;
    setError(null);
    setEmail('');
    setAccess('view');
    onClose();
  };

  const handleShare = async () => {
    if (!task) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Введите email пользователя');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onShare(task.id, {
        email: trimmedEmail,
        access,
      });
      setEmail('');
      setAccess('view');
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось поделиться задачей. Попробуйте ещё раз.';
      setError(message);
      // Keep dialog open so user can fix email or try again
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Поделиться задачей</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {task && (
            <Box sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
              Задача:&nbsp;
              <strong>{task.title}</strong>
            </Box>
          )}

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <TextField
            label="Email пользователя"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            autoFocus
          />

          <FormControl component="fieldset">
            <FormLabel component="legend">Права доступа</FormLabel>
            <RadioGroup
              row
              value={access}
              onChange={(e) => setAccess(e.target.value as TaskShareAccess)}
            >
              <FormControlLabel
                value="view"
                control={<Radio />}
                label="Только просмотр"
              />
              <FormControlLabel
                value="edit"
                control={<Radio />}
                label="Редактирование"
              />
            </RadioGroup>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Отмена
        </Button>
        <Button
          onClick={handleShare}
          variant="contained"
          disabled={loading || !email.trim()}
        >
          {loading ? 'Отправка...' : 'Поделиться'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


