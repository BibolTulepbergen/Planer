import { Hono } from 'hono';
import type {
  Bindings,
  Variables,
  Task,
  TaskWithTags,
  Tag,
  TaskRecurrence,
  User,
  ApiResponse,
} from '../types';

const tasksExtra = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * POST /tasks/:id/restore
 * Restore archived task
 */
tasksExtra.post('/:id/restore', async (c) => {
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
    let recurrence: TaskRecurrence | undefined = undefined;
    if (restoredTask!.is_recurring) {
      const recurrenceData = await db
        .prepare('SELECT * FROM task_recurrence WHERE task_id = ?')
        .bind(taskId)
        .first<TaskRecurrence>();
      if (recurrenceData) {
        recurrence = recurrenceData;
      }
    }

    const taskWithTags: TaskWithTags = {
      ...restoredTask!,
      tags: tagsResult.results || [],
      recurrence,
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
tasksExtra.post('/:id/duplicate', async (c) => {
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

export default tasksExtra;


