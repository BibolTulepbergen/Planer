import { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useTasks } from '../context/TasksContext';
import type { TaskStatus, TaskPriority } from '../types';

export const SettingsPage = () => {
  const { tasks } = useTasks();

  // Calculate statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const planned = tasks.filter((t) => t.status === 'planned').length;
    const canceled = tasks.filter((t) => t.status === 'canceled').length;
    const skipped = tasks.filter((t) => t.status === 'skipped').length;

    // Priority stats
    const highPriority = tasks.filter((t) => t.priority === 'high' || t.priority === 'critical').length;
    const mediumPriority = tasks.filter((t) => t.priority === 'medium').length;
    const lowPriority = tasks.filter((t) => t.priority === 'low').length;

    // Completion rate
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Tasks with deadlines
    const now = new Date();
    const overdue = tasks.filter((t) => {
      if (!t.deadline_datetime || t.status === 'done') return false;
      return new Date(t.deadline_datetime) < now;
    }).length;

    const upcomingDeadlines = tasks.filter((t) => {
      if (!t.deadline_datetime || t.status === 'done') return false;
      const deadline = new Date(t.deadline_datetime);
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      return deadline >= now && deadline <= threeDaysFromNow;
    }).length;

    // Recurring tasks
    const recurring = tasks.filter((t) => t.is_recurring).length;

    // This week stats
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const thisWeekCompleted = tasks.filter((t) => {
      if (t.status !== 'done' || !t.updated_at) return false;
      const updated = new Date(t.updated_at);
      return updated >= weekStart && updated < weekEnd;
    }).length;

    return {
      total,
      completed,
      inProgress,
      planned,
      canceled,
      skipped,
      highPriority,
      mediumPriority,
      lowPriority,
      completionRate,
      overdue,
      upcomingDeadlines,
      recurring,
      thisWeekCompleted,
    };
  }, [tasks]);

  const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle,
  }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color, mr: 2 }}>{icon}</Box>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Статистика
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Main Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Всего задач"
            value={stats.total}
            icon={<TrendingUpIcon fontSize="large" />}
            color="primary.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Выполнено"
            value={stats.completed}
            icon={<CheckCircleIcon fontSize="large" />}
            color="success.main"
            subtitle={`${stats.completionRate.toFixed(1)}% от всех задач`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="В процессе"
            value={stats.inProgress}
            icon={<ScheduleIcon fontSize="large" />}
            color="info.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Отменено"
            value={stats.canceled + stats.skipped}
            icon={<CancelIcon fontSize="large" />}
            color="error.main"
          />
        </Grid>

        {/* Completion Rate */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Процент выполнения
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LinearProgress
                variant="determinate"
                value={stats.completionRate}
                sx={{ flex: 1, height: 10, borderRadius: 5 }}
              />
              <Typography variant="h6" color="primary">
                {stats.completionRate.toFixed(1)}%
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {stats.completed} из {stats.total} задач выполнены
            </Typography>
          </Paper>
        </Grid>

        {/* Priority Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Задачи по приоритету
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip label="Высокий / Критический" color="error" size="small" />
                <Typography variant="h6">{stats.highPriority}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip label="Средний" color="warning" size="small" />
                <Typography variant="h6">{stats.mediumPriority}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip label="Низкий" color="success" size="small" />
                <Typography variant="h6">{stats.lowPriority}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Status Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Задачи по статусу
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip label="Запланировано" color="default" size="small" />
                <Typography variant="h6">{stats.planned}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip label="В процессе" color="info" size="small" />
                <Typography variant="h6">{stats.inProgress}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip label="Выполнено" color="success" size="small" />
                <Typography variant="h6">{stats.completed}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip label="Пропущено / Отменено" color="error" size="small" />
                <Typography variant="h6">{stats.skipped + stats.canceled}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Deadlines & Other */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Дополнительная информация
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {stats.overdue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Просроченных задач
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {stats.upcomingDeadlines}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Дедлайн в ближайшие 3 дня
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main">
                    {stats.recurring}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Повторяющихся задач
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {stats.thisWeekCompleted}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Выполнено на этой неделе
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

