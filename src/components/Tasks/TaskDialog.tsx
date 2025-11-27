import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  OutlinedInput,
} from '@mui/material';
import type {
  TaskWithTags,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskPriority,
  TaskStatus,
  Tag,
} from '../../types';

interface TaskDialogProps {
  open: boolean;
  task?: TaskWithTags | null;
  tags: Tag[];
  onClose: () => void;
  onSave: (data: CreateTaskRequest | UpdateTaskRequest) => Promise<void>;
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'critical', label: 'Критический' },
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'planned', label: 'Запланировано' },
  { value: 'in_progress', label: 'В процессе' },
  { value: 'done', label: 'Выполнено' },
  { value: 'skipped', label: 'Пропущено' },
  { value: 'canceled', label: 'Отменено' },
];

export const TaskDialog = ({ open, task, tags, onClose, onSave }: TaskDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [deadlineDatetime, setDeadlineDatetime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('planned');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStartDatetime(task.start_datetime || '');
      setDeadlineDatetime(task.deadline_datetime || '');
      setPriority(task.priority);
      setStatus(task.status);
      setSelectedTagIds(task.tags.map((t) => t.id));
    } else {
      // Reset form for new task
      setTitle('');
      setDescription('');
      setStartDatetime('');
      setDeadlineDatetime('');
      setPriority('medium');
      setStatus('planned');
      setSelectedTagIds([]);
    }
  }, [task, open]);

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    setLoading(true);
    try {
      const data: CreateTaskRequest | UpdateTaskRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        start_datetime: startDatetime || undefined,
        deadline_datetime: deadlineDatetime || undefined,
        priority,
        status,
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeLocal = (dateTime: string) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task ? 'Редактировать задачу' : 'Создать задачу'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            autoFocus
          />

          <TextField
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />

          <TextField
            label="Дата и время начала"
            type="datetime-local"
            value={formatDateTimeLocal(startDatetime)}
            onChange={(e) => setStartDatetime(e.target.value ? new Date(e.target.value).toISOString() : '')}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Дедлайн"
            type="datetime-local"
            value={formatDateTimeLocal(deadlineDatetime)}
            onChange={(e) => setDeadlineDatetime(e.target.value ? new Date(e.target.value).toISOString() : '')}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth>
            <InputLabel>Приоритет</InputLabel>
            <Select
              value={priority}
              label="Приоритет"
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              {priorityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Статус</InputLabel>
            <Select
              value={status}
              label="Статус"
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Теги</InputLabel>
            <Select
              multiple
              value={selectedTagIds}
              onChange={(e) => setSelectedTagIds(e.target.value as number[])}
              input={<OutlinedInput label="Теги" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId);
                    return tag ? (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        sx={{ bgcolor: tag.color, color: 'white' }}
                      />
                    ) : null;
                  })}
                </Box>
              )}
            >
              {tags.map((tag) => (
                <MenuItem key={tag.id} value={tag.id}>
                  <Chip
                    label={tag.name}
                    size="small"
                    sx={{ bgcolor: tag.color, color: 'white', mr: 1 }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Отмена
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading || !title.trim()}>
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

