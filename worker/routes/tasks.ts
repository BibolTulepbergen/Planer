import { Hono } from 'hono';
import { firebaseAuth } from '../middleware/firebaseAuth';
import { userContext } from '../middleware/userContext';
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
  TaskHistory,
  TaskRecurrence,
} from '../types';

const tasks = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply authentication and user context to all routes
tasks.use('*', firebaseAuth());
tasks.use('*', userContext());

/**
 * GET /tasks/list
 * Get list of tasks with filters
 */
tasks.get('/list', async (c) => {
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
      let recurrence = undefined;
      if (task.is_recurring) {
        recurrence = await db
          .prepare('SELECT * FROM task_recurrence WHERE task_id = ?')
          .bind(task.id)
          .first<TaskRecurrence>();
      }

      tasksWithTags.push({
        ...task,
        tags: tagsResult.results || [],
        recurrence: recurrence || undefined,
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
tasks.get('/:id', async (c) => {
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
    let recurrence = undefined;
    if (task.is_recurring) {
      recurrence = await db
        .prepare('SELECT * FROM task_recurrence WHERE task_id = ?')
        .bind(taskId)
        .first<TaskRecurrence>();
    }

    const taskWithTags: TaskWithTags = {
      ...task,
      tags: tagsResult.results || [],
      recurrence: recurrence || undefined,
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
tasks.post('/', async (c) => {
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
    let recurrence = undefined;
    if (body.recurrence) {
      const rec = body.recurrence;
      const daysOfWeekStr = rec.days_of_week ? rec.days_of_week.join(',') : null;
      
      recurrence = await db
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
      recurrence: recurrence || undefined,
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
tasks.patch('/:id', async (c) => {
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
tasks.delete('/:id', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const taskId = parseInt(c.req.param('id'));
  const soft = c.req.query('soft') !== 'false'; // Default to soft delete

  try {
    // Check if task exists and belongs to user
    const task = await db
      .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
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
      // Soft delete
      await db
        .prepare(
          `UPDATE tasks 
           SET is_archived = 1, deleted_at = datetime('now'), updated_at = datetime('now')
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
      await db.prepare('DELETE FROM tasks WHERE id = ?').bind(taskId).run();

      // Record deletion in history
      await db
        .prepare(
          `INSERT INTO task_history (task_id, user_id, action, changed_at)
           VALUES (?, ?, 'deleted', datetime('now'))`
        )
        .bind(taskId, user.id)
        .run();

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

/**
 * GET /tasks/:id/recurrence
 * Get recurrence rule for a task
 */
tasks.get('/:id/recurrence', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const taskId = parseInt(c.req.param('id'));

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

    if (!task.is_recurring) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Task is not recurring',
        },
        400
      );
    }

    const recurrence = await db
      .prepare('SELECT * FROM task_recurrence WHERE task_id = ?')
      .bind(taskId)
      .first();

    if (!recurrence) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Recurrence rule not found',
        },
        404
      );
    }

    return c.json<ApiResponse>({
      success: true,
      data: recurrence,
    });
  } catch (error) {
    console.error('Error fetching recurrence:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch recurrence',
      },
      500
    );
  }
});

/**
 * PATCH /tasks/:id/recurrence
 * Update recurrence rule for a task
 */
tasks.patch('/:id/recurrence', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const taskId = parseInt(c.req.param('id'));

  try {
    const body = await c.req.json();

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

    if (!task.is_recurring) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Task is not recurring',
        },
        400
      );
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (body.recurrence_type !== undefined) {
      updates.push('recurrence_type = ?');
      params.push(body.recurrence_type);
    }
    if (body.interval_value !== undefined) {
      updates.push('interval_value = ?');
      params.push(body.interval_value);
    }
    if (body.days_of_week !== undefined) {
      updates.push('days_of_week = ?');
      params.push(body.days_of_week ? body.days_of_week.join(',') : null);
    }
    if (body.day_of_month !== undefined) {
      updates.push('day_of_month = ?');
      params.push(body.day_of_month);
    }
    if (body.week_of_month !== undefined) {
      updates.push('week_of_month = ?');
      params.push(body.week_of_month);
    }
    if (body.month_of_year !== undefined) {
      updates.push('month_of_year = ?');
      params.push(body.month_of_year);
    }
    if (body.end_type !== undefined) {
      updates.push('end_type = ?');
      params.push(body.end_type);
    }
    if (body.end_date !== undefined) {
      updates.push('end_date = ?');
      params.push(body.end_date);
    }
    if (body.max_occurrences !== undefined) {
      updates.push('max_occurrences = ?');
      params.push(body.max_occurrences);
    }

    updates.push('updated_at = datetime(\'now\')');

    if (updates.length > 0) {
      params.push(taskId);
      const query = `UPDATE task_recurrence SET ${updates.join(', ')} WHERE task_id = ?`;
      await db.prepare(query).bind(...params).run();
    }

    // Fetch updated recurrence
    const recurrence = await db
      .prepare('SELECT * FROM task_recurrence WHERE task_id = ?')
      .bind(taskId)
      .first();

    return c.json<ApiResponse>({
      success: true,
      data: recurrence,
      message: 'Recurrence updated successfully',
    });
  } catch (error) {
    console.error('Error updating recurrence:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to update recurrence',
      },
      500
    );
  }
});

/**
 * DELETE /tasks/:id/recurrence
 * Delete recurrence rule for a task
 */
tasks.delete('/:id/recurrence', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const taskId = parseInt(c.req.param('id'));

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

    // Delete recurrence rule
    await db.prepare('DELETE FROM task_recurrence WHERE task_id = ?').bind(taskId).run();

    // Update task to mark as not recurring
    await db
      .prepare('UPDATE tasks SET is_recurring = 0, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(taskId)
      .run();

    return c.json<ApiResponse>({
      success: true,
      message: 'Recurrence deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting recurrence:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to delete recurrence',
      },
      500
    );
  }
});

/**
 * GET /tasks/:id/history
 * Get history of changes for a task
 */
tasks.get('/:id/history', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const taskId = parseInt(c.req.param('id'));

  try {
    // Check if task exists and belongs to user
    const task = await db
      .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
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

    // Get task history
    const history = await db
      .prepare(
        `SELECT * FROM task_history 
         WHERE task_id = ? 
         ORDER BY changed_at DESC`
      )
      .bind(taskId)
      .all<TaskHistory>();

    return c.json<ApiResponse<TaskHistory[]>>({
      success: true,
      data: history.results || [],
      count: history.results?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching task history:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch task history',
      },
      500
    );
  }
});

/**
 * POST /tasks/:id/restore
 * Restore archived task
 */
tasks.post('/:id/restore', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const taskId = parseInt(c.req.param('id'));

  try {
    // Check if task exists and belongs to user
    const task = await db
      .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
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

    // Restore task
    await db
      .prepare(
        `UPDATE tasks 
         SET is_archived = 0, deleted_at = NULL, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(taskId)
      .run();

    // Fetch restored task with tags
    const restoredTask = await db
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

    // Get recurrence if task is recurring
    let recurrence = undefined;
    if (restoredTask!.is_recurring) {
      recurrence = await db
        .prepare('SELECT * FROM task_recurrence WHERE task_id = ?')
        .bind(taskId)
        .first<TaskRecurrence>();
    }

    const taskWithTags: TaskWithTags = {
      ...restoredTask!,
      tags: tagsResult.results || [],
      recurrence: recurrence || undefined,
    };

    // Record restoration in history
    await db
      .prepare(
        `INSERT INTO task_history (task_id, user_id, action, changed_at)
         VALUES (?, ?, 'restored', datetime('now'))`
      )
      .bind(taskId, user.id)
      .run();

    return c.json<ApiResponse<TaskWithTags>>({
      success: true,
      data: taskWithTags,
      message: 'Task restored successfully',
    });
  } catch (error) {
    console.error('Error restoring task:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to restore task',
      },
      500
    );
  }
});

/**
 * POST /tasks/:id/duplicate
 * Duplicate a task
 */
tasks.post('/:id/duplicate', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const taskId = parseInt(c.req.param('id'));

  try {
    // Get the task to duplicate
    const originalTask = await db
      .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
      .bind(taskId, user.id)
      .first<Task>();

    if (!originalTask) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Task not found',
        },
        404
      );
    }

    // Get tags of the original task
    const tagsResult = await db
      .prepare(
        `SELECT tag_id FROM task_tags WHERE task_id = ?`
      )
      .bind(taskId)
      .all<{ tag_id: number }>();

    // Create a duplicate task
    const duplicatedTask = await db
      .prepare(
        `INSERT INTO tasks (user_id, title, description, start_datetime, deadline_datetime, priority, status, is_recurring, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         RETURNING *`
      )
      .bind(
        user.id,
        `${originalTask.title} (копия)`,
        originalTask.description,
        originalTask.start_datetime,
        originalTask.deadline_datetime,
        originalTask.priority,
        'planned', // Reset status to planned
        originalTask.is_recurring
      )
      .first<Task>();

    if (!duplicatedTask) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Failed to duplicate task',
        },
        500
      );
    }

    // Copy tags
    if (tagsResult.results && tagsResult.results.length > 0) {
      for (const { tag_id } of tagsResult.results) {
        await db
          .prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)')
          .bind(duplicatedTask.id, tag_id)
          .run();
      }
    }

    // Fetch duplicated task with tags
    const tags = await db
      .prepare(
        `SELECT tg.* FROM tags tg
         INNER JOIN task_tags tt ON tg.id = tt.tag_id
         WHERE tt.task_id = ?`
      )
      .bind(duplicatedTask.id)
      .all<Tag>();

    const taskWithTags: TaskWithTags = {
      ...duplicatedTask,
      tags: tags.results || [],
    };

    return c.json<ApiResponse<TaskWithTags>>(
      {
        success: true,
        data: taskWithTags,
        message: 'Task duplicated successfully',
      },
      201
    );
  } catch (error) {
    console.error('Error duplicating task:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to duplicate task',
      },
      500
    );
  }
});

export default tasks;

