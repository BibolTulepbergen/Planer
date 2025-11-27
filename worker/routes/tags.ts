import { Hono } from 'hono';
import { firebaseAuth } from '../middleware/firebaseAuth';
import { userContext } from '../middleware/userContext';
import type {
  Bindings,
  Variables,
  Tag,
  CreateTagRequest,
  UpdateTagRequest,
  User,
  ApiResponse,
} from '../types';

const tags = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply authentication and user context to all routes
tags.use('*', firebaseAuth());
tags.use('*', userContext());

/**
 * GET /tags
 * Get all tags for current user
 */
tags.get('/', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;

  try {
    const result = await db
      .prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC')
      .bind(user.id)
      .all<Tag>();

    return c.json<ApiResponse<Tag[]>>({
      success: true,
      data: result.results || [],
      count: result.results?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch tags',
      },
      500
    );
  }
});

/**
 * GET /tags/:id
 * Get single tag by ID
 */
tags.get('/:id', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const tagId = parseInt(c.req.param('id'));

  try {
    const tag = await db
      .prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?')
      .bind(tagId, user.id)
      .first<Tag>();

    if (!tag) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Tag not found',
        },
        404
      );
    }

    return c.json<ApiResponse<Tag>>({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error('Error fetching tag:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch tag',
      },
      500
    );
  }
});

/**
 * POST /tags
 * Create new tag
 */
tags.post('/', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;

  try {
    const body = await c.req.json<CreateTagRequest>();

    if (!body.name || body.name.trim() === '') {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Tag name is required',
        },
        400
      );
    }

    // Check if tag with same name already exists for this user
    const existing = await db
      .prepare('SELECT * FROM tags WHERE user_id = ? AND name = ?')
      .bind(user.id, body.name.trim())
      .first<Tag>();

    if (existing) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Tag with this name already exists',
        },
        409
      );
    }

    // Create tag
    const tag = await db
      .prepare(
        `INSERT INTO tags (user_id, name, color, created_at)
         VALUES (?, ?, ?, datetime('now'))
         RETURNING *`
      )
      .bind(user.id, body.name.trim(), body.color || '#1976d2')
      .first<Tag>();

    if (!tag) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Failed to create tag',
        },
        500
      );
    }

    return c.json<ApiResponse<Tag>>(
      {
        success: true,
        data: tag,
        message: 'Tag created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Error creating tag:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to create tag',
      },
      500
    );
  }
});

/**
 * PATCH /tags/:id
 * Update tag
 */
tags.patch('/:id', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const tagId = parseInt(c.req.param('id'));

  try {
    const body = await c.req.json<UpdateTagRequest>();

    // Check if tag exists and belongs to user
    const existingTag = await db
      .prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?')
      .bind(tagId, user.id)
      .first<Tag>();

    if (!existingTag) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Tag not found',
        },
        404
      );
    }

    // Check if new name conflicts with existing tag
    if (body.name && body.name.trim() !== existingTag.name) {
      const duplicate = await db
        .prepare('SELECT * FROM tags WHERE user_id = ? AND name = ? AND id != ?')
        .bind(user.id, body.name.trim(), tagId)
        .first<Tag>();

      if (duplicate) {
        return c.json<ApiResponse>(
          {
            success: false,
            error: 'Tag with this name already exists',
          },
          409
        );
      }
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      params.push(body.name.trim());
    }
    if (body.color !== undefined) {
      updates.push('color = ?');
      params.push(body.color);
    }

    if (updates.length === 0) {
      return c.json<ApiResponse<Tag>>({
        success: true,
        data: existingTag,
        message: 'No changes to update',
      });
    }

    params.push(tagId, user.id);
    const query = `UPDATE tags SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    await db.prepare(query).bind(...params).run();

    // Fetch updated tag
    const tag = await db
      .prepare('SELECT * FROM tags WHERE id = ?')
      .bind(tagId)
      .first<Tag>();

    return c.json<ApiResponse<Tag>>({
      success: true,
      data: tag!,
      message: 'Tag updated successfully',
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to update tag',
      },
      500
    );
  }
});

/**
 * DELETE /tags/:id
 * Delete tag
 */
tags.delete('/:id', async (c) => {
  const user = c.get('user') as User;
  const db = c.env.DataBase;
  const tagId = parseInt(c.req.param('id'));

  try {
    // Check if tag exists and belongs to user
    const tag = await db
      .prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?')
      .bind(tagId, user.id)
      .first<Tag>();

    if (!tag) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Tag not found',
        },
        404
      );
    }

    // Delete tag (CASCADE will remove task_tags entries)
    await db.prepare('DELETE FROM tags WHERE id = ?').bind(tagId).run();

    return c.json<ApiResponse>({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to delete tag',
      },
      500
    );
  }
});

export default tags;

