/**
 * Wishlist + Notifications API Routes
 * Mounts on /api in app.ts
 */
import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { neon } from '@neondatabase/serverless';
import { authenticate, AuthRequest } from './middleware';
import { logger } from './logger';

let _sql: ReturnType<typeof neon> | null = null;
async function sql<T = any>(query: string, params?: any[]): Promise<T[]> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    _sql = neon(url);
  }
  return (await _sql.query(query, params || [])) as T[];
}

const router = Router();

// ══════════════════════════════════════════════
//  WISHLIST
// ══════════════════════════════════════════════

router.get('/wishlist', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql(
      `SELECT w.*, p.name, p.slug, p.price, p.images, p.tier, p.sizes, p.colors, p.brand, p.in_stock
       FROM public.wishlists w
       JOIN public.products p ON w.product_id = p.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.userId!]
    );
    // Parse arrays
    const data = rows.map((r: any) => ({
      ...r,
      images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images,
      sizes: typeof r.sizes === 'string' ? JSON.parse(r.sizes) : r.sizes,
      colors: typeof r.colors === 'string' ? JSON.parse(r.colors) : r.colors,
    }));
    res.json({ success: true, data });
  } catch (err: any) {
    logger.error('Failed to fetch wishlist', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to fetch wishlist' });
  }
});

router.post('/wishlist', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, error: 'Product ID required' });

    // Check if already exists
    const existing = await sql('SELECT id FROM public.wishlists WHERE user_id = $1 AND product_id = $2', [req.userId!, productId]);
    if (existing[0]) return res.status(409).json({ success: false, error: 'Already in wishlist' });

    const id = uuidv4();
    await sql(
      'INSERT INTO public.wishlists (id, user_id, product_id, created_at) VALUES ($1, $2, $3, now())',
      [id, req.userId!, productId]
    );
    res.status(201).json({ success: true, data: { id, product_id: productId } });
  } catch (err: any) {
    logger.error('Failed to add to wishlist', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to add to wishlist' });
  }
});

router.delete('/wishlist/:productId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await sql('DELETE FROM public.wishlists WHERE user_id = $1 AND product_id = $2', [req.userId!, req.params.productId]);
    res.json({ success: true });
  } catch (err: any) {
    logger.error('Failed to remove from wishlist', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to remove from wishlist' });
  }
});

// ══════════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════════

router.get('/notifications', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql(
      'SELECT * FROM public.notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.userId!]
    );
    res.json({ success: true, data: rows });
  } catch (err: any) {
    logger.error('Failed to fetch notifications', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

router.get('/notifications/unread-count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql(
      'SELECT COUNT(*)::int as count FROM public.notifications WHERE user_id = $1 AND read = false',
      [req.userId!]
    );
    res.json({ success: true, data: { count: rows[0]?.count || 0 } });
  } catch (err: any) {
    logger.error('Failed to count notifications', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to count notifications' });
  }
});

router.put('/notifications/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await sql('UPDATE public.notifications SET read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.userId!]);
    res.json({ success: true });
  } catch (err: any) {
    logger.error('Failed to mark notification read', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to mark notification' });
  }
});

router.put('/notifications/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await sql('UPDATE public.notifications SET read = true WHERE user_id = $1 AND read = false', [req.userId!]);
    res.json({ success: true });
  } catch (err: any) {
    logger.error('Failed to mark all read', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to mark all read' });
  }
});

// Helper: Create notification (used by other routes)
export async function createNotification(userId: string, type: string, title: string, message: string, data?: any) {
  try {
    await sql(
      'INSERT INTO public.notifications (id, user_id, type, title, message, data, created_at) VALUES ($1, $2, $3, $4, $5, $6, now())',
      [uuidv4(), userId, type, title, message, data ? JSON.stringify(data) : null]
    );
  } catch (err) {
    logger.error('Failed to create notification', { error: err });
  }
}

// ══════════════════════════════════════════════
//  MONTHLY BOX (recurring selection)
// ══════════════════════════════════════════════

router.get('/monthly-box/current', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Get current month's box
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const rows = await sql(
      `SELECT mb.*, sp.name as plan_name, sp.price as plan_price, sp.item_count_min, sp.item_count_max
       FROM public.monthly_boxes mb
       JOIN public.subscriptions s ON mb.subscription_id = s.id
       JOIN public.subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = $1 AND mb.month >= $2 AND mb.month <= $3
       ORDER BY mb.created_at DESC LIMIT 1`,
      [req.userId!, monthStart, monthEnd]
    );

    if (rows[0]) {
      const box = rows[0];
      box.items = typeof box.items === 'string' ? JSON.parse(box.items) : box.items;
      return res.json({ success: true, data: box });
    }

    // Check if user has active subscription
    const subs = await sql(
      `SELECT s.*, sp.name as plan_name, sp.price as plan_price, sp.item_count_min, sp.item_count_max
       FROM public.subscriptions s
       JOIN public.subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = $1 AND s.status = 'active'`,
      [req.userId!]
    );

    if (!subs[0]) {
      return res.json({ success: true, data: null });
    }

    // Create empty box for this month
    const sub = subs[0];
    const boxId = uuidv4();
    await sql(
      `INSERT INTO public.monthly_boxes (id, subscription_id, user_id, month, items, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, '[]', 'building', now(), now())`,
      [boxId, sub.id, req.userId!, now.toISOString()]
    );

    res.json({
      success: true,
      data: {
        id: boxId,
        subscription_id: sub.id,
        plan_name: sub.plan_name,
        plan_price: Number(sub.price),
        item_count_min: sub.item_count_min,
        item_count_max: sub.item_count_max,
        items: [],
        status: 'building',
        month: now.toISOString(),
      }
    });
  } catch (err: any) {
    logger.error('Failed to get current box', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to get current box' });
  }
});

router.put('/monthly-box/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ success: false, error: 'Items must be an array' });

    await sql(
      'UPDATE public.monthly_boxes SET items = $1, updated_at = now() WHERE id = $2 AND user_id = $3',
      [JSON.stringify(items), req.params.id, req.userId!]
    );
    res.json({ success: true });
  } catch (err: any) {
    logger.error('Failed to update box', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to update box' });
  }
});

router.post('/monthly-box/:id/confirm', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await sql(
      "UPDATE public.monthly_boxes SET status = 'confirmed', updated_at = now() WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId!]
    );

    // Create notification
    await createNotification(req.userId!, 'box_confirmed', 'Box Confirmed!', 'Your monthly box has been confirmed and is being prepared.');

    res.json({ success: true });
  } catch (err: any) {
    logger.error('Failed to confirm box', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to confirm box' });
  }
});

// ══════════════════════════════════════════════
//  ADMIN: Notifications
// ══════════════════════════════════════════════

router.post('/admin/notifications/send', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, type, title, message } = req.body;
    if (!userId || !title || !message) {
      return res.status(400).json({ success: false, error: 'userId, title, and message required' });
    }
    await createNotification(userId, type || 'admin', title, message);
    res.json({ success: true });
  } catch (err: any) {
    logger.error('Failed to send notification', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

router.post('/admin/notifications/broadcast', async (req: AuthRequest, res: Response) => {
  try {
    const { type, title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'title and message required' });
    }
    // Get all active subscribers
    const subs = await sql("SELECT DISTINCT user_id FROM public.subscriptions WHERE status = 'active'");
    let sent = 0;
    for (const sub of subs) {
      await createNotification(sub.user_id, type || 'announcement', title, message);
      sent++;
    }
    res.json({ success: true, data: { sent } });
  } catch (err: any) {
    logger.error('Failed to broadcast', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to broadcast' });
  }
});

// ══════════════════════════════════════════════
//  Admin shortcuts used by the admin CMS panel
// ══════════════════════════════════════════════

router.post('/notifications', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, type, target_user_id } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'title and message required' });
    }
    if (target_user_id) {
      await createNotification(target_user_id, type || 'admin', title, message);
      return res.json({ success: true });
    }
    const subs = await sql("SELECT DISTINCT user_id FROM public.subscriptions WHERE status = 'active'");
    let sent = 0;
    for (const sub of subs) {
      await createNotification(sub.user_id, type || 'announcement', title, message);
      sent++;
    }
    if (sent === 0) {
      await createNotification(req.userId!, type || 'admin', title, message);
      sent = 1;
    }
    res.json({ success: true, data: { sent } });
  } catch (err: any) {
    logger.error('Failed to send notification', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

router.get('/monthly-box', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql(
      `SELECT mb.*, u.email as user_email
       FROM public.monthly_boxes mb
       LEFT JOIN public.profiles u ON mb.user_id = u.id
       ORDER BY mb.created_at DESC LIMIT 100`
    );
    for (const row of rows) {
      row.items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
    }
    res.json({ success: true, data: rows });
  } catch (err: any) {
    logger.error('Failed to fetch monthly boxes', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to fetch monthly boxes' });
  }
});

export default router;
