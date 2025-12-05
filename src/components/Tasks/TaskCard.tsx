import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Checkbox,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  ContentCopy as ContentCopyIcon,
  Archive as ArchiveIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import type { TaskWithTags, TaskStatus } from '../../types';

interface TaskCardProps {
  task: TaskWithTags;
  onEdit?: (task: TaskWithTags) => void;
  onDelete?: (task: TaskWithTags) => void;
  onArchive?: (task: TaskWithTags) => void;
  onDuplicate?: (task: TaskWithTags) => void;
  onStatusChange?: (task: TaskWithTags, status: TaskStatus) => void;
}

const priorityColors = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  critical: '#9c27b0',
};

const priorityLabels = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
};

const statusLabels = {
  planned: 'Запланировано',
  in_progress: 'В процессе',
  done: 'Выполнено',
  skipped: 'Пропущено',
  canceled: 'Отменено',
};

export const TaskCard = ({ task, onEdit, onDelete, onArchive, onDuplicate, onStatusChange }: TaskCardProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    if (onEdit) onEdit(task);
  };

  const handleDuplicate = () => {
    handleMenuClose();
    if (onDuplicate) onDuplicate(task);
  };

  const handleArchive = () => {
    handleMenuClose();
    if (onArchive) onArchive(task);
  };

  const handleStatusToggle = () => {
    if (onStatusChange) {
      const newStatus: TaskStatus = task.status === 'done' ? 'planned' : 'done';
      onStatusChange(task, newStatus);
    }
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return null;
    const date = new Date(dateTime);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card
      sx={{
        mb: 2,
        opacity: task.status === 'done' ? 0.7 : 1,
        borderLeft: `4px solid ${priorityColors[task.priority]}`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Checkbox
            checked={task.status === 'done'}
            onChange={handleStatusToggle}
            sx={{ mt: -1 }}
          />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  textDecoration: task.status === 'done' ? 'line-through' : 'none',
                  flex: 1,
                }}
              >
                {task.title}
              </Typography>
              <FlagIcon sx={{ color: priorityColors[task.priority], fontSize: 20 }} />
            </Box>

            {task.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {task.description}
              </Typography>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              <Chip
                label={statusLabels[task.status]}
                size="small"
                color={task.status === 'done' ? 'success' : 'default'}
              />
              <Chip
                label={priorityLabels[task.priority]}
                size="small"
                sx={{
                  bgcolor: priorityColors[task.priority],
                  color: 'white',
                }}
              />
              {task.tags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  sx={{
                    bgcolor: tag.color,
                    color: 'white',
                  }}
                />
              ))}
            </Box>

            {(task.start_datetime || task.deadline_datetime) && (
              <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                {task.start_datetime && (
                  <Typography variant="caption" color="text.secondary">
                    Начало: {formatDateTime(task.start_datetime)}
                  </Typography>
                )}
                {task.deadline_datetime && (
                  <Typography variant="caption" color="error">
                    Дедлайн: {formatDateTime(task.deadline_datetime)}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <Box>
            <IconButton 
              size="small" 
              onClick={handleMenuClick}
              aria-label="меню действий"
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {onEdit && (
                <MenuItem onClick={handleEdit}>
                  <ListItemIcon>
                    <EditIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Редактировать</ListItemText>
                </MenuItem>
              )}
              {onDuplicate && (
                <MenuItem onClick={handleDuplicate}>
                  <ListItemIcon>
                    <ContentCopyIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Дублировать</ListItemText>
                </MenuItem>
              )}
              {onArchive && (
                <MenuItem onClick={handleArchive}>
                  <ListItemIcon>
                    <ArchiveIcon fontSize="small" sx={{ color: '#ff9800' }} />
                  </ListItemIcon>
                  <ListItemText>В архив</ListItemText>
                </MenuItem>
              )}
            </Menu>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

