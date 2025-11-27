import { api } from '../utils/api';
import type {
  TaskWithTags,
  CreateTaskRequest,
  UpdateTaskRequest,
  ApiResponse,
  TaskFilters,
} from '../types';

/**
 * Get list of tasks with filters
 */
export const getTasks = async (filters?: TaskFilters): Promise<TaskWithTags[]> => {
  const params = new URLSearchParams();

  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.tagId) params.append('tagId', filters.tagId.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);
  if (filters?.includeArchived) params.append('includeArchived', 'true');

  const queryString = params.toString();
  const endpoint = `/tasks/list${queryString ? `?${queryString}` : ''}`;

  const response = await api.get<ApiResponse<TaskWithTags[]>>(endpoint);
  return response.data || [];
};

/**
 * Get single task by ID
 */
export const getTask = async (id: number): Promise<TaskWithTags> => {
  const response = await api.get<ApiResponse<TaskWithTags>>(`/tasks/${id}`);
  if (!response.data) {
    throw new Error('Task not found');
  }
  return response.data;
};

/**
 * Create new task
 */
export const createTask = async (data: CreateTaskRequest): Promise<TaskWithTags> => {
  const response = await api.post<ApiResponse<TaskWithTags>>('/tasks', data);
  if (!response.data) {
    throw new Error('Failed to create task');
  }
  return response.data;
};

/**
 * Update task
 */
export const updateTask = async (
  id: number,
  data: UpdateTaskRequest
): Promise<TaskWithTags> => {
  const response = await api.patch<ApiResponse<TaskWithTags>>(`/tasks/${id}`, data);
  if (!response.data) {
    throw new Error('Failed to update task');
  }
  return response.data;
};

/**
 * Delete task (soft or hard)
 */
export const deleteTask = async (id: number, soft: boolean = true): Promise<void> => {
  await api.delete<ApiResponse>(`/tasks/${id}?soft=${soft}`);
};

/**
 * Duplicate task
 */
export const duplicateTask = async (id: number): Promise<TaskWithTags> => {
  const response = await api.post<ApiResponse<TaskWithTags>>(`/tasks/${id}/duplicate`, {});
  if (!response.data) {
    throw new Error('Failed to duplicate task');
  }
  return response.data;
};

/**
 * Restore archived task
 */
export const restoreTask = async (id: number): Promise<TaskWithTags> => {
  const response = await api.post<ApiResponse<TaskWithTags>>(`/tasks/${id}/restore`, {});
  if (!response.data) {
    throw new Error('Failed to restore task');
  }
  return response.data;
};

