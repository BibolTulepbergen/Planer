import type { Bindings, Task, TaskRecurrence } from '../types';

/**
 * Generate recurring task instances
 * This function is called by the scheduled worker
 */
export async function generateRecurringTasks(db: D1Database): Promise<void> {
  console.log('Starting recurring tasks generation...');

  try {
    // Get all active recurring tasks with their recurrence rules
    const recurringTasks = await db
      .prepare(
        `SELECT t.*, tr.*
         FROM tasks t
         INNER JOIN task_recurrence tr ON t.id = tr.task_id
         WHERE t.is_recurring = 1 
         AND t.deleted_at IS NULL
         AND t.is_archived = 0`
      )
      .all<Task & TaskRecurrence>();

    if (!recurringTasks.results || recurringTasks.results.length === 0) {
      console.log('No recurring tasks found');
      return;
    }

    console.log(`Found ${recurringTasks.results.length} recurring tasks`);

    const now = new Date();

    for (const taskData of recurringTasks.results) {
      try {
        // Check if we should generate a new instance
        const shouldGenerate = await shouldGenerateInstance(taskData, now);

        if (shouldGenerate) {
          await createTaskInstance(db, taskData, now);
        }
      } catch (error) {
        console.error(`Error processing task ${taskData.id}:`, error);
      }
    }

    console.log('Recurring tasks generation completed');
  } catch (error) {
    console.error('Error in generateRecurringTasks:', error);
    throw error;
  }
}

/**
 * Check if we should generate a new instance for this recurring task
 */
async function shouldGenerateInstance(
  taskData: Task & TaskRecurrence,
  now: Date
): Promise<boolean> {
  // Check if recurrence has ended
  if (taskData.end_type === 'date' && taskData.end_date) {
    const endDate = new Date(taskData.end_date);
    if (now > endDate) {
      console.log(`Task ${taskData.id} recurrence has ended (date)`);
      return false;
    }
  }

  if (taskData.end_type === 'count' && taskData.max_occurrences) {
    if (taskData.current_count >= taskData.max_occurrences) {
      console.log(`Task ${taskData.id} recurrence has ended (count)`);
      return false;
    }
  }

  // Check if we need to generate based on last generation
  if (!taskData.last_generated) {
    return true; // First time generation
  }

  const lastGenerated = new Date(taskData.last_generated);
  const nextGenerationDate = calculateNextGenerationDate(taskData, lastGenerated);

  return now >= nextGenerationDate;
}

/**
 * Calculate the next generation date based on recurrence rules
 */
function calculateNextGenerationDate(
  taskData: Task & TaskRecurrence,
  lastGenerated: Date
): Date {
  const next = new Date(lastGenerated);

  switch (taskData.recurrence_type) {
    case 'daily':
      next.setDate(next.getDate() + (taskData.interval_value || 1));
      break;

    case 'weekly':
      next.setDate(next.getDate() + (taskData.interval_value || 1) * 7);
      break;

    case 'monthly':
      next.setMonth(next.getMonth() + (taskData.interval_value || 1));
      break;

    case 'yearly':
      next.setFullYear(next.getFullYear() + (taskData.interval_value || 1));
      break;

    case 'custom':
      // For custom, use interval_value as hours
      next.setHours(next.getHours() + (taskData.interval_value || 1));
      break;

    default:
      next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * Create a new instance of a recurring task
 */
async function createTaskInstance(
  db: D1Database,
  taskData: Task & TaskRecurrence,
  now: Date
): Promise<void> {
  console.log(`Creating instance for task ${taskData.id}`);

  try {
    // Calculate the start_datetime for the new instance
    let newStartDatetime = null;
    if (taskData.start_datetime) {
      const originalStart = new Date(taskData.start_datetime);
      const lastGen = taskData.last_generated ? new Date(taskData.last_generated) : originalStart;
      const nextDate = calculateNextGenerationDate(taskData, lastGen);
      
      // Keep the same time of day as the original task
      nextDate.setHours(originalStart.getHours());
      nextDate.setMinutes(originalStart.getMinutes());
      nextDate.setSeconds(originalStart.getSeconds());
      
      newStartDatetime = nextDate.toISOString();
    }

    // Calculate deadline if original task had one
    let newDeadline = null;
    if (taskData.deadline_datetime && taskData.start_datetime) {
      const originalStart = new Date(taskData.start_datetime);
      const originalDeadline = new Date(taskData.deadline_datetime);
      const deadlineDiff = originalDeadline.getTime() - originalStart.getTime();
      
      if (newStartDatetime) {
        const newDeadlineDate = new Date(new Date(newStartDatetime).getTime() + deadlineDiff);
        newDeadline = newDeadlineDate.toISOString();
      }
    }

    // Create the new task instance
    const newTask = await db
      .prepare(
        `INSERT INTO tasks (
          user_id, title, description, start_datetime, deadline_datetime,
          priority, status, is_recurring, parent_task_id, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, datetime('now'), datetime('now'))
        RETURNING *`
      )
      .bind(
        taskData.user_id,
        taskData.title,
        taskData.description,
        newStartDatetime,
        newDeadline,
        taskData.priority,
        'planned', // Always create with planned status
        taskData.id // Link to parent recurring task
      )
      .first<Task>();

    if (newTask) {
      // Copy tags from parent task
      const tags = await db
        .prepare('SELECT tag_id FROM task_tags WHERE task_id = ?')
        .bind(taskData.id)
        .all<{ tag_id: number }>();

      if (tags.results && tags.results.length > 0) {
        for (const { tag_id } of tags.results) {
          await db
            .prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)')
            .bind(newTask.id, tag_id)
            .run();
        }
      }

      // Update recurrence record
      await db
        .prepare(
          `UPDATE task_recurrence 
           SET current_count = current_count + 1,
               last_generated = datetime('now'),
               updated_at = datetime('now')
           WHERE task_id = ?`
        )
        .bind(taskData.id)
        .run();

      console.log(`Created task instance ${newTask.id} from parent ${taskData.id}`);
    }
  } catch (error) {
    console.error(`Error creating task instance:`, error);
    throw error;
  }
}

