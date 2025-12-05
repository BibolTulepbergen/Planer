import { Hono } from 'hono';
import type {
  Bindings,
  Variables,
  User,
  Task,
  Tag,
  TaskRecurrence,
  TaskWithTags,
  TaskShareAccess,
  ApiResponse,
} from '../types';

const tasksShare = new Hono<{ Bindings: Bindings; Variables: Variables }>();

interface ShareTaskRequest {
  email: string;
  access: TaskShareAccess;
}

/**
 * POST /tasks/:id/share
 * Share task with another user by email
 */
tasksShare.post('/:id/share', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const taskId = parseInt(c.req.param('id'));

  try {
    const body = await c.req.json<ShareTaskRequest>();
    const email = body.email?.trim().toLowerCase();
    const access = body.access;

    if (!email) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Email is required',
        },
        400
      );
    }

    if (access !== 'view' && access !== 'edit') {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Invalid access level',
        },
        400
      );
    }

    // Check that task exists and belongs to current user (owner)
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

    // Find target user by email
    const targetUser = await db
      .prepare('SELECT * FROM users WHERE LOWER(email) = ?')
      .bind(email)
      .first<User>();

    if (!targetUser) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'User with this email not found',
        },
        404
      );
    }

    if (targetUser.id === user.id) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'You cannot share task with yourself',
        },
        400
      );
    }

    // Upsert share record
    await db
      .prepare(
        `INSERT INTO task_shares (task_id, owner_user_id, shared_user_id, access_level, created_at, updated_at, removed_at)
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), NULL)
         ON CONFLICT(task_id, shared_user_id) DO UPDATE SET
           access_level = excluded.access_level,
           updated_at = datetime('now'),
           removed_at = NULL`
      )
      .bind(taskId, user.id, targetUser.id, access)
      .run();

    return c.json<ApiResponse>({
      success: true,
      message: 'Task shared successfully',
    });
  } catch (error) {
    console.error('Error sharing task:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to share task',
      },
      500
    );
  }
});

/**
 * GET /tasks/shared-list
 * Get list of tasks shared with current user
 */
tasksShare.get('/shared-list', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;

  try {
    const query = `
      SELECT t.*, ts.access_level as share_access
      FROM tasks t
      INNER JOIN task_shares ts ON t.id = ts.task_id
      WHERE ts.shared_user_id = ? 
        AND ts.removed_at IS NULL
        AND t.deleted_at IS NULL
      ORDER BY t.start_datetime ASC, t.created_at DESC
    `;

    const result = await db.prepare(query).bind(user.id).all<
      Task & { share_access: TaskShareAccess }
    >();

    const tasksWithTags: TaskWithTags[] = [];

    for (const row of result.results || []) {
      const tagsResult = await db
        .prepare(
          `SELECT tg.* FROM tags tg
           INNER JOIN task_tags tt ON tg.id = tt.tag_id
           WHERE tt.task_id = ?`
        )
        .bind(row.id)
        .all<Tag>();

      let recurrence: TaskRecurrence | undefined = undefined;
      if (row.is_recurring) {
        const recurrenceData = await db
          .prepare('SELECT * FROM task_recurrence WHERE task_id = ?')
          .bind(row.id)
          .first<TaskRecurrence>();
        if (recurrenceData) {
          recurrence = recurrenceData;
        }
      }

      tasksWithTags.push({
        ...(row as Task),
        tags: tagsResult.results || [],
        recurrence,
        share_access: row.share_access,
        is_shared: true,
      });
    }

    return c.json<ApiResponse<TaskWithTags[]>>({
      success: true,
      data: tasksWithTags,
      count: tasksWithTags.length,
    });
  } catch (error) {
    console.error('Error fetching shared tasks:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch shared tasks',
      },
      500
    );
  }
});

/**
 * DELETE /tasks/shared/:id
 * Remove shared task from current user's list (does not delete original task)
 */
tasksShare.delete('/shared/:id', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const taskId = parseInt(c.req.param('id'));

  try {
    // Mark share as removed for current user
    const result = await db
      .prepare(
        `UPDATE task_shares
         SET removed_at = datetime('now'), updated_at = datetime('now')
         WHERE task_id = ? AND shared_user_id = ? AND removed_at IS NULL`
      )
      .bind(taskId, user.id)
      .run();

    const changes = result.meta?.changes ?? 0;

    if (!result.success || changes === 0) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Shared task not found',
        },
        404
      );
    }

    return c.json<ApiResponse>({
      success: true,
      message: 'Shared task removed from your list',
    });
  } catch (error) {
    console.error('Error removing shared task:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to remove shared task',
      },
      500
    );
  }
});

export default tasksShare;


