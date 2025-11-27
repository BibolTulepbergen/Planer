import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import type { Tag, CreateTagRequest, UpdateTagRequest } from '../../types';

interface TagDialogProps {
  open: boolean;
  tag?: Tag | null;
  onClose: () => void;
  onSave: (data: CreateTagRequest | UpdateTagRequest) => Promise<void>;
}

const predefinedColors = [
  '#f44336', // red
  '#e91e63', // pink
  '#9c27b0', // purple
  '#673ab7', // deep purple
  '#3f51b5', // indigo
  '#2196f3', // blue
  '#03a9f4', // light blue
  '#00bcd4', // cyan
  '#009688', // teal
  '#4caf50', // green
  '#8bc34a', // light green
  '#cddc39', // lime
  '#ffeb3b', // yellow
  '#ffc107', // amber
  '#ff9800', // orange
  '#ff5722', // deep orange
];

export const TagDialog = ({ open, tag, onClose, onSave }: TagDialogProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#1976d2');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setColor(tag.color);
    } else {
      setName('');
      setColor('#1976d2');
    }
  }, [tag, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    setLoading(true);
    try {
      const data: CreateTagRequest | UpdateTagRequest = {
        name: name.trim(),
        color,
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error('Error saving tag:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{tag ? 'Редактировать тег' : 'Создать тег'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Название тега"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            autoFocus
          />

          <Box>
            <TextField
              label="Цвет"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box>
            <Box sx={{ mb: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
              Быстрый выбор цвета:
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {predefinedColors.map((c) => (
                <Box
                  key={c}
                  onClick={() => setColor(c)}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: c,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: color === c ? '3px solid' : '1px solid',
                    borderColor: color === c ? 'primary.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              p: 2,
              bgcolor: color,
              color: 'white',
              borderRadius: 1,
              textAlign: 'center',
              fontWeight: 'bold',
            }}
          >
            {name || 'Предпросмотр'}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Отмена
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading || !name.trim()}>
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

