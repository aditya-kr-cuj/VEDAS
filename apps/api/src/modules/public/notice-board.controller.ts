import type { Request, Response } from 'express';
import { query } from '../../db/client.js';
import { listUpcomingEvents } from '../calendar/calendar.repository.js';

// ── GET /public/notice-board/:tenantId ──────────────────────────
export async function noticeBoardHandler(req: Request, res: Response): Promise<void> {
  const { tenantId } = req.params;

  // Verify tenant exists
  const tenants = await query<{ id: string; name: string }>(
    `SELECT id, name FROM tenants WHERE id = $1`,
    [tenantId]
  );
  if (tenants.length === 0) {
    res.status(404).json({ message: 'Institute not found' });
    return;
  }

  // Get latest announcements (non-expired, high priority first)
  const announcements = await query(
    `
      SELECT id, title, message, announcement_type, priority, is_pinned, created_at
      FROM announcements
      WHERE tenant_id = $1
        AND (expires_at IS NULL OR expires_at >= NOW())
      ORDER BY is_pinned DESC, priority DESC, created_at DESC
      LIMIT 20
    `,
    [tenantId]
  );

  // Get upcoming events
  const events = await listUpcomingEvents(tenantId, 20);

  res.status(200).json({
    institute: tenants[0].name,
    announcements,
    events,
    generatedAt: new Date().toISOString()
  });
}
