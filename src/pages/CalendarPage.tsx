import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  Badge,
  CircularProgress,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useTasks } from '../context/TasksContext';
import { TaskCard } from '../components/Tasks/TaskCard';
import { TaskDialog } from '../components/Tasks/TaskDialog';
import type { TaskWithTags, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from '../types';

export const CalendarPage = () => {
  const { tasks, loading, error, tags, createTask, updateTask, deleteTask, duplicateTask } = useTasks();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDayTasks, setSelectedDayTasks] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithTags | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithTags | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);

  // Get first day of month and total days
  const firstDayOfMonth = useMemo(() => {
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  }, [selectedDate]);

  const daysInMonth = useMemo(() => {
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  }, [selectedDate]);

  const startingDayOfWeek = useMemo(() => {
    const day = firstDayOfMonth.getDay();
    return day === 0 ? 6 : day - 1; // Convert to Monday = 0
  }, [firstDayOfMonth]);

  // Generate calendar days (including previous/next month padding)
  const calendarDays = useMemo(() => {
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month days
    const prevMonthDays = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i),
        isCurrentMonth: true,
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [selectedDate, daysInMonth, startingDayOfWeek]);

  // Navigation
  const goToPreviousMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Get tasks for a specific day
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

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDayClick = (date: Date) => {
    setSelectedDayTasks(date);
  };

  const handleCreateTask = (dayDate?: Date) => {
    setSelectedTask(null);
    if (dayDate) {
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

  const handleDuplicateTask = async (task: TaskWithTags) => {
    try {
      await duplicateTask(task.id);
    } catch (error) {
      console.error('Error duplicating task:', error);
    }
  };

  const confirmDelete = async () => {
    if (taskToDelete) {
      try {
        await deleteTask(taskToDelete.id, true);
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

  const currentMonthLabel = selectedDate.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const selectedDayTasksList = selectedDayTasks ? getTasksForDay(selectedDayTasks) : [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ textTransform: 'capitalize' }}>
            {currentMonthLabel}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={goToPreviousMonth}>
            <ChevronLeftIcon />
          </IconButton>
          <Button variant="outlined" startIcon={<TodayIcon />} onClick={goToToday}>
            Сегодня
          </Button>
          <IconButton onClick={goToNextMonth}>
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
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Calendar Grid */}
          <Paper sx={{ flex: 1, p: 2 }}>
            {/* Week day headers */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1,
                mb: 1,
              }}
            >
              {weekDays.map((day) => (
                <Box
                  key={day}
                  sx={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: 'text.secondary',
                    py: 1,
                  }}
                >
                  {day}
                </Box>
              ))}
            </Box>

            {/* Calendar days */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1,
              }}
            >
              {calendarDays.map((day, index) => {
                const dayTasks = getTasksForDay(day.date);
                const activeTasks = dayTasks.filter(
                  (task) => task.status !== 'done' && task.status !== 'canceled'
                );
                const completedTasks = dayTasks.filter((task) => task.status === 'done');
                const isTodayDate = isToday(day.date);
                const isSelected =
                  selectedDayTasks &&
                  day.date.toDateString() === selectedDayTasks.toDateString();

                return (
                  <Paper
                    key={index}
                    onClick={() => handleDayClick(day.date)}
                    sx={{
                      minHeight: 100,
                      p: 1,
                      cursor: 'pointer',
                      backgroundColor: isTodayDate
                        ? 'primary.50'
                        : !day.isCurrentMonth
                        ? 'action.hover'
                        : 'background.paper',
                      border: 2,
                      borderColor: isSelected
                        ? 'primary.main'
                        : isTodayDate
                        ? 'primary.light'
                        : 'transparent',
                      opacity: day.isCurrentMonth ? 1 : 0.5,
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'scale(1.02)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isTodayDate ? 'bold' : 'normal',
                          color: isTodayDate ? 'primary.main' : 'text.primary',
                        }}
                      >
                        {day.date.getDate()}
                      </Typography>
                      {dayTasks.length > 0 && (
                        <Badge badgeContent={dayTasks.length} color="primary" max={99} />
                      )}
                    </Box>

                    {/* Task indicators */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {activeTasks.slice(0, 2).map((task) => (
                        <Tooltip key={task.id} title={task.title} arrow>
                          <Box
                            sx={{
                              width: '100%',
                              height: 4,
                              borderRadius: 1,
                              bgcolor:
                                task.priority === 'critical'
                                  ? 'error.main'
                                  : task.priority === 'high'
                                  ? 'warning.main'
                                  : task.priority === 'medium'
                                  ? 'info.main'
                                  : 'success.main',
                            }}
                          />
                        </Tooltip>
                      ))}
                      {activeTasks.length > 2 && (
                        <Typography variant="caption" color="text.secondary">
                          +{activeTasks.length - 2} ещё
                        </Typography>
                      )}
                      {completedTasks.length > 0 && (
                        <Typography variant="caption" color="success.main">
                          ✓ {completedTasks.length}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Paper>

          {/* Selected day tasks panel */}
          {selectedDayTasks && (
            <Paper
              sx={{
                width: { xs: '100%', lg: 350 },
                p: 2,
                maxHeight: 600,
                overflow: 'auto',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {selectedDayTasks.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    weekday: 'short',
                  })}
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => handleCreateTask(selectedDayTasks)}>
                  Добавить
                </Button>
              </Box>

              {isToday(selectedDayTasks) && (
                <Chip label="Сегодня" size="small" color="primary" sx={{ mb: 2 }} />
              )}

              {selectedDayTasksList.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Нет задач на этот день
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedDayTasksList.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                      onDuplicate={handleDuplicateTask}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </Box>
              )}
            </Paper>
          )}
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
        <DialogTitle>Удалить задачу?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Задача "{taskToDelete?.title}" будет перемещена в архив. Вы сможете восстановить её позже.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

