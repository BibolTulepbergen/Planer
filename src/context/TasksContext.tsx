import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {
  TaskWithTags,
  Tag,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateTagRequest,
  UpdateTagRequest,
  ViewMode,
  TaskFilters,
} from '../types';
import * as tasksApi from '../api/tasks';
import * as tagsApi from '../api/tags';

interface TasksContextType {
  // Tasks state
  tasks: TaskWithTags[];
  loading: boolean;
  error: string | null;

  // Tags state
  tags: Tag[];
  tagsLoading: boolean;

  // View state
  viewMode: ViewMode;
  selectedDate: Date;
  filters: TaskFilters;

  // Tasks actions
  loadTasks: () => Promise<void>;
  createTask: (data: CreateTaskRequest) => Promise<TaskWithTags>;
  updateTask: (id: number, data: UpdateTaskRequest) => Promise<TaskWithTags>;
  deleteTask: (id: number, soft?: boolean) => Promise<void>;
  duplicateTask: (id: number) => Promise<TaskWithTags>;
  restoreTask: (id: number) => Promise<TaskWithTags>;

  // Tags actions
  loadTags: () => Promise<void>;
  createTag: (data: CreateTagRequest) => Promise<Tag>;
  updateTag: (id: number, data: UpdateTagRequest) => Promise<Tag>;
  deleteTag: (id: number) => Promise<void>;

  // View actions
  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: Date) => void;
  setFilters: (filters: TaskFilters) => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within TasksProvider');
  }
  return context;
};

interface TasksProviderProps {
  children: ReactNode;
}

export const TasksProvider = ({ children }: TasksProviderProps) => {
  // Tasks state
  const [tasks, setTasks] = useState<TaskWithTags[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tags state
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState<TaskFilters>({});

  // Load tasks
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tasksApi.getTasks(filters);
      setTasks(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(message);
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Create task
  const createTask = useCallback(
    async (data: CreateTaskRequest): Promise<TaskWithTags> => {
      try {
        const newTask = await tasksApi.createTask(data);
        setTasks((prev) => [newTask, ...prev]);
        return newTask;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create task';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Update task
  const updateTask = useCallback(
    async (id: number, data: UpdateTaskRequest): Promise<TaskWithTags> => {
      try {
        const updatedTask = await tasksApi.updateTask(id, data);
        setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
        return updatedTask;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update task';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Delete task
  const deleteTask = useCallback(async (id: number, soft: boolean = true): Promise<void> => {
    try {
      await tasksApi.deleteTask(id, soft);
      if (soft) {
        // For soft delete, just reload tasks (they'll be filtered out if includeArchived is false)
        await loadTasks();
      } else {
        // For hard delete, remove from state immediately
        setTasks((prev) => prev.filter((task) => task.id !== id));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      setError(message);
      throw err;
    }
  }, [loadTasks]);

  // Duplicate task
  const duplicateTask = useCallback(
    async (id: number): Promise<TaskWithTags> => {
      try {
        const duplicatedTask = await tasksApi.duplicateTask(id);
        setTasks((prev) => [duplicatedTask, ...prev]);
        return duplicatedTask;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to duplicate task';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Restore task
  const restoreTask = useCallback(
    async (id: number): Promise<TaskWithTags> => {
      try {
        const restoredTask = await tasksApi.restoreTask(id);
        setTasks((prev) => prev.map((task) => (task.id === id ? restoredTask : task)));
        return restoredTask;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to restore task';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Load tags
  const loadTags = useCallback(async () => {
    setTagsLoading(true);
    try {
      const data = await tagsApi.getTags();
      setTags(data);
    } catch (err) {
      console.error('Error loading tags:', err);
    } finally {
      setTagsLoading(false);
    }
  }, []);

  // Create tag
  const createTag = useCallback(async (data: CreateTagRequest): Promise<Tag> => {
    try {
      const newTag = await tagsApi.createTag(data);
      setTags((prev) => [...prev, newTag]);
      return newTag;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create tag';
      throw new Error(message);
    }
  }, []);

  // Update tag
  const updateTag = useCallback(
    async (id: number, data: UpdateTagRequest): Promise<Tag> => {
      try {
        const updatedTag = await tagsApi.updateTag(id, data);
        setTags((prev) => prev.map((tag) => (tag.id === id ? updatedTag : tag)));
        return updatedTag;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update tag';
        throw new Error(message);
      }
    },
    []
  );

  // Delete tag
  const deleteTag = useCallback(async (id: number): Promise<void> => {
    try {
      await tagsApi.deleteTag(id);
      setTags((prev) => prev.filter((tag) => tag.id !== id));
      // Reload tasks to update their tags
      await loadTasks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete tag';
      throw new Error(message);
    }
  }, [loadTasks]);

  // Load initial data
  useEffect(() => {
    loadTasks();
    loadTags();
  }, [loadTasks, loadTags]);

  const value: TasksContextType = {
    tasks,
    loading,
    error,
    tags,
    tagsLoading,
    viewMode,
    selectedDate,
    filters,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    restoreTask,
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    setViewMode,
    setSelectedDate,
    setFilters,
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
};

