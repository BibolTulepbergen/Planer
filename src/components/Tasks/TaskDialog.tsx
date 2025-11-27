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
  Divider,
  Typography,
  ButtonGroup,
} from '@mui/material';
import { RecurrenceSettings } from './RecurrenceSettings';
import type {
  TaskWithTags,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskPriority,
  TaskStatus,
  Tag,
  CreateRecurrenceRequest,
} from '../../types';

interface TaskDialogProps {
  open: boolean;
  task?: TaskWithTags | null;
  tags: Tag[];
  defaultDate?: string;
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

export const TaskDialog = ({ open, task, tags, defaultDate, onClose, onSave }: TaskDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [deadlineDatetime, setDeadlineDatetime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('planned');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [recurrence, setRecurrence] = useState<CreateRecurrenceRequest | undefined>(undefined);
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
      // Convert recurrence from backend format to frontend format
      if (task.recurrence) {
        const rec = task.recurrence;
        setRecurrence({
          recurrence_type: rec.recurrence_type,
          interval_value: rec.interval_value,
          days_of_week: rec.days_of_week ? rec.days_of_week.split(',').map(Number) : undefined,
          day_of_month: rec.day_of_month || undefined,
          week_of_month: rec.week_of_month || undefined,
          month_of_year: rec.month_of_year || undefined,
          end_type: rec.end_type,
          end_date: rec.end_date || undefined,
          max_occurrences: rec.max_occurrences || undefined,
        });
      } else {
        setRecurrence(undefined);
      }
    } else {
      // Reset form for new task
      setTitle('');
      setDescription('');
      setStartDatetime(defaultDate || '');
      setDeadlineDatetime('');
      setPriority('medium');
      setStatus('planned');
      setSelectedTagIds([]);
      setRecurrence(undefined);
    }
  }, [task, open, defaultDate]);

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

      // Only add recurrence for new tasks (not updates)
      if (!task && recurrence) {
        (data as CreateTaskRequest).recurrence = recurrence;
      }

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

  const formatDateOnly = (dateTime: string) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeOnly = (dateTime: string) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const setDateQuickly = (type: 'start' | 'deadline', days: number) => {
    const now = new Date();
    now.setDate(now.getDate() + days);
    if (type === 'start') {
      now.setHours(9, 0, 0, 0);
      setStartDatetime(now.toISOString());
    } else {
      now.setHours(18, 0, 0, 0);
      setDeadlineDatetime(now.toISOString());
    }
  };

  const setTimeQuickly = (type: 'start' | 'deadline', hour: number, minute: number = 0) => {
    const currentValue = type === 'start' ? startDatetime : deadlineDatetime;
    const date = currentValue ? new Date(currentValue) : new Date();
    date.setHours(hour, minute, 0, 0);
    
    if (type === 'start') {
      setStartDatetime(date.toISOString());
    } else {
      setDeadlineDatetime(date.toISOString());
    }
  };

  const handleDateChange = (type: 'start' | 'deadline', dateValue: string) => {
    const currentValue = type === 'start' ? startDatetime : deadlineDatetime;
    const currentDate = currentValue ? new Date(currentValue) : new Date();
    
    if (!dateValue) {
      if (type === 'start') {
        setStartDatetime('');
      } else {
        setDeadlineDatetime('');
      }
      return;
    }

    const [year, month, day] = dateValue.split('-').map(Number);
    currentDate.setFullYear(year, month - 1, day);
    
    if (type === 'start') {
      setStartDatetime(currentDate.toISOString());
    } else {
      setDeadlineDatetime(currentDate.toISOString());
    }
  };

  const handleTimeChange = (type: 'start' | 'deadline', timeValue: string) => {
    const currentValue = type === 'start' ? startDatetime : deadlineDatetime;
    const date = currentValue ? new Date(currentValue) : new Date();
    
    if (!timeValue) return;

    const [hours, minutes] = timeValue.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    
    if (type === 'start') {
      setStartDatetime(date.toISOString());
    } else {
      setDeadlineDatetime(date.toISOString());
    }
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

          {/* Start Date and Time */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Дата и время начала
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                label="Дата"
                type="date"
                value={formatDateOnly(startDatetime)}
                onChange={(e) => handleDateChange('start', e.target.value)}
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Время"
                type="time"
                value={formatTimeOnly(startDatetime)}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <ButtonGroup size="small" variant="outlined">
                <Button onClick={() => setDateQuickly('start', 0)}>Сегодня</Button>
                <Button onClick={() => setDateQuickly('start', 1)}>Завтра</Button>
                <Button onClick={() => setDateQuickly('start', 7)}>Через неделю</Button>
              </ButtonGroup>
              <ButtonGroup size="small" variant="outlined">
                <Button onClick={() => setTimeQuickly('start', new Date().getHours(), new Date().getMinutes())}>
                  Сейчас
                </Button>
                <Button onClick={() => setTimeQuickly('start', 9, 0)}>9:00</Button>
                <Button onClick={() => setTimeQuickly('start', 12, 0)}>12:00</Button>
                <Button onClick={() => setTimeQuickly('start', 15, 0)}>15:00</Button>
                <Button onClick={() => setTimeQuickly('start', 18, 0)}>18:00</Button>
              </ButtonGroup>
              {startDatetime && (
                <Button size="small" variant="outlined" color="error" onClick={() => setStartDatetime('')}>
                  Очистить
                </Button>
              )}
            </Box>
          </Box>

          {/* Deadline Date and Time */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Дедлайн
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                label="Дата"
                type="date"
                value={formatDateOnly(deadlineDatetime)}
                onChange={(e) => handleDateChange('deadline', e.target.value)}
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Время"
                type="time"
                value={formatTimeOnly(deadlineDatetime)}
                onChange={(e) => handleTimeChange('deadline', e.target.value)}
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <ButtonGroup size="small" variant="outlined">
                <Button onClick={() => setDateQuickly('deadline', 0)}>Сегодня</Button>
                <Button onClick={() => setDateQuickly('deadline', 1)}>Завтра</Button>
                <Button onClick={() => setDateQuickly('deadline', 7)}>Через неделю</Button>
              </ButtonGroup>
              <ButtonGroup size="small" variant="outlined">
                <Button onClick={() => setTimeQuickly('deadline', new Date().getHours(), new Date().getMinutes())}>
                  Сейчас
                </Button>
                <Button onClick={() => setTimeQuickly('deadline', 9, 0)}>9:00</Button>
                <Button onClick={() => setTimeQuickly('deadline', 12, 0)}>12:00</Button>
                <Button onClick={() => setTimeQuickly('deadline', 15, 0)}>15:00</Button>
                <Button onClick={() => setTimeQuickly('deadline', 18, 0)}>18:00</Button>
              </ButtonGroup>
              {deadlineDatetime && (
                <Button size="small" variant="outlined" color="error" onClick={() => setDeadlineDatetime('')}>
                  Очистить
                </Button>
              )}
            </Box>
          </Box>

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

          {/* Recurrence Settings - Only for new tasks */}
          {!task && (
            <>
              <Divider sx={{ my: 2 }} />
              <RecurrenceSettings value={recurrence} onChange={setRecurrence} />
            </>
          )}
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

