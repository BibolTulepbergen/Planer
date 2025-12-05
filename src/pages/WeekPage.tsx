import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import { useTasks } from '../context/TasksContext';
import { TaskCard } from '../components/Tasks/TaskCard';
import { TaskDialog } from '../components/Tasks/TaskDialog';
import { TaskShareDialog } from '../components/Tasks/TaskShareDialog';
import type {
  TaskWithTags,
  TaskStatus,
  CreateTaskRequest,
  UpdateTaskRequest,
  ShareTaskRequest,
} from '../types';

export const WeekPage = () => {
  const {
    tasks,
    loading,
    error,
    tags,
    createTask,
    updateTask,
    deleteTask,
    archiveTask,
    duplicateTask,
    shareTask,
    removeSharedTask,
  } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithTags | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithTags | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [taskToShare, setTaskToShare] = useState<TaskWithTags | null>(null);

  // Get week start (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Generate array of 7 days for the week
  const weekDays = useMemo(() => {
    const start = getWeekStart(selectedDate);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [selectedDate]);

  // Navigate week
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Filter tasks by day
  const getTasksForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return tasks.filter((task) => {
      if (!task.start_datetime) return false;
      const taskDate = new Date(task.start_datetime);
      return taskDate >= dayStart && taskDate <= dayEnd;
    });
  };

  const handleCreateTask = (dayDate?: Date) => {
    setSelectedTask(null);
    if (dayDate) {
      // Set default date to the clicked day at 9:00 AM
      const defaultDateTime = new Date(dayDate);
      defaultDateTime.setHours(9, 0, 0, 0);
      setDefaultDate(defaultDateTime.toISOString());
    } else {
      setDefaultDate(undefined);
    }
    setDialogOpen(true);
  };

  const handleEditTask = (task: TaskWithTags) => {
    setSelectedTask(task);
    setDefaultDate(undefined);
    setDialogOpen(true);
  };

  const handleDeleteTask = (task: TaskWithTags) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleRemoveSharedTask = (task: TaskWithTags) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDuplicateTask = async (task: TaskWithTags) => {
    try {
      await duplicateTask(task.id);
    } catch (error) {
      console.error('Error duplicating task:', error);
    }
  };

  const handleArchiveTask = async (task: TaskWithTags) => {
    try {
      await archiveTask(task.id);
    } catch (error) {
      console.error('Error archiving task:', error);
    }
  };

  const confirmDelete = async () => {
    if (taskToDelete) {
      try {
        if (taskToDelete.is_shared) {
          await removeSharedTask(taskToDelete.id);
        } else {
          await deleteTask(taskToDelete.id, true);
        }
        setDeleteDialogOpen(false);
        setTaskToDelete(null);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleSaveTask = async (data: CreateTaskRequest | UpdateTaskRequest) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, data as UpdateTaskRequest);
    } else {
      // If default date is set, use it
      if (defaultDate && !data.start_datetime) {
        data.start_datetime = defaultDate;
      }
      await createTask(data as CreateTaskRequest);
    }
    setDefaultDate(undefined);
  };

  const handleStatusChange = async (task: TaskWithTags, status: TaskStatus) => {
    try {
      await updateTask(task.id, { status });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleShareTask = (task: TaskWithTags) => {
    setTaskToShare(task);
    setShareDialogOpen(true);
  };

  const handleShareSave = async (taskId: number, data: ShareTaskRequest) => {
    await shareTask(taskId, data);
  };

  const formatDayHeader = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    const isToday = compareDate.getTime() === today.getTime();

    return {
      dayName: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
      dayNumber: date.getDate(),
      monthName: date.toLocaleDateString('ru-RU', { month: 'short' }),
      isToday,
    };
  };

  const currentWeekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.getDate()} ${start.toLocaleDateString('ru-RU', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('ru-RU', { month: 'long' })} ${end.getFullYear()}`;
  }, [weekDays]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4">Неделя</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {currentWeekLabel}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={goToPreviousWeek}>
            <ChevronLeftIcon />
          </IconButton>
          <Button variant="outlined" startIcon={<TodayIcon />} onClick={goToToday}>
            Сегодня
          </Button>
          <IconButton onClick={goToNextWeek}>
            <ChevronRightIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleCreateTask()}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Создать задачу
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          {weekDays.map((day) => {
            const dayInfo = formatDayHeader(day);
            const dayTasks = getTasksForDay(day);
            const activeTasks = dayTasks.filter(
              (task) => task.status !== 'done' && task.status !== 'canceled'
            );
            const completedTasks = dayTasks.filter((task) => task.status === 'done');

            return (
              <Box
                key={day.toISOString()}
                sx={{
                  flex: {
                    xs: '1 1 100%',
                    sm: '1 1 calc(50% - 8px)',
                    md: '1 1 calc(33.333% - 11px)',
                    lg: '1 1 calc(14.285% - 12px)',
                  },
                  minWidth: { xs: '100%', sm: 280, lg: 150 },
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    minHeight: 400,
                    height: '100%',
                    backgroundColor: dayInfo.isToday ? 'primary.50' : 'background.paper',
                    border: dayInfo.isToday ? 2 : 1,
                    borderColor: dayInfo.isToday ? 'primary.main' : 'divider',
                  }}
                >
                  {/* Day Header */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                            color: dayInfo.isToday ? 'primary.main' : 'text.secondary',
                          }}
                        >
                          {dayInfo.dayName}
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 'bold',
                            color: dayInfo.isToday ? 'primary.main' : 'text.primary',
                          }}
                        >
                          {dayInfo.dayNumber}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => handleCreateTask(day)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    {dayInfo.isToday && (
                      <Chip label="Сегодня" size="small" color="primary" sx={{ mt: 1 }} />
                    )}
                  </Box>

                  {/* Tasks count */}
                  {dayTasks.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      {activeTasks.length} активных, {completedTasks.length} выполнено
                    </Typography>
                  )}

                  {/* Tasks list */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {activeTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onArchive={handleArchiveTask}
                        onDuplicate={handleDuplicateTask}
                        onStatusChange={handleStatusChange}
                        onShare={handleShareTask}
                        onRemoveShared={handleRemoveSharedTask}
                      />
                    ))}
                    {completedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onArchive={handleArchiveTask}
                        onDuplicate={handleDuplicateTask}
                        onStatusChange={handleStatusChange}
                        onShare={handleShareTask}
                        onRemoveShared={handleRemoveSharedTask}
                      />
                    ))}
                    {dayTasks.length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        Нет задач
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' },
        }}
        onClick={() => handleCreateTask()}
      >
        <AddIcon />
      </Fab>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        task={selectedTask}
        tags={tags}
        defaultDate={defaultDate}
        onClose={() => {
          setDialogOpen(false);
          setDefaultDate(undefined);
        }}
        onSave={handleSaveTask}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          {taskToDelete?.is_shared ? 'Удалить задачу из вашего списка?' : 'Удалить задачу?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {taskToDelete?.is_shared
              ? `Задача "${taskToDelete?.title}" будет удалена только из вашего списка. Оригинал останется у владельца.`
              : `Задача "${taskToDelete?.title}" будет перемещена в архив. Вы сможете восстановить её позже.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Task Dialog */}
      <TaskShareDialog
        open={shareDialogOpen}
        task={taskToShare}
        onClose={() => setShareDialogOpen(false)}
        onShare={handleShareSave}
      />
    </Box>
  );
};

