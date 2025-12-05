import { Hono } from 'hono';
import type {
  Bindings,
  Variables,
  Task,
  TaskWithTags,
  Tag,
  CreateTaskRequest,
  UpdateTaskRequest,
  User,
  ApiResponse,
  TaskRecurrence,
} from '../types';

const tasksBase = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /tasks/list
 * Get list of tasks with filters
 */
tasksBase.get('/list', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;

  // Query parameters
  const status = c.req.query('status');
  const priority = c.req.query('priority');
  const tagId = c.req.query('tagId');
  const search = c.req.query('search');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const includeArchived = c.req.query('includeArchived') === 'true';

  try {
    // Build query
    let query = 'SELECT DISTINCT t.* FROM tasks t';
    const conditions: string[] = ['t.user_id = ?'];
    const params: any[] = [user.id];

    // Join with task_tags if filtering by tag
    if (tagId) {
      query += ' LEFT JOIN task_tags tt ON t.id = tt.task_id';
      conditions.push('tt.tag_id = ?');
      params.push(parseInt(tagId));
    }

    // Add filters
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    if (priority) {
      conditions.push('t.priority = ?');
      params.push(priority);
    }

    if (search) {
      conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (from) {
      conditions.push('t.start_datetime >= ?');
      params.push(from);
    }

    if (to) {
      conditions.push('t.start_datetime <= ?');
      params.push(to);
    }

    if (!includeArchived) {
      conditions.push('t.is_archived = 0');
    }

    conditions.push('t.deleted_at IS NULL');

    // Combine query
    query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY t.start_datetime ASC, t.created_at DESC';

    const result = await db.prepare(query).bind(...params).all<Task>();

    // Get tags and recurrence for each task
    const tasksWithTags: TaskWithTags[] = [];

    for (const task of result.results || []) {
      const tagsResult = await db
        .prepare(
          `SELECT tg.* FROM tags tg
           INNER JOIN task_tags tt ON tg.id = tt.tag_id
           WHERE tt.task_id = ?`
        )
        .bind(task.id)
        .all<Tag>();

      // Get recurrence if task is recurring
      let recurrence: TaskRecurrence | undefined = undefined;
      if (task.is_recurring) {
        const recurrenceData = await db
          .prepare('SELECT * FROM task_recurrence WHERE task_id = ?')
          .bind(task.id)
          .first<TaskRecurrence>();
        if (recurrenceData) {
          recurrence = recurrenceData;
        }
      }

      tasksWithTags.push({
        ...task,
        tags: tagsResult.results || [],
        recurrence,
      });
    }

    return c.json<ApiResponse<TaskWithTags[]>>({
      success: true,
      data: tasksWithTags,
      count: tasksWithTags.length,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch tasks',
      },
      500
    );
  }
});

/**
 * GET /tasks/:id
 * Get single task by ID
 */
tasksBase.get('/:id', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const taskId = parseInt(c.req.param('id'));

  try {
    const task = await db
      .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
      .bind(taskId, user.id)
      .first<Task>();

    if (!task) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Task not found',
        },
        404
      );
    }

    // Get tags
    const tagsResult = await db
      .prepare(
        `SELECT tg.* FROM tags tg
         INNER JOIN task_tags tt ON tg.id = tt.tag_id
         WHERE tt.task_id = ?`
      )
      .bind(taskId)
      .all<Tag>();

    // Get recurrence if task is recurring
    let recurrence: TaskRecurrence | undefined = undefined;
    if (task.is_recurring) {
      const recurrenceData = await db
        .prepare('SELECT * FROM task_recurrence WHERE task_id = ?')
        .bind(taskId)
        .first<TaskRecurrence>();
      if (recurrenceData) {
        recurrence = recurrenceData;
      }
    }

    const taskWithTags: TaskWithTags = {
      ...task,
      tags: tagsResult.results || [],
      recurrence,
    };

    return c.json<ApiResponse<TaskWithTags>>({
      success: true,
      data: taskWithTags,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch task',
      },
      500
    );
  }
});

/**
 * POST /tasks
 * Create new task
 */
tasksBase.post('/', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;

  try {
    const body = await c.req.json<CreateTaskRequest>();

    if (!body.title || body.title.trim() === '') {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Title is required',
        },
        400
      );
    }

    // Create task
    const isRecurring = body.recurrence ? 1 : 0;
    const task = await db
      .prepare(
        `INSERT INTO tasks (user_id, title, description, start_datetime, deadline_datetime, priority, status, is_recurring, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         RETURNING *`
      )
      .bind(
        user.id,
        body.title.trim(),
        body.description || null,
        body.start_datetime || null,
        body.deadline_datetime || null,
        body.priority || 'medium',
        body.status || 'planned',
        isRecurring
      )
      .first<Task>();

    if (!task) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Failed to create task',
        },
        500
      );
    }

    // Add tags if provided
    if (body.tag_ids && body.tag_ids.length > 0) {
      for (const tagId of body.tag_ids) {
        await db
          .prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)')
          .bind(task.id, tagId)
          .run();
      }
    }

    // Add recurrence if provided
    let recurrence: TaskRecurrence | undefined = undefined;
    if (body.recurrence) {
      const rec = body.recurrence;
      const daysOfWeekStr = rec.days_of_week ? rec.days_of_week.join(',') : null;

      const recurrenceData = await db
        .prepare(
          `INSERT INTO task_recurrence (
            task_id, recurrence_type, interval_value, days_of_week, 
            day_of_month, week_of_month, month_of_year, 
            end_type, end_date, max_occurrences, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          RETURNING *`
        )
        .bind(
          task.id,
          rec.recurrence_type,
          rec.interval_value || 1,
          daysOfWeekStr,
          rec.day_of_month || null,
          rec.week_of_month || null,
          rec.month_of_year || null,
          rec.end_type || 'never',
          rec.end_date || null,
          rec.max_occurrences || null
        )
        .first<TaskRecurrence>();
      if (recurrenceData) {
        recurrence = recurrenceData;
      }
    }

    // Fetch task with tags
    const tagsResult = await db
      .prepare(
        `SELECT tg.* FROM tags tg
         INNER JOIN task_tags tt ON tg.id = tt.tag_id
         WHERE tt.task_id = ?`
      )
      .bind(task.id)
      .all<Tag>();

    const taskWithTags: TaskWithTags = {
      ...task,
      tags: tagsResult.results || [],
      recurrence,
    };

    // Record task creation in history
    await db
      .prepare(
        `INSERT INTO task_history (task_id, user_id, action, changed_at)
         VALUES (?, ?, 'created', datetime('now'))`
      )
      .bind(task.id, user.id)
      .run();

    return c.json<ApiResponse<TaskWithTags>>(
      {
        success: true,
        data: taskWithTags,
        message: 'Task created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Error creating task:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to create task',
      },
      500
    );
  }
});

