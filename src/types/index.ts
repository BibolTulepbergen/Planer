// Frontend type definitions

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'planned' | 'in_progress' | 'done' | 'skipped' | 'canceled';

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  start_datetime: string | null;
  deadline_datetime: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  is_recurring: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TaskWithTags extends Task {
  tags: Tag[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  start_datetime?: string;
  deadline_datetime?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  tag_ids?: number[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  start_datetime?: string;
  deadline_datetime?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  tag_ids?: number[];
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

export type ViewMode = 'day' | 'week' | 'month' | 'calendar';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  tagId?: number;
  search?: string;
  from?: string;
  to?: string;
  includeArchived?: boolean;
}

