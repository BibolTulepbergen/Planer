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
  Badge,
  Tooltip,
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
import type { TaskWithTags, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from '../types';

export const MonthPage = () => {
  const { tasks, loading, error, tags, createTask, updateTask, deleteTask, duplicateTask } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithTags | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithTags | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  const [selectedDayTasks, setSelectedDayTasks] = useState<TaskWithTags[]>([]);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Get calendar days for the month
  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Make Monday = 0

    // Calculate how many days to show before the month starts
    const daysFromPrevMonth = adjustedFirstDay;

    // Calculate total cells needed (should be multiple of 7)
    const daysInMonth = lastDay.getDate();
    const totalCells = Math.ceil((daysFromPrevMonth + daysInMonth) / 7) * 7;
    const daysFromNextMonth = totalCells - daysFromPrevMonth - daysInMonth;

    const days: Date[] = [];

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(date);
    }

    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push(date);
    }

    // Add days from next month
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(year, month + 1, i);
      days.push(date);
    }

    return days;
  }, [selectedMonth]);

  // Navigate months
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  const goToToday = () => {
    setSelectedMonth(new Date());
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

  const handleDayClick = (date: Date) => {
    const dayTasks = getTasksForDay(date);
    setSelectedDay(date);
    setSelectedDayTasks(dayTasks);
    setDayDialogOpen(true);
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
      // Update day dialog if open
      if (selectedDay) {
        setSelectedDayTasks(getTasksForDay(selectedDay));
      }
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
        // Update day dialog if open
        if (selectedDay) {
          setSelectedDayTasks(getTasksForDay(selectedDay));
        }
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
    // Update day dialog if open
    if (selectedDay) {
      setSelectedDayTasks(getTasksForDay(selectedDay));
    }
  };

  const handleStatusChange = async (task: TaskWithTags, status: TaskStatus) => {
    try {
      await updateTask(task.id, { status });
      // Update day dialog if open
      if (selectedDay) {
        setSelectedDayTasks(getTasksForDay(selectedDay));
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === selectedMonth.getMonth();
  };

  const monthLabel = useMemo(() => {
    return selectedMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const weekDayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ textTransform: 'capitalize' }}>
            {monthLabel}
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
        <Paper sx={{ p: 2 }}>
          {/* Week day headers */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            {weekDayNames.map((day) => (
              <Box key={day} sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    textAlign: 'center',
                    display: 'block',
                    fontWeight: 'bold',
                    color: 'text.secondary',
                  }}
                >
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Calendar grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {calendarDays.map((day, index) => {
              const dayTasks = getTasksForDay(day);
              const activeTasks = dayTasks.filter(
                (task) => task.status !== 'done' && task.status !== 'canceled'
              );
              const completedTasks = dayTasks.filter((task) => task.status === 'done');

              return (
                <Box key={index}>
                  <Paper
                    sx={{
                      p: 1,
                      minHeight: 100,
                      cursor: 'pointer',
                      backgroundColor: isToday(day)
                        ? 'primary.50'
                        : !isCurrentMonth(day)
                          ? 'action.hover'
                          : 'background.paper',
                      border: isToday(day) ? 2 : 1,
                      borderColor: isToday(day) ? 'primary.main' : 'divider',
                      opacity: !isCurrentMonth(day) ? 0.5 : 1,
                      '&:hover': {
                        backgroundColor: isToday(day) ? 'primary.100' : 'action.hover',
                      },
                    }}
                    onClick={() => handleDayClick(day)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isToday(day) ? 'bold' : 'normal',
                          color: isToday(day) ? 'primary.main' : 'text.primary',
                        }}
                      >
                        {day.getDate()}
                      </Typography>
                      {dayTasks.length > 0 && (
                        <Badge badgeContent={dayTasks.length} color="primary" max={9} />
                      )}
                    </Box>

                    {/* Task indicators */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {activeTasks.slice(0, 2).map((task) => (
                        <Tooltip title={task.title} key={task.id}>
                          <Box
                            sx={{
                              fontSize: '0.7rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              p: 0.5,
                              borderRadius: 0.5,
                              bgcolor: 'primary.100',
                              color: 'primary.dark',
                            }}
                          >
                            {task.title}
                          </Box>
                        </Tooltip>
                      ))}
                      {activeTasks.length > 2 && (
                        <Typography variant="caption" color="text.secondary">
                          +{activeTasks.length - 2} еще
                        </Typography>
                      )}
                      {completedTasks.length > 0 && (
                        <Typography variant="caption" color="success.main">
                          ✓ {completedTasks.length}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Box>
              );
            })}
          </Box>
        </Paper>
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

      {/* Day Tasks Dialog */}
      <Dialog
        open={dayDialogOpen}
        onClose={() => setDayDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedDay && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                {selectedDay.toLocaleDateString('ru-RU', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  setDayDialogOpen(false);
                  handleCreateTask(selectedDay);
                }}
              >
                Создать задачу
              </Button>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedDayTasks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                На этот день задач нет
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {selectedDayTasks.map((task) => (
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDayDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

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