/**
 * PATCH /tasks/:id
 * Update task
 */
tasksBase.patch('/:id', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const taskId = parseInt(c.req.param('id'));

  try {
    const body = await c.req.json<UpdateTaskRequest>();

    // Check if task exists and belongs to user
    const existingTask = await db
      .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
      .bind(taskId, user.id)
      .first<Task>();

    if (!existingTask) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Task not found',
        },
        404
      );
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      params.push(body.title.trim());
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      params.push(body.description || null);
    }
    if (body.start_datetime !== undefined) {
      updates.push('start_datetime = ?');
      params.push(body.start_datetime || null);
    }
    if (body.deadline_datetime !== undefined) {
      updates.push('deadline_datetime = ?');
      params.push(body.deadline_datetime || null);
    }
    if (body.priority !== undefined) {
      updates.push('priority = ?');
      params.push(body.priority);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      params.push(body.status);

      // Record status change in history
      await db
        .prepare(
          `INSERT INTO task_history (task_id, user_id, action, field_name, old_value, new_value, changed_at)
           VALUES (?, ?, 'status_changed', 'status', ?, ?, datetime('now'))`
        )
        .bind(taskId, user.id, existingTask.status, body.status)
        .run();
    }

    updates.push('updated_at = datetime(\'now\')');

    if (updates.length > 0) {
      params.push(taskId, user.id);
      const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
      await db.prepare(query).bind(...params).run();

      // Record update in history (for non-status fields)
      if (body.status === undefined) {
        await db
          .prepare(
            `INSERT INTO task_history (task_id, user_id, action, changed_at)
             VALUES (?, ?, 'updated', datetime('now'))`
          )
          .bind(taskId, user.id)
          .run();
      }
    }

    // Update tags if provided
    if (body.tag_ids !== undefined) {
      // Remove existing tags
      await db.prepare('DELETE FROM task_tags WHERE task_id = ?').bind(taskId).run();

      // Add new tags
      for (const tagId of body.tag_ids) {
        await db
          .prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)')
          .bind(taskId, tagId)
          .run();
      }
    }

    // Fetch updated task with tags
    const task = await db
      .prepare('SELECT * FROM tasks WHERE id = ?')
      .bind(taskId)
      .first<Task>();

    const tagsResult = await db
      .prepare(
        `SELECT tg.* FROM tags tg
         INNER JOIN task_tags tt ON tg.id = tt.tag_id
         WHERE tt.task_id = ?`
      )
      .bind(taskId)
      .all<Tag>();

    const taskWithTags: TaskWithTags = {
      ...task!,
      tags: tagsResult.results || [],
    };

    return c.json<ApiResponse<TaskWithTags>>({
      success: true,
      data: taskWithTags,
      message: 'Task updated successfully',
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to update task',
      },
      500
    );
  }
});

/**
 * DELETE /tasks/:id
 * Delete task (soft or hard)
 */
tasksBase.delete('/:id', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const taskId = parseInt(c.req.param('id'));
  const soft = c.req.query('soft') !== 'false'; // Default to soft delete

  try {
    // Check if task exists and belongs to user
    const task = await db
      .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
      .bind(taskId, user.id)
      .first<Task>();

    if (!task) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Task not found',
        },
        404
      );
    }

    if (soft) {
      // Soft delete (archive)
      await db
        .prepare(
          `UPDATE tasks 
           SET is_archived = 1, updated_at = datetime('now')
           WHERE id = ?`
        )
        .bind(taskId)
        .run();

      // Record archive in history
      await db
        .prepare(
          `INSERT INTO task_history (task_id, user_id, action, changed_at)
           VALUES (?, ?, 'archived', datetime('now'))`
        )
        .bind(taskId, user.id)
        .run();

      return c.json<ApiResponse>({
        success: true,
        message: 'Task archived successfully',
      });
    } else {
      // Hard delete
      // Record deletion in history BEFORE deleting the task
      await db
        .prepare(
          `INSERT INTO task_history (task_id, user_id, action, changed_at)
           VALUES (?, ?, 'deleted', datetime('now'))`
        )
        .bind(taskId, user.id)
        .run();

      // Now delete the task (this will cascade delete the history record we just created)
      await db.prepare('DELETE FROM tasks WHERE id = ?').bind(taskId).run();

      return c.json<ApiResponse>({
        success: true,
        message: 'Task deleted permanently',
      });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to delete task',
      },
      500
    );
  }
});

export default tasksBase;


