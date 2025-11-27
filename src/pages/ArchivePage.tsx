import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Restore as RestoreIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { useTasks } from '../context/TasksContext';
import { TaskCard } from '../components/Tasks/TaskCard';
import type { TaskWithTags, TaskStatus } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`archive-tabpanel-${index}`}
      aria-labelledby={`archive-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ArchivePage = () => {
  const { tasks, loading, error, filters, setFilters, updateTask, deleteTask, restoreTask } = useTasks();
  const [tabValue, setTabValue] = useState(0);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithTags | null>(null);

  // Load archived tasks
  useEffect(() => {
    setFilters({ ...filters, includeArchived: true });
    return () => {
      setFilters({ ...filters, includeArchived: false });
    };
  }, []);

  const archivedTasks = tasks.filter((task) => task.is_archived === 1);

  const handleRestore = (task: TaskWithTags) => {
    setSelectedTask(task);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (selectedTask) {
      try {
        await restoreTask(selectedTask.id);
        setRestoreDialogOpen(false);
        setSelectedTask(null);
      } catch (error) {
        console.error('Error restoring task:', error);
      }
    }
  };

  const handleHardDelete = (task: TaskWithTags) => {
    setSelectedTask(task);
    setHardDeleteDialogOpen(true);
  };

  const confirmHardDelete = async () => {
    if (selectedTask) {
      try {
        await deleteTask(selectedTask.id, false); // Hard delete
        setHardDeleteDialogOpen(false);
        setSelectedTask(null);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleStatusChange = async (task: TaskWithTags, status: TaskStatus) => {
    try {
      await updateTask(task.id, { status });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getTasksByStatus = (status?: TaskStatus) => {
    if (!status) return archivedTasks;
    return archivedTasks.filter((task) => task.status === status);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Архив задач</Typography>
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
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
            <Tab label={`Все (${archivedTasks.length})`} />
            <Tab label={`Выполнено (${getTasksByStatus('done').length})`} />
            <Tab label={`Отменено (${getTasksByStatus('canceled').length})`} />
            <Tab label={`Пропущено (${getTasksByStatus('skipped').length})`} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {archivedTasks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Архив пуст
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Архивированные задачи будут отображаться здесь
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {archivedTasks.map((task) => (
                  <Box key={task.id} sx={{ position: 'relative' }}>
                    <TaskCard
                      task={task}
                      onStatusChange={handleStatusChange}
                      onDelete={() => {}}
                      onDuplicate={() => {}}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 1,
                      }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RestoreIcon />}
                        onClick={() => handleRestore(task)}
                      >
                        Восстановить
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteForeverIcon />}
                        onClick={() => handleHardDelete(task)}
                      >
                        Удалить навсегда
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {getTasksByStatus('done').map((task) => (
                <Box key={task.id} sx={{ position: 'relative' }}>
                  <TaskCard
                    task={task}
                    onStatusChange={handleStatusChange}
                    onDelete={() => {}}
                    onDuplicate={() => {}}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      gap: 1,
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RestoreIcon />}
                      onClick={() => handleRestore(task)}
                    >
                      Восстановить
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteForeverIcon />}
                      onClick={() => handleHardDelete(task)}
                    >
                      Удалить навсегда
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {getTasksByStatus('canceled').map((task) => (
                <Box key={task.id} sx={{ position: 'relative' }}>
                  <TaskCard
                    task={task}
                    onStatusChange={handleStatusChange}
                    onDelete={() => {}}
                    onDuplicate={() => {}}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      gap: 1,
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RestoreIcon />}
                      onClick={() => handleRestore(task)}
                    >
                      Восстановить
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteForeverIcon />}
                      onClick={() => handleHardDelete(task)}
                    >
                      Удалить навсегда
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {getTasksByStatus('skipped').map((task) => (
                <Box key={task.id} sx={{ position: 'relative' }}>
                  <TaskCard
                    task={task}
                    onStatusChange={handleStatusChange}
                    onDelete={() => {}}
                    onDuplicate={() => {}}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      gap: 1,
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RestoreIcon />}
                      onClick={() => handleRestore(task)}
                    >
                      Восстановить
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteForeverIcon />}
                      onClick={() => handleHardDelete(task)}
                    >
                      Удалить навсегда
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </TabPanel>
        </>
      )}

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>Восстановить задачу?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Задача "{selectedTask?.title}" будет восстановлена из архива.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Отмена</Button>
          <Button onClick={confirmRestore} variant="contained" color="primary">
            Восстановить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hard Delete Confirmation Dialog */}
      <Dialog open={hardDeleteDialogOpen} onClose={() => setHardDeleteDialogOpen(false)}>
        <DialogTitle>Удалить задачу навсегда?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Задача "{selectedTask?.title}" будет удалена безвозвратно. Это действие нельзя отменить!
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHardDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={confirmHardDelete} variant="contained" color="error">
            Удалить навсегда
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

