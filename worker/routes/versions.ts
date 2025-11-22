import { Hono } from 'hono';
import type { 
  Bindings, 
  AppVersion, 
  CreateVersionRequest, 
  UpdateVersionRequest,
  ApiResponse 
} from '../types';

const versions = new Hono<{ Bindings: Bindings }>();

// GET /version - Get current active version
versions.get('/version', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM app_versions WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).first<AppVersion>();

    return c.json<ApiResponse<AppVersion | null>>({
      success: true,
      data: result,
    });
  } catch (error) {
    return c.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// GET /versions - Get all versions
versions.get('/versions', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM app_versions ORDER BY created_at DESC'
    ).all<AppVersion>();

    return c.json<ApiResponse<AppVersion[]>>({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    return c.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// GET /version/:id - Get version by ID
versions.get('/version/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    const result = await c.env.DB.prepare(
      'SELECT * FROM app_versions WHERE id = ?'
    )
      .bind(id)
      .first<AppVersion>();

    if (!result) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Version not found',
        },
        404
      );
    }

    return c.json<ApiResponse<AppVersion>>({
      success: true,
      data: result,
    });
  } catch (error) {
    return c.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// POST /version - Create new version
versions.post('/version', async (c) => {
  try {
    const body = await c.req.json<CreateVersionRequest>();

    if (!body.version) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Version is required',
        },
        400
      );
    }

    // If new version is active, deactivate all others
    if (body.is_active) {
      await c.env.DB.prepare(
        'UPDATE app_versions SET is_active = 0'
      ).run();
    }

    const result = await c.env.DB.prepare(
      'INSERT INTO app_versions (version, release_date, description, is_active) VALUES (?, datetime("now"), ?, ?)'
    )
      .bind(
        body.version,
        body.description || null,
        body.is_active ? 1 : 0
      )
      .run();

    // Get the created record
    const newVersion = await c.env.DB.prepare(
      'SELECT * FROM app_versions WHERE id = ?'
    )
      .bind(result.meta.last_row_id)
      .first<AppVersion>();

    return c.json<ApiResponse<AppVersion | null>>(
      {
        success: true,
        data: newVersion,
        message: 'Version created successfully',
      },
      201
    );
  } catch (error) {
    return c.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// PUT /version/:id - Update version
versions.put('/version/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json<UpdateVersionRequest>();

    // Check if version exists
    const existing = await c.env.DB.prepare(
      'SELECT * FROM app_versions WHERE id = ?'
    )
      .bind(id)
      .first<AppVersion>();

    if (!existing) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Version not found',
        },
        404
      );
    }

    // If making version active, deactivate others
    if (body.is_active) {
      await c.env.DB.prepare(
        'UPDATE app_versions SET is_active = 0 WHERE id != ?'
      )
        .bind(id)
        .run();
    }

    // Update version
    await c.env.DB.prepare(
      'UPDATE app_versions SET version = COALESCE(?, version), description = COALESCE(?, description), is_active = COALESCE(?, is_active), updated_at = datetime("now") WHERE id = ?'
    )
      .bind(
        body.version || null,
        body.description || null,
        body.is_active !== undefined ? (body.is_active ? 1 : 0) : null,
        id
      )
      .run();

    // Get updated record
    const updated = await c.env.DB.prepare(
      'SELECT * FROM app_versions WHERE id = ?'
    )
      .bind(id)
      .first<AppVersion>();

    return c.json<ApiResponse<AppVersion | null>>({
      success: true,
      data: updated,
      message: 'Version updated successfully',
    });
  } catch (error) {
    return c.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// DELETE /version/:id - Delete version
versions.delete('/version/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));

    // Check if version exists
    const existing = await c.env.DB.prepare(
      'SELECT * FROM app_versions WHERE id = ?'
    )
      .bind(id)
      .first<AppVersion>();

    if (!existing) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: 'Version not found',
        },
        404
      );
    }

    // Delete version
    await c.env.DB.prepare('DELETE FROM app_versions WHERE id = ?')
      .bind(id)
      .run();

    return c.json<ApiResponse>({
      success: true,
      message: 'Version deleted successfully',
    });
  } catch (error) {
    return c.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default versions;
