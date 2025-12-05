import { Hono } from 'hono';
import type {
  Bindings,
  Variables,
  Task,
  User,
  ApiResponse,
} from '../types';

const tasksRecurrence = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /tasks/:id/recurrence
 * Get recurrence rule for a task
 */
tasksRecurrence.get('/:id/recurrence', async (c) => {
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
tasksRecurrence.patch('/:id/recurrence', async (c) => {
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
tasksRecurrence.delete('/:id/recurrence', async (c) => {
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

export default tasksRecurrence;


