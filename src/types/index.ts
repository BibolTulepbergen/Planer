// Frontend type definitions

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'planned' | 'in_progress' | 'done' | 'skipped' | 'canceled';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type RecurrenceEndType = 'never' | 'date' | 'count';
export type TaskShareAccess = 'view' | 'edit';

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
  parent_task_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TaskRecurrence {
  id: number;
  task_id: number;
  recurrence_type: RecurrenceType;
  interval_value: number;
  days_of_week: string | null; // Comma-separated: "1,2,3" (1=Monday)
  day_of_month: number | null;
  week_of_month: number | null;
  month_of_year: number | null;
  end_type: RecurrenceEndType;
  end_date: string | null;
  max_occurrences: number | null;
  current_count: number;
  last_generated: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskHistoryAction = 'created' | 'updated' | 'deleted' | 'restored' | 'status_changed' | 'archived';

export interface TaskHistory {
  id: number;
  task_id: number;
  user_id: number;
  action: TaskHistoryAction;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

export interface TaskWithTags extends Task {
  tags: Tag[];
  recurrence?: TaskRecurrence;
  share_access?: TaskShareAccess;
  is_shared?: boolean;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  start_datetime?: string;
  deadline_datetime?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  tag_ids?: number[];
  recurrence?: CreateRecurrenceRequest;
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

export interface CreateRecurrenceRequest {
  recurrence_type: RecurrenceType;
  interval_value?: number;
  days_of_week?: number[]; // Array of day numbers: [1, 2, 3] (1=Monday)
  day_of_month?: number;
  week_of_month?: number;
  month_of_year?: number;
  end_type?: RecurrenceEndType;
  end_date?: string;
  max_occurrences?: number;
}

export interface UpdateRecurrenceRequest {
  recurrence_type?: RecurrenceType;
  interval_value?: number;
  days_of_week?: number[];
  day_of_month?: number;
  week_of_month?: number;
  month_of_year?: number;
  end_type?: RecurrenceEndType;
  end_date?: string;
  max_occurrences?: number;
}

export interface ShareTaskRequest {
  email: string;
  access: TaskShareAccess;
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

