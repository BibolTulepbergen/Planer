import { Hono } from 'hono';
import type {
  Bindings,
  Variables,
  Task,
  TaskHistory,
  User,
  ApiResponse,
} from '../types';

const tasksHistory = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /tasks/:id/history
 * Get history of changes for a task
 */
tasksHistory.get('/:id/history', async (c) => {
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

export default tasksHistory;


