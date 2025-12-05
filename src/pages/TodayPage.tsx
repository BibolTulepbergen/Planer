import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
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

export const TodayPage = () => {
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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [taskToShare, setTaskToShare] = useState<TaskWithTags | null>(null);

  const handleCreateTask = () => {
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: TaskWithTags) => {
    setSelectedTask(task);
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
          await deleteTask(taskToDelete.id, true); // Soft delete by default
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
      await createTask(data as CreateTaskRequest);
    }
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

  // Filter tasks for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTasks = tasks.filter((task) => {
    if (!task.start_datetime) return true; // Show tasks without date
    const taskDate = new Date(task.start_datetime);
    return taskDate >= today && taskDate < tomorrow;
  });

  const activeTasks = todayTasks.filter((task) => task.status !== 'done' && task.status !== 'canceled');
  const completedTasks = todayTasks.filter((task) => task.status === 'done');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Сегодня</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTask}>
          Создать задачу
        </Button>
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
        <>
          {activeTasks.length === 0 && completedTasks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Задач на сегодня нет
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Создайте новую задачу, чтобы начать планирование
              </Typography>
            </Box>
          ) : (
            <>
              {activeTasks.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Активные задачи ({activeTasks.length})
                  </Typography>
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
                </Box>
              )}

              {completedTasks.length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Выполненные задачи ({completedTasks.length})
                  </Typography>
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
                </Box>
              )}
            </>
          )}
        </>
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
        onClick={handleCreateTask}
      >
        <AddIcon />
      </Fab>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        task={selectedTask}
        tags={tags}
        onClose={() => setDialogOpen(false)}
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

